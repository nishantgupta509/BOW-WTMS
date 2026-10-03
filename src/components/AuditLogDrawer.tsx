import React from 'react';
import { TripRecord } from '../types';
import { X, History, Clock, User, Shield, CheckCircle } from 'lucide-react';

interface AuditLogDrawerProps {
  trip: TripRecord;
  onClose: () => void;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ trip, onClose }) => {
  const history = trip.statusHistory || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col text-slate-900">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Trip Audit Log &amp; Timeline</h3>
              <p className="text-[11px] text-slate-400 font-mono">Trip ID: {trip.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Strip */}
        <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 text-xs flex justify-between items-center">
          <div>
            <span className="text-slate-500">Booked By: </span>
            <span className="font-semibold text-slate-800">{trip.bookedBy}</span>
          </div>
          <div>
            <span className="text-slate-500">Current Status: </span>
            <span className="font-bold text-slate-900 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px]">
              {trip.status}
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">
              No previous status transition logs recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((log, idx) => (
                <div key={log.id || idx} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        {log.oldStatus} → <span className="text-amber-600">{log.newStatus}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 font-normal">{log.remarks}</p>

                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        {log.changedBy} ({log.userRole})
                      </span>
                      <span>{new Date(log.changedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* If trip is cancelled */}
          {trip.status === 'Cancelled' && (
            <div className="mt-6 bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 space-y-1">
              <div className="font-bold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                Permanent Cancellation Audit
              </div>
              <p className="text-[11px] text-rose-800">{trip.cancellationReason}</p>
              <div className="text-[10px] text-rose-600 pt-1 border-t border-rose-200">
                Cancelled By: {trip.cancelledBy} • {trip.cancelledAt}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
