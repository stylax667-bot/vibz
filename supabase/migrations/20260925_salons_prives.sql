-- ══════════════════════════════════════════════════════════════════
--  Vibz — Salons créés par les membres : liste visible, contenu privé
--  À coller dans Supabase > SQL Editor puis « Run ».
--  Le script est rejouable sans risque.
--
--  • Plus de salons officiels ni de forum : seuls existent les salons
--    ouverts par les membres à partir d'ingrédients (styles, instruments).
--  • Tout le monde voit la liste ; seuls les membres lisent et écrivent.
--  • 16 membres maximum, +4 places par vote d'un quart des membres (24 max).
--  • Privatisation en deux temps : vote « privatiser », puis verrouillage
--    avec choix des participants ; ensuite on entre sur demande.
--  • Un membre qui n'a plus donné signe de vie depuis 15 min quitte le
--    salon ; un salon sans membre est fermé et ses messages effacés.
-- ══════════════════════════════════════════════════════════════════


-- ── 1. Structure ─────────────────────────────────────────────────────
alter table public.salons add column if not exists parent_id     uuid references public.salons(id) on delete set null;
alter table public.salons add column if not exists admin_id      uuid references public.profiles(id) on delete set null;
alter table public.salons add column if not exists is_locked     boolean not null default false;
alter table public.salons add column if not exists last_check_at timestamptz not null default now();
alter table public.salons alter column max_members set default 16;

-- Plusieurs salons peuvent porter la même combinaison au fil du temps
-- (annexes, réouvertures) : l'unicité est vérifiée par create_salon().
drop index if exists public.salons_combo_key_idx;
create index if not exists salons_active_key_idx on public.salons (combo_key) where is_active;

