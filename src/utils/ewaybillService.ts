import { EWayBillGovtVerification } from '../types';

// Mock Government E-Way Bill Database simulating the GST NIC E-Way Bill System
interface MockGovtEwbRecord {
  ewaybillNo: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'INVALID';
  validUpto: string;
  generatedDate: string;
  fromGstin: string;
  fromTradeName: string;
  toGstin: string;
  toTradeName: string;
  vehicleNo: string;
  approxDistanceKm: number;
  mainHsnCode: string;
}

const MOCK_GOVT_EWB_DATABASE: Record<string, MockGovtEwbRecord> = {
  // Active valid EWBs
  'EWB12389021': {
    ewaybillNo: 'EWB12389021',
    status: 'ACTIVE',
    validUpto: '2026-10-10 23:59',
    generatedDate: '2026-10-02 10:15',
    fromGstin: '27AAACT2727Q1ZG',
    fromTradeName: 'Tata Motors Commercial Vehicles Ltd.',
    toGstin: '07AAACT2727Q1ZF',
    toTradeName: 'Tata Motors Regional Parts Warehouse Delhi',
    vehicleNo: 'MH12AB1234',
    approxDistanceKm: 1420,
    mainHsnCode: '87082900',
  },
  'EWB12389022': {
    ewaybillNo: 'EWB12389022',
    status: 'ACTIVE',
    validUpto: '2026-10-12 23:59',
    generatedDate: '2026-10-02 11:30',
    fromGstin: '27AAACT2727Q1ZG',
    fromTradeName: 'Tata Motors Commercial Vehicles Ltd.',
    toGstin: '07AAACT2727Q1ZF',
    toTradeName: 'Tata Motors Regional Parts Warehouse Delhi',
    vehicleNo: 'MH12AB1234',
    approxDistanceKm: 1420,
    mainHsnCode: '84818090',
  },
  'EWB9912001': {
    ewaybillNo: 'EWB9912001',
    status: 'ACTIVE',
    validUpto: '2026-10-08 23:59',
    generatedDate: '2026-10-01 14:00',
    fromGstin: '08AAACH1001P1Z9',
    fromTradeName: 'Havells India Electricals Ltd.',
    toGstin: '06AAACH1001P1Z8',
    toTradeName: 'Havells Central Depot Neemrana',
    vehicleNo: 'HR55AK9812',
    approxDistanceKm: 280,
    mainHsnCode: '85371000',
  },
  // Expired EWBs (triggers Red Alert)
  'EWB-EXPIRED-99': {
    ewaybillNo: 'EWB-EXPIRED-99',
    status: 'EXPIRED',
    validUpto: '2026-08-15 23:59',
    generatedDate: '2026-08-10 09:00',
    fromGstin: '27AAACT2727Q1ZG',
    fromTradeName: 'Tata Motors Commercial Vehicles Ltd.',
    toGstin: '07AAACT2727Q1ZF',
    toTradeName: 'Tata Motors Delhi Depot',
    vehicleNo: 'MH12AB1234',
    approxDistanceKm: 1420,
    mainHsnCode: '8708',
  },
  // Cancelled EWB
  'EWB-CANCELLED-01': {
    ewaybillNo: 'EWB-CANCELLED-01',
    status: 'CANCELLED',
    validUpto: '2026-10-05 23:59',
    generatedDate: '2026-10-01 10:00',
    fromGstin: '06AABCR1234K1ZX',
    fromTradeName: 'Reliance Retail Supply Chain Ltd.',
    toGstin: '08AABCR1234K1ZY',
    toTradeName: 'Reliance DC Jaipur',
    vehicleNo: 'DL1M4589',
    approxDistanceKm: 270,
    mainHsnCode: '8418',
  },
};

/**
 * Validates E-Way Bill against Government Portal database
 */
