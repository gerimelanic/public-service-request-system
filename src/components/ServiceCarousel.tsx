'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { REPORTABLE_SERVICES, ReportableService } from '@/lib/constants';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export function ServiceCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Monitor scroll position to update navigation arrow states
  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, []);

  // Smooth scroll container by one card width, respecting reduced-motion preferences
  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Scroll by approx one card width + gap
    const scrollAmount = (el.firstElementChild as HTMLElement)?.offsetWidth || 320;
    const offset = direction === 'left' ? -scrollAmount - 16 : scrollAmount + 16;

    el.scrollBy({
      left: offset,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="relative w-full">
      {/* Desktop Navigation Arrows */}
      <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Scroll left to previous reportable service"
          className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Scroll right to next reportable service"
          className="h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Horizontal Scroll Snap Track */}
      {/* Cards peek by sizing each card w-[82%] on mobile so the next card is partially visible */}
      <div
        ref={scrollContainerRef}
        role="region"
        aria-label="Public service categories carousel"
        tabIndex={0}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-4 sm:px-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {REPORTABLE_SERVICES.map((service: ReportableService) => (
          <article
            key={service.title}
            className="w-[82%] sm:w-[320px] md:w-[340px] shrink-0 snap-start rounded-xl border border-[#1E6B34]/25 bg-white text-zinc-950 shadow-sm hover:shadow-md hover:border-[#1E6B34] transition-all flex flex-col overflow-hidden"
          >
            {/* Fixed aspect ratio thumbnail container (prevents Cumulative Layout Shift) */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
              <Image
                src={service.image}
                alt={service.alt}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 85vw, (max-width: 1024px) 340px, 340px"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg tracking-tight text-zinc-900">
                  {service.title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Action Link */}
              <div className="pt-4 mt-2 border-t border-zinc-100">
                <Link
                  href="/requests/new"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E6B34] hover:text-[#D4A017] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6B34] rounded"
                >
                  <span>Report this issue</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#D4A017] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Mobile Swipe Cue */}
      <div className="sm:hidden flex items-center justify-center gap-1 text-[11px] text-zinc-400 mt-2">
        <span>&larr; Swipe to explore more services &rarr;</span>
      </div>
    </div>
  );
}
