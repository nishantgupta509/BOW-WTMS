export type UserRole = 'Operator' | 'Supervisor' | 'Manager' | 'Admin';

export type TripStatus =
  | 'Draft'
  | 'Booked'
  | 'Vehicle Assigned'
  | 'Dispatched'
  | 'In Transit'
  | 'Arrived'
  | 'Delivered'
  | 'POD Received'
  | 'Billable'
  | 'Closed'
  | 'Cancelled';

export type BookingSource = 'Manual' | 'API' | 'Portal' | 'Recurring';

export type Priority = 'Normal' | 'Urgent' | 'Critical';

export type RequirementType =
  | 'FTL'
  | 'Part Load'
  | 'One Way'
  | 'Round Trip'
  | 'Dedicated'
  | 'Ad-hoc'
  | 'Spot Vehicle'
  | 'Return Load'
  | 'Customer Contract';

export type TripType = 'One Way' | 'Round Trip' | 'Multi-drop';

export type FreightCalculationMode =
  | 'Per KM'
  | 'Fixed Freight'
  | 'Per Trip'
  | 'Per MT'
  | 'Per Package'
  | 'Contract Rate';

export interface CustomerRateCard {
  id: string;
  customerId: string;
  contractName: string;
  freightCalculationMode: FreightCalculationMode;
  defaultRatePerKm: number;
  defaultFixedFreight?: number;
  detentionFreeHours: number;
  detentionRatePerDay: number;
  loadingCharges: number;
  unloadingCharges: number;
  tollScope: 'Customer' | 'Transporter' | 'At Actuals';
  laneRates?: {
    routeId: string;
    laneCode: string;
    ratePerKm?: number;
    fixedFreight?: number;
    vehicleTypeId?: string;
  }[];
  effectiveFrom: string;
  effectiveTo: string;
  status: 'Active' | 'Expired';
  minimumGuaranteedKm?: number;
  fuelEscalationClause?: string;
}

export interface CustomerMaster {
  id: string;
  code: string;
  name: string;
  gstin: string;
  billingAddress: string;
  city: string;
  state: string;
  paymentTerms: string;
  defaultDetentionRate: number; // e.g. 3500 per day
  defaultFreeHours: number; // e.g. 5 hours
  defaultFreightTerms: string;
  approvedVehicleTypes: string[];
  status: 'Active' | 'Inactive';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit: number;
  rateCards?: CustomerRateCard[];
}

export interface RouteMaster {
  id: string;
  routeName: string;
  laneCode: string;
  origin: string;
  destination: string;
  touchPoints: string[];
  plannedKm: number;
  approvedKm: number;
  routeType: 'Primary' | 'Secondary' | 'Expressway' | 'Hill Route';
  tollApplicable: boolean;
  standardTollCost: number;
  estimatedTransitHours: number;
}

export interface VehicleMaster {
  id: string;
  vehicleNo: string;
  vehicleType: string;
  capacityMt: number;
  capacityKg: number;
  gpsId: string;
  ownerType: 'BOW Fleet' | 'Dedicated Vendor' | 'Market Attached';
  ownerName: string;
  status: 'Available' | 'Under Maintenance' | 'Inactive' | 'On Trip';
  currentLocation: string;
  fitnessExpiry: string;
  insuranceExpiry: string;
  nationalPermitExpiry: string;
  pollutionExpiry: string;
  gpsStatus: 'Active' | 'Signal Lost' | 'Offline';
}

export interface DriverMaster {
  id: string;
  name: string;
  mobile: string;
  licenseNo: string;
  licenseExpiry: string;
  type: 'BOW Employee' | 'Vendor Driver';
  status: 'Available' | 'On Trip' | 'On Leave' | 'Suspended';
  bloodGroup: string;
  aadhaarNo: string;
  emergencyContact: string;
}

export interface EWayBillGovtVerification {
  ewaybillNo: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'INVALID' | 'UNVERIFIED';
  validUpto: string;
  generatedDate: string;
  fromGstin: string;
  fromTradeName: string;
  toGstin: string;
  toTradeName: string;
  vehicleNo: string;
  vehicleNoMatches: boolean;
  approxDistanceKm: number;
  mainHsnCode: string;
  verifiedAt: string;
  validationErrors: string[];
}

export interface GpsDiscrepancy {
  milestone: 'Origin Arrival' | 'Origin Departure' | 'Destination Arrival' | 'Destination Departure';
  manualTime: string;
  gpsTime: string;
  diffMinutes: number;
  severity: 'red' | 'yellow';
  alertMessage: string;
}

