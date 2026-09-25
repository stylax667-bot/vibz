-- ══════════════════════════════════════════════════════════════════
--  Vibz — Qui peut fermer un salon ?
--  À coller dans Supabase > SQL Editor puis « Run ». Rejouable sans risque.
--
--  Seuls les deux derniers membres encore présents dans un salon peuvent le
--  fermer (ou le dernier, s'il est seul). Tant qu'il reste 3 membres ou plus,
--  personne ne peut le fermer, pas même l'admin : on ne peut que le quitter.
-- ══════════════════════════════════════════════════════════════════

create or replace function public.close_salon(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  perform public._sweep_salons();   -- retire d'abord les membres partis sans le dire

  perform 1 from public.salons where id = p_id and is_active for update;
  if not found then return; end if;   -- déjà fermé

  if not exists (select 1 from public.salon_members where salon_id = p_id and user_id = auth.uid()) then
    raise exception 'Tu n''es pas membre de ce salon';
  end if;
  select count(*) into n from public.salon_members where salon_id = p_id;
  if n > 2 then
    raise exception 'Seuls les deux derniers membres du salon peuvent le fermer (il en reste %)', n;
  end if;

  perform public._close_salon(p_id);
end $$;
grant execute on function public.close_salon(uuid) to authenticated;
