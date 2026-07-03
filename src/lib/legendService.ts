/**
 * legendService.ts
 * ---------------------------------------------------------------
 * Service CRUD dedie aux cartes du LegendGenerator.
 *
 * Responsabilites :
 *  - Mapper WarriorCard (format interne) <=> SavedPost (format Supabase)
 *  - Exposer : loadLegendCards / saveLegendCard / updateLegendCard / deleteLegendCard / batchSaveLegendCards
 *  - Deleguer les appels reseau au postService generique existant
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
// CRUD
// ----------------------------------------------------------------

/**
 * Charge toutes les cartes Legend depuis Supabase.
 * Retourne un tableau vide en cas d'erreur (le composant gerera le fallback).
 */
export async function loadLegendCards(): Promise<WarriorCard[]> {
  try {
    const posts = await getPostsByType('legend', {
      limit: 200,
      includeImageData: true,
    });
    return posts.map((post, index) => savedPostToWarriorCard(post, index + 1));
  } catch (error) {
    console.error('[legendService] Erreur chargement Supabase:', error);
    return [];
  }
}

/**
 * Sauvegarde une nouvelle carte dans Supabase.
 * Retourne le supabaseId attribue, ou null en cas d'echec.
 */
export async function saveLegendCard(card: WarriorCard): Promise<string | null> {
  try {
    const post = warriorCardToSavedPost(card);
    const saved = await savePost(post);
    return saved?.id ?? null;
  } catch (error) {
    console.error('[legendService] Erreur sauvegarde:', error);
    return null;
  }
}

/**
 * Met a jour une carte existante dans Supabase.
 * Retourne true si la mise a jour a reussi.
 */
export async function updateLegendCard(supabaseId: string, card: WarriorCard): Promise<boolean> {
  try {
    const post = warriorCardToSavedPost(card);
    const updated = await updatePost(supabaseId, post);
    return updated !== null;
  } catch (error) {
    console.error('[legendService] Erreur mise a jour:', error);
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