export interface GpsTelemetry {
  vehicleId: string;
  vehicleNo: string;
  latitude: number;
  longitude: number;
  currentAddress: string;
  speedKmH: number;
  headingDeg: number;
  ignition: 'ON' | 'OFF';
  odometerKm: number;
  batteryPercent: number;
  gsmSignalPercent: number;
  lastPingDatetime: string;
  geofenceStatus: 'Inside Origin' | 'On Route' | 'Inside Destination' | 'Idle at Hub';
  autoCapturedTimestamps: {
    originArrival?: string;
    originDeparture?: string;
    destinationArrival?: string;
    destinationDeparture?: string;
  };
  corridorProgressPercent: number;
  discrepancies?: GpsDiscrepancy[];
}

export interface TripInvoice {
  id: string;
  tripId: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  ewaybillNo: string;
  ewaybillDate: string;
  ewaybillValidTill: string;
  packageCount: number;
  weightKg: number;
  materialDescription: string;
  ewbGovtVerification?: EWayBillGovtVerification;
}

export interface TripDetention {
  id: string;
  tripId: string;
  locationType: 'Origin' | 'Destination' | 'TouchPoint';
  locationName: string;
  arrivalDatetime: string;
  loadingStartDatetime?: string;
  loadingCompleteDatetime?: string;
  unloadingStartDatetime?: string;
  unloadingCompleteDatetime?: string;
  departureDatetime?: string;
  freeHours: number;
  detentionStartDatetime?: string;
  chargeableHours: number;
  chargeableDays: number;
  detentionRatePerDay: number;
  detentionAmount: number;
  approvedBy?: string;
  remarks?: string;
  isWaived?: boolean;
}

export interface TripStatusHistory {
  id: string;
  tripId: string;
  oldStatus: TripStatus;
  newStatus: TripStatus;
  changedBy: string;
  userRole: UserRole;
  changedAt: string;
  remarks: string;
}

export interface TripRecord {
  id: string; // e.g. "TB-2026-000125"
  tripNumber: string;
  bookingDatetime: string;
  customerId: string;
  customerReference: string;
  bookingSource: BookingSource;
  priority: Priority;
  bookedBy: string;
  approvedBy?: string;

  // Route & Trip details
  routeId: string;
  laneCode: string;
  origin: string;
  destination: string;
  touchPoints: string[];
  plannedKm: number;
  approvedKm: number;
  actualKm?: number;
  isApprovedKmOverridden?: boolean;
  kmOverrideReason?: string;
  requirementType: RequirementType;
  tripType: TripType;
  loadingDatetime: string;
  reportingLocation: string;
  tollApplicable: boolean;

  // Vehicle & Driver
  vehicleTypeId: string;
  vehicleId: string;
  driverId: string;
  gpsTrackingId?: string;
  gpsTelemetry?: GpsTelemetry;

  // Rate Card & Commercials
  rateCardId?: string;
  rateCardContractName?: string;
  rateCardOverrides?: {
    field: string;
    standardValue: any;
    overriddenValue: any;
    justification: string;
    authorizedBy: string;
    authorizedAt: string;
  }[];
  freightCalculationMode: FreightCalculationMode;
  ratePerKm: number;
  basicFreight: number;
  isFreightOverridden?: boolean;
  freightOverrideReason?: string;
  detentionFreeHours: number;
  detentionRatePerDay: number;
  isDetentionOverridden?: boolean;
  detentionOverrideReason?: string;
  loadingCharges: number;
  unloadingCharges: number;
  tollCharges: number;
  otherCharges: number;
  discount: number;
  taxableAmount: number;
  gstRate: number; // e.g. 18
  gstAmount: number;
  totalAmount: number;

  // Invoices & Consignment
  invoices: TripInvoice[];

  // Instructions
  customerInstructions: string;
  loadingInstructions: string;
  operationsRemarks: string; // Internal WTMS remarks

  // Status & Cancellation
  status: TripStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;

  // LR Details
  lrNumber?: string;
  lrDate?: string;
  consignorName?: string;
  consigneeName?: string;

  // Detention and Operations
  detentionRecords: TripDetention[];
  statusHistory: TripStatusHistory[];

  // POD
  podDocumentUrl?: string;
  podReceivedAt?: string;
  podReceivedBy?: string;
  podRemarks?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  severity: 'red' | 'yellow' | 'green';
  field: string;
  title: string;
  message: string;
}

export interface UserSession {
  name: string;
  email: string;
  role: UserRole;
  branch: string;
}
