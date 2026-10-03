import React from 'react';
import { UserRole } from '../types';
import { Truck, Shield, Bell, UserCircle2, Clock } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: string;
  onNewBookingClick: () => void;
  activeTripCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onNewBookingClick,
  activeTripCount,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and System Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black tracking-wider shadow">
              <Truck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">BOW LOGISTICS</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  WTMS
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                  TBM-001 • v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                Trip Booking &amp; Transport Management Module
              </p>
            </div>
          </div>

          {/* Center Info / Role Matrix Switcher */}
          <div className="hidden lg:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Role Mode:
            </span>
            <div className="flex items-center space-x-1">
              {(['Operator', 'Supervisor', 'Manager', 'Admin'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => onRoleChange(role)}
                  className={`text-xs px-2.5 py-1 rounded transition-all font-medium ${
                    currentRole === role
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={`Switch active persona to ${role} (tests permissions)`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNewBookingClick}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm px-3.5 py-2 rounded-md shadow flex items-center gap-1.5 transition-colors"
            >
              <span>+</span>
              <span>New Trip</span>
            </button>

            {/* User Info Badge */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-700 text-right">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-white leading-tight">{currentUser}</div>
                <div className="text-[10px] text-amber-400/90 font-mono flex items-center justify-end gap-1">
                  <span>Pune Hub</span>
                  <span>•</span>
                  <span className="font-bold">{currentRole}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Role Switcher Bar */}
      <div className="lg:hidden bg-slate-800/90 px-4 py-1.5 border-t border-slate-700 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Active Role:</span>
        <div className="flex space-x-1">
          {(['Operator', 'Supervisor', 'Manager', 'Admin'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => onRoleChange(role)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                currentRole === role
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
