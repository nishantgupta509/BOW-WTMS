import React, { useState } from 'react';
import { TripRecord, CustomerMaster } from '../types';
import { X, Send, Mail, MessageSquare, Check, FileText } from 'lucide-react';

interface SendCustomerModalProps {
  trip: TripRecord;
  customer?: CustomerMaster;
  onClose: () => void;
}

export const SendCustomerModal: React.FC<SendCustomerModalProps> = ({
  trip,
  customer,
  onClose,
}) => {
  const [channel, setChannel] = useState<'Email' | 'WhatsApp' | 'Both'>('Both');
  const [recipientEmail, setRecipientEmail] = useState(
    customer?.contactEmail || 'logistics-ops@customer.com'
  );
  const [recipientMobile, setRecipientMobile] = useState(
    customer?.contactPhone || '+91 98220 11223'
  );
  const [subject, setSubject] = useState(
    `[BOW LOGISTICS] Vehicle Placement Confirmation - Trip ID: ${trip.id} - ${trip.origin} to ${trip.destination}`
  );
  const [message, setMessage] = useState(
    `Dear ${customer?.contactPerson || 'Customer Team'},\n\nPlease find attached the Trip Booking & Vehicle Placement Confirmation Sheet for Trip ID: ${trip.id}.\n\nVehicle: ${trip.vehicleId || 'MH12AB1234'}\nDriver Mobile: +91 98765 43210\nReporting Bay: ${trip.reportingLocation || 'Gate 1'}\nLoading Time: ${trip.loadingDatetime || 'As scheduled'}\n\nKindly acknowledge receipt.\n\nWarm regards,\nBOW LOGISTICS PVT. LTD.\nCentral Operations Desk`
  );
  const [isSent, setIsSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-lg w-full my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-base">Transmit Booking &amp; Placement PDF</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Placement Sheet Dispatched Successfully!</h3>
            <p className="text-xs text-slate-600">
              Notification and official PDF attachment transmitted to {recipientEmail} &amp; {recipientMobile}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-4 bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Dispatch Channel:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="channel"
                  checked={channel === 'Both'}
                  onChange={() => setChannel('Both')}
                  className="text-amber-500"
                />
                <span className="text-slate-800">Email &amp; WhatsApp</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="channel"
                  checked={channel === 'Email'}
                  onChange={() => setChannel('Email')}
                  className="text-amber-500"
                />
                <span className="text-slate-800">Email Only</span>
              </label>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer Contact Email</label>
              <div className="flex items-center border border-slate-300 rounded px-2.5 py-1.5 bg-white">
                <Mail className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full text-xs outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mobile / WhatsApp Number</label>
              <div className="flex items-center border border-slate-300 rounded px-2.5 py-1.5 bg-white">
                <MessageSquare className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={recipientMobile}
                  onChange={(e) => setRecipientMobile(e.target.value)}
                  className="w-full text-xs outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Body &amp; Notice</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full border border-slate-300 rounded p-2 text-xs outline-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded flex items-center gap-2 text-[11px] text-amber-900">
              <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Attachment: <span className="font-mono font-bold">BOW_PlacementSheet_{trip.id}.pdf</span> (Generated as per Section 15 &amp; 16 Terms).
              </span>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded shadow flex items-center gap-1.5"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Send to Customer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
