-- ══════════════════════════════════════════════════════════════════
--  Vibz — Données réelles : messagerie, blocage, salons, cagnotte Ko-fi
--  À coller dans Supabase > SQL Editor puis « Run ».
--  Le script est rejouable sans risque (IF NOT EXISTS / DROP IF EXISTS).
-- ══════════════════════════════════════════════════════════════════


-- ── 1. Sécurité des profils ──────────────────────────────────────────
-- Un membre ne doit pas pouvoir se débannir ou se marquer « vérifié »
-- lui-même en modifiant son profil.
create or replace function public.protect_profile_flags()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_banned   := false;
      new.is_verified := false;
    else
      new.is_banned   := old.is_banned;
      new.ban_reason  := old.ban_reason;
      new.is_verified := old.is_verified;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_flags on public.profiles;
create trigger protect_profile_flags
  before insert or update on public.profiles
  for each row execute procedure public.protect_profile_flags();


-- ── 2. Blocages ──────────────────────────────────────────────────────
alter table public.blocks enable row level security;

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks
  for select using (auth.uid() = blocker_id);

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own" on public.blocks
  for insert with check (auth.uid() = blocker_id and blocker_id <> blocked_id);

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- Liste des membres qui m'ont bloqué (sans révéler autre chose)
create or replace function public.blocked_me()
returns setof uuid language sql stable security definer set search_path = public as $$
  select blocker_id from public.blocks where blocked_id = auth.uid()
$$;
grant execute on function public.blocked_me() to authenticated;


-- ── 3. Matchs & conversations ────────────────────────────────────────
alter table public.matches enable row level security;
drop policy if exists "matches_select_own" on public.matches;
create policy "matches_select_own" on public.matches
  for select using (auth.uid() in (user1, user2));

alter table public.conversations enable row level security;
drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() in (user1, user2));

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() in (user1, user2) and user1 < user2);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() in (user1, user2));

-- Envoi de message : uniquement dans ses conversations, et pas si le
-- destinataire nous a bloqué.
drop policy if exists "Envoyer un message" on public.messages;
create policy "Envoyer un message" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user1, c.user2)
        and not exists (
          select 1 from public.blocked_me() b(id)
          where b.id = case when c.user1 = auth.uid() then c.user2 else c.user1 end
        )
    )
  );

-- Marquer comme lus les messages reçus
drop policy if exists "messages_mark_read" on public.messages;
create policy "messages_mark_read" on public.messages
  for update using (
    auth.uid() in (
      select user1 from public.conversations where id = conversation_id
      union
      select user2 from public.conversations where id = conversation_id
    )
  );


-- ── 4. Salons créés par les membres ──────────────────────────────────
alter table public.salons add column if not exists combo_key   text;
alter table public.salons add column if not exists tags        text[] not null default '{}';
alter table public.salons add column if not exists is_official boolean not null default false;
alter table public.salons add column if not exists color       text;
alter table public.salons add column if not exists closed_at   timestamptz;
create unique index if not exists salons_combo_key_idx on public.salons (combo_key);

-- Ouvre (ou rouvre) un salon :
--  • clé « cat-<n> »  → salon officiel du catalogue Vibz, jamais fermable
--  • clé « mix-… »    → salon d'une combinaison styles/instruments ; une seule
--    salle par combinaison : si elle existe déjà on la rejoint.
create or replace function public.open_salon(
  p_key   text,
  p_name  text,
  p_icon  text   default '🎛️',
  p_tags  text[] default '{}',
  p_color text   default null
) returns public.salons
language plpgsql security definer set search_path = public as $$
declare
  s        public.salons;
  official boolean := p_key ~ '^cat-[0-9]+$';
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if not official and p_key !~ '^mix-[a-z0-9_+]+$' then raise exception 'Clé de salon invalide'; end if;
  if not official and coalesce(array_length(p_tags, 1), 0) = 0 then raise exception 'Sélection vide'; end if;

  select * into s from public.salons where combo_key = p_key;
  if found then
    if not s.is_active then
      update public.salons
         set is_active  = true,
             closed_at  = null,
             name       = left(coalesce(nullif(trim(p_name), ''), s.name), 80),
             created_by = case when official then null else auth.uid() end
       where id = s.id
      returning * into s;
    end if;
    return s;
  end if;

  insert into public.salons (name, slug, icon, category, combo_key, tags, is_official, color, created_by)
  values (left(trim(p_name), 80), p_key, coalesce(p_icon, '🎛️'), 'musique', p_key, p_tags, official, p_color,
          case when official then null else auth.uid() end)
  returning * into s;
  return s;
end $$;
grant execute on function public.open_salon(text, text, text, text[], text) to authenticated;

-- Ferme un salon : réservé à son créateur ; les messages sont effacés.
create or replace function public.close_salon(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.salons
     set is_active = false, closed_at = now()
   where id = p_id and created_by = auth.uid() and not is_official;
  if not found then raise exception 'Seul le créateur peut fermer ce salon'; end if;
  update public.salon_messages set is_deleted = true where salon_id = p_id;
end $$;
grant execute on function public.close_salon(uuid) to authenticated;

-- Messages de salon : uniquement dans un salon ouvert
drop policy if exists "Envoyer dans un salon" on public.salon_messages;
create policy "Envoyer dans un salon" on public.salon_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (select 1 from public.salons where id = salon_id and is_active)
  );


-- ── 5. Cagnotte Ko-fi (dons réels uniquement) ────────────────────────
alter table public.project_finances add column if not exists kofi_connected boolean not null default false;

create table if not exists public.donations (
  id                  uuid primary key default gen_random_uuid(),
  kofi_transaction_id text unique not null,
  amount              numeric(10,2) not null,
  currency            text not null default 'EUR',
  type                text,
  received_at         timestamptz not null default now()
);
-- Aucune lecture directe : seuls les totaux sont publics (fonction ci-dessous)
alter table public.donations enable row level security;

create or replace function public.kofi_totals()
returns table (month_total numeric, all_time_total numeric, donations_count bigint, last_donation_at timestamptz)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(amount) filter (where received_at >= date_trunc('month', now())), 0),
    coalesce(sum(amount), 0),
    count(*),
    max(received_at)
  from public.donations
  where currency = 'EUR'
$$;
grant execute on function public.kofi_totals() to anon, authenticated;


-- ── 6. Temps réel ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['messages', 'salon_messages', 'salons', 'blocks'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