create table if not exists public.salon_members (
  salon_id      uuid not null references public.salons(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  joined_at     timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  wants_private boolean not null default false,   -- 1er niveau : « je veux privatiser »
  votes_extend  boolean not null default false,   -- vote pour agrandir le salon
  primary key (salon_id, user_id)
);
create index if not exists salon_members_user_idx on public.salon_members (user_id);

create table if not exists public.salon_join_requests (
  salon_id   uuid not null references public.salons(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (salon_id, user_id)
);


-- ── 2. Droits d'accès ────────────────────────────────────────────────
-- On repart de zéro sur les tables des salons (anciennes règles « publiques »).
do $$
declare pol record;
begin
  for pol in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('salons', 'salon_messages', 'salon_members', 'salon_join_requests')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

alter table public.salons              enable row level security;
alter table public.salon_messages      enable row level security;
alter table public.salon_members       enable row level security;
alter table public.salon_join_requests enable row level security;

-- Liste visible des membres connectés ; toute modification passe par les fonctions
create policy "salons_list" on public.salons
  for select to authenticated using (is_active);

create policy "salon_members_own" on public.salon_members
  for select to authenticated using (user_id = auth.uid());

create policy "salon_requests_own" on public.salon_join_requests
  for select to authenticated using (user_id = auth.uid());

-- Contenu privé : seuls les membres lisent et écrivent
create or replace function public.is_salon_member(p_salon uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.salon_members where salon_id = p_salon and user_id = auth.uid())
$$;
grant execute on function public.is_salon_member(uuid) to authenticated;

create policy "salon_messages_read" on public.salon_messages
  for select to authenticated using (not is_deleted and public.is_salon_member(salon_id));

create policy "salon_messages_write" on public.salon_messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and public.is_salon_member(salon_id)
    and exists (select 1 from public.salons where id = salon_id and is_active)
  );


-- ── 3. Fermeture et nettoyage ────────────────────────────────────────
create or replace function public._close_salon(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.salons set is_active = false, closed_at = now() where id = p_id and is_active;
  delete from public.salon_messages      where salon_id = p_id;
  delete from public.salon_members       where salon_id = p_id;
  delete from public.salon_join_requests where salon_id = p_id;
end $$;
revoke all on function public._close_salon(uuid) from public, anon, authenticated;

create or replace function public._sweep_salons()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  -- Membres partis sans le dire (plus de signe de vie depuis 15 min)
  delete from public.salon_members m
   using public.salons s
   where m.salon_id = s.id and s.is_active and m.last_seen < now() - interval '15 minutes';

  -- Salons vides : fermés
  for r in
    select s.id from public.salons s
    where s.is_active and not exists (select 1 from public.salon_members m where m.salon_id = s.id)
  loop
    perform public._close_salon(r.id);
  end loop;

  -- Admin parti : le membre le plus ancien prend le relais
  update public.salons s
     set admin_id = (select m.user_id from public.salon_members m where m.salon_id = s.id order by m.joined_at limit 1),
         last_check_at = now()
   where s.is_active
     and (s.admin_id is null or not exists (select 1 from public.salon_members m where m.salon_id = s.id and m.user_id = s.admin_id));
end $$;
revoke all on function public._sweep_salons() from public, anon, authenticated;

-- Tous les anciens salons (officiels, catalogue, forum) sont fermés
do $$
declare r record;
begin
  for r in select id from public.salons where is_active loop
    perform public._close_salon(r.id);
  end loop;
end $$;

drop function if exists public.open_salon(text, text, text, text[], text);
drop function if exists public.close_salon(uuid);


-- ── 4. Liste publique des salons ─────────────────────────────────────
create or replace function public.salon_list()
returns table (
  id uuid, name text, icon text, color text, tags text[], parent_id uuid,
  is_locked boolean, created_at timestamptz, admin_name text,
  member_count int, online_count int, max_members int,
  is_member boolean, request_pending boolean, last_message_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  perform public._sweep_salons();
  return query
    select s.id, s.name, s.icon, s.color, s.tags,
           case when p.is_active then s.parent_id end,
           s.is_locked, s.created_at,
           coalesce(a.display_name, a.username),
           (select count(*)::int from public.salon_members m where m.salon_id = s.id),
           (select count(*)::int from public.salon_members m where m.salon_id = s.id and m.last_seen > now() - interval '2 minutes'),
           s.max_members,
           exists (select 1 from public.salon_members m where m.salon_id = s.id and m.user_id = auth.uid()),
           exists (select 1 from public.salon_join_requests r where r.salon_id = s.id and r.user_id = auth.uid()),
           (select max(sm.created_at) from public.salon_messages sm where sm.salon_id = s.id)
      from public.salons s
      left join public.salons   p on p.id = s.parent_id
      left join public.profiles a on a.id = s.admin_id
     where s.is_active
     order by s.created_at desc;
end $$;
grant execute on function public.salon_list() to authenticated;


-- ── 5. État détaillé d'un salon (+ signe de vie du membre) ───────────
create or replace function public.salon_ping(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s        public.salons;
  me       public.salon_members;
  n        int;
  votes_p  int;
  votes_e  int;
  is_ctrl  boolean;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  update public.salon_members set last_seen = now() where salon_id = p_id and user_id = auth.uid();
  perform public._sweep_salons();

  select * into s from public.salons where id = p_id;
  if not found or not s.is_active then return jsonb_build_object('active', false); end if;
  select * into me from public.salon_members where salon_id = p_id and user_id = auth.uid();

  if me.user_id is null then
    return jsonb_build_object(
      'active', true, 'is_member', false, 'is_locked', s.is_locked,
      'request_pending', exists (select 1 from public.salon_join_requests where salon_id = p_id and user_id = auth.uid()));
  end if;

  select count(*), count(*) filter (where wants_private), count(*) filter (where votes_extend)
    into n, votes_p, votes_e
    from public.salon_members where salon_id = p_id;
  is_ctrl := me.wants_private or s.admin_id = auth.uid();

  return jsonb_build_object(
    'active', true, 'is_member', true,
    'id', s.id, 'name', s.name, 'icon', s.icon, 'color', s.color, 'tags', s.tags, 'parent_id', s.parent_id,
    'is_locked', s.is_locked, 'is_admin', s.admin_id = auth.uid(), 'admin_id', s.admin_id,
    'max_members', s.max_members, 'member_count', n,
    'votes_private', votes_p, 'private_needed', n / 2 + 1,
    'votes_extend', votes_e, 'extend_needed', greatest(1, ceil(n / 4.0)::int), 'extend_max', 24,
    'last_check_at', s.last_check_at,
    'me', jsonb_build_object('wants_private', me.wants_private, 'votes_extend', me.votes_extend),
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id,
        'name', coalesce(pr.display_name, pr.username, 'Membre'),
        'avatar_url', pr.avatar_url, 'avatar_emoji', pr.avatar_emoji,
        'online', m.last_seen > now() - interval '2 minutes',
        'wants_private', m.wants_private, 'votes_extend', m.votes_extend,
        'is_admin', m.user_id = s.admin_id
      ) order by m.joined_at), '[]'::jsonb)
      from public.salon_members m join public.profiles pr on pr.id = m.user_id
      where m.salon_id = p_id),
    'requests', case when is_ctrl then (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', r.user_id, 'name', coalesce(pr.display_name, pr.username, 'Membre'),
        'avatar_url', pr.avatar_url, 'avatar_emoji', pr.avatar_emoji
      ) order by r.created_at), '[]'::jsonb)
      from public.salon_join_requests r join public.profiles pr on pr.id = r.user_id
      where r.salon_id = p_id) else '[]'::jsonb end
  );
end $$;
grant execute on function public.salon_ping(uuid) to authenticated;


