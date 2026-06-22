-- Créer la table pour les icônes de catégorie personnalisées
CREATE TABLE IF NOT EXISTS custom_category_icons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    icon_data TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    firebase_uid TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Assurer qu'il n'y a qu'une icône par catégorie et par utilisateur
    UNIQUE(user_id, category),
    UNIQUE(firebase_uid, category)
);

-- Activer Row Level Security (RLS)
ALTER TABLE custom_category_icons ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : les utilisateurs ne peuvent lire que leurs propres icônes
CREATE POLICY "Les utilisateurs peuvent lire leurs icônes" 
ON custom_category_icons 
FOR SELECT 
USING (auth.uid() = user_id OR firebase_uid IS NOT NULL);

-- Politique d'insertion : les utilisateurs ne peuvent insérer que leurs propres icônes
CREATE POLICY "Les utilisateurs peuvent ajouter leurs icônes" 
ON custom_category_icons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR firebase_uid IS NOT NULL);

-- Politique de mise à jour : les utilisateurs ne peuvent modifier que leurs propres icônes
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs icônes" 
ON custom_category_icons 
FOR UPDATE 
USING (auth.uid() = user_id OR firebase_uid IS NOT NULL);

-- Politique de suppression : les utilisateurs ne peuvent supprimer que leurs propres icônes
CREATE POLICY "Les utilisateurs peuvent supprimer leurs icônes" 
ON custom_category_icons 
FOR DELETE 
USING (auth.uid() = user_id OR firebase_uid IS NOT NULL);
