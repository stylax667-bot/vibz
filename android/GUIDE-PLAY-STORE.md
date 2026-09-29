# Publier Vibz sur le Google Play Store

L'app Android est une **TWA** (Trusted Web Activity) : elle ouvre www.vibzmusic.fr en plein écran,
sans barre d'adresse, avec le moteur de Chrome. Conséquences :
- chaque mise à jour du site est tout de suite dans l'app, sans republier sur le Play Store ;
- la connexion Google / Discord marche (Google bloque la connexion dans les « webviews » classiques, pas dans les TWA) ;
- l'app est gratuite pour les membres. Le seul coût est le compte développeur Google : **25 $ une fois**.

Identifiant de l'app : `fr.vibzmusic.app` (définitif une fois publié).

---

## Étape 0 — Mettre le site à jour (avant tout)

1. Passer la migration `supabase/migrations/20260930_suppression_compte.sql` dans Supabase SQL Editor
   (sans elle, le bouton « Supprimer mon compte » peut échouer).
2. Pousser le code sur `main` (Vercel déploie).
3. Vérifier que ces adresses répondent :
   - https://www.vibzmusic.fr/manifest.webmanifest
   - https://www.vibzmusic.fr/suppression-compte
   - https://www.vibzmusic.fr/.well-known/assetlinks.json

## Étape 1 — Créer le compte développeur

https://play.google.com/console/signup → compte **personnel** → 25 $ → vérification d'identité (pièce d'identité, quelques jours).

## Étape 2 — Fabriquer l'app (sans rien installer)

1. Aller sur https://www.pwabuilder.com et entrer `https://www.vibzmusic.fr`.
2. **Package For Stores** → **Android** → **Generate Package**, puis *Options* :
   - Package ID : `fr.vibzmusic.app`
   - App name : `Vibz` · Launcher name : `Vibz`
   - Version : `1.0.0` · Version code : `1`
   - Host : `www.vibzmusic.fr` · Start URL : `/?source=app`
   - Status bar / nav bar : `#FFFFFF`
   - Signing key : **Create new** (remplir nom + mot de passe)
3. Télécharger le zip. Il contient :
   - `*.aab` → le fichier à envoyer au Play Store
   - `signing.keystore` + `signing-key-info.txt` → **À GARDER PRÉCIEUSEMENT** (clé USB + cloud).
     Sans eux, impossible de mettre l'app à jour un jour.
   - `assetlinks.json` → contient l'empreinte de cette clé

> Alternative en ligne de commande : `android/twa-manifest.json` est prêt pour Bubblewrap
> (`npx @bubblewrap/cli build`, installe Java + le SDK Android au premier lancement).

## Étape 3 — Créer l'app dans la Play Console

Créer une app → nom `Vibz`, langue Français, **Application**, **Gratuite**.

Dans *Tableau de bord → Configurer l'application*, remplir :

| Rubrique | Quoi mettre |
|---|---|
| Règles de confidentialité | https://www.vibzmusic.fr/confidentialite |
| Accès à l'application | « Certaines fonctionnalités sont limitées » → donner **un compte de test** (email + mot de passe) créé exprès pour les vérificateurs Google |
| Annonces | Non, pas de publicité |
| Classification du contenu | Catégorie « Réseau social / communication ». Répondre honnêtement : interactions entre utilisateurs = oui, partage de position = non. Résultat attendu : 18+ / PEGI 18 |
| Public cible | **18 ans et plus uniquement** |
| Sécurité des données | voir `android/store/fiche-play-store.md` |
| Suppression de compte | https://www.vibzmusic.fr/suppression-compte |
| Catégorie | Rencontres (ou Social) |

Fiche du Store (textes prêts dans `android/store/fiche-play-store.md`) :
- Icône 512×512 : `android/store/play-icon-512.png`
- Image de présentation 1024×500 : `android/store/play-feature-1024x500.png`
- Captures d'écran : **au moins 2** captures de téléphone, à faire soi-même sur l'app (Découvrir, Messagerie, Salons, Profil) — sans vrais noms ni vraies photos de membres.

## Étape 4 — Relier l'app au site (enlève la barre d'adresse)

1. Play Console → *Test et publication → Configuration → Intégrité de l'application → Signature d'application* :
   copier l'**empreinte SHA-256 de la clé de signature d'application**.
2. Récupérer aussi l'empreinte SHA-256 dans le `assetlinks.json` fourni par PWABuilder (clé d'importation).
3. Vercel → projet vibz → *Settings → Environment Variables* → ajouter
   `ANDROID_SHA256_FINGERPRINTS` = les deux empreintes séparées par une virgule, puis *Redeploy*.
4. Vérifier : https://www.vibzmusic.fr/.well-known/assetlinks.json doit afficher les deux empreintes.

Si la barre d'adresse Chrome apparaît en haut de l'app, c'est que cette étape n'est pas faite ou pas encore déployée.

## Étape 5 — Test fermé obligatoire (comptes personnels)

Google impose aux nouveaux comptes personnels : **12 testeurs minimum pendant 14 jours d'affilée** avant de pouvoir publier pour tout le monde.

1. *Tests → Test fermé* → créer un canal → envoyer le `.aab`.
2. Ajouter les adresses Gmail de 12 testeurs (amis, groupe de musique…). Ils doivent **accepter l'invitation et installer l'app**, et la garder 14 jours.
3. Après 14 jours : *Demander l'accès à la production* → répondre au questionnaire → envoi en production.

L'examen Google prend en général de quelques jours à une semaine.

## Mises à jour

- Changement du site → rien à faire côté Play Store.
- Changement de l'icône, du nom ou des couleurs de l'app → régénérer sur PWABuilder **avec la même clé** (« Use existing ») et augmenter le *Version code* (2, 3…).

## Crédits
Icône : papillon Twemoji © Twitter/X & contributeurs, licence CC-BY 4.0 (mention ajoutée dans les mentions légales).
