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

export function CategorySection({
  categories,
  title = "Shop by Category",
}: {
  categories: Category[];
  title?: string;
}) {
  return (
    <section id="categories" className="py-16 md:py-24 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center text-center mb-12 fx-fade-up">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-4 text-slate-500 max-w-lg">
            Explore our curated categories and find the perfect pieces for your lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((c) => {
            const fallbackImage = c.products?.nodes?.[0]?.featuredImage || null;
            const categoryImage = c.image || fallbackImage;

            return (
              <Link
                key={c.id}
                href={`/collections/${c.handle}`}
                className="group relative h-[450px] rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 transition-all duration-500 product-shadow hover:product-shadow-hover"
              >
                {categoryImage?.url ? (
                  <Image
                    src={categoryImage.url}
                    alt={categoryImage.altText || c.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-200" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      Explore Series
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight mb-2">
                      {c.title}
                    </h3>
                    <p className="text-slate-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                      Discover our latest arrivals in {c.title.toLowerCase()}.
                    </p>
                    
                    <div className="mt-6 flex items-center gap-2">
                      <div className="h-0.5 w-8 bg-brand-primary group-hover:w-16 transition-all duration-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Shop Now</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
