"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "/#new-arrivals", label: "New Arrivals" },
  { href: "/#categories", label: "Categories" },
  { href: "/search", label: "Shop" },
  { href: "/account", label: "Account" },
] as const;

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function SearchForm({
  id,
  inputRef,
  className,
}: {
  id: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  return (
    <form action="/search" method="get" role="search" className={className}>
      <label className="sr-only" htmlFor={id}>
        Search
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name="q"
          placeholder="Search products..."
          className="w-full h-11 rounded-xl border border-brand-primary/15 bg-surface-soft pl-11 pr-4 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15 transition-all"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
      </div>
    </form>
  );
}

export function Header() {
  const { totalQuantity, toggleCart } = useCart();
  const [isSolid, setIsSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setIsSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    mobileSearchRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={
          "sticky top-0 z-50 transition-all duration-300 " +
          (isSolid
            ? "bg-white/90 backdrop-blur-xl border-b border-brand-primary/10 shadow-sm shadow-brand-primary/5"
            : "bg-transparent")
        }
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 sm:py-3">
          <div className="rounded-xl sm:rounded-2xl border border-brand-primary/10 bg-white/95 px-3 sm:px-4 min-h-14 sm:min-h-16 h-auto py-2 flex items-center gap-2 sm:gap-3 shadow-sm sm:shadow-[0_8px_30px_rgba(26,77,143,0.06)]">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden h-10 w-10 rounded-xl border border-brand-primary/15 bg-white hover:bg-brand-primary/5 text-brand-primary transition-all"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 mx-auto"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <Link href="/" className="inline-flex items-center shrink-0 min-w-0 max-w-[48%] sm:max-w-none">
              <BrandLogo priority className="h-8 w-auto sm:h-10 md:h-11 lg:h-12 max-w-full" />
            </Link>

            <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
              {NAV_LINKS.slice(0, 3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium px-4 py-2 rounded-full text-foreground/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:block w-80">
              <SearchForm id="header-search-desktop" />
            </div>

            <div className="flex-1 md:flex-none" />

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                className="lg:hidden h-10 w-10 rounded-xl border border-brand-primary/15 bg-white hover:bg-brand-primary/5 hover:border-brand-accent text-brand-primary transition-all"
                aria-label={searchOpen ? "Close search" : "Open search"}
                aria-expanded={searchOpen}
                aria-controls="mobile-search-bar"
              >
                <SearchIcon className="h-5 w-5 mx-auto" />
              </button>

              <Link
                href="/account"
                aria-label="Account"
                className="hidden sm:inline-flex h-11 px-5 items-center justify-center rounded-xl border border-brand-primary/15 bg-white hover:bg-brand-primary/5 hover:border-brand-primary text-sm font-semibold text-brand-primary transition-all"
              >
                Account
              </Link>

              <button
                type="button"
                onClick={toggleCart}
                aria-label="Open cart"
                className="relative h-10 w-10 rounded-xl border border-brand-primary/15 bg-white hover:bg-brand-primary/5 hover:border-brand-primary text-brand-primary transition-all"
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
                  <span className="absolute -top-1.5 -right-1.5 min-w-5.5 h-5.5 px-1.5 rounded-full bg-brand-accent text-white text-[10px] font-bold leading-5.5 text-center shadow-lg shadow-brand-accent/30">
                    {totalQuantity}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div
            id="mobile-search-bar"
            className={
              "overflow-hidden transition-all duration-300 ease-out " +
              (searchOpen ? "max-h-20 opacity-100 mt-3" : "max-h-0 opacity-0")
            }
          >
            <div className="rounded-2xl border border-slate-200 bg-white/92 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <SearchForm
                id="header-search-mobile"
                inputRef={mobileSearchRef}
              />
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[55] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className="absolute inset-0 bg-black/30"
          />

          <aside
            id="mobile-nav-drawer"
            className="absolute left-0 top-0 h-full w-full max-w-xs bg-white text-slate-900 border-r border-slate-100 shadow-2xl flex flex-col"
          >
            <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 gap-3">
              <BrandLogo className="h-10 w-auto max-w-[70%]" />
              <button
                type="button"
                onClick={closeMenu}
                className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center transition-colors"
                aria-label="Close menu"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-brand-ink hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
