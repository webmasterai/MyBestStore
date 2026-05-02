"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPKR } from "@/lib/currency";

type ProductCardData = {
  id: string;
  handle: string;
  title: string;
  featuredImage?: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    nodes: Array<{
      id: string;
      availableForSale: boolean;
      compareAtPrice?: { amount: string; currencyCode: string } | null;
      price: { amount: string; currencyCode: string };
    }>;
  };
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addVariant, isLoading: isCartLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const variant = product.variants.nodes[0];

  const canQuickAdd = Boolean(variant?.id && variant.availableForSale);
  const isLoading = isAdding || isCartLoading;

  const handleAdd = async () => {
    if (!variant?.id) return;
    setIsAdding(true);
    try {
      await addVariant(variant.id, 1);
    } finally {
      setIsAdding(false);
    }
  };
  const isOnSale = Boolean(
    variant?.compareAtPrice?.amount &&
      Number(variant.compareAtPrice.amount) > Number(variant.price.amount)
  );

  return (
    <div className="group rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-brand-primary/30 transition-all duration-500 product-shadow hover:product-shadow-hover">
      <Link href={`/product/${product.handle}`} className="block">
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {product.featuredImage?.url ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              width={product.featuredImage.width || 900}
              height={product.featuredImage.height || 900}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              priority={false}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-100">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10 text-slate-300"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1.5"/></svg>
            </div>
          )}

          {isOnSale ? (
            <div className="absolute left-3 top-3">
              <span className="inline-flex items-center rounded-lg bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Sale
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="p-5">
        <Link
          href={`/product/${product.handle}`}
          className="text-sm font-semibold text-slate-900 hover:text-brand-primary transition-colors line-clamp-1"
        >
          {product.title}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">
            {formatPKR(product.priceRange.minVariantPrice.amount)}
          </span>
          {isOnSale && variant?.compareAtPrice && (
            <span className="text-sm text-slate-400 line-through">
              {formatPKR(variant.compareAtPrice.amount)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!isHydrated || !canQuickAdd || isLoading}
          onClick={handleAdd}
          className={
            "mt-4 h-11 w-full rounded-xl text-sm font-bold transition-all duration-300 " +
            (canQuickAdd
              ? "bg-slate-900 text-white hover:bg-brand-primary shadow-sm active:scale-[0.98]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed")
          }
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
