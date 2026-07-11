interface LoadingSkeletonProps {
  variant?: "cards" | "list" | "text";
  count?: number;
}

export function LoadingSkeleton({ variant = "cards", count = 3 }: LoadingSkeletonProps) {
  if (variant === "text") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-200" />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100"
        />
      ))}
    </div>
  );
}
