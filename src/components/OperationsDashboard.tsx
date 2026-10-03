import React, { useState } from 'react';
import { TripRecord, VehicleMaster, DriverMaster, CustomerMaster, UserRole } from '../types';
import {
  Navigation,
  Truck,
  Clock,
  Send,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  ShieldCheck,
  Signal,
  Compass
} from 'lucide-react';

interface OperationsDashboardProps {
  trips: TripRecord[];
  vehicles: VehicleMaster[];
  drivers: DriverMaster[];
  customers: CustomerMaster[];
  currentUserRole: UserRole;
  onSelectTrip: (trip: TripRecord) => void;
  onOpenWorkflow: (trip: TripRecord) => void;
  onOpenDetention: (trip: TripRecord) => void;
  onOpenPrintSheet: (trip: TripRecord) => void;
  onOpenGpsTracking?: (trip: TripRecord) => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  trips,
  vehicles,
  drivers,
  customers,
  currentUserRole,
  onSelectTrip,
  onOpenWorkflow,
  onOpenDetention,
  onOpenPrintSheet,
  onOpenGpsTracking,
}) => {
  const activeTransits = trips.filter((t) => t.status === 'In Transit' || t.status === 'Dispatched');
  const atHubs = trips.filter((t) => t.status === 'Vehicle Assigned' || t.status === 'Arrived');
  const bookedPending = trips.filter((t) => t.status === 'Booked');

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 font-sans">
      {/* Header */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BOW WTMS • CENTRAL OPERATIONS &amp; FLEET DESK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            Live Fleet Tracking &amp; Trip Execution
          </h1>
          <p className="text-xs text-slate-400">
            Real-time GPS telematics, corridor geofencing, dock operations and detention monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-slate-400">Active Transits:</span>
            <span className="font-bold text-emerald-400 text-sm font-mono">{activeTransits.length}</span>
          </div>
          <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-slate-400">At Customer Docks:</span>
            <span className="font-bold text-amber-400 text-sm font-mono">{atHubs.length}</span>
          </div>
        </div>
      </div>

      {/* Live Fleet Map & Telematics Simulator */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
        <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Live Express Highway Corridors (GPS Telematics Gateway)</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <Signal className="w-3.5 h-3.5" />
            Telemetry Stream: 100% Up
          </span>
        </div>

        {/* Visual Simulated Route Tracking Canvas */}
        <div className="p-6 bg-slate-950 relative overflow-hidden min-h-[220px] flex flex-col justify-center">
          {/* Background grid lines */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-10 max-w-4xl mx-auto w-full space-y-6">
            {activeTransits.length === 0 ? (
              <div className="text-center text-slate-500 italic text-xs py-8">
                No vehicles currently on highway transit. Dispatch booked trips to activate telemetry.
              </div>
            ) : (
              activeTransits.map((trip) => {
                const veh = vehicles.find((v) => v.id === trip.vehicleId);
                const drv = drivers.find((d) => d.id === trip.driverId);

                return (
                  <div key={trip.id} className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-amber-400 font-mono text-sm">{trip.id}</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded font-mono">
                          {veh?.vehicleNo || trip.vehicleId}
                        </span>
                        <span className="text-slate-400">• Driver: {drv?.name || 'Assigned Driver'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {onOpenGpsTracking && (
                          <button
                            onClick={() => onOpenGpsTracking(trip)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-xs flex items-center gap-1 shadow"
                          >
                            <Navigation className="w-3.5 h-3.5 animate-pulse" />
                            <span>Live Map</span>
                          </button>
                        )}
                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">
                          GPS: {veh?.gpsId || 'WE123456'}
                        </span>
                        <button
                          onClick={() => onOpenWorkflow(trip)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-xs"
                        >
                          Lifecycle Step
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar Corridor */}
                    <div className="relative pt-2">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {trip.origin} (0 KM)
                        </span>
                        <span className="text-amber-300 font-mono">
                          Lane: {trip.laneCode} ({trip.approvedKm} KM)
                        </span>
                        <span className="font-bold text-sky-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {trip.destination}
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-2.5 relative overflow-hidden border border-slate-700">
                        <div
                          className="bg-gradient-to-r from-emerald-500 via-amber-500 to-blue-500 h-2.5 rounded-full transition-all"
                          style={{ width: trip.status === 'In Transit' ? '65%' : '20%' }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span>Speed: 52 km/h</span>
                        <span>Estimated Arrival: 4.5 hrs</span>
                        <span>Toll Passed: 2 of 3</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dock Operations & Detention Center Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booked Waiting Placement */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Booked Trips Ready for Placement / Dispatch</span>
            </h3>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
              {bookedPending.length}
            </span>
          </div>

          <div className="p-3 divide-y divide-slate-700/60 text-xs">
            {bookedPending.length === 0 ? (
              <div className="p-4 text-center text-slate-500 italic">No pending booked trips.</div>
            ) : (
              bookedPending.map((trip) => (
                <div key={trip.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold font-mono text-amber-400">{trip.id}</div>
                    <div className="text-white font-medium">
                      {trip.origin} → {trip.destination}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Vehicle: <span className="font-mono text-slate-200">{trip.vehicleId || 'MH12AB1234'}</span> •
                      Reporting: {trip.reportingLocation}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onSelectTrip(trip)}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded font-medium text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onOpenWorkflow(trip)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded font-bold text-xs"
                    >
                      Assign &amp; Dispatch
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vehicles at Docks / Detention Monitor */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow">
          <div className="bg-slate-850 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Dock Detention &amp; Loading Operations</span>
            </h3>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
              5h Free Time
            </span>
          </div>

          <div className="p-3 divide-y divide-slate-700/60 text-xs">
            {trips.filter((t) => t.detentionRecords && t.detentionRecords.length > 0).length === 0 ? (
              <div className="p-4 text-center text-slate-500 italic">
                No active detention records. Use the Detention Tracker on any trip to log gate timings.
              </div>
            ) : (
              trips
                .filter((t) => t.detentionRecords && t.detentionRecords.length > 0)
                .map((trip) => (
                  <div key={trip.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold font-mono text-amber-400">{trip.id}</div>
                      <div className="text-slate-300 text-[11px]">
                        {trip.detentionRecords[0]?.locationType} - {trip.detentionRecords[0]?.locationName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Chargeable: {trip.detentionRecords[0]?.chargeableHours} hrs ({trip.detentionRecords[0]?.chargeableDays} days)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400 text-sm">
                        ₹{trip.detentionRecords[0]?.detentionAmount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => onOpenDetention(trip)}
                        className="text-[10px] text-slate-400 hover:text-white underline"
                      >
                        Adjust / Override
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
