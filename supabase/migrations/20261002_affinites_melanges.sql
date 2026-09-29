-- Affinités musicales à partir de l'historique des mélanges
-- Chaque membre laisse un historique d'« ingrédients » (styles + instruments du catalogue) :
--   • mélange essayé sur le vinyle de Découvrir (log_mix)   poids 1 (0,5 pour un seul ingrédient)
--   • salon rejoint                                        poids 2
--   • salon créé (admin)                                   poids 3
--   • like donné : ingrédients déclarés du profil aimé     poids 1
-- S'y ajoutent les styles et instruments déclarés sur le profil (poids 2, permanents).
-- L'historique s'estompe avec le temps (demi-vie ~60 jours) et n'est lisible par personne :
-- seule mix_affinity() l'utilise, et ne renvoie qu'un score et les ingrédients en commun.
-- Rejouable sans risque.

-- ── 1. Catalogue (copie de lib/musicCatalog.ts — mêmes id) ─────────────
create table if not exists public.catalog_items (
  id    text primary key,
  kind  text not null check (kind in ('style', 'instrument')),
  label text not null,
  color text not null,
  terms text[] not null
);
insert into public.catalog_items (id, kind, label, color, terms) values
  ('rock', 'style', 'Rock', '#E8395A', array['rock']),
  ('metal', 'style', 'Métal', '#CC2200', array['metal']),
  ('punk', 'style', 'Punk', '#FF5722', array['punk']),
  ('grunge', 'style', 'Grunge', '#795548', array['grunge']),
  ('indie', 'style', 'Indie Rock', '#9C27B0', array['indie']),
  ('blues', 'style', 'Blues', '#1565C0', array['blues']),
  ('jazz', 'style', 'Jazz', '#6BB8E8', array['jazz']),
  ('soul', 'style', 'Soul · Gospel', '#FF8F00', array['soul', 'gospel']),
  ('rnb', 'style', 'R&B · Funk', '#7B1FA2', array['r&b', 'rnb', 'funk']),
  ('hiphop', 'style', 'Hip-Hop', '#A78BDB', array['hip-hop', 'hip hop', 'rap']),
  ('disco', 'style', 'Disco', '#E91E63', array['disco']),
  ('house', 'style', 'House', '#FF4081', array['house']),
  ('techno', 'style', 'Techno', '#546E7A', array['techno']),
  ('electro', 'style', 'Électro', '#00ACC1', array['electro', 'electro']),
  ('trance', 'style', 'Trance', '#7C4DFF', array['trance']),
  ('dnb', 'style', 'Drum & Bass', '#FF6D00', array['drum', 'dnb']),
  ('dubstep', 'style', 'Dubstep', '#64DD17', array['dubstep']),
  ('ambient', 'style', 'Ambient', '#80CBC4', array['ambient']),
  ('synthwave', 'style', 'Synthwave', '#CE93D8', array['synthwave']),
  ('lofi', 'style', 'Lo-fi', '#A5D6A7', array['lo-fi', 'lofi']),
  ('trap', 'style', 'Trap', '#607D8B', array['trap']),
  ('pop', 'style', 'Pop', '#F06292', array['pop']),
  ('kpop', 'style', 'K-Pop', '#FF80AB', array['k-pop', 'kpop', 'j-pop']),
  ('classique', 'style', 'Classique', '#A1887F', array['classique']),
  ('folk', 'style', 'Folk', '#8BC34A', array['folk']),
  ('country', 'style', 'Country', '#FFA726', array['country']),
  ('reggae', 'style', 'Reggae', '#4CAF50', array['reggae']),
  ('latin', 'style', 'Latin', '#F44336', array['latin', 'bossa']),
  ('world', 'style', 'Afrobeat', '#E65100', array['afro', 'world']),
  ('guit_e', 'instrument', 'Guitare élec.', '#52C07A', array['guitare']),
  ('guit_a', 'instrument', 'Guitare acous.', '#6DBF6D', array['guitare']),
  ('basse', 'instrument', 'Basse', '#3DAD7A', array['basse']),
  ('violon', 'instrument', 'Violon', '#8BC34A', array['violon']),
  ('violonc', 'instrument', 'Violoncelle', '#558B2F', array['violoncelle']),
  ('uke', 'instrument', 'Ukulélé', '#9CCC65', array['ukulele', 'ukulele']),
  ('piano', 'instrument', 'Piano', '#29B6F6', array['piano']),
  ('piano_d', 'instrument', 'Claviers', '#0288D1', array['clavier']),
  ('synth', 'instrument', 'Synthétiseur', '#7C4DFF', array['synth']),
  ('orgue', 'instrument', 'Orgue', '#5E35B1', array['orgue']),
  ('accordeon', 'instrument', 'Accordéon', '#AB47BC', array['accordeon']),
  ('beatmaking', 'instrument', 'Beatmaking', '#8E24AA', array['beat']),
  ('batt', 'instrument', 'Batterie', '#EF5350', array['batterie']),
  ('batt_e', 'instrument', 'Batterie élec.', '#E53935', array['batterie']),
  ('cajon', 'instrument', 'Cajon · Djembé', '#FF7043', array['cajon', 'djembe', 'djembe']),
  ('perc_lat', 'instrument', 'Percus. latines', '#FF5722', array['percu']),
  ('sax', 'instrument', 'Saxophone', '#FF8F00', array['saxo']),
  ('trompette', 'instrument', 'Trompette', '#FFA000', array['trompette']),
  ('trombone', 'instrument', 'Trombone · Tuba', '#F57F17', array['trombone', 'tuba']),
  ('clarinette', 'instrument', 'Clarinette', '#6D4C41', array['clarinette']),
  ('flute', 'instrument', 'Flûte', '#80CBC4', array['flute', 'flute']),
  ('harpe', 'instrument', 'Harpe · Sitar', '#AED581', array['harpe', 'sitar']),
  ('chant_class', 'instrument', 'Chant lyrique', '#EC407A', array['chant']),
  ('chant_pop', 'instrument', 'Chant pop', '#E91E63', array['chant']),
  ('rap', 'instrument', 'Rap · Slam', '#AD1457', array['rap', 'slam']),
  ('beatbox', 'instrument', 'Beatbox', '#880E4F', array['beatbox']),
  ('choeurs', 'instrument', 'Chœurs', '#F06292', array['chœur', 'choeur']),
  ('dj', 'instrument', 'DJ · Platines', '#546E7A', array['dj']),
  ('prod', 'instrument', 'Producteur', '#37474F', array['produc'])
