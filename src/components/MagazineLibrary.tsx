import React from 'react';
import { MagazineIssue } from '../types';
import { CoverPreview } from './CoverPreview';

interface MagazineLibraryProps {
  issues: MagazineIssue[];
  onSelectIssue: (issue: MagazineIssue) => void;
  onDeleteIssue: (id: string) => void;
  currentUserId?: string;
}

export function MagazineLibrary({ issues, onSelectIssue, onDeleteIssue, currentUserId }: MagazineLibraryProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        No past issues found. Generate your first cover!
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
              headline={issue.headline}
              issueNumber={issue.issueNumber}
              imageUrl={issue.imageUrl}
              className="shadow-md text-[0.5rem]" // Scale down text for thumbnail
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-neutral-700">{issue.issueNumber}</span>
              <span className="text-xs text-neutral-500">by {issue.authorName || 'Anonymous'}</span>
            </div>
            {currentUserId === issue.userId && (
              <button
                onClick={() => onDeleteIssue(issue.id)}
                className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
