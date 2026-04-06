# MoodTrack 🌊

Application de suivi d'humeur — Next.js 14 + Supabase + Vercel

## Stack
- **Frontend** : Next.js 14 (App Router) + TypeScript
- **Base de données** : Supabase (PostgreSQL + Auth)
- **Hébergement** : Vercel (gratuit)
- **PWA** : Installable sur Android/iOS depuis le navigateur

---

## 🚀 Déploiement en 5 étapes

### Étape 1 — Créer le projet Supabase
1. Aller sur [supabase.com](https://supabase.com) → Nouveau projet
2. Aller dans **SQL Editor** → coller et exécuter tout le contenu de `supabase-schema.sql`
3. Dans **Settings → API**, copier :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ garder secret
4. Dans **Authentication → Settings** :
   - Désactiver **"Enable email confirmations"** (optionnel pour usage privé)
   - Désactiver **"Enable sign up"** pour bloquer les inscriptions publiques

### Étape 2 — Créer le premier compte admin
1. Dans Supabase → **Authentication → Users** → Add user
2. Saisir email + mot de passe
3. Dans **SQL Editor**, exécuter :
   ```sql
   UPDATE public.profiles SET is_admin = true WHERE email = 'votre@email.com';
   ```

### Étape 3 — Déployer sur Vercel
1. Pousser ce dossier sur GitHub
2. Aller sur [vercel.com](https://vercel.com) → Import Git Repository
3. Dans **Environment Variables**, ajouter :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Cliquer **Deploy** — c'est tout !

### Étape 4 — Créer des comptes utilisateurs
- Connectez-vous avec le compte admin
- Aller dans **Profil → Administration**
- Créer des comptes depuis l'interface

### Étape 5 — Installer l'appli sur Android
1. Ouvrir l'URL Vercel dans **Chrome** sur Android
2. Menu (⋮) → **"Ajouter à l'écran d'accueil"**
3. L'appli s'installe comme une vraie application

---

## 📁 Structure du projet

```
moodtrack/
├── app/
│   ├── layout.tsx          # Layout + PWA meta tags
│   ├── page.tsx            # Redirection automatique
│   ├── login/page.tsx      # Page de connexion
│   ├── dashboard/page.tsx  # Saisie d'humeur du jour
│   ├── stats/page.tsx      # Statistiques & graphiques
│   ├── profile/page.tsx    # Profil utilisateur
│   ├── admin/page.tsx      # Gestion des comptes (admin)
│   └── api/admin/
│       └── create-user/    # API création de compte
├── components/
│   ├── BottomNav.tsx       # Barre de navigation mobile
│   ├── LoginForm.tsx
│   ├── DashboardClient.tsx
│   ├── StatsClient.tsx
│   ├── ProfileClient.tsx
│   └── AdminClient.tsx
├── lib/
│   ├── supabase.ts         # Client navigateur
│   ├── supabase-server.ts  # Client serveur (SSR)
│   └── types.ts            # Types TypeScript
├── public/
│   └── manifest.json       # Configuration PWA
├── middleware.ts            # Protection des routes
├── supabase-schema.sql     # Schéma base de données
└── .env.local.example      # Variables d'environnement
```

---

## ✨ Fonctionnalités

- **Saisie d'humeur** : score 1–10 + commentaire optionnel, modifiable dans la journée
- **Série 🔥** : jours consécutifs avec au moins une entrée
- **Statistiques** : graphique linéaire, distribution par score, moyenne, historique
- **Filtres** : 7 derniers jours, 30 jours, tout
- **Comptes fermés** : seul l'admin crée des comptes
- **PWA** : installable sur Android & iOS, fonctionne comme une app native
- **Dark mode natif** : interface sombre optimisée mobile

---

## 💡 Développement local

```bash
# 1. Installer les dépendances
npm install

# 2. Créer .env.local (copier .env.local.example)
cp .env.local.example .env.local
# Remplir avec vos clés Supabase

# 3. Lancer en développement
npm run dev
# → http://localhost:3000
```
