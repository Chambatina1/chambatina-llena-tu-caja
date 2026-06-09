import { type StateFieldDef } from './state-requirements';

export interface LLCFormData {
  // Step 1: State
  stateCode: string;
  // Step 2: LLC Info
  llcName: string;
  dbaName: string;
  businessPurpose: string;
  duration: string;
  managementType: string;
  // Step 3: Registered Agent
  raName: string;
  raAddress1: string;
  raCity: string;
  raState: string;
  raZip: string;
  // Step 4: Principal Address
  paAddress1: string;
  paAddress2: string;
  paCity: string;
  paState: string;
  paZip: string;
  // Step 5: Organizer
  organizerName: string;
  organizerTitle: string;
  organizerEmail: string;
  organizerPhone: string;
  // Step 6: Extra Fields
  extraFields: Record<string, string>;
  // Step 7: Client
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  // Internal
  assignedTo: string;
  internalNotes: string;
}

export const DEFAULT_FORM_DATA: LLCFormData = {
  stateCode: '',
  llcName: '',
  dbaName: '',
  businessPurpose: '',
  duration: 'perpetual',
  managementType: 'member-managed',
  raName: '',
  raAddress1: '',
  raCity: '',
  raState: '',
  raZip: '',
  paAddress1: '',
  paAddress2: '',
  paCity: '',
  paState: '',
  paZip: '',
  organizerName: '',
  organizerTitle: 'Organizador',
  organizerEmail: '',
  organizerPhone: '',
  extraFields: {},
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  assignedTo: '',
  internalNotes: '',
};

export interface LLCFilingResponse {
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
  assignedTo: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  signatureData: string | null;
  signedAt: string | null;
  internalNotes: string | null;
  stateFee: number | null;
  serviceFee: number | null;
  totalFee: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StateRequirementResponse {
  id: string;
  stateCode: string;
  stateName: string;
  filingFee: number | null;
  requiredFields: StateFieldDef[];
  filingOffice: string | null;
  processingTime: string | null;
  notes: string | null;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  review: 'En Revisión',
  client_reviewed: 'Revisado por Cliente',
  signed: 'Firmado',
  filed: 'Presentado',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  review: 'bg-amber-100 text-amber-700 border-amber-200',
  client_reviewed: 'bg-blue-100 text-blue-700 border-blue-200',
  signed: 'bg-green-100 text-green-700 border-green-200',
  filed: 'bg-purple-100 text-purple-700 border-purple-200',
};

export const STATUS_FLOW = ['draft', 'review', 'client_reviewed', 'signed', 'filed'];

export const MANAGEMENT_OPTIONS = [
  { value: 'member-managed', label: 'Gestionada por Miembros' },
  { value: 'manager-managed', label: 'Gestionada por Gerentes' },
];

export const DURATION_OPTIONS = [
  { value: 'perpetual', label: 'Perpetua' },
  { value: '1', label: '1 año' },
  { value: '5', label: '5 años' },
  { value: '10', label: '10 años' },
  { value: 'custom', label: 'Personalizada' },
];

export const US_STATES_LIST = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export function parseExtraFields(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function stringifyExtraFields(obj: Record<string, string>): string {
  return JSON.stringify(obj);
}

export function generatePreviewToken(filingId: string): string {
  return btoa(`${filingId}-${Date.now()}`).replace(/=/g, '');
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
