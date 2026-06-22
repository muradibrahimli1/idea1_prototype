import { Skeleton, SkeletonText } from "@/components/Skeleton";

// Default fallback for any authenticated route without its own loading.tsx.
export default function AppLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Skeleton className="h-7 w-52" />
      <div className="card space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
