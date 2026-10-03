import React, { useState } from 'react';
import { TripRecord, VehicleMaster, DriverMaster, CustomerMaster } from '../types';
import { Printer, X, FileCheck, ShieldCheck, Truck } from 'lucide-react';
import { calculateConsignmentTotals } from '../utils/calculations';

interface LRModalProps {
  trip: TripRecord;
  customer?: CustomerMaster;
  vehicle?: VehicleMaster;
  driver?: DriverMaster;
  onSaveLR: (lrNumber: string, lrDate: string, consignor: string, consignee: string) => void;
  onClose: () => void;
}

export const LRModal: React.FC<LRModalProps> = ({
  trip,
  customer,
  vehicle,
  driver,
  onSaveLR,
  onClose,
}) => {
  const totals = calculateConsignmentTotals(trip.invoices || []);
  const todayStr = new Date().toISOString().split('T')[0];

  const defaultLRNumber = trip.lrNumber || `BOW-LR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const [lrNo, setLrNo] = useState(defaultLRNumber);
  const [lrDate, setLrDate] = useState(trip.lrDate || todayStr);
  const [consignor, setConsignor] = useState(trip.consignorName || customer?.name || 'Tata Motors Commercial Vehicles Ltd.');
  const [consignee, setConsignee] = useState(
    trip.consigneeName || `${customer?.name || 'Consignee Ltd.'} (${trip.destination} Depot)`
  );

  const handleSaveAndPrint = () => {
    onSaveLR(lrNo, lrDate, consignor, consignee);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-base">Generate Lorry Receipt (LR / Bilty)</span>
            <span className="text-slate-400 text-xs">• Trip: {trip.id}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveAndPrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Save &amp; Print LR</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LR Form / Print Document */}
        <div className="p-8 print:p-4 text-xs font-sans">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 text-center">
            <h1 className="text-xl font-black uppercase text-slate-950">BOW LOGISTICS PVT. LTD.</h1>
            <p className="text-[11px] text-slate-600">Goods Transport Agency (GTA) • Regd. Under Carriage by Road Act, 2007</p>
            <div className="mt-2 inline-block bg-slate-100 border border-slate-300 px-4 py-1 font-bold text-sm text-slate-900 uppercase tracking-widest">
              CONSIGNMENT NOTE / LORRY RECEIPT (LR)
            </div>
          </div>

          {/* Quick Editable Fields (hidden during print) */}
          <div className="my-4 bg-amber-50/70 p-3 rounded border border-amber-200 grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block">LR Number</label>
              <input
                type="text"
                value={lrNo}
                onChange={(e) => setLrNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block">LR Date</label>
              <input
                type="date"
                value={lrDate}
                onChange={(e) => setLrDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block">Consignor</label>
              <input
                type="text"
                value={consignor}
                onChange={(e) => setConsignor(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="text-[11px] font-bold text-slate-700 block">Consignee</label>
              <input
                type="text"
                value={consignee}
                onChange={(e) => setConsignee(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>

          {/* LR Document Details Grid */}
          <div className="grid grid-cols-2 border border-slate-300 mb-3 text-xs">
            <div className="p-2 border-r border-b border-slate-300">
              <span className="font-semibold text-slate-500">LR No: </span>
              <span className="font-black text-slate-900 font-mono text-sm">{lrNo}</span>
            </div>
            <div className="p-2 border-b border-slate-300">
              <span className="font-semibold text-slate-500">LR Date: </span>
              <span className="font-bold text-slate-900">{lrDate}</span>
            </div>
            <div className="p-2 border-r border-b border-slate-300">
              <span className="font-semibold text-slate-500">Origin / From: </span>
              <span className="font-bold text-slate-900">{trip.origin}</span>
            </div>
            <div className="p-2 border-b border-slate-300">
              <span className="font-semibold text-slate-500">Destination / To: </span>
              <span className="font-bold text-slate-900">{trip.destination}</span>
            </div>
            <div className="p-2 border-r border-slate-300">
              <span className="font-semibold text-slate-500">Vehicle No: </span>
              <span className="font-black text-slate-900 font-mono">{vehicle?.vehicleNo || trip.vehicleId || 'MH12AB1234'}</span>
            </div>
            <div className="p-2 border-slate-300">
              <span className="font-semibold text-slate-500">Driver &amp; Mobile: </span>
              <span className="font-bold text-slate-900">{driver?.name || 'Driver'} ({driver?.mobile || 'N/A'})</span>
            </div>
          </div>

          {/* Consignor & Consignee boxes */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="border border-slate-300 p-2.5 rounded">
              <div className="font-bold text-slate-800 uppercase text-[11px] mb-1">Consignor (Shipper)</div>
              <div className="font-semibold text-slate-900">{consignor}</div>
              <div className="text-slate-600 text-[11px] mt-1">{customer?.billingAddress || 'Industrial Logistics Park'}</div>
              <div className="text-[11px] text-slate-700 mt-1">GSTIN: <span className="font-mono font-bold">{customer?.gstin || '27AAACT2727Q1ZG'}</span></div>
            </div>
            <div className="border border-slate-300 p-2.5 rounded">
              <div className="font-bold text-slate-800 uppercase text-[11px] mb-1">Consignee (Receiver)</div>
              <div className="font-semibold text-slate-900">{consignee}</div>
              <div className="text-slate-600 text-[11px] mt-1">{trip.destination} Regional Redistribution Centre</div>
              <div className="text-[11px] text-slate-700 mt-1">Delivery Terms: Door Delivery / Direct Unload</div>
            </div>
          </div>

          {/* Invoices breakdown in LR */}
          <table className="w-full border-collapse border border-slate-300 mb-3 text-xs">
            <thead>
              <tr className="bg-slate-100 text-left font-bold text-slate-700 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Invoice No</th>
                <th className="p-2 border-r border-slate-300">E-Way Bill</th>
                <th className="p-2 border-r border-slate-300">Description of Goods</th>
                <th className="p-2 border-r border-slate-300 text-center">Packages</th>
                <th className="p-2 text-right">Actual Weight</th>
              </tr>
            </thead>
            <tbody>
              {trip.invoices && trip.invoices.length > 0 ? (
                trip.invoices.map((inv, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 font-mono font-bold border-r border-slate-200">{inv.invoiceNo}</td>
                    <td className="p-2 font-mono border-r border-slate-200">{inv.ewaybillNo}</td>
                    <td className="p-2 border-r border-slate-200">{inv.materialDescription || 'General Cargo'}</td>
                    <td className="p-2 text-center border-r border-slate-200">{inv.packageCount}</td>
                    <td className="p-2 text-right font-mono font-bold">{inv.weightKg.toLocaleString()} KG</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-slate-400 italic">No consignment lines</td>
                </tr>
              )}
              <tr className="bg-slate-50 font-bold border-t border-slate-300">
                <td colSpan={3} className="p-2 border-r border-slate-300">Total Consignment Declared:</td>
                <td className="p-2 text-center border-r border-slate-300">{totals.totalPackages} Pkgs</td>
                <td className="p-2 text-right font-mono">{totals.totalWeightKg.toLocaleString()} KG</td>
              </tr>
            </tbody>
          </table>

          {/* Freight Note & Signatures */}
          <div className="border border-slate-300 p-2.5 mb-4 text-xs flex justify-between items-center bg-slate-50">
            <div>
              <span className="font-semibold text-slate-600">Freight Terms: </span>
              <span className="font-bold text-slate-900">{trip.freightCalculationMode} (To be billed as per agreement)</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Total Value: </span>
              <span className="font-bold font-mono text-slate-900">₹{totals.totalValue.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-800">For BOW LOGISTICS PVT. LTD.</div>
              <div className="text-slate-500 text-[10px]">Authorized Cargo Booking Officer</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-800">Driver Signature &amp; Acceptance</div>
              <div className="text-slate-500 text-[10px]">Received cargo in good condition as manifested</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
