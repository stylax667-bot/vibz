# 🚀 GUIDE DE DÉPLOIEMENT VIBZ
## De zéro à en ligne en 30 minutes

---

## ÉTAPE 1 — Créer ton compte GitHub (5 min)

1. Va sur **github.com**
2. Clique **Sign up**
3. Choisis un nom d'utilisateur (ex: vibz-app)
4. Valide ton email

---

## ÉTAPE 2 — Créer ton projet Supabase (8 min)

1. Va sur **supabase.com**
2. Clique **Start your project**
3. Connecte-toi avec GitHub (pratique !)
4. Clique **New project**
5. Remplis :
   - **Name** : vibz
   - **Database Password** : un mot de passe fort (note-le !)
   - **Region** : West EU (Ireland) — le plus proche de la France
6. Clique **Create new project** — attends 2 minutes

### Configurer la base de données :
7. Dans le menu gauche, clique **SQL Editor**
8. Clique **New query**
9. Copie-colle TOUT le contenu du fichier `supabase/schema.sql`
10. Clique **Run** (bouton vert)
11. Tu dois voir "Success" ✅

### Récupérer tes clés API :
12. Menu gauche → **Settings** → **API**
13. Note ces deux valeurs :
    - **Project URL** → ressemble à `https://abcdefgh.supabase.co`
    - **anon public key** → longue chaîne de caractères

---

## ÉTAPE 3 — Mettre le code en ligne sur GitHub (5 min)

### Option A — Via l'interface web (recommandé pour débutants) :

1. Sur github.com, clique le **+** en haut à droite → **New repository**
2. Nom : **vibz**
3. Laisse tout par défaut, clique **Create repository**
4. Sur la page suivante, clique **uploading an existing file**
5. Glisse-dépose TOUS les fichiers du dossier vibz
6. Clique **Commit changes**

### Option B — Via terminal (si tu as Git installé) :
```bash
cd vibz
git init
git add .
git commit -m "Initial Vibz commit"
git remote add origin https://github.com/TON_USERNAME/vibz.git
git push -u origin main
```

---

## ÉTAPE 4 — Déployer sur Vercel (5 min)

1. Va sur **vercel.com**
2. Clique **Sign Up** → connecte-toi avec GitHub
3. Clique **Add New Project**
4. Tu vois ton repo **vibz** → clique **Import**
5. Dans **Environment Variables**, ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = ta Project URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ta anon key Supabase
6. Clique **Deploy**
7. Attends 2-3 minutes ⏳

🎉 **TON SITE EST EN LIGNE !**

Vercel te donne une URL du type : `https://vibz-xxxx.vercel.app`

---

## ÉTAPE 5 — Configurer l'authentification Supabase (2 min)

1. Dans Supabase → **Authentication** → **URL Configuration**
2. Dans **Site URL** : mets ton URL Vercel (ex: `https://vibz-xxxx.vercel.app`)
3. Dans **Redirect URLs** : ajoute `https://vibz-xxxx.vercel.app/**`
4. Sauvegarde

---

## ÉTAPE 6 — Ton domaine personnalisé (optionnel, ~10€/an)

1. Achète un domaine sur **OVH** ou **Namecheap** (ex: vibz.fr ~10€/an)
2. Dans Vercel → ton projet → **Settings** → **Domains**
3. Ajoute ton domaine et suis les instructions DNS

---

## CE QUE TU AS MAINTENANT

✅ Site de rencontre amoureuse & musicale  
✅ Inscription / Connexion sécurisée  
✅ Profils avec réseaux sociaux (SoundCloud, Instagram, YouTube, LinkedIn, Facebook, TikTok...)  
✅ Recherche par instrument, genre, ville, réseau social  
✅ Messagerie style MSN avec Wizz et émojis  
✅ Salons style Caramail avec modération IA (VibzGuard)  
✅ Système de likes et matches  
✅ Blocage d'utilisateurs  
✅ Base de données sécurisée (RLS Supabase)  
✅ Anti-harcèlement automatique  
✅ Gratuit à héberger (Vercel + Supabase gratuit jusqu'à ~50k utilisateurs)  

---

## COÛTS RÉELS

| Service | Gratuit jusqu'à | Prix après |
|---------|-----------------|------------|
| Vercel | 100GB bandwidth/mois | ~20$/mois |
| Supabase | 500MB DB, 50k users | ~25$/mois |
| Domaine | — | ~10€/an |

**Pour les 50 000 premiers utilisateurs : 0€/mois** 🎉

---

## PROCHAINES AMÉLIORATIONS SUGGÉRÉES

1. **Temps réel** : Activer Supabase Realtime pour les messages instantanés
2. **Photos de profil** : Activer Supabase Storage
3. **Notifications email** : Intégrer Resend.com (gratuit)
4. **Modération IA avancée** : Connecter l'API Claude d'Anthropic
5. **App mobile** : Exporter en PWA (déjà compatible !)
6. **Viralité** : Ajouter partage de profil sur réseaux sociaux

---

## EN CAS DE PROBLÈME

- **Erreur Supabase** : Vérifie que les variables d'environnement sont bien dans Vercel
- **Page blanche** : Regarde les logs dans Vercel → ton projet → Deployments → Functions
- **Aide** : Contacte-moi et je t'aide à déboguer !
