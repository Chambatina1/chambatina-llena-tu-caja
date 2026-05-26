'use client';

import { Product, PRODUCT_CATEGORIES, PRODUCTS } from '@/lib/products';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Check, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProductCatalog() {
  const { categoryFilter, setCategoryFilter, addProduct, canAddProduct } = useBoxFillerStore();
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [categoryFilter, search]);

  // Subscribe to items changes for re-render
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
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-4"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {PRODUCT_CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1 transition-colors"
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Product grid */}
      <ScrollArea className="flex-1 pr-2" style={{ maxHeight: 'calc(100vh - 420px)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 pb-4">
          {filteredProducts.map((product, index) => {
            const canAdd = canAddProduct(product);
            const count = itemCounts[product.id] || 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
              >
                <Card
                  className={`relative p-3 transition-all cursor-pointer group ${
                    canAdd
                      ? 'hover:shadow-md hover:border-primary/40'
                      : 'opacity-50 cursor-not-allowed'
                  } ${count > 0 ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                  onClick={() => canAdd && addProduct(product)}
                >
                  {count > 0 && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-10">
                      {count}
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <span className="text-2xl">{product.emoji}</span>
                    <div className="min-h-[2.5rem]">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">
                        {product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Package className="w-3 h-3" />
                        {product.weight} lb
                      </span>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      variant={canAdd ? 'outline' : 'secondary'}
                      disabled={!canAdd}
                      className="w-full h-7 text-xs mt-1"
                    >
                      {canAdd ? (
                        <>
                          <Plus className="w-3 h-3 mr-1" />
                          Agregar
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Lleno
                        </>
                      )}
                    </Button>
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
