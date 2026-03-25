import React, { useState, useEffect } from 'react';
import { Trash2, Download, Loader2 } from 'lucide-react';
import { SavedPost } from '../types';
import { getPostsByType, deletePost, subscribeToPostChanges } from '../lib/postService';
import { CoverPreview } from './CoverPreview';

interface MagazineLibraryProps {
  onSelectIssue: (post: SavedPost) => void;
  currentUserId?: string;
}

export function MagazineLibrary({ onSelectIssue, currentUserId }: MagazineLibraryProps) {
  const [issues, setIssues] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load magazines from Supabase on mount + subscribe to realtime updates
  useEffect(() => {
    loadIssues();

    const subscription = subscribeToPostChanges('magazine', (posts) => {
      setIssues(posts);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const posts = await getPostsByType('magazine', { limit: 100 });
      setIssues(posts);
    } catch (err) {
      console.error('Error loading magazines:', err);
      setError('Failed to load magazines');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this magazine?')) return;

    try {
      await deletePost(id);
      await loadIssues();
    } catch (err) {
      console.error('Error deleting magazine:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete magazine');
    }
  };

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {issues.map((issue) => (
        <div key={issue.id} className="group relative flex flex-col gap-2">
          <div 
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => onSelectIssue(issue)}
          >
            <CoverPreview
              headline={issue.title}
              issueNumber={issue.metadata?.issueNumber as string || 'N/A'}
              imageUrl={issue.imageUrl}
              className="shadow-md text-[0.5rem]"
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-neutral-700">{issue.metadata?.issueNumber || 'Issue'}</span>
              <span className="text-xs text-neutral-500">by {issue.authorName || 'Anonymous'}</span>
            </div>
            {currentUserId === issue.userId && (
              <button
                onClick={() => handleDelete(issue.id)}
                className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
