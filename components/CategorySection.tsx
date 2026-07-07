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

function CategoryPlaceholder({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/25 via-slate-200 to-brand-accent/20">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl sm:text-6xl font-black text-brand-primary/20 select-none">
          {initial}
        </span>
      </div>
    </div>
  );
}

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
        "group relative block overflow-hidden bg-brand-primary/10 border border-brand-primary/10 transition-all duration-500 product-shadow hover:product-shadow-hover " +
        className
      }
    >
      {categoryImage?.url ? (
        <Image
          src={categoryImage.url}
          alt={categoryImage.altText || category.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 320px"
        />
      ) : (
        <CategoryPlaceholder title={category.title} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-primary-deep/90 via-brand-primary/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-500" />

      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
        <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight line-clamp-2 leading-snug">
          {category.title}
        </h3>
        <div className="mt-2 sm:mt-3 flex items-center gap-2">
          <div className="h-0.5 w-6 sm:w-8 bg-brand-accent group-hover:w-10 sm:group-hover:w-12 transition-all duration-500" />
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
        <div className="flex flex-col items-center text-center mb-8 md:mb-10 fx-fade-up">
          <div className="section-eyebrow">Categories</div>
          <h2 className="section-title mt-4">{title}</h2>
          <p className="mt-4 text-slate-500 max-w-lg">
            Explore our curated categories and find the perfect pieces for your lifestyle.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="text-center text-slate-500">No categories found yet.</p>
        ) : (
          <div className="max-h-[min(72vh,760px)] overflow-y-auto overscroll-y-contain scrollbar-hide pr-1 touch-pan-y">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  className="h-[180px] sm:h-[220px] md:h-[260px] rounded-2xl"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
