import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductGrid";
import { getCollectionByHandle, isCommerceConfigured } from "@/lib/commerce";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string | string[] }>;
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
  const handle = Array.isArray(resolvedParams.handle)
    ? resolvedParams.handle[0]
    : resolvedParams.handle;
  if (!handle || typeof handle !== "string") notFound();

  let collection: Awaited<ReturnType<typeof getCollectionByHandle>>;
  try {
    collection = await getCollectionByHandle(handle, 24);
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
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-brand-ink/10 bg-white shadow-[0_12px_28px_rgba(42,33,24,0.08)]">
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
          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight text-brand-ink"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {collection.title}
          </h1>
          <p className="mt-2 text-brand-ink/60 font-medium">
            Explore our curated selection of {collection.title.toLowerCase()}
          </p>
        </div>
      </div>
      <div className="mt-10">
        <ProductGrid products={collection.products.nodes} />
      </div>
    </div>
  );
}
