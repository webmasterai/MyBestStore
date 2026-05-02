"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useCart } from "@/context/CartContext";

type Variant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
};

export function AddToCartForm({ variants }: { variants: Variant[] }) {
  const { addVariant, isLoading } = useCart();
  const [error, setError] = useState<string | null>(null);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const firstAvailable = useMemo(
    () => variants.find((v) => v.availableForSale) || variants[0],
    [variants]
  );
  const [variantId, setVariantId] = useState(firstAvailable?.id || "");

  const current = variants.find((v) => v.id === variantId);
  const canAdd = Boolean(current?.id && current.availableForSale);

  const handleAddToCart = async () => {
    setError(null);
    try {
      if (!variantId) {
        throw new Error("Please select a variant");
      }
      await addVariant(variantId, 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add to cart";
      setError(message);
      console.error("[AddToCartForm] Error adding variant:", err);
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest" htmlFor="variant">
        Select Variant
      </label>
      <select
        id="variant"
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-brand-primary transition-all cursor-pointer"
        value={variantId}
        onChange={(e) => {
          setVariantId(e.target.value);
          setError(null);
        }}
      >
        {variants.map((v) => (
          <option key={v.id} value={v.id} disabled={!v.availableForSale}>
            {v.title}{v.availableForSale ? "" : " (Sold out)"}
          </option>
        ))}
      </select>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!isHydrated || !canAdd || isLoading}
        className="h-14 w-full rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 hover:bg-brand-primary hover:shadow-brand-primary/30 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isLoading ? "Adding to Cart..." : "Add to Shopping Cart"}
      </button>
    </div>
  );
}