on conflict (id) do update set kind = excluded.kind, label = excluded.label, color = excluded.color, terms = excluded.terms;
alter table public.catalog_items enable row level security;
drop policy if exists "catalog_read" on public.catalog_items;
create policy "catalog_read" on public.catalog_items for select using (true);

-- Même normalisation que norm() côté site : minuscules, sans accents
create or replace function public.vibz_norm(s text)
returns text language sql immutable as $$
  select btrim(lower(translate(coalesce(s, ''),
    'ÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝàâäáãåçéèêëíìîïñóòôöõúùûüýÿ',
    'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuyy')))
$$;

-- Ingrédients du catalogue correspondant aux instruments / genres saisis sur un profil
create or replace function public.catalog_tags_for(p_instruments text[], p_genres text[])
returns text[] language sql stable set search_path = public as $$
  select coalesce(array_agg(c.id order by c.id), '{}')
  from public.catalog_items c
  where exists (
    select 1
    from unnest(case when c.kind = 'instrument' then coalesce(p_instruments, '{}') else coalesce(p_genres, '{}') end) f,
         unnest(c.terms) t
    where public.vibz_norm(f) like '%' || t || '%'
  )
$$;

-- ── 2. Ingrédients déclarés, tenus à jour automatiquement ───────────────
alter table public.profiles add column if not exists catalog_tags text[] not null default '{}';

create or replace function public.profiles_catalog_tags()
returns trigger language plpgsql set search_path = public as $$
begin
  new.catalog_tags := public.catalog_tags_for(new.instruments, new.music_genres);
  return new;
