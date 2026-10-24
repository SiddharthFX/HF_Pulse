import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-page">
      {/* Floating header pill skeleton */}
      <header className="shrink-0 px-2.5 pt-2.5 sm:px-4 sm:pt-4 lg:px-5">
        <div className="mx-auto flex h-16 w-full max-w-[1720px] items-center gap-3 rounded-[26px] border border-border/70 bg-surface/90 px-4 shadow-sm">
          <Skeleton className="h-10 w-10 shrink-0" radius="pill" />
          <div className="hidden space-y-1 sm:block">
            <Skeleton className="h-4 w-28" radius="pill" />
            <Skeleton className="h-2.5 w-20" radius="pill" />
          </div>
          <div className="mx-auto hidden gap-2 xl:flex">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-24" radius="pill" />
            ))}
          </div>
          <Skeleton className="ml-auto hidden h-11 w-64 sm:block" radius="pill" />
          <Skeleton className="h-11 w-11 shrink-0" radius="pill" />
          <Skeleton className="h-11 w-11 shrink-0" radius="pill" />
          <Skeleton className="h-11 w-28 shrink-0" radius="pill" />
        </div>
      </header>

      {/* Main content area */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1720px] gap-5 px-2.5 sm:px-4 lg:px-5">
          {/* Floating rail skeleton */}
          <div className="hidden h-full w-[60px] shrink-0 py-5 md:flex md:flex-col md:gap-3">
            <div className="flex flex-col items-center gap-2 rounded-full border border-border/70 bg-surface p-2 shadow-sm">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-11 w-11" radius="pill" />
              ))}
            </div>
            <div className="flex flex-col items-center gap-2 rounded-full border border-border/70 bg-surface p-2 shadow-sm">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-11 w-11" radius="pill" />
              ))}
            </div>
          </div>

          {/* Cards skeleton */}
          <main className="min-w-0 flex-1 overflow-y-auto pb-14 pt-5 sm:pt-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" radius="pill" />
                <Skeleton className="h-10 w-80" radius="pill" />
                <Skeleton className="h-4 w-96" radius="pill" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-11 w-48" radius="pill" />
                <Skeleton className="h-11 w-36" radius="pill" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-[164px]" radius="card" />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
              <Skeleton className="h-[430px] xl:col-span-8" radius="card" />
              <Skeleton className="h-[430px] xl:col-span-4" radius="card" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Skeleton className="h-[390px]" radius="card" />
              <Skeleton className="h-[390px]" radius="card" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
