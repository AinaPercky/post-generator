/**
 * legendService.ts
 * ---------------------------------------------------------------
 * Service CRUD dedie aux cartes du LegendGenerator.
 *
 * Responsabilites :
 *  - Mapper WarriorCard (format interne) <=> SavedPost (format Supabase)
 *  - Exposer : loadLegendCards / saveLegendCard / updateLegendCard / deleteLegendCard / batchSaveLegendCards
 *  - Deleguer les appels reseau au postService generique existant
 *  - Garantir l'unicité des noms de cartes (DuplicateLegendError)
 * ---------------------------------------------------------------
 */

import { savePost, updatePost, deletePost, getPostsByType } from './postService';
import { SavedPost } from '../types';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

/**
 * Representation interne d'une carte dans LegendGenerator.
 * Le champ supabaseId lie la carte locale a sa ligne Supabase.
 */
export interface WarriorCard {
  id: number;
  /** UUID Supabase - absent si la carte n'a pas encore ete sauvegardee */
  supabaseId?: string;
  numero: string;
  nom: string;
  rarete: 'C' | 'R' | 'E' | 'L' | 'G';
  surnom: string;
  portraitUrl: string;
  classe: string;
  specialite1: string;
  specialite2: string;
  iconSpecialite1?: string;
  iconSpecialite2?: string;
  realisation: string;
  faille: string;
  citation: string;
  theme: 'gold' | 'fire' | 'void' | 'ice' | 'emerald';
  hp: number;
  atk: number;
}

// ----------------------------------------------------------------
// Erreur métier — Doublon de carte
// ----------------------------------------------------------------

/**
 * Erreur levée quand une carte Legend avec le même nom existe déjà.
 * Permet de distinguer ce cas d'une erreur réseau ou d'une erreur DB générique.
 */
export class DuplicateLegendError extends Error {
  constructor(nom: string) {
    super(`Une carte nommée "${nom}" existe déjà dans la collection.`);
    this.name = 'DuplicateLegendError';
  }
}

// ----------------------------------------------------------------
// Normalisation du nom (insensible à la casse et aux accents)
// ----------------------------------------------------------------

/**
 * Normalise un nom de carte pour la comparaison d'unicité :
 * - trim, lowercase, suppression des diacritiques (accents)
 * Exemple : "Léonard De Vinci" === "leonard de vinci"
 */
