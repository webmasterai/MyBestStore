import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getCollectionByHandle, isCommerceConfigured } from "@/lib/commerce";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  if (!isCommerceConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect your commerce backend to browse collections
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Add your credentials to <code>.env.local</code> (see README.md).
        </p>
      </div>
    );
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const handle = resolvedParams.handle;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const pageSize = 24;
  const offset = (page - 1) * pageSize;

  if (!handle || typeof handle !== "string") notFound();

  let collection: Awaited<ReturnType<typeof getCollectionByHandle>>;
  try {
    collection = await getCollectionByHandle(handle, pageSize, offset);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[commerce] collection fetch failed (handle=${handle})`,
        err
      );
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect your commerce backend to browse collections
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Your backend settings in <code>.env.local</code> look incomplete or
          invalid. Double-check credentials and try again.
        </p>
      </div>
    );
  }

  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-brand-ink/10 bg-white shadow-[0_12px_28px_rgba(42,33,24,0.08)] mb-10">
        {collection.image?.url && (
          <div className="absolute inset-0 z-0">
            <img
              src={collection.image.url}
              alt={collection.title}
              className="h-full w-full object-cover opacity-20 blur-sm"
            />
            <div className="absolute inset-0 bg-linear-to-r from-white via-white/80 to-transparent" />
          </div>
        )}
        <div className="relative z-10 px-6 py-8 md:px-10 md:py-12">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-brand-ink">
            {collection.title}
          </h1>
          <p className="mt-2 text-brand-ink/60 font-medium">
            Explore our curated selection of {collection.title.toLowerCase()}
          </p>
        </div>
      </div>

      <ProductGrid products={collection.products.nodes} />

      <Pagination
        currentPage={page}
        hasNextPage={collection.products.pageInfo?.hasNextPage || false}
        totalCount={collection.products.pageInfo?.totalCount || 0}
        pageSize={pageSize}
        basePath={`/collections/${handle}`}
      />
    </div>
  );
}
