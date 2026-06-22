import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function TaskLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="h-4 w-32" />

      <div className="card mt-3">
        <div className="mb-3 flex items-start justify-between gap-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="mb-4 flex gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <SkeletonText lines={2} />
        <div className="mt-5 space-y-4">
          <SkeletonText lines={3} />
          <SkeletonText lines={2} />
        </div>
      </div>

      <Skeleton className="mt-4 h-11 w-full" />
    </div>
  );
}
