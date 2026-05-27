'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PRODUCT_CATEGORIES as STORE_CATEGORIES, PRODUCTS as STORE_PRODUCTS } from '@/lib/products';
import type { Product } from '@/lib/products';

export default function TiendaPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = useCallback((productId: string) => {
    setFailedImages((prev) => new Set(prev).add(productId));
  }, []);

  const getImageSrc = useCallback((product: Product) => {
    if (failedImages.has(product.id)) return '';
    if (product.imageUrl) return product.imageUrl;
    return `/api/walmart-image?url=${encodeURIComponent(product.walmartUrl)}`;
  }, [failedImages]);

  const filteredProducts = useMemo(() => {
    return STORE_PRODUCTS.filter((p) => {
      const matchCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nameEs.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [categoryFilter, search]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-indigo-50/40 dark:from-background dark:to-indigo-950/10">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                C
              </div>
              <div>
                <h1 className="text-lg font-extrabold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent leading-tight">
                  Tienda Chambatina
                </h1>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Equipos, electrónicos, muebles y más
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-muted hover:bg-muted transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/box-filler"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              Walmart Caja
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Page title */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                Tienda Chambatina
              </h2>
              <p className="text-sm text-muted-foreground">
                {STORE_PRODUCTS.length} equipos disponibles — electrónicos, muebles, baterías y más
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-6">
          {/* Search bar */}
          <div className="relative mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Buscar equipos, electrónicos, muebles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              style={{ touchAction: 'manipulation' }}
            />
          </div>

          {/* Category filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {STORE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Product count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
          {filteredProducts.map((product) => {
            const imgSrc = getImageSrc(product);
            const hasImage = imgSrc !== '';

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                {/* Image area */}
                <div className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden">
                  {hasImage ? (
                    <img
                      src={imgSrc}
                      alt={product.nameEs}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={() => handleImageError(product.id)}
                      draggable={false}
                    />
                  ) : (
                    <span className="text-5xl">{product.emoji}</span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1 min-h-[2.5rem]">
                    {product.nameEs}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                      ${product.price.toFixed(2)}
                    </p>
                    <a
                      href={product.walmartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 transition-all shadow-sm hover:shadow-md"
                    >
                      Ver Producto
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-background/80 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; 2025 Chambatina — Tienda</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Inicio
            </Link>
            <Link href="/box-filler" className="hover:text-foreground transition-colors">
              Walmart Caja
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
