import React, { useState } from 'react';
import { CustomerMaster, CustomerRateCard, FreightCalculationMode, RouteMaster } from '../types';
import { X, CreditCard, Plus, Check, Trash2, Calendar, ShieldCheck, DollarSign } from 'lucide-react';

interface RateCardManagerModalProps {
  customers: CustomerMaster[];
  routes: RouteMaster[];
  selectedCustomerId?: string;
  onSaveRateCard: (customerId: string, rateCard: CustomerRateCard) => void;
  onClose: () => void;
}

export const RateCardManagerModal: React.FC<RateCardManagerModalProps> = ({
  customers,
  routes,
  selectedCustomerId,
  onSaveRateCard,
  onClose,
}) => {
  const [activeCustomerId, setActiveCustomerId] = useState<string>(
    selectedCustomerId || customers[0]?.id || ''
  );

  const activeCustomer = customers.find((c) => c.id === activeCustomerId);

  // Form state for creating or editing rate card
  const [isEditing, setIsEditing] = useState(false);
  const [contractName, setContractName] = useState('');
  const [freightMode, setFreightMode] = useState<FreightCalculationMode>('Per KM');
  const [ratePerKm, setRatePerKm] = useState(29.3);
  const [fixedFreight, setFixedFreight] = useState(0);
  const [freeHours, setFreeHours] = useState(5);
  const [detentionRate, setDetentionRate] = useState(3500);
  const [loadingCharges, setLoadingCharges] = useState(1000);
  const [unloadingCharges, setUnloadingCharges] = useState(1000);
  const [tollScope, setTollScope] = useState<'Customer' | 'Transporter' | 'At Actuals'>('At Actuals');
  const [minKm, setMinKm] = useState(150);
  const [effectiveFrom, setEffectiveFrom] = useState('2026-04-01');
  const [effectiveTo, setEffectiveTo] = useState('2027-03-31');

  const handleStartNewCard = () => {
    setIsEditing(true);
    setContractName(`${activeCustomer?.name || 'Customer'} Contract Schedule 2026-27`);
    setFreightMode('Per KM');
    setRatePerKm(29.3);
    setFixedFreight(0);
    setFreeHours(activeCustomer?.defaultFreeHours || 5);
    setDetentionRate(activeCustomer?.defaultDetentionRate || 3500);
    setLoadingCharges(1000);
    setUnloadingCharges(1000);
    setTollScope('At Actuals');
    setMinKm(150);
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEffectiveTo(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractName.trim()) {
      alert('Contract name is required.');
      return;
    }

    const newCard: CustomerRateCard = {
      id: `RC-${Date.now()}`,
      customerId: activeCustomerId,
      contractName: contractName.trim(),
      freightCalculationMode: freightMode,
      defaultRatePerKm: ratePerKm,
      defaultFixedFreight: fixedFreight,
      detentionFreeHours: freeHours,
      detentionRatePerDay: detentionRate,
      loadingCharges,
      unloadingCharges,
      tollScope,
      minimumGuaranteedKm: minKm,
      effectiveFrom,
      effectiveTo,
      status: 'Active',
    };

    onSaveRateCard(activeCustomerId, newCard);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex justify-center p-3 sm:p-5 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Customer-Specific Rate Card Master</h2>
              <p className="text-xs text-slate-400">
                Configure default contract freight rates, detention slabs, toll policies, and lane schedules.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Selector Strip */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Select Customer:</span>
            <select
              value={activeCustomerId}
              onChange={(e) => {
                setActiveCustomerId(e.target.value);
                setIsEditing(false);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {!isEditing && (
            <button
              onClick={handleStartNewCard}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Rate Card</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {isEditing ? (
            <form onSubmit={handleSaveCard} className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-4">
                <h3 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  Create / Edit Contract Rate Card
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2">
                    <label className="text-slate-300 font-semibold block mb-1">Contract / Agreement Title *</label>
                    <input
                      type="text"
                      value={contractName}
                      onChange={(e) => setContractName(e.target.value)}
                      placeholder="e.g. Master Logistics Contract 26-27"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Freight Calculation Mode</label>
                    <select
                      value={freightMode}
                      onChange={(e) => setFreightMode(e.target.value as FreightCalculationMode)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                    >
                      <option value="Per KM">Per KM</option>
                      <option value="Fixed Freight">Fixed Freight</option>
                      <option value="Per Trip">Per Trip</option>
                      <option value="Per MT">Per MT</option>
                      <option value="Per Package">Per Package</option>
                      <option value="Contract Rate">Contract Rate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Default Rate / KM (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={ratePerKm}
                      onChange={(e) => setRatePerKm(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Fixed Freight / Trip (₹)</label>
                    <input
                      type="number"
                      value={fixedFreight}
                      onChange={(e) => setFixedFreight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Detention Free Hours</label>
                    <input
                      type="number"
                      value={freeHours}
                      onChange={(e) => setFreeHours(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Detention Rate (₹ / Day)</label>
                    <input
                      type="number"
                      value={detentionRate}
                      onChange={(e) => setDetentionRate(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Loading Charges (₹)</label>
                    <input
                      type="number"
                      value={loadingCharges}
                      onChange={(e) => setLoadingCharges(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Unloading Charges (₹)</label>
                    <input
                      type="number"
                      value={unloadingCharges}
                      onChange={(e) => setUnloadingCharges(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Toll Responsibility</label>
                    <select
                      value={tollScope}
                      onChange={(e) => setTollScope(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="At Actuals">At Actuals (Billed on Proof)</option>
                      <option value="Customer">Customer Scope (FASTag Provided)</option>
                      <option value="Transporter">Transporter Scope (Inclusive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Min. Guaranteed KM</label>
                    <input
                      type="number"
                      value={minKm}
                      onChange={(e) => setMinKm(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Effective From Date</label>
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Effective To Date</label>
                    <input
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Contract Rate Card</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Active Rate Cards for {activeCustomer?.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeCustomer?.rateCards?.length || 0} Configured
                </span>
              </div>

              {!activeCustomer?.rateCards || activeCustomer.rateCards.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-xl text-center text-slate-400 italic">
                  No rate cards configured yet for this customer. Click &quot;+ Add Rate Card&quot; to define agreed freight rates.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCustomer.rateCards.map((rc) => (
                    <div
                      key={rc.id}
                      className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-3 hover:border-amber-500/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
                        <div>
                          <span className="font-bold text-white text-sm">{rc.contractName}</span>
                          <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                            {rc.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Validity: {rc.effectiveFrom} to {rc.effectiveTo}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Calculation Mode</span>
                          <span className="font-bold text-amber-400">{rc.freightCalculationMode}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Base Rate / KM</span>
                          <span className="font-mono font-bold text-white">₹{rc.defaultRatePerKm}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Detention Free Time</span>
                          <span className="font-bold text-slate-200">{rc.detentionFreeHours} Hours</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Detention Rate</span>
                          <span className="font-mono font-bold text-amber-400">
                            ₹{rc.detentionRatePerDay.toLocaleString()} / Day
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Loading / Unloading</span>
                          <span className="font-mono text-slate-300">
                            ₹{rc.loadingCharges} / ₹{rc.unloadingCharges}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Toll Terms</span>
                          <span className="text-slate-300 font-semibold">{rc.tollScope}</span>
                        </div>
                      </div>

                      {rc.laneRates && rc.laneRates.length > 0 && (
                        <div className="pt-2 border-t border-slate-700/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Lane-Specific Contract Rates:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {rc.laneRates.map((lr, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-mono text-amber-300"
                              >
                                {lr.laneCode}: ₹{lr.ratePerKm}/KM
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-850 px-6 py-3 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close Rate Card Manager
          </button>
        </div>
      </div>
    </div>
  );
};
