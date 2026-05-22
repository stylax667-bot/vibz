-- =============================================
-- VIBZ — Schéma de base de données Supabase
-- Colle ce SQL dans l'éditeur SQL de Supabase
-- =============================================

-- Extension pour les UUIDs
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLE: profiles (liée à auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  city text,
  country text default 'FR',
  birthdate date,
  gender text check (gender in ('homme','femme','autre','non-précisé')),
  looking_for text[] default '{}', -- ['rencontre','collab','amis']
  instruments text[] default '{}', -- ['guitare','piano',...]
  music_genres text[] default '{}', -- ['rock','jazz',...]
  avatar_url text,
  is_online boolean default false,
  last_seen timestamptz default now(),
  is_verified boolean default false,
  is_banned boolean default false,
  ban_reason text,
  -- Réseaux sociaux
  social_soundcloud text,
  social_instagram text,
  social_youtube text,
  social_linkedin text,
  social_facebook text,
  social_twitter text,
  social_tiktok text,
  social_email_public text,
  social_website text,
  -- Confidentialité
  show_socials boolean default true,
  show_location boolean default true,
  allow_messages_from text default 'all' check (allow_messages_from in ('all','matches','none')),
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- TABLE: likes (j'aime un profil)
-- =============================================
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  from_user uuid references public.profiles(id) on delete cascade,
  to_user uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(from_user, to_user)
);

-- =============================================
-- TABLE: matches (like mutuel = match)
-- =============================================
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  user1 uuid references public.profiles(id) on delete cascade,
  user2 uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user1, user2)
);

-- =============================================
-- TABLE: blocks (blocage d'un utilisateur)
-- =============================================
create table public.blocks (
  id uuid default uuid_generate_v4() primary key,
  blocker uuid references public.profiles(id) on delete cascade,
  blocked uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker, blocked)
);

-- =============================================
-- TABLE: conversations (messagerie privée)
-- =============================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user1 uuid references public.profiles(id) on delete cascade,
  user2 uuid references public.profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user1, user2)
);

-- =============================================
-- TABLE: messages (messages privés)
-- =============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  message_type text default 'text' check (message_type in ('text','emoji','wizz','gif','system')),
  is_read boolean default false,
  is_flagged boolean default false,
  flag_reason text,
  created_at timestamptz default now()
);

-- =============================================
-- TABLE: salons (salons de discussion)
-- =============================================
create table public.salons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon text default '💬',
  category text check (category in ('rencontre','musique','general','regional')),
  is_active boolean default true,
  max_members integer default 500,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- =============================================
-- TABLE: salon_moderators
-- =============================================
create table public.salon_moderators (
  id uuid default uuid_generate_v4() primary key,
  salon_id uuid references public.salons(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  appointed_at timestamptz default now(),
  unique(salon_id, user_id)
);

-- =============================================
-- TABLE: salon_messages (messages dans les salons)
-- =============================================
create table public.salon_messages (
  id uuid default uuid_generate_v4() primary key,
  salon_id uuid references public.salons(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  message_type text default 'text' check (message_type in ('text','emoji','gif','system','moderation')),
  is_deleted boolean default false,
  deleted_by uuid references public.profiles(id),
  is_flagged boolean default false,
  flag_reason text,
  ia_score float default 0, -- Score de toxicité IA (0-1)
  created_at timestamptz default now()
);

-- =============================================
-- TABLE: reports (signalements)
-- =============================================
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('harcelement','spam','contenu_inapproprie','usurpation','autre')),
  details text,
  status text default 'pending' check (status in ('pending','reviewed','resolved','dismissed')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- =============================================
-- Salons par défaut
-- =============================================
insert into public.salons (name, slug, description, icon, category) values
  ('Rock & Rencontre', 'rock-rencontre', 'Passionnés de rock cherchant âme sœur et collabs', '🎸', 'musique'),
  ('Jazz Lounge', 'jazz-lounge', 'L''ambiance jazz, les rencontres feutrées', '🎹', 'musique'),
  ('Coup de foudre', 'coup-de-foudre', 'Le salon des rencontres amoureuses', '💑', 'rencontre'),
  ('Beatmakers', 'beatmakers', 'Producteurs et beatmakers du monde entier', '🥁', 'musique'),
  ('Chanteurs & Choristes', 'chanteurs', 'Voix et harmonies cherchent partenaires', '🎤', 'musique'),
  ('International', 'international', 'Toutes langues, toutes cultures', '🌍', 'general'),
  ('Classique & Contemporain', 'classique', 'Musique classique et contemporaine', '🎻', 'musique'),
  ('DJ & Électro', 'dj-electro', 'La scène électronique vous attend', '🎧', 'musique');

-- =============================================
-- RLS (Row Level Security) — Sécurité
-- =============================================
alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.salons enable row level security;
alter table public.salon_messages enable row level security;
alter table public.reports enable row level security;

-- Profils : lecture publique, écriture par le propriétaire
create policy "Profils visibles par tous" on public.profiles for select using (true);
create policy "Modifier son propre profil" on public.profiles for update using (auth.uid() = id);
create policy "Créer son profil" on public.profiles for insert with check (auth.uid() = id);

-- Likes
create policy "Voir ses likes" on public.likes for select using (auth.uid() = from_user);
create policy "Liker" on public.likes for insert with check (auth.uid() = from_user);
create policy "Supprimer son like" on public.likes for delete using (auth.uid() = from_user);

-- Messages
create policy "Voir ses messages" on public.messages for select
  using (auth.uid() in (
    select user1 from conversations where id = conversation_id
    union
    select user2 from conversations where id = conversation_id
  ));
create policy "Envoyer un message" on public.messages for insert
  with check (auth.uid() = sender_id);

-- Salons publics
create policy "Salons visibles par tous" on public.salons for select using (is_active = true);
create policy "Messages salons visibles" on public.salon_messages for select using (is_deleted = false);
create policy "Envoyer dans un salon" on public.salon_messages for insert with check (auth.uid() = sender_id);

-- Reports
create policy "Signaler" on public.reports for insert with check (auth.uid() = reporter_id);

-- =============================================
-- Fonction: créer profil auto à l'inscription
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- Fonction: créer match si like mutuel
-- =============================================
create or replace function public.check_mutual_like()
returns trigger as $$
begin
  if exists (
    select 1 from public.likes
    where from_user = new.to_user and to_user = new.from_user
  ) then
    insert into public.matches (user1, user2)
    values (least(new.from_user, new.to_user), greatest(new.from_user, new.to_user))
    on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_like_created
  after insert on public.likes
  for each row execute procedure public.check_mutual_like();
