import React, { useState } from 'react';
import { UserRole } from '../types';
import { X, ShieldAlert, Check, AlertTriangle } from 'lucide-react';
import { hasPermission } from '../utils/permissions';

interface RateCardOverrideModalProps {
  fieldName: string;
  fieldLabel: string;
  standardValue: any;
  newValue: any;
  currentUserRole: UserRole;
  currentUserName: string;
  onConfirmOverride: (justification: string) => void;
  onCancel: () => void;
}

export const RateCardOverrideModal: React.FC<RateCardOverrideModalProps> = ({
  fieldName,
  fieldLabel,
  standardValue,
  newValue,
  currentUserRole,
  currentUserName,
  onConfirmOverride,
  onCancel,
}) => {
  const [justification, setJustification] = useState('');
  const canOverride = hasPermission(currentUserRole, 'changeFreight');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      alert('Mandatory justification is required to override contracted customer rate card.');
      return;
    }
    onConfirmOverride(justification.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-6 py-4 flex items-center justify-between text-amber-200">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-base">Rate Card Override Authorization</span>
          </div>
          <button onClick={onCancel} className="text-amber-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {!canOverride ? (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200">
              <span className="font-bold">Access Denied: </span>
              Your current role ({currentUserRole}) is not authorized to override contracted rates.
              Requires Manager or Admin privileges.
            </div>
          ) : (
            <>
              <p className="text-slate-300">
                You are modifying the contract rate for <strong className="text-white">{fieldLabel}</strong>.
              </p>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl grid grid-cols-2 gap-3 text-center">
                <div>
                  <span className="text-slate-500 text-[11px] block">Contract Standard</span>
                  <div className="font-mono font-bold text-slate-300 text-sm mt-0.5">
                    ₹{Number(standardValue).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Overridden Rate</span>
                  <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
                    ₹{Number(newValue).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Mandatory Operational Justification <span className="text-amber-400">*</span>
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="e.g. Express transit requested; client approval email received on 02-Oct..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white h-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="text-[11px] text-slate-400">
                Authorizing User: <span className="text-white font-bold">{currentUserName}</span> ({currentUserRole})
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            {canOverride && (
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Authorize Rate Override</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
