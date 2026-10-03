import React, { useState } from 'react';
import { TripRecord, TripStatus, UserRole } from '../types';
import {
  X,
  CheckCircle2,
  Send,
  Navigation,
  Check,
  FileCheck2,
  DollarSign,
  Archive,
  ArrowRight,
  Upload,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { hasPermission } from '../utils/permissions';

interface WorkflowExecutionModalProps {
  trip: TripRecord;
  currentUserRole: UserRole;
  currentUserName: string;
  onUpdateStatus: (
    newStatus: TripStatus,
    remarks: string,
    extraData?: {
      actualKm?: number;
      podUrl?: string;
      podReceivedBy?: string;
      podRemarks?: string;
    }
  ) => void;
  onClose: () => void;
}

const WORKFLOW_STEPS: { status: TripStatus; label: string; desc: string }[] = [
  { status: 'Draft', label: '1. Draft', desc: 'Booking creation and data entry' },
  { status: 'Booked', label: '2. Booked', desc: 'Commercial confirmation and vehicle booking' },
  { status: 'Vehicle Assigned', label: '3. Vehicle Assigned', desc: 'Vehicle and driver placed at origin' },
  { status: 'Dispatched', label: '4. Dispatched', desc: 'Gate out with LR and verified E-Way Bill' },
  { status: 'In Transit', label: '5. In Transit', desc: 'Live GPS tracked transit on corridor' },
  { status: 'Arrived', label: '6. Arrived', desc: 'Reporting at destination consignee bay' },
  { status: 'Delivered', label: '7. Delivered', desc: 'Cargo unloaded and physical delivery done' },
  { status: 'POD Received', label: '8. POD Received', desc: 'Signed/stamped physical POD uploaded' },
  { status: 'Billable', label: '9. Billable', desc: 'Audited freight, detention & toll ready' },
  { status: 'Closed', label: '10. Closed', desc: 'Reconciled and closed trip' },
];

export const WorkflowExecutionModal: React.FC<WorkflowExecutionModalProps> = ({
  trip,
  currentUserRole,
  currentUserName,
  onUpdateStatus,
  onClose,
}) => {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.status === trip.status);
  const nextStep = currentIndex >= 0 && currentIndex < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[currentIndex + 1] : null;

  const [selectedNextStatus, setSelectedNextStatus] = useState<TripStatus>(
    nextStep ? nextStep.status : trip.status
  );
  const [remarks, setRemarks] = useState('');
  const [actualKm, setActualKm] = useState(trip.actualKm || trip.approvedKm || 0);

  // POD fields
  const [podReceivedBy, setPodReceivedBy] = useState(trip.podReceivedBy || 'Store Incharge: R. Sharma');
  const [podRemarks, setPodRemarks] = useState(trip.podRemarks || 'All cargo packages received intact. Clean POD.');
  const [mockPodUploaded, setMockPodUploaded] = useState(Boolean(trip.podDocumentUrl));

  const handleExecute = () => {
    if (!remarks.trim()) {
      alert('Please enter a brief operational remark for the status audit trail.');
      return;
    }

    const extra: any = {};
    if (actualKm && actualKm !== trip.approvedKm) {
      extra.actualKm = actualKm;
    }
    if (selectedNextStatus === 'POD Received' || mockPodUploaded) {
      extra.podUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
      extra.podReceivedBy = podReceivedBy;
      extra.podRemarks = podRemarks;
    }

    onUpdateStatus(selectedNextStatus, remarks, extra);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-400" />
              <span>Trip Status Lifecycle Execution</span>
            </h2>
            <p className="text-xs text-slate-400">
              Trip: <span className="font-mono text-amber-300 font-bold">{trip.id}</span> • Current Status:{' '}
              <span className="font-bold text-white uppercase">{trip.status}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Workflow Stepper Bar */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between overflow-x-auto pb-2 gap-1 text-[10px]">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isPassed = idx <= currentIndex;
                const isCurrent = step.status === trip.status;
                const isNext = step.status === selectedNextStatus;

                return (
                  <div
                    key={step.status}
                    className={`flex flex-col items-center flex-1 min-w-[65px] text-center p-1 rounded transition-colors ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : isNext
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold'
                        : isPassed
                        ? 'text-slate-700 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] truncate max-w-full">
                      {idx + 1}. {step.status.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transition Action Card */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-lg">
            <div className="font-bold text-slate-900 text-xs mb-2">Select Next Lifecycle Stage:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WORKFLOW_STEPS.filter((s) => s.status !== 'Draft').map((step) => (
                <button
                  key={step.status}
                  type="button"
                  onClick={() => {
                    setSelectedNextStatus(step.status);
                    setRemarks(`Trip transition to ${step.status} recorded.`);
                  }}
                  className={`p-2 rounded text-left border text-[11px] transition-all ${
                    selectedNextStatus === step.status
                      ? 'border-amber-500 bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="font-semibold">{step.label}</div>
                  <div className="text-[10px] opacity-80 truncate">{step.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Input Fields depending on target status */}
          {selectedNextStatus === 'In Transit' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900">
              <div className="font-bold text-xs mb-1">GPS Telematics &amp; Corridor Checkpoint:</div>
              <p className="text-[11px] text-blue-800">
                Vehicle is connected to GPS gateway. Real-time speed and toll corridor geofencing active.
              </p>
            </div>
          )}

          {(selectedNextStatus === 'Delivered' || selectedNextStatus === 'POD Received' || selectedNextStatus === 'Closed') && (
            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 text-xs">Delivery &amp; KM Reconciliation:</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Lane Approved KM</label>
                  <input
                    type="number"
                    disabled
                    value={trip.approvedKm}
                    className="w-full bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Actual Odometre / GPS KM</label>
                  <input
                    type="number"
                    value={actualKm}
                    onChange={(e) => setActualKm(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedNextStatus === 'POD Received' && (
            <div className="space-y-2 bg-indigo-50 border border-indigo-200 p-3 rounded-lg">
              <div className="font-bold text-indigo-900 text-xs flex items-center justify-between">
                <span>Proof of Delivery (POD) Documentation</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-950 px-2 py-0.5 rounded font-mono">
                  MANDATORY FOR BILLING
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1">Receiver Name &amp; Designation</label>
                  <input
                    type="text"
                    value={podReceivedBy}
                    onChange={(e) => setPodReceivedBy(e.target.value)}
                    className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1">POD Condition / Shortage / Damages</label>
                  <input
                    type="text"
                    value={podRemarks}
                    onChange={(e) => setPodRemarks(e.target.value)}
                    className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMockPodUploaded(true)}
                  className={`w-full py-2 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 text-xs font-semibold ${
                    mockPodUploaded
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100/50'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {mockPodUploaded ? '✓ Signed Physical POD Attached (Scan Verified)' : 'Attach / Upload Scanned Customer Signed POD'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Mandatory Audit Remarks */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Audit Log Remarks <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Vehicle placed at loading bay; physical inspection completed..."
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs"
              required
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Logged by: <span className="font-semibold text-slate-700">{currentUserName}</span> ({currentUserRole}) at{' '}
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold shadow flex items-center gap-1.5"
          >
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            <span>Update Status to {selectedNextStatus}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
