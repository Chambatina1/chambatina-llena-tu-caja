export interface StateFieldDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'date' | 'textarea';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
}

export interface StateRequirementData {
  stateCode: string;
  stateName: string;
  filingFee: number;
  requiredFields: StateFieldDef[];
  filingOffice: string;
  processingTime: string;
  notes: string;
}

export const STATE_DATA: Record<string, StateRequirementData> = {
  FL: {
    stateCode: 'FL',
    stateName: 'Florida',
    filingFee: 125,
    requiredFields: [
      {
        key: 'effectiveDate',
        label: 'Fecha Efectiva (opcional)',
        type: 'date',
        helpText: 'Fecha en la que la LLC comienza a existir legalmente. Si se deja vacío, será la fecha de presentación.',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
        helpText: 'Las Series LLC permiten crear "series" independientes con sus propios activos y miembros.',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
        helpText: 'Número de Identificación del Empleador del IRS. Recomendado para abrir cuentas bancarias.',
      },
    ],
    filingOffice: 'Florida Department of State, Division of Corporations',
    processingTime: '3-5 días hábiles (en línea), 2-3 semanas (correo)',
    notes: 'Florida requiere que el nombre de la LLC termine con "LLC", "L.L.C." o "Limited Liability Company".',
  },
  TX: {
    stateCode: 'TX',
    stateName: 'Texas',
    filingFee: 300,
    requiredFields: [
      {
        key: 'entityType',
        label: 'Tipo de Entidad',
        type: 'select',
        required: true,
        options: ['LLC Estándar', 'Professional LLC', 'LLC de Bienes Raíces'],
        helpText: 'Las Professional LLC son para profesiones reguladas como abogados, médicos, contadores.',
      },
      {
        key: 'managementProvisions',
        label: 'Disposiciones de Gestión Especiales',
        type: 'textarea',
        placeholder: 'Describa cualquier disposición especial de gestión...',
        helpText: 'Provisiones adicionales para la estructura de gestión de la LLC.',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Texas Secretary of State',
    processingTime: '2-3 días hábiles (en línea), 5-7 días (correo)',
    notes: 'Texas no tiene impuesto estatal sobre la renta. La franquicia anual es $0.75 por cada $1,000 de capital.',
  },
  DE: {
    stateCode: 'DE',
    stateName: 'Delaware',
    filingFee: 90,
    requiredFields: [
      {
        key: 'minMembers',
        label: 'Número Mínimo de Miembros',
        type: 'select',
        required: true,
        options: ['1', '2', '3+'],
        defaultValue: '1',
        helpText: 'Delaware permite LLC de un solo miembro.',
      },
      {
        key: 'raResident',
        label: '¿El Agente Registrado es residente de Delaware?',
        type: 'select',
        required: true,
        options: ['Sí', 'No'],
        helpText: 'Delaware requiere que el agente registrado tenga una dirección física en el estado.',
      },
      {
        key: 'alternateName',
        label: 'Nombre Alternativo / Ficticio',
        type: 'text',
        helpText: 'Nombre bajo el cual la LLC operará si es diferente del nombre legal.',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Delaware Division of Corporations',
    processingTime: 'Mismo día (expedite), 2-3 días (regular)',
    notes: 'Delaware es popular por su Court of Chancery. No hay impuesto estatal sobre ventas ni sobre bienes personales.',
  },
  NV: {
    stateCode: 'NV',
    stateName: 'Nevada',
    filingFee: 425,
    requiredFields: [
      {
        key: 'raPhysicalAddress',
        label: 'Dirección Física del Agente en Nevada',
        type: 'text',
        required: true,
        placeholder: '123 Main St, Las Vegas, NV 89101',
        helpText: 'El agente registrado debe tener una dirección física real en Nevada, no solo un P.O. Box.',
      },
      {
        key: 'managerList',
        label: 'Lista de Gerentes',
        type: 'textarea',
        required: true,
        placeholder: 'Nombre, dirección de cada gerente (uno por línea)...',
        helpText: 'Listar todos los gerentes de la LLC. Si es member-managed, listar todos los miembros.',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Nevada Secretary of State',
    processingTime: '7-10 días hábiles (regular), 2-3 días (expedite)',
    notes: 'Nevada no tiene impuesto estatal sobre la renta corporativa ni sobre las ganancias de capital. Altamente protectora del anonimato.',
  },
  WY: {
    stateCode: 'WY',
    stateName: 'Wyoming',
    filingFee: 102,
    requiredFields: [
      {
        key: 'annualReportFee',
        label: 'Tarifa de Reporte Anual',
        type: 'text',
        defaultValue: '$62',
        helpText: 'Wyoming cobra $62 anuales por el reporte de franchise tax.',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
        helpText: 'Wyoming reconoce Series LLC.',
      },
      {
        key: 'assetProtection',
        label: '¿Desea disposición de protección de activos?',
        type: 'checkbox',
        defaultValue: 'false',
        helpText: 'Incluir cláusulas de protección de activos en los artículos de organización.',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Wyoming Secretary of State',
    processingTime: '3-5 días hábiles (regular), 1-2 días (expedite)',
    notes: 'Wyoming es el estado más económico para formar LLC. No tiene impuesto estatal sobre la renta corporativa.',
  },
  CO: {
    stateCode: 'CO',
    stateName: 'Colorado',
    filingFee: 50,
    requiredFields: [
      {
        key: 'principalPlaceOfBusiness',
        label: 'Lugar Principal de Negocios',
        type: 'text',
        required: true,
        helpText: 'Dirección del lugar principal de negocios de la LLC.',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Colorado Secretary of State',
    processingTime: '1-3 días hábiles (en línea)',
    notes: 'Colorado tiene una de las tarifas de formación más bajas. Reporte periódico requerido.',
  },
  AZ: {
    stateCode: 'AZ',
    stateName: 'Arizona',
    filingFee: 50,
    requiredFields: [
      {
        key: 'knownPlaceOfBusiness',
        label: 'Dirección Conocida del Negocio en Arizona',
        type: 'text',
        required: true,
        helpText: 'Dirección física del negocio en Arizona.',
      },
      {
        key: 'memberAddresses',
        label: 'Direcciones de los Miembros',
        type: 'textarea',
        helpText: 'Direcciones de cada miembro fundador (una por línea).',
      },
      {
        key: 'isProfessional',
        label: '¿Es una Professional LLC (PLLC)?',
        type: 'checkbox',
        defaultValue: 'false',
        helpText: 'Para profesiones que requieren licencia estatal.',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Arizona Corporation Commission',
    processingTime: '3-5 días hábiles',
    notes: 'Arizona requiere publicar un aviso de formación en un periódico del condado dentro de 60 días.',
  },
  GA: {
    stateCode: 'GA',
    stateName: 'Georgia',
    filingFee: 100,
    requiredFields: [
      {
        key: 'county',
        label: 'Condado del Condado Principal',
        type: 'text',
        required: true,
        helpText: 'Condado de Georgia donde se ubica la oficina principal.',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Georgia Secretary of State',
    processingTime: '5-7 días hábiles (regular), 2-3 días (expedite)',
    notes: 'Georgia tiene una tarifa anual de $50. Todos los LLC deben presentar un reporte anual.',
  },
  NC: {
    stateCode: 'NC',
    stateName: 'North Carolina',
    filingFee: 125,
    requiredFields: [
      {
        key: 'county',
        label: 'Condado de Registro',
        type: 'text',
        required: true,
        helpText: 'Condado de North Carolina donde se registrará la LLC.',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
      },
      {
        key: 'hasMembers',
        label: '¿La LLC tiene miembros adicionales? (más del organizador)',
        type: 'checkbox',
        defaultValue: 'false',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'North Carolina Secretary of State',
    processingTime: '7-10 días hábiles (regular), 2-3 días (expedite)',
    notes: 'North Carolina cobra una tarifa anual de $200. El estado tiene una tasa de impuesto corporativo del 2.5%.',
  },
  OH: {
    stateCode: 'OH',
    stateName: 'Ohio',
    filingFee: 99,
    requiredFields: [
      {
        key: 'statutoryAgent',
        label: 'Agente Estatutario (Registered Agent)',
        type: 'text',
        required: true,
        helpText: 'En Ohio, el agente registrado se llama "Agente Estatutario".',
      },
      {
        key: 'numberOfMembers',
        label: 'Número de Miembros',
        type: 'select',
        required: true,
        options: ['1', '2', '3-5', '6-10', '10+'],
        defaultValue: '1',
      },
      {
        key: 'isSeriesLLC',
        label: '¿Es una Serie LLC?',
        type: 'checkbox',
        defaultValue: 'false',
      },
      {
        key: 'einRequired',
        label: '¿Incluir solicitud de EIN?',
        type: 'checkbox',
        defaultValue: 'true',
      },
    ],
    filingOffice: 'Ohio Secretary of State',
    processingTime: '3-5 días hábiles (regular), 1-2 días (expedite)',
    notes: 'Ohio tiene una estructura de impuestos commercialevents favorable. Tarifa anual de $0 para la mayoría de las LLC.',
  },
};

export function getStateData(code: string): StateRequirementData | undefined {
  return STATE_DATA[code.toUpperCase()];
}

export function getAllStates(): StateRequirementData[] {
  return Object.values(STATE_DATA);
}

export function getStateFlag(code: string): string {
  const flags: Record<string, string> = {
    FL: '🌴',
    TX: '⭐',
    DE: '🏢',
    NV: '🎰',
    WY: '🏔️',
    CO: '⛰️',
    AZ: '🌵',
    GA: '🍑',
    NC: '🍂',
    OH: '🏛️',
  };
  return flags[code.toUpperCase()] || '📋';
}
