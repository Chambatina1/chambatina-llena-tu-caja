import Link from "next/link";

export default function LandingPage() {
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
                Llena tu Caja, Llena tu Mesa
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
            <span>Servicio de envío a Nicaragua</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4">
            Arma tu caja de productos{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Walmart
            </span>
            {' '}para tu pueblo
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Selecciona de más de 135 productos reales de Walmart. Visualiza en 3D cómo se acomodan en tu caja.
            Envío hasta 30 días por mar. Precios con tax incluido.
          </p>
          <Link
            href="/box-filler"
            className="inline-flex items-center gap-2 text-lg font-bold px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            <span>Llena tu Caja</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
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
                Más de 135 productos reales de Walmart: granos, enlatados, lácteos estables,
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
                <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">135+</p>
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
          <p>&copy; 2025 Chambatina — Llena tu Caja, Llena tu Mesa</p>
          <p>
            Precios de Walmart sujetos a cambio &middot; Tax ~7% incluido
          </p>
        </div>
      </footer>
    </div>
  );
}
