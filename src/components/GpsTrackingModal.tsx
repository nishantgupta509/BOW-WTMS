import React, { useState } from 'react';
import { TripRecord, GpsTelemetry, UserRole } from '../types';
import { getSimulatedGpsTelemetry, CORRIDOR_WAYPOINTS } from '../utils/gpsService';
import {
  X,
  Navigation,
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Radio,
  Signal,
  BatteryCharging,
  Compass,
  Zap,
  ArrowRight,
  RefreshCw,
  Layers,
  ShieldAlert,
  Calendar
} from 'lucide-react';

interface GpsTrackingModalProps {
  trip: TripRecord;
  currentUserRole: UserRole;
  currentUserName: string;
  onSyncGpsTimestampsToDetention?: (trip: TripRecord, originArrival: string, originDeparture: string) => void;
  onClose: () => void;
}

export const GpsTrackingModal: React.FC<GpsTrackingModalProps> = ({
  trip,
  currentUserRole,
  currentUserName,
  onSyncGpsTimestampsToDetention,
  onClose,
}) => {
  const [telemetry, setTelemetry] = useState<GpsTelemetry>(() =>
    trip.gpsTelemetry || getSimulatedGpsTelemetry(trip)
  );

  const [mapLayer, setMapLayer] = useState<'corridor' | 'satellite'>('corridor');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSyncSuccess, setIsSyncSuccess] = useState(false);

  const lane = trip.laneCode || 'ZON_624';
  const waypoints = CORRIDOR_WAYPOINTS[lane] || CORRIDOR_WAYPOINTS['DEFAULT'];

  const handleRefreshGps = () => {
    const updated = getSimulatedGpsTelemetry(trip);
    setTelemetry(updated);
  };

  const handleSyncToDetention = () => {
    if (!onSyncGpsTimestampsToDetention || !telemetry.autoCapturedTimestamps.originArrival) return;
    onSyncGpsTimestampsToDetention(
      trip,
      telemetry.autoCapturedTimestamps.originArrival,
      telemetry.autoCapturedTimestamps.originDeparture || ''
    );
    setIsSyncSuccess(true);
    setTimeout(() => setIsSyncSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex justify-center p-3 sm:p-5 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-5xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-850 px-5 py-3.5 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Live Vehicle GPS Tracking &amp; Geofence</h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE PING
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Trip: <span className="text-amber-400 font-bold">{trip.id}</span> • Vehicle:{' '}
                <span className="text-white font-bold">{trip.vehicleId || 'MH12AB1234'}</span> • GPS ID:{' '}
                <span className="text-slate-300">{telemetry.vehicleId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshGps}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              title="Refresh GPS telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telematics Info Bar */}
        <div className="bg-slate-950 px-5 py-2.5 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Current Speed</span>
            <div className="font-mono text-base font-black text-amber-400">
              {telemetry.speedKmH} <span className="text-xs text-slate-400 font-normal">KM/H</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Geofence Status</span>
            <div className="font-bold text-emerald-400 text-xs truncate">{telemetry.geofenceStatus}</div>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Coordinates</span>
            <div className="font-mono text-xs text-slate-200">
              {telemetry.latitude}° N, {telemetry.longitude}° E
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Corridor Progress</span>
            <div className="font-mono text-xs font-bold text-white">
              {telemetry.odometerKm} KM / {trip.approvedKm} KM ({telemetry.corridorProgressPercent}%)
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Ignition / Battery</span>
            <div className="font-mono text-xs text-slate-300 flex items-center gap-2">
              <span className={telemetry.ignition === 'ON' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                IGN: {telemetry.ignition}
              </span>
              <span>•</span>
              <span className="text-slate-300">{telemetry.batteryPercent}%</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">GSM Signal</span>
            <div className="font-mono text-xs text-emerald-400 flex items-center gap-1">
              <Signal className="w-3 h-3" />
              <span>4G LTE ({telemetry.gsmSignalPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Real-time Map View Simulator Canvas */}
          <div className="bg-slate-950 border border-slate-700/80 rounded-2xl overflow-hidden relative shadow-inner">
            {/* Map Controls Header */}
            <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs backdrop-blur-md">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                {lane}: {trip.origin} → {trip.destination}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{trip.approvedKm} KM Approved Corridor</span>
            </div>

            <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700 p-1 rounded-lg text-xs backdrop-blur-md">
              <button
                onClick={() => setMapLayer(mapLayer === 'corridor' ? 'satellite' : 'corridor')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 text-[11px] font-medium"
              >
                {mapLayer === 'corridor' ? 'Satellite View' : 'Corridor View'}
              </button>
            </div>

            {/* Simulated Interactive Map Display */}
            <div className="h-80 sm:h-96 w-full relative flex items-center justify-center p-6 overflow-hidden select-none">
              {/* Background Map Grid & Roads Styling */}
              <div
                className={`absolute inset-0 transition-opacity ${
                  mapLayer === 'satellite'
                    ? 'bg-slate-950 opacity-90 [background:radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]'
                    : 'bg-slate-900 [background:linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:32px_32px]'
                }`}
              ></div>

              {/* Highway Corridor Line & Waypoint Path */}
              <div className="relative w-full max-w-3xl h-48 z-10 flex items-center justify-between px-6">
                {/* SVG Route Line connecting waypoints */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d={`M 50 100 Q 200 40 400 90 T 750 90`}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M 50 100 Q 200 40 400 90 T 750 90`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                </svg>

                {/* Origin Hub Marker with Geofence circle */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center shadow-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-center bg-slate-900/90 border border-slate-700 px-2 py-1 rounded shadow text-[10px]">
                    <div className="font-bold text-emerald-400">{trip.origin}</div>
                    <div className="text-slate-400 font-mono">Geofence: 500m</div>
                  </div>
                </div>

                {/* Intermediate Toll & Checkpoints */}
                {waypoints.filter((w) => w.isToll).slice(0, 2).map((wp, idx) => (
                  <div key={idx} className="relative z-20 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-amber-500/80 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                      ₹
                    </div>
                    <div className="mt-2 text-center bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded text-[9px] text-slate-300 whitespace-nowrap">
                      {wp.label}
                    </div>
                  </div>
                ))}

                {/* Live Vehicle Marker */}
                <div
                  className="absolute z-30 transition-all duration-1000 flex flex-col items-center"
                  style={{
                    left: `${Math.max(10, Math.min(85, telemetry.corridorProgressPercent))}%`,
                    top: '32%',
                  }}
                >
                  <div className="relative">
                    {/* Pulsing radar wave */}
                    <div className="absolute -inset-3 rounded-full bg-amber-400/30 animate-ping"></div>
                    <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-xl border-2 border-white">
                      <Truck className="w-6 h-6 stroke-[2.5]" />
                    </div>
                  </div>

                  <div className="mt-2 bg-slate-900 border border-amber-400/80 text-white px-2.5 py-1 rounded-lg shadow-xl text-center whitespace-nowrap">
                    <div className="font-mono font-black text-amber-400 text-xs">
                      {trip.vehicleId || 'MH12AB1234'}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold font-mono">
                      {telemetry.speedKmH} km/h • {telemetry.geofenceStatus}
                    </div>
                  </div>
                </div>

                {/* Destination Hub Marker */}
                <div className="relative z-20 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border-2 border-sky-500/40 bg-sky-500/10 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 font-black flex items-center justify-center shadow-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-center bg-slate-900/90 border border-slate-700 px-2 py-1 rounded shadow text-[10px]">
                    <div className="font-bold text-sky-400">{trip.destination}</div>
                    <div className="text-slate-400 font-mono">Geofence: 500m</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Current Location Address Strip */}
            <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-slate-300 font-medium truncate">{telemetry.currentAddress}</span>
              </div>
              <div className="text-slate-500 font-mono text-[10px] flex-shrink-0">
                Last GPS Beacon: {new Date(telemetry.lastPingDatetime).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Section: Automated Arrival & Departure Timestamps (Geofence Engine) */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Automated Geofence Gate Timestamps (Section 10 Detention Integration)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Timestamps captured automatically when vehicle breaks virtual boundary (500m radius) of facilities.
                </p>
              </div>

              {onSyncGpsTimestampsToDetention && (
                <button
                  type="button"
                  onClick={handleSyncToDetention}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isSyncSuccess ? '✓ Timestamps Synced!' : 'Sync GPS into Detention Tracker'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">1. Origin Gate-In (Arrival)</span>
                <div className="font-mono font-bold text-white text-xs mt-1">
                  {telemetry.autoCapturedTimestamps.originArrival
                    ? telemetry.autoCapturedTimestamps.originArrival.replace('T', ' ')
                    : 'Awaiting Geofence Breach'}
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">GPS Verified Gate In</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">2. Origin Gate-Out (Departure)</span>
                <div className="font-mono font-bold text-white text-xs mt-1">
                  {telemetry.autoCapturedTimestamps.originDeparture
                    ? telemetry.autoCapturedTimestamps.originDeparture.replace('T', ' ')
                    : 'At Loading Bay'}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Loading Completed</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">3. Destination Gate-In</span>
                <div className="font-mono font-bold text-white text-xs mt-1">
                  {telemetry.autoCapturedTimestamps.destinationArrival
                    ? telemetry.autoCapturedTimestamps.destinationArrival.replace('T', ' ')
                    : 'In Transit on Corridor'}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Destination Bay</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">4. Destination Gate-Out</span>
                <div className="font-mono font-bold text-white text-xs mt-1">
                  {telemetry.autoCapturedTimestamps.destinationDeparture
                    ? telemetry.autoCapturedTimestamps.destinationDeparture.replace('T', ' ')
                    : 'Pending Unloading'}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Final Departure</span>
              </div>
            </div>
          </div>

          {/* Section: GPS vs Manual Discrepancy Warnings (Prompt Requirement) */}
          {telemetry.discrepancies && telemetry.discrepancies.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-600/70 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>⚠️ GPS Telematics &amp; Manual Entry Discrepancy Detected</span>
              </div>
              <p className="text-[11px] text-rose-200">
                The WTMS has detected inconsistencies between manual schedule entries and the GPS automated gate beacon:
              </p>
              <div className="space-y-1.5 mt-2">
                {telemetry.discrepancies.map((disc, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-rose-800 p-2.5 rounded-lg text-xs">
                    <div className="font-bold text-rose-300 flex items-center justify-between">
                      <span>{disc.milestone} Time Mismatch</span>
                      <span className="text-[10px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded font-mono">
                        Variance: {disc.diffMinutes} Minutes
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">{disc.alertMessage}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Manual Input: <span className="font-mono text-white">{disc.manualTime.replace('T', ' ')}</span> •
                      GPS Record: <span className="font-mono text-amber-300">{disc.gpsTime.replace('T', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-850 px-6 py-3 border-t border-slate-700/80 flex justify-between items-center text-xs">
          <span className="text-slate-400 text-[11px]">
            BOW Logistics Telematics Core • Connected to GPS Unit {telemetry.vehicleId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            Close Telematics Map
          </button>
        </div>
      </div>
    </div>
  );
};
