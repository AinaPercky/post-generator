# 📖 API Reference - Post Service

## Vue d'ensemble

Le service `postService.ts` fournit une API complète pour gérer les posts avec des opérations CRUD et changements temps réel.

## Installation

```typescript
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  subscribeToPostChanges,
} from "@/lib/postService";
```

---

## CREATE - Créer un Post

### `createPost(post: Post): Promise<Post | null>`

Crée un nouveau post dans la base de données.

**Paramètres:**

```typescript
post: {
  title: string;              // Requis
  content: string;            // Requis
  author_name: string;        // Requis
  category?: string;          // Optionnel, défaut: 'général'
  image_url?: string;         // Optionnel
  status?: 'draft' | 'published' | 'archived';  // Optionnel, défaut: 'draft'
}
```

**Retour:**

```typescript
{
  id: string;
  title: string;
  content: string;
  author_name: string;
  category: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
}
```

**Exemple:**

```typescript
try {
  const post = await createPost({
    title: "Mon premier post",
    content: "Contenu du post...",
    author_name: "Jean Dupont",
    category: "article",
    status: "published",
  });
  console.log("Post créé:", post);
} catch (error) {
  console.error("Erreur:", error);
}
```

**Erreurs possibles:**

- `Error`: Titre ou contenu manquants
- `Error`: Erreur de base de données Supabase

---

## READ - Récupérer les Posts

### `getAllPosts(filters?: Filters): Promise<Post[]>`

Récupère tous les posts avec filtrage optionnel.

**Paramètres (optionnels):**

```typescript
filters?: {
  search?: string;           // Recherche dans title et content
  category?: string;         // Filtrer par catégorie
  status?: string;          // Filtrer par statut
  limit?: number;           // Défaut: 20
  offset?: number;          // Défaut: 0 (pour pagination)
}
```

**Retour:**

```typescript
Post[]  // Array de posts
```

**Exemples:**

_Récupérer tous les posts (défaut: 20 derniers):_

```typescript
const posts = await getAllPosts();
```

_Avec recherche:_

```typescript
const results = await getAllPosts({
  search: "javascript",
});
```

_Avec filtre catégorie:_

```typescript
const articles = await getAllPosts({
  category: "article",
});
```

_Avec filtres combinés:_

```typescript
const published = await getAllPosts({
  search: "react",
  category: "tutorial",
  status: "published",
  limit: 50,
  offset: 0,
});
```

_Pagination (page 2, 20 par page):_

```typescript
const page2 = await getAllPosts({
  limit: 20,
  offset: 20, // Saute les 20 premiers
});
```

**Notes:**

