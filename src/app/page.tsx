'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const slides = [
  {
    emoji: '📦',
    title: 'Walmart a tu Familia',
    description: 'Elige entre 3 tamaños de caja y selecciona productos reales de Walmart. Visualización 3D en tiempo real.',
    cta: 'Comenzar Ahora',
    gradient: 'from-orange-400 to-amber-400',
    gradientBg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
  },
  {
    emoji: '🚢',
    title: 'Envío Marítimo Seguro',
    description: 'Tus productos viajan por mar hasta tu destino. Todos los productos son no perecederos, perfectos para 30 días de travesía.',
    cta: 'Ver Productos',
    gradient: 'from-sky-400 to-cyan-400',
    gradientBg: 'from-sky-50 to-cyan-50',
    border: 'border-sky-200',
  },
  {
    emoji: '💰',
    title: 'Precios con Tax Incluido',
    description: 'Los precios muestran el tax de Walmart (~7%). Sin sorpresas. Solo paga el costo real del producto más el envío.',
    cta: 'Armar mi Caja',
    gradient: 'from-green-400 to-emerald-400',
    gradientBg: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
  },
  {
    emoji: '⚖️',
    title: 'Peso y Volumen Precisos',
    description: 'Nuestro sistema calcula exactamente el peso y volumen de cada producto. Cuando la caja se llena, se cierra automáticamente.',
    cta: 'Probar Ahora',
    gradient: 'from-purple-400 to-pink-400',
    gradientBg: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
  },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    timerRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-orange-50/40 dark:from-background dark:to-orange-950/10">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              C
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent leading-tight">
                Chambatina
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Walmart a tu Familia
              </p>
            </div>
          </div>
          <Link
            href="/box-filler"
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            Comenzar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span>📦</span>
            <span>Walmart a tu Familia</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Walmart a tu Familia
            </span>
            {' '}— Productos reales, envío seguro
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Chambatina — Walmart a tu Familia. Selecciona de más de 157 productos reales de Walmart. Visualiza en 3D cómo se acomodan en tu caja.
            Envío hasta 30 días por mar. Precios con tax incluido.
          </p>
          <Link
            href="/box-filler"
            className="inline-flex items-center gap-2 text-lg font-bold px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            <span>Walmart a tu Familia</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* ── Carousel Section ── */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="relative">
            {/* Arrow buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-card/90 border shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-card transition-colors"
              aria-label="Anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-10 h-10 rounded-full bg-white/90 dark:bg-card/90 border shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-card transition-colors"
              aria-label="Siguiente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>

            {/* Slides container */}
            <div className="overflow-hidden mx-8">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide, i) => (
                  <div key={i} className="w-full shrink-0 px-2">
                    <div className={`bg-gradient-to-br ${slide.gradientBg} dark:from-card dark:to-card border ${slide.border} dark:border-muted rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm`}>
                      {/* Image area with gradient */}
                      <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                        <span className="text-5xl sm:text-6xl">{slide.emoji}</span>
                      </div>
                      {/* Text content */}
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2">{slide.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{slide.description}</p>
                        <Link
                          href="/box-filler"
                          className={`inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-lg bg-gradient-to-r ${slide.gradient} text-white shadow hover:shadow-lg transition-all`}
                        >
                          {slide.cta}
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentSlide
                      ? 'bg-orange-500 w-6'
                      : 'bg-orange-200 dark:bg-orange-800 hover:bg-orange-300'
                  }`}
                  aria-label={`Ir al slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How it works - 3 feature cards */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <h3 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-wider mb-8">
            Cómo funciona
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-card border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-bold text-foreground mb-2">Elige tu caja</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tres tamaños: Mediana (12&quot;), Grande (15&quot;) o Extra Grande (16&quot;).
                Cada caja tiene límites de peso y volumen para que todo quepa perfecto.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-card border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-bold text-foreground mb-2">Agrega productos</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Más de 157 productos reales de Walmart: granos, enlatados, lácteos estables,
                chocolates, condimentos y más. Precios con tax incluido (~7%).
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-card border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-bold text-foreground mb-2">Completa tu pedido</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cuando tu caja esté llena, presiona &quot;Completar Pedido&quot;. El precio incluye
                productos + tax + envío marítimo + fee de gestión.
              </p>
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">157+</p>
                <p className="text-xs text-muted-foreground mt-1">Productos disponibles</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">12</p>
                <p className="text-xs text-muted-foreground mt-1">Categorías</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">3D</p>
                <p className="text-xs text-muted-foreground mt-1">Visualización en vivo</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">30 días</p>
                <p className="text-xs text-muted-foreground mt-1">Envío marítimo</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-background/80 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2025 Chambatina — Walmart a tu Familia</p>
          <p>
            Precios de Walmart sujetos a cambio &middot; Tax ~7% incluido
          </p>
        </div>
      </footer>
    </div>
  );
}
