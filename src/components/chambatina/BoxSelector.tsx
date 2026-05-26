'use client';

import { BOXES, BoxConfig } from '@/lib/boxes';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Star, Truck, Weight } from 'lucide-react';

export default function BoxSelector() {
  const { selectedBox, setSelectedBox, items } = useBoxFillerStore();

  const handleSelect = (box: BoxConfig) => {
    if (items.length > 0) {
      const confirmed = window.confirm(
        'Al cambiar de caja se perderán los productos seleccionados. ¿Deseas continuar?'
      );
      if (!confirmed) return;
    }
    setSelectedBox(box);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {BOXES.map((box) => {
        const isSelected = selectedBox.id === box.id;
        const icon =
          box.id === 'small' ? '📦' : box.id === 'medium' ? '📦' : '📦';

        return (
          <Card
            key={box.id}
            className={`relative p-4 cursor-pointer transition-all ${
              isSelected
                ? 'border-2 border-primary shadow-lg bg-primary/5'
                : 'hover:border-primary/30 hover:shadow-sm'
            }`}
            onClick={() => handleSelect(box)}
          >
            {box.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] px-2">
                <Star className="w-2.5 h-2.5 mr-1" />
                Popular
              </Badge>
            )}

            <div className="flex flex-col items-center text-center gap-2">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-bold text-sm">{box.name}</h3>

              <div className="text-xs space-y-0.5 text-muted-foreground">
                <p className="font-medium text-foreground">
                  {box.width}&quot; × {box.height}&quot; × {box.depth}&quot;
                </p>
                <div className="flex items-center justify-center gap-1">
                  <Weight className="w-3 h-3" />
                  <span>Hasta {box.maxWeight} lbs</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Truck className="w-3 h-3" />
                  <span>Envío ${box.price}</span>
                </div>
                <p className="text-[10px]">
                  + ${box.managementFee.toFixed(2)} gestión
                </p>
              </div>

              <div
                className={`text-lg font-black ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}
              >
                ${box.price + box.managementFee}
              </div>

              <div
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isSelected ? 'Seleccionada' : 'Seleccionar'}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
