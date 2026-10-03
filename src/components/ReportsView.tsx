import React, { useState } from 'react';
import { TripRecord, VehicleMaster, CustomerMaster } from '../types';
import { BarChart3, Clock, TrendingUp, Truck, FileSpreadsheet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { calculateConsignmentTotals } from '../utils/calculations';

interface ReportsViewProps {
  trips: TripRecord[];
  vehicles: VehicleMaster[];
  customers: CustomerMaster[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ trips, vehicles, customers }) => {
  const [activeReportTab, setActiveReportTab] = useState<'utilization' | 'detention' | 'km-diff' | 'freight'>('utilization');

  // Customer Map
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v.vehicleNo]));

  // Metrics
  const totalTripsCount = trips.length;
  const completedTrips = trips.filter((t) => t.status === 'Delivered' || t.status === 'POD Received' || t.status === 'Closed');
  const cancelledTrips = trips.filter((t) => t.status === 'Cancelled');

  const totalPayloadWeight = trips.reduce((acc, t) => {
    const totals = calculateConsignmentTotals(t.invoices);
    return acc + totals.totalWeightKg;
  }, 0);

  const totalDetentionGenerated = trips.reduce((acc, t) => {
    const det = t.detentionRecords?.reduce((dAcc, r) => dAcc + r.detentionAmount, 0) || 0;
    return acc + det;
  }, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 font-sans">
      {/* Header */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>BOW WTMS • ANALYTICS &amp; MANAGEMENT REPORTS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Operational &amp; Commercial Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Audit fleet utilization, detention leakages, corridor KM variance, and lane profitability.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setActiveReportTab('utilization')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeReportTab === 'utilization'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vehicle Utilization
          </button>
          <button
            onClick={() => setActiveReportTab('detention')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeReportTab === 'detention'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Detention Analysis
          </button>
          <button
            onClick={() => setActiveReportTab('km-diff')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeReportTab === 'km-diff'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            KM Difference
          </button>
          <button
            onClick={() => setActiveReportTab('freight')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeReportTab === 'freight'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Freight Breakdown
          </button>
        </div>
      </div>

      {/* Top Stat KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Active Fleet Size</span>
          <div className="font-mono text-xl font-bold text-white mt-1">
            {vehicles.filter((v) => v.status === 'Available' || v.status === 'On Trip').length} / {vehicles.length}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">92% Operational Readiness</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Total Tonnage Dispatched</span>
          <div className="font-mono text-xl font-bold text-amber-400 mt-1">
            {(totalPayloadWeight / 1000).toFixed(1)} MT
          </div>
          <span className="text-[10px] text-slate-400">{totalPayloadWeight.toLocaleString()} KG manifested</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Detention Realization</span>
          <div className="font-mono text-xl font-bold text-rose-400 mt-1">
            ₹{totalDetentionGenerated.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-300/80">Customer bay waiting penalties</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Cancellation Ratio</span>
          <div className="font-mono text-xl font-bold text-slate-200 mt-1">
            {Math.round((cancelledTrips.length / (totalTripsCount || 1)) * 100)}%
          </div>
          <span className="text-[10px] text-slate-500">{cancelledTrips.length} cancelled with audit</span>
        </div>
      </div>

      {/* Tab Specific Tables */}
      {activeReportTab === 'utilization' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Fleet Vehicle Utilization &amp; Compliance Audit
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Vehicle No.</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Rated Capacity</th>
                  <th className="py-2.5 px-3">Owner Category</th>
                  <th className="py-2.5 px-3">Current Location</th>
                  <th className="py-2.5 px-3">GPS Telematics</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-700/40">
                    <td className="py-3 px-3 font-mono font-bold text-white">{v.vehicleNo}</td>
                    <td className="py-3 px-3">{v.vehicleType}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-400">
                      {v.capacityMt} MT ({v.capacityKg.toLocaleString()} KG)
                    </td>
                    <td className="py-3 px-3">{v.ownerType}</td>
                    <td className="py-3 px-3">{v.currentLocation}</td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400 font-mono font-bold">
                        {v.gpsId} ({v.gpsStatus})
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.status === 'Available'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : v.status === 'On Trip'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'detention' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Detention &amp; Dock Turnaround Report (Section 10 Compliance)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Trip ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Dock Location</th>
                  <th className="py-2.5 px-3">Free Window</th>
                  <th className="py-2.5 px-3">Chargeable Hrs / Days</th>
                  <th className="py-2.5 px-3 text-right">Applicable Rate</th>
                  <th className="py-2.5 px-3 text-right">Detention Billed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {trips
                  .filter((t) => t.detentionRecords && t.detentionRecords.length > 0)
                  .map((t) =>
                    t.detentionRecords.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-700/40">
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">{t.id}</td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {customerMap.get(t.customerId) || t.customerId}
                        </td>
                        <td className="py-3 px-3">
                          {d.locationType}: {d.locationName}
                        </td>
                        <td className="py-3 px-3">{d.freeHours} Hours</td>
                        <td className="py-3 px-3 font-mono">
                          {d.chargeableHours} hrs ({d.chargeableDays} Day{d.chargeableDays === 1 ? '' : 's'})
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          ₹{d.detentionRatePerDay.toLocaleString()} / Day
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                          ₹{d.detentionAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'km-diff' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Lane KM Variance &amp; Route Deviation Audit
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Trip ID</th>
                  <th className="py-2.5 px-3">Lane Code</th>
                  <th className="py-2.5 px-3">Origin → Destination</th>
                  <th className="py-2.5 px-3 text-right">Lane Approved KM</th>
                  <th className="py-2.5 px-3 text-right">Actual Odometer KM</th>
                  <th className="py-2.5 px-3 text-right">KM Variance</th>
                  <th className="py-2.5 px-3">Audit Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {trips.map((t) => {
                  const actual = t.actualKm || t.approvedKm;
                  const diff = actual - t.approvedKm;

                  return (
                    <tr key={t.id} className="hover:bg-slate-700/40">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{t.id}</td>
                      <td className="py-3 px-3 font-mono">{t.laneCode || 'ZON_624'}</td>
                      <td className="py-3 px-3">
                        {t.origin} → {t.destination}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">{t.approvedKm} KM</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">{actual} KM</td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          diff > 0 ? 'text-amber-400' : diff < 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff} KM
                      </td>
                      <td className="py-3 px-3">
                        {diff !== 0 ? (
                          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            Requires Reconciliation
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[10px] font-medium">Exact Match</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'freight' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Customer-wise Freight &amp; Commercial Realization
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-center">Total Bookings</th>
                  <th className="py-2.5 px-3 text-right">Basic Freight</th>
                  <th className="py-2.5 px-3 text-right">Detention Charges</th>
                  <th className="py-2.5 px-3 text-right">Toll Actuals</th>
                  <th className="py-2.5 px-3 text-right">Total Invoiced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {customers.map((c) => {
                  const custTrips = trips.filter((t) => t.customerId === c.id);
                  const basicF = custTrips.reduce((acc, t) => acc + (t.basicFreight || 0), 0);
                  const detTotal = custTrips.reduce(
                    (acc, t) => acc + (t.detentionRecords?.reduce((d, r) => d + r.detentionAmount, 0) || 0),
                    0
                  );
                  const tollF = custTrips.reduce((acc, t) => acc + (t.tollCharges || 0), 0);
                  const grandTotal = custTrips.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

                  return (
                    <tr key={c.id} className="hover:bg-slate-700/40">
                      <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                      <td className="py-3 px-3 text-center font-mono">{custTrips.length}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{basicF.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400">₹{detTotal.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{tollF.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        ₹{grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