export function normalizeLegendName(nom: string): string {
  return nom
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ----------------------------------------------------------------
// Mapping
// ----------------------------------------------------------------

/** Convertit une WarriorCard locale en SavedPost compatible Supabase. */
export function warriorCardToSavedPost(card: WarriorCard): SavedPost {
  return {
    id: card.supabaseId,
    type: 'legend',
    title: card.nom,
    description: card.surnom,
    imageUrl: card.portraitUrl,
    authorName: 'Anonyme',
    metadata: {
      card: {
        localId:         card.id,
        numero:          card.numero,
        rarete:          card.rarete,
        classe:          card.classe,
        specialite1:     card.specialite1,
        specialite2:     card.specialite2,
        iconSpecialite1: card.iconSpecialite1,
        iconSpecialite2: card.iconSpecialite2,
        realisation:     card.realisation,
        faille:          card.faille,
        citation:        card.citation,
        theme:           card.theme,
        hp:              card.hp,
        atk:             card.atk,
      },
    },
  };
}

/** Convertit un SavedPost Supabase en WarriorCard locale. */
export function savedPostToWarriorCard(post: SavedPost, localId: number): WarriorCard {
  const meta = (post.metadata?.card ?? {}) as Record<string, unknown>;

  return {
    id:              typeof meta.localId === 'number' ? meta.localId : localId,
    supabaseId:      post.id,
    numero:          (meta.numero as string)                     ?? String(localId).padStart(3, '0'),
    nom:             post.title,
    rarete:          (meta.rarete as WarriorCard['rarete'])      ?? 'C',
    surnom:          post.description                            ?? '',
    portraitUrl:     post.imageUrl                              ?? '',
    classe:          (meta.classe as string)                     ?? 'Guerrier / Soldat',
    specialite1:     (meta.specialite1 as string)                ?? '',
    specialite2:     (meta.specialite2 as string)                ?? '',
    iconSpecialite1: meta.iconSpecialite1 as string | undefined,
    iconSpecialite2: meta.iconSpecialite2 as string | undefined,
    realisation:     (meta.realisation as string)                ?? '',
    faille:          (meta.faille as string)                     ?? '',
    citation:        (meta.citation as string)                   ?? '',
    theme:           (meta.theme as WarriorCard['theme'])        ?? 'gold',
    hp:              typeof meta.hp  === 'number' ? meta.hp  : 70,
    atk:             typeof meta.atk === 'number' ? meta.atk : 70,
  };
}

// ----------------------------------------------------------------
// Vérification d'unicité — backend
// ----------------------------------------------------------------

/**
 * Vérifie si une carte Legend avec ce nom existe déjà dans Supabase.
 *
 * @param nom               - Nom à vérifier (insensible à la casse et aux accents)
 * @param excludeSupabaseId - supabaseId de la carte en cours d'édition à exclure (cas UPDATE)
 * @returns true si un doublon existe (une AUTRE carte porte déjà ce nom)
 */
export async function checkLegendCardNameExists(
  nom: string,
  excludeSupabaseId?: string
): Promise<boolean> {
  try {
    const posts = await getPostsByType('legend', { limit: 200, includeImageData: false });
    const normalizedNom = normalizeLegendName(nom);

    return posts.some(post => {
      // Exclure la carte elle-même en cas de mise à jour
      if (excludeSupabaseId && post.id === excludeSupabaseId) return false;
      return normalizeLegendName(post.title) === normalizedNom;
    });
  } catch (error) {
    console.error('[legendService] Erreur vérification doublon:', error);
    // En cas d'erreur réseau, on laisse passer — la contrainte DB (idx_legend_unique_name)
    // sera le dernier filet de sécurité.
    return false;
  }
}

// ----------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------

/**
 * Charge toutes les cartes Legend depuis Supabase.
 * Retourne un tableau vide en cas d'erreur (le composant gerera le fallback).
 */
const compareLegendCards = (a: SavedPost, b: SavedPost) => {
  const aNumero = Number((a.metadata?.card as any)?.numero ?? '');
  const bNumero = Number((b.metadata?.card as any)?.numero ?? '');

  if (!Number.isNaN(aNumero) && !Number.isNaN(bNumero)) {
    return aNumero - bNumero;
  }

  if (!Number.isNaN(aNumero)) return -1;
  if (!Number.isNaN(bNumero)) return 1;

  const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return aTime - bTime;
};

export async function loadLegendCards(): Promise<WarriorCard[]> {
  try {
    const posts = await getPostsByType('legend', {
      limit: 200,
      includeImageData: true,
    });

    posts.sort(compareLegendCards);

    return posts.map((post, index) => savedPostToWarriorCard(post, index + 1));
  } catch (error) {
    console.error('[legendService] Erreur chargement Supabase:', error);
    return [];
  }
}

/**
 * Sauvegarde une nouvelle carte dans Supabase.
 * Lève DuplicateLegendError si une carte avec le même nom existe déjà.
 * Retourne le supabaseId attribué, ou null en cas d'échec non-doublon.
 */
export async function saveLegendCard(card: WarriorCard): Promise<string | null> {
  // ── Guard anti-doublon (vérification backend avant INSERT) ──────────────
  const exists = await checkLegendCardNameExists(card.nom, card.supabaseId);
  if (exists) {
    throw new DuplicateLegendError(card.nom);
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const post = warriorCardToSavedPost(card);
    const saved = await savePost(post);
    return saved?.id ?? null;
  } catch (error) {
    // Re-lever DuplicateLegendError telle quelle (peut arriver via contrainte DB 23505)
    if (error instanceof DuplicateLegendError) throw error;
    // Détecter l'erreur unique constraint Postgres (code 23505) comme filet de sécurité
    const msg = (error as any)?.message ?? '';
    if (msg.includes('23505') || msg.includes('idx_legend_unique_name') || msg.includes('unique')) {
      throw new DuplicateLegendError(card.nom);
    }
    console.error('[legendService] Erreur sauvegarde:', error);
    return null;
  }
}

/**
 * Met à jour une carte existante dans Supabase.
 * Lève DuplicateLegendError si le nouveau nom est déjà utilisé par une autre carte.
 * Retourne true si la mise à jour a réussi.
 */
export async function updateLegendCard(supabaseId: string, card: WarriorCard): Promise<boolean> {
  // ── Guard anti-doublon (en excluant la carte elle-même) ─────────────────
  const exists = await checkLegendCardNameExists(card.nom, supabaseId);
  if (exists) {
    throw new DuplicateLegendError(card.nom);
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const post = warriorCardToSavedPost(card);
    const updated = await updatePost(supabaseId, post);
    return updated !== null;
  } catch (error) {
    if (error instanceof DuplicateLegendError) throw error;
    const msg = (error as any)?.message ?? '';
    if (msg.includes('23505') || msg.includes('idx_legend_unique_name') || msg.includes('unique')) {
      throw new DuplicateLegendError(card.nom);
    }
    console.error('[legendService] Erreur mise à jour:', error);
    return false;
  }
}

/**
 * Supprime une carte de Supabase.
 * Retourne true si la suppression a reussi.
 */
export async function deleteLegendCard(supabaseId: string): Promise<boolean> {
  try {
    return await deletePost(supabaseId);
  } catch (error) {
    console.error('[legendService] Erreur suppression:', error);
    return false;
  }
}

/**
 * Migration one-time : importe un lot de cartes depuis localStorage dans Supabase.
 * Retourne les cartes enrichies de leur supabaseId.
 */
export async function batchSaveLegendCards(cards: WarriorCard[]): Promise<WarriorCard[]> {
  const results: WarriorCard[] = [];
  for (const card of cards) {
    try {
      const post = warriorCardToSavedPost(card);
      const saved = await savePost(post);
      results.push({ ...card, supabaseId: saved?.id ?? undefined });
    } catch (error) {
      console.error('[legendService] Echec migration carte:', card.nom, error);
      results.push(card);
    }
  }
  return results;
}