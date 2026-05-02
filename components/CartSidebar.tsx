"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPKR } from "@/lib/currency";

export function CartSidebar() {
  const {
    isOpen,
    closeCart,
    cart,
    isLoading,
    checkout,
    totalQuantity,
    setLineQuantity,
    removeLine,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 bg-black/30"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white text-slate-900 border-l border-slate-100 shadow-2xl flex flex-col">
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="text-xl font-black tracking-tight">
            Your Cart
            <span className="ml-2 text-sm font-bold text-slate-400">
              ({totalQuantity})
            </span>
          </div>

          <button
            type="button"
            onClick={closeCart}
            className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center transition-colors"
            aria-label="Close cart"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {isLoading && !cart ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
               <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
               <p className="text-sm text-slate-400 font-medium">Updating cart...</p>
            </div>
          ) : null}

          {!cart || cart.lines.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
               <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8"><path d="M6 7h15l-1.5 9h-12zM6 7l-2-3H1M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
               </div>
               <p className="text-lg font-black text-slate-900">Your cart is empty</p>
               <p className="text-sm text-slate-500 mt-2">Looks like you haven't added anything yet.</p>
               <button onClick={closeCart} className="mt-6 text-brand-primary font-black uppercase tracking-widest text-xs hover:underline">Start Shopping</button>
            </div>
          ) : (
            <ul className="space-y-6">
              {cart.lines.nodes.map((line) => {
                const img = line.merchandise.product.featuredImage;
                return (
                  <li key={line.id} className="flex gap-4 group">
                    <div className="h-24 w-24 flex-shrink-0 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
                      {img?.url ? (
                        <Image
                          src={img.url}
                          alt={img.altText || line.merchandise.product.title}
                          width={img.width || 100}
                          height={100}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${line.merchandise.product.handle}`}
                        onClick={closeCart}
                        className="text-sm font-bold text-slate-900 hover:text-brand-primary transition-colors line-clamp-2"
                      >
                        {line.merchandise.product.title}
                      </Link>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        {line.merchandise.title}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 p-1">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              line.quantity > 1 &&
                              setLineQuantity(line.id, line.quantity - 1)
                            }
                            disabled={isLoading || line.quantity <= 1}
                            className="h-7 w-7 rounded-lg hover:bg-slate-100 grid place-items-center disabled:opacity-40 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3"><path d="M5 12h14" /></svg>
                          </button>
                          <div className="min-w-8 text-center text-xs font-black">
                            {line.quantity}
                          </div>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setLineQuantity(line.id, line.quantity + 1)}
                            disabled={isLoading}
                            className="h-7 w-7 rounded-lg hover:bg-slate-100 grid place-items-center disabled:opacity-40 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3"><path d="M12 5v14M5 12h14" /></svg>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={isLoading}
                          className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-sm font-black text-slate-900">
                      {formatPKR(line.merchandise.price.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtotal</div>
            <div className="text-xl font-black text-slate-900">
              {cart?.cost?.totalAmount?.amount
                ? formatPKR(cart.cost.totalAmount.amount)
                : "—"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              closeCart();
              checkout();
            }}
            disabled={totalQuantity === 0 || isLoading}
            className="w-full h-14 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 hover:bg-brand-primary hover:shadow-brand-primary/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Continue to Checkout"}
          </button>
          
          <p className="text-[10px] text-slate-400 mt-4 text-center font-bold uppercase tracking-tighter">
             Secure Checkout powered by Medusa
          </p>
        </div>
      </aside>
    </div>
  );
}