end $$;
drop trigger if exists profiles_catalog_tags on public.profiles;
create trigger profiles_catalog_tags before insert or update of instruments, music_genres on public.profiles
  for each row execute function public.profiles_catalog_tags();

-- Rattrapage des profils existants
update public.profiles set catalog_tags = public.catalog_tags_for(instruments, music_genres);

-- ── 3. Historique des mélanges ──────────────────────────────────────────
create table if not exists public.mix_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  tags       text[] not null,
  weight     real not null,
  source     text not null check (source in ('mix', 'salon_join', 'salon_create', 'like')),
  created_at timestamptz not null default now()
);
create index if not exists mix_events_user_idx on public.mix_events (user_id, created_at desc);
alter table public.mix_events enable row level security;
-- Aucune policy : ni lecture ni écriture directe.

-- Garde uniquement les id connus du catalogue, triés, sans doublon
create or replace function public.clean_tags(p text[])
returns text[] language sql stable set search_path = public as $$
  select coalesce(array_agg(distinct t order by t), '{}')
  from unnest(coalesce(p, '{}')) t where t in (select id from public.catalog_items)
$$;

-- Mélange essayé sur le vinyle
create or replace function public.log_mix(p_tags text[])
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  t text[] := public.clean_tags(p_tags);
  last_ public.mix_events;
begin
  if me is null or cardinality(t) = 0 or cardinality(t) > 12 then return; end if;
  select * into last_ from public.mix_events where user_id = me and source = 'mix' order by created_at desc limit 1;
  -- Pas plus d'un mélange toutes les 20 s, et pas deux fois le même d'affilée
  if found and (last_.created_at > now() - interval '20 seconds' or last_.tags = t) then return; end if;
  insert into public.mix_events (user_id, tags, weight, source)
  values (me, t, case when cardinality(t) >= 2 then 1 else 0.5 end, 'mix');
end $$;
grant execute on function public.log_mix(text[]) to authenticated;

-- Salon rejoint ou créé
create or replace function public.mix_on_salon_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s record;
  t text[];
begin
  select tags, admin_id into s from public.salons where id = new.salon_id;
  t := public.clean_tags(s.tags);
  if cardinality(t) > 0 then
    insert into public.mix_events (user_id, tags, weight, source)
    values (new.user_id, t,
            case when s.admin_id = new.user_id then 3 else 2 end,
            case when s.admin_id = new.user_id then 'salon_create' else 'salon_join' end);
  end if;
  return new;
end $$;
drop trigger if exists mix_on_salon_member on public.salon_members;
create trigger mix_on_salon_member after insert on public.salon_members
  for each row execute function public.mix_on_salon_member();

-- Like donné
create or replace function public.mix_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text[];
begin
  select catalog_tags into t from public.profiles where id = new.to_user;
  if cardinality(t) > 0 then
    insert into public.mix_events (user_id, tags, weight, source) values (new.from_user, t, 1, 'like');
  end if;
  return new;
end $$;
drop trigger if exists mix_on_like on public.likes;
create trigger mix_on_like after insert on public.likes
  for each row execute function public.mix_on_like();

