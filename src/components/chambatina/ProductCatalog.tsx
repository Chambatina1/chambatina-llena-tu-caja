'use client';

import { PRODUCT_CATEGORIES, PRODUCTS } from '@/lib/products';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { useState, useMemo, useCallback } from 'react';

export default function ProductCatalog() {
  const store = useBoxFillerStore();
  const categoryFilter = store.categoryFilter;
  const setCategoryFilter = store.setCategoryFilter;
  const addProduct = store.addProduct;
  const rejectReason = store.rejectReason;
  const items = store.items;

  const [search, setSearch] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = useCallback((productId: string) => {
    setFailedImages((prev) => new Set(prev).add(productId));
  }, []);

  const getImageSrc = useCallback(
    (product: (typeof PRODUCTS)[number]) => {
      if (failedImages.has(product.id)) return null;
      if (product.imageUrl) return product.imageUrl;
      return `/api/walmart-image?url=${encodeURIComponent(product.walmartUrl)}`;
    },
    [failedImages]
  );

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nameEs.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [categoryFilter, search]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.product.id] = (counts[item.product.id] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="flex flex-col gap-3" style={{ touchAction: 'manipulation' }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          W
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Productos Walmart</p>
          <p className="text-[10px] text-muted-foreground">
            Precios actuales · {PRODUCTS.length} productos
          </p>
        </div>
      </div>

      {/* Search - native input */}
      <input
        placeholder="Buscar productos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full h-9 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
        style={{ touchAction: 'manipulation' }}
      />

      {/* Category filter - native buttons */}
      <div className="flex gap-1 flex-wrap">
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className="text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors"
            style={{
              touchAction: 'manipulation',
              backgroundColor: categoryFilter === cat ? '#2563eb' : '#f3f4f6',
              color: categoryFilter === cat ? '#fff' : '#374151',
            }}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid - plain div, NO ScrollArea, NO motion */}
      <div style={{ maxHeight: '70vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="grid grid-cols-2 gap-2 pb-4">
          {filteredProducts.map((product) => {
            const reason = rejectReason(product);
            // Only check if this specific product fits — no global "box full" block
            const canAdd = reason === null;
            const count = itemCounts[product.id] || 0;

            let rejectMsg = '';
            if (reason === 'peso') rejectMsg = 'Supera peso';
            else if (reason === 'espacio') rejectMsg = 'Sin espacio';

            return (
              <div
                key={product.id}
                onClick={() => {
                  if (canAdd) addProduct(product);
                }}
                className={
                  'relative p-2.5 rounded-xl border transition-all ' +
                  (canAdd
                    ? 'bg-white dark:bg-gray-800 hover:shadow-md hover:border-blue-300 active:scale-95 cursor-pointer border-gray-200 dark:border-gray-700'
                    : 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700') +
                  (count > 0 ? ' !border-green-400 !bg-green-50 dark:!bg-green-950/20' : '')
                }
                style={{ touchAction: 'manipulation' }}
              >
                {count > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center z-10">
                    {count}
                  </div>
                )}

                <div className="flex flex-col items-center text-center gap-1">
                  {(() => {
                    const imgSrc = getImageSrc(product);
                    return imgSrc ? (
                      <div
                        className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: product.color + '22' }}
                      >
                        <img
                          src={imgSrc}
                          alt={product.nameEs}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={() => handleImageError(product.id)}
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: product.color + '33' }}
                      >
                        <span className="text-2xl leading-none">{product.emoji}</span>
                      </div>
                    );
                  })()}

                  <div className="min-h-[2.2rem]">
                    <p className="text-[11px] font-semibold leading-tight line-clamp-2">
                      {product.nameEs}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] text-gray-500">
                    <span>{product.weight} lb</span>
                    <span>{product.volume} in³</span>
                  </div>

                  <p className="text-sm font-bold text-blue-600">
                    ${product.price.toFixed(2)}
                  </p>

                  {canAdd ? (
                    <div
                      className="w-full py-1 text-[10px] font-bold rounded-lg text-center text-blue-600 border border-blue-200 bg-blue-50"
                    >
                      + Agregar
                    </div>
                  ) : (
                    <div className="w-full py-1 text-[10px] font-medium rounded-lg text-center text-gray-400 bg-gray-100 dark:bg-gray-800">
                      {rejectMsg}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
