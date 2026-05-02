import { HeroSlider } from "@/components/HeroSlider";
import { ProductGrid } from "@/components/ProductGrid";
import { CategorySection, type Category } from "@/components/CategorySection";
import {
  getCategories,
  getHomepageContent,
  getHomeProducts,
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

  let products: Awaited<ReturnType<typeof getHomeProducts>> = [];
  let categories: Category[] = [];
  let homepageContent: Awaited<ReturnType<typeof getHomepageContent>> | null = null;

  try {
    [products, categories, homepageContent] = await Promise.all([
      getHomeProducts(),
      getCategories(),
      getHomepageContent(),
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

  const heroProducts = products.slice(0, 3);

  return (
    <div className="pb-8 md:pb-12">
      <HeroSlider
        products={heroProducts}
        slides={homepageContent?.heroSlides}
      />

      <section id="new-arrivals" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center text-center mb-12 fx-fade-up">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
              {homepageContent?.newArrivalsTitle || "New Arrivals"}
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg">
              Check out our latest drops. Quality craftsmanship meets modern design in every piece.
            </p>
          </div>

          <div className="mt-6">
            <ProductGrid products={products} />
          </div>
        </div>
      </section>

      <CategorySection
        categories={categories}
        title={homepageContent?.categoriesTitle || "Shop by Category"}
      />
    </div>
  );
}
