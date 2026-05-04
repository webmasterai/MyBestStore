import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { isCommerceConfigured, searchProducts } from "@/lib/commerce";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
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
  const query = (resolved.q || "").trim();
  const page = parseInt(resolved.page || "1", 10);
  const pageSize = 24;
  const offset = (page - 1) * pageSize;

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="rounded-3xl border border-brand-ink/10 bg-white px-6 py-8 md:px-8 md:py-10 shadow-[0_12px_28px_rgba(42,33,24,0.08)]">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-brand-ink">
            Search Products
          </h1>
          <p className="mt-2 text-slate-500">
            Enter a product name in the header search box.
          </p>
        </div>
      </div>
    );
  }

  let productsData: Awaited<ReturnType<typeof searchProducts>> | null = null;
  try {
    productsData = await searchProducts(query, pageSize, offset);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[commerce] search fetch failed (q=${query})`, err);
    }

    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Search Products</h1>
        <p className="mt-2 text-slate-500">
          Search is temporarily unavailable. Please try again.
        </p>
      </div>
    );
  }

  const products = productsData?.products || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      <div className="rounded-3xl border border-brand-ink/10 bg-white px-6 py-8 md:px-8 md:py-10 shadow-[0_12px_28px_rgba(42,33,24,0.08)] mb-10">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-brand-ink">
          Search Results
        </h1>
        <p className="mt-2 text-slate-500">
          Showing results for: <span className="font-semibold text-slate-900">{query}</span>
        </p>
      </div>

      {products.length ? (
        <>
          <ProductGrid products={products} />
          <Pagination
            currentPage={page}
            hasNextPage={productsData?.pageInfo.hasNextPage || false}
            totalCount={productsData?.pageInfo.totalCount || 0}
            pageSize={pageSize}
            basePath="/search"
          />
        </>
      ) : (
        <p className="text-center py-20 text-slate-500 font-medium">No products found.</p>
      )}
    </div>
  );
}
