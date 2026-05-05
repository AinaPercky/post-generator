import { supabase } from '../supabase';
import { SavedPost, PostType } from '../types';

const TABLE_NAME = 'saved_posts';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value?: string): value is string => Boolean(value && UUID_REGEX.test(value));

const withOwnerMetadata = (post: Partial<SavedPost>) => {
  const metadata = { ...(post.metadata || {}) };

  if (post.userId && !isUuid(post.userId)) {
    metadata.firebaseUid = post.userId;
  }

  return metadata;
};

const toInsertPayload = (post: SavedPost) => {
  const payload: Record<string, unknown> = {
    type: post.type,
    title: post.title,
    description: post.description || '',
    image_url: post.imageUrl,
    metadata: withOwnerMetadata(post),
    author_name: post.authorName || 'Anonyme',
    updated_at: new Date().toISOString(),
  };

  if (post.id) {
    payload.id = post.id;
  }

  if (isUuid(post.userId)) {
    payload.user_id = post.userId;
  }

  return payload;
};


const toUpdatePayload = (updates: Partial<SavedPost>) => {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.metadata !== undefined) payload.metadata = withOwnerMetadata(updates);
  if (updates.authorName !== undefined) payload.author_name = updates.authorName;

  if (isUuid(updates.userId)) {
    payload.user_id = updates.userId;
  }

  return payload;
};

const mapSupabaseWriteError = (errorMessage: string) => {
  if (errorMessage.includes('row-level security policy')) {
    return 'Supabase blocked the save due to RLS. In Supabase Policies, create an INSERT policy on saved_posts (temporary option: TO public WITH CHECK (true)).';
  }

  if (errorMessage.includes('JWT') || errorMessage.includes('401')) {
    return 'Supabase authentication is missing or invalid. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, and ensure your RLS policies allow this operation.';
  }

  return errorMessage;
};

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
  userId: data.user_id || data.metadata?.firebaseUid,
  authorName: data.author_name,
});


const isSoftDeleted = (post: SavedPost) => Boolean(post.metadata?.deleted);

const softDeletePost = async (id: string): Promise<boolean> => {
  const { data: existing, error: existingError } = await supabase
    .from(TABLE_NAME)
    .select('metadata')
    .eq('id', id)
    .maybeSingle();

  if (existingError || !existing) {
    return false;
  }

  const metadata = {
    ...(existing.metadata || {}),
    deleted: true,
    deletedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');

  return !error && Array.isArray(data) && data.length > 0;
};

const sanitizePostForSave = (post: Partial<SavedPost>): Partial<SavedPost> => {
  if (!post.userId || isUuid(post.userId)) {
    return post;
  }

  console.warn('Ignoring non-UUID userId for Supabase save and preserving it in metadata.firebaseUid instead.', post.userId);

  return {
    ...post,
    userId: undefined,
    metadata: {
      ...(post.metadata || {}),
      firebaseUid: post.userId,
    },
  };
};

// CREATE - Créer un nouveau post (Magazine, RedPill, ou MisyFaTsy)
export async function savePost(post: SavedPost): Promise<SavedPost | null> {
  try {
    const sanitizedPost = sanitizePostForSave(post) as SavedPost;
    const payload = toInsertPayload(sanitizedPost);
    const { data, error } = await supabase.from(TABLE_NAME).insert([payload]).select().single();

    if (error) {
      const friendlyError = mapSupabaseWriteError(error.message);
      console.error('Error saving post:', error.message, payload);
      throw new Error(friendlyError);
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
    let query = supabase.from(TABLE_NAME).select('*').eq('type', postType);

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error.message);
      throw new Error(error.message);
    }
    return ((data as any[])?.map(toCamelCase) || []).filter((post) => !isSoftDeleted(post));
  } catch (error) {
    console.error('Fetch posts failed:', error);
    throw error;
  }
}

export async function getPostById(id: string): Promise<SavedPost | null> {
  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', id).single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching post:', error.message);
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    const post = toCamelCase(data);
    return isSoftDeleted(post) ? null : post;
  } catch (error) {
    console.error('Get post failed:', error);
    throw error;
  }
}

export async function updatePost(id: string, updates: Partial<SavedPost>): Promise<SavedPost | null> {
  try {
    const payload = toUpdatePayload(sanitizePostForSave(updates));
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating post:', error.message);
      throw new Error(mapSupabaseWriteError(error.message));
    }

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return toCamelCase(data[0]);
  } catch (error) {
    console.error('Update post failed:', error);
    throw error;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)
      .select('id');

    if (!error && Array.isArray(data) && data.length > 0) {
      return true;
    }

    if (error) {
      console.warn('Hard delete failed, attempting soft delete fallback:', error.message);
    }

    const softDeleted = await softDeletePost(id);
    if (softDeleted) {
      return true;
    }

    if (error) {
      throw new Error('Delete was blocked by Supabase RLS. Configure a DELETE policy or allow soft-delete updates on metadata.');
    }

    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!existing) {
      return true;
    }

    throw new Error('Delete was not applied. Configure DELETE policy or enable update policy for soft delete fallback.');
  } catch (error) {
    console.error('Delete post failed:', error);
    throw error;
  }
}

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
        filter: `type=eq.${postType}`,
      },
      () => {
        getPostsByType(postType).then(callback);
      }
    )
    .subscribe();

  return subscription;
}