-- Signe de vie global (toutes les minutes tant que le site est ouvert).
-- Renvoie les salons dont je suis l'admin et qui attendent ma confirmation
-- (« le salon tient toujours ? », toutes les 45 min).
create or replace function public.salon_heartbeat()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  update public.salon_members set last_seen = now() where user_id = auth.uid();
  perform public._sweep_salons();
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name, 'icon', s.icon,
      'member_count', (select count(*) from public.salon_members m where m.salon_id = s.id)
    )), '[]'::jsonb)
    from public.salons s
    where s.is_active and s.admin_id = auth.uid() and s.last_check_at < now() - interval '45 minutes'
  );
end $$;
grant execute on function public.salon_heartbeat() to authenticated;


-- ── 6. Créer, rejoindre, quitter ─────────────────────────────────────
create or replace function public.create_salon(
  p_tags    text[],
  p_name    text,
  p_icon    text    default '🎛️',
  p_color   text    default null,
  p_parent  uuid    default null,
  p_private boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  tags   text[];
  k      text;
  s      public.salons;
  par    public.salons;
  root   uuid := null;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  tags := array(select distinct t from unnest(p_tags) t where t ~ '^[a-z0-9_]{1,40}$' order by 1);
  if coalesce(array_length(tags, 1), 0) = 0 then raise exception 'Choisis au moins un style ou un instrument'; end if;
  if array_length(tags, 1) > 8 then raise exception '8 ingrédients maximum'; end if;
  k := 'mix-' || array_to_string(tags, '+');

  perform pg_advisory_xact_lock(hashtext(k));
  perform public._sweep_salons();

  if p_parent is not null then
    -- Salon annexe : rangé sous le salon principal (un seul niveau)
    select * into par from public.salons where id = p_parent and is_active;
    if not found then raise exception 'Le salon principal est fermé'; end if;
    root := coalesce((select id from public.salons where id = par.parent_id and is_active), par.id);
  else
    select * into s from public.salons where combo_key = k and is_active and parent_id is null limit 1;
    if found then
      return jsonb_build_object('status', 'exists', 'salon_id', s.id, 'name', s.name);
    end if;
  end if;

  insert into public.salons (name, slug, icon, category, combo_key, tags, color, created_by, admin_id,
                             parent_id, is_locked, max_members, is_official, last_check_at)
  values (left(coalesce(nullif(trim(p_name), ''), k), 80), k || '-' || substr(md5(random()::text), 1, 8),
          coalesce(nullif(p_icon, ''), '🎛️'), 'musique', k, tags, p_color, auth.uid(), auth.uid(),
          root, coalesce(p_private, false), 16, false, now())
  returning * into s;

  insert into public.salon_members (salon_id, user_id, wants_private)
  values (s.id, auth.uid(), coalesce(p_private, false));

  return jsonb_build_object('status', 'created', 'salon_id', s.id, 'name', s.name);
end $$;
grant execute on function public.create_salon(text[], text, text, text, uuid, boolean) to authenticated;

create or replace function public.join_salon(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.salons; n int;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  perform public._sweep_salons();
  select * into s from public.salons where id = p_id and is_active for update;
  if not found then return jsonb_build_object('status', 'closed'); end if;
  if exists (select 1 from public.salon_members where salon_id = p_id and user_id = auth.uid()) then
    return jsonb_build_object('status', 'joined');
  end if;
  if s.is_locked then
    insert into public.salon_join_requests (salon_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
    return jsonb_build_object('status', 'requested');
  end if;
  select count(*) into n from public.salon_members where salon_id = p_id;
  if n >= s.max_members then return jsonb_build_object('status', 'full', 'max', s.max_members); end if;
  insert into public.salon_members (salon_id, user_id) values (p_id, auth.uid());
  return jsonb_build_object('status', 'joined');
end $$;
grant execute on function public.join_salon(uuid) to authenticated;

create or replace function public.cancel_join_request(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.salon_join_requests where salon_id = p_id and user_id = auth.uid()
$$;
grant execute on function public.cancel_join_request(uuid) to authenticated;

create or replace function public.leave_salon(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  delete from public.salon_members where salon_id = p_id and user_id = auth.uid();
  perform public._sweep_salons();   -- ferme si vide, transmet l'admin sinon
  return jsonb_build_object('closed', not exists (select 1 from public.salons where id = p_id and is_active));
end $$;
grant execute on function public.leave_salon(uuid) to authenticated;


-- ── 7. Administration du salon ───────────────────────────────────────
-- Réponse à la question « le salon tient toujours ? » (toutes les 45 min)
create or replace function public.salon_keepalive(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.salons set last_check_at = now() where id = p_id and admin_id = auth.uid() and is_active;
  if not found then raise exception 'Réservé à l''admin du salon'; end if;
end $$;
grant execute on function public.salon_keepalive(uuid) to authenticated;

create or replace function public.close_salon(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.salons where id = p_id and admin_id = auth.uid() and is_active) then
    raise exception 'Seul l''admin du salon peut le fermer';
  end if;
  perform public._close_salon(p_id);
end $$;
grant execute on function public.close_salon(uuid) to authenticated;


-- ── 8. Privatisation (2 niveaux) ─────────────────────────────────────
-- Niveau 1 : chaque membre indique s'il veut privatiser (il prend part au contrôle)
create or replace function public.salon_vote_private(p_id uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.salon_members set wants_private = p_on where salon_id = p_id and user_id = auth.uid();
  if not found then raise exception 'Tu n''es pas membre de ce salon'; end if;
end $$;
grant execute on function public.salon_vote_private(uuid, boolean) to authenticated;

-- Niveau 2 : quand la majorité est d'accord, un membre qui a voté choisit les
-- participants et verrouille le salon. Les autres le quittent.
create or replace function public.salon_lock(p_id uuid, p_keep uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare n int; votes int;
begin
  if not exists (select 1 from public.salon_members where salon_id = p_id and user_id = auth.uid() and wants_private) then
    raise exception 'Vote d''abord pour privatiser le salon';
  end if;
  select count(*), count(*) filter (where wants_private) into n, votes from public.salon_members where salon_id = p_id;
  if votes * 2 <= n then raise exception 'La majorité des membres doit être d''accord'; end if;
  if not (auth.uid() = any(p_keep)) then raise exception 'Tu dois faire partie des participants'; end if;

  delete from public.salon_members where salon_id = p_id and not (user_id = any(p_keep));
  update public.salons set is_locked = true where id = p_id and is_active;
  perform public._sweep_salons();   -- l'admin a pu être retiré
end $$;
grant execute on function public.salon_lock(uuid, uuid[]) to authenticated;

create or replace function public.salon_unlock(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.salon_members m join public.salons s on s.id = m.salon_id
    where m.salon_id = p_id and m.user_id = auth.uid() and (m.wants_private or s.admin_id = auth.uid())
  ) then raise exception 'Réservé aux membres qui contrôlent le salon'; end if;
  update public.salons set is_locked = false where id = p_id and is_active;
  delete from public.salon_join_requests where salon_id = p_id;
end $$;
grant execute on function public.salon_unlock(uuid) to authenticated;

-- Demandes d'accès à un salon verrouillé
create or replace function public.salon_answer_request(p_id uuid, p_user uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.salons; n int;
begin
  select * into s from public.salons where id = p_id and is_active for update;
  if not found then raise exception 'Salon fermé'; end if;
  if not exists (select 1 from public.salon_members where salon_id = p_id and user_id = auth.uid()
                 and (wants_private or s.admin_id = auth.uid())) then
    raise exception 'Réservé aux membres qui contrôlent le salon';
  end if;
  delete from public.salon_join_requests where salon_id = p_id and user_id = p_user;
  if not found then return jsonb_build_object('status', 'gone'); end if;
  if not p_accept then return jsonb_build_object('status', 'refused'); end if;
  select count(*) into n from public.salon_members where salon_id = p_id;
  if n >= s.max_members then return jsonb_build_object('status', 'full'); end if;
  insert into public.salon_members (salon_id, user_id) values (p_id, p_user) on conflict do nothing;
  return jsonb_build_object('status', 'accepted');
end $$;
grant execute on function public.salon_answer_request(uuid, uuid, boolean) to authenticated;


-- ── 9. Agrandir le salon (+4 places, 24 max) ─────────────────────────
-- Il suffit qu'un quart des membres vote pour ajouter 4 places.
create or replace function public.salon_vote_extend(p_id uuid, p_on boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.salons; n int; votes int;
begin
  update public.salon_members set votes_extend = p_on where salon_id = p_id and user_id = auth.uid();
  if not found then raise exception 'Tu n''es pas membre de ce salon'; end if;
  select * into s from public.salons where id = p_id and is_active for update;
  select count(*), count(*) filter (where votes_extend) into n, votes from public.salon_members where salon_id = p_id;
  if s.max_members < 24 and votes >= greatest(1, ceil(n / 4.0)::int) then
    update public.salons set max_members = least(24, max_members + 4) where id = p_id;
    update public.salon_members set votes_extend = false where salon_id = p_id;
    return jsonb_build_object('extended', true, 'max_members', least(24, s.max_members + 4));
  end if;
  return jsonb_build_object('extended', false, 'max_members', s.max_members);
end $$;
grant execute on function public.salon_vote_extend(uuid, boolean) to authenticated;


-- ── 10. Temps réel ───────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['salons', 'salon_messages', 'salon_members', 'salon_join_requests'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
