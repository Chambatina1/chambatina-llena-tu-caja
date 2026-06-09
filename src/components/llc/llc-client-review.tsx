'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad, { type SignaturePadHandle } from './signature-pad';
import FilingPreview from './filing-preview';
import {
  type LLCFilingResponse,
  parseExtraFields,
  formatDate,
} from '@/lib/llc-utils';
import { type StateFieldDef, getAllStates } from '@/lib/state-requirements';

interface LLCClientReviewProps {
  filingId: string;
  onBack: () => void;
}

export default function LLCClientReview({ filingId, onBack }: LLCClientReviewProps) {
  const [filing, setFiling] = useState<LLCFilingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatureData, setSignatureData] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stateFields, setStateFields] = useState<StateFieldDef[]>([]);
  const sigPadRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    fetchFiling();
  }, [filingId]);

  const fetchFiling = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/llc/filings/${filingId}`);
      if (res.ok) {
        const data = await res.json();
        setFiling(data);
        if (data.signatureData) {
          setSignatureData(data.signatureData);
        }
        const states = getAllStates();
        const stateData = states.find((s) => s.stateCode === data.stateCode);
        if (stateData) {
          setStateFields(stateData.requiredFields);
        }
      }
    } catch (err) {
      console.error('Error fetching filing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!signatureData) {
      toast.error('Por favor firme el documento antes de enviar');
      return;
    }
    if (!confirmed) {
      toast.error('Por favor confirme que los datos son correctos');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/llc/filings/${filingId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData }),
      });
      if (res.ok) {
        toast.success('Formulario firmado exitosamente');
        fetchFiling();
      } else {
        toast.error('Error al guardar la firma');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    sigPadRef.current?.clear();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!filing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Presentación no encontrada</p>
        <Button variant="outline" className="mt-3" onClick={onBack}>
          Volver
        </Button>
      </div>
    );
  }

  if (filing.signatureData && filing.signedAt) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Formulario Firmado Exitosamente
            </h2>
            <p className="text-muted-foreground">
              Su firma fue registrada el {formatDate(filing.signedAt)}.
            </p>
            <div className="pt-4">
              <img
                src={filing.signatureData}
                alt="Su firma"
                className="max-h-24 mx-auto border rounded p-2"
              />
            </div>
            <Separator />
            <FilingPreview filing={filing} stateFields={stateFields} showSignature={true} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Revisión y Firma del Cliente</h1>
          <p className="text-sm text-muted-foreground">
            Revise todos los datos y firme para confirmar
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Formulario</CardTitle>
        </CardHeader>
        <CardContent>
          <FilingPreview filing={filing} stateFields={stateFields} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Firma Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Use el mouse o su dedo para firmar en el área de abajo. Al firmar, confirma que
            toda la información proporcionada es correcta.
          </p>

          <SignaturePad
            ref={sigPadRef}
            onSign={(data) => setSignatureData(data)}
          />

          <div className="flex items-start gap-3">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <div>
              <label htmlFor="confirm" className="text-sm font-medium cursor-pointer">
                Confirmo que todos los datos son correctos
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Al marcar esta casilla y firmar, acepta los datos presentados en este formulario
                como exactos y completos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!signatureData || !confirmed || submitting}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Firmar y Enviar
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Borrar Firma
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
