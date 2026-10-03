import React, { useState } from 'react';
import { TripRecord, CustomerMaster } from '../types';
import { Receipt, CheckCircle, FileText, Download, DollarSign, Filter, Printer } from 'lucide-react';

interface BillingViewProps {
  trips: TripRecord[];
  customers: CustomerMaster[];
  onSelectTrip: (trip: TripRecord) => void;
  onOpenPrintSheet: (trip: TripRecord) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  trips,
  customers,
  onSelectTrip,
  onOpenPrintSheet,
}) => {
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');

  const eligibleTrips = trips.filter(
    (t) =>
      t.status === 'POD Received' ||
      t.status === 'Delivered' ||
      t.status === 'Billable' ||
      t.status === 'Closed'
  );

  const filteredTrips = eligibleTrips.filter((t) => {
    if (selectedCustomerId !== 'ALL' && t.customerId !== selectedCustomerId) return false;
    return true;
  });

  const totalBillableFreight = filteredTrips.reduce((acc, t) => acc + (t.basicFreight || 0), 0);
  const totalDetentionAmount = filteredTrips.reduce((acc, t) => {
    const det = t.detentionRecords?.reduce((dAcc, r) => dAcc + (r.detentionAmount || 0), 0) || 0;
    return acc + det;
  }, 0);
  const totalTollAmount = filteredTrips.reduce((acc, t) => acc + (t.tollCharges || 0), 0);
  const grandTotalPayable = filteredTrips.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 font-sans">
      {/* Header */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>BOW WTMS • COMMERCIAL BILLING DESK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Billable Trips &amp; Commercial Reconciliation
          </h1>
          <p className="text-xs text-slate-400">
            Audit delivered trips with verified PODs, reconciled actual KM, and calculated detention charges.
          </p>
        </div>

        <div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
          >
            <option value="ALL">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Basic Freight Total</span>
          <div className="font-mono text-xl font-bold text-white mt-1">
            ₹{totalBillableFreight.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{filteredTrips.length} audited trips</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Detention Accrued</span>
          <div className="font-mono text-xl font-bold text-amber-400 mt-1">
            ₹{totalDetentionAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Gate delays billable</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Toll &amp; Ancillary Total</span>
          <div className="font-mono text-xl font-bold text-slate-300 mt-1">
            ₹{totalTollAmount.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Toll actuals pass-through</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
          <span className="text-slate-400 text-xs block">Grand Invoiced Amount</span>
          <div className="font-mono text-xl font-black text-emerald-400 mt-1">
            ₹{grandTotalPayable.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium">Including statutory GST</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
        <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            Billable Trips Register (POD Audited)
          </h3>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
            {filteredTrips.length} Trips
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Trip ID</th>
                <th className="py-3 px-3">Customer &amp; Ref</th>
                <th className="py-3 px-3">Route / KM Check</th>
                <th className="py-3 px-3">POD Status</th>
                <th className="py-3 px-3 text-right">Basic Freight</th>
                <th className="py-3 px-3 text-right">Detention</th>
                <th className="py-3 px-3 text-right">Toll / Other</th>
                <th className="py-3 px-3 text-right">Total Payable</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    No billable or delivered trips found for this customer.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const detTotal = trip.detentionRecords?.reduce((acc, r) => acc + (r.detentionAmount || 0), 0) || 0;
                  const kmDiff = trip.actualKm ? trip.actualKm - trip.approvedKm : 0;

                  return (
                    <tr key={trip.id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {trip.id}
                        <div className="text-[10px] text-slate-400 font-sans">{trip.status}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{customerMap.get(trip.customerId) || trip.customerId}</div>
                        <div className="text-[11px] text-slate-400">Ref: {trip.customerReference || '—'}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Approved: {trip.approvedKm} KM
                          {kmDiff !== 0 && (
                            <span className="ml-1 text-amber-400 font-bold">
                              (Actual: {trip.actualKm} KM, diff: {kmDiff > 0 ? `+${kmDiff}` : kmDiff})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {trip.podReceivedAt ? (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-max">
                            <CheckCircle className="w-3 h-3" />
                            Verified POD
                          </span>
                        ) : (
                          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                            Pending Physical POD
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        ₹{Number(trip.basicFreight || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-amber-400">
                        ₹{detTotal.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        ₹{Number((trip.tollCharges || 0) + (trip.loadingCharges || 0) + (trip.unloadingCharges || 0) + (trip.otherCharges || 0)).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        ₹{Number(trip.totalAmount || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenPrintSheet(trip)}
                          className="bg-slate-700 hover:bg-slate-600 text-amber-300 font-medium px-2 py-1 rounded text-[11px]"
                          title="Print customer placement & commercial statement"
                        >
                          Invoice Sheet
                        </button>
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
