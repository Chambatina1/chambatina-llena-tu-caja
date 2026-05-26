'use client';

import { PRODUCT_CATEGORIES, PRODUCTS } from '@/lib/products';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Check, Package, ExternalLink, Weight, BoxIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProductCatalog() {
  const store = useBoxFillerStore();
  const categoryFilter = store.categoryFilter;
  const setCategoryFilter = store.setCategoryFilter;
  const addProduct = store.addProduct;
  const isBoxFull = store.boxFull();
  const rejectReason = store.rejectReason;
  const [search, setSearch] = useState('');

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

  const items = useBoxFillerStore((s) => s.items);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.product.id] = (counts[item.product.id] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          W
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Productos Walmart</p>
          <p className="text-[10px] text-muted-foreground">
            Precios actuales · {PRODUCTS.length} productos disponibles
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-4 h-9 text-xs"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {PRODUCT_CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] px-2 py-0.5 transition-colors"
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Product grid */}
      <ScrollArea className="flex-1 pr-2" style={{ maxHeight: 'calc(100vh - 380px)' }}>
        {isBoxFull && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 mb-3 text-xs text-red-600 dark:text-red-400 text-center">
            La caja esta llena — no puedes agregar mas productos
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pb-4">
          {filteredProducts.map((product, index) => {
            const reason = rejectReason(product);
            const canAdd = reason === null && !isBoxFull;
            const count = itemCounts[product.id] || 0;

            // Determine rejection message
            let rejectMsg = '';
            if (isBoxFull) {
              rejectMsg = 'Caja llena';
            } else if (reason === 'peso') {
              rejectMsg = 'Supera peso';
            } else if (reason === 'espacio') {
              rejectMsg = 'Caja llena';
            }

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
              >
                <Card
                  className={
                    'relative p-2.5 transition-all group ' +
                    (canAdd
                      ? 'hover:shadow-md hover:border-primary/40 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed') +
                    (count > 0 ? ' border-green-400 bg-green-50/50 dark:bg-green-950/20' : '')
                  }
                  onClick={() => {
                    if (canAdd) addProduct(product);
                  }}
                >
                  {count > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10">
                      {count}
                    </div>
                  )}

                  <div className="flex flex-col items-center text-center gap-1">
                    <span className="text-xl leading-none">{product.emoji}</span>

                    <div className="min-h-[2.2rem]">
                      <p className="text-[11px] font-semibold leading-tight line-clamp-2">
                        {product.nameEs}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Weight className="w-2.5 h-2.5" />
                        {product.weight} lb
                      </span>
                      <span className="flex items-center gap-0.5">
                        <BoxIcon className="w-2.5 h-2.5" />
                        {product.volume} in³
                      </span>
                    </div>

                    <p className="text-sm font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </p>

                    <Button
                      size="sm"
                      variant={canAdd ? 'outline' : 'secondary'}
                      disabled={!canAdd}
                      className="w-full h-6 text-[10px] mt-0.5"
                    >
                      {canAdd ? (
                        <span className="flex items-center gap-0.5">
                          <Plus className="w-2.5 h-2.5" />
                          Agregar
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          {rejectMsg}
                        </span>
                      )}
                    </Button>

                    {/* Rejection detail on hover */}
                    {!canAdd && !isBoxFull && (
                      <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                        {reason === 'peso'
                          ? `Pesa ${product.weight} lb — supera el limite`
                          : reason === 'espacio'
                            ? `${product.width}"×${product.height}"×${product.depth}" — no hay espacio`
                            : ''}
                      </p>
                    )}

                    <a
                      href={product.walmartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver en Walmart
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
