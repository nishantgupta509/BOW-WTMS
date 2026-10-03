import React from 'react';
import { TripStatus } from '../types';
import {
  FileText,
  Truck,
  PlusCircle,
  FileCheck2,
  Send,
  Navigation,
  CheckCircle2,
  Clock,
  Archive,
  Ban,
  Activity,
  Receipt,
  BarChart3,
  Database,
  ChevronDown,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export type MainNavView =
  | 'booking-form'
  | 'trip-list'
  | 'operations-live'
  | 'detention-center'
  | 'pod-desk'
  | 'billing-center'
  | 'reports'
  | 'master-data';

interface SidebarProps {
  currentView: MainNavView;
  onSelectView: (view: MainNavView) => void;
  statusFilter: TripStatus | 'ALL';
  onSelectStatusFilter: (status: TripStatus | 'ALL') => void;
  tripCountsByStatus: Record<string, number>;
  onNewBookingClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  statusFilter,
  onSelectStatusFilter,
  tripCountsByStatus,
  onNewBookingClick,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={onNewBookingClick}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-3 rounded-lg shadow flex items-center justify-center gap-2 text-sm transition-all"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>New Trip Booking</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6 text-xs">
        {/* Section 1: Trip Booking Sub-module */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              1. Trip Booking
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">TBM-001</span>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => {
                onSelectView('trip-list');
                onSelectStatusFilter('ALL');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors ${
                currentView === 'trip-list' && statusFilter === 'ALL'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                  : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                <span>All Bookings</span>
              </div>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                {tripCountsByStatus['ALL'] || 0}
              </span>
            </button>

            {[
              { status: 'Draft', label: 'Draft Trips', icon: Clock },
              { status: 'Booked', label: 'Booked Trips', icon: FileCheck2 },
              { status: 'Vehicle Assigned', label: 'Vehicle Assigned', icon: Truck },
              { status: 'Dispatched', label: 'Dispatched', icon: Send },
              { status: 'In Transit', label: 'In Transit', icon: Navigation },
              { status: 'Delivered', label: 'Delivered / Arrived', icon: CheckCircle2 },
              { status: 'Closed', label: 'Closed Trips', icon: Archive },
              { status: 'Cancelled', label: 'Cancelled Trips', icon: Ban },
            ].map((item) => {
              const Icon = item.icon;
              const count = tripCountsByStatus[item.status] || 0;
              const isActive = currentView === 'trip-list' && statusFilter === item.status;

              return (
                <button
                  key={item.status}
                  onClick={() => {
                    onSelectView('trip-list');
                    onSelectStatusFilter(item.status as TripStatus);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                      : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        item.status === 'Cancelled'
                          ? 'bg-red-500/20 text-red-400'
                          : item.status === 'In Transit'
                          ? 'bg-blue-500/20 text-blue-400 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Trip Operations */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Trip Operations</span>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('operations-live')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors ${
                currentView === 'operations-live'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                  : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Fleet &amp; GPS</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
            </button>

            <button
              onClick={() => onSelectView('detention-center')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors ${
                currentView === 'detention-center'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                  : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Detention Tracker</span>
              </div>
              <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
                5h Free
              </span>
            </button>

            <button
              onClick={() => onSelectView('pod-desk')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors ${
                currentView === 'pod-desk'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                  : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>POD Verification</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Billing & Commercials */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Commercial Billing</span>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('billing-center')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors ${
                currentView === 'billing-center'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                  : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                <span>Billable Trips &amp; Invoices</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section 4: Reports & Analytics */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
            <span>4. Reports &amp; Registers</span>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('reports')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors ${
                currentView === 'reports'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                  : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                <span>WTMS Operational Reports</span>
              </div>
            </button>
          </div>
        </div>

        {/* Section 5: Master Data */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>5. Master Data</span>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => onSelectView('master-data')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md font-medium transition-colors ${
                currentView === 'master-data'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                  : 'hover:bg-slate-800/70 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Customers, Fleet, Lanes</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-slate-400">BOW WTMS Core</span>
          <span className="text-emerald-400 font-mono text-[10px]">Connected</span>
        </div>
        <div className="text-[10px] text-slate-500">
          BOW Logistics Pvt. Ltd. Transport ERP
        </div>
      </div>
    </aside>
  );
};
