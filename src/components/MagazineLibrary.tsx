import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Download, Loader2 } from 'lucide-react';
import { SavedPost } from '../types';
import {
  getPostsByType,
  deletePost,
  subscribeToPostChanges,
  getPostImageUrl,
} from '../lib/postService';
import { CoverPreview } from './CoverPreview';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const extractIssueNumber = (issueValue?: string) => {
  if (!issueValue) return null;
  const match = issueValue.match(/\d+/);
  if (!match) return null;
  const issueNumber = Number(match[0]);
  return Number.isFinite(issueNumber) ? issueNumber : null;
};

const buildMagazineExportText = (posts: SavedPost[]) =>
  posts
    .map((post) => {
      const issueNumber = (post.metadata?.issueNumber as string | undefined) || 'Issue';
      return `${issueNumber} - ${post.title}`;
    })
    .join('\n');

const sortIssuesByIssueNumber = (posts: SavedPost[]) =>
  [...posts].sort((a, b) => {
    const na = extractIssueNumber(a.metadata?.issueNumber as string | undefined);
    const nb = extractIssueNumber(b.metadata?.issueNumber as string | undefined);
    if (na !== null && nb !== null && na !== nb) return nb - na;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

// ---------------------------------------------------------------------------
// MagazineLibrary
// ---------------------------------------------------------------------------

interface MagazineLibraryProps {
  onSelectIssue: (post: SavedPost) => void;
  currentUserId?: string;
}

export function MagazineLibrary({ onSelectIssue, currentUserId }: MagazineLibraryProps) {
  const [issues, setIssues] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lazy image URLs keyed by post id.
  // image_url is fetched individually per cover to avoid bulk-query timeouts.
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  const sortedIssues = useMemo(() => sortIssuesByIssueNumber(issues), [issues]);

  // Mount: load list + subscribe to realtime changes
  useEffect(() => {
    loadIssues();

    const subscription = subscribeToPostChanges('magazine', (posts) => {
      setIssues(posts);
      // Reset image cache so updated covers are re-fetched.
      setImageUrls({});
      setLoadingImages({});
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      // image_url is intentionally excluded from the bulk query — individual
      // covers fetch their own image via getPostImageUrl() to avoid timeouts.
      const posts = await getPostsByType('magazine', { limit: 50 });
      setIssues(posts);
    } catch (err) {
      console.error('Error loading magazines:', err);
      setError('Failed to load magazines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Fetch image_url for a single cover (called lazily by each MagazineItem). */
  const loadImage = async (post: SavedPost) => {
    if (!post.id) return;
    if (imageUrls[post.id] !== undefined || loadingImages[post.id]) return;

    setLoadingImages((prev) => ({ ...prev, [post.id!]: true }));
    try {
      const url = await getPostImageUrl(post.id);
      setImageUrls((prev) => ({ ...prev, [post.id!]: url ?? '' }));
    } catch (err) {
      console.warn('[MagazineLibrary] Failed to load image for', post.id, err);
      setImageUrls((prev) => ({ ...prev, [post.id!]: '' }));
    } finally {
      setLoadingImages((prev) => ({ ...prev, [post.id!]: false }));
    }
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const canCurrentUserDeleteIssue = (issue: SavedPost) => {
    if (!currentUserId) return false;
    const metadataOwnerId = issue.metadata?.firebaseUid as string | undefined;
    return issue.userId === currentUserId || metadataOwnerId === currentUserId;
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this magazine?')) return;
    try {
      await deletePost(id);
      setImageUrls((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadIssues();
    } catch (err) {
      console.error('Error deleting magazine:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete magazine');
    }
  };

  const handleExportTxt = () => {
    const exportText = buildMagazineExportText(sortedIssues);
    const blob = new Blob([`\uFEFF${exportText}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taitra-magazines-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-500" />
        <p className="text-neutral-500 mt-2">Loading magazines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={loadIssues}
          className="mt-4 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>No past issues found. Generate your first cover!</p>
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedIssues.map((issue) => (
          <MagazineItem
            key={issue.id}
            issue={issue}
            imageUrl={imageUrls[issue.id!]}
            isLoadingImage={!!loadingImages[issue.id!]}
            onLoadImage={() => loadImage(issue)}
            onClick={() => onSelectIssue({ ...issue, imageUrl: imageUrls[issue.id!] || undefined })}
            onDelete={() => handleDelete(issue.id)}
            canDelete={canCurrentUserDeleteIssue(issue)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MagazineItem — lazy-loads its own cover image on mount
// ---------------------------------------------------------------------------

interface MagazineItemProps {
  key?: React.Key | null;
  issue: SavedPost;
  imageUrl: string | undefined;
  isLoadingImage: boolean;
  onLoadImage: () => void;
  onClick: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

function MagazineItem({
  issue,
  imageUrl,
  isLoadingImage,
  onLoadImage,
  onClick,
  onDelete,
  canDelete,
}: MagazineItemProps) {
  useEffect(() => {
    onLoadImage();
    // Run once on mount — the parent guards against duplicate fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="group relative flex flex-col gap-2">
      <div
        className="cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={onClick}
      >
        {isLoadingImage ? (
          <div className="aspect-[3/4] bg-neutral-100 flex items-center justify-center rounded-md border border-neutral-200">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <CoverPreview
            headline={issue.title}
            issueNumber={(issue.metadata?.issueNumber as string) || 'N/A'}
            imageUrl={imageUrl}
            className="shadow-md text-[0.5rem]"
          />
        )}
      </div>

      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium text-neutral-700">
            {issue.metadata?.issueNumber || 'Issue'}
          </span>
          <span className="text-xs text-neutral-500">by {issue.authorName || 'Anonymous'}</span>
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
