import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/AddToCartForm";
import { getProductByHandle, isCommerceConfigured } from "@/lib/commerce";
import { formatPKR } from "@/lib/currency";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string | string[] }>;
}) {
  if (!isCommerceConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect your commerce backend to view products
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

  let product: Awaited<ReturnType<typeof getProductByHandle>>;
  try {
    product = await getProductByHandle(handle);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[commerce] product fetch failed (handle=${handle})`, err);
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect your commerce backend to view products
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Your backend settings in <code>.env.local</code> look incomplete or
          invalid. Double-check credentials and try again.
        </p>
      </div>
    );
  }

  if (!product) notFound();

  const images = product.images.nodes.length
    ? product.images.nodes
    : product.featuredImage
      ? [product.featuredImage]
      : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
      {/* Product Banner with Image */}
      {images[0]?.url && (
        <div className="relative overflow-hidden rounded-3xl border border-brand-ink/10 bg-white shadow-[0_12px_28px_rgba(42,33,24,0.08)] mb-10">
          <div className="absolute inset-0 z-0">
            <Image
              src={images[0].url}
              alt={images[0].altText || product.title}
              width={images[0].width || 1200}
              height={images[0].height || 1200}
              className="h-full w-full object-cover opacity-25 blur-sm"
            />
            <div className="absolute inset-0 bg-linear-to-r from-white via-white/80 to-transparent" />
          </div>
          <div className="relative z-10 px-6 py-12 md:px-10 md:py-16">
            <h1
              className="text-3xl md:text-5xl font-bold tracking-tight text-brand-ink"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {product.title}
            </h1>
            <p className="mt-4 text-lg font-semibold text-brand-cyan-deep">
              {formatPKR(product.priceRange.minVariantPrice.amount)}
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-4">
          <div className="rounded-3xl border border-foreground/10 overflow-hidden bg-white shadow-[0_14px_34px_rgba(42,33,24,0.08)]">
            {images[0]?.url ? (
              <Image
                src={images[0].url}
                alt={images[0].altText || product.title}
                width={images[0].width || 1200}
                height={images[0].height || 1200}
                className="h-full w-full object-cover"
                priority
              />
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((img) => (
                <div
                  key={img.url}
                  className="rounded-2xl border border-foreground/10 overflow-hidden bg-white"
                >
                  <Image
                    src={img.url}
                    alt={img.altText || product.title}
                    width={img.width || 400}
                    height={img.height || 400}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-brand-ink/10 bg-white p-6 md:p-8 shadow-[0_14px_34px_rgba(42,33,24,0.08)]">
          <AddToCartForm variants={product.variants.nodes} />

          {product.descriptionHtml ? (
            <div
              className="mt-6 border-t border-brand-ink/10 pt-6 text-sm text-foreground/80 leading-7"
                // Description HTML is controlled by trusted admin content.
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : product.description ? (
            <p className="mt-6 border-t border-brand-ink/10 pt-6 text-sm text-foreground/75 leading-7">
              {product.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
