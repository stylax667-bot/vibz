-- Présence : voyant vert (en ligne), orange (ne pas déranger), rouge (hors ligne)
-- L'app envoie un signe de vie chaque minute (presence_ping) tant que l'onglet est ouvert.
-- En ligne = signe de vie depuis moins de 3 minutes. Le mode « ne pas déranger »
-- est choisi par le membre ; il bloque aussi les Wizzz qu'on lui envoie.
-- Rejouable sans risque.

alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists is_online boolean not null default false;
alter table public.profiles add column if not exists presence_mode text not null default 'auto';
do $$ begin
  alter table public.profiles add constraint profiles_presence_mode_chk check (presence_mode in ('auto', 'dnd'));
exception when duplicate_object then null; end $$;
create index if not exists profiles_last_seen_idx on public.profiles (last_seen desc nulls last);

-- Signe de vie (p_online = false quand l'onglet se ferme)
create or replace function public.presence_ping(p_online boolean default true)
returns void language sql security definer set search_path = public as $$
  update public.profiles
     set last_seen = now(), is_online = p_online
   where id = auth.uid()
$$;
grant execute on function public.presence_ping(boolean) to authenticated;

-- Choisir « en ligne » ou « ne pas déranger »
create or replace function public.set_presence_mode(p_mode text)
returns void language sql security definer set search_path = public as $$
  update public.profiles
     set presence_mode = case when p_mode = 'dnd' then 'dnd' else 'auto' end,
         last_seen = now(), is_online = true
   where id = auth.uid()
$$;
grant execute on function public.set_presence_mode(text) to authenticated;

-- Les membres « hors ligne » depuis longtemps ne gardent pas un is_online périmé
update public.profiles set is_online = false
 where is_online and (last_seen is null or last_seen < now() - interval '3 minutes');

-- Pas de Wizzz à quelqu'un en « ne pas déranger »
create or replace function public.wizzz_respect_dnd()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = new.receiver_id and presence_mode = 'dnd'
             and last_seen > now() - interval '3 minutes') then
    raise exception 'dnd: ce membre ne veut pas être dérangé';
  end if;
  return new;
end $$;
do $$ begin
  if to_regclass('public.wizzz') is not null then
    drop trigger if exists wizzz_respect_dnd on public.wizzz;
    create trigger wizzz_respect_dnd before insert on public.wizzz
      for each row execute function public.wizzz_respect_dnd();
  end if;
end $$;
