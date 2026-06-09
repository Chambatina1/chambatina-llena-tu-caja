'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate, parseExtraFields, STATUS_LABELS, STATUS_COLORS, US_STATES_LIST } from '@/lib/llc-utils';
import { type StateFieldDef } from '@/lib/state-requirements';
import { FileText, MapPin, User, Building2, DollarSign, CheckCircle2 } from 'lucide-react';

interface FilingPreviewProps {
  filing: {
    id: string;
    stateCode: string;
    llcName: string;
    dbaName: string | null;
    businessPurpose: string | null;
    duration: string | null;
    raName: string;
    raAddress1: string;
    raCity: string;
    raState: string;
    raZip: string;
    paAddress1: string;
    paAddress2: string | null;
    paCity: string;
    paState: string;
    paZip: string;
    organizerName: string;
    organizerTitle: string;
    organizerEmail: string | null;
    organizerPhone: string | null;
    managementType: string;
    extraFields: string | null;
    status: string;
    clientName: string | null;
    clientEmail: string | null;
    clientPhone: string | null;
    signatureData: string | null;
    signedAt: string | null;
    stateFee: number | null;
    serviceFee: number | null;
    totalFee: number | null;
    createdAt: string;
    updatedAt: string;
  };
  stateFields?: StateFieldDef[];
  showSignature?: boolean;
}

function StateName({ code }: { code: string }) {
  const st = US_STATES_LIST.find((s) => s.code === code);
  return <span>{st?.name ?? code}</span>;
}

export default function FilingPreview({ filing, stateFields, showSignature = false }: FilingPreviewProps) {
  const extra = parseExtraFields(filing.extraFields);
  const stateFieldMap: Record<string, StateFieldDef> = {};
  (stateFields || []).forEach((f) => {
    stateFieldMap[f.key] = f;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center border-b pb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-lg">
            C
          </div>
          <span className="font-bold text-lg text-foreground">Chambatina</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Artículos de Organización — LLC
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          <StateName code={filing.stateCode} /> — Filing #{filing.id.slice(-6).toUpperCase()}
        </p>
        <div className="mt-3">
          <Badge className={STATUS_COLORS[filing.status] || ''}>
            {STATUS_LABELS[filing.status] || filing.status}
          </Badge>
        </div>
      </div>

      {/* LLC Info Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-foreground">Información de la LLC</h2>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <Row label="Nombre de la LLC" value={filing.llcName} />
          <Row label="Nombre Comercial (DBA)" value={filing.dbaName} />
          <Row label="Propósito del Negocio" value={filing.businessPurpose} />
          <Row
            label="Duración"
            value={filing.duration === 'perpetual' ? 'Perpetua' : filing.duration}
          />
          <Row
            label="Tipo de Gestión"
            value={
              filing.managementType === 'member-managed'
                ? 'Gestionada por Miembros'
                : 'Gestionada por Gerentes'
            }
          />
        </div>
      </section>

      <Separator />

      {/* Registered Agent Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-foreground">Agente Registrado</h2>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <Row label="Nombre" value={filing.raName} />
          <Row label="Dirección" value={filing.raAddress1} />
          <Row label="Ciudad" value={`${filing.raCity}, ${filing.raState} ${filing.raZip}`} />
        </div>
      </section>

      <Separator />

      {/* Principal Address Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-foreground">Dirección Principal</h2>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <Row label="Dirección Línea 1" value={filing.paAddress1} />
          <Row label="Dirección Línea 2" value={filing.paAddress2} />
          <Row label="Ciudad" value={`${filing.paCity}, ${filing.paState} ${filing.paZip}`} />
        </div>
      </section>

      <Separator />

      {/* Organizer Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-foreground">Organizador</h2>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <Row label="Nombre" value={filing.organizerName} />
          <Row label="Título" value={filing.organizerTitle} />
          <Row label="Correo Electrónico" value={filing.organizerEmail} />
          <Row label="Teléfono" value={filing.organizerPhone} />
        </div>
      </section>

      {/* State-specific fields */}
      {Object.keys(extra).length > 0 && (
        <>
          <Separator />
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-foreground">Campos Específicos del Estado</h2>
            </div>
            <div className="bg-muted/40 rounded-lg p-4 space-y-2">
              {Object.entries(extra).map(([key, value]) => (
                <Row
                  key={key}
                  label={stateFieldMap[key]?.label || key}
                  value={
                    stateFieldMap[key]?.type === 'checkbox'
                      ? value === 'true'
                        ? 'Sí'
                        : 'No'
                      : value
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}

      <Separator />

      {/* Fees */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-foreground">Tarifas</h2>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <Row label="Tarifa Estatal" value={formatCurrency(filing.stateFee)} />
          <Row label="Tarifa de Servicio" value={formatCurrency(filing.serviceFee)} />
          <Row label="Total" value={formatCurrency(filing.totalFee)} bold />
        </div>
      </section>

      {/* Signature */}
      {showSignature && filing.signatureData && (
        <>
          <Separator />
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-foreground">Firma del Cliente</h2>
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <div className="mb-2">
                <img
                  src={filing.signatureData}
                  alt="Firma"
                  className="max-h-24 mx-auto"
                />
              </div>
              <Row label="Fecha de Firma" value={formatDate(filing.signedAt)} />
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <p>Generado por Plataforma Chambatina — {formatDate(filing.createdAt)}</p>
        <p className="mt-1">Este documento es parte del servicio de formación de LLC de Chambatina.</p>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value?: string | null; bold?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <span className={`sm:w-48 shrink-0 text-xs ${bold ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-bold text-foreground' : 'text-foreground'}`}>
        {value || <span className="text-muted-foreground italic">No especificado</span>}
      </span>
    </div>
  );
}