export async function verifyEWayBillWithGovtPortal(
  ewaybillNo: string,
  assignedVehicleNo?: string,
  currentDateIso?: string
): Promise<EWayBillGovtVerification> {
  const cleanedNo = (ewaybillNo || '').trim().toUpperCase();
  const verifiedAt = new Date().toISOString();
  const errors: string[] = [];

  // 1. Basic formatting check
  if (!cleanedNo || cleanedNo.length < 5) {
    return {
      ewaybillNo: cleanedNo,
      status: 'INVALID',
      validUpto: '—',
      generatedDate: '—',
      fromGstin: '—',
      fromTradeName: '—',
      toGstin: '—',
      toTradeName: '—',
      vehicleNo: '—',
      vehicleNoMatches: false,
      approxDistanceKm: 0,
      mainHsnCode: '—',
      verifiedAt,
      validationErrors: ['E-Way Bill Number cannot be blank or shorter than 5 characters.'],
    };
  }

  // Check known mock records first
  const record = MOCK_GOVT_EWB_DATABASE[cleanedNo];

  if (record) {
    const today = (currentDateIso || new Date().toISOString()).split('T')[0];
    const isExpired = record.validUpto.split(' ')[0] < today || record.status === 'EXPIRED';

    if (isExpired) {
      errors.push(`E-Way Bill validity expired on ${record.validUpto}. Goods in transit with expired EWB attract 100% tax penalty.`);
    }

    if (record.status === 'CANCELLED') {
      errors.push(`E-Way Bill was cancelled by the consignor/generator on ${record.generatedDate}.`);
    }

    // Vehicle Match Check
    const cleanAssignedVeh = (assignedVehicleNo || '').replace(/\s+/g, '').toUpperCase();
    const cleanEwbVeh = (record.vehicleNo || '').replace(/\s+/g, '').toUpperCase();
    const vehicleMatches = cleanAssignedVeh ? cleanAssignedVeh === cleanEwbVeh : true;

    if (cleanAssignedVeh && !vehicleMatches) {
      errors.push(`Vehicle Mismatch: E-Way Bill is endorsed for vehicle [${record.vehicleNo}], but trip is assigned to [${assignedVehicleNo}]. Part-B vehicle update required on portal.`);
    }

    const finalStatus = isExpired ? 'EXPIRED' : record.status;

    return {
      ewaybillNo: cleanedNo,
      status: finalStatus,
      validUpto: record.validUpto,
      generatedDate: record.generatedDate,
      fromGstin: record.fromGstin,
      fromTradeName: record.fromTradeName,
      toGstin: record.toGstin,
      toTradeName: record.toTradeName,
      vehicleNo: record.vehicleNo,
      vehicleNoMatches: vehicleMatches,
      approxDistanceKm: record.approxDistanceKm,
      mainHsnCode: record.mainHsnCode,
      verifiedAt,
      validationErrors: errors,
    };
  }

  // Dynamic simulation for any newly typed standard 12-digit or alphanumeric EWB
  // If user typed something with "EXPIRED" or past date
  const isSimulatedExpired = cleanedNo.includes('EXP') || cleanedNo.endsWith('000');
  const validUntilDate = isSimulatedExpired
    ? '2026-08-01 23:59'
    : new Date(Date.now() + 6 * 86400000).toISOString().replace('T', ' ').slice(0, 16);

  const cleanAssignedVeh = (assignedVehicleNo || 'MH12AB1234').replace(/\s+/g, '').toUpperCase();

  if (isSimulatedExpired) {
    errors.push(`Govt NIC Portal reports: E-Way Bill validity expired on ${validUntilDate}. Transit without active EWB is non-compliant under GST Section 129.`);
  }

  return {
    ewaybillNo: cleanedNo,
    status: isSimulatedExpired ? 'EXPIRED' : 'ACTIVE',
    validUpto: validUntilDate,
    generatedDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
    fromGstin: '27AAACT2727Q1ZG',
    fromTradeName: 'Government Verified Consignor',
    toGstin: '07AAACT2727Q1ZF',
    toTradeName: 'Government Verified Consignee Hub',
    vehicleNo: cleanAssignedVeh,
    vehicleNoMatches: true,
    approxDistanceKm: 850,
    mainHsnCode: '8708',
    verifiedAt,
    validationErrors: errors,
  };
}
