"use client";

import { ProductCard } from "@/components/ProductCard";

type ProductCardData = Parameters<typeof ProductCard>[0]["product"];

export function ProductGrid({
  products,
  variant = "grid",
}: {
  products: ProductCardData[];
  variant?: "grid" | "scroll";
}) {
  if (variant === "scroll") {
    return (
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0 touch-pan-x">
        {products.map((p) => (
          <div
            key={p.id}
            className="snap-start shrink-0 w-[44vw] max-w-[200px] md:w-auto md:max-w-none md:shrink"
          >
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
