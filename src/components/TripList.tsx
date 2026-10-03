import React, { useState } from 'react';
import { TripRecord, TripStatus, CustomerMaster, VehicleMaster, UserRole } from '../types';
import {
  Search,
  Filter,
  Printer,
  FileText,
  Clock,
  Send,
  Ban,
  RotateCcw,
  History,
  Download,
  Plus,
  ExternalLink,
  ChevronRight,
  Truck,
  CheckCircle,
  AlertCircle,
  Navigation
} from 'lucide-react';
import { calculateConsignmentTotals } from '../utils/calculations';

interface TripListProps {
  trips: TripRecord[];
  customers: CustomerMaster[];
  vehicles: VehicleMaster[];
  currentUserRole: UserRole;
  currentFilterStatus: TripStatus | 'ALL';
  onFilterStatusChange: (status: TripStatus | 'ALL') => void;
  onSelectTrip: (trip: TripRecord) => void;
  onNewTrip: () => void;
  onOpenPrintSheet: (trip: TripRecord) => void;
  onOpenLR: (trip: TripRecord) => void;
  onOpenSendCustomer: (trip: TripRecord) => void;
  onOpenCancel: (trip: TripRecord) => void;
  onOpenDetention: (trip: TripRecord) => void;
  onOpenWorkflow: (trip: TripRecord) => void;
  onOpenAuditLog: (trip: TripRecord) => void;
  onOpenGpsTracking?: (trip: TripRecord) => void;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  customers,
  vehicles,
  currentUserRole,
  currentFilterStatus,
  onFilterStatusChange,
  onSelectTrip,
  onNewTrip,
  onOpenPrintSheet,
  onOpenLR,
  onOpenSendCustomer,
  onOpenCancel,
  onOpenDetention,
  onOpenWorkflow,
  onOpenAuditLog,
  onOpenGpsTracking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'month'>('all');

  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicleNo]));

  // Filtering
  const filteredTrips = trips.filter((t) => {
    // Status filter
    if (currentFilterStatus !== 'ALL' && t.status !== currentFilterStatus) {
      return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const custName = (customerMap.get(t.customerId) || '').toLowerCase();
      const vehNo = (vehicleMap.get(t.vehicleId) || t.vehicleId || '').toLowerCase();
      const matchId = t.id.toLowerCase().includes(q) || (t.tripNumber || '').toLowerCase().includes(q);
      const matchCust = custName.includes(q);
      const matchLane = (t.laneCode || '').toLowerCase().includes(q);
      const matchRoute = (t.origin || '').toLowerCase().includes(q) || (t.destination || '').toLowerCase().includes(q);
      const matchVeh = vehNo.includes(q);
      const matchRef = (t.customerReference || '').toLowerCase().includes(q);
      const matchInv = t.invoices?.some((i) => i.invoiceNo.toLowerCase().includes(q) || i.ewaybillNo.toLowerCase().includes(q));

      if (!matchId && !matchCust && !matchLane && !matchRoute && !matchVeh && !matchRef && !matchInv) {
        return false;
      }
    }

    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Trip ID',
      'Trip Number',
      'Booking Date',
      'Customer',
      'Customer Ref',
      'Origin',
      'Destination',
      'Lane Code',
      'Approved KM',
      'Vehicle No',
      'Status',
      'Basic Freight',
      'Total Amount',
      'Invoices Count',
    ];

    const rows = filteredTrips.map((t) => [
      t.id,
      t.tripNumber,
      t.bookingDatetime,
      customerMap.get(t.customerId) || t.customerId,
      t.customerReference,
      t.origin,
      t.destination,
      t.laneCode,
      t.approvedKm,
      vehicleMap.get(t.vehicleId) || t.vehicleId,
      t.status,
      t.basicFreight,
      t.totalAmount,
      t.invoices.length,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BOW_WTMS_Trip_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
      case 'Booked':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Vehicle Assigned':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Dispatched':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'In Transit':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-bold';
      case 'Arrived':
      case 'Delivered':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'POD Received':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Billable':
      case 'Closed':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Cancelled':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 text-slate-100 font-sans">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>BOW LOGISTICS PVT. LTD.</span>
            <span>•</span>
            <span>WTMS TRIP REGISTER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Transport Trip Bookings &amp; Register
          </h1>
          <p className="text-xs text-slate-400">
            Control, review, audit, print, and track all transport bookings and placement sheets.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-600"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onNewTrip}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Create Trip</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Trips' },
            { id: 'Draft', label: 'Draft' },
            { id: 'Booked', label: 'Booked' },
            { id: 'Vehicle Assigned', label: 'Assigned' },
            { id: 'Dispatched', label: 'Dispatched' },
            { id: 'In Transit', label: 'In Transit' },
            { id: 'Delivered', label: 'Delivered' },
            { id: 'POD Received', label: 'POD' },
            { id: 'Closed', label: 'Closed' },
            { id: 'Cancelled', label: 'Cancelled' },
          ].map((tab) => {
            const isActive = currentFilterStatus === tab.id;
            const count =
              tab.id === 'ALL'
                ? trips.length
                : trips.filter((t) => t.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => onFilterStatusChange(tab.id as TripStatus | 'ALL')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 text-xs ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Trip ID, Customer, Vehicle No., Lane Code, Route, Invoice or E-Way Bill..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Trip ID / Date</th>
                <th className="py-3 px-3">Customer &amp; Ref</th>
                <th className="py-3 px-3">Route / Lane</th>
                <th className="py-3 px-3">Vehicle &amp; Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Invoices / Wt</th>
                <th className="py-3 px-3 text-right">Freight (₹)</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    No trips match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const totals = calculateConsignmentTotals(trip.invoices);
                  const custName = customerMap.get(trip.customerId) || trip.customerId || 'Customer Unselected';
                  const vehNo = vehicleMap.get(trip.vehicleId) || trip.vehicleId || 'Unassigned';

                  return (
                    <tr
                      key={trip.id}
                      className="hover:bg-slate-700/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectTrip(trip)}
                    >
                      {/* Trip ID / Date */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-amber-400 flex items-center gap-1">
                          <span>{trip.id}</span>
                          {trip.priority === 'Critical' && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Critical Priority"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(trip.bookingDatetime).toLocaleDateString([], {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{trip.bookingSource}</div>
                      </td>

                      {/* Customer & Ref */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="font-bold text-white truncate" title={custName}>
                          {custName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Ref: <span className="text-slate-300 font-mono">{trip.customerReference || 'N/A'}</span>
                        </div>
                        <div className="text-[10px] text-amber-400/90">{trip.requirementType}</div>
                      </td>

                      {/* Route & Lane */}
                      <td className="py-3 px-3 max-w-[190px]">
                        <div className="font-semibold text-slate-200 truncate">
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Lane: {trip.laneCode || '—'} • {trip.approvedKm} KM
                        </div>
                      </td>

                      {/* Vehicle & Type */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{vehNo}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{trip.vehicleTypeId}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                            trip.status
                          )}`}
                        >
                          {trip.status}
                        </span>
                      </td>

                      {/* Consignment summary */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-semibold text-white">
                          {trip.invoices.length} Inv ({totals.totalPackages} pkgs)
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono">
                          {totals.totalWeightKg.toLocaleString()} KG
                        </div>
                      </td>

                      {/* Freight */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-100">
                          ₹{Number(trip.totalAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Basic: ₹{Number(trip.basicFreight || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onSelectTrip(trip)}
                            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                            title="Open / Edit Booking Sheet"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenPrintSheet(trip)}
                            className="p-1.5 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded"
                            title="Print Placement Sheet PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenWorkflow(trip)}
                            className="p-1.5 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded"
                            title="Update Status / Lifecycle Execution"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {onOpenGpsTracking && (
                            <button
                              onClick={() => onOpenGpsTracking(trip)}
                              className={`p-1.5 hover:bg-slate-700 rounded transition-colors ${
                                trip.status === 'Dispatched' || trip.status === 'In Transit' || trip.status === 'Arrived'
                                  ? 'text-emerald-400 hover:text-emerald-300'
                                  : 'text-slate-400 hover:text-slate-300'
                              }`}
                              title="Live GPS Telematics & Highway Map"
                            >
                              <Navigation
                                className={`w-3.5 h-3.5 ${
                                  trip.status === 'In Transit' || trip.status === 'Dispatched' ? 'animate-pulse' : ''
                                }`}
                              />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenDetention(trip)}
                            className="p-1.5 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded"
                            title="Detention Management"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenAuditLog(trip)}
                            className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded"
                            title="View Audit Log Timeline"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
