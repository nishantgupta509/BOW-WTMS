import React, { useState } from 'react';
import { TripRecord, UserRole } from '../types';
import { X, AlertOctagon, Ban } from 'lucide-react';
import { hasPermission } from '../utils/permissions';

interface CancelTripModalProps {
  trip: TripRecord;
  currentUserRole: UserRole;
  currentUserName: string;
  onConfirmCancel: (reason: string) => void;
  onClose: () => void;
}

export const CancelTripModal: React.FC<CancelTripModalProps> = ({
  trip,
  currentUserRole,
  currentUserName,
  onConfirmCancel,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const canCancel = hasPermission(currentUserRole, 'cancelTrip');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Mandatory cancellation reason must be provided.');
      return;
    }
    onConfirmCancel(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-lg w-full my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-300" />
            <span className="font-bold text-base">Cancel Transport Trip Booking</span>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {!canCancel ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800">
              <span className="font-bold">Access Denied: </span>
              Your current role ({currentUserRole}) does not have permission to cancel confirmed trips.
              Cancellation requires Supervisor, Manager, or Admin privileges.
            </div>
          ) : (
            <>
              <div className="bg-slate-100 p-3 rounded border border-slate-200 text-slate-800">
                <div className="font-bold mb-1">
                  Trip ID: <span className="font-mono text-slate-950">{trip.id}</span>
                </div>
                <div>Customer: {trip.customerId}</div>
                <div>Current Status: {trip.status}</div>
                <div className="text-[11px] text-rose-700 font-semibold mt-2">
                  ⚠️ Notice: Once cancelled, this Trip ID is permanently locked and can never be reused.
                  Vehicle &amp; driver reservations will be released back to the pool.
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Cancellation Reason <span className="text-rose-600">* (Mandatory)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Customer plant breakdown, order cancelled, vehicle accident prior to placement..."
                  className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs h-24 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Cancelled By: <span className="font-bold text-slate-800">{currentUserName}</span> ({currentUserRole})
                • Timestamp: {new Date().toLocaleString()}
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              Back
            </button>
            {canCancel && (
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm Permanent Cancellation</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
