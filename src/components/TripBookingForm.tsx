import React, { useState, useEffect } from 'react';
import {
  TripRecord,
  CustomerMaster,
  RouteMaster,
  VehicleMaster,
  DriverMaster,
  TripInvoice,
  UserRole,
  RequirementType,
  TripType,
  FreightCalculationMode,
  Priority,
  BookingSource,
  ValidationIssue,
  CustomerRateCard,
} from '../types';
import { VEHICLE_TYPES } from '../data/masterData';
import { calculateCommercials, calculateConsignmentTotals } from '../utils/calculations';
import { runFullTripValidation } from '../utils/validation';
import { hasPermission } from '../utils/permissions';
import { verifyEWayBillWithGovtPortal } from '../utils/ewaybillService';
import { getSimulatedGpsTelemetry } from '../utils/gpsService';
import { GpsTrackingModal } from './GpsTrackingModal';
import { RateCardOverrideModal } from './RateCardOverrideModal';
import { RateCardManagerModal } from './RateCardManagerModal';
import {
  Save,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Printer,
  FileText,
  Send,
  Ban,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  Info,
  ExternalLink,
  RotateCcw,
  Clock,
  CheckSquare,
  Navigation,
  Radio,
  Check,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Search
} from 'lucide-react';

interface TripBookingFormProps {
  initialTrip?: TripRecord;
  customers: CustomerMaster[];
  routes: RouteMaster[];
  vehicles: VehicleMaster[];
  drivers: DriverMaster[];
  allTrips: TripRecord[];
  currentUserRole: UserRole;
  currentUserName: string;
  onSaveTrip: (trip: TripRecord, isConfirming?: boolean) => void;
  onOpenPrintSheet: (trip: TripRecord) => void;
  onOpenLR: (trip: TripRecord) => void;
  onOpenSendCustomer: (trip: TripRecord) => void;
  onOpenCancel: (trip: TripRecord) => void;
  onOpenDetention: (trip: TripRecord) => void;
  onOpenWorkflow: (trip: TripRecord) => void;
  onOpenRateCardManager?: (customerId?: string) => void;
  onClose: () => void;
}

