-- ═══════════════════════════════════════════════════════════════════════
-- Onglet Troc + photos partagées dans les tchats et salons (avec consentement)
-- À passer dans Supabase → SQL Editor AVANT de pousser le code,
-- APRÈS la migration de TrocMusic (TrocMusic/supabase/migrations/20261111_trocmusic.sql).
--
-- Principe du consentement :
--  • l'auteur prend la photo (le navigateur demande l'accès à l'appareil photo) ;
--  • la photo est stockée dans un bucket PRIVÉ : personne d'autre ne peut la voir ;
--  • chaque destinataire voit « X veut te montrer une photo » et choisit Voir / Non merci ;
--    ce n'est qu'après « Voir » que le stockage lui donne accès au fichier ;
--  • l'auteur seul peut transformer sa photo en annonce publique (TrocMusic).
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Partages ─────────────────────────────────────────────────────────
create table if not exists public.photo_shares (
  id              uuid primary key default gen_random_uuid(),
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  salon_id        uuid references public.salons(id) on delete cascade,
  path            text not null unique,                 -- chemin dans le bucket chat-photos : <uid>/<fichier>.jpg
  caption         text check (char_length(caption) <= 200),
  is_troc         boolean not null default false,       -- « c'est du matos à troquer / vendre »
  listing_id      uuid references public.troc_listings(id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint photo_share_target check ((conversation_id is null) <> (salon_id is null))
);
create index if not exists photo_shares_conv  on public.photo_shares (conversation_id, created_at);
create index if not exists photo_shares_salon on public.photo_shares (salon_id, created_at);

-- Le membre connecté participe-t-il à l'endroit du partage ?
create or replace function public.can_see_photo_share(p_conv uuid, p_salon uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_conv is not null then exists (
      select 1 from public.conversations c
       where c.id = p_conv and auth.uid() in (c.user1, c.user2))
    else public.is_salon_member(p_salon)
  end
$$;
grant execute on function public.can_see_photo_share(uuid, uuid) to authenticated;

alter table public.photo_shares enable row level security;

drop policy if exists photo_shares_read on public.photo_shares;
create policy photo_shares_read on public.photo_shares for select to authenticated
  using (sender_id = auth.uid() or public.can_see_photo_share(conversation_id, salon_id));

drop policy if exists photo_shares_insert on public.photo_shares;
create policy photo_shares_insert on public.photo_shares for insert to authenticated
  with check (
    sender_id = auth.uid()
    and split_part(path, '/', 1) = auth.uid()::text
    and public.can_see_photo_share(conversation_id, salon_id)
    -- en privé : pas d'envoi à quelqu'un qui m'a bloqué (ou que j'ai bloqué)
    and (conversation_id is null or not exists (
      select 1 from public.conversations c
        join public.blocks b on (b.blocker_id = c.user1 and b.blocked_id = c.user2)
                             or (b.blocker_id = c.user2 and b.blocked_id = c.user1)
       where c.id = conversation_id))
    and (salon_id is null or exists (select 1 from public.salons s where s.id = salon_id and s.is_active))
  );

-- Seul l'auteur modifie (rattacher l'annonce créée) ou retire sa photo
drop policy if exists photo_shares_update on public.photo_shares;
create policy photo_shares_update on public.photo_shares for update to authenticated
  using (sender_id = auth.uid()) with check (sender_id = auth.uid());

drop policy if exists photo_shares_delete on public.photo_shares;
create policy photo_shares_delete on public.photo_shares for delete to authenticated
  using (sender_id = auth.uid());

-- Légende passée au crible VibzGuard ; l'auteur ne change ni la photo ni le lieu
create or replace function public.photo_share_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v record;
begin
  if tg_op = 'UPDATE' then
    new.sender_id := old.sender_id; new.path := old.path;
    new.conversation_id := old.conversation_id; new.salon_id := old.salon_id;
    new.created_at := old.created_at;
  end if;
  if new.caption is not null and btrim(new.caption) <> '' then
    select * into v from public.vibzguard_check(new.caption, case when new.salon_id is null then 'dm' else 'salon' end);
    if v.action = 'block' then
      raise exception 'VIBZGUARD_BLOCK: %', coalesce(v.reason, 'légende refusée') using errcode = 'P0001';
    end if;
  end if;
  -- Anti-flood : 20 photos par heure
  if tg_op = 'INSERT' and (select count(*) from public.photo_shares
       where sender_id = new.sender_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'PHOTO_FLOOD: 20 photos par heure maximum' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists photo_share_guard on public.photo_shares;
create trigger photo_share_guard before insert or update on public.photo_shares
  for each row execute function public.photo_share_guard();

-- ── 2. Consentements (un par destinataire) ──────────────────────────────
create table if not exists public.photo_share_consents (
  share_id   uuid not null references public.photo_shares(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  decision   text not null check (decision in ('accepted','declined')),
  decided_at timestamptz not null default now(),
  primary key (share_id, user_id)
);
alter table public.photo_share_consents enable row level security;

-- Je décide pour moi, sur un partage que je peux voir et qui n'est pas le mien
drop policy if exists psc_write on public.photo_share_consents;
create policy psc_write on public.photo_share_consents for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.photo_shares s where s.id = share_id and s.sender_id <> auth.uid()
      and public.can_see_photo_share(s.conversation_id, s.salon_id)));

drop policy if exists psc_change on public.photo_share_consents;
create policy psc_change on public.photo_share_consents for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Je vois mes décisions ; l'auteur voit qui a accepté ou refusé
drop policy if exists psc_read on public.photo_share_consents;
create policy psc_read on public.photo_share_consents for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.photo_shares s where s.id = share_id and s.sender_id = auth.uid()));

-- ── 3. Stockage privé ───────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-photos', 'chat-photos', false, 3145728, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg'];

drop policy if exists chat_photos_insert on storage.objects;
create policy chat_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists chat_photos_delete on storage.objects;
create policy chat_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'chat-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Lecture : l'auteur, ou un destinataire qui a dit « Voir » (et participe toujours)
drop policy if exists chat_photos_read on storage.objects;
create policy chat_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'chat-photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.photo_shares s
        join public.photo_share_consents c on c.share_id = s.id
       where s.path = name and c.user_id = auth.uid() and c.decision = 'accepted'
         and public.can_see_photo_share(s.conversation_id, s.salon_id))
  ));

-- ── 4. Salon fermé → ses photos partent avec ses messages ───────────────
create or replace function public.photo_shares_on_salon_close()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_active and not new.is_active then
    delete from public.photo_shares where salon_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists photo_shares_on_salon_close on public.salons;
create trigger photo_shares_on_salon_close after update of is_active on public.salons
  for each row execute function public.photo_shares_on_salon_close();

-- ── 5. Temps réel ───────────────────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table public.photo_shares;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.photo_share_consents;
exception when duplicate_object then null; end $$;
