const TRUST_ITEMS = [
  {
    label: "Fast delivery",
    detail: "Across Pakistan",
    icon: (
      <path d="M3 7h11l3 4v6H3V7zm11 0V4H3v3M7 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    ),
  },
  {
    label: "Secure checkout",
    detail: "PKR payments",
    icon: (
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Zm0 6.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
    ),
  },
  {
    label: "Quality assured",
    detail: "Curated catalog",
    icon: (
      <path d="m9 12 2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
  },
  {
    label: "Easy returns",
    detail: "Hassle-free support",
    icon: (
      <path d="M4 7h16v10H4V7Zm2 2v6h12V9H6Zm4 8h4" />
    ),
  },
] as const;

export function TrustBar() {
  return (
    <div className="trust-strip">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4">
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-3 snap-start shrink-0 min-w-[70vw] sm:min-w-0 sm:shrink">
              <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-brand-primary/8 border border-brand-primary/10 grid place-items-center text-brand-primary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-brand-ink truncate">{item.label}</div>
                <div className="text-xs text-slate-500 hidden sm:block">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
