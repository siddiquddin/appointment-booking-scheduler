import React from 'react';

export function SkeletonRow({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 w-full animate-pulse rounded-xl border border-slate-200 dark:border-white/5 bg-slate-200/60 dark:bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-28 animate-pulse rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-200/60 dark:bg-white/[0.03]"
        />
      ))}
    </div>
  );
}
