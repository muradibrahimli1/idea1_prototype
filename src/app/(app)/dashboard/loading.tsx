import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* Created tasks */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solving */}
      <section>
        <Skeleton className="mb-3 h-6 w-44" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