export const TripBookingForm: React.FC<TripBookingFormProps> = ({
  initialTrip,
  customers,
  routes,
  vehicles,
  drivers,
  allTrips,
  currentUserRole,
  currentUserName,
  onSaveTrip,
  onOpenPrintSheet,
  onOpenLR,
  onOpenSendCustomer,
  onOpenCancel,
  onOpenDetention,
  onOpenWorkflow,
  onOpenRateCardManager,
  onClose,
}) => {
  // Generate unique Trip ID if new
  const generateTripId = () => {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `TB-${year}-${randomSeq}`;
  };

  const todayIso = new Date().toISOString().slice(0, 16);

  // Core Form State
  const [trip, setTrip] = useState<TripRecord>(() => {
    if (initialTrip) return initialTrip;

    const newId = generateTripId();
    return {
      id: newId,
      tripNumber: `BOW/26-27/TB/${newId.split('-')[2]}`,
      bookingDatetime: todayIso,
      customerId: '',
      customerReference: '',
      bookingSource: 'Manual',
      priority: 'Normal',
      bookedBy: `${currentUserName} (${currentUserRole})`,
      routeId: '',
      laneCode: '',
      origin: '',
      destination: '',
      touchPoints: [],
      plannedKm: 0,
      approvedKm: 0,
      requirementType: 'FTL',
      tripType: 'One Way',
      loadingDatetime: todayIso,
      reportingLocation: 'Gate 1 (10:00 Hrs)',
      tollApplicable: true,
      vehicleTypeId: 'VT_22FT_SXL',
      vehicleId: '',
      driverId: '',
      freightCalculationMode: 'Per KM',
      ratePerKm: 29.3,
      basicFreight: 0,
      detentionFreeHours: 5,
      detentionRatePerDay: 3500,
      loadingCharges: 0,
      unloadingCharges: 0,
      tollCharges: 0,
      otherCharges: 0,
      discount: 0,
      taxableAmount: 0,
      gstRate: 18,
      gstAmount: 0,
      totalAmount: 0,
      invoices: [],
      customerInstructions: '',
      loadingInstructions: '',
      operationsRemarks: '',
      status: 'Draft',
      detentionRecords: [],
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Selected Masters Lookup
  const selectedCustomer = customers.find((c) => c.id === trip.customerId);
  const selectedRoute = routes.find((r) => r.id === trip.routeId);
  const selectedVehicle = vehicles.find((v) => v.id === trip.vehicleId);
  const selectedDriver = drivers.find((d) => d.id === trip.driverId);

  // Form Locking State
  const isTripLocked = trip.status !== 'Draft';

  // Permission Checks
  const canConfirmTrip = hasPermission(currentUserRole, 'confirmTrip');
  const canChangeFreight = hasPermission(currentUserRole, 'changeFreight');
  const canChangeDetention = hasPermission(currentUserRole, 'changeDetention');
  const canChangeApprovedKm = hasPermission(currentUserRole, 'changeApprovedKm');
  const canCancelTrip = hasPermission(currentUserRole, 'cancelTrip');

  // Validation State
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTouchPointInput, setActiveTouchPointInput] = useState('');

  // GPS & Telematics State
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [telemetry, setTelemetry] = useState(() => trip.gpsTelemetry || getSimulatedGpsTelemetry(trip));

  // Government E-Way Bill Verification State
  const [verifyingEwbIndex, setVerifyingEwbIndex] = useState<number | null>(null);
  const [blockingEwbModalOpen, setBlockingEwbModalOpen] = useState(false);
  const [blockingEwbMessage, setBlockingEwbMessage] = useState('');

  // Rate Card Override Modal State
  const [overrideModalData, setOverrideModalData] = useState<{
    fieldName: string;
    fieldLabel: string;
    standardValue: any;
    newValue: any;
  } | null>(null);

  // Run validation
  const validationIssues = runFullTripValidation(
    trip,
    allTrips,
    selectedCustomer,
    selectedVehicle,
    selectedDriver
  );

  const redAlerts = validationIssues.filter((i) => i.severity === 'red');
  const yellowWarnings = validationIssues.filter((i) => i.severity === 'yellow');
  const greenChecks = validationIssues.filter((i) => i.severity === 'green');

  // Consignment Totals
  const consignmentTotals = calculateConsignmentTotals(trip.invoices);

  // Recalculate commercials whenever relevant fields change
  const handleRecalculateCommercials = (overrides?: Partial<TripRecord>) => {
    const updated = { ...trip, ...overrides };
    const res = calculateCommercials(updated, consignmentTotals.totalWeightKg, consignmentTotals.totalPackages);
    setTrip((prev) => ({
      ...prev,
      ...overrides,
      basicFreight: res.basicFreight,
      taxableAmount: res.taxableAmount,
      gstAmount: res.gstAmount,
      totalAmount: res.totalAmount,
    }));
  };

  // On Customer Change - Automatically pull customer-specific Rate Card
  const handleCustomerChange = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    if (!cust) {
      setTrip((prev) => ({
        ...prev,
        customerId: '',
        rateCardId: undefined,
        rateCardContractName: undefined,
        rateCardOverrides: [],
      }));
      return;
    }

    setTrip((prev) => {
      let nextMode = prev.freightCalculationMode;
      let nextRatePerKm = prev.ratePerKm;
      let nextBasicFreight = prev.basicFreight;
      let nextDetention = cust.defaultDetentionRate || 3500;
      let nextFreeHours = cust.defaultFreeHours || 5;
      let nextLoading = prev.loadingCharges;
      let nextUnloading = prev.unloadingCharges;
      let rateCardContractName: string | undefined = undefined;
      let rateCardId: string | undefined = undefined;

      // Pull from configured Rate Cards
      if (cust.rateCards && cust.rateCards.length > 0) {
        const activeCard = cust.rateCards.find((rc) => rc.status === 'Active') || cust.rateCards[0];
        rateCardId = activeCard.id;
        rateCardContractName = activeCard.contractName;
        nextMode = activeCard.freightCalculationMode;
        nextFreeHours = activeCard.detentionFreeHours;
        nextDetention = activeCard.detentionRatePerDay;
        nextLoading = activeCard.loadingCharges;
        nextUnloading = activeCard.unloadingCharges;

        // Check if lane specific rate matches existing route
        const laneRate = activeCard.laneRates?.find(
          (lr) => lr.routeId === prev.routeId || lr.laneCode === prev.laneCode
        );
        if (laneRate) {
          if (laneRate.ratePerKm !== undefined) nextRatePerKm = laneRate.ratePerKm;
          if (laneRate.fixedFreight !== undefined) nextBasicFreight = laneRate.fixedFreight;
        } else {
          nextRatePerKm = activeCard.defaultRatePerKm;
          if (activeCard.defaultFixedFreight) nextBasicFreight = activeCard.defaultFixedFreight;
        }
      }

      const updated = {
        ...prev,
        customerId: cust.id,
        rateCardId,
        rateCardContractName,
        rateCardOverrides: [],
        freightCalculationMode: nextMode,
        ratePerKm: nextRatePerKm,
        basicFreight: nextBasicFreight,
        detentionRatePerDay: nextDetention,
        detentionFreeHours: nextFreeHours,
        loadingCharges: nextLoading,
        unloadingCharges: nextUnloading,
      };

      const res = calculateCommercials(updated, consignmentTotals.totalWeightKg, consignmentTotals.totalPackages);
      return {
        ...updated,
        basicFreight: res.basicFreight,
        taxableAmount: res.taxableAmount,
        gstAmount: res.gstAmount,
        totalAmount: res.totalAmount,
      };
    });
  };

  // On Route Change - Check for Lane-Specific Rate Card Overrides
  const handleRouteChange = (routeId: string) => {
    const rt = routes.find((r) => r.id === routeId);
    if (!rt) {
      setTrip((prev) => ({ ...prev, routeId: '' }));
      return;
    }

    setTrip((prev) => {
      let nextRatePerKm = prev.ratePerKm;
      let nextBasicFreight = prev.basicFreight;

      // Check active customer rate card for this lane
      if (selectedCustomer?.rateCards && selectedCustomer.rateCards.length > 0) {
        const activeCard =
          selectedCustomer.rateCards.find((rc) => rc.status === 'Active') || selectedCustomer.rateCards[0];
        const laneRate = activeCard.laneRates?.find(
          (lr) => lr.routeId === rt.id || lr.laneCode === rt.laneCode
        );
        if (laneRate) {
          if (laneRate.ratePerKm !== undefined) nextRatePerKm = laneRate.ratePerKm;
          if (laneRate.fixedFreight !== undefined) nextBasicFreight = laneRate.fixedFreight;
        } else {
          nextRatePerKm = activeCard.defaultRatePerKm;
          if (activeCard.defaultFixedFreight) nextBasicFreight = activeCard.defaultFixedFreight;
        }
      }

      const updated = {
        ...prev,
        routeId: rt.id,
        laneCode: rt.laneCode,
        origin: rt.origin,
        destination: rt.destination,
        touchPoints: [...rt.touchPoints],
        plannedKm: rt.plannedKm,
        approvedKm: rt.approvedKm,
        ratePerKm: nextRatePerKm,
        basicFreight: nextBasicFreight,
        tollApplicable: rt.tollApplicable,
        tollCharges: rt.standardTollCost || 0,
      };

      const res = calculateCommercials(updated, consignmentTotals.totalWeightKg, consignmentTotals.totalPackages);
      return {
        ...updated,
        basicFreight: res.basicFreight,
        taxableAmount: res.taxableAmount,
        gstAmount: res.gstAmount,
        totalAmount: res.totalAmount,
      };
    });
  };

  // Automated Government E-Way Bill Verification
  const handleVerifyEWayBill = async (index: number) => {
    const inv = trip.invoices[index];
    if (!inv || !inv.ewaybillNo) return;
    setVerifyingEwbIndex(index);

    try {
      const assignedVeh = selectedVehicle?.vehicleNo || trip.vehicleId;
      const result = await verifyEWayBillWithGovtPortal(inv.ewaybillNo, assignedVeh, trip.bookingDatetime);

      const updatedInvoices = [...trip.invoices];
      updatedInvoices[index] = {
        ...inv,
        ewaybillValidTill: result.validUpto.split(' ')[0] !== '—' ? result.validUpto.split(' ')[0] : inv.ewaybillValidTill,
        ewbGovtVerification: result,
      };

      setTrip((prev) => ({ ...prev, invoices: updatedInvoices }));
    } finally {
      setVerifyingEwbIndex(null);
    }
  };

  // Quick Preset Test Buttons for E-Way Bill Testing
  const handleQuickSetTestEwb = async (index: number, ewbNumber: string) => {
    const updatedInvoices = [...trip.invoices];
    updatedInvoices[index] = {
      ...updatedInvoices[index],
      ewaybillNo: ewbNumber,
    };
    setTrip((prev) => ({ ...prev, invoices: updatedInvoices }));

    // Run verification immediately
    setVerifyingEwbIndex(index);
    try {
      const assignedVeh = selectedVehicle?.vehicleNo || trip.vehicleId;
      const result = await verifyEWayBillWithGovtPortal(ewbNumber, assignedVeh, trip.bookingDatetime);
      updatedInvoices[index] = {
        ...updatedInvoices[index],
        ewaybillValidTill: result.validUpto.split(' ')[0] !== '—' ? result.validUpto.split(' ')[0] : updatedInvoices[index].ewaybillValidTill,
        ewbGovtVerification: result,
      };
      setTrip((prev) => ({ ...prev, invoices: updatedInvoices }));
    } finally {
      setVerifyingEwbIndex(null);
    }
  };

  // Rate Card Override Flow
  const handleRequestRateOverride = (fieldName: string, fieldLabel: string, standardValue: any, newValue: any) => {
    setOverrideModalData({ fieldName, fieldLabel, standardValue, newValue });
  };

  const handleConfirmRateOverride = (justification: string) => {
    if (!overrideModalData) return;
    const { fieldName, standardValue, newValue } = overrideModalData;

    const newOverride = {
      field: overrideModalData.fieldLabel,
      standardValue,
      overriddenValue: newValue,
      justification,
      authorizedBy: `${currentUserName} (${currentUserRole})`,
      authorizedAt: new Date().toISOString(),
    };

    const existingOverrides = trip.rateCardOverrides || [];
    const updatedOverrides = [
      newOverride,
      ...existingOverrides.filter((o) => o.field !== overrideModalData.fieldLabel),
    ];

    const patch: Partial<TripRecord> = {
      [fieldName]: newValue,
      rateCardOverrides: updatedOverrides,
    };

    if (fieldName === 'ratePerKm' || fieldName === 'basicFreight') {
      patch.isFreightOverridden = true;
      patch.freightOverrideReason = justification;
    }
    if (fieldName === 'detentionRatePerDay' || fieldName === 'detentionFreeHours') {
      patch.isDetentionOverridden = true;
      patch.detentionOverrideReason = justification;
    }

    handleRecalculateCommercials(patch);
    setOverrideModalData(null);
  };

  // On Vehicle Change
  const handleVehicleChange = (vehId: string) => {
    const veh = vehicles.find((v) => v.id === vehId);
    if (!veh) {
      setTrip((prev) => ({ ...prev, vehicleId: '', gpsTrackingId: '' }));
      return;
    }

    setTrip((prev) => ({
      ...prev,
      vehicleId: veh.id,
      vehicleTypeId: veh.vehicleType,
      gpsTrackingId: veh.gpsId,
    }));
  };

  // Add Invoice Row
  const handleAddInvoice = () => {
    const nextNum = (trip.invoices.length + 1).toString().padStart(2, '0');
    const newInvoice: TripInvoice = {
      id: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tripId: trip.id,
      invoiceNo: `INV-${new Date().getFullYear()}-${nextNum}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      invoiceValue: 50000,
      ewaybillNo: `EWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
      ewaybillDate: new Date().toISOString().split('T')[0],
      ewaybillValidTill: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      packageCount: 20,
      weightKg: 1000,
      materialDescription: 'Finished Goods / Commercial Cargo',
    };

    const updatedInvoices = [...trip.invoices, newInvoice];
    const newTotals = calculateConsignmentTotals(updatedInvoices);

    setTrip((prev) => {
      const updated = { ...prev, invoices: updatedInvoices };
      const res = calculateCommercials(updated, newTotals.totalWeightKg, newTotals.totalPackages);
      return {
        ...updated,
        basicFreight: res.basicFreight,
        taxableAmount: res.taxableAmount,
        gstAmount: res.gstAmount,
        totalAmount: res.totalAmount,
      };
    });
  };

  // Update Invoice Row
  const handleUpdateInvoice = (index: number, field: keyof TripInvoice, value: any) => {
    const updatedInvoices = [...trip.invoices];
    updatedInvoices[index] = { ...updatedInvoices[index], [field]: value };
    const newTotals = calculateConsignmentTotals(updatedInvoices);

    setTrip((prev) => {
      const updated = { ...prev, invoices: updatedInvoices };
      const res = calculateCommercials(updated, newTotals.totalWeightKg, newTotals.totalPackages);
      return {
        ...updated,
        basicFreight: res.basicFreight,
        taxableAmount: res.taxableAmount,
        gstAmount: res.gstAmount,
        totalAmount: res.totalAmount,
      };
    });
  };

  // Delete Invoice Row
  const handleDeleteInvoice = (index: number) => {
    const updatedInvoices = trip.invoices.filter((_, i) => i !== index);
    const newTotals = calculateConsignmentTotals(updatedInvoices);

    setTrip((prev) => {
      const updated = { ...prev, invoices: updatedInvoices };
      const res = calculateCommercials(updated, newTotals.totalWeightKg, newTotals.totalPackages);
      return {
        ...updated,
        basicFreight: res.basicFreight,
        taxableAmount: res.taxableAmount,
        gstAmount: res.gstAmount,
        totalAmount: res.totalAmount,
      };
    });
  };

  // Save Draft Action
  const handleSaveDraft = () => {
    onSaveTrip({ ...trip, updatedAt: new Date().toISOString() }, false);
  };

  // Confirm Booking Action
  const handleConfirmBookingClick = () => {
    // Check permission
    if (!canConfirmTrip) {
      alert(`Permission Denied: Users with role "${currentUserRole}" cannot confirm trips. Requires Supervisor, Manager, or Admin.`);
      return;
    }

    // Automated Government E-Way Bill Blocking Check
    const todayStr = new Date().toISOString().split('T')[0];
    const invalidEwb = trip.invoices.find((inv) => {
      if (inv.ewbGovtVerification) {
        return (
          inv.ewbGovtVerification.status === 'EXPIRED' ||
          inv.ewbGovtVerification.status === 'INVALID' ||
          inv.ewbGovtVerification.status === 'CANCELLED' ||
          inv.ewbGovtVerification.vehicleNoMatches === false
        );
      }
      return inv.ewaybillValidTill && inv.ewaybillValidTill < todayStr;
    });

    if (invalidEwb) {
      const reason = invalidEwb.ewbGovtVerification
        ? invalidEwb.ewbGovtVerification.validationErrors.join('. ') || `E-Way Bill ${invalidEwb.ewaybillNo} is ${invalidEwb.ewbGovtVerification.status}`
        : `E-Way Bill ${invalidEwb.ewaybillNo} expired on ${invalidEwb.ewaybillValidTill}. Active E-Way Bill is legally mandatory under GST Section 129.`;
      setBlockingEwbMessage(reason);
      setBlockingEwbModalOpen(true);
      return;
    }

    // Check red alerts
    if (redAlerts.length > 0) {
      setValidationModalOpen(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteConfirmation = () => {
    setShowConfirmModal(false);
    const confirmedTrip: TripRecord = {
      ...trip,
      status: 'Booked',
      approvedBy: `${currentUserName} (${currentUserRole})`,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(trip.statusHistory || []),
        {
          id: `HIST-${Date.now()}`,
          tripId: trip.id,
          oldStatus: trip.status,
          newStatus: 'Booked',
          changedBy: currentUserName,
          userRole: currentUserRole,
          changedAt: new Date().toISOString(),
          remarks: 'Trip booking validated and confirmed. Commercials and vehicle locked.',
        },
      ],
    };
    onSaveTrip(confirmedTrip, true);
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 p-3 sm:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Module Header Bar */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-amber-400 tracking-wider text-sm uppercase">
                  BOW LOGISTICS PVT. LTD.
                </span>
                <span className="text-slate-400 text-xs">|</span>
                <span className="text-xs bg-slate-700 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                  WTMS TBM-001
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>TRIP BOOKING MODULE</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    trip.status === 'Draft'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : trip.status === 'Booked'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : trip.status === 'Cancelled'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {trip.status}
                </span>
              </h1>
            </div>

            {/* Quick Action Buttons (Top Bar) */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isTripLocked}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Save without locking (Operator/Any role)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => setValidationModalOpen(true)}
                className="bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-amber-500/30"
                title="Run complete 7-point validation audit"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Validate ({redAlerts.length} Red / {yellowWarnings.length} Ylw)</span>
              </button>

              {trip.status === 'Draft' && (
                <button
                  type="button"
                  onClick={handleConfirmBookingClick}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition-colors"
                  title="Confirm and lock booking (Supervisor/Manager/Admin)"
                >
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm Booking</span>
                </button>
              )}

              {trip.status !== 'Draft' && (
                <button
                  type="button"
                  onClick={() => onOpenWorkflow(trip)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Execute Lifecycle</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setGpsModalOpen(true)}
                className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                title="View live vehicle GPS telemetry, highway corridor map, and geofence tracking"
              >
                <Navigation className="w-3.5 h-3.5 animate-pulse" />
                <span>Live GPS Map</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPrintSheet(trip)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                title="Print official Customer Placement Sheet PDF (Section 15)"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenLR(trip)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                title="Generate LR (Lorry Receipt / Consignment Note)"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generate LR</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSendCustomer(trip)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>Send Customer</span>
              </button>

              {trip.status !== 'Cancelled' && trip.status !== 'Closed' && (
                <button
                  type="button"
                  onClick={() => onOpenCancel(trip)}
                  className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-medium px-3 py-1.5 rounded-lg border border-rose-800/60 flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>

          {/* Booking Information Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Trip ID (System Controlled)</span>
              <div className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>{trip.id}</span>
              </div>
              <span className="text-[10px] text-slate-500">{trip.tripNumber}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Booking Date / Time</span>
              <div className="font-semibold text-slate-200">
                {new Date(trip.bookingDatetime).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Auto timestamped</span>
            </div>

            <div>
              <label className="text-slate-400 block text-[11px]">Booking Source</label>
              <select
                disabled={isTripLocked}
                value={trip.bookingSource}
                onChange={(e) => setTrip({ ...trip, bookingSource: e.target.value as BookingSource })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-full"
              >
                <option value="Manual">Manual Entry</option>
                <option value="API">API Gateway</option>
                <option value="Portal">Customer Portal</option>
                <option value="Recurring">Recurring Contract</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block text-[11px]">Priority</label>
              <select
                disabled={isTripLocked}
                value={trip.priority}
                onChange={(e) => setTrip({ ...trip, priority: e.target.value as Priority })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-full"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Critical">Critical (Hot Dispatch)</option>
              </select>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Booked By (Logged-in User)</span>
              <div className="font-medium text-slate-300 truncate">{trip.bookedBy}</div>
              <span className="text-[10px] text-slate-500">Branch: Pune Hub</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Approved By</span>
              <div className="font-medium text-slate-300 truncate">
                {trip.approvedBy || <span className="text-slate-500 italic">Pending Confirmation</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Live Validation Alert Banner (if issues present) */}
        {redAlerts.length > 0 && (
          <div className="bg-rose-950/70 border border-rose-600/70 rounded-xl p-3 flex items-start space-x-3 text-xs text-rose-200 shadow-md">
            <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-rose-300 uppercase tracking-wide">
                🔴 Blocking Red Alerts ({redAlerts.length}) — Booking Confirmation Restricted:
              </span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-rose-200">
                {redAlerts.slice(0, 3).map((alert, idx) => (
                  <li key={idx}>
                    <span className="font-bold">{alert.title}: </span>
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setValidationModalOpen(true)}
              className="text-xs bg-rose-800 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded"
            >
              View All ({validationIssues.length})
            </button>
          </div>
        )}

        {redAlerts.length === 0 && yellowWarnings.length > 0 && (
          <div className="bg-amber-950/50 border border-amber-600/60 rounded-xl p-3 flex items-start space-x-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-300 uppercase tracking-wide">
                🟡 Operational Warnings ({yellowWarnings.length}):
              </span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-200">
                {yellowWarnings.slice(0, 2).map((warn, idx) => (
                  <li key={idx}>
                    <span className="font-semibold">{warn.title}: </span>
                    {warn.message}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setValidationModalOpen(true)}
              className="text-xs bg-amber-800 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded"
            >
              Review Warnings
            </button>
          </div>
        )}

        {/* SECTION 1: ROUTE & TRIP DETAILS */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>1. Route &amp; Trip Details</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Lane: {trip.laneCode || 'Select Route'} • Approved KM: {trip.approvedKm} KM
            </span>
          </div>

          <div className="p-4 space-y-4 text-xs">
            {/* Customer Dropdown with auto-fill preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">
                  Customer Name <span className="text-red-400">*</span>
                </label>
                <select
                  disabled={isTripLocked}
                  value={trip.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 font-medium"
                >
                  <option value="">— Select Customer from Master —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.status !== 'Active'}>
                      {c.name} ({c.code}) {c.status !== 'Active' ? '[SUSPENDED]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Customer Ref / PO No.
                </label>
                <input
                  type="text"
                  disabled={isTripLocked}
                  value={trip.customerReference}
                  onChange={(e) => setTrip({ ...trip, customerReference: e.target.value })}
                  placeholder="e.g. PO-2026-9811 / DO-44"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Requirement Type <span className="text-red-400">*</span>
                </label>
                <select
                  disabled={isTripLocked}
                  value={trip.requirementType}
                  onChange={(e) => setTrip({ ...trip, requirementType: e.target.value as RequirementType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                >
                  <option value="FTL">FTL (Full Truck Load)</option>
                  <option value="Part Load">Part Load</option>
                  <option value="One Way">One Way</option>
                  <option value="Round Trip">Round Trip</option>
                  <option value="Dedicated">Dedicated Vehicle</option>
                  <option value="Ad-hoc">Ad-hoc Placement</option>
                  <option value="Spot Vehicle">Spot Vehicle</option>
                  <option value="Return Load">Return Load</option>
                  <option value="Customer Contract">Customer Contract</option>
                </select>
              </div>
            </div>

            {/* Auto-populated Customer Details Preview Card */}
            {selectedCustomer && (
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Customer Code</span>
                  <span className="font-bold font-mono text-slate-200">{selectedCustomer.code}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">GSTIN</span>
                  <span className="font-bold font-mono text-slate-200">{selectedCustomer.gstin}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Terms</span>
                  <span className="font-semibold text-slate-300">{selectedCustomer.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Default Detention</span>
                  <span className="font-bold text-amber-400">
                    ₹{selectedCustomer.defaultDetentionRate.toLocaleString()} / Day ({selectedCustomer.defaultFreeHours}h free)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Freight Terms</span>
                  <span className="text-slate-300 truncate block">{selectedCustomer.defaultFreightTerms}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span
                    className={`font-bold ${
                      selectedCustomer.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedCustomer.status}
                  </span>
                </div>
              </div>
            )}

            {/* Route & Lane Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">
                  Route Name <span className="text-red-400">*</span>
                </label>
                <select
                  disabled={isTripLocked}
                  value={trip.routeId}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                >
                  <option value="">— Select Route / Lane —</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} [{r.laneCode}] ({r.approvedKm} KM)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Lane Code</label>
                <input
                  type="text"
                  disabled
                  value={trip.laneCode}
                  placeholder="Auto populated"
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs font-mono text-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Trip Type</label>
                <select
                  disabled={isTripLocked}
                  value={trip.tripType}
                  onChange={(e) => setTrip({ ...trip, tripType: e.target.value as TripType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="One Way">One Way</option>
                  <option value="Round Trip">Round Trip</option>
                  <option value="Multi-drop">Multi-drop</option>
                </select>
              </div>
            </div>

            {/* Origin, Destination, Touch Points, KM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Origin Hub <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={isTripLocked}
                  value={trip.origin}
                  onChange={(e) => setTrip({ ...trip, origin: e.target.value })}
                  placeholder="e.g. Pune Chakan DC"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Destination Hub <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={isTripLocked}
                  value={trip.destination}
                  onChange={(e) => setTrip({ ...trip, destination: e.target.value })}
                  placeholder="e.g. Delhi Okhla Hub"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Planned KM</label>
                <input
                  type="number"
                  disabled={isTripLocked}
                  value={trip.plannedKm || ''}
                  onChange={(e) => setTrip({ ...trip, plannedKm: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              {/* Approved KM with Authorization Lock */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs flex items-center gap-1">
                    <span>Approved KM</span>
                    {!canChangeApprovedKm && (
                      <span title="Locked: Manager permission required to alter">
                        <Lock className="w-3 h-3 text-amber-500" />
                      </span>
                    )}
                  </label>
                  {canChangeApprovedKm && !isTripLocked && (
                    <span className="text-[10px] text-amber-400 font-mono">Manager Override</span>
                  )}
                </div>
                <input
                  type="number"
                  disabled={isTripLocked || !canChangeApprovedKm}
                  value={trip.approvedKm || ''}
                  onChange={(e) => {
                    const newKm = Number(e.target.value);
                    setTrip((prev) => ({
                      ...prev,
                      approvedKm: newKm,
                      isApprovedKmOverridden: true,
                      kmOverrideReason: 'Authorized by Manager in booking session',
                    }));
                    handleRecalculateCommercials({ approvedKm: newKm });
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-mono font-bold ${
                    canChangeApprovedKm && !isTripLocked
                      ? 'bg-slate-900 border border-amber-500/60 text-amber-300'
                      : 'bg-slate-950/60 border border-slate-700/60 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Toll Applicable</label>
                <div className="flex items-center space-x-2 pt-1.5">
                  <button
                    type="button"
                    disabled={isTripLocked}
                    onClick={() => {
                      const next = !trip.tollApplicable;
                      const nextCost = next && selectedRoute ? selectedRoute.standardTollCost : 0;
                      setTrip((prev) => ({ ...prev, tollApplicable: next, tollCharges: nextCost }));
                      handleRecalculateCommercials({ tollApplicable: next, tollCharges: nextCost });
                    }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      trip.tollApplicable
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {trip.tollApplicable ? 'Yes (Tollway)' : 'No (Exempt)'}
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">₹{trip.tollCharges}</span>
                </div>
              </div>
            </div>

            {/* Touch Points & Loading Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Touch Points / En-route Stops</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 border border-slate-700 rounded-lg min-h-[38px] items-center">
                  {trip.touchPoints.map((tp, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-800 text-amber-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] flex items-center gap-1"
                    >
                      <span>{tp}</span>
                      {!isTripLocked && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = trip.touchPoints.filter((_, i) => i !== idx);
                            setTrip({ ...trip, touchPoints: updated });
                          }}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {!isTripLocked && (
                    <input
                      type="text"
                      placeholder="+ add point & hit Enter"
                      value={activeTouchPointInput}
                      onChange={(e) => setActiveTouchPointInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && activeTouchPointInput.trim()) {
                          e.preventDefault();
                          setTrip({
                            ...trip,
                            touchPoints: [...trip.touchPoints, activeTouchPointInput.trim()],
                          });
                          setActiveTouchPointInput('');
                        }
                      }}
                      className="bg-transparent text-xs text-white outline-none flex-1 min-w-[120px]"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Loading Date / Time</label>
                <input
                  type="datetime-local"
                  disabled={isTripLocked}
                  value={trip.loadingDatetime}
                  onChange={(e) => setTrip({ ...trip, loadingDatetime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Reporting Point / Gate</label>
                <input
                  type="text"
                  disabled={isTripLocked}
                  value={trip.reportingLocation}
                  onChange={(e) => setTrip({ ...trip, reportingLocation: e.target.value })}
                  placeholder="e.g. Gate 2 - Inward Bay 4 (10:00 Hrs)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: VEHICLE & DRIVER */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-2.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>2. Vehicle &amp; Driver Assignment</span>
            </h2>
            <div className="flex items-center space-x-2 text-[11px]">
              <button
                type="button"
                onClick={() => setGpsModalOpen(true)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                title="Open live telemetry, coordinates, and geofence tracking"
              >
                <Navigation className="w-3.5 h-3.5 animate-pulse" />
                <span>Live GPS Tracking &amp; Map</span>
                <span className="text-[10px] text-emerald-300 font-mono">({telemetry.speedKmH} km/h)</span>
              </button>

              {selectedVehicle && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    selectedVehicle.status === 'Available'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  Vehicle: {selectedVehicle.status}
                </span>
              )}
              {selectedDriver && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    selectedDriver.status === 'Available'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  Driver: {selectedDriver.status}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Vehicle Type */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Vehicle Type <span className="text-red-400">*</span>
                </label>
                <select
                  disabled={isTripLocked}
                  value={trip.vehicleTypeId}
                  onChange={(e) => setTrip({ ...trip, vehicleTypeId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                >
                  {VEHICLE_TYPES.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name} [{vt.defaultCapacityMt} MT]
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Vehicle No.</label>
                <select
                  disabled={isTripLocked}
                  value={trip.vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold"
                >
                  <option value="">— Select Vehicle from Fleet —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNo} • {v.capacityMt} MT ({v.status}) - {v.currentLocation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Selection */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Driver Name</label>
                <select
                  disabled={isTripLocked}
                  value={trip.driverId}
                  onChange={(e) => setTrip({ ...trip, driverId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                >
                  <option value="">— Select Driver —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.status}) - {d.mobile}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Mobile */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Driver Mobile</label>
                <input
                  type="text"
                  disabled={isTripLocked}
                  value={selectedDriver ? selectedDriver.mobile : ''}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  readOnly
                />
              </div>
            </div>

            {/* Live Vehicle & Driver Telematics & Compliance Card */}
            {(selectedVehicle || selectedDriver) && (
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-[11px]">
                {selectedVehicle && (
                  <>
                    <div>
                      <span className="text-slate-500 block">Payload Capacity</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {selectedVehicle.capacityMt} MT ({selectedVehicle.capacityKg.toLocaleString()} KG)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">GPS Telematics ID</span>
                      <span className="font-bold text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {selectedVehicle.gpsId} ({selectedVehicle.gpsStatus})
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Current Location</span>
                      <span className="font-semibold text-slate-200">{selectedVehicle.currentLocation}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Fitness Expiry</span>
                      <span className="font-mono text-slate-300">{selectedVehicle.fitnessExpiry}</span>
                    </div>
                  </>
                )}

                {selectedDriver && (
                  <>
                    <div>
                      <span className="text-slate-500 block">Driver License No.</span>
                      <span className="font-mono text-slate-200">{selectedDriver.licenseNo}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">DL Valid Till</span>
                      <span
                        className={`font-mono font-bold ${
                          selectedDriver.licenseExpiry < new Date().toISOString().split('T')[0]
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {selectedDriver.licenseExpiry}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* GPS Telematics vs Manual Schedule Discrepancy Warning */}
            {telemetry.discrepancies && telemetry.discrepancies.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-600/70 p-3 rounded-lg flex items-start space-x-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-amber-300">
                    ⚠️ GPS Telematics Geofence &amp; Manual Schedule Discrepancy:
                  </div>
                  <div className="text-[11px] text-amber-200 mt-0.5">
                    {telemetry.discrepancies[0]?.alertMessage}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded text-[11px]"
                >
                  Review GPS vs Manual
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: CONSIGNMENT (Multi-Invoice Grid) */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>3. Consignment &amp; Multi-Invoice Manifest</span>
              </h2>
              <span className="text-[11px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                Rows: {trip.invoices.length}
              </span>
            </div>

            {!isTripLocked && (
              <button
                type="button"
                onClick={handleAddInvoice}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1 rounded shadow flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Invoice</span>
              </button>
            )}
          </div>

          <div className="p-4 space-y-3">
            {/* Multi-Invoice Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Invoice No. *</th>
                    <th className="py-2.5 px-3">Invoice Date</th>
                    <th className="py-2.5 px-3 text-right">Value (₹)</th>
                    <th className="py-2.5 px-3">E-Way Bill *</th>
                    <th className="py-2.5 px-3">EWB Valid Till</th>
                    <th className="py-2.5 px-3 text-center">Pkgs</th>
                    <th className="py-2.5 px-3 text-right">Weight (KG) *</th>
                    <th className="py-2.5 px-3">Material Description</th>
                    {!isTripLocked && <th className="py-2.5 px-2 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {trip.invoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isTripLocked ? 8 : 9}
                        className="py-6 text-center text-slate-400 italic bg-slate-900/30"
                      >
                        No invoices added yet. Click &quot;+ Add Invoice&quot; to attach invoices and E-Way Bills to this trip.
                      </td>
                    </tr>
                  ) : (
                    trip.invoices.map((inv, idx) => (
                      <React.Fragment key={inv.id || idx}>
                        <tr className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={isTripLocked}
                            value={inv.invoiceNo}
                            onChange={(e) => handleUpdateInvoice(idx, 'invoiceNo', e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white w-28"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            disabled={isTripLocked}
                            value={inv.invoiceDate}
                            onChange={(e) => handleUpdateInvoice(idx, 'invoiceDate', e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            disabled={isTripLocked}
                            value={inv.invoiceValue}
                            onChange={(e) => handleUpdateInvoice(idx, 'invoiceValue', Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-right w-24"
                          />
                        </td>
                        <td className="p-2 min-w-[240px]">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                disabled={isTripLocked}
                                value={inv.ewaybillNo}
                                onChange={(e) => handleUpdateInvoice(idx, 'ewaybillNo', e.target.value)}
                                placeholder="EWB Number..."
                                className={`bg-slate-900 border rounded px-2 py-1 text-xs font-mono font-bold w-32 ${
                                  inv.ewbGovtVerification?.status === 'EXPIRED' ||
                                  inv.ewbGovtVerification?.status === 'INVALID' ||
                                  inv.ewbGovtVerification?.status === 'CANCELLED'
                                    ? 'border-rose-500 text-rose-300 ring-1 ring-rose-500'
                                    : inv.ewbGovtVerification?.status === 'ACTIVE'
                                    ? 'border-emerald-500 text-emerald-300'
                                    : 'border-slate-700 text-white'
                                }`}
                              />
                              {!isTripLocked && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyEWayBill(idx)}
                                  disabled={verifyingEwbIndex === idx || !inv.ewaybillNo}
                                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border border-slate-700"
                                  title="Verify validity and expiry against Govt NIC Portal"
                                >
                                  {verifyingEwbIndex === idx ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                                  ) : (
                                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                                  )}
                                  <span>Verify</span>
                                </button>
                              )}
                            </div>

                            {/* Verification Status Pill */}
                            <div className="flex items-center gap-1.5">
                              {inv.ewbGovtVerification ? (
                                inv.ewbGovtVerification.status === 'ACTIVE' ? (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold font-mono flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Govt Active (Upto: {inv.ewbGovtVerification.validUpto.split(' ')[0]})
                                  </span>
                                ) : inv.ewbGovtVerification.status === 'EXPIRED' ? (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1.5 py-0.2 rounded font-black font-mono flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" />
                                    🔴 EXPIRED (BLOCKED)
                                  </span>
                                ) : inv.ewbGovtVerification.status === 'CANCELLED' ? (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold font-mono">
                                    🔴 CANCELLED
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold font-mono">
                                    🔴 INVALID NUMBER
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">Govt Check: Unverified</span>
                              )}
                            </div>

                            {/* Quick Test Presets for Government Check (Prompt testing convenience) */}
                            {!isTripLocked && (
                              <div className="flex items-center space-x-1 pt-0.5 text-[9px]">
                                <span className="text-slate-500">Test:</span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSetTestEwb(idx, 'EWB12389021')}
                                  className="text-emerald-400 hover:underline"
                                  title="Test with an active valid E-Way Bill"
                                >
                                  [Valid]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSetTestEwb(idx, 'EWB-EXPIRED-99')}
                                  className="text-rose-400 hover:underline font-bold"
                                  title="Test with an expired E-Way Bill to see Red Alert blocking"
                                >
                                  [Expired Alert]
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            disabled={isTripLocked}
                            value={inv.ewaybillValidTill}
                            onChange={(e) => handleUpdateInvoice(idx, 'ewaybillValidTill', e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            disabled={isTripLocked}
                            value={inv.packageCount}
                            onChange={(e) => handleUpdateInvoice(idx, 'packageCount', Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center text-white w-16"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            disabled={isTripLocked}
                            value={inv.weightKg}
                            onChange={(e) => handleUpdateInvoice(idx, 'weightKg', Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 text-right w-20"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled={isTripLocked}
                            value={inv.materialDescription}
                            onChange={(e) => handleUpdateInvoice(idx, 'materialDescription', e.target.value)}
                            placeholder="Description..."
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                          />
                        </td>
                        {!isTripLocked && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(idx)}
                              className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                              title="Delete invoice row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Inline Red Alert Sub-row for Expired / Invalid E-Way Bill */}
                      {inv.ewbGovtVerification &&
                        (inv.ewbGovtVerification.status === 'EXPIRED' ||
                          inv.ewbGovtVerification.status === 'INVALID' ||
                          inv.ewbGovtVerification.status === 'CANCELLED' ||
                          inv.ewbGovtVerification.vehicleNoMatches === false) && (
                          <tr key={`alert-${inv.id || idx}`} className="bg-rose-950/60 border-b border-rose-800/80">
                            <td colSpan={isTripLocked ? 8 : 9} className="px-4 py-2 text-rose-200">
                              <div className="flex items-center space-x-2 text-xs">
                                <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
                                <span className="font-bold text-rose-300 uppercase tracking-wide">
                                  🔴 Red Alert (GST Non-Compliance):
                                </span>
                                <span>
                                  {inv.ewbGovtVerification.validationErrors.join(' ') ||
                                    `E-Way Bill ${inv.ewaybillNo} is expired or invalid on the Government NIC Portal. Booking confirmation is restricted.`}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  )))}
                </tbody>
              </table>
            </div>

            {/* Consignment Payload & Weight Validation Summary Bar */}
            <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-slate-400 text-[11px] block">Total Invoices</span>
                  <span className="font-bold text-white text-sm">{trip.invoices.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Total Packages</span>
                  <span className="font-bold text-white text-sm">{consignmentTotals.totalPackages} Pkgs</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Total Declared Value</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    ₹{consignmentTotals.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Weight vs Capacity Indicator */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">Payload Weight vs Vehicle Capacity</span>
                  <div className="font-mono font-bold text-sm">
                    <span
                      className={
                        selectedVehicle && consignmentTotals.totalWeightKg > selectedVehicle.capacityKg
                          ? 'text-rose-400 font-black'
                          : 'text-emerald-400'
                      }
                    >
                      {consignmentTotals.totalWeightKg.toLocaleString()} KG
                    </span>
                    <span className="text-slate-400">
                      {' '}
                      / {selectedVehicle ? `${selectedVehicle.capacityKg.toLocaleString()} KG (${selectedVehicle.capacityMt} MT)` : 'No Vehicle'}
                    </span>
                  </div>
                </div>

                {selectedVehicle && consignmentTotals.totalWeightKg > selectedVehicle.capacityKg ? (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    OVERLOAD!
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Payload OK
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: COMMERCIAL SECTION */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>4. Commercial Terms &amp; Freight Calculation</span>
            </h2>
            <div className="flex items-center space-x-2">
              {onOpenRateCardManager && (
                <button
                  type="button"
                  onClick={() => onOpenRateCardManager(trip.customerId)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2.5 py-1 rounded text-xs font-medium border border-slate-600 flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rate Card Master</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenDetention(trip)}
                className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2.5 py-1 rounded text-xs font-medium border border-amber-500/30 flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Detention Tracker (₹{trip.detentionRatePerDay}/day)</span>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 text-xs">
            {/* Customer Rate Card Applied Banner */}
            {trip.rateCardContractName ? (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300">Contract Rate Card Applied:</span>
                  <span className="text-white font-medium">{trip.rateCardContractName}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Auto-populated rates: {trip.freightCalculationMode} • ₹{trip.ratePerKm}/unit • {trip.detentionFreeHours}h Free
                </div>
              </div>
            ) : selectedCustomer ? (
              <div className="bg-slate-900 border border-slate-700 p-2 rounded flex items-center justify-between text-[11px] text-slate-400">
                <span>Standard default commercial rates active for {selectedCustomer.name}.</span>
                {onOpenRateCardManager && (
                  <button
                    type="button"
                    onClick={() => onOpenRateCardManager(trip.customerId)}
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    + Define Customer Rate Card
                  </button>
                )}
              </div>
            ) : null}

            {/* Active Overrides Audit Strip */}
            {trip.rateCardOverrides && trip.rateCardOverrides.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-800/60 p-2.5 rounded-lg space-y-1 text-[11px]">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Authorized Contract Rate Overrides ({trip.rateCardOverrides.length})</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {trip.rateCardOverrides.map((ovr, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-amber-600/40 px-2 py-1 rounded text-slate-300"
                    >
                      <span className="font-bold text-amber-300">{ovr.field}: </span>
                      <span>
                        ₹{ovr.standardValue} → <strong className="text-white">₹{ovr.overriddenValue}</strong>
                      </span>
                      <span className="text-slate-400 italic ml-1">(&quot;{ovr.justification}&quot;)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculation Mode & Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Calculation Method</label>
                <select
                  disabled={isTripLocked}
                  value={trip.freightCalculationMode}
                  onChange={(e) => {
                    const mode = e.target.value as FreightCalculationMode;
                    handleRecalculateCommercials({ freightCalculationMode: mode });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                >
                  <option value="Per KM">Per KM (Approved KM × Rate/KM)</option>
                  <option value="Fixed Freight">Fixed Freight</option>
                  <option value="Per Trip">Per Trip Lumpsum</option>
                  <option value="Per MT">Per MT Payload</option>
                  <option value="Per Package">Per Package Count</option>
                  <option value="Contract Rate">Customer Contract Rate</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold block">Rate / KM or Unit (₹)</label>
                  {!isTripLocked && canChangeFreight && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRequestRateOverride(
                          'ratePerKm',
                          'Rate / KM',
                          selectedCustomer?.rateCards?.[0]?.defaultRatePerKm || 29.3,
                          trip.ratePerKm
                        )
                      }
                      className="text-[10px] text-amber-400 hover:underline font-semibold"
                    >
                      Override
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  disabled={isTripLocked}
                  value={trip.ratePerKm}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    handleRecalculateCommercials({ ratePerKm: r });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white"
                />
              </div>

              {/* Basic Freight with Permission Override Check */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs flex items-center gap-1">
                    <span>Basic Freight (₹)</span>
                    {!canChangeFreight && (
                      <span title="Manager permission required to change freight directly">
                        <Lock className="w-3 h-3 text-amber-500" />
                      </span>
                    )}
                  </label>
                  {!isTripLocked && canChangeFreight && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRequestRateOverride(
                          'basicFreight',
                          'Basic Freight',
                          Math.round(trip.approvedKm * trip.ratePerKm),
                          trip.basicFreight
                        )
                      }
                      className="text-[10px] text-amber-400 hover:underline font-semibold"
                    >
                      Override
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  disabled={isTripLocked || !canChangeFreight}
                  value={trip.basicFreight}
                  onChange={(e) => {
                    const bf = Number(e.target.value);
                    handleRecalculateCommercials({
                      basicFreight: bf,
                      isFreightOverridden: true,
                      freightOverrideReason: 'Manual commercial agreement entered by Manager',
                    });
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-mono font-bold ${
                    canChangeFreight && !isTripLocked
                      ? 'bg-slate-900 border border-amber-500/60 text-amber-300'
                      : 'bg-slate-950/60 border border-slate-700/60 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Detention Rate with Permission Check */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs flex items-center gap-1">
                    <span>Detention Rate (₹ / Day)</span>
                    {!canChangeDetention && (
                      <span title="Manager permission required to edit detention rate">
                        <Lock className="w-3 h-3 text-amber-500" />
                      </span>
                    )}
                  </label>
                  {!isTripLocked && canChangeDetention && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRequestRateOverride(
                          'detentionRatePerDay',
                          'Detention Rate',
                          selectedCustomer?.defaultDetentionRate || 3500,
                          trip.detentionRatePerDay
                        )
                      }
                      className="text-[10px] text-amber-400 hover:underline font-semibold"
                    >
                      Override
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  disabled={isTripLocked || !canChangeDetention}
                  value={trip.detentionRatePerDay}
                  onChange={(e) => {
                    const dr = Number(e.target.value);
                    setTrip({
                      ...trip,
                      detentionRatePerDay: dr,
                      isDetentionOverridden: true,
                      detentionOverrideReason: 'Commercial rate adjustment authorized by Manager',
                    });
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-mono font-bold ${
                    canChangeDetention && !isTripLocked
                      ? 'bg-slate-900 border border-amber-500/60 text-amber-300'
                      : 'bg-slate-950/60 border border-slate-700/60 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Ancillary Charges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Loading Charges (₹)</label>
                <input
                  type="number"
                  disabled={isTripLocked}
                  value={trip.loadingCharges}
                  onChange={(e) => handleRecalculateCommercials({ loadingCharges: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Unloading Charges (₹)</label>
                <input
                  type="number"
                  disabled={isTripLocked}
                  value={trip.unloadingCharges}
                  onChange={(e) => handleRecalculateCommercials({ unloadingCharges: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Toll Charges (₹)</label>
                <input
                  type="number"
                  disabled={isTripLocked}
                  value={trip.tollCharges}
                  onChange={(e) => handleRecalculateCommercials({ tollCharges: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Other Charges (₹)</label>
                <input
                  type="number"
                  disabled={isTripLocked}
                  value={trip.otherCharges}
                  onChange={(e) => handleRecalculateCommercials({ otherCharges: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Discount (₹)</label>
                <input
                  type="number"
                  disabled={isTripLocked}
                  value={trip.discount}
                  onChange={(e) => handleRecalculateCommercials({ discount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-rose-300"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">GST Rate</label>
                <select
                  disabled={isTripLocked}
                  value={trip.gstRate}
                  onChange={(e) => handleRecalculateCommercials({ gstRate: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% (GTA RCM)</option>
                  <option value="12">12% (Forward Charge)</option>
                  <option value="18">18% (Standard WTMS)</option>
                </select>
              </div>
            </div>

            {/* Commercial Grand Total Strip */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <span className="text-slate-400 text-xs block">Taxable Amount</span>
                  <div className="font-mono text-base font-bold text-white">
                    ₹{trip.taxableAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">GST ({trip.gstRate}%)</span>
                  <div className="font-mono text-base font-bold text-slate-300">
                    ₹{trip.gstAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Detention Terms</span>
                  <div className="font-bold text-amber-400 text-xs mt-1">
                    ₹{trip.detentionRatePerDay.toLocaleString()} / Day (after {trip.detentionFreeHours}h)
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-400 text-xs block uppercase tracking-wider font-semibold">
                  Grand Total Payable
                </span>
                <div className="font-mono text-2xl font-black text-amber-400">
                  ₹{trip.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: INSTRUCTIONS (Three separated fields per spec) */}
        <section className="bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>5. Operational Instructions &amp; Remarks</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Customer remarks will be printed on PDF; Operations remarks remain internal.
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Customer Instructions (Prints on PDF)
              </label>
              <textarea
                disabled={isTripLocked}
                value={trip.customerInstructions}
                onChange={(e) => setTrip({ ...trip, customerInstructions: e.target.value })}
                placeholder="e.g. Vehicle must report at customer gate before 10:00 Hrs..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Loading / Handling Instructions (Prints on PDF)
              </label>
              <textarea
                disabled={isTripLocked}
                value={trip.loadingInstructions}
                onChange={(e) => setTrip({ ...trip, loadingInstructions: e.target.value })}
                placeholder="e.g. Loading/unloading manpower will be arranged by customer. Fragile goods on top..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                <span>Operations Remarks</span>
                <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800 font-mono">
                  INTERNAL ONLY - NOT ON PDF
                </span>
              </label>
              <textarea
                disabled={isTripLocked}
                value={trip.operationsRemarks}
                onChange={(e) => setTrip({ ...trip, operationsRemarks: e.target.value })}
                placeholder="e.g. Rate approved by regional head; driver instructed to take expressway..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          </div>
        </section>

        {/* BOTTOM ACTION BUTTONS BAR (Section 1 & 12) */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isTripLocked}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => setValidationModalOpen(true)}
              className="bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-amber-500/40"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Validate Booking</span>
            </button>

            {trip.status === 'Draft' ? (
              <button
                type="button"
                onClick={handleConfirmBookingClick}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
              >
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm Booking</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenWorkflow(trip)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Workflow / Dispatch</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onOpenPrintSheet(trip)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenLR(trip)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generate LR</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSendCustomer(trip)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Send Customer</span>
            </button>

            {trip.status !== 'Cancelled' && (
              <button
                type="button"
                onClick={() => onOpenCancel(trip)}
                className="bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold px-3.5 py-2 rounded-lg text-xs border border-rose-800"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* FULL VALIDATION MODAL DIALOG */}
      {validationModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden">
            <div className="bg-slate-850 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">WTMS Full Trip Validation Audit</h3>
              </div>
              <button
                onClick={() => setValidationModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg">
                  <div className="text-xl font-black text-rose-400">{redAlerts.length}</div>
                  <div className="text-rose-300 font-bold text-[11px]">🔴 Red Alerts (Blocking)</div>
                </div>
                <div className="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg">
                  <div className="text-xl font-black text-amber-400">{yellowWarnings.length}</div>
                  <div className="text-amber-300 font-bold text-[11px]">🟡 Warnings (Review)</div>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
                  <div className="text-xl font-black text-emerald-400">{greenChecks.length}</div>
                  <div className="text-emerald-300 font-bold text-[11px]">🟢 Passed Compliances</div>
                </div>
              </div>

              {/* Red alerts */}
              {redAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                    Blocking Red Alerts
                  </h4>
                  {redAlerts.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-rose-950/60 border border-rose-800 p-2.5 rounded-lg text-rose-200"
                    >
                      <div className="font-bold text-rose-300">{issue.title}</div>
                      <div>{issue.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Yellow warnings */}
              {yellowWarnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                    Operational Warnings
                  </h4>
                  {yellowWarnings.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-950/60 border border-amber-800 p-2.5 rounded-lg text-amber-200"
                    >
                      <div className="font-bold text-amber-300">{issue.title}</div>
                      <div>{issue.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Green checks */}
              {greenChecks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                    Passed Checks
                  </h4>
                  {greenChecks.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg text-emerald-200"
                    >
                      <div className="font-bold text-emerald-300">{issue.title}</div>
                      <div>{issue.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-850 px-6 py-3 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setValidationModalOpen(false)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded text-xs"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BOOKING MODAL (Section 18 & 19) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl max-w-md w-full my-auto overflow-hidden">
            <div className="bg-slate-850 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Confirm Trip Booking</h3>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-300">
                Are you sure you want to confirm trip{' '}
                <span className="font-mono font-bold text-amber-400">{trip.id}</span>?
              </p>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-200 text-[11px] space-y-1">
                <div className="font-bold">Important Confirmation Effects:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li>Trip status transitions from Draft to <strong>Booked</strong>.</li>
                  <li>Assigned vehicle ({trip.vehicleId || 'MH12AB1234'}) is locked from duplicate booking.</li>
                  <li>Key commercial fields (Freight: ₹{trip.basicFreight.toLocaleString()}, Total: ₹{trip.totalAmount.toLocaleString()}) are frozen.</li>
                  <li>Vehicle Placement Sheet PDF is finalized for customer dispatch.</li>
                  <li>Approval is permanently timestamped under your name: <strong>{currentUserName}</strong> ({currentUserRole}).</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-850 px-6 py-3 border-t border-slate-700 flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Go Back
              </button>
              <button
                onClick={handleExecuteConfirmation}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-xs font-bold shadow flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                <span>Yes, Confirm &amp; Lock Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
