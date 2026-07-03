-- ==============================================================================
-- MIGRATION: Ajout du type 'legend' (et 'top5') a la table saved_posts
-- ==============================================================================

-- 1. Si vous avez cree la table avec une contrainte CHECK stricte sur la colonne 'type',
-- vous devez la mettre a jour pour autoriser 'legend' (et 'top5' s'il n'y est pas deja).
-- Executez ceci dans votre SQL Editor Supabase :

DO $ $ 
BEGIN
  -- Tente de supprimer l'ancienne contrainte si elle s'appelle saved_posts_type_check
  -- (Ignore l'erreur si elle n'existe pas)
  ALTER TABLE public.saved_posts DROP CONSTRAINT IF EXISTS saved_posts_type_check;
  
  -- Recrée la contrainte avec tous les types actuels
  ALTER TABLE public.saved_posts ADD CONSTRAINT saved_posts_type_check 
  CHECK (type IN ('magazine', 'redpill', 'misyfatsy', 'top5', 'legend'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la mise a jour de la contrainte (peut-etre que la table n a pas de contrainte)';
END $ $;

-- 2. POLITIQUES RLS (Row Level Security)
-- Les cartes Legend utilisent la table unifiee 'saved_posts'. 
-- Si vos regles RLS actuelles permettent deja la lecture et l'insertion 
-- (publiques ou via auth.uid() == user_id), il n'y a rien a faire de plus.

-- Pour rappel, voici a quoi ressemblent des regles permettant l'insertion publique 
-- (comme c'est le cas par defaut pour le studio de base) :
/*
CREATE POLICY "Public can insert" ON "public"."saved_posts"
AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public can read" ON "public"."saved_posts"
AS PERMISSIVE FOR SELECT TO public USING (true);
*/