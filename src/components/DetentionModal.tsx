import React, { useState, useEffect } from 'react';
import { TripRecord, TripDetention, UserRole } from '../types';
import { calculateDetention } from '../utils/calculations';
import { hasPermission } from '../utils/permissions';
import { getSimulatedGpsTelemetry } from '../utils/gpsService';
import {
  Clock,
  AlertTriangle,
  ShieldCheck,
  X,
  Plus,
  Calendar,
  Check,
  DollarSign,
  Navigation,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface DetentionModalProps {
  trip: TripRecord;
  currentUserRole: UserRole;
  currentUserName: string;
  onSaveDetention: (detention: TripDetention) => void;
  onClose: () => void;
}

export const DetentionModal: React.FC<DetentionModalProps> = ({
  trip,
  currentUserRole,
  currentUserName,
  onSaveDetention,
  onClose,
}) => {
  const [locationType, setLocationType] = useState<'Origin' | 'Destination' | 'TouchPoint'>('Origin');
  const [locationName, setLocationName] = useState(trip.origin || 'Loading Hub');
  const [arrivalDatetime, setArrivalDatetime] = useState(
    trip.loadingDatetime || new Date().toISOString().slice(0, 16)
  );
  const [loadingStartDatetime, setLoadingStartDatetime] = useState('');
  const [loadingCompleteDatetime, setLoadingCompleteDatetime] = useState('');
  const [unloadingStartDatetime, setUnloadingStartDatetime] = useState('');
  const [unloadingCompleteDatetime, setUnloadingCompleteDatetime] = useState('');
  const [departureDatetime, setDepartureDatetime] = useState('');

  const [freeHours, setFreeHours] = useState(trip.detentionFreeHours || 5);
  const [detentionRatePerDay, setDetentionRatePerDay] = useState(trip.detentionRatePerDay || 3500);

  // GPS Telemetry integration
  const [gpsTelemetry] = useState(() => trip.gpsTelemetry || getSimulatedGpsTelemetry(trip));
  const [gpsSyncedBanner, setGpsSyncedBanner] = useState(false);

  const relevantGpsArrival =
    locationType === 'Origin'
      ? gpsTelemetry.autoCapturedTimestamps.originArrival
      : locationType === 'Destination'
      ? gpsTelemetry.autoCapturedTimestamps.destinationArrival
      : undefined;

  const relevantGpsDeparture =
    locationType === 'Origin'
      ? gpsTelemetry.autoCapturedTimestamps.originDeparture
      : locationType === 'Destination'
      ? gpsTelemetry.autoCapturedTimestamps.destinationDeparture
      : undefined;

  // Inconsistency detection
  const arrivalVarianceMins =
    arrivalDatetime && relevantGpsArrival
      ? Math.round(
          Math.abs(new Date(arrivalDatetime).getTime() - new Date(relevantGpsArrival).getTime()) / 60000
        )
      : 0;

  const hasGpsInconsistency = arrivalVarianceMins > 30;

  const handleAdoptGpsTimestamps = () => {
    if (relevantGpsArrival) {
      setArrivalDatetime(relevantGpsArrival);
    }
    if (relevantGpsDeparture) {
      setDepartureDatetime(relevantGpsDeparture);
    }
    setGpsSyncedBanner(true);
    setTimeout(() => setGpsSyncedBanner(false), 3000);
  };

  // Manual override fields
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [overrideDays, setOverrideDays] = useState(0);
  const [overrideRemarks, setOverrideRemarks] = useState('');
  const [isWaived, setIsWaived] = useState(false);

  // Auto-calculated state
  const targetEndDatetime = departureDatetime || unloadingCompleteDatetime || loadingCompleteDatetime;
  const calcResult = calculateDetention(arrivalDatetime, targetEndDatetime, freeHours, detentionRatePerDay);

  const effectiveDays = isManualOverride ? overrideDays : isWaived ? 0 : calcResult.chargeableDays;
  const effectiveAmount = isWaived ? 0 : effectiveDays * detentionRatePerDay;

  const canApproveDetention = hasPermission(currentUserRole, 'approveDetention');

  const handleSave = () => {
    if (isManualOverride && !overrideRemarks.trim()) {
      alert('Mandatory operations remarks are required when manually overriding calculated detention.');
      return;
    }

    if (hasGpsInconsistency && !isManualOverride && !overrideRemarks.trim()) {
      if (
        !confirm(
          `Warning: Manual arrival time differs from GPS Geofence record by ${arrivalVarianceMins} minutes. Do you wish to proceed without adding a reconciliation note?`
        )
      ) {
        return;
      }
    }

    const detentionRecord: TripDetention = {
      id: `DET-${Date.now()}`,
      tripId: trip.id,
      locationType,
      locationName,
      arrivalDatetime,
      loadingStartDatetime: loadingStartDatetime || undefined,
      loadingCompleteDatetime: loadingCompleteDatetime || undefined,
      unloadingStartDatetime: unloadingStartDatetime || undefined,
      unloadingCompleteDatetime: unloadingCompleteDatetime || undefined,
      departureDatetime: departureDatetime || undefined,
      freeHours,
      chargeableHours: calcResult.chargeableHours,
      chargeableDays: effectiveDays,
      detentionRatePerDay,
      detentionAmount: effectiveAmount,
      approvedBy: canApproveDetention ? currentUserName : undefined,
      remarks:
        overrideRemarks ||
        (hasGpsInconsistency
          ? `GPS discrepancy flagged (${arrivalVarianceMins}m variance vs GPS ${relevantGpsArrival})`
          : isWaived
          ? 'Waived per commercial agreement'
          : 'Auto-computed detention log with GPS verification'),
      isWaived,
    };

    onSaveDetention(detentionRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Detention Management &amp; Calculation Engine</h2>
              <p className="text-xs text-slate-400">
                BOW WTMS Module TBM-001 • Trip: <span className="font-mono text-amber-300 font-bold">{trip.id}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Location details */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Location Milestone</label>
              <select
                value={locationType}
                onChange={(e) => {
                  const val = e.target.value as 'Origin' | 'Destination' | 'TouchPoint';
                  setLocationType(val);
                  setLocationName(val === 'Origin' ? trip.origin : trip.destination);
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium"
              >
                <option value="Origin">Origin (Loading Point)</option>
                <option value="Destination">Destination (Unloading Point)</option>
                <option value="TouchPoint">Intermediate Touch Point</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Facility / Gate Name</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Time Checkpoints Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Operational Time Logs (Gate Entry to Exit)</span>
              </h3>
              {(relevantGpsArrival || relevantGpsDeparture) && (
                <button
                  type="button"
                  onClick={handleAdoptGpsTimestamps}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title="Auto-fill gate-in and gate-out from real-time GPS geofence timestamps"
                >
                  <Navigation className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>{gpsSyncedBanner ? '✓ GPS Applied!' : 'Auto-Capture from GPS Geofence'}</span>
                </button>
              )}
            </div>

            {/* GPS Telematics Status Strip */}
            <div className="bg-slate-900 text-white p-2.5 rounded-lg mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-slate-300 font-mono">
                  GPS Telematics (Unit {gpsTelemetry.vehicleId}):
                </span>
                <span className="text-emerald-300 font-semibold">{gpsTelemetry.geofenceStatus}</span>
              </div>
              <div className="text-slate-400 font-mono text-[10px]">
                {locationType === 'Origin' ? (
                  <>
                    Origin In: <span className="text-amber-300 font-bold">{relevantGpsArrival?.replace('T', ' ') || 'Pending'}</span> •
                    Out: <span className="text-amber-300 font-bold">{relevantGpsDeparture?.replace('T', ' ') || 'Pending'}</span>
                  </>
                ) : (
                  <>
                    Dest In: <span className="text-amber-300 font-bold">{relevantGpsArrival?.replace('T', ' ') || 'In Transit'}</span> •
                    Out: <span className="text-amber-300 font-bold">{relevantGpsDeparture?.replace('T', ' ') || 'In Transit'}</span>
                  </>
                )}
              </div>
            </div>

            {/* GPS vs Manual Inconsistency Warning Banner */}
            {hasGpsInconsistency && (
              <div className="bg-rose-50 border-2 border-rose-400 p-3 rounded-lg mb-3 text-xs space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-rose-800 font-bold">
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>⚠️ GPS Telemetry &amp; Manual Entry Inconsistency Detected</span>
                  </div>
                  <span className="bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-mono text-[10px] font-black">
                    Variance: {arrivalVarianceMins} Minutes
                  </span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Automated GPS Geofence logged gate entry at{' '}
                  <strong className="font-mono text-slate-900">{relevantGpsArrival?.replace('T', ' ')}</strong>,
                  whereas manual input is set to{' '}
                  <strong className="font-mono text-rose-900">{arrivalDatetime.replace('T', ' ')}</strong>.
                  Please reconcile timestamps or provide mandatory audit justification remarks below.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAdoptGpsTimestamps}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded text-[11px] shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Adopt GPS Automated Timestamp</span>
                  </button>
                  <span className="text-[10px] text-rose-600 italic">
                    (Aligns detention with verified satellite geofence telemetry)
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="text-slate-600 font-medium block mb-1">
                  1. Vehicle Arrival / Gate In <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={arrivalDatetime}
                  onChange={(e) => setArrivalDatetime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">2. Loading / Unloading Start</label>
                <input
                  type="datetime-local"
                  value={locationType === 'Origin' ? loadingStartDatetime : unloadingStartDatetime}
                  onChange={(e) =>
                    locationType === 'Origin'
                      ? setLoadingStartDatetime(e.target.value)
                      : setUnloadingStartDatetime(e.target.value)
                  }
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">3. Loading / Unloading Complete</label>
                <input
                  type="datetime-local"
                  value={locationType === 'Origin' ? loadingCompleteDatetime : unloadingCompleteDatetime}
                  onChange={(e) =>
                    locationType === 'Origin'
                      ? setLoadingCompleteDatetime(e.target.value)
                      : setUnloadingCompleteDatetime(e.target.value)
                  }
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">4. Vehicle Departure / Gate Out</label>
                <input
                  type="datetime-local"
                  value={departureDatetime}
                  onChange={(e) => setDepartureDatetime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Detention Rate and Free Hours parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Free Time Allowed</span>
              <div className="font-bold text-slate-800 text-sm">{freeHours} Hours</div>
              <span className="text-[10px] text-slate-400">Contract Standard</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Detention Rate</span>
              <div className="font-bold text-slate-800 text-sm">₹{detentionRatePerDay.toLocaleString()} / Day</div>
              <span className="text-[10px] text-slate-400">24-Hr Cycle</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Total Waiting Time</span>
              <div className="font-bold text-slate-900 text-sm font-mono">{calcResult.totalHours} Hrs</div>
              <span className="text-[10px] text-slate-500">From Gate In</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Chargeable Detention</span>
              <div className="font-black text-amber-700 text-sm font-mono">
                {calcResult.chargeableHours} Hrs ({calcResult.chargeableDays} Day{calcResult.chargeableDays === 1 ? '' : 's'})
              </div>
            </div>
          </div>

          {/* Amount Calculation Summary Card */}
          <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-xs">Total Chargeable Detention Amount</div>
              <div className="text-2xl font-black font-mono text-amber-400">
                ₹{effectiveAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {effectiveDays} Day(s) @ ₹{detentionRatePerDay.toLocaleString()}/Day
                {isWaived && <span className="ml-2 text-rose-400 font-bold">(COMMERCIALLY WAIVED)</span>}
              </div>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isWaived}
                  onChange={(e) => setIsWaived(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="text-slate-300 font-medium">Waive Detention</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isManualOverride}
                  onChange={(e) => setIsManualOverride(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="text-slate-300 font-medium">Manual Override</span>
              </label>
            </div>
          </div>

          {/* Manual Override & Authorization */}
          {isManualOverride && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Detention Override Requires Authorization &amp; Remarks</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium block">Approved Chargeable Days</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={overrideDays}
                    onChange={(e) => setOverrideDays(Number(e.target.value))}
                    className="w-full bg-white border border-rose-300 rounded px-2 py-1 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block">Authorizing Role / User</label>
                  <div className="bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-semibold">
                    {currentUserName} ({currentUserRole})
                  </div>
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-medium block">
                  Mandatory Operations Remarks <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  placeholder="e.g. Crane breakdown at customer bay; delay authorized by customer plant head..."
                  className="w-full bg-white border border-rose-300 rounded p-1.5 text-xs h-16"
                  required
                />
              </div>
            </div>
          )}

          {/* History of existing detention records on this trip */}
          {trip.detentionRecords && trip.detentionRecords.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-700 mb-1.5 text-xs">Existing Detention Logs on Trip</h4>
              <div className="space-y-1.5">
                {trip.detentionRecords.map((rec) => (
                  <div key={rec.id} className="bg-slate-50 border border-slate-200 p-2 rounded flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-bold text-slate-900">{rec.locationType} - {rec.locationName}</span>
                      <span className="text-slate-500 ml-2">({rec.chargeableHours} hrs chargeable, {rec.chargeableDays} days)</span>
                      <div className="text-slate-500 text-[10px]">{rec.remarks}</div>
                    </div>
                    <div className="font-mono font-bold text-amber-700 text-xs">
                      ₹{rec.detentionAmount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold shadow flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Apply Detention Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
