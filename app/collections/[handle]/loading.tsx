export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse">
      <div className="h-8 w-64 rounded-xl bg-foreground/10" />
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-foreground/10 overflow-hidden"
          >
            <div className="aspect-square bg-foreground/10" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-foreground/10" />
              <div className="h-4 w-1/3 rounded bg-foreground/10" />
              <div className="h-10 w-full rounded-full bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
