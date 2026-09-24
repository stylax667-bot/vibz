-- ══════════════════════════════════════════════════════════════════
--  Vibz — Inscription Google / Discord fiable
--  À coller dans Supabase > SQL Editor puis « Run ». Rejouable sans risque.
--
--  Le profil créé à l'inscription prenait comme pseudo le début de l'e-mail.
--  Le pseudo étant unique et obligatoire, l'inscription échouait
--  (« Database error saving new user ») quand ce pseudo existait déjà ou
--  quand le fournisseur (Discord) ne donnait pas d'e-mail.
-- ══════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base  text;
  uname text;
  n     int := 0;
begin
  -- Pseudo lisible : pseudo fourni, nom Discord/Google, début de l'e-mail, sinon « membre »
  base := coalesce(
    nullif(meta->>'username', ''),
    nullif(meta->>'preferred_username', ''),
    nullif(meta->'custom_claims'->>'global_name', ''),
    nullif(meta->>'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'membre'
  );
  base := left(regexp_replace(base, '\s+', '_', 'g'), 30);
  uname := base;

  -- Pseudo déjà pris : on ajoute un suffixe court
  while exists (select 1 from public.profiles where username = uname) loop
    n := n + 1;
    uname := base || '_' || substr(md5(random()::text), 1, 4);
    exit when n > 20;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    uname,
    left(coalesce(
      nullif(meta->>'full_name', ''),
      nullif(meta->'custom_claims'->>'global_name', ''),
      nullif(meta->>'name', ''),
      base
    ), 60)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
