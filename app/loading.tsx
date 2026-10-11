import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-page">
      <aside className="hidden h-dvh w-[260px] shrink-0 flex-col border-r border-border bg-surface p-5 md:flex">
        <div className="flex items-center gap-3 px-1">
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[13px] border border-border bg-white dark:bg-surface-2">
            <Image src="/pluto-logo.webp" alt="" width={40} height={40} className="h-9 w-9 object-contain dark:hidden" priority />
            <Image src="/pluto-logo-dark.webp" alt="" width={40} height={40} className="hidden h-9 w-9 object-contain dark:block" priority />
          </span>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" radius="pill" />
            <Skeleton className="h-2 w-24" radius="pill" />
          </div>
        </div>
        <div className="mt-10 space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" radius="inner" />
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex h-[72px] items-center gap-3 border-b border-border/70 bg-surface/80 px-4 backdrop-blur-xl md:px-7">
          <Skeleton className="h-10 w-10 md:hidden" radius="inner" />
          <Skeleton className="hidden h-10 w-full max-w-[460px] sm:block" radius="pill" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-10 w-10" radius="inner" />
            <Skeleton className="hidden h-10 w-10 sm:block" radius="inner" />
            <Skeleton className="hidden h-10 w-32 lg:block" radius="pill" />
            <Skeleton className="h-10 w-24" radius="pill" />
          </div>
        </div>

        <div className="h-[calc(100dvh-72px)] overflow-hidden px-4 pb-14 pt-6 md:px-7 xl:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Skeleton className="mb-6 h-[230px] sm:h-[220px]" radius="card" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-[170px]" radius="card" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
