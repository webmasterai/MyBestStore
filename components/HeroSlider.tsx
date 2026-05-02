"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { HomepageHeroSlide, CommerceProductCard } from "@/lib/commerce/types";

export function HeroSlider({
  products,
  slides,
}: {
  products?: CommerceProductCard[];
  slides?: HomepageHeroSlide[];
}) {
  const [index, setIndex] = useState(0);

  const defaultSlides = useMemo<HomepageHeroSlide[]>(
    () => [
      {
        eyebrow: "Premium Collection",
        title: "Modern Style for Everyone",
        subtitle: "Experience the best quality products with seamless PKR checkout and fast delivery.",
        cta: "Shop Now",
        href: "#new-arrivals",
      },
      {
        eyebrow: "New Arrivals",
        title: "Fresh Looks for the Season",
        subtitle: "Our latest collection has arrived. Discover new favorites in fewer taps.",
        cta: "Explore Arrivals",
        href: "#new-arrivals",
      },
      {
        eyebrow: "Limited Edition",
        title: "Exclusive Quality Selection",
        subtitle: "Hand-picked items designed for those who value style and substance.",
        cta: "View Collection",
        href: "#categories",
      },
    ],
    []
  );

  const activeSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const currentSlide = activeSlides[index % activeSlides.length];
  
  // Use products for images if available, otherwise fallback
  const sliderProducts = products?.slice(0, activeSlides.length) || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  return (
    <section className="relative overflow-hidden bg-slate-50 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-1.5 text-xs font-bold text-brand-primary uppercase tracking-widest fx-fade-up">
              {currentSlide.eyebrow}
            </div>

            <h1 className="mt-6 text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-slate-900 fx-fade-up-delay-1">
              {currentSlide.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg md:text-xl text-slate-600 leading-relaxed fx-fade-up-delay-2">
              {currentSlide.subtitle}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4 fx-fade-up-delay-2">
              <Link
                href={currentSlide.href}
                className="h-14 px-8 inline-flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/20 hover:bg-brand-primary hover:shadow-brand-primary/30 transition-all active:scale-95"
              >
                {currentSlide.cta}
              </Link>
              <Link
                href="/search"
                className="h-14 px-8 inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-bold hover:bg-slate-50 transition-all"
              >
                Browse Catalog
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-3 fx-fade-up-delay-2">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={
                    "h-1.5 rounded-full transition-all duration-500 " +
                    (i === index % activeSlides.length
                      ? "w-12 bg-brand-primary"
                      : "w-4 bg-slate-300 hover:bg-slate-400")
                  }
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="relative lg:h-[600px] flex items-center justify-center">
             <div className="absolute inset-0 bg-radial from-brand-primary/10 to-transparent blur-3xl opacity-50" />
             
             <div className="relative w-full max-w-md aspect-square lg:aspect-auto lg:h-full transition-all duration-1000 ease-in-out transform">
                {activeSlides.map((_, i) => {
                  const product = sliderProducts[i];
                  const isActive = i === index % activeSlides.length;
                  
                  return (
                    <div
                      key={i}
                      className={
                        "absolute inset-0 transition-all duration-1000 flex items-center justify-center " +
                        (isActive ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-90 translate-x-12 pointer-events-none")
                      }
                    >
                      <div className="relative w-full h-full p-4">
                        <div className="w-full h-full rounded-3xl bg-white p-4 shadow-2xl border border-slate-100 overflow-hidden group">
                           {product?.featuredImage?.url ? (
                             <Image
                               src={product.featuredImage.url}
                               alt={product.title}
                               fill
                               className="object-contain p-8 group-hover:scale-110 transition-transform duration-700"
                               priority={isActive}
                             />
                           ) : (
                             <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center">
                               <span className="text-slate-300 font-bold">Premium Product</span>
                             </div>
                           )}
                           
                           {product && (
                             <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                               <div className="text-xs font-bold text-brand-primary uppercase tracking-tight">{product.title}</div>
                               <div className="text-sm font-black text-slate-900 mt-1">Available Now</div>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
