-- Six degrés de séparation
-- Deux sortes de liens publics, et seulement ceux-là :
--   • l'invitation : « X a invité Y » (lien ?ref= suivi d'une inscription)
--   • la Connexion : demandée par l'un, acceptée par l'autre
-- Les matchs, likes, conversations et salons n'entrent JAMAIS dans le graphe.
-- Le graphe n'est pas lisible directement : seules les fonctions ci-dessous
-- l'explorent, depuis le membre connecté, en ignorant les blocages, les bannis
-- et les membres qui ont choisi de ne pas apparaître dans les chaînes.
-- Rejouable sans risque.

-- ── 1. Colonnes du profil ────────────────────────────────────────────
alter table public.profiles add column if not exists invited_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists six_degres_visible boolean not null default true;
create index if not exists profiles_invited_by_idx on public.profiles(invited_by);

-- invited_by ne se modifie que par claim_invite (pas par un update direct)
create or replace function public.protect_invited_by()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.invited_by := null;
    else new.invited_by := old.invited_by;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_invited_by on public.profiles;
create trigger protect_invited_by before insert or update on public.profiles
  for each row execute function public.protect_invited_by();

-- ── 2. Connexions ───────────────────────────────────────────────────
create table if not exists public.connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (requester_id <> addressee_id)
);
create unique index if not exists connections_pair_idx on public.connections
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists connections_addressee_idx on public.connections(addressee_id, status);
create index if not exists connections_requester_idx on public.connections(requester_id, status);

alter table public.connections enable row level security;
drop policy if exists "connections_select_own" on public.connections;
create policy "connections_select_own" on public.connections
  for select using (auth.uid() in (requester_id, addressee_id));
-- Pas de policy insert/update/delete : tout passe par les fonctions.

-- Un blocage coupe la Connexion
create or replace function public.connections_on_block()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.connections
  where (requester_id = new.blocker_id and addressee_id = new.blocked_id)
     or (requester_id = new.blocked_id and addressee_id = new.blocker_id);
  return new;
end $$;
drop trigger if exists connections_on_block on public.blocks;
create trigger connections_on_block after insert on public.blocks
  for each row execute function public.connections_on_block();

-- ── 3. Le graphe (non lisible par les membres) ───────────────────────
create or replace view public.vibz_edges as
  select id as a, invited_by as b, 'invitation'::text as kind from public.profiles where invited_by is not null
  union all
  select invited_by, id, 'invitation' from public.profiles where invited_by is not null
  union all
  select requester_id, addressee_id, 'connexion' from public.connections where status = 'accepted'
  union all
  select addressee_id, requester_id, 'connexion' from public.connections where status = 'accepted';
revoke all on public.vibz_edges from public, anon, authenticated;

-- Parcours en largeur depuis p_src, jusqu'à p_max degrés.
-- Renvoie chaque membre atteint, son degré et le membre par lequel on l'a atteint.
create or replace function public._vibz_bfs(p_src uuid, p_max int default 6)
returns table(node uuid, dist int, parent uuid)
language plpgsql stable security definer set search_path = public as $$
declare
  frontier uuid[] := array[p_src];
  seen     uuid[] := array[p_src];
  excluded uuid[];
  nf uuid[];
  np uuid[];
  d  int := 0;
begin
  -- Réciprocité : qui ne veut pas apparaître dans les chaînes ne les voit pas non plus
  if exists (select 1 from public.profiles where id = p_src and not six_degres_visible) then return; end if;

  select coalesce(array_agg(x), '{}') into excluded from (
    select blocked_id as x from public.blocks where blocker_id = p_src
    union select blocker_id from public.blocks where blocked_id = p_src
    union select id from public.profiles where coalesce(is_banned, false) or not six_degres_visible
  ) s;

  while d < p_max and cardinality(frontier) > 0 loop
    d := d + 1;
    select coalesce(array_agg(n), '{}'), coalesce(array_agg(p), '{}') into nf, np
    from (
      select distinct on (e.b) e.b as n, e.a as p
      from public.vibz_edges e
      where e.a = any(frontier)
        and e.b <> all(seen)
        and e.b <> all(excluded)
      order by e.b, e.a
    ) s;
    exit when cardinality(nf) = 0;
    return query select u.n, d, u.p from unnest(nf, np) as u(n, p);
    seen := seen || nf;
    frontier := nf;
  end loop;
end $$;
revoke all on function public._vibz_bfs(uuid, int) from public, anon, authenticated;

-- ── 4. Fonctions pour les membres ────────────────────────────────────

-- Degré de chaque profil affiché, et le premier maillon de la chaîne
create or replace function public.six_degres_for(p_targets uuid[])
returns table(target uuid, degree int, via_id uuid, via_name text)
language sql stable security definer set search_path = public as $$
  with recursive b as (
    select * from public._vibz_bfs(auth.uid(), 6)
  ),
  walk as (
    select t.node as target, t.node as cur, t.parent as par, t.dist
    from b t where t.node = any(p_targets)
    union all
    select w.target, b.node, b.parent, b.dist
    from walk w join b on b.node = w.par
  )
  select w.target, (select dist from b where b.node = w.target), w.cur, p.display_name
  from walk w join public.profiles p on p.id = w.cur
  where w.dist = 1
$$;
grant execute on function public.six_degres_for(uuid[]) to authenticated;

