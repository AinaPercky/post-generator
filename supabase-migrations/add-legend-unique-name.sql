-- ==============================================================================
-- MIGRATION: Contrainte d'unicité sur le nom des cartes Legend
-- ==============================================================================
-- À exécuter dans Supabase Dashboard → SQL Editor
--
-- Cette migration ajoute un index unique partiel qui empêche d'avoir deux cartes
-- Legend avec le même nom (comparaison insensible à la casse).
--
-- Un index PARTIEL (WHERE type = 'legend') est utilisé pour ne pas affecter
-- les autres types de posts (magazine, redpill, etc.).
-- ==============================================================================

-- 1. Créer l'index unique partiel (insensible à la casse via lower())
--    Si deux lignes ont type='legend' et le même lower(title), l'insert sera rejeté.
CREATE UNIQUE INDEX IF NOT EXISTS idx_legend_unique_name
  ON public.saved_posts (lower(title))
  WHERE type = 'legend';

-- 2. Vérification : liste les noms en double existants (avant application)
--    Exécuter AVANT le CREATE INDEX pour nettoyer d'éventuels doublons existants.
--    Si cette requête retourne des résultats, supprimez manuellement les doublons.
/*
SELECT lower(title) AS nom_normalise, COUNT(*) AS nb
FROM public.saved_posts
WHERE type = 'legend'
GROUP BY lower(title)
HAVING COUNT(*) > 1
ORDER BY nb DESC;
*/

-- 3. Pour supprimer cet index si besoin (rollback) :
-- DROP INDEX IF EXISTS public.idx_legend_unique_name;
