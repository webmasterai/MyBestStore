import type {
  CommerceCategory,
  CommerceCollectionDetail,
  HomepageContent,
  CommerceImage,
  CommerceProductCard,
  CommerceProductDetail,
  CommerceVariant,
  PaginatedProducts,
} from "@/lib/commerce/types";

type MedusaConfig = {
  backendUrl: string;
  publishableKey: string;
};

function getMedusaConfig(): MedusaConfig {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  if (!backendUrl) {
    throw new Error("Missing NEXT_PUBLIC_MEDUSA_BACKEND_URL env var");
  }

  if (!publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY env var");
  }

  return {
    backendUrl: backendUrl.replace(/\/$/, ""),
    publishableKey,
  };
}

type MedusaFetchParams = {
  path: string;
  searchParams?: URLSearchParams;
  cache?: RequestCache;
  revalidate?: number;
  tags?: string[];
};

async function medusaFetch<T>(params: MedusaFetchParams): Promise<T> {
  const { backendUrl, publishableKey } = getMedusaConfig();
  const qs = params.searchParams?.toString();
  const url = `${backendUrl}${params.path}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": publishableKey,
    },
    cache: params.cache ?? "force-cache",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    next: {
      revalidate: params.revalidate,
      tags: params.tags,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  return (await res.json()) as T;
}

type MedusaMoney = {
  amount?: number | string | null;
  currency_code?: string | null;
  calculated_amount?: number | null;
};

type MedusaVariant = {
  id: string;
  title?: string | null;
  manage_inventory?: boolean | null;
  inventory_quantity?: number | null;
  allow_backorder?: boolean | null;
  calculated_price?: {
    calculated_amount?: number | null;
    original_amount?: number | null;
    currency_code?: string | null;
  } | null;
  prices?: MedusaMoney[];
};

type MedusaProduct = {
  id: string;
  handle?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: Array<{
    url?: string | null;
  }>;
  variants?: MedusaVariant[];
};

type MedusaCollection = {
  id: string;
  handle?: string | null;
  title?: string | null;
  metadata?: Record<string, unknown> | null;
  products?: MedusaProduct[];
};

function getCollectionImageUrl(collection: MedusaCollection): string | null {
  const fromMetadata =
    typeof collection.metadata?.image === "string"
      ? collection.metadata.image
      : typeof collection.metadata?.image_url === "string"
        ? collection.metadata.image_url
        : null;

  return fromMetadata || collection.products?.[0]?.thumbnail || null;
}

async function fetchCollectionThumbnail(collectionId: string): Promise<string | null> {
  const searchParams = new URLSearchParams({
    limit: "1",
    "collection_id[]": collectionId,
    fields: "+thumbnail",
    region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "",
  });
  if (!searchParams.get("region_id")) {
    searchParams.delete("region_id");
  }

  const data = await medusaFetch<{ products: MedusaProduct[] }>({
    path: "/store/products",
    searchParams,
    revalidate: 300,
    tags: ["home-categories-thumb", collectionId],
  });

  return data.products?.[0]?.thumbnail || null;
}

function mapCollectionToCommerceCategory(
  collection: MedusaCollection
): CommerceCategory {
  const title = collection.title || "Untitled collection";
  const imageUrl = getCollectionImageUrl(collection);

  return {
    id: collection.id,
    handle: collection.handle || collection.id,
    title,
    image: mapImage(imageUrl, title),
    products: {
      nodes: (collection.products || []).slice(0, 1).map((p) => ({
        featuredImage: mapImage(p.thumbnail, p.title || null),
      })),
    },
  };
}

function buildProductSearchParams(
  first: number,
  offset: number,
  extra?: Record<string, string>
): URLSearchParams {
  const searchParams = new URLSearchParams({
    limit: String(first),
    offset: String(offset),
    fields: "*variants,*variants.calculated_price,+variants.prices,+thumbnail,+images",
    region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "",
    ...extra,
  });

  if (!searchParams.get("region_id")) {
    searchParams.delete("region_id");
  }

  return searchParams;
}

type MedusaStore = {
  id: string;
  metadata?: Record<string, unknown> | null;
};

function centsToAmount(value: number | string | null | undefined, currencyCode?: string) {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isFinite(numeric)) return "0";

  // PKR has 0 decimals in Medusa
  if (currencyCode?.toUpperCase() === "PKR") {
    return numeric.toString();
  }

  return (numeric / 100).toString();
}

function mapImage(url?: string | null, altText?: string | null): CommerceImage | null {
  if (!url) return null;
  return {
    url,
    altText: altText ?? null,
    width: null,
    height: null,
  };
}

function mapVariant(v: MedusaVariant): CommerceVariant {
  const calculatedAmount = v.calculated_price?.calculated_amount;
  const fallbackPrice = v.prices?.[0];
  const amount =
    calculatedAmount ??
    (typeof fallbackPrice?.amount === "number" ? fallbackPrice.amount : Number(fallbackPrice?.amount ?? 0));
  const currencyCode =
    v.calculated_price?.currency_code?.toUpperCase() ||
    fallbackPrice?.currency_code?.toUpperCase() ||
    "PKR";

  const compareAtAmount = v.calculated_price?.original_amount;
  
  // In Medusa v2 storefront API, inventory_quantity is often not returned 
  // unless requested via specific fields or if inventory management is off.
  // We will assume it's available unless explicitly 0.
  const availableForSale =
    v.manage_inventory === false ||
    v.allow_backorder === true ||
    v.inventory_quantity === undefined ||
    v.inventory_quantity === null ||
    v.inventory_quantity > 0;

  return {
    id: v.id,
    title: v.title || "Default",
    availableForSale,
    price: {
      amount: centsToAmount(amount, currencyCode),
      currencyCode,
    },
    compareAtPrice:
      typeof compareAtAmount === "number"
        ? {
            amount: centsToAmount(compareAtAmount, currencyCode),
            currencyCode,
          }
        : null,
  };
}

function mapProductCard(p: MedusaProduct): CommerceProductCard {
  const variants = (p.variants || []).map(mapVariant);
  const firstVariant = variants[0];
  const primaryImage = mapImage(p.thumbnail || p.images?.[0]?.url || null, p.title || null);

  return {
    id: p.id,
    handle: p.handle || p.id,
    title: p.title || "Untitled product",
    featuredImage: primaryImage,
    priceRange: {
      minVariantPrice: {
        amount: firstVariant?.price.amount || "0",
        currencyCode: firstVariant?.price.currencyCode || "PKR",
      },
    },
    variants: {
      nodes: variants,
    },
  };
}

function mapProductDetail(p: MedusaProduct): CommerceProductDetail {
  const card = mapProductCard(p);
  const images = (p.images || [])
    .map((img) => mapImage(img.url, p.title || null))
    .filter((img): img is CommerceImage => Boolean(img));

  return {
    id: card.id,
    handle: card.handle,
    title: card.title,
    description: p.description || "",
    descriptionHtml: p.description || "",
    featuredImage: card.featuredImage,
    images: {
      nodes: images,
    },
    priceRange: card.priceRange,
    variants: card.variants,
  };
}

const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  heroSlides: [
    {
      eyebrow: "MyBestStore",
      title: "From Browse To Doorstep",
      subtitle: "A faster shopping flow for Pakistan with seamless PKR checkout.",
      cta: "Shop New Arrivals",
      href: "#new-arrivals",
    },
    {
      eyebrow: "New Season",
      title: "Fresh Drops Every Week",
      subtitle: "Curated arrivals with clear prices and smooth checkout.",
      cta: "Browse New",
      href: "#new-arrivals",
    },
    {
      eyebrow: "Curated",
      title: "Find It In Fewer Taps",
      subtitle: "Shop by category and get to your product pages instantly.",
      cta: "Explore Categories",
      href: "#categories",
    },
  ],
  newArrivalsTitle: "New Arrivals",
  categoriesTitle: "Shop by Category",
  stats: [
    { value: "2,291+", label: "Happy Customers" },
    { value: "4.8/5", label: "Average Product Rating" },
  ],
};

function asHomepageContent(input: unknown): HomepageContent {
  if (!input || typeof input !== "object") return DEFAULT_HOMEPAGE_CONTENT;
  const data = input as Partial<HomepageContent>;

  const heroSlides = Array.isArray(data.heroSlides)
    ? data.heroSlides.filter(
        (s): s is HomepageContent["heroSlides"][number] =>
          Boolean(
            s &&
              typeof s === "object" &&
              typeof s.eyebrow === "string" &&
              typeof s.title === "string" &&
              typeof s.subtitle === "string" &&
              typeof s.cta === "string" &&
              typeof s.href === "string"
          )
      )
    : [];

  const stats = Array.isArray(data.stats)
    ? data.stats.filter(
        (s): s is HomepageContent["stats"][number] =>
          Boolean(
            s &&
              typeof s === "object" &&
              typeof s.label === "string" &&
              typeof s.value === "string"
          )
      )
    : [];

  return {
    heroSlides: heroSlides.length > 0 ? heroSlides : DEFAULT_HOMEPAGE_CONTENT.heroSlides,
    newArrivalsTitle:
      typeof data.newArrivalsTitle === "string" && data.newArrivalsTitle.trim()
        ? data.newArrivalsTitle
        : DEFAULT_HOMEPAGE_CONTENT.newArrivalsTitle,
    categoriesTitle:
      typeof data.categoriesTitle === "string" && data.categoriesTitle.trim()
        ? data.categoriesTitle
        : DEFAULT_HOMEPAGE_CONTENT.categoriesTitle,
    stats: stats.length > 0 ? stats : DEFAULT_HOMEPAGE_CONTENT.stats,
  };
}

export async function medusaGetHomepageContent(): Promise<HomepageContent> {
  try {
    const data = await medusaFetch<{ store?: MedusaStore; stores?: MedusaStore[] }>({
      path: "/store/stores",
      revalidate: 60,
      tags: ["homepage-content"],
    });

    const store = data.store ?? data.stores?.[0];
    const homepageContent = store?.metadata?.homepage_content;
    return asHomepageContent(homepageContent);
  } catch {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

export async function medusaGetHomeProducts(
  first: number,
  offset = 0
): Promise<PaginatedProducts> {
  const searchParams = new URLSearchParams({
    limit: String(first),
    offset: String(offset),
    fields: "*variants,*variants.calculated_price,+variants.prices,+thumbnail,+images",
    region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "",
  });
  if (!searchParams.get("region_id")) {
    searchParams.delete("region_id");
  }

  const data = await medusaFetch<{ products: MedusaProduct[]; count: number }>({
    path: "/store/products",
    searchParams,
    revalidate: 60,
    tags: ["home-products"],
  });

  return {
    products: (data.products || []).map(mapProductCard),
    pageInfo: {
      hasNextPage: offset + (data.products?.length || 0) < (data.count || 0),
      totalCount: data.count || 0,
    },
  };
}

export async function medusaGetCategories(first: number): Promise<CommerceCategory[]> {
  const collectionData = await medusaFetch<{
    collections: MedusaCollection[];
  }>({
    path: "/store/collections",
    searchParams: new URLSearchParams({
      limit: String(first),
    }),
    revalidate: 300,
    tags: ["home-categories"],
  });

  const collections = collectionData.collections || [];

  return Promise.all(
    collections.map(async (collection) => {
      if (getCollectionImageUrl(collection)) {
        return mapCollectionToCommerceCategory(collection);
      }

      const thumbnail = await fetchCollectionThumbnail(collection.id);

      return mapCollectionToCommerceCategory({
        ...collection,
        products: thumbnail
          ? [{ id: `${collection.id}-thumb`, thumbnail, title: collection.title }]
          : [],
      });
    })
  );
}

export async function medusaGetProductByHandle(
  handle: string
): Promise<CommerceProductDetail | null> {
  const searchParams = new URLSearchParams({
    handle,
    limit: "1",
    fields: "*variants,*variants.calculated_price,+variants.prices,+thumbnail,+images,+description",
    region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "",
  });
  if (!searchParams.get("region_id")) {
    searchParams.delete("region_id");
  }

  const data = await medusaFetch<{ products: MedusaProduct[] }>({
    path: "/store/products",
    searchParams,
    revalidate: 60,
    tags: ["product", handle],
  });

  const product = data.products?.[0];
  if (!product) return null;

  return mapProductDetail(product);
}

export async function medusaGetCollectionByHandle(
  handle: string,
  first: number,
  offset = 0
): Promise<CommerceCollectionDetail | null> {
  const collectionData = await medusaFetch<{ collections: MedusaCollection[] }>({
    path: "/store/collections",
    searchParams: new URLSearchParams({ handle, limit: "1" }),
    revalidate: 120,
    tags: ["collection", handle],
  });

  const collection = collectionData.collections?.[0];
  if (!collection) return null;

  const productsData = await medusaFetch<{ products: MedusaProduct[]; count: number }>({
    path: "/store/products",
    searchParams: buildProductSearchParams(first, offset, {
      "collection_id[]": collection.id,
    }),
    revalidate: 120,
    tags: ["collection-products", handle],
  });

  const title = collection.title || "Collection";

  return {
    id: collection.id,
    title,
    image: mapImage(getCollectionImageUrl(collection), title),
    products: {
      nodes: (productsData.products || []).map(mapProductCard),
      pageInfo: {
        hasNextPage: offset + (productsData.products?.length || 0) < (productsData.count || 0),
        totalCount: productsData.count || 0,
      },
    },
  };
}

export async function medusaSearchProducts(
  query: string,
  first: number,
  offset = 0
): Promise<PaginatedProducts> {
  const data = await medusaFetch<{ products: MedusaProduct[]; count: number }>({
    path: "/store/products",
    searchParams: new URLSearchParams({
      q: query,
      limit: String(first),
      offset: String(offset),
      fields: "*variants,*variants.calculated_price,+variants.prices,+thumbnail,+images",
      region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "",
    }),
    revalidate: 60,
    tags: ["search", query],
  });

  return {
    products: (data.products || []).map(mapProductCard),
    pageInfo: {
      hasNextPage: offset + (data.products?.length || 0) < (data.count || 0),
      totalCount: data.count || 0,
    },
  };
}
