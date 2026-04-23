/* Reusable skeleton shimmer primitives */
const base = 'animate-pulse rounded-xl bg-gray-800';

export function SkeletonBlock({ className = '' }) {
  return <div className={`${base} ${className}`} />;
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${base} h-3`}
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

/* Matches the StatCard layout */
export function SkeletonStatCard() {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBlock className="w-9 h-9" />
      </div>
      <SkeletonBlock className="h-2.5 w-24 mb-3" />
      <SkeletonBlock className="h-7 w-16 mb-2" />
      <SkeletonBlock className="h-2 w-20" />
    </div>
  );
}

/* Matches the profile summary card */
export function SkeletonProfileCard() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
      <div className="flex gap-5">
        <SkeletonBlock className="w-16 h-16 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-3 w-64" />
          <div className="grid grid-cols-3 gap-3 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Matches a generic chart card */
export function SkeletonChartCard() {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <SkeletonBlock className="h-4 w-36 mb-5" />
      <SkeletonBlock className="h-48 w-full" />
    </div>
  );
}

/* Generic list-item row */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-950 border border-gray-800">
      <SkeletonBlock className="w-5 h-5 rounded-full flex-shrink-0" />
      <SkeletonBlock className="h-3 flex-1" />
    </div>
  );
}

/* Feed post card skeleton */
export function SkeletonPostCard() {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-2.5 w-20" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <SkeletonBlock className="h-48 w-full" />
    </div>
  );
}
