export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-foreground/10 overflow-hidden">
          <div className="aspect-square bg-foreground/10" />
        </div>
        <div>
          <div className="h-8 w-3/4 rounded-xl bg-foreground/10" />
          <div className="mt-3 h-6 w-32 rounded-xl bg-foreground/10" />
          <div className="mt-8 space-y-3">
            <div className="h-11 w-full rounded-xl bg-foreground/10" />
            <div className="h-11 w-full rounded-full bg-foreground/10" />
          </div>
          <div className="mt-10 space-y-2">
            <div className="h-4 w-full rounded bg-foreground/10" />
            <div className="h-4 w-5/6 rounded bg-foreground/10" />
            <div className="h-4 w-2/3 rounded bg-foreground/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
