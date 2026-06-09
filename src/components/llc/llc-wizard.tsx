'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import StateSelector from './state-selector';
import {
  DEFAULT_FORM_DATA,
  MANAGEMENT_OPTIONS,
  DURATION_OPTIONS,
  US_STATES_LIST,
  type LLCFormData,
  type StateFieldDef,
} from '@/lib/llc-utils';
import { type StateRequirementData, getAllStates } from '@/lib/state-requirements';

interface LLCWizardProps {
  onComplete: (id: string) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 'state', label: 'Estado', num: 1 },
  { id: 'llc', label: 'Información LLC', num: 2 },
  { id: 'ra', label: 'Agente Registrado', num: 3 },
  { id: 'pa', label: 'Dirección Principal', num: 4 },
  { id: 'organizer', label: 'Organizador', num: 5 },
  { id: 'extra', label: 'Campos Específicos', num: 6 },
  { id: 'client', label: 'Cliente', num: 7 },
  { id: 'review', label: 'Revisión', num: 8 },
];

export default function LLCWizard({ onComplete, onCancel }: LLCWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<LLCFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [stateFields, setStateFields] = useState<StateFieldDef[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // When state changes, load state-specific fields
  useEffect(() => {
    if (formData.stateCode) {
      const states = getAllStates();
      const stateData = states.find((s) => s.stateCode === formData.stateCode);
      if (stateData) {
        setStateFields(stateData.requiredFields);
      }
    } else {
      setStateFields([]);
    }
  }, [formData.stateCode]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateExtraField = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      extraFields: { ...prev.extraFields, [key]: value },
    }));
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    const stepId = STEPS[currentStep].id;

    switch (stepId) {
      case 'state':
        if (!formData.stateCode) errs.stateCode = 'Seleccione un estado';
        break;
      case 'llc':
        if (!formData.llcName.trim()) errs.llcName = 'El nombre de la LLC es requerido';
        break;
      case 'ra':
        if (!formData.raName.trim()) errs.raName = 'Nombre del agente requerido';
        if (!formData.raAddress1.trim()) errs.raAddress1 = 'Dirección requerida';
        if (!formData.raCity.trim()) errs.raCity = 'Ciudad requerida';
        if (!formData.raState.trim()) {
          // Auto-fill with selected state if empty
          if (formData.stateCode) {
            setFormData(prev => ({ ...prev, raState: formData.stateCode }));
          } else {
            errs.raState = 'Estado requerido';
          }
        }
        if (!formData.raZip.trim()) errs.raZip = 'Código postal requerido';
        break;
      case 'pa':
        if (!formData.paAddress1.trim()) errs.paAddress1 = 'Dirección requerida';
        if (!formData.paCity.trim()) errs.paCity = 'Ciudad requerida';
        if (!formData.paState.trim()) {
          if (formData.stateCode) {
            setFormData(prev => ({ ...prev, paState: formData.stateCode }));
          } else {
            errs.paState = 'Estado requerido';
          }
        }
        if (!formData.paZip.trim()) errs.paZip = 'Código postal requerido';
        break;
      case 'organizer':
        if (!formData.organizerName.trim()) errs.organizerName = 'Nombre del organizador requerido';
        break;
      case 'extra':
        // Validate required state fields
        stateFields.forEach((field) => {
          if (field.required) {
            const val = formData.extraFields[field.key];
            if (!val || !val.trim()) {
              errs[`extra_${field.key}`] = `${field.label} es requerido`;
            }
          }
        });
        break;
      case 'client':
        if (!formData.clientName.trim()) errs.clientName = 'Nombre del cliente requerido';
        if (!formData.clientEmail.trim()) errs.clientEmail = 'Correo del cliente requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
          errs.clientEmail = 'Correo electrónico inválido';
        }
        break;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      // Skip extra fields step if no state-specific fields
      if (currentStep === 4 && stateFields.length === 0) {
        setCurrentStep(6);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      }
    } else {
      toast.error('Complete todos los campos requeridos');
    }
  };

  const prevStep = () => {
    // Skip extra fields step if no state-specific fields
    if (currentStep === 6 && stateFields.length === 0) {
      setCurrentStep(4);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const goToStep = (step: number) => {
    // Only allow going to steps already visited or previous
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/llc/filings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Presentación creada exitosamente');
        onComplete(data.id);
      } else {
        toast.error('Error al crear la presentación');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  const renderFieldError = (field: string) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
    ) : null;

  return (
    <div className="space-y-6" ref={scrollRef}>
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Paso {currentStep + 1} de {STEPS.length}
          </span>
          <span className="font-medium text-foreground">
            {STEPS[currentStep].label}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex flex-wrap gap-1">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => goToStep(i)}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                i === currentStep
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium'
                  : i < currentStep
                    ? 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer'
                    : 'text-muted-foreground/40'
              }`}
              disabled={i > currentStep}
            >
              {step.num}. {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: State Selector */}
          {currentStep === 0 && (
            <StateSelector
              onSelect={(state) => {
                setFormData((prev) => ({
                  ...prev,
                  stateCode: state.stateCode,
                  raState: state.stateCode,
                  paState: state.stateCode,
                }));
                const extraFields = state.requiredFields;
                if (extraFields.length === 0) {
                  setCurrentStep(2);
                } else {
                  setCurrentStep(1);
                }
              }}
            />
          )}

          {/* Step 2: LLC Information */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Información de la LLC</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ingrese los datos básicos de la Limited Liability Company.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="llcName">Nombre de la LLC *</Label>
                  <Input
                    id="llcName"
                    placeholder="Ej: Miami Business Solutions LLC"
                    value={formData.llcName}
                    onChange={(e) => updateField('llcName', e.target.value)}
                  />
                  {renderFieldError('llcName')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dbaName">Nombre Comercial (DBA)</Label>
                  <Input
                    id="dbaName"
                    placeholder="Nombre bajo el cual opera el negocio (opcional)"
                    value={formData.dbaName}
                    onChange={(e) => updateField('dbaName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPurpose">Propósito del Negocio</Label>
                  <Textarea
                    id="businessPurpose"
                    placeholder="Describa el propósito del negocio (opcional)"
                    value={formData.businessPurpose}
                    onChange={(e) => updateField('businessPurpose', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duración</Label>
                    <Select value={formData.duration} onValueChange={(v) => updateField('duration', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Gestión</Label>
                    <Select
                      value={formData.managementType}
                      onValueChange={(v) => updateField('managementType', v)}
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
              </div>
            </div>
          )}

          {/* Step 3: Registered Agent */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Agente Registrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  El agente registrado recibe documentos legales en nombre de la LLC. Debe tener una dirección física en el estado.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="raName">Nombre del Agente Registrado *</Label>
                  <Input
                    id="raName"
                    placeholder="Nombre completo o nombre de la empresa"
                    value={formData.raName}
                    onChange={(e) => updateField('raName', e.target.value)}
                  />
                  {renderFieldError('raName')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="raAddress1">Dirección *</Label>
                  <Input
                    id="raAddress1"
                    placeholder="Calle y número"
                    value={formData.raAddress1}
                    onChange={(e) => updateField('raAddress1', e.target.value)}
                  />
                  {renderFieldError('raAddress1')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="raCity">Ciudad *</Label>
                    <Input
                      id="raCity"
                      placeholder="Ciudad"
                      value={formData.raCity}
                      onChange={(e) => updateField('raCity', e.target.value)}
                    />
                    {renderFieldError('raCity')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raState">Estado *</Label>
                    <Select value={formData.raState} onValueChange={(v) => updateField('raState', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES_LIST.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.code} — {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderFieldError('raState')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raZip">Código Postal *</Label>
                    <Input
                      id="raZip"
                      placeholder="12345"
                      value={formData.raZip}
                      onChange={(e) => updateField('raZip', e.target.value)}
                    />
                    {renderFieldError('raZip')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Principal Address */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Dirección Principal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  La dirección principal del negocio de la LLC.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paAddress1">Dirección Línea 1 *</Label>
                  <Input
                    id="paAddress1"
                    placeholder="Calle y número"
                    value={formData.paAddress1}
                    onChange={(e) => updateField('paAddress1', e.target.value)}
                  />
                  {renderFieldError('paAddress1')}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paAddress2">Dirección Línea 2</Label>
                  <Input
                    id="paAddress2"
                    placeholder="Apartamento, suite, unidad (opcional)"
                    value={formData.paAddress2}
                    onChange={(e) => updateField('paAddress2', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paCity">Ciudad *</Label>
                    <Input
                      id="paCity"
                      placeholder="Ciudad"
                      value={formData.paCity}
                      onChange={(e) => updateField('paCity', e.target.value)}
                    />
                    {renderFieldError('paCity')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paState">Estado *</Label>
                    <Select value={formData.paState} onValueChange={(v) => updateField('paState', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES_LIST.map((s) => (
                          <SelectItem key={s.code} value={s.code}>
                            {s.code} — {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {renderFieldError('paState')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paZip">Código Postal *</Label>
                    <Input
                      id="paZip"
                      placeholder="12345"
                      value={formData.paZip}
                      onChange={(e) => updateField('paZip', e.target.value)}
                    />
                    {renderFieldError('paZip')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Organizer */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Información del Organizador</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  La persona que organiza y presenta los artículos de la LLC.
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizerName">Nombre Completo *</Label>
                    <Input
                      id="organizerName"
                      placeholder="Nombre del organizador"
                      value={formData.organizerName}
                      onChange={(e) => updateField('organizerName', e.target.value)}
                    />
                    {renderFieldError('organizerName')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizerTitle">Título</Label>
                    <Input
                      id="organizerTitle"
                      placeholder="Organizador"
                      value={formData.organizerTitle}
                      onChange={(e) => updateField('organizerTitle', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizerEmail">Correo Electrónico</Label>
                    <Input
                      id="organizerEmail"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.organizerEmail}
                      onChange={(e) => updateField('organizerEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizerPhone">Teléfono</Label>
                    <Input
                      id="organizerPhone"
                      placeholder="(555) 123-4567"
                      value={formData.organizerPhone}
                      onChange={(e) => updateField('organizerPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: State-specific fields */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Campos Específicos de {formData.stateCode}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete los campos adicionales requeridos por el estado de {formData.stateCode}.
                </p>
              </div>
              {stateFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay campos adicionales para este estado.</p>
                  <Button variant="outline" className="mt-3" onClick={nextStep}>
                    Continuar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stateFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={`extra_${field.key}`}>
                        {field.label} {field.required && '*'}
                      </Label>
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      )}
                      {field.type === 'text' || field.type === 'date' ? (
                        <Input
                          id={`extra_${field.key}`}
                          type={field.type === 'date' ? 'date' : 'text'}
                          placeholder={field.placeholder}
                          value={formData.extraFields[field.key] || field.defaultValue || ''}
                          onChange={(e) => updateExtraField(field.key, e.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <Select
                          value={formData.extraFields[field.key] || field.defaultValue || ''}
                          onValueChange={(v) => updateExtraField(field.key, v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options || []).map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'textarea' ? (
                        <Textarea
                          id={`extra_${field.key}`}
                          placeholder={field.placeholder}
                          value={formData.extraFields[field.key] || ''}
                          onChange={(e) => updateExtraField(field.key, e.target.value)}
                          rows={3}
                        />
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`extra_${field.key}`}
                            checked={formData.extraFields[field.key] === 'true' || field.defaultValue === 'true'}
                            onCheckedChange={(checked) =>
                              updateExtraField(field.key, checked ? 'true' : 'false')
                            }
                          />
                          <Label htmlFor={`extra_${field.key}`} className="text-sm">
                            {field.label}
                          </Label>
                        </div>
                      ) : null}
                      {renderFieldError(`extra_${field.key}`)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 7: Client Info */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Información del Cliente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Datos de la persona que revisará y firmará el formulario.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre del Cliente *</Label>
                  <Input
                    id="clientName"
                    placeholder="Nombre completo del cliente"
                    value={formData.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                  />
                  {renderFieldError('clientName')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Correo Electrónico *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.clientEmail}
                      onChange={(e) => updateField('clientEmail', e.target.value)}
                    />
                    {renderFieldError('clientEmail')}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Teléfono</Label>
                    <Input
                      id="clientPhone"
                      placeholder="(555) 123-4567"
                      value={formData.clientPhone}
                      onChange={(e) => updateField('clientPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Review */}
          {currentStep === 7 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Revisión de la Presentación</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Revise todos los datos antes de enviar. Puede volver a cualquier paso para hacer cambios.
                </p>
              </div>
              <div className="space-y-4">
                <ReviewSection title="Información de la LLC" step={1}>
                  <ReviewRow label="Nombre" value={formData.llcName} />
                  <ReviewRow label="DBA" value={formData.dbaName} />
                  <ReviewRow label="Propósito" value={formData.businessPurpose} />
                  <ReviewRow
                    label="Duración"
                    value={
                      DURATION_OPTIONS.find((d) => d.value === formData.duration)?.label ||
                      formData.duration
                    }
                  />
                  <ReviewRow
                    label="Gestión"
                    value={
                      MANAGEMENT_OPTIONS.find((m) => m.value === formData.managementType)
                        ?.label || formData.managementType
                    }
                  />
                </ReviewSection>

                <ReviewSection title="Agente Registrado" step={2}>
                  <ReviewRow label="Nombre" value={formData.raName} />
                  <ReviewRow label="Dirección" value={`${formData.raAddress1}, ${formData.raCity}, ${formData.raState} ${formData.raZip}`} />
                </ReviewSection>

                <ReviewSection title="Dirección Principal" step={3}>
                  <ReviewRow label="Dirección" value={`${formData.paAddress1}${formData.paAddress2 ? ', ' + formData.paAddress2 : ''}, ${formData.paCity}, ${formData.paState} ${formData.paZip}`} />
                </ReviewSection>

                <ReviewSection title="Organizador" step={4}>
                  <ReviewRow label="Nombre" value={formData.organizerName} />
                  <ReviewRow label="Título" value={formData.organizerTitle} />
                  <ReviewRow label="Correo" value={formData.organizerEmail} />
                  <ReviewRow label="Teléfono" value={formData.organizerPhone} />
                </ReviewSection>

                {Object.keys(formData.extraFields).length > 0 && (
                  <ReviewSection title="Campos del Estado" step={5}>
                    {Object.entries(formData.extraFields).map(([key, val]) => (
                      <ReviewRow
                        key={key}
                        label={stateFields.find((f) => f.key === key)?.label || key}
                        value={
                          stateFields.find((f) => f.key === key)?.type === 'checkbox'
                            ? val === 'true'
                              ? 'Sí'
                              : 'No'
                            : val
                        }
                      />
                    ))}
                  </ReviewSection>
                )}

                <ReviewSection title="Cliente" step={6}>
                  <ReviewRow label="Nombre" value={formData.clientName} />
                  <ReviewRow label="Correo" value={formData.clientEmail} />
                  <ReviewRow label="Teléfono" value={formData.clientPhone} />
                </ReviewSection>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : prevStep}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 0 ? 'Cancelar' : 'Anterior'}
        </Button>

        <div className="flex items-center gap-3">
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={nextStep} className="gap-2">
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Crear Presentación
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm text-foreground">{title}</h4>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-amber-600 hover:text-amber-700"
          onClick={() => {}}
        >
          Editar
        </Button>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-0.5">
      <span className="text-xs text-muted-foreground sm:w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground italic">No especificado</span>}
      </span>
    </div>
  );
}
