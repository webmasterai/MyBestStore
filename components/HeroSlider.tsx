"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPKR } from "@/lib/currency";
import type { HomepageHeroSlide, CommerceProductCard } from "@/lib/commerce/types";

function scrollRailToIndex(rail: HTMLElement, index: number) {
  const card = rail.children[index] as HTMLElement | undefined;
  if (!card) return;

  const targetLeft =
    card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2;

  rail.scrollTo({
    left: Math.max(0, targetLeft),
    behavior: "smooth",
  });
}

export function HeroSlider({
  products,
  slides,
}: {
  products?: CommerceProductCard[];
  slides?: HomepageHeroSlide[];
}) {
  const [index, setIndex] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const defaultSlides = useMemo<HomepageHeroSlide[]>(
    () => [
      {
        eyebrow: "New Season",
        title: "Fresh Drops Every Week",
        subtitle: "Curated arrivals with clear PKR prices, smooth checkout, and delivery across Pakistan.",
        cta: "Browse New",
        href: "#new-arrivals",
      },
      {
        eyebrow: "Premium Picks",
        title: "Quality You Can Trust",
        subtitle: "Hand-selected products from top brands — electronics, home, and lifestyle essentials.",
        cta: "Shop Now",
        href: "/search",
      },
      {
        eyebrow: "Best Value",
        title: "Deals Worth Checking",
        subtitle: "Discover seasonal offers and everyday essentials at prices that make sense.",
        cta: "View Categories",
        href: "#categories",
      },
    ],
    []
  );

  const activeSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const currentSlide = activeSlides[index % activeSlides.length];
  const sliderProducts = products?.slice(0, activeSlides.length) || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    scrollRailToIndex(rail, index);
  }, [index]);

  return (
    <section className="relative overflow-hidden brand-hero-gradient border-b border-brand-primary/10">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-accent/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
          <div className="relative z-10 order-2 lg:order-1 min-w-0">
            <div className="section-eyebrow fx-fade-up">{currentSlide.eyebrow}</div>

            <h1 className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.08] tracking-tight text-brand-ink fx-fade-up-delay-1">
              {currentSlide.title}
            </h1>

            <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed fx-fade-up-delay-2">
              {currentSlide.subtitle}
            </p>

            <div className="mt-6 sm:mt-8 flex flex-row flex-wrap items-center gap-3 fx-fade-up-delay-2">
              <Link
                href={currentSlide.href}
                className="brand-cta-primary flex-1 sm:flex-none h-12 sm:h-14 px-6 sm:px-8 inline-flex items-center justify-center rounded-2xl text-white text-sm sm:text-base font-bold transition-all active:scale-[0.98]"
              >
                {currentSlide.cta}
              </Link>
              <Link
                href="/search"
                className="brand-cta-secondary flex-1 sm:flex-none h-12 sm:h-14 px-6 sm:px-8 inline-flex items-center justify-center rounded-2xl text-sm sm:text-base font-bold transition-all active:scale-[0.98]"
              >
                Browse Catalog
              </Link>
            </div>

            <div className="mt-6 sm:mt-8 flex items-center gap-2">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={
                    "h-2 rounded-full transition-all duration-500 " +
                    (i === index % activeSlides.length
                      ? "w-10 bg-brand-accent"
                      : "w-2 bg-brand-primary/25 hover:bg-brand-primary/40")
                  }
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="relative order-1 lg:order-2 flex items-center justify-center w-full min-w-0">
            <div className="relative w-full max-w-md aspect-[4/3] sm:aspect-square lg:aspect-auto lg:h-[520px] lg:max-h-[520px]">
              <div
                className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand-primary/12 via-white to-brand-accent/15 opacity-80"
                aria-hidden="true"
              />

              {activeSlides.map((_, i) => {
                const product = sliderProducts[i];
                const isActive = i === index % activeSlides.length;

                return (
                  <div
                    key={i}
                    className={
                      "absolute inset-0 transition-all duration-700 " +
                      (isActive
                        ? "opacity-100 scale-100 z-10"
                        : "opacity-0 scale-[0.97] z-0 pointer-events-none")
                    }
                  >
                    <Link
                      href={product ? `/product/${product.handle}` : "#new-arrivals"}
                      className="relative block w-full h-full"
                    >
                      <div className="hero-product-stage relative w-full h-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-white/70 shadow-[0_20px_50px_-12px_rgba(26,77,143,0.28)]">
                        <div
                          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(26,77,143,0.16),transparent_40%),linear-gradient(160deg,#f8fbff_0%,#ffffff_45%,#f0faf4_100%)]"
                          aria-hidden="true"
                        />
                        <div
                          className="absolute left-1/2 top-[52%] h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 shadow-[inset_0_0_40px_rgba(26,77,143,0.06)] ring-1 ring-brand-primary/10"
                          aria-hidden="true"
                        />

                        {product?.featuredImage?.url ? (
                          <div className="absolute inset-[8%] sm:inset-[10%]">
                            <Image
                              src={product.featuredImage.url}
                              alt={product.title}
                              fill
                              className="object-contain drop-shadow-[0_18px_28px_rgba(15,45,77,0.22)] transition-transform duration-700 group-hover:scale-105"
                              priority={isActive}
                              sizes="(max-width: 768px) 90vw, 420px"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-brand-primary/30 font-bold text-sm">Premium Product</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {sliderProducts.length > 0 ? (
          <div className="mt-6 lg:hidden min-w-0">
            <div
              ref={railRef}
              className="flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-hide pb-1 touch-pan-x"
            >
              {sliderProducts.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={
                    "snap-center shrink-0 w-[38vw] max-w-[160px] rounded-xl border overflow-hidden bg-white product-shadow transition-all text-left " +
                    (i === index
                      ? "border-brand-accent ring-2 ring-brand-accent/30"
                      : "border-brand-primary/10 opacity-90")
                  }
                >
                  <div className="relative aspect-square bg-gradient-to-br from-surface-soft to-white">
                    {product.featuredImage?.url ? (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.title}
                        fill
                        className="object-contain p-2.5"
                        sizes="160px"
                      />
                    ) : null}
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-semibold text-brand-ink line-clamp-2 leading-snug">
                      {product.title}
                    </div>
                    <div className="text-xs font-bold text-brand-primary mt-1">
                      {formatPKR(product.priceRange.minVariantPrice.amount)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
