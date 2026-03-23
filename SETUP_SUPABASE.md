# Configuration Supabase

## Vue d'ensemble

Ce projet utilise Supabase comme base de données backend pour gérer les **3 types de posts**:

- 📑 **Magazine Covers** - Couvertures de magazines générées par IA
- 🔴 **Red Pill Posts** - Posts motivationnels avec templates
- 🎨 **MisyFaTsy Studio** - Créations artistiques personnalisées

Tous les types utilisent une **table unifiée** pour le stockage.

## Prérequis

1. Un compte Supabase (https://supabase.com)
2. Un projet Supabase créé

## Étapes d'installation

### 1. Créer un compte et un projet Supabase

1. Allez sur https://supabase.com et créez un compte
2. Créez un nouveau projet
3. Attendez que le projet soit initialisé

### 2. Obtenir les clés API

1. Dans le tableau de bord Supabase, allez à "Project Settings" > "API"
2. Copiez:
   - **Project URL** (VITE_SUPABASE_URL)
   - **Anon Public Key** (VITE_SUPABASE_ANON_KEY)

### 3. Créer la table unifiée des posts

Dans Supabase, allez à **SQL Editor** et exécutez le script de [UNIFIED_SCHEMA.md](./UNIFIED_SCHEMA.md):

**IMPORTANT**: Consultez [UNIFIED_SCHEMA.md](./UNIFIED_SCHEMA.md) pour le script SQL complet avec tous les indexes et RLS policies!

### 4. Configurer les variables d'environnement

Créez ou modifiez le fichier `.env.local` à la racine du projet:

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon
GEMINI_API_KEY=votre_clé_gemini
```

### 5. Installer les dépendances

```bash
npm install
```

### 6. Lancer le projet

```bash
npm run dev
```

## Fonctionnalités CRUD

### Comment ça marche

Chaque générateur (Magazine Cover, Red Pill Post, MisyFaTsy Studio) peut:

1. **Créer** - Générer une création et la sauvegarder dans Supabase
2. **Lire** - Charger les créations sauvegardées d'un type spécifique
3. **Mettre à jour** - Éditer une création existante
4. **Supprimer** - Supprimer une création de la base de données
5. **Rechercher** - Filtrer par titre ou autres critères

### API Service (postService.ts)

Le fichier `postService.ts` expose les fonctions suivantes pour les 3 types:

- `savePost(post: SavedPost)` - Sauvegarder un nouveau post
- `getPostsByType(type: 'magazine'|'redpill'|'misyfatsy', filters)` - Récupérer les posts d'un type
- `getPostById(id: string)` - Récupérer une création spécifique
- `updatePost(id: string, updates)` - Mettre à jour une création
- `deletePost(id: string)` - Supprimer une création
- `subscribeToPostChanges(type, callback)` - S'abonner aux changements temps réel

## Architecture

### Structure des fichiers

```
src/
├── supabase.ts              # Configuration Supabase
├── lib/
│   └── postService.ts       # Service API unifié pour les 3 types
├── components/
│   ├── CoverPreview.tsx     # Aperçu Magazine Cover
│   ├── MagazineLibrary.tsx  # Bibliothèque des magazines
│   ├── RedPillGenerator.tsx # Générateur Red Pill (avec save/load)
│   ├── MisyFaTsyGenerator.tsx # Générateur MisyFaTsy (avec save/load)
│   └── ...
├── types.ts                 # Interfaces TypeScript (SavedPost, PostType, etc)
└── App.tsx                  # Composant principal avec onglets
```

## Sécurité

### Row Level Security (RLS)

Les politiques RLS garantissent que:

- Seuls les posts publiés peuvent être lus par les autres utilisateurs
- Chaque utilisateur ne peut modifier/supprimer que ses propres posts
- L'authentification est requise pour créer des posts

### Bonnes pratiques

1. Ne commitez jamais votre `.env.local` sur Git
2. Utilisez des clés d'accès restreintes en production
3. Activez HTTPS pour toutes les connexions
4. Limitez les révisions de colonnes via RLS

## Dépannage

### Erreur: "Supabase environment variables not set"

Vérifiez que `.env.local` contient:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Erreur: "Failed to connect to Supabase"

1. Vérifiez que vos clés API sont correctes
2. Vérifiez votre connexion réseau
3. Vérifiez que le projet Supabase est actif

### Les posts ne s'affichent pas

1. Vérifiez que la table `posts` existe dans Supabase
2. Vérifiez que RLS n'est pas trop restrictif
3. Consultez les logs Supabase pour les erreurs

## Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [CLI Supabase](https://supabase.com/docs/guides/cli)
- [Exemples JavaScript](https://supabase.com/docs/reference/javascript/introduction)
