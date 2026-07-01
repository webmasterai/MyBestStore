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

export function ProductCard({
  product,
  compact = false,
}: {
  product: ProductCardData;
  compact?: boolean;
}) {
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

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div
      className={
        "group rounded-xl sm:rounded-2xl border border-brand-primary/10 overflow-hidden bg-white hover:border-brand-accent/40 transition-all duration-500 product-shadow hover:product-shadow-hover " +
        (compact ? "h-full" : "")
      }
    >
      <div className="relative">
        <Link href={`/product/${product.handle}`} className="block">
          <div className="relative aspect-square bg-gradient-to-br from-surface-soft to-white overflow-hidden">
            {product.featuredImage?.url ? (
              <Image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText || product.title}
                width={product.featuredImage.width || 900}
                height={product.featuredImage.height || 900}
                className="h-full w-full object-contain sm:object-cover transition-transform duration-700 group-hover:scale-105"
                priority={false}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10 text-slate-300"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1.5"/></svg>
              </div>
            )}

            {isOnSale ? (
              <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
                <span className="inline-flex items-center rounded-lg bg-brand-accent px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-brand-accent/30">
                  Sale
                </span>
              </div>
            ) : null}
          </div>
        </Link>

        {canQuickAdd ? (
          <button
            type="button"
            disabled={!isHydrated || isLoading}
            onClick={handleAdd}
            aria-label="Add to cart"
            className="md:hidden absolute bottom-2 right-2 h-9 w-9 rounded-full brand-cta-primary text-white grid place-items-center shadow-lg active:scale-95 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path d="M6 7h15l-1.5 9h-12z" />
              <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="p-3 sm:p-5">
        <Link
          href={`/product/${product.handle}`}
          className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-brand-primary transition-colors line-clamp-2 sm:line-clamp-1"
        >
          {product.title}
        </Link>

        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-bold text-brand-primary">
            {formatPKR(product.priceRange.minVariantPrice.amount)}
          </span>
          {isOnSale && variant?.compareAtPrice && (
            <span className="text-xs sm:text-sm text-slate-400 line-through">
              {formatPKR(variant.compareAtPrice.amount)}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!isHydrated || !canQuickAdd || isLoading}
          onClick={handleAdd}
          className={
            "hidden md:block mt-4 h-11 w-full rounded-xl text-sm font-bold transition-all duration-300 " +
            (canQuickAdd
              ? "brand-cta-primary text-white active:scale-[0.98]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed")
          }
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
