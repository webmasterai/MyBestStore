"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { totalQuantity, toggleCart } = useCart();
  const [isSolid, setIsSolid] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setIsSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "sticky top-0 z-50 transition-all duration-300 " +
        (isSolid
          ? "bg-background/85 backdrop-blur-xl border-b border-foreground/10"
          : "bg-transparent")
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="rounded-2xl border border-slate-200 bg-white/92 px-4 h-16 flex items-center gap-3 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-extrabold tracking-tight text-brand-ink"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="h-8 w-8 rounded-lg bg-brand-primary text-white grid place-items-center text-xs font-black shadow-lg shadow-brand-primary/20">
              MB
            </span>
            <span className="text-xl">My Best Store</span>
          </Link>

          <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            <Link
              href="/#new-arrivals"
              className="text-sm font-medium px-4 py-2 rounded-full text-foreground/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
            >
              New Arrivals
            </Link>
            <Link
              href="/#categories"
              className="text-sm font-medium px-4 py-2 rounded-full text-foreground/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/search"
              className="text-sm font-medium px-4 py-2 rounded-full text-foreground/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
            >
              Shop
            </Link>
          </nav>

          <div className="hidden lg:block w-80">
            <form action="/search" method="get" role="search">
              <label className="sr-only" htmlFor="search">
                Search
              </label>
              <div className="relative">
                <input
                  id="search"
                  name="q"
                  placeholder="Search products..."
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </div>
            </form>
          </div>

          <div className="flex-1 md:flex-none" />

          <div className="flex items-center gap-3">
            <Link
              href="/account"
              aria-label="Account"
              className="hidden sm:inline-flex h-11 px-5 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-sm font-medium text-slate-700 transition-all"
            >
              Account
            </Link>

            <button
              type="button"
              onClick={toggleCart}
              aria-label="Open cart"
              className="relative h-11 w-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 mx-auto"
                aria-hidden="true"
              >
                <path d="M6 7h15l-1.5 9h-12z" />
                <path d="M6 7l-2-3H1" />
                <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              </svg>

              {totalQuantity > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 min-w-5.5 h-5.5 px-1.5 rounded-full bg-brand-primary text-white text-[10px] font-bold leading-5.5 text-center shadow-lg shadow-brand-primary/30">
                  {totalQuantity}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
