'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getStateFlag, getAllStates, type StateRequirementData } from '@/lib/state-requirements';

interface StateSelectorProps {
  onSelect: (state: StateRequirementData) => void;
}

export default function StateSelector({ onSelect }: StateSelectorProps) {
  const states = getAllStates();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Seleccione el Estado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Elija el estado donde desea formar su LLC. Cada estado tiene requisitos y tarifas diferentes.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {states.map((state) => (
          <Card
            key={state.stateCode}
            className="cursor-pointer hover:shadow-md hover:border-amber-400 transition-all group"
            onClick={() => onSelect(state)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-amber-900/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  {getStateFlag(state.stateCode)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm">{state.stateName}</h3>
                  <p className="text-xs text-muted-foreground">{state.stateCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    ${state.filingFee}
                  </p>
                  <p className="text-[10px] text-muted-foreground">tarifa estatal</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Procesamiento:</span>{' '}
                  {state.processingTime}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  {state.requiredFields.length} campos adicionales
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
