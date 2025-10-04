export default function BadgesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 rounded bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card-block space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-slate-200 animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

