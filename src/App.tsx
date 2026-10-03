import React, { useState, useEffect } from 'react';
import {
  TripRecord,
  UserRole,
  CustomerMaster,
  RouteMaster,
  VehicleMaster,
  DriverMaster,
  TripStatus,
  TripDetention,
  CustomerRateCard,
} from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
} from './data/masterData';
import { Navbar } from './components/Navbar';
import { Sidebar, MainNavView } from './components/Sidebar';
import { TripBookingForm } from './components/TripBookingForm';
import { TripList } from './components/TripList';
import { OperationsDashboard } from './components/OperationsDashboard';
import { BillingView } from './components/BillingView';
import { ReportsView } from './components/ReportsView';
import { MasterDataView } from './components/MasterDataView';
import { CustomerPrintSheet } from './components/CustomerPrintSheet';
import { LRModal } from './components/LRModal';
import { DetentionModal } from './components/DetentionModal';
import { WorkflowExecutionModal } from './components/WorkflowExecutionModal';
import { CancelTripModal } from './components/CancelTripModal';
import { SendCustomerModal } from './components/SendCustomerModal';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { GpsTrackingModal } from './components/GpsTrackingModal';
import { RateCardManagerModal } from './components/RateCardManagerModal';

const STORAGE_KEY_TRIPS = 'bow_wtms_trips_v1';