- La recherche est case-insensitive (ILIKE)
- Tri par `created_at` DESC (les plus récents d'abord)
- Retourne array vide si aucun résultat

---

### `getPostById(id: string): Promise<Post | null>`

Récupère un post spécifique par son ID.

**Paramètres:**

```typescript
id: string; // UUID du post
```

**Retour:**

```typescript
Post | null; // Post ou null si non trouvé
```

**Exemple:**

```typescript
const post = await getPostById("123e4567-e89b-12d3-a456-426614174000");

if (post) {
  console.log("Post trouvé:", post.title);
} else {
  console.log("Post non trouvé");
}
```

**Erreurs possibles:**

- `null`: Post n'existe pas
- `Error`: Autre erreur base de données

---

## UPDATE - Mettre à Jour un Post

### `updatePost(id: string, updates: Partial<Post>): Promise<Post | null>`

Met à jour un post existant.

**Paramètres:**

```typescript
id: string;              // UUID du post
updates: {
  title?: string;
  content?: string;
  author_name?: string;
  category?: string;
  image_url?: string;
  status?: string;
  // Note: created_at, updated_at, id sont auto-gérés
}
```

**Retour:**

```typescript
Post | null; // Post mis à jour ou null
```

**Exemple:**

```typescript
try {
  const updated = await updatePost("post-id-here", {
    title: "Nouveau titre",
    status: "published",
  });
  console.log("Post mis à jour:", updated);
} catch (error) {
  console.error("Erreur:", error);
}
```

**Comportement:**

- `updated_at` est automatiquement défini à NOW()
- Les champs non fournis restent inchangés
- L'auteur ne peut modifier que ses propres posts (RLS)

---

## DELETE - Supprimer un Post

### `deletePost(id: string): Promise<boolean>`

Supprime un post de la base de données.

**Paramètres:**

```typescript
id: string; // UUID du post à supprimer
```

**Retour:**

```typescript
boolean; // true si succès, erreur levée sinon
```

**Exemple:**

```typescript
try {
  const success = await deletePost("post-id-here");
  if (success) {
    console.log("Post supprimé");
  }
} catch (error) {
  console.error("Erreur lors de la suppression:", error);
}
```

**Comportement:**

- L'utilisateur ne peut supprimer que ses propres posts (RLS)
- Une fois supprimé, le post ne peut pas être récupéré
- Idéalement, afficher un dialogue de confirmation avant

---

## SUBSCRIBE - Changements Temps Réel

### `subscribeToPostChanges(callback: (posts: Post[]) => void)`

S'abonne aux changements en temps réel sur la table des posts.

**Paramètres:**

```typescript
callback: (posts: Post[]) => void  // Fonction appelée quand posts changent
```

**Retour:**

```typescript
subscription; // Objet subscription pour se désabonner
```

**Exemple:**

```typescript
const subscription = subscribeToPostChanges((posts) => {
  console.log("Posts mis à jour:", posts);
  // Mettre à jour l'UI
});

// Plus tard, se désabonner:
await subscription.unsubscribe();
```

**Comportement:**

- S'écoute sur INSERT, UPDATE, DELETE
- Rappelle la fonction avec tous les posts
- Utile pour les mises à jour temps réel collaboratif

---

## Types & Interfaces

### Post

```typescript
interface Post {
  id?: string;
  title: string;
  content: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  author_name: string;
  category?: string;
  status?: "draft" | "published" | "archived";
}
```

### Statuts Valides

- `draft` - Brouillon (visible seulement pour l'auteur)
- `published` - Publié (visible pour tous)
- `archived` - Archivé (masqué par défaut)

### Catégories Disponibles

- `général`
- `article`
- `tutoriel`
- `actualité`
- `réflexion`
- `autre`

---

## Gestion des Erreurs

Toutes les fonctions lancent des erreurs en cas de problème:

```typescript
try {
  const post = await createPost(data);
} catch (error) {
  if (error instanceof Error) {
    console.error("Message d'erreur:", error.message);
  }
}
```

### Erreurs Courantes

| Erreur                                       | Cause                 | Solution                    |
| -------------------------------------------- | --------------------- | --------------------------- |
| `Supabase environment variables not set`     | Config manquante      | Vérifiez `.env.local`       |
| `Failed to insert row`                       | Champ requis manquant | Vérifiez title et content   |
| `new row violates row-level security policy` | Pas propriétaire      | Seul l'auteur peut modifier |
| `Failed to connect to Supabase`              | Réseau/Supabase down  | Vérifiez connexion          |

---

## Patterns Courants

### Filtre par statut

```typescript
// Seulement les posts publiés
const published = await getAllPosts({
  status: "published",
});

// Mes brouillons
const drafts = await getAllPosts({
  status: "draft",
});
```

### Recherche avec pagination

```typescript
const query = "react";
const pageSize = 20;
const currentPage = 1;
const offset = (currentPage - 1) * pageSize;

const results = await getAllPosts({
  search: query,
  limit: pageSize,
  offset: offset,
});
```

### Modal de confirmation avant suppression

```typescript
const handleDelete = async (id: string) => {
  if (window.confirm("Êtes-vous sûr?")) {
    try {
      await deletePost(id);
      // Rafraîchir la liste
    } catch (error) {
      alert("Erreur: " + error.message);
    }
  }
};
```

### Réaction aux changements temps réel

```typescript
useEffect(() => {
  const subscription = subscribeToPostChanges((posts) => {
    setPosts(posts); // Mettre à jour le state
  });

  // Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Performance & Optimisation

### Pagination Recommandée

```typescript
// Au lieu de charger tous les posts d'un coup:
const page1 = await getAllPosts({
  limit: 20,
  offset: 0,
});

const page2 = await getAllPosts({
  limit: 20,
  offset: 20,
});
```

### Débouncing pour la Recherche

```typescript
const [searchTerm, setSearchTerm] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    // Seul le dernier appelle après 300ms
    searchPosts(searchTerm);
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);
```

### Mise en Cache Locale

```typescript
// Éviter les requêtes répétées
let cachedPosts: Post[] = [];
let lastFetch: number = 0;

async function getCachedPosts() {
  const now = Date.now();
  if (cachedPosts.length && now - lastFetch < 5000) {
    return cachedPosts; // Cache 5 secondes
  }

  cachedPosts = await getAllPosts();
  lastFetch = now;
  return cachedPosts;
}
```

---

## Versioning

- API Version: 1.0
- Service: @supabase/supabase-js ^2.0
- Last Updated: Mars 2026

---

## Support & Documentation

- [README.md](./README.md) - Vue d'ensemble du projet
- [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) - Configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique
- [Supabase Docs](https://supabase.com/docs) - Documentation Supabase
