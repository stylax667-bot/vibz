-- Phrase sous le pseudo (« Batteur du dimanche, cherche groupe funk »)
-- Publique : 90 caractères max, filtrée par VibzGuard comme un message de salon
-- (insultes, harcèlement, coordonnées personnelles… bloqués).
-- Rejouable sans risque.

alter table public.profiles add column if not exists tagline text;
do $$ begin
  alter table public.profiles add constraint profiles_tagline_len check (char_length(tagline) <= 90);
exception when duplicate_object then null; end $$;

create or replace function public.profiles_check_tagline()
returns trigger language plpgsql security definer set search_path = public as $$
declare v record;
begin
  new.tagline := nullif(btrim(regexp_replace(coalesce(new.tagline, ''), '\s+', ' ', 'g')), '');
  if new.tagline is null or new.tagline is not distinct from (case when tg_op = 'UPDATE' then old.tagline end) then
    return new;
  end if;
  select * into v from public.vibzguard_check(new.tagline, 'salon');
  if v.action = 'block' then
    raise exception 'vibzguard: %', coalesce(v.reason, 'Cette phrase ne respecte pas la charte de Vibz.')
      using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists profiles_check_tagline on public.profiles;
create trigger profiles_check_tagline before insert or update of tagline on public.profiles
  for each row execute function public.profiles_check_tagline();
