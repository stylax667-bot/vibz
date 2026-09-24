-- ══════════════════════════════════════════════════════════════════
--  Vibz — Avatars carrés contrôlés
--  À coller dans Supabase > SQL Editor puis « Run ».
--  Le script est rejouable sans risque (IF NOT EXISTS / DROP IF EXISTS).
--
--  L'avatar n'est plus modifiable depuis le navigateur : seule l'API
--  /api/avatar (clé service_role, variable SUPABASE_SERVICE_ROLE_KEY sur
--  Vercel) l'enregistre, après avoir vérifié que l'image n'est pas explicite.
-- ══════════════════════════════════════════════════════════════════


-- ── 1. Colonnes ──────────────────────────────────────────────────────
alter table public.profiles add column if not exists avatar_emoji        text;
alter table public.profiles add column if not exists avatar_locked_until timestamptz;
alter table public.profiles add column if not exists avatar_strikes      int not null default 0;


-- ── 2. Un membre ne peut ni changer son avatar ni lever le verrou ────
create or replace function public.protect_avatar_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.avatar_url          := null;
      new.avatar_emoji        := null;
      new.avatar_locked_until := null;
      new.avatar_strikes      := 0;
    else
      new.avatar_url          := old.avatar_url;
      new.avatar_emoji        := old.avatar_emoji;
      new.avatar_locked_until := old.avatar_locked_until;
      new.avatar_strikes      := old.avatar_strikes;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_avatar_fields on public.profiles;
create trigger protect_avatar_fields
  before insert or update on public.profiles
  for each row execute procedure public.protect_avatar_fields();


-- ── 3. Bucket « avatars » : public en lecture, écriture réservée à l'API ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 307200, array['image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 307200, allowed_mime_types = array['image/jpeg'];

-- Supprime les anciennes règles qui laissaient les membres déposer
-- directement leurs fichiers dans le bucket (contournement du contrôle).
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%avatars%'
  loop
    begin
      execute format('drop policy %I on storage.objects', pol.policyname);
      raise notice 'Règle supprimée : %', pol.policyname;
    exception when insufficient_privilege then
      raise notice 'Impossible de supprimer « % » : supprime-la dans Storage > Policies.', pol.policyname;
    end;
  end loop;
end $$;
