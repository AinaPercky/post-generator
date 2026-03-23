# Schéma Supabase pour les Posts Unifiés

## Vue d'ensemble

Ce schéma permet de stocker les 3 types de posts (Magazine Covers, Red Pill Posts, MisyFaTsy Posts) dans une seule table unifiée avec un champ `type` pour différencier.

## Script SQL d'installation

Copiez-collez ce code dans le **SQL Editor** de Supabase et exécutez-le:

```sql
-- Créer la table unifiée des posts (Magazine, RedPill, MisyFaTsy)
CREATE TABLE saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('magazine', 'redpill', 'misyfatsy')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID,
  author_name TEXT DEFAULT 'Anonyme',
  CONSTRAINT saved_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Créer les indexes pour les performances
CREATE INDEX saved_posts_type_idx ON saved_posts(type);
CREATE INDEX saved_posts_created_at_idx ON saved_posts(created_at DESC);
CREATE INDEX saved_posts_user_id_idx ON saved_posts(user_id);
CREATE INDEX saved_posts_type_user_idx ON saved_posts(type, user_id);

-- Activer Row Level Security (RLS)
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Politique: Lire tous les posts publics (type magazine avec user_id NULL = public)
CREATE POLICY "Lire les posts publics"
  ON saved_posts
  FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Politique: Créer ses propres posts
CREATE POLICY "Créer ses propres posts"
  ON saved_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Modifier ses propres posts
CREATE POLICY "Modifier ses propres posts"
  ON saved_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique: Supprimer ses propres posts
CREATE POLICY "Supprimer ses propres posts"
  ON saved_posts
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Structure de la table

| Colonne       | Type      | Description                                              |
| ------------- | --------- | -------------------------------------------------------- |
| `id`          | UUID      | Identifiant unique (auto-généré)                         |
| `type`        | TEXT      | Type de post: `'magazine'` / `'redpill'` / `'misyfatsy'` |
| `title`       | TEXT      | Titre/Headline du post                                   |
| `description` | TEXT      | Description courte optionnelle                           |
| `image_url`   | TEXT      | URL ou base64 de l'image principale                      |
| `metadata`    | JSONB     | Données additionnelles JSON (flexibles par type)         |
| `created_at`  | TIMESTAMP | Date de création                                         |
| `updated_at`  | TIMESTAMP | Date de dernière modification                            |
| `user_id`     | UUID      | ID du propriétaire (référence auth.users)                |
| `author_name` | TEXT      | Nom de l'auteur (fallback si user non authentifié)       |

## Exemples de données

### Magazine Cover Post

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "magazine",
  "title": "Mora kokoa ve ny fiainan'ny lehilahy sa ny an'ny vehivavy?",
  "description": "N°1 2026 - Une exploration sur les différences",
  "image_url": "data:image/png;base64,...",
  "metadata": {
    "issueNumber": "N°1 2026",
    "sceneDescription": "A lone figure walking on a winding path at sunset"
  },
  "user_id": "user-123",
  "author_name": "Jean Dupont"
}
```

### Red Pill Post

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "redpill",
  "title": "THE HARSH TRUTH",
  "description": "Most people are sleepwalking through life",
  "image_url": "data:image/png;base64,...",
  "metadata": {
    "template": "hero",
    "content": "Most people are sleepwalking through life, trading their potential for temporary comfort.",
    "punchline": "WAKE UP."
  },
  "user_id": "user-123",
  "author_name": "Jean Dupont"
}
```

### MisyFaTsy Post

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "type": "misyfatsy",
  "title": "Mon création MisyFaTsy",
  "image_url": "data:image/png;base64,...",
  "metadata": {
    "customField": "valeur"
  },
  "user_id": "user-123",
  "author_name": "Jean Dupont"
}
```

## Sécurité avec RLS

### Permissions par opération

```
SELECT (Lecture):
├── Tous les posts avec user_id = NULL (publics)
├── Ses propres posts (user_id = auth.uid())

INSERT (Créer):
├── user_id doit = auth.uid()
├── Type doit être valide

UPDATE (Éditer):
├── user_id doit = auth.uid()

DELETE (Supprimer):
├── user_id doit = auth.uid()
```

## Interrogations courantes

### Récupérer tous les posts Magazine

```sql
SELECT * FROM saved_posts
WHERE type = 'magazine'
ORDER BY created_at DESC;
```

### Récupérer les posts d'un utilisateur

```sql
SELECT * FROM saved_posts
WHERE user_id = 'user-123'
ORDER BY created_at DESC;
```

### Récupérer les posts d'un type spécifique pour un utilisateur

```sql
SELECT * FROM saved_posts
WHERE type = 'magazine' AND user_id = 'user-123'
ORDER BY created_at DESC;
```

### Chercher par titre

```sql
SELECT * FROM saved_posts
WHERE type = 'magazine' AND title ILIKE '%recherche%'
ORDER BY created_at DESC;
```

## API Service TypeScript

Le service `lib/postService.ts` expose:

```typescript
// Sauvegarder un nouveau post
savePost(post: SavedPost): Promise<SavedPost | null>

// Récupérer les posts d'un type spécifique
getPostsByType(type: PostType, filters?: { search?, limit?, offset? }): Promise<SavedPost[]>

// Récupérer un post spécifique
getPostById(id: string): Promise<SavedPost | null>

// Mettre à jour un post
updatePost(id: string, updates: Partial<SavedPost>): Promise<SavedPost | null>

// Supprimer un post
deletePost(id: string): Promise<boolean>

// S'abonner aux changements temps réel
subscribeToPostChanges(type: PostType, callback: (posts: SavedPost[]) => void)
```

## Migration depuis Firebase (optionnel)

Si vous aviez des données dans Firebase, voici comment les migrer:

```sql
-- Exemple: Convertir les anciennes données Magazine en nouvelle structure
INSERT INTO saved_posts (type, title, description, image_url, metadata, user_id, author_name, created_at)
SELECT
  'magazine'::text as type,
  headline as title,
  NULL as description,
  imageUrl as image_url,
  jsonb_build_object('issueNumber', issueNumber, 'sceneDescription', sceneDescription)::jsonb as metadata,
  userId as user_id,
  authorName as author_name,
  to_timestamp(createdAt / 1000.0)::timestamp as created_at
FROM old_magazine_issues;
```

## Performance

- **Indexes on type**: Accélère les requêtes par type
- **Indexes on created_at**: Accélère les tris chronologiques
- **Indexes on user_id**: Accélère les lookups par utilisateur
- **Composite index (type, user_id)**: Optimise les requêtes combinées

Les requêtes típiques seront rapides même avec des milliers de posts.
