import { HeroSlider } from "@/components/HeroSlider";
import { ProductGrid } from "@/components/ProductGrid";
import { CategorySection, type Category } from "@/components/CategorySection";
import { TrustBar } from "@/components/TrustBar";
import {
  getCategories,
  getHomepageContent,
  getHomeProducts,
  getCollectionByHandle,
  isCommerceConfigured,
} from "@/lib/commerce";

export default async function Home() {
  if (!isCommerceConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect your commerce backend to get started
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Add your backend credentials to <code>.env.local</code>{" "}
          (see README.md). Once configured, this page will automatically load
          products and categories.
        </p>
      </div>
    );
  }

  let productsData: Awaited<ReturnType<typeof getHomeProducts>> | null = null;
  let categories: Category[] = [];
  let homepageContent: Awaited<ReturnType<typeof getHomepageContent>> | null = null;
  
  // Featured Collections sections
  let ledTvs: Awaited<ReturnType<typeof getCollectionByHandle>> = null;
  let soundBars: Awaited<ReturnType<typeof getCollectionByHandle>> = null;
  let airPurifiers: Awaited<ReturnType<typeof getCollectionByHandle>> = null;
  let homeTheater: Awaited<ReturnType<typeof getCollectionByHandle>> = null;

  try {
    [productsData, categories, homepageContent, ledTvs, soundBars, airPurifiers, homeTheater] = await Promise.all([
      getHomeProducts(8),
      getCategories(100),
      getHomepageContent(),
      getCollectionByHandle("led-tv", 8),
      getCollectionByHandle("sound-bar", 8),
      getCollectionByHandle("air-purifiers", 8),
      getCollectionByHandle("home-theater", 8),
    ]);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[commerce] home fetch failed", err);
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect your commerce backend to get started
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Your backend settings in <code>.env.local</code> look incomplete or
          invalid. Double-check credentials and try again.
        </p>
      </div>
    );
  }

  const products = productsData?.products || [];
  const heroProducts = products.slice(0, 3);

  return (
    <div className="pb-8 md:pb-12">
      <HeroSlider
        products={heroProducts}
        slides={homepageContent?.heroSlides}
      />

      <TrustBar />

      {/* New Arrivals */}
      <section id="new-arrivals" className="py-12 md:py-20 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <div className="section-eyebrow">Just landed</div>
              <h2 className="section-title mt-3">
                {homepageContent?.newArrivalsTitle || "New Arrivals"}
              </h2>
              <p className="mt-2 text-slate-500">
                Check out our latest drops.
              </p>
            </div>
            <a href="/search" className="section-link shrink-0">
              View all
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <ProductGrid products={products} variant="scroll" />
        </div>
      </section>

      {/* LED TVs Section */}
      {ledTvs && ledTvs.products.nodes.length > 0 && (
        <section className="py-14 md:py-20 bg-surface-soft/80">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <div className="section-eyebrow">Entertainment</div>
                <h2 className="section-title mt-3">LED TV&apos;S</h2>
                <p className="mt-2 text-slate-500">
                  Premium entertainment systems.
                </p>
              </div>
              <a href="/collections/led-tv" className="section-link shrink-0">
                View all
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <ProductGrid products={ledTvs.products.nodes} />
          </div>
        </section>
      )}

      {/* Sound Bars Section */}
      {soundBars && soundBars.products.nodes.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <div className="section-eyebrow">Audio</div>
                <h2 className="section-title mt-3">Sound Bars</h2>
                <p className="mt-2 text-slate-500">
                  Immersive audio experiences.
                </p>
              </div>
              <a href="/collections/sound-bar" className="section-link shrink-0">
                View all
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <ProductGrid products={soundBars.products.nodes} />
          </div>
        </section>
      )}

      {/* Air Purifiers Section */}
      {airPurifiers && airPurifiers.products.nodes.length > 0 && (
        <section className="py-14 md:py-20 bg-surface-soft/80">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <div className="section-eyebrow">Home wellness</div>
                <h2 className="section-title mt-3">Air Purifiers</h2>
                <p className="mt-2 text-slate-500">
                  Clean air for your home.
                </p>
              </div>
              <a href="/collections/air-purifiers" className="section-link shrink-0">
                View all
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <ProductGrid products={airPurifiers.products.nodes} />
          </div>
        </section>
      )}

      {/* Home Theater Section */}
      {homeTheater && homeTheater.products.nodes.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-10 gap-4">
              <div>
                <div className="section-eyebrow">Cinema at home</div>
                <h2 className="section-title mt-3">Home Theater</h2>
                <p className="mt-2 text-slate-500">
                  Complete cinematic setup.
                </p>
              </div>
              <a href="/collections/home-theater" className="section-link shrink-0">
                View all
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <ProductGrid products={homeTheater.products.nodes} />
          </div>
        </section>
      )}

      <CategorySection
        categories={categories}
        title={homepageContent?.categoriesTitle || "Shop by Category"}
      />
    </div>
  );
}