-- Chaîne complète de moi jusqu'à p_target (vide si plus de 6 degrés)
create or replace function public.six_degres_path(p_target uuid)
returns table(step int, id uuid, display_name text, avatar_url text, avatar_emoji text, instruments text[], link text)
language sql stable security definer set search_path = public as $$
  with recursive b as (
    select * from public._vibz_bfs(auth.uid(), 6)
  ),
  walk as (
    select b.node as cur, b.parent as par, b.dist from b where b.node = p_target
    union all
    select b.node, b.parent, b.dist from walk w join b on b.node = w.par
  ),
  chain as (
    select auth.uid() as cur, null::uuid as par, 0 as dist where exists (select 1 from walk)
    union all
    select cur, par, dist from walk
  )
  select c.dist, p.id, p.display_name, p.avatar_url, p.avatar_emoji, p.instruments,
         case when c.par is null then null
              when exists (select 1 from public.connections x where x.status = 'accepted'
                           and least(x.requester_id, x.addressee_id) = least(c.cur, c.par)
                           and greatest(x.requester_id, x.addressee_id) = greatest(c.cur, c.par))
                then 'connexion'
              else 'invitation' end
  from chain c join public.profiles p on p.id = c.cur
  order by c.dist
$$;
grant execute on function public.six_degres_path(uuid) to authenticated;

-- Portée de mon réseau : combien de membres à chaque degré
create or replace function public.six_degres_reach()
returns json
language sql stable security definer set search_path = public as $$
  with b as (select * from public._vibz_bfs(auth.uid(), 6))
  select json_build_object(
    'par_degre', (select json_agg(coalesce(c.n, 0) order by g.d)
                  from generate_series(1, 6) g(d)
                  left join (select dist, count(*) n from b group by dist) c on c.dist = g.d),
    'invitations', (select count(*) from public.profiles where invited_by = auth.uid()),
    'connexions', (select count(*) from public.connections
                   where status = 'accepted' and auth.uid() in (requester_id, addressee_id)),
    'membres', (select count(*) from public.profiles
                where id <> auth.uid() and not coalesce(is_banned, false))
  )
$$;
grant execute on function public.six_degres_reach() to authenticated;

-- Rattacher mon compte à celui qui m'a invité (une seule fois, dans les 7 jours)
create or replace function public.claim_invite(p_ref text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  inviter uuid;
  n int;
  cur uuid;
  hops int := 0;
begin
  if me is null or p_ref !~* '^[0-9a-f-]{8,36}$' then return null; end if;
  if (select invited_by from public.profiles where id = me) is not null then return null; end if;
  if (select created_at from auth.users where id = me) < now() - interval '7 days' then return null; end if;

  select count(*), min(id::text)::uuid into n, inviter
  from public.profiles where id::text like lower(p_ref) || '%' and not coalesce(is_banned, false);
  if n <> 1 or inviter = me then return null; end if;
  if exists (select 1 from public.blocks where (blocker_id = me and blocked_id = inviter)
                                        or (blocker_id = inviter and blocked_id = me)) then
    return null;
  end if;

  -- Pas de boucle : je ne dois pas être déjà en amont de l'inviteur
  cur := inviter;
  while cur is not null and hops < 100 loop
    if cur = me then return null; end if;
    select invited_by into cur from public.profiles where id = cur;
    hops := hops + 1;
  end loop;

  update public.profiles set invited_by = inviter where id = me;
  return (select display_name from public.profiles where id = inviter);
end $$;
grant execute on function public.claim_invite(text) to authenticated;

-- Demander une Connexion (ou accepter celle que l'autre m'a déjà demandée)
create or replace function public.connect_request(p_to uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  row_ public.connections;
begin
  if me is null or p_to is null or p_to = me then return 'refuse'; end if;
  if not exists (select 1 from public.profiles where id = p_to and not coalesce(is_banned, false)) then return 'refuse'; end if;
  if exists (select 1 from public.blocks where (blocker_id = me and blocked_id = p_to)
                                        or (blocker_id = p_to and blocked_id = me)) then
    return 'refuse';
  end if;

  select * into row_ from public.connections
  where least(requester_id, addressee_id) = least(me, p_to)
    and greatest(requester_id, addressee_id) = greatest(me, p_to);

  if found then
    if row_.status = 'pending' and row_.addressee_id = me then
      update public.connections set status = 'accepted', responded_at = now() where id = row_.id;
      return 'accepted';
    end if;
    return row_.status;
  end if;

  -- Anti-spam : 30 demandes par 24 h
  if (select count(*) from public.connections
      where requester_id = me and created_at > now() - interval '24 hours') >= 30 then
    return 'limite';
  end if;

  insert into public.connections(requester_id, addressee_id) values (me, p_to);
  return 'pending';
end $$;
grant execute on function public.connect_request(uuid) to authenticated;

-- Répondre à une demande reçue
create or replace function public.connect_respond(p_from uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_accept then
    update public.connections set status = 'accepted', responded_at = now()
    where requester_id = p_from and addressee_id = auth.uid() and status = 'pending';
  else
    delete from public.connections
    where requester_id = p_from and addressee_id = auth.uid() and status = 'pending';
  end if;
end $$;
grant execute on function public.connect_respond(uuid, boolean) to authenticated;

-- Annuler ma demande ou retirer une Connexion
create or replace function public.connect_remove(p_other uuid)
returns void
language sql security definer set search_path = public as $$
  delete from public.connections
  where (requester_id = auth.uid() and addressee_id = p_other)
     or (requester_id = p_other and addressee_id = auth.uid())
$$;
grant execute on function public.connect_remove(uuid) to authenticated;
