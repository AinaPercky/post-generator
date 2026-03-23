import { supabase } from '../supabase';
import { SavedPost, PostType } from '../types';

const TABLE_NAME = 'saved_posts';

// Helper to convert camelCase to snake_case for Supabase
const toSnakeCase = (post: SavedPost) => ({
  type: post.type,
  title: post.title,
  description: post.description,
  image_url: post.imageUrl,
  metadata: post.metadata,
  user_id: post.userId,
  author_name: post.authorName,
  id: post.id
});

// Helper to convert snake_case from Supabase to camelCase
const toCamelCase = (data: any): SavedPost => ({
  id: data.id,
  type: data.type,
  title: data.title,
  description: data.description,
  imageUrl: data.image_url,
  metadata: data.metadata,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  userId: data.user_id,
  authorName: data.author_name
});

// CREATE - Créer un nouveau post (Magazine, RedPill, ou MisyFaTsy)
export async function savePost(post: SavedPost): Promise<SavedPost | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        ...toSnakeCase(post),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving post:', error.message);
      throw new Error(error.message);
    }
    return toCamelCase(data);
  } catch (error) {
    console.error('Save post failed:', error);
    throw error;
  }
}

// READ - Récupérer tous les posts d'un type spécifique
export async function getPostsByType(
  postType: PostType,
  filters?: {
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<SavedPost[]> {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', postType);

    // Filtre de recherche sur le titre
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    // Pagination
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error.message);
      throw new Error(error.message);
    }
    return (data as any[])?.map(toCamelCase) || [];
  } catch (error) {
    console.error('Fetch posts failed:', error);
    throw error;
  }
}

// READ - Récupérer un post spécifique par ID
export async function getPostById(id: string): Promise<SavedPost | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching post:', error.message);
      throw new Error(error.message);
    }
    return data ? toCamelCase(data) : null;
  } catch (error) {
    console.error('Get post failed:', error);
    throw error;
  }
}

// UPDATE - Mettre à jour un post
export async function updatePost(id: string, updates: Partial<SavedPost>): Promise<SavedPost | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...toSnakeCase(updates as SavedPost),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error.message);
      throw new Error(error.message);
    }
    return data ? toCamelCase(data) : null;
  } catch (error) {
    console.error('Update post failed:', error);
    throw error;
  }
}

// DELETE - Supprimer un post
export async function deletePost(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error.message);
      throw new Error(error.message);
    }
    return true;
  } catch (error) {
    console.error('Delete post failed:', error);
    throw error;
  }
}

// SUBSCRIBE - S'abonner aux changements temps réel d'un type spécifique
export function subscribeToPostChanges(
  postType: PostType,
  callback: (posts: SavedPost[]) => void
) {
  const subscription = supabase
    .channel(`${TABLE_NAME}:${postType}`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: TABLE_NAME,
        filter: `type=eq.${postType}`
      },
      () => {
        // Fetch fresh data when any change occurs
        getPostsByType(postType).then(callback);
      }
    )
    .subscribe();

  return subscription;
}
