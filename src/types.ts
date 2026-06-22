export type PostType = 'magazine' | 'redpill' | 'misyfatsy' | 'top5' | 'legend';

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
    categoryId?: 'reminder' | 'error-of' | 'harsh-truth';
    content?: string;
    punchline?: string;
    bodyTextAlign?: 'left' | 'center' | 'right' | 'justify';
    bodyLineHeight?: number;
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

export interface Top5Item {
  id: string;
  rank: number;
  title: string;
  description: string;
  imageUrl: string;
}

export interface Top5Post extends SavedPost {
  type: 'top5';
  metadata?: {
    categorySubtitle: string;
    items: Top5Item[];
    [key: string]: unknown;
  };
}

export interface LegendCard {
  name: string;
  surname: string;
  era: string;
  origin: string;
  characterClass: 'Guerrier' | 'Explorateur' | 'Savant' | 'Artiste' | 'Fictionnel' | 'Penseur' | 'Dirigeant' | 'Athlete';
  rarity: 'Commun' | 'Rare' | 'Epique' | 'Legendaire' | 'Mythique';
  specialties: [string, string, string];
  keyAchievement: string;
  flaw: string;
  quote: string;
  portraitUrl: string | null;
  cardNumber: number;
}

export interface LegendPost extends SavedPost {
  type: 'legend';
  metadata?: {
    card: LegendCard;
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
