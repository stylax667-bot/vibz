-- ══════════════════════════════════════════════════════════════════
--  Vibz — VibzGuard prévient la victime : bloquer ou continuer
--  À coller dans Supabase > SQL Editor puis « Run ». Rejouable sans risque.
--  Nécessite 20260928_vibzguard_serveur.sql.
--
--  Quand VibzGuard bloque en messagerie privée un message grave (menace,
--  harcèlement, haine, sollicitation sexuelle, incitation, emprise,
--  arnaque), le destinataire reçoit une alerte unique : il ne voit pas le
--  message, mais choisit de bloquer définitivement l'auteur ou de
--  continuer. Tant qu'il n'a pas répondu, les blocages suivants du même
--  auteur s'ajoutent à la même alerte au lieu d'en créer de nouvelles.
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.vibzguard_alerts (
  id              bigserial primary key,
  recipient_id    uuid not null references public.profiles(id) on delete cascade,
  offender_id     uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid,
  category        text not null,
  hits            int not null default 1,
  decision        text check (decision in ('block', 'continue')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz
);
-- Une seule alerte ouverte par couple victime / auteur
create unique index if not exists vibzguard_alerts_open_uniq
  on public.vibzguard_alerts (recipient_id, offender_id) where resolved_at is null;

alter table public.vibzguard_alerts enable row level security;
drop policy if exists "vibzguard_alerts_own" on public.vibzguard_alerts;
create policy "vibzguard_alerts_own" on public.vibzguard_alerts
  for select to authenticated using (recipient_id = auth.uid());
-- Pas d'écriture directe : création par le déclencheur, réponse par resolve_guard_alert().

-- ── Création de l'alerte à chaque blocage grave en privé ─────────────
create or replace function public.vibzguard_alert_victim()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_recipient uuid;
begin
  if new.context <> 'dm' or new.action <> 'block' or new.user_id is null or new.target_id is null
     or new.category not in ('menace', 'incitation', 'haine', 'sexuel', 'emprise', 'harcelement', 'arnaque') then
    return new;
  end if;

  select case when c.user1 = new.user_id then c.user2 else c.user1 end into v_recipient
    from public.conversations c
   where c.id = new.target_id and new.user_id in (c.user1, c.user2);
  if v_recipient is null then return new; end if;

  -- Déjà bloqué par la victime : inutile de la déranger
  if exists (select 1 from public.blocks where blocker_id = v_recipient and blocked_id = new.user_id) then
    return new;
  end if;

  insert into public.vibzguard_alerts (recipient_id, offender_id, conversation_id, category)
  values (v_recipient, new.user_id, new.target_id, new.category)
  on conflict (recipient_id, offender_id) where resolved_at is null
  do update set hits = public.vibzguard_alerts.hits + 1,
                category = excluded.category,
                updated_at = now();
  return new;
end $$;

drop trigger if exists vibzguard_alert_victim on public.vibzguard_log;
create trigger vibzguard_alert_victim after insert on public.vibzguard_log
  for each row execute function public.vibzguard_alert_victim();

-- ── Réponse de la victime ────────────────────────────────────────────
create or replace function public.resolve_guard_alert(p_id bigint, p_block boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a public.vibzguard_alerts;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into a from public.vibzguard_alerts
   where id = p_id and recipient_id = auth.uid() and resolved_at is null
   for update;
  if not found then return; end if;   -- déjà traitée

  update public.vibzguard_alerts
     set resolved_at = now(), decision = case when p_block then 'block' else 'continue' end
   where id = p_id;

  if p_block and not exists (select 1 from public.blocks where blocker_id = a.recipient_id and blocked_id = a.offender_id) then
    insert into public.blocks (blocker_id, blocked_id) values (a.recipient_id, a.offender_id);
  end if;
end $$;
revoke execute on function public.resolve_guard_alert(bigint, boolean) from public, anon;
grant execute on function public.resolve_guard_alert(bigint, boolean) to authenticated;

-- ── Temps réel : l'alerte s'affiche sans recharger la page ───────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vibzguard_alerts'
  ) then
    alter publication supabase_realtime add table public.vibzguard_alerts;
  end if;
end $$;
