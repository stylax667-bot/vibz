# Vibz — index de maintenance

Site de rencontres musiciens / amoureuses. Prod : https://www.vibzmusic.fr — GitHub : stylax667-bot/vibz (branche `main`, déploiement auto Vercel).
Stack : Next.js (TypeScript, pages/) + Supabase (auth, PostgreSQL, Realtime, edge functions) + Tailwind + Vercel.

> Ce disque (G:) vient de l'ancien Windows « Stylax ». Les anciens chemins `C:\Users\Stylax\...` correspondent désormais à `G:\Users\Stylax\...`.

## Dans ce dossier (Vibz+)
- `DEPLOIEMENT.md` — procédure de déploiement
- `android/GUIDE-PLAY-STORE.md`, `android/store/fiche-play-store.md`, `android/twa-manifest.json` — version Android (TWA, package fr.vibzmusic.app)
- `supabase/migrations/*.sql` — migrations, à passer dans le SQL Editor Supabase **AVANT** de pousser le code qui en dépend (ordre chronologique : 20260923 → 20261004)
- `supabase/schema.sql` — schéma initial (obsolète sur `blocks` : la base réelle utilise `blocker_id`/`blocked_id`), `supabase/finance_table.sql`
- `supabase/functions/` — edge functions (kofi-webhook, send-notification)
- `lib/assistant/config.ts` — assistant IA en veille (`ASSISTANT_ENABLED = false`)
- `.env.local` — clés Supabase (URL, anon, service_role) — ne jamais publier
- `start-vibz-local.bat` (lancement local, chemin G:), `.claude/launch.json` (`npm run dev`, port 3000)
- Poste actuel (compte Windows `chens`) : Git 2.56 + Node 26 / npm 11 installés le 11/11/2026 ; dépôt marqué `safe.directory` (créé sous l'ancien compte). Sous PowerShell, utiliser `npm.cmd` / `npx.cmd`

## Onglet Troc ↔ Vibz Troc (en ligne le 12/11/2026, commit 6172f23 ; site frère sur https://troc.vibzmusic.fr)
- Site frère : `G:\Users\Stylax\Documents\TrocMusic` (dossier), site « Vibz Troc » (même base Supabase, voir son CLAUDE.md). Adresse via `NEXT_PUBLIC_TROC_URL` (défaut https://troc.vibzmusic.fr ; `http://localhost:3001` dans `.env.local`)
- `components/troc/TrocPage.tsx` (5e onglet 🔁 : annonces en temps réel, fiche, publication rapide avec photo, `source='vibz'`), `lib/troc.ts` (liens, types, photos, intentions)
- Photos dans tchats/salons avec consentement : `PhotoShareButton` (📸), `PhotoShareBubble` (Voir / Non merci), `usePhotoShares` ; bucket PRIVÉ `chat-photos`, tables `photo_shares` + `photo_share_consents` ; l'auteur seul peut en faire une annonce
- Liens entrants depuis Vibz Troc : `?tab=troc|messenger&chat=<membre>&troc=<annonce>` mémorisés (sessionStorage) le temps de la connexion — `pages/index.tsx` + `AppLayout`
- Migrations, dans l'ordre, AVANT de pousser : `TrocMusic/supabase/migrations/20261111_trocmusic.sql` puis `supabase/migrations/20261112_troc_photos.sql`

## Documents liés hors de ce dossier
- `G:\Users\Stylax\Documents\Vibz Annexes\` — `LISEZ-MOI.md`, `Inscrits/` (export Excel des inscrits, données RGPD privées), `Site vitrine/` (https://vibz-vitrine.vercel.app)
- `G:\Users\Stylax\.claude\projects\C--Users-Stylax-Documents\memory\project_vibz.md` — **historique détaillé** de toutes les évolutions, choix de l'utilisateur et points en suspens (à lire en début de session)
- `G:\Users\Stylax\Documents\vibz-roadmap.html` — feuille de route
- `G:\Users\Stylax\Documents\guide-publication-vibz.html` — guide de publication
- `G:\Users\Stylax\Documents\vibz2_backup_v1_uncommitted_WIP.patch` — sauvegarde d'un travail non commité (20/09/2026)
- `G:\Users\Stylax\.claude\scheduled-tasks\vibz-ia-rappel-3-mois\`, `...\vibz-ia-rappel-6-mois\` — rappels sur l'activation payante de l'assistant IA
- `G:\Users\Stylax\Desktop\Vibz+ (local).lnk`, `Vibz+ (en ligne).url` — raccourcis (cible locale à mettre à jour)

## Points en suspens connus (au 01/10/2026)
- Expéditeur Resend encore `notifications@vibz-zeta.vercel.app` ; redéployer l'edge function send-notification
- Page d'accueil : vante une traduction automatique inexistante
- Bouton Microsoft affiché mais fournisseur azure désactivé dans Supabase
- App Meta (Facebook) pas encore « En ligne »
- `ANDROID_SHA256_FINGERPRINTS` vide sur Vercel ; publication Play Store à faire
- Carte Découvrir : points anonymes, non liés aux profils
