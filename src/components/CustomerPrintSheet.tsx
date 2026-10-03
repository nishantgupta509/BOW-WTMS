import React from 'react';
import { TripRecord, CustomerMaster, VehicleMaster, DriverMaster } from '../types';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { calculateConsignmentTotals } from '../utils/calculations';

interface CustomerPrintSheetProps {
  trip: TripRecord;
  customer?: CustomerMaster;
  vehicle?: VehicleMaster;
  driver?: DriverMaster;
  onClose: () => void;
}

export const CustomerPrintSheet: React.FC<CustomerPrintSheetProps> = ({
  trip,
  customer,
  vehicle,
  driver,
  onClose,
}) => {
  const totals = calculateConsignmentTotals(trip.invoices || []);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 flex justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-400">BOW WTMS</span>
            <span className="text-slate-400 text-sm">• Vehicle Placement Sheet Preview (PDF)</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 print:p-4 text-xs font-sans leading-normal">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                  BOW LOGISTICS PVT. LTD.
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Regd. Office: Sector 48, Express Trade Towers, Gurugram - 122018 | CIN: U60200HR2018PTC073910
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Central WTMS Operations Control • 24x7 Control Room: +91 1800-269-8765 • wtms@bowlogistics.com
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white px-3 py-1 font-bold text-xs rounded tracking-wider uppercase">
                  TBM-001 CONTROLLED RECORD
                </span>
                <div className="text-xs text-slate-500 mt-1 font-mono">Status: {trip.status.toUpperCase()}</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <h2 className="text-base font-extrabold tracking-wide text-slate-900 uppercase">
                TRIP BOOKING / VEHICLE PLACEMENT SHEET
              </h2>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded border border-slate-200 font-medium text-xs">
              <div>
                <span className="text-slate-500">Trip ID: </span>
                <span className="font-bold text-slate-900 font-mono">{trip.tripNumber || trip.id}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-500">Booking Date: </span>
                <span className="font-bold text-slate-900">{formatDate(trip.bookingDatetime)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Customer Ref: </span>
                <span className="font-bold text-slate-900">{trip.customerReference || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Section: Customer & Route */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-t">
              Customer &amp; Route Details
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/4 bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Customer Name
                  </td>
                  <td className="w-1/4 p-2 font-bold text-slate-900 border-r border-slate-200">
                    {customer?.name || trip.customerId}
                  </td>
                  <td className="w-1/4 bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Requirement Type
                  </td>
                  <td className="w-1/4 p-2 font-bold text-slate-900">{trip.requirementType}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Origin Hub
                  </td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{trip.origin}</td>
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Destination
                  </td>
                  <td className="p-2 font-bold text-slate-900">{trip.destination}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Route Name
                  </td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                    {trip.origin} – {trip.destination}
                  </td>
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Lane Code / Approved KM
                  </td>
                  <td className="p-2 font-bold text-slate-900 font-mono">
                    {trip.laneCode || 'ZON_624'} ({trip.approvedKm} KM)
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Loading Date / Time
                  </td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                    {formatDate(trip.loadingDatetime)}
                  </td>
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Reporting Point / Gate
                  </td>
                  <td className="p-2 font-bold text-slate-900">{trip.reportingLocation || 'Gate 1 (10:00 Hrs)'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section: Vehicle & Driver */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-t">
              Vehicle &amp; Driver Details
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/4 bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Vehicle Type
                  </td>
                  <td className="w-1/4 p-2 font-bold text-slate-900 border-r border-slate-200">
                    {vehicle?.vehicleType || trip.vehicleTypeId || '22 FT SXL'}
                  </td>
                  <td className="w-1/4 bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Vehicle Number
                  </td>
                  <td className="w-1/4 p-2 font-bold text-slate-900 font-mono text-sm">
                    {vehicle?.vehicleNo || trip.vehicleId || 'MH12AB1234'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Rated Payload Capacity
                  </td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                    {vehicle?.capacityMt || 9} MT ({vehicle?.capacityKg?.toLocaleString() || '9,000'} KG)
                  </td>
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Driver Name
                  </td>
                  <td className="p-2 font-bold text-slate-900">
                    {driver?.name || 'Assigned Driver'}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    Driver Mobile Contact
                  </td>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200 font-mono">
                    {driver?.mobile ? `+91 ${driver.mobile}` : '—'}
                  </td>
                  <td className="bg-slate-50 p-2 font-semibold text-slate-600 border-r border-slate-200">
                    GPS Tracking Status
                  </td>
                  <td className="p-2 font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Active ({vehicle?.gpsId || trip.gpsTrackingId || 'WE123456'})</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section: Consignment Table */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-t flex justify-between items-center">
              <span>Consignment &amp; Invoice Breakdown</span>
              <span className="text-[10px] font-normal text-slate-300">
                Total Invoices: {trip.invoices?.length || 0}
              </span>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-left font-bold text-slate-700">
                  <th className="p-2 border-r border-slate-300">Invoice No.</th>
                  <th className="p-2 border-r border-slate-300">Date</th>
                  <th className="p-2 border-r border-slate-300 text-right">Value (₹)</th>
                  <th className="p-2 border-r border-slate-300">E-Way Bill</th>
                  <th className="p-2 border-r border-slate-300 text-center">Packages</th>
                  <th className="p-2 text-right">Weight (KG)</th>
                </tr>
              </thead>
              <tbody>
                {trip.invoices && trip.invoices.length > 0 ? (
                  trip.invoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="border-b border-slate-200">
                      <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">
                        {inv.invoiceNo}
                      </td>
                      <td className="p-2 text-slate-700 border-r border-slate-200">{formatDate(inv.invoiceDate)}</td>
                      <td className="p-2 text-slate-900 text-right border-r border-slate-200 font-mono">
                        ₹{Number(inv.invoiceValue || 0).toLocaleString()}
                      </td>
                      <td className="p-2 font-mono text-slate-800 border-r border-slate-200">
                        {inv.ewaybillNo || '—'}
                      </td>
                      <td className="p-2 text-center text-slate-800 border-r border-slate-200">
                        {inv.packageCount || 0}
                      </td>
                      <td className="p-2 text-right font-semibold text-slate-900">
                        {Number(inv.weightKg || 0).toLocaleString()} KG
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                      Consignment manifest will be attached upon loading.
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={2} className="p-2 border-r border-slate-300">
                    Consignment Manifest Total:
                  </td>
                  <td className="p-2 text-right border-r border-slate-300 font-mono">
                    ₹{totals.totalValue.toLocaleString()}
                  </td>
                  <td className="p-2 border-r border-slate-300"></td>
                  <td className="p-2 text-center border-r border-slate-300">
                    {totals.totalPackages.toLocaleString()} Pkgs
                  </td>
                  <td className="p-2 text-right font-mono">
                    {totals.totalWeightKg.toLocaleString()} KG
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section: Commercial Summary */}
          <div className="mb-4">
            <div className="bg-slate-800 text-white px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-t">
              Commercial Terms
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-left font-bold text-slate-700">
                  <th className="p-2 border-r border-slate-300">Basic Freight</th>
                  <th className="p-2 border-r border-slate-300">Detention Terms</th>
                  <th className="p-2 border-r border-slate-300">Other / Toll Charges</th>
                  <th className="p-2 text-right">Total Payable</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-200">
                    ₹{Number(trip.basicFreight || 0).toLocaleString()}
                    <span className="text-[10px] text-slate-500 block font-normal">
                      ({trip.freightCalculationMode})
                    </span>
                  </td>
                  <td className="p-2 font-bold text-amber-800 border-r border-slate-200">
                    ₹{Number(trip.detentionRatePerDay || 3500).toLocaleString()} / Day
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Free Time: {trip.detentionFreeHours || 5} Hours
                    </span>
                  </td>
                  <td className="p-2 font-mono text-slate-800 border-r border-slate-200">
                    ₹{Number((trip.loadingCharges || 0) + (trip.unloadingCharges || 0) + (trip.tollCharges || 0) + (trip.otherCharges || 0)).toLocaleString()}
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Toll: ₹{trip.tollCharges || 0}
                    </span>
                  </td>
                  <td className="p-2 text-right font-mono font-black text-slate-950 text-sm">
                    ₹{Number(trip.totalAmount || 0).toLocaleString()}
                    <span className="text-[10px] text-slate-500 block font-normal">
                      (Incl. GST @ {trip.gstRate || 18}%)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer / Loading Instructions */}
          {(trip.customerInstructions || trip.loadingInstructions) && (
            <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              {trip.customerInstructions && (
                <div className="mb-1">
                  <span className="font-bold text-slate-800">Customer Instructions: </span>
                  <span className="text-slate-700">{trip.customerInstructions}</span>
                </div>
              )}
              {trip.loadingInstructions && (
                <div>
                  <span className="font-bold text-slate-800">Loading/Handling Instructions: </span>
                  <span className="text-slate-700">{trip.loadingInstructions}</span>
                </div>
              )}
            </div>
          )}

          {/* Section 16: PRINTED TERMS & CONDITIONS (Official 11 Rules) */}
          <div className="mb-6 border-t border-slate-300 pt-3">
            <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wider">
              Terms &amp; Conditions
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-[10px] text-slate-600 leading-tight">
              <li>Vehicle will be placed as per the confirmed booking and approved vehicle type/capacity.</li>
              <li>Loading and unloading shall be in the customer's scope, including required manpower/equipment.</li>
              <li>
                If the vehicle is not loaded/unloaded within 5 hours from reporting/reaching the applicable location,
                detention of ₹3,500 per day shall be applicable, unless otherwise agreed.
              </li>
              <li>Arrival, waiting and departure time may be established through GPS, gate entry, POD or other available records.</li>
              <li>Any additional kilometres, route diversion, additional touch point or change in delivery location shall be chargeable separately.</li>
              <li>Customer shall ensure correct invoice, E-Way Bill and required transport documents.</li>
              <li>Delays caused by documentation, customer instructions, loading/unloading or consignee/site restrictions shall be treated as customer-side delay.</li>
              <li>Re-delivery or additional delivery location shall attract applicable additional charges.</li>
              <li>Cancellation after vehicle placement/reporting may attract applicable cancellation/dead-run/waiting charges.</li>
              <li>GST and applicable statutory charges shall be charged as per law.</li>
              <li>Confirmation of this Trip Booking shall constitute acceptance of the above terms unless otherwise agreed in writing.</li>
            </ol>
          </div>

          {/* Section 17: SIGNATURE SECTION */}
          <div className="border-t-2 border-slate-900 pt-4 mt-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                  <span className="font-mono text-slate-400 text-[10px]">{trip.bookedBy || 'Operations Desk'}</span>
                </div>
                <div className="font-bold text-slate-900 uppercase text-xs">Prepared By</div>
                <div className="text-[11px] text-slate-600">Name: {trip.bookedBy || 'Vikram Joshi'}</div>
                <div className="text-[11px] text-slate-600">Date: {formatDate(trip.bookingDatetime)}</div>
              </div>

              <div>
                <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                  <span className="font-mono text-slate-400 text-[10px]">{trip.approvedBy || 'Operations Lead'}</span>
                </div>
                <div className="font-bold text-slate-900 uppercase text-xs">Approved By</div>
                <div className="text-[11px] text-slate-600">Name: {trip.approvedBy || 'Rajiv Mehra'}</div>
                <div className="text-[11px] text-slate-600">Date: {formatDate(trip.updatedAt || trip.bookingDatetime)}</div>
              </div>

              <div>
                <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center pb-1">
                  <span className="font-mono text-slate-300 text-[10px]">[Authorized Signatory Stamp]</span>
                </div>
                <div className="font-bold text-slate-900 uppercase text-xs">Customer Acceptance</div>
                <div className="text-[11px] text-slate-600">Name: ______________________</div>
                <div className="text-[11px] text-slate-600">Date: ______________________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
