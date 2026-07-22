import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Download, Loader2 } from 'lucide-react';
import { SavedPost } from '../types';
import { getPostsByType, deletePost, subscribeToPostChanges, getPostImageUrl } from '../lib/postService';

interface Top5LibraryProps {
  onSelectTop5: (post: SavedPost) => void;
  currentUserId?: string;
}

const buildTop5ExportText = (posts: SavedPost[]) => {
  return posts
    .map((post) => {
      return `${post.title}`;
    })
    .join('\n\n---\n\n');
};

export function Top5Library({ onSelectTop5, currentUserId }: Top5LibraryProps) {
  const [top5s, setTop5s] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lazy image states
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const sortedTop5s = useMemo(() => {
    return [...top5s].sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [top5s]);

  useEffect(() => {
    loadTop5s();

    const subscription = subscribeToPostChanges('top5', (posts) => {
      setTop5s(posts);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadTop5s = async () => {
    try {
      setLoading(true);
      setError(null);
      const posts = await getPostsByType('top5', { limit: 50 });
      setTop5s(posts);
    } catch (err) {
      console.error('Error loading top 5s:', err);
      setError('Failed to load top 5s');
    } finally {
      setLoading(false);
    }
  };

  const loadImage = async (post: SavedPost) => {
    if (!post.id) return;
    if (imageUrls[post.id] !== undefined || loadingImages[post.id]) return;

    setLoadingImages((prev) => ({ ...prev, [post.id!]: true }));
    try {
      const url = await getPostImageUrl(post.id);
      setImageUrls((prev) => ({ ...prev, [post.id!]: url ?? '' }));
    } catch (err) {
      console.warn('Failed to load image', post.id, err);
      setImageUrls((prev) => ({ ...prev, [post.id!]: '' }));
    } finally {
      setLoadingImages((prev) => ({ ...prev, [post.id!]: false }));
    }
  };

  const canCurrentUserDeleteTop5 = (top5: SavedPost) => {
    if (!currentUserId) return false;

    const metadataOwnerId = top5.metadata?.firebaseUid as string | undefined;
    return top5.userId === currentUserId || metadataOwnerId === currentUserId;
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this Top 5?')) return;

    try {
      await deletePost(id);
      setImageUrls((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadTop5s();
    } catch (err) {
      console.error('Error deleting top5:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete top 5');
    }
  };

  const handleExportTxt = () => {
    const exportText = buildTop5ExportText(sortedTop5s);
    const blob = new Blob([`\uFEFF${exportText}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `top5s-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-500" />
        <p className="text-neutral-500 mt-2">Loading Top 5s...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={loadTop5s}
          className="mt-4 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (top5s.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>No Top 5s found. Create your first Top 5!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={handleExportTxt}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <Download className="h-4 w-4" />
          Export TXT
        </button>
      </div>

      {top5s.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedTop5s.map((top5) => (
            <Top5Item
              key={top5.id}
              top5={top5}
              imageUrl={imageUrls[top5.id!]}
              isLoadingImage={!!loadingImages[top5.id!]}
              onLoadImage={() => loadImage(top5)}
              onClick={() => onSelectTop5({ ...top5, imageUrl: imageUrls[top5.id!] || '' })}
              onDelete={() => handleDelete(top5.id)}
              canDelete={canCurrentUserDeleteTop5(top5)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top5Item
// ---------------------------------------------------------------------------

interface Top5ItemProps {
  top5: SavedPost;
  imageUrl: string | undefined;
  isLoadingImage: boolean;
  onLoadImage: () => void;
  onClick: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function Top5Item({ top5, imageUrl, isLoadingImage, onLoadImage, onClick, onDelete, canDelete }: Top5ItemProps) {
  useEffect(() => {
    onLoadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="group relative flex flex-col gap-2">
      <div
        className="cursor-pointer transition-transform hover:scale-[1.02] bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center min-h-[200px] border border-neutral-200"
        onClick={onClick}
      >
        {isLoadingImage ? (
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        ) : (
          <img
            src={imageUrl || ''}
            alt={top5.title}
            className="w-full h-auto object-cover"
          />
        )}
      </div>
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium text-neutral-700 truncate">{top5.title}</span>
          <span className="text-xs text-neutral-500">by {top5.authorName || 'Anonymous'}</span>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
