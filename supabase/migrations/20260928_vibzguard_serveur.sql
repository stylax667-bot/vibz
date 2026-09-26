-- ══════════════════════════════════════════════════════════════════
--  Vibz — VibzGuard côté serveur
--  À coller dans Supabase > SQL Editor puis « Run ». Rejouable sans risque.
--
--  Avant : le filtre tournait seulement dans le navigateur. N'importe qui
--  pouvait l'ignorer en écrivant directement dans la base avec sa session.
--  Maintenant chaque message (privé ou salon) passe par un déclencheur
--  Postgres, impossible à contourner depuis l'application :
--    • block : le message n'est pas enregistré, la raison est journalisée
--    • warn  : le message passe, l'expéditeur est averti, c'est journalisé
--    • flag  : le message passe sans avertissement, c'est journalisé
--  Anti-flood, anti-doublons, et suspension 24 h après 3 blocages graves.
--  Le journal public.vibzguard_log sert de file de revue pour l'équipe.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Journal ───────────────────────────────────────────────────────
create table if not exists public.vibzguard_log (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  context    text not null check (context in ('dm', 'salon')),
  target_id  uuid,                       -- conversation ou salon
  content    text,
  category   text not null,
  action     text not null check (action in ('block', 'warn', 'flag')),
  reason     text,
  reviewed   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists vibzguard_log_user_idx on public.vibzguard_log (user_id, created_at desc);
create index if not exists vibzguard_log_review_idx on public.vibzguard_log (reviewed, created_at desc);
create index if not exists vibzguard_log_date_idx on public.vibzguard_log (created_at);

-- Conservation (politique de confidentialité, art. 6.4) : le texte des
-- messages est effacé après 30 jours ; la trace (catégorie, date) après 1 an.
create or replace function public.vibzguard_purge()
returns void language sql security definer set search_path = public as $$
  update public.vibzguard_log set content = null
   where content is not null and created_at < now() - interval '30 days';
  delete from public.vibzguard_log where created_at < now() - interval '1 year';
$$;
revoke execute on function public.vibzguard_purge() from public, anon, authenticated;

alter table public.vibzguard_log enable row level security;
-- Chacun peut relire ses propres verdicts (pour afficher la raison d'un blocage).
-- Aucune écriture possible depuis l'application : seul le déclencheur écrit.
drop policy if exists "vibzguard_log_own" on public.vibzguard_log;
create policy "vibzguard_log_own" on public.vibzguard_log
  for select to authenticated using (user_id = auth.uid());

alter table public.messages       add column if not exists is_flagged boolean default false;
alter table public.messages       add column if not exists flag_reason text;
alter table public.salon_messages add column if not exists is_flagged boolean default false;
alter table public.salon_messages add column if not exists flag_reason text;

-- ── 2. Analyse d'un texte ────────────────────────────────────────────
-- Normalise (minuscules, accents, leet « s4lope », lettres espacées
-- « f.d.p », lettres répétées) puis applique les règles par gravité.
-- p_context : 'dm' (messagerie privée) ou 'salon'.
create or replace function public.vibzguard_check(p_content text, p_context text,
  out action text, out category text, out reason text)
language plpgsql immutable set search_path = public as $$
declare
  w0 text;  -- minuscules sans accents
  w1 text;  -- + lettres isolées recollées (f.d.p → fdp, 0 6 1 2 → 0612)
  wl text;  -- + leet et lettres répétées (s4looope → salope) : pour les mots
  d  text;  -- + séparateurs entre chiffres retirés : pour les numéros
  letters int;
begin
  if p_content is null or btrim(p_content) = '' then return; end if;

  w0 := translate(lower(p_content),
          $a$àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ’‘`´$a$,
          $b$aaaaaaceeeeiiiinooooouuuuyyoa''''$b$);
  w1 := regexp_replace(w0, '(?<![[:alnum:]])([[:alnum:]])[\s.*_+|-]+(?=[[:alnum:]](?![[:alnum:]]))', '\1', 'g');
  wl := regexp_replace(translate(w1, '4@310$5', 'aaeioss'), '([a-z])\1{2,}', '\1', 'g');
  d  := regexp_replace(w1, '(?<=[0-9])[\s.()/_-]+(?=[0-9])', '', 'g');

  -- Menaces
  if wl ~ '\m(je vais|j.?vais|on va)\s+(te|vous)\s+(tuer|buter|defoncer|frapper|violer|egorger|planter|faire la peau|casser la gueule|refaire le portrait)\M'
     or wl ~ '\m(t.?es|tu es)\s+(un|une)\s+(homme|femme|fille|mec)\s+morte?\M'
     or wl ~ '\mje (sais|connais)\s+(ou|l.?endroit ou|dans quelle rue)\s+(tu\s+|t.?)(habites?|vis|bosses?|travailles?|dors|crech)'
     or wl ~ '\mje connais ton adresse\M'
     or wl ~ '\mgare a (toi|vous)\M'
     or wl ~ '\mje t.?attends?\s+(a la sortie|devant chez toi|en bas de chez toi)'
  then action := 'block'; category := 'menace';
       reason := 'Menace détectée. Les menaces sont interdites sur Vibz et peuvent être signalées à la police.'; return; end if;

  -- Incitation au suicide / à la violence contre soi
  if wl ~ '\m(tue|suicide|pends?|jette|flingue)[\s-]?toi\M'
     or wl ~ '\mva\s+(te\s+)?(tuer|suicider|pendre|jeter sous|crever|mourir)\M'
     or wl ~ '\mtu (devrais|ferais mieux de|merites de)\s+(mourir|crever|te tuer|te suicider|disparaitre)\M'
     or wl ~ '\mj.?espere que tu (meurs|creves|vas mourir|vas crever|vas te tuer)\M'
     or wl ~ '\m(va|allez|tu peux|bah|ben|alors)\s+creve'
     or wl ~ '^\W*creve[sz]?\W*$'
     or wl ~ '\mcreve,?\s+(sale|con+|salope|pd)'
  then action := 'block'; category := 'incitation';
       reason := 'Incitation à se faire du mal. Si quelqu''un va mal, le 3114 (numéro national de prévention du suicide) répond 24h/24.'; return; end if;

  -- Haine / discrimination
  if wl ~ '\msales?\s+(arabe|noir|negre|negresse|blanc|juif|feuj|youpin|homo|gay|pd|pede|lesbienne|gouine|trans|travelo|musulman|rebeu|renoi|bougnoule|bicot|chinetoque|niakoue|bridee?|asiat|rom|gitan|manouche|handicape|mongol|attarde|tarlouze|tapette|tafiole)s?\M'
     or wl ~ '\m(negre|negresse|bougnoule|bicot|youpin|chinetoque|niakoue|bamboula|tarlouze|tafiole|travelo)s?\M'
     or wl ~ '\m(retourne|rentre|va|repars)\s+(dans ton pays|dans ton bled|au bled|en afrique|chez les singes)\M'
     or wl ~ '\mmort aux\s+\w'
     or wl ~ '\m(heil hitler|sieg heil|white power|gazer les|au four les)\M'
     or wl ~ '\m(les|ces|tous les|toutes les)\s+(arabes|noirs|juifs|musulmans|homos|gays|pedes|lesbiennes|trans|migrants|roms|gitans|asiatiques|chinois|femmes|feministes)\s+(sont des (sous|chiens|animaux|singes|parasites|merdes|putes|cafards|rats)|devraient (mourir|crever|degager)|doivent (mourir|crever|degager)|dehors|a mort|puent)'
  then action := 'block'; category := 'haine';
       reason := 'Propos haineux ou discriminatoires. Ils sont interdits sur Vibz et punis par la loi.'; return; end if;

  -- Sollicitations sexuelles
  if wl ~ '\m(envoie|envoies|envoi|envois|montre|montres|balance|balances|file|donne|donnes)[\s-]?(moi)?\s+(des |une |un |tes |ta |ton |quelques )?(nudes?|photos? (de toi )?(nue?s?|sexy|hot|coquines?|osees?|intimes?)|pics? (nue?s?|hot|sexy)|seins|nichons|nibards|fesses|cul|bite|queue|chatte|teub|zizi|sexe|foufoune)\M'
     or wl ~ '\m(t.?as|tu as|t.?aurais|tu aurais)\s+des\s+nudes\M'
     or wl ~ '\m(je veux|j.?ai envie de|je vais|laisse[\s-]?moi)\s+(te baiser|te sucer|te niquer|te prendre|te lecher|te doigter|voir tes (seins|fesses|nichons)|toucher tes (seins|fesses))'
     or wl ~ '\msuce[\s-]?(moi|ma bite)\M'
     or wl ~ '\m(dick ?pic|ma bite)\M'
     or wl ~ '\mc.?est quoi (ton|tes) (corps|mensurations|tour de poitrine|bonnet)\M'
  then action := 'block'; category := 'sexuel';
       reason := 'Sollicitation sexuelle non consentie. Ce type de message est interdit.'; return; end if;

  -- Emprise sur mineur (secret, isolement des parents)
  if wl ~ '\m(ne (le )?dis (rien|pas|ca|le)|dis (rien|le pas)|faut pas le dire)\s+a\s+(tes parents|ta mere|ton pere|personne|tes profs)\M'
     or wl ~ '\m(c.?est|ce sera|ca reste) notre (petit )?secret\M'
     or wl ~ '\m(efface|supprime)\s+(nos|les|ces|ce|cette)\s+(messages?|conversations?|discussion)\s+(apres|pour pas|pour que|avant que)'
  then action := 'block'; category := 'emprise';
       reason := 'Message typique d''une tentative d''emprise. Il a été bloqué et transmis à la modération.'; return; end if;

  -- Harcèlement / insultes graves
  if wl ~ '\m(fdp|fils de (pute|p)|ntm|nique (ta|sa|ton|vos|leur|la) (mere|race|daron|darons|famille|soeur|grand[\s-]?mere)|nik ta mere|enc?ul+e[srz]?|bat+ard[es]?|con+as+es?|con+ard[es]?|salopes?|salauds?|putes?|pouf+ias+es?|sous[\s-]?merdes?|trou du cul|tete de bite|sac a foutre|grosse (pute|vache|truie))\M'
     or wl ~ '\m(t.?es|tu es|espece d.?|sale|gros|grosse|pauvre|petite?)\s*(un |une )?(ordure|raclure|dechet|merde|pourriture|chienne|truie|abomination|vermine|cafard)s?\M'
     or wl ~ '\m(t.?es|tu es)\s+(moche|laide?|immonde|degueulasse|grosse|obese|difforme|repugnante?|horrible)\M'
     or wl ~ '\m(personne ne t.?aime|tout le monde (te deteste|s.?en fout de toi)|tu (vaux|sers) a rien|t.?as pas d.?amis|tu ne vaux rien|tu merites pas de vivre|t.?aurais pas du naitre)\M'
  then action := 'block'; category := 'harcelement';
       reason := 'Insulte ou harcèlement. Ce message viole la charte Vibz ; au bout de 3 blocages de ce type en 24 h, l''envoi de messages est suspendu 24 h.'; return; end if;

  -- Arnaques
  if w0 ~ '\m(bit\.ly|tinyurl\.com|goo\.gl|shorturl\.at|cutt\.ly|is\.gd|rebrand\.ly|tiny\.cc|t\.ly|rb\.gy)/'
     or w1 ~ '\m(gagne[rz]?|gains?|revenus?|touche[rz]?|je fais|je me fais)\s+[0-9][0-9 .]*\s*(€|e|euros?|k|\$|balles)\s*(par|/|a la|chaque)\s*(jour|semaine|heure|mois|j|h)\M'
     or w0 ~ '\m(argent (facile|rapide)|revenu passif|devenir riche|doubler (ton|votre) argent|rendement garanti)\M'
     or w0 ~ '\m(pcs|transcash|neosurf|mandat cash|western union|moneygram|paysafecard|carte (steam|google play|itunes|apple|amazon|paysafe))\M.{0,80}\m(code|recharge|coupon|envoie|achete|photo|numero)\M'
     or w0 ~ '\m(code|recharge|coupon|envoie|achete)\M.{0,80}\m(pcs|transcash|neosurf|mandat cash|paysafecard|carte (steam|google play|itunes|apple|amazon|paysafe))\M'
     or w0 ~ '\m(investis|investir|placement|trading|forex|crypto|bitcoin|btc|usdt|binance)\M.{0,60}\m(garanti|x ?10|x ?5|doubler?|benefices?|profits?|rendement)\M'
  then action := 'block'; category := 'arnaque';
       reason := 'Ce message ressemble à une arnaque (lien raccourci, argent facile, coupons, crypto).'; return; end if;

  -- Données bancaires, identité, mots de passe (bloqué partout)
  if d ~ '(^|[^0-9])[0-9]{13,19}($|[^0-9])'
     or d ~ '\m(fr|be|ch|lu|mc|de|es|it|pt|nl)[0-9]{12}[0-9a-z]{0,20}\M'
     or w0 ~ '\m(mot de passe|password|passwd|mdp|pwd|code secret|code pin|code cb|cvv|cryptogramme)\s*[:=]\s*\S{4,}'
  then action := 'block'; category := 'donnees';
       reason := 'Donnée bancaire, d''identité ou mot de passe détectée. Ne la partage jamais, même en privé.'; return; end if;

  -- Coordonnées personnelles : bloquées en salon, avertissement en privé
  if d ~ '(\+33|0033)[1-9][0-9]{8}' or d ~ '(^|[^0-9])0[1-9][0-9]{8}($|[^0-9])'
     or w0 ~ '\mzero\s+(six|sept)(\s+(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|et)\M){3,}'
     or w0 ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
     or w0 ~ '[a-z0-9._-]+\s*(\(at\)|\[at\]|\{at\}| at |arobase|arobas)\s*[a-z0-9-]+\s*(\.|\(point\)|\[point\]| point | dot |\(dot\))\s*(com|fr|net|org|be|ch|io|eu)\M'
     or w0 ~ '\m(gmail|hotmail|yahoo|outlook|icloud|laposte|orange|free|sfr|wanadoo|protonmail)\s*(\.|point|dot)\s*(com|fr|net)\M'
     or wl ~ '\msnap(chat)?\s*[:=]\s*[a-z0-9._-]{3,}'
     or wl ~ '\m(ajoute|add|rajoute|ajout)[\s-]?(moi)?\s+(sur|en)\s+snap(chat)?\M'
     or w0 ~ '\m(j.?habite|je vis|chez moi c.?est|mon adresse|il habite|elle habite|tu habites|habite au|habite a)\M.{0,30}\m[0-9]{1,4}\s*(bis|ter)?\s*,?\s*(rue|avenue|av|bd|boulevard|allee|impasse|route|chemin|place|passage|quai|cours|residence|lotissement)\M'
  then
    category := 'coordonnees';
    if p_context = 'salon' then
      action := 'block';
      reason := 'Coordonnées personnelles (téléphone, email, adresse, Snap) : interdites dans un salon. Échange-les en privé, avec quelqu''un de confiance.';
    else
      action := 'warn';
      reason := 'Tu partages des coordonnées personnelles. Fais-le seulement avec quelqu''un que tu connais et en qui tu as confiance.';
    end if;
    return;
  end if;

  -- Spam
  if regexp_count(w0, '(https?://|www\.)') >= 4
     or w0 ~ '(.)\1{14,}'
     or w0 ~ '(\m\w+\M)(\W+\1\M){9,}'
  then action := 'block'; category := 'spam';
       reason := 'Ce message ressemble à du spam (liens ou répétitions en masse).'; return; end if;

  -- Signaux faibles d'emprise sur mineur : avertir et journaliser
  if w1 ~ '\mquel(le)?\s+(college|lycee|classe|ecole)\M'
     or w1 ~ '\m(t.?es|tu es)\s+en\s+(6|5|4|3)(e|eme)?\M'
     or w1 ~ '\m(t.?es|tu es)\s+en\s+(seconde|premiere|terminale|cm1|cm2)\M'
     or w1 ~ '\m(t.?es|tu es)\s+(toute?\s+)?seule?\s+(a la maison|chez toi)\M'
     or w1 ~ '\mtes parents (sont|rentrent)\M'
  then action := 'warn'; category := 'mineur';
       reason := 'Vibz est réservé aux adultes. Les questions sur l''école ou l''absence des parents sont surveillées par la modération.'; return; end if;

  -- Tentative de faire quitter Vibz (Discord exclu : très utilisé par les groupes)
  if wl ~ '\m(viens|venez|passe|passons|on passe|va|allons|ajoute[\s-]?moi|add[\s-]?moi|on se parle|parlons|on continue|continuons|ecris[\s-]?moi|contacte[\s-]?moi|rejoins[\s-]?moi|retrouve[\s-]?moi)\M.{0,25}\m(sur|en|par|via)\s+(whatsapp|wa|telegram|signal|snap|snapchat|kik|wickr|messenger|skype|wechat|viber)\M'
     or wl ~ '\m(en dehors de|hors de|ailleurs que (sur|ici)|loin de)\s+vibz\M'
     or wl ~ '\mon se (parle|voit|capte) ailleurs\M'
  then action := 'warn'; category := 'isolement';
       reason := 'On te propose de quitter Vibz. Prudence : ici, la modération te protège ; ailleurs, plus du tout.'; return; end if;

  -- Ton agressif
  if wl ~ '\m(nul|nulle|debile|idiote?|cretin|imbecile|stupide|con|conne|couillon|abruti|boloss|tocard|blaireau|naze|ta gueule|tg|ferme[\s-]?la|casse[\s-]?toi|degage)\M'
  then action := 'warn'; category := 'ton';
       reason := 'Ton un peu sec. Reste bienveillant·e : chaque membre mérite le respect.'; return; end if;

  letters := length(regexp_replace(p_content, '[^[:alpha:]]', '', 'g'));
  if letters >= 20 and length(regexp_replace(p_content, '[^[:upper:]]', '', 'g')) >= letters * 0.8 then
    action := 'warn'; category := 'cris';
    reason := 'Écrire tout en majuscules, c''est crier. Baisse d''un ton ?'; return;
  end if;

  -- Demande d'âge : normal sur un site de rencontre, journalisée sans avertir
  if w1 ~ '\m(t.?as|tu as|t.?a)\s+quel\s+age\M' or w1 ~ '\mc.?est quoi ton age\M' or w1 ~ '\mquel age (as[\s-]?tu|t.?as|tu as)\M' then
    action := 'flag'; category := 'age'; reason := 'Question sur l''âge'; return;
  end if;
end $$;

-- ── 3. Déclencheur : contrôle de chaque message ─────────────────────
create or replace function public.vibzguard_enforce()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ctx    text := case when tg_table_name = 'messages' then 'dm' else 'salon' end;
  v_target uuid;
  v_until  timestamptz;
  v_recent int;
  v_dupes  int;
  v_wizz   int;
  v        record;
begin
  -- Messages sans expéditeur (système) : hors périmètre
  if new.sender_id is null then return new; end if;
  if random() < 0.01 then perform public.vibzguard_purge(); end if;   -- ménage du journal, ~1 message sur 100
  v_target := (to_jsonb(new) ->> case when v_ctx = 'dm' then 'conversation_id' else 'salon_id' end)::uuid;

  -- Suspension : 3 blocages graves dans les dernières 24 h
  select created_at + interval '24 hours' into v_until
    from public.vibzguard_log
   where user_id = new.sender_id and action = 'block'
     and category in ('menace', 'incitation', 'haine', 'sexuel', 'emprise', 'harcelement', 'arnaque')
     and created_at > now() - interval '24 hours'
   order by created_at desc offset 2 limit 1;
  if v_until is not null then
    insert into public.vibzguard_log (user_id, context, target_id, content, category, action, reason)
    values (new.sender_id, v_ctx, v_target, new.content, 'suspendu', 'block',
            'Envoi de messages suspendu jusqu''au ' || to_char(v_until at time zone 'Europe/Paris', 'DD/MM à HH24"h"MI') || ' après plusieurs messages bloqués.');
    return null;
  end if;

  -- Longueur, flood, doublons, rafales de Wizz
  if v_ctx = 'dm' then
    select count(*) filter (where content = new.content),
           count(*) filter (where message_type = 'wizz')
      into v_dupes, v_wizz
      from public.messages where sender_id = new.sender_id and created_at > now() - interval '60 seconds';
    select count(*) into v_recent from public.messages
     where sender_id = new.sender_id and created_at > now() - interval '10 seconds';
  else
    select count(*) filter (where content = new.content), 0
      into v_dupes, v_wizz
      from public.salon_messages where sender_id = new.sender_id and created_at > now() - interval '60 seconds';
    select count(*) into v_recent from public.salon_messages
     where sender_id = new.sender_id and created_at > now() - interval '10 seconds';
  end if;

  if length(new.content) > 4000 or v_recent >= 8 or v_dupes >= 2
     or (v_ctx = 'dm' and new.message_type = 'wizz' and v_wizz >= 3) then
    insert into public.vibzguard_log (user_id, context, target_id, content, category, action, reason)
    values (new.sender_id, v_ctx, v_target, left(new.content, 4000), 'flood', 'block',
            case when length(new.content) > 4000 then 'Message trop long (4000 caractères maximum).'
                 when v_dupes >= 2 then 'Tu as déjà envoyé ce message plusieurs fois.'
                 when v_wizz >= 3 then 'Trop de Wizz d''un coup : attends une minute.'
                 else 'Tu envoies trop de messages à la suite : ralentis un peu.' end);
    return null;
  end if;

  -- Contenu (tous types de message : un faux « emoji » est analysé aussi)
  select * into v from public.vibzguard_check(new.content, v_ctx);
  new.is_flagged  := false;   -- ces colonnes ne sont jamais fournies par l'expéditeur
  new.flag_reason := null;
  if v.action is null then return new; end if;

  insert into public.vibzguard_log (user_id, context, target_id, content, category, action, reason)
  values (new.sender_id, v_ctx, v_target, new.content, v.category, v.action, v.reason);

  if v.action = 'block' then return null; end if;   -- le message n'est pas enregistré
  new.is_flagged  := true;
  new.flag_reason := case when v.action = 'warn' then v.reason end;   -- lu par l'expéditeur
  return new;
end $$;

drop trigger if exists vibzguard_messages on public.messages;
create trigger vibzguard_messages before insert on public.messages
  for each row execute function public.vibzguard_enforce();

drop trigger if exists vibzguard_salon_messages on public.salon_messages;
create trigger vibzguard_salon_messages before insert on public.salon_messages
  for each row execute function public.vibzguard_enforce();

-- ── 4. Messages privés : on ne peut plus réécrire un message ─────────
-- La règle « messages_mark_read » autorise la mise à jour pour marquer
-- comme lu, mais sans limiter les colonnes : un participant pouvait
-- modifier le texte d'un message déjà envoyé (y compris celui de l'autre).
create or replace function public.messages_only_read_flag()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon')   -- le Dashboard et la clé service_role restent libres
     and (new.content, new.sender_id, new.conversation_id, new.message_type, new.created_at, new.is_flagged, new.flag_reason)
         is distinct from
         (old.content, old.sender_id, old.conversation_id, old.message_type, old.created_at, old.is_flagged, old.flag_reason)
  then
    raise exception 'Seul le statut « lu » d''un message peut être modifié';
  end if;
  return new;
end $$;

drop trigger if exists messages_only_read_flag on public.messages;
create trigger messages_only_read_flag before update on public.messages
  for each row execute function public.messages_only_read_flag();

-- ── 5. File de revue pour l'équipe (Table Editor > vibzguard_review) ─
create or replace view public.vibzguard_review
with (security_invoker = true) as
  select l.id, l.created_at, l.action, l.category, l.context, p.display_name as auteur, l.content, l.reason, l.reviewed
    from public.vibzguard_log l
    left join public.profiles p on p.id = l.user_id
   where l.action in ('block', 'warn') and l.category not in ('flood', 'ton', 'cris')
   order by l.reviewed, l.created_at desc;
