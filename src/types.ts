// Types de posts supportés
export type PostType = 'magazine' | 'redpill' | 'misyfatsy';

// Interface unifiée pour tous les types de posts
export interface SavedPost {
  id?: string;
  type: PostType;                           // magazine | redpill | misyfatsy
  title: string;                            // Headline/title du post
  description?: string;                     // Description courte
  imageUrl: string;                         // Image principale (base64 ou URL)
  metadata?: Record<string, unknown>;       // Données additionnelles selon le type
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  authorName: string;
}

// Interface spécifique Magazine
export interface MagazineIssue {
  id: string;
  issueNumber: string;
  headline: string;
  sceneDescription: string;
  imageUrl: string;
  createdAt: number;
  userId: string;
  authorName: string;
}

// Interface spécifique Red Pill Post
export interface RedPillPost extends SavedPost {
  type: 'redpill';
  metadata?: {
    template?: 'hero' | 'split' | 'card' | 'quote' | 'warning' | 'versus';
    content?: string;
    punchline?: string;
    [key: string]: unknown;
  };
}

// Interface spécifique MisyFaTsy
export interface MisyFaTsyPost extends SavedPost {
  type: 'misyfatsy';
  metadata?: {
    [key: string]: unknown;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
}
