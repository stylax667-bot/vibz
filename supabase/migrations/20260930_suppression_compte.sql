-- Suppression de compte (exigence Google Play)
-- /api/delete-account efface l'utilisateur de auth.users. Pour que cela
-- réussisse, toute clé étrangère du schéma public qui pointe vers
-- auth.users ou public.profiles doit suivre la suppression.
-- Ce script convertit en ON DELETE CASCADE celles qui ne le font pas encore
-- (NO ACTION / RESTRICT). Les SET NULL existants (ex. salons.admin_id) sont gardés.
-- Rejouable sans risque.

do $$
declare
  r record;
begin
  for r in
    select c.conname,
           c.conrelid::regclass as tbl,
           pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f'
      and n.nspname = 'public'
      and c.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
      and c.confdeltype in ('a', 'r')   -- NO ACTION, RESTRICT
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format('alter table %s add constraint %I %s on delete cascade',
                   r.tbl, r.conname,
                   regexp_replace(r.def, '\s+ON DELETE (NO ACTION|RESTRICT)', '', 'i'));
    raise notice 'cascade ajoutée : %.%', r.tbl, r.conname;
  end loop;
end $$;
