import { supabase } from '../supabase';
import { SavedPost, PostType } from '../types';

const TABLE_NAME = 'saved_posts';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value?: string): value is string => Boolean(value && UUID_REGEX.test(value));
const isDataUrl = (value?: string): value is string => Boolean(value && /^data:/i.test(value));

const getStorageBucketCandidates = (): string[] => {
  const envBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET?.trim();
  return [...new Set([envBucket, 'post_images', 'POST_IMAGES'].filter(Boolean))] as string[];
};

const isStorageBucketError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const message = (error as { message?: string }).message || '';
  return /bucket not found|storage bucket|not found/i.test(message);
};

const uploadImageToStorage = async (imageUrl: string | undefined, postType: PostType): Promise<string | undefined> => {
  if (!imageUrl || !isDataUrl(imageUrl)) {
    return imageUrl;
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `${postType}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

    const bucketCandidates = getStorageBucketCandidates();
    let lastError: unknown;

    for (const bucket of bucketCandidates) {
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType,
      });

      if (error) {
        if (isStorageBucketError(error)) {
          lastError = error;
          continue;
        }

        throw error;
      }

      if (!data?.path) {
        throw new Error('Supabase Storage returned no file path.');
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrlData.publicUrl || imageUrl;
    }

    if (lastError) {
      console.warn('[postService] Supabase Storage bucket was not found for any candidate:', bucketCandidates, lastError);
    }

    return imageUrl;
  } catch (error) {
    console.warn('Image upload to Supabase Storage failed, keeping the original value:', error);
    return imageUrl;
  }
};

const preparePostForPersistence = async (post: Partial<SavedPost>): Promise<Partial<SavedPost>> => {
  const persistedImageUrl = await uploadImageToStorage(post.imageUrl, post.type || 'magazine');

  return {
    ...post,
    imageUrl: persistedImageUrl ?? '',
  };
};

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


const extractIssueNumber = (issueValue?: string) => {
  if (!issueValue) return null;
  const match = issueValue.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatIssueNumber = (issueNumber: number, year?: number) => {
  if (!year) return `N°${issueNumber}`;
  return `N°${issueNumber} ${year}`;
};

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
    const persistedPost = await preparePostForPersistence(sanitizedPost);
    const payload = toInsertPayload(persistedPost as SavedPost);
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
// image_url is intentionally excluded from bulk queries to avoid statement timeouts
// (base64 data-URLs stored in that column can be very large).
// Pass includeImageData: true only when you genuinely need the URL for a small result set.
export async function getPostsByType(
  postType: PostType,
  filters?: {
    search?: string;
    limit?: number;
    offset?: number;
    includeImageData?: boolean;
  }
): Promise<SavedPost[]> {
  try {
    // Never include image_url in bulk fetches — it causes statement timeouts.
    // Callers that need images should use getPostImageUrl() per-item.
    let selectFields =
      'id, type, title, description, metadata, created_at, updated_at, user_id, author_name';

    if (filters?.includeImageData) {
      selectFields += ', image_url';
    }

    let query = supabase.from(TABLE_NAME).select(selectFields).eq('type', postType);

    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const limit = filters?.limit ?? 20;
    const offset = filters?.offset ?? 0;
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

/**
 * Fetch the image_url for a single post.
 * Separated from getPostsByType to avoid bulk-query timeouts caused by large
 * base64 data-URLs stored in the image_url column.
 */
export async function getPostImageUrl(postId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('image_url')
      .eq('id', postId)
      .single();

    if (error) {
      console.warn('[postService] getPostImageUrl error:', error.message);
      return undefined;
    }
    return (data as any)?.image_url ?? undefined;
  } catch (err) {
    console.warn('[postService] getPostImageUrl failed:', err);
    return undefined;
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
    const persistedUpdates = await preparePostForPersistence(sanitizePostForSave(updates));
    const payload = toUpdatePayload(persistedUpdates);
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
        getPostsByType(postType, { limit: 50, includeImageData: false }).then(callback);
      }
    )
    .subscribe();

  return subscription;
}


export async function shiftMagazineIssueNumbersFrom(startIssueNumber: number): Promise<void> {
  const magazines = await getPostsByType('magazine', { limit: 50 });
  const impacted = magazines
    .map((post) => {
      const issueNumber = extractIssueNumber(post.metadata?.issueNumber as string | undefined);
      return { post, issueNumber };
    })
    .filter((entry): entry is { post: SavedPost; issueNumber: number } => entry.issueNumber !== null && entry.issueNumber >= startIssueNumber)
    .sort((a, b) => b.issueNumber - a.issueNumber);

  await Promise.all(
    impacted.map(({ post, issueNumber }) => {
      const currentIssueText = post.metadata?.issueNumber as string | undefined;
      const yearMatch = currentIssueText?.match(/(19|20)\d{2}/);
      const year = yearMatch ? Number(yearMatch[0]) : undefined;

      return updatePost(post.id as string, {
        metadata: {
          ...(post.metadata || {}),
          issueNumber: formatIssueNumber(issueNumber + 1, year),
        },
      });
    })
  );
}

// ---------------------------------------------------------------------------
// Image Migration: base64 DB → Supabase Storage
// ---------------------------------------------------------------------------

export interface MigrationProgress {
  total: number;
  done: number;
  skipped: number;
  errors: number;
}

/**
 * Migrates all magazine (or any PostType) rows whose image_url is stored as a
 * base64 data-URL directly in the database to Supabase Storage.
 *
 * This permanently resolves the SELECT statement-timeout caused by large TOAST
 * values in the image_url column.
 *
 * @param postType  - Type of posts to migrate (default: 'magazine')
 * @param onProgress - Optional callback called after each processed row
 * @returns Final progress counters
 */
export async function migrateImagesToStorage(
  postType: PostType = 'magazine',
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  const BATCH_SIZE = 5; // Keep batches small to avoid Supabase timeouts
  let offset = 0;
  let hasMore = true;

  const progress: MigrationProgress = { total: 0, done: 0, skipped: 0, errors: 0 };

  while (hasMore) {
    // Fetch a small batch of posts WITH image_url for migration inspection
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, image_url, type')
      .eq('type', postType)
      .range(offset, offset + BATCH_SIZE - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[migrateImagesToStorage] Fetch batch error:', error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    progress.total += data.length;
    offset += data.length;
    if (data.length < BATCH_SIZE) hasMore = false;

    for (const row of data) {
      const rawUrl: string | undefined = (row as any).image_url;

      // Skip rows that are already a proper URL or empty
      if (!rawUrl || !isDataUrl(rawUrl)) {
        progress.skipped++;
        onProgress?.({ ...progress });
        continue;
      }

      try {
        const storageUrl = await uploadImageToStorage(rawUrl, (row as any).type || postType);

        if (!storageUrl || storageUrl === rawUrl) {
          // Upload returned the original base64 — Storage is misconfigured
          console.warn('[migrateImagesToStorage] Upload returned original data-URL for post', row.id, '— check bucket config.');
          progress.errors++;
          onProgress?.({ ...progress });
          continue;
        }

        // Update the DB row with the new Storage URL
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update({ image_url: storageUrl, updated_at: new Date().toISOString() })
          .eq('id', row.id);

        if (updateError) {
          console.error('[migrateImagesToStorage] Update error for post', row.id, updateError.message);
          progress.errors++;
        } else {
          progress.done++;
          console.info('[migrateImagesToStorage] ✓ Migrated post', row.id);
        }
      } catch (err) {
        console.error('[migrateImagesToStorage] Error processing post', row.id, err);
        progress.errors++;
      }

      onProgress?.({ ...progress });
    }
  }

  console.info('[migrateImagesToStorage] Migration complete:', progress);
  return progress;
}



// --- Custom Category Icons ---

const CUSTOM_ICONS_TABLE = 'custom_category_icons';

export async function getCustomCategoryIcons(userId: string): Promise<Record<string, string>> {
  try {
    let query = supabase
      .from(CUSTOM_ICONS_TABLE)
      .select('category, icon_data');

    if (isUuid(userId)) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('firebase_uid', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching custom category icons:', error);
      return {};
    }

    return data.reduce((acc, item) => {
      acc[item.category] = item.icon_data;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Failed to get custom category icons:', error);
    return {};
  }
}

export async function saveCustomCategoryIcon(
  userId: string,
  category: string,
  iconData: string
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      category,
      icon_data: iconData,
      updated_at: new Date().toISOString(),
    };

    if (isUuid(userId)) {
      payload.user_id = userId;
    } else {
      payload.firebase_uid = userId;
    }

    // Check if icon already exists for this category
    let checkQuery = supabase
      .from(CUSTOM_ICONS_TABLE)
      .select('id')
      .eq('category', category);

    if (isUuid(userId)) {
      checkQuery = checkQuery.eq('user_id', userId);
    } else {
      checkQuery = checkQuery.eq('firebase_uid', userId);
    }

    const { data: existing } = await checkQuery.maybeSingle();

    if (existing) {
      // Update existing icon
      const { error } = await supabase
        .from(CUSTOM_ICONS_TABLE)
        .update(payload)
        .eq('id', existing.id);
      return !error;
    } else {
      // Insert new icon
      const { error } = await supabase.from(CUSTOM_ICONS_TABLE).insert([payload]);
      return !error;
    }
  } catch (error) {
    console.error('Error saving custom category icon:', error);
    return false;
  }
}

export async function deleteCustomCategoryIcon(userId: string, category: string): Promise<boolean> {
  try {
    let query = supabase
      .from(CUSTOM_ICONS_TABLE)
      .delete()
      .eq('category', category);

    if (isUuid(userId)) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('firebase_uid', userId);
    }

    const { error } = await query;
    return !error;
  } catch (error) {
    console.error('Error deleting custom category icon:', error);
    return false;
  }
}

// --- Legend Card Counter ---

export async function getNextLegendCardNumber(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('metadata')
      .eq('type', 'legend')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching legend cards for counter:', error);
      return 1;
    }

    if (!data || data.length === 0) {
      return 1;
    }

    const maxNumber = data.reduce((max, post) => {
      const cardNumber = (post.metadata as any)?.card?.cardNumber;
      return typeof cardNumber === 'number' ? Math.max(max, cardNumber) : max;
    }, 0);

    return maxNumber + 1;
  } catch (error) {
    console.error('Failed to get next legend card number:', error);
    return 1;
  }
}