-- ── 4. Affinité entre moi et chaque profil affiché ──────────────────────
-- score (0–100) :
--   40 % styles          similarité cosinus des goûts en styles (déclarés + historique)
--   35 % complémentarité l'autre joue un instrument que je mélange sans le jouer, et inversement
--   25 % mélanges        paires d'ingrédients que nous associons tous les deux (Jaccard pondéré)
create or replace function public.mix_affinity(p_targets uuid[])
returns table(target uuid, score int, shared_styles text[], they_play text[], i_play text[], shared_pair text[])
language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id),
  who as (select unnest(p_targets) as u union select id from me),
  ev as (
    select e.user_id as u, e.tags,
           e.weight * exp(-extract(epoch from now() - e.created_at) / 86400.0 / 87.0) as w
    from public.mix_events e
    where e.user_id in (select u from who) and e.created_at > now() - interval '1 year'
  ),
  raw as (
    select ev.u, x.tag, ev.w from ev, unnest(ev.tags) as x(tag)
    union all
    select p.id, x.tag, 2.0 from public.profiles p, unnest(p.catalog_tags) as x(tag) where p.id in (select u from who)
  ),
  taste as (
    select r.u, r.tag, c.kind, sum(r.w)::float8 as w
    from raw r join public.catalog_items c on c.id = r.tag
    group by r.u, r.tag, c.kind
  ),
  plays as (
    select p.id as u, x.tag
    from public.profiles p, unnest(p.catalog_tags) as x(tag), public.catalog_items c
    where c.id = x.tag and c.kind = 'instrument' and p.id in (select u from who)
  ),
  pairs as (
    select ev.u, a || '|' || b as pair, sum(ev.w)::float8 as w
    from ev, unnest(ev.tags) a, unnest(ev.tags) b
    where a < b group by ev.u, a, b
  ),
  calc as (
    select o.u,
      -- styles : cosinus
      coalesce((select sum(m.w * x.w) from taste m join taste x on x.tag = m.tag
                where m.u = me.id and x.u = o.u and m.kind = 'style')
        / nullif(sqrt((select sum(w * w) from taste where u = me.id and kind = 'style'))
               * sqrt((select sum(w * w) from taste where u = o.u and kind = 'style')), 0), 0) as s_cos,
      -- l'autre joue ce que je mélange sans le jouer
      coalesce((select sum(m.w) from taste m
                where m.u = me.id and m.kind = 'instrument'
                  and m.tag in (select tag from plays where u = o.u)
                  and m.tag not in (select tag from plays where u = me.id))
        / nullif((select sum(w) from taste where u = me.id and kind = 'instrument'
                  and tag not in (select tag from plays where u = me.id)), 0), 0) as c_me,
      -- je joue ce que l'autre mélange sans le jouer
      coalesce((select sum(x.w) from taste x
                where x.u = o.u and x.kind = 'instrument'
                  and x.tag in (select tag from plays where u = me.id)
                  and x.tag not in (select tag from plays where u = o.u))
        / nullif((select sum(w) from taste where u = o.u and kind = 'instrument'
                  and tag not in (select tag from plays where u = o.u)), 0), 0) as c_them,
      -- mélanges communs
      coalesce((select sum(least(coalesce(m.w, 0), coalesce(x.w, 0)))
                     / nullif(sum(greatest(coalesce(m.w, 0), coalesce(x.w, 0))), 0)
                from (select pair, w from pairs where u = me.id) m
                full join (select pair, w from pairs where u = o.u) x on x.pair = m.pair), 0) as p_jac
    from (select u from who) o, me
    where o.u <> me.id
  )
  select c.u,
    least(100, round(100 * (
        0.40 * c.s_cos
      + 0.35 * least(1.0, greatest(c.c_me, c.c_them) * 0.7 + least(c.c_me, c.c_them) * 0.6)
      + 0.25 * least(1.0, c.p_jac * 2)
    )))::int,
    array(select m.tag from taste m join taste x on x.tag = m.tag and x.u = c.u
          where m.u = (select id from me) and m.kind = 'style'
          order by m.w * x.w desc limit 3),
    array(select m.tag from taste m
          where m.u = (select id from me) and m.kind = 'instrument'
            and m.tag in (select tag from plays where u = c.u)
            and m.tag not in (select tag from plays where u = (select id from me))
          order by m.w desc limit 2),
    array(select x.tag from taste x
          where x.u = c.u and x.kind = 'instrument'
            and x.tag in (select tag from plays where u = (select id from me))
            and x.tag not in (select tag from plays where u = c.u)
          order by x.w desc limit 2),
    coalesce((select string_to_array(m.pair, '|')
              from pairs m join pairs x on x.pair = m.pair and x.u = c.u
              where m.u = (select id from me)
              order by least(m.w, x.w) desc limit 1), '{}')
  from calc c
$$;
grant execute on function public.mix_affinity(uuid[]) to authenticated;
