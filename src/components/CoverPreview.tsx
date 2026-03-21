import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';

interface CoverPreviewProps {
  headline: string;
  issueNumber: string;
  imageUrl: string | null;
  className?: string;
}

export const CoverPreview = forwardRef<HTMLDivElement, CoverPreviewProps>(
  ({ headline, issueNumber, imageUrl, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full aspect-[3/4] bg-neutral-200 overflow-hidden shadow-xl flex flex-col",
          className
        )}
      >
        {/* Top Banner */}
        <div className="relative z-20 w-full bg-white pt-6 pb-4 px-8 flex shadow-sm shrink-0">
          <h1 className="text-[3.5rem] font-sans font-black text-[#255b5c] tracking-tighter leading-none">
            TAITRA
          </h1>
          <div className="absolute top-2 right-8 text-neutral-500 text-[10px] font-bold tracking-widest uppercase text-right">
            {issueNumber}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex-grow w-full">
          {/* Background Image */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Magazine Cover Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-400 bg-neutral-200">
              <span className="text-sm">Preview Area</span>
            </div>
          )}

          {/* Headline Block (Bottom Left) */}
          <div className="absolute bottom-0 left-0 w-full p-8 pt-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10">
            <h2 className="text-white text-[2.25rem] md:text-[2.5rem] font-sans font-medium text-left leading-[1.15] drop-shadow-xl">
              {headline || "Enter a headline..."}
            </h2>
          </div>
        </div>
      </div>
    );
  }
);

CoverPreview.displayName = 'CoverPreview';
