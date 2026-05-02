import { ProductGrid } from "@/components/ProductGrid";
import { isCommerceConfigured, searchProducts } from "@/lib/commerce";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  if (!isCommerceConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Search Products</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Add your credentials to <code>.env.local</code> (see README.md).
        </p>
      </div>
    );
  }

  const resolved = await searchParams;
  const query = (Array.isArray(resolved.q) ? resolved.q[0] : resolved.q || "").trim();

  if (!query) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="rounded-3xl border border-brand-ink/10 bg-white px-6 py-6 md:px-8 md:py-7 shadow-[0_12px_28px_rgba(42,33,24,0.08)]">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
            Search Products
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Enter a product name in the header search box.
          </p>
        </div>
      </div>
    );
  }

  let products: Awaited<ReturnType<typeof searchProducts>> = [];
  try {
    products = await searchProducts(query, 24);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[commerce] search fetch failed (q=${query})`, err);
    }

    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Search Products</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Search is temporarily unavailable. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="rounded-3xl border border-brand-ink/10 bg-white px-6 py-6 md:px-8 md:py-7 shadow-[0_12px_28px_rgba(42,33,24,0.08)]">
        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-brand-ink" style={{ fontFamily: "var(--font-heading)" }}>
          Search Results
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Showing results for: <span className="font-medium text-foreground">{query}</span>
        </p>
      </div>

      {products.length ? (
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-foreground/70">No products found.</p>
      )}
    </div>
  );
}
