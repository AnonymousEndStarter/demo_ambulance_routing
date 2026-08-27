export interface LocationNode {
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'HOSPITAL' | 'AMBULANCE' | 'PATIENT';
    details?: {
      severity?: number;
      status?: string;
      icuRequired?: boolean;
      hasICU?: boolean;
      icuBeds?: number;
    };
  }
  
  export const INITIAL_HOSPITALS: LocationNode[] = [
    { id: 'H1', name: 'Central Trauma Center', lat: 40.7580, lng: -73.9855, type: 'HOSPITAL', details: { icuBeds: 12 } },
    { id: 'H2', name: 'St. Jude Memorial Center', lat: 40.7484, lng: -73.9857, type: 'HOSPITAL', details: { icuBeds: 6 } },
    { id: 'H3', name: 'Metro East General', lat: 40.7306, lng: -73.9352, type: 'HOSPITAL', details: { icuBeds: 9 } },
    { id: 'H4', name: 'Brooklyn Medical Plaza', lat: 40.6892, lng: -73.9814, type: 'HOSPITAL', details: { icuBeds: 15 } },
  ];
  
  export const INITIAL_AMBULANCES: LocationNode[] = [
    { id: 'A1', name: 'Unit A1 (Advanced ICU)', lat: 40.7650, lng: -73.9800, type: 'AMBULANCE', details: { hasICU: true, status: 'Idle' } },
    { id: 'A2', name: 'Unit A2 (Standard BLS)', lat: 40.7400, lng: -73.9900, type: 'AMBULANCE', details: { hasICU: false, status: 'Idle' } },
    { id: 'A3', name: 'Unit A3 (Advanced ICU)', lat: 40.7250, lng: -73.9500, type: 'AMBULANCE', details: { hasICU: true, status: 'Idle' } },
    { id: 'A4', name: 'Unit A4 (Standard BLS)', lat: 40.7800, lng: -73.9550, type: 'AMBULANCE', details: { hasICU: false, status: 'Idle' } },
    { id: 'A5', name: 'Unit A5 (Advanced ICU)', lat: 40.7050, lng: -74.0090, type: 'AMBULANCE', details: { hasICU: true, status: 'Idle' } },
    { id: 'A6', name: 'Unit A6 (Standard BLS)', lat: 40.6920, lng: -73.9700, type: 'AMBULANCE', details: { hasICU: false, status: 'Idle' } },
  ];
  
  export const INITIAL_PATIENTS: LocationNode[] = [
    { id: 'P1', name: 'Call #201 - Cardiac Emergency', lat: 40.7520, lng: -73.9770, type: 'PATIENT', details: { severity: 5, icuRequired: true } },
    { id: 'P2', name: 'Call #202 - Severe Trauma', lat: 40.7350, lng: -73.9820, type: 'PATIENT', details: { severity: 4, icuRequired: false } },
    { id: 'P3', name: 'Call #203 - Respiratory Distress', lat: 40.7680, lng: -73.9610, type: 'PATIENT', details: { severity: 3, icuRequired: true } },
    { id: 'P4', name: 'Call #204 - Minor Fracture', lat: 40.7110, lng: -73.9950, type: 'PATIENT', details: { severity: 2, icuRequired: false } },
    { id: 'P5', name: 'Call #205 - Stroke Alert', lat: 40.6980, lng: -73.9550, type: 'PATIENT', details: { severity: 5, icuRequired: true } },
  ];