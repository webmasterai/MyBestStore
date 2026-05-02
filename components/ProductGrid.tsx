"use client";

import { ProductCard } from "@/components/ProductCard";

type ProductCardData = Parameters<typeof ProductCard>[0]["product"];

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
