import React, { useState } from 'react';
import { CustomerMaster, RouteMaster, VehicleMaster, DriverMaster } from '../types';
import { Database, Building, MapPin, Truck, User, Plus, Search, ShieldCheck } from 'lucide-react';

interface MasterDataViewProps {
  customers: CustomerMaster[];
  routes: RouteMaster[];
  vehicles: VehicleMaster[];
  drivers: DriverMaster[];
  onOpenRateCardManager?: (customerId?: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  customers,
  routes,
  vehicles,
  drivers,
  onOpenRateCardManager,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'rate-cards' | 'routes' | 'vehicles' | 'drivers'>('customers');
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 font-sans">
      {/* Header */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-purple-400 font-bold uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>BOW WTMS • MASTER DATA REPOSITORY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Enterprise Masters &amp; Rate Contracts
          </h1>
          <p className="text-xs text-slate-400">
            Contracted customers, approved lane codes, compliant fleet vehicles, and verified driver roster.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'customers' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Customers ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rate-cards')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'rate-cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rate Cards</span>
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'routes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Routes &amp; Lanes ({routes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'vehicles' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Fleet Vehicles ({vehicles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'drivers' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Drivers ({drivers.length})</span>
          </button>
        </div>
      </div>

      {/* Content by active tab */}
      {activeTab === 'customers' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Active Contract Customers
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">Billing City</th>
                  <th className="py-2.5 px-3">Payment Terms</th>
                  <th className="py-2.5 px-3 text-right">Default Detention</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/40">
                    <td className="py-3 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-3 px-3 font-mono text-amber-400">{c.code}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{c.gstin}</td>
                    <td className="py-3 px-3">
                      {c.city}, {c.state}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">{c.paymentTerms}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-300 font-semibold">
                      ₹{c.defaultDetentionRate.toLocaleString()} / Day ({c.defaultFreeHours}h free)
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rate-cards' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs uppercase text-amber-400">
                Customer-Specific Rate Cards &amp; Agreed Contracts
              </span>
              <p className="text-[11px] text-slate-400">
                Configured rate schedules auto-populate into new bookings for matching customers and lanes.
              </p>
            </div>
            {onOpenRateCardManager && (
              <button
                onClick={() => onOpenRateCardManager()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Manage Rate Cards</span>
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Contract Schedule Title</th>
                  <th className="py-2.5 px-3">Freight Mode</th>
                  <th className="py-2.5 px-3 text-right">Base Rate</th>
                  <th className="py-2.5 px-3 text-center">Free Time</th>
                  <th className="py-2.5 px-3 text-right">Detention / Day</th>
                  <th className="py-2.5 px-3">Toll Terms</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {customers.flatMap((c) =>
                  (c.rateCards || []).map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-700/40">
                      <td className="py-3 px-3 font-bold text-white">
                        {c.name}
                        <span className="block text-[10px] text-slate-400 font-mono">{c.code}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{rc.contractName}</td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-mono text-amber-300">
                          {rc.freightCalculationMode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {rc.freightCalculationMode === 'Per KM'
                          ? `₹${rc.defaultRatePerKm}/KM`
                          : rc.freightCalculationMode === 'Fixed Freight'
                          ? `₹${Number(rc.defaultFixedFreight).toLocaleString()}`
                          : `₹${rc.defaultRatePerKm}`}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-200">
                        {rc.detentionFreeHours} Hours
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-400 font-bold">
                        ₹{rc.detentionRatePerDay.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300">{rc.tollScope}</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          {rc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {onOpenRateCardManager && (
                          <button
                            onClick={() => onOpenRateCardManager(c.id)}
                            className="bg-slate-700 hover:bg-slate-600 text-amber-300 px-2.5 py-1 rounded text-[11px] font-semibold"
                          >
                            Configure
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Standard Lanes &amp; Approved Route Distances
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Route Name</th>
                  <th className="py-2.5 px-3">Lane Code</th>
                  <th className="py-2.5 px-3">Origin Hub</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3 text-right">Approved KM</th>
                  <th className="py-2.5 px-3">Toll Status</th>
                  <th className="py-2.5 px-3">Transit Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {routes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-700/40">
                    <td className="py-3 px-3 font-bold text-white">{r.routeName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{r.laneCode}</td>
                    <td className="py-3 px-3">{r.origin}</td>
                    <td className="py-3 px-3">{r.destination}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">{r.approvedKm} KM</td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {r.tollApplicable ? `Applicable (₹${r.standardTollCost})` : 'Exempt'}
                    </td>
                    <td className="py-3 px-3">{r.estimatedTransitHours} Hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Fleet Vehicles Master
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Vehicle No.</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Rated Capacity</th>
                  <th className="py-2.5 px-3">GPS Telematics</th>
                  <th className="py-2.5 px-3">Fitness Expiry</th>
                  <th className="py-2.5 px-3">Insurance Expiry</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-700/40">
                    <td className="py-3 px-3 font-mono font-black text-white">{v.vehicleNo}</td>
                    <td className="py-3 px-3">{v.vehicleType}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-400">
                      {v.capacityMt} MT ({v.capacityKg.toLocaleString()} KG)
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400">
                      {v.gpsId} ({v.gpsStatus})
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{v.fitnessExpiry}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{v.insuranceExpiry}</td>
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

      {activeTab === 'drivers' && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 font-bold text-xs uppercase text-amber-400">
            Commercial Drivers Roster
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3">Mobile Contact</th>
                  <th className="py-2.5 px-3">Commercial License No.</th>
                  <th className="py-2.5 px-3">DL Expiry</th>
                  <th className="py-2.5 px-3">Employment Type</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-700/40">
                    <td className="py-3 px-3 font-bold text-white">{d.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">+91 {d.mobile}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200">{d.licenseNo}</td>
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={
                          d.licenseExpiry < new Date().toISOString().split('T')[0]
                            ? 'text-rose-400 font-bold'
                            : 'text-emerald-400'
                        }
                      >
                        {d.licenseExpiry}
                      </span>
                    </td>
                    <td className="py-3 px-3">{d.type}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.status === 'Available'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : d.status === 'On Trip'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
