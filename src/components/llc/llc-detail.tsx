'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Copy,
  Check,
  Eye,
  Printer,
  Loader2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import FilingPreview from './filing-preview';
import SignaturePad from './signature-pad';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_FLOW,
  parseExtraFields,
  stringifyExtraFields,
  formatCurrency,
  formatDate,
  US_STATES_LIST,
  MANAGEMENT_OPTIONS,
  type LLCFilingResponse,
} from '@/lib/llc-utils';
import { type StateFieldDef, getAllStates } from '@/lib/state-requirements';

interface LLCDetailProps {
  filingId: string;
  onBack: () => void;
}

export default function LLCDetail({ filingId, onBack }: LLCDetailProps) {
  const [filing, setFiling] = useState<LLCFilingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showClientPreview, setShowClientPreview] = useState(false);
  const [previewLink, setPreviewLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [stateFields, setStateFields] = useState<StateFieldDef[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState<Partial<LLCFilingResponse>>({});

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
        setEditData(data);
        // Load state fields
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

  const generatePreviewLink = () => {
    const token = btoa(`${filingId}-preview-${Date.now()}`).replace(/=/g, '');
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/?preview=${filingId}`;
    setPreviewLink(link);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(previewLink);
    setCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/llc/filings/${filingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setFiling(data);
        setEditing(false);
        toast.success('Presentación actualizada exitosamente');
      }
    } catch {
      toast.error('Error al guardar cambios');
    }
  };

  const updateStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/llc/filings/${filingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Estado actualizado a: ${STATUS_LABELS[newStatus]}`);
        fetchFiling();
      }
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
          Volver al Panel
        </Button>
      </div>
    );
  }

  const currentStatusIdx = STATUS_FLOW.indexOf(filing.status);
  const canEdit = filing.status === 'draft' || filing.status === 'review';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2 shrink-0">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{filing.llcName}</h1>
          <p className="text-sm text-muted-foreground">
            {filing.stateCode} — #{filing.id.slice(-6).toUpperCase()} — Creado: {formatDate(filing.createdAt)}
          </p>
        </div>
        <Badge className={STATUS_COLORS[filing.status] || ''}>
          {STATUS_LABELS[filing.status] || filing.status}
        </Badge>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Flujo de Estado</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STATUS_FLOW.map((status, idx) => (
              <div key={status} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (idx > currentStatusIdx && idx === currentStatusIdx + 1) {
                      updateStatus(status);
                    }
                  }}
                  disabled={idx > currentStatusIdx + 1 || statusUpdating}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    idx <= currentStatusIdx
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : idx === currentStatusIdx + 1
                        ? 'bg-muted hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer'
                        : 'bg-muted/50 text-muted-foreground/40'
                  }`}
                >
                  {idx <= currentStatusIdx ? (
                    <Check className="w-3 h-3" />
                  ) : idx === currentStatusIdx + 1 ? (
                    <Send className="w-3 h-3" />
                  ) : null}
                  {STATUS_LABELS[status]}
                </button>
                {idx < STATUS_FLOW.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      idx < currentStatusIdx ? 'bg-amber-400' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button
            variant={editing ? 'default' : 'outline'}
            onClick={() => setEditing(!editing)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            {editing ? 'Cancelar Edición' : 'Editar'}
          </Button>
        )}
        {editing && (
          <Button onClick={handleSave} className="gap-2">
            <Check className="w-4 h-4" />
            Guardar Cambios
          </Button>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" onClick={generatePreviewLink}>
              <Eye className="w-4 h-4" />
              Vista Previa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa del Formulario</DialogTitle>
            </DialogHeader>
            <FilingPreview filing={filing} stateFields={stateFields} showSignature={true} />
          </DialogContent>
        </Dialog>
        <Button variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
          Imprimir / PDF
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2" onClick={generatePreviewLink}>
              <Copy className="w-4 h-4" />
              Enlace para Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enlace de Vista Previa para el Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Comparta este enlace con el cliente para que revise y firme el formulario.
              </p>
              <div className="flex items-center gap-2">
                <Input value={previewLink} readOnly className="text-xs" />
                <Button onClick={copyLink} size="sm" className="shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Mode */}
      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de la LLC</Label>
                <Input
                  value={editData.llcName || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, llcName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>DBA</Label>
                <Input
                  value={editData.dbaName || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, dbaName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Propósito del Negocio</Label>
                <Textarea
                  value={editData.businessPurpose || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, businessPurpose: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Gestión</Label>
                <Select
                  value={editData.managementType || 'member-managed'}
                  onValueChange={(v) =>
                    setEditData((prev) => ({ ...prev, managementType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANAGEMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <h3 className="font-bold text-sm">Agente Registrado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editData.raName || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, raName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={editData.raAddress1 || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, raAddress1: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input
                  value={editData.raCity || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, raCity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Estado / ZIP</Label>
                <div className="flex gap-2">
                  <Input
                    value={editData.raState || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, raState: e.target.value }))
                    }
                    className="w-20"
                  />
                  <Input
                    value={editData.raZip || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, raZip: e.target.value }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <h3 className="font-bold text-sm">Dirección Principal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={editData.paAddress1 || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, paAddress1: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Línea 2</Label>
                <Input
                  value={editData.paAddress2 || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, paAddress2: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input
                  value={editData.paCity || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, paCity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Estado / ZIP</Label>
                <div className="flex gap-2">
                  <Input
                    value={editData.paState || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, paState: e.target.value }))
                    }
                    className="w-20"
                  />
                  <Input
                    value={editData.paZip || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, paZip: e.target.value }))
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <h3 className="font-bold text-sm">Organizador</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editData.organizerName || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, organizerName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input
                  value={editData.organizerEmail || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, organizerEmail: e.target.value }))
                  }
                />
              </div>
            </div>

            <Separator />

            <h3 className="font-bold text-sm">Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editData.clientName || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, clientName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input
                  value={editData.clientEmail || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, clientEmail: e.target.value }))
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Textarea
                value={editData.internalNotes || ''}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, internalNotes: e.target.value }))
                }
                placeholder="Notas visibles solo para el equipo..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Read-only view */
        <FilingPreview filing={filing} stateFields={stateFields} showSignature={true} />
      )}
    </div>
  );
}