export default function App() {
  // Trips state with localStorage fallback
  const [trips, setTrips] = useState<TripRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRIPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading trips from localStorage', e);
    }
    return INITIAL_TRIPS;
  });

  // Save trips to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips));
    } catch (e) {
      console.error('Error saving trips to localStorage', e);
    }
  }, [trips]);

  // Master Data
  const [customers, setCustomers] = useState<CustomerMaster[]>(INITIAL_CUSTOMERS);
  const [routes] = useState<RouteMaster[]>(INITIAL_ROUTES);
  const [vehicles, setVehicles] = useState<VehicleMaster[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<DriverMaster[]>(INITIAL_DRIVERS);

  // User and Persona Simulation
  const [currentRole, setCurrentRole] = useState<UserRole>('Supervisor');
  const [currentUserName] = useState<string>('Vikram Joshi');

  // Navigation State
  const [currentView, setCurrentView] = useState<MainNavView>('booking-form');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'ALL'>('ALL');
  const [activeEditingTrip, setActiveEditingTrip] = useState<TripRecord | undefined>(trips[0]);

  // Modals & Drawers
  const [printSheetTrip, setPrintSheetTrip] = useState<TripRecord | null>(null);
  const [lrTrip, setLrTrip] = useState<TripRecord | null>(null);
  const [detentionTrip, setDetentionTrip] = useState<TripRecord | null>(null);
  const [workflowTrip, setWorkflowTrip] = useState<TripRecord | null>(null);
  const [cancelTrip, setCancelTrip] = useState<TripRecord | null>(null);
  const [sendCustomerTrip, setSendCustomerTrip] = useState<TripRecord | null>(null);
  const [auditLogTrip, setAuditLogTrip] = useState<TripRecord | null>(null);
  const [gpsTrackingTrip, setGpsTrackingTrip] = useState<TripRecord | null>(null);
  const [rateCardManagerCustomerId, setRateCardManagerCustomerId] = useState<string | null>(null);

  // Status Counts for Sidebar
  const tripCountsByStatus: Record<string, number> = {
    ALL: trips.length,
    Draft: trips.filter((t) => t.status === 'Draft').length,
    Booked: trips.filter((t) => t.status === 'Booked').length,
    'Vehicle Assigned': trips.filter((t) => t.status === 'Vehicle Assigned').length,
    Dispatched: trips.filter((t) => t.status === 'Dispatched').length,
    'In Transit': trips.filter((t) => t.status === 'In Transit').length,
    Delivered: trips.filter((t) => t.status === 'Delivered' || t.status === 'Arrived').length,
    'POD Received': trips.filter((t) => t.status === 'POD Received').length,
    Closed: trips.filter((t) => t.status === 'Closed' || t.status === 'Billable').length,
    Cancelled: trips.filter((t) => t.status === 'Cancelled').length,
  };

  // Handlers
  const handleNewBooking = () => {
    setActiveEditingTrip(undefined);
    setCurrentView('booking-form');
  };

  const handleSelectTripForEdit = (trip: TripRecord) => {
    setActiveEditingTrip(trip);
    setCurrentView('booking-form');
  };

  const handleSaveTrip = (savedTrip: TripRecord, isConfirming: boolean = false) => {
    setTrips((prevTrips) => {
      const exists = prevTrips.some((t) => t.id === savedTrip.id);
      if (exists) {
        return prevTrips.map((t) => (t.id === savedTrip.id ? savedTrip : t));
      } else {
        return [savedTrip, ...prevTrips];
      }
    });

    setActiveEditingTrip(savedTrip);

    // If confirming, mark vehicle as booked/on trip
    if (isConfirming && savedTrip.vehicleId) {
      setVehicles((prev) =>
        prev.map((v) => (v.id === savedTrip.vehicleId ? { ...v, status: 'On Trip' } : v))
      );
    }
  };

  const handleSaveLR = (lrNumber: string, lrDate: string, consignor: string, consignee: string) => {
    if (!lrTrip) return;
    const updated: TripRecord = {
      ...lrTrip,
      lrNumber,
      lrDate,
      consignorName: consignor,
      consigneeName: consignee,
      updatedAt: new Date().toISOString(),
    };
    handleSaveTrip(updated, false);
    setLrTrip(null);
  };

  const handleSaveDetention = (detention: TripDetention) => {
    if (!detentionTrip) return;
    const existing = detentionTrip.detentionRecords || [];
    const updatedDetentions = [detention, ...existing.filter((d) => d.id !== detention.id)];

    const updated: TripRecord = {
      ...detentionTrip,
      detentionRecords: updatedDetentions,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(detentionTrip.statusHistory || []),
        {
          id: `HIST-${Date.now()}`,
          tripId: detentionTrip.id,
          oldStatus: detentionTrip.status,
          newStatus: detentionTrip.status,
          changedBy: currentUserName,
          userRole: currentRole,
          changedAt: new Date().toISOString(),
          remarks: `Detention record saved for ${detention.locationType} (${detention.chargeableDays} days, ₹${detention.detentionAmount.toLocaleString()}).`,
        },
      ],
    };
    handleSaveTrip(updated, false);
  };

  const handleUpdateStatus = (
    newStatus: TripStatus,
    remarks: string,
    extraData?: {
      actualKm?: number;
      podUrl?: string;
      podReceivedBy?: string;
      podRemarks?: string;
    }
  ) => {
    if (!workflowTrip) return;

    const updated: TripRecord = {
      ...workflowTrip,
      status: newStatus,
      actualKm: extraData?.actualKm ?? workflowTrip.actualKm,
      podDocumentUrl: extraData?.podUrl ?? workflowTrip.podDocumentUrl,
      podReceivedBy: extraData?.podReceivedBy ?? workflowTrip.podReceivedBy,
      podRemarks: extraData?.podRemarks ?? workflowTrip.podRemarks,
      podReceivedAt: extraData?.podUrl ? new Date().toISOString() : workflowTrip.podReceivedAt,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(workflowTrip.statusHistory || []),
        {
          id: `HIST-${Date.now()}`,
          tripId: workflowTrip.id,
          oldStatus: workflowTrip.status,
          newStatus,
          changedBy: currentUserName,
          userRole: currentRole,
          changedAt: new Date().toISOString(),
          remarks: remarks || `Transitioned status to ${newStatus}`,
        },
      ],
    };

    // If trip completed/delivered/cancelled, update vehicle status back to Available
    if (newStatus === 'Delivered' || newStatus === 'Closed' || newStatus === 'Cancelled') {
      if (workflowTrip.vehicleId) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === workflowTrip.vehicleId ? { ...v, status: 'Available' } : v))
        );
      }
    }

    handleSaveTrip(updated, false);
  };

  const handleConfirmCancelTrip = (reason: string) => {
    if (!cancelTrip) return;

    const updated: TripRecord = {
      ...cancelTrip,
      status: 'Cancelled',
      cancellationReason: reason,
      cancelledBy: `${currentUserName} (${currentRole})`,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(cancelTrip.statusHistory || []),
        {
          id: `HIST-${Date.now()}`,
          tripId: cancelTrip.id,
          oldStatus: cancelTrip.status,
          newStatus: 'Cancelled',
          changedBy: currentUserName,
          userRole: currentRole,
          changedAt: new Date().toISOString(),
          remarks: `Booking cancelled: ${reason}`,
        },
      ],
    };

    // Release vehicle
    if (cancelTrip.vehicleId) {
      setVehicles((prev) =>
        prev.map((v) => (v.id === cancelTrip.vehicleId ? { ...v, status: 'Available' } : v))
      );
    }

    handleSaveTrip(updated, false);
  };

  const handleSaveRateCard = (customerId: string, rateCard: CustomerRateCard) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((cust) => {
        if (cust.id === customerId) {
          const existing = cust.rateCards || [];
          const exists = existing.some((rc) => rc.id === rateCard.id);
          const updatedCards = exists
            ? existing.map((rc) => (rc.id === rateCard.id ? rateCard : rc))
            : [rateCard, ...existing];
          return {
            ...cust,
            rateCards: updatedCards,
          };
        }
        return cust;
      })
    );
  };

  const handleSyncGpsTimestampsToDetention = (
    trip: TripRecord,
    originArrival: string,
    originDeparture: string
  ) => {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id === trip.id) {
          return {
            ...t,
            loadingDatetime: originArrival,
            detentionRecords: [
              ...(t.detentionRecords || []),
              {
                id: `DET-GPS-${Date.now()}`,
                tripId: t.id,
                locationType: 'Origin',
                locationName: `${t.origin} (GPS Geofence Log)`,
                arrivalDatetime: originArrival,
                departureDatetime: originDeparture,
                freeHours: t.detentionFreeHours || 5,
                chargeableHours: 0,
                chargeableDays: 0,
                detentionRatePerDay: t.detentionRatePerDay || 3500,
                detentionAmount: 0,
                remarks: 'Auto-synchronized from GPS Telematics Geofence beacon',
                isWaived: false,
              },
            ],
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={currentUserName}
        onNewBookingClick={handleNewBooking}
        activeTripCount={trips.length}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          statusFilter={statusFilter}
          onSelectStatusFilter={(st) => {
            setStatusFilter(st);
            setCurrentView('trip-list');
          }}
          tripCountsByStatus={tripCountsByStatus}
          onNewBookingClick={handleNewBooking}
        />

        {/* Main Central Workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-900/60 pb-16">
          {currentView === 'booking-form' && (
            <TripBookingForm
              initialTrip={activeEditingTrip}
              customers={customers}
              routes={routes}
              vehicles={vehicles}
              drivers={drivers}
              allTrips={trips}
              currentUserRole={currentRole}
              currentUserName={currentUserName}
              onSaveTrip={handleSaveTrip}
              onOpenPrintSheet={(t) => setPrintSheetTrip(t)}
              onOpenLR={(t) => setLrTrip(t)}
              onOpenSendCustomer={(t) => setSendCustomerTrip(t)}
              onOpenCancel={(t) => setCancelTrip(t)}
              onOpenDetention={(t) => setDetentionTrip(t)}
              onOpenWorkflow={(t) => setWorkflowTrip(t)}
              onOpenRateCardManager={(custId) => setRateCardManagerCustomerId(custId || customers[0]?.id || '')}
              onClose={() => setCurrentView('trip-list')}
            />
          )}

          {currentView === 'trip-list' && (
            <TripList
              trips={trips}
              customers={customers}
              vehicles={vehicles}
              currentUserRole={currentRole}
              currentFilterStatus={statusFilter}
              onFilterStatusChange={setStatusFilter}
              onSelectTrip={handleSelectTripForEdit}
              onNewTrip={handleNewBooking}
              onOpenPrintSheet={(t) => setPrintSheetTrip(t)}
              onOpenLR={(t) => setLrTrip(t)}
              onOpenSendCustomer={(t) => setSendCustomerTrip(t)}
              onOpenCancel={(t) => setCancelTrip(t)}
              onOpenDetention={(t) => setDetentionTrip(t)}
              onOpenWorkflow={(t) => setWorkflowTrip(t)}
              onOpenAuditLog={(t) => setAuditLogTrip(t)}
              onOpenGpsTracking={(t) => setGpsTrackingTrip(t)}
            />
          )}

          {currentView === 'operations-live' && (
            <OperationsDashboard
              trips={trips}
              vehicles={vehicles}
              drivers={drivers}
              customers={customers}
              currentUserRole={currentRole}
              onSelectTrip={handleSelectTripForEdit}
              onOpenWorkflow={(t) => setWorkflowTrip(t)}
              onOpenDetention={(t) => setDetentionTrip(t)}
              onOpenPrintSheet={(t) => setPrintSheetTrip(t)}
              onOpenGpsTracking={(t) => setGpsTrackingTrip(t)}
            />
          )}

          {currentView === 'detention-center' && (
            <div className="p-6">
              <div className="mb-4">
                <h1 className="text-xl font-bold text-white">Detention Management Console</h1>
                <p className="text-xs text-slate-400">
                  Select any active trip to record gate timestamps, compute 5h free-time detention, and apply authorized overrides.
                </p>
              </div>
              <TripList
                trips={trips}
                customers={customers}
                vehicles={vehicles}
                currentUserRole={currentRole}
                currentFilterStatus="ALL"
                onFilterStatusChange={() => {}}
                onSelectTrip={(t) => setDetentionTrip(t)}
                onNewTrip={handleNewBooking}
                onOpenPrintSheet={(t) => setPrintSheetTrip(t)}
                onOpenLR={(t) => setLrTrip(t)}
                onOpenSendCustomer={(t) => setSendCustomerTrip(t)}
                onOpenCancel={(t) => setCancelTrip(t)}
                onOpenDetention={(t) => setDetentionTrip(t)}
                onOpenWorkflow={(t) => setWorkflowTrip(t)}
                onOpenAuditLog={(t) => setAuditLogTrip(t)}
                onOpenGpsTracking={(t) => setGpsTrackingTrip(t)}
              />
            </div>
          )}

          {currentView === 'pod-desk' && (
            <div className="p-6">
              <div className="mb-4">
                <h1 className="text-xl font-bold text-white">Proof of Delivery (POD) Receiving Desk</h1>
                <p className="text-xs text-slate-400">
                  Audit delivered cargo packages, review signed acknowledgements, and approve billable status.
                </p>
              </div>
              <TripList
                trips={trips.filter((t) => t.status === 'Delivered' || t.status === 'POD Received' || t.status === 'Closed')}
                customers={customers}
                vehicles={vehicles}
                currentUserRole={currentRole}
                currentFilterStatus="ALL"
                onFilterStatusChange={() => {}}
                onSelectTrip={(t) => setWorkflowTrip(t)}
                onNewTrip={handleNewBooking}
                onOpenPrintSheet={(t) => setPrintSheetTrip(t)}
                onOpenLR={(t) => setLrTrip(t)}
                onOpenSendCustomer={(t) => setSendCustomerTrip(t)}
                onOpenCancel={(t) => setCancelTrip(t)}
                onOpenDetention={(t) => setDetentionTrip(t)}
                onOpenWorkflow={(t) => setWorkflowTrip(t)}
                onOpenAuditLog={(t) => setAuditLogTrip(t)}
                onOpenGpsTracking={(t) => setGpsTrackingTrip(t)}
              />
            </div>
          )}

          {currentView === 'billing-center' && (
            <BillingView
              trips={trips}
              customers={customers}
              onSelectTrip={handleSelectTripForEdit}
              onOpenPrintSheet={(t) => setPrintSheetTrip(t)}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView trips={trips} vehicles={vehicles} customers={customers} />
          )}

          {currentView === 'master-data' && (
            <MasterDataView
              customers={customers}
              routes={routes}
              vehicles={vehicles}
              drivers={drivers}
              onOpenRateCardManager={(custId) => setRateCardManagerCustomerId(custId || customers[0]?.id || '')}
            />
          )}
        </main>
      </div>

      {/* OVERLAY MODALS */}

      {/* 1. Official Customer Placement Sheet PDF (Section 15, 16, 17) */}
      {printSheetTrip && (
        <CustomerPrintSheet
          trip={printSheetTrip}
          customer={customers.find((c) => c.id === printSheetTrip.customerId)}
          vehicle={vehicles.find((v) => v.id === printSheetTrip.vehicleId)}
          driver={drivers.find((d) => d.id === printSheetTrip.driverId)}
          onClose={() => setPrintSheetTrip(null)}
        />
      )}

      {/* 2. Lorry Receipt (LR) Generator Modal */}
      {lrTrip && (
        <LRModal
          trip={lrTrip}
          customer={customers.find((c) => c.id === lrTrip.customerId)}
          vehicle={vehicles.find((v) => v.id === lrTrip.vehicleId)}
          driver={drivers.find((d) => d.id === lrTrip.driverId)}
          onSaveLR={handleSaveLR}
          onClose={() => setLrTrip(null)}
        />
      )}

      {/* 3. Detention Management Modal (Section 10) */}
      {detentionTrip && (
        <DetentionModal
          trip={detentionTrip}
          currentUserRole={currentRole}
          currentUserName={currentUserName}
          onSaveDetention={handleSaveDetention}
          onClose={() => setDetentionTrip(null)}
        />
      )}

      {/* 4. Workflow Lifecycle Execution Modal (Section 13) */}
      {workflowTrip && (
        <WorkflowExecutionModal
          trip={workflowTrip}
          currentUserRole={currentRole}
          currentUserName={currentUserName}
          onUpdateStatus={handleUpdateStatus}
          onClose={() => setWorkflowTrip(null)}
        />
      )}

      {/* 5. Cancel Trip Modal (Section 12 & 18) */}
      {cancelTrip && (
        <CancelTripModal
          trip={cancelTrip}
          currentUserRole={currentRole}
          currentUserName={currentUserName}
          onConfirmCancel={handleConfirmCancelTrip}
          onClose={() => setCancelTrip(null)}
        />
      )}

      {/* 6. Send Customer Modal (Section 12) */}
      {sendCustomerTrip && (
        <SendCustomerModal
          trip={sendCustomerTrip}
          customer={customers.find((c) => c.id === sendCustomerTrip.customerId)}
          onClose={() => setSendCustomerTrip(null)}
        />
      )}

      {/* 7. Audit Log Drawer (Section 13 & 19) */}
      {auditLogTrip && (
        <AuditLogDrawer trip={auditLogTrip} onClose={() => setAuditLogTrip(null)} />
      )}

      {/* 8. Live Vehicle GPS Tracking & Geofence Map Modal */}
      {gpsTrackingTrip && (
        <GpsTrackingModal
          trip={gpsTrackingTrip}
          currentUserRole={currentRole}
          currentUserName={currentUserName}
          onSyncGpsTimestampsToDetention={handleSyncGpsTimestampsToDetention}
          onClose={() => setGpsTrackingTrip(null)}
        />
      )}

      {/* 9. Customer-Specific Rate Card Manager Modal */}
      {rateCardManagerCustomerId !== null && (
        <RateCardManagerModal
          customers={customers}
          routes={routes}
          selectedCustomerId={rateCardManagerCustomerId}
          onSaveRateCard={handleSaveRateCard}
          onClose={() => setRateCardManagerCustomerId(null)}
        />
      )}
    </div>
  );
}
