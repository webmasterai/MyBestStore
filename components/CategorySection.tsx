import Image from "next/image";
import Link from "next/link";

export type Category = {
  id: string;
  handle: string;
  title: string;
  image?: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  products?: {
    nodes: Array<{
      featuredImage?: {
        url: string;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
    }>;
  };
};

function CategoryCard({
  category,
  className = "",
}: {
  category: Category;
  className?: string;
}) {
  const fallbackImage = category.products?.nodes?.[0]?.featuredImage || null;
  const categoryImage = category.image || fallbackImage;

  return (
    <Link
      href={`/collections/${category.handle}`}
      className={
        "group relative overflow-hidden bg-brand-primary/10 border border-brand-primary/10 transition-all duration-500 product-shadow hover:product-shadow-hover " +
        className
      }
    >
      {categoryImage?.url ? (
        <Image
          src={categoryImage.url}
          alt={categoryImage.altText || category.title}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-200" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-primary-deep/90 via-brand-primary/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-500" />

      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
        <div className="transform translate-y-2 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            {category.title}
          </h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-0.5 w-8 bg-brand-accent group-hover:w-12 sm:group-hover:w-16 transition-all duration-500" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CategorySection({
  categories,
  title = "Shop by Category",
}: {
  categories: Category[];
  title?: string;
}) {
  return (
    <section id="categories" className="py-12 md:py-24 scroll-mt-24 bg-gradient-to-b from-surface-soft to-background">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center text-center mb-8 md:mb-12 fx-fade-up">
          <div className="section-eyebrow">Categories</div>
          <h2 className="section-title mt-4">{title}</h2>
          <p className="mt-4 text-slate-500 max-w-lg">
            Explore our curated categories and find the perfect pieces for your lifestyle.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="text-center text-slate-500">No categories found yet.</p>
        ) : (
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0 touch-pan-x">
            {categories.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                className="snap-center shrink-0 w-[78vw] max-w-[320px] md:w-auto md:max-w-none md:shrink h-[280px] sm:h-[340px] md:h-[420px] rounded-2xl md:rounded-3xl"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
