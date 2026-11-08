import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { UserRole } from '../../types/crewpulse';
import { cn } from '../../lib/utils';
import { 
  ShieldCheck, 
  User, 
  Briefcase, 
  Building, 
  ChevronDown, 
  Copy, 
  Check, 
  Plus, 
  Share2,
  Sparkles,
  Smartphone,
  LogOut,
  Building2,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import OfflineSyncBanner from './OfflineSyncBanner';

interface RoleSwitcherBarProps {
  onOpenInviteModal?: () => void;
  onOpenBusinessModal?: () => void;
  onOpenProfileModal?: () => void;
  isMobileSimulator?: boolean;
  onToggleMobileSimulator?: () => void;
}

export default function RoleSwitcherBar({ 
  onOpenInviteModal, 
  onOpenBusinessModal, 
  onOpenProfileModal,
  isMobileSimulator,
  onToggleMobileSimulator
}: RoleSwitcherBarProps) {
  const { 
    currentUser, 
    setCurrentUser, 
    allProfiles, 
    currentBusiness, 
    businesses, 
    setCurrentBusiness,
    membership,
    logout
  } = useCrewPulse();

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!currentBusiness?.invite_code) return;
    navigator.clipboard.writeText(currentBusiness.invite_code);
    setCopied(true);
    toast.success(`Invite code "${currentBusiness.invite_code}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 text-white backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Business Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-sm tracking-tighter shadow-md shadow-cyan-500/20">
              CP
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                CrewPulse
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  PHASE 1
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Shift & Rota Tracking</p>
            </div>
          </div>

        </div>

        {/* HOTEL / ORGANISATION NAME (REPLACING TEAM CODE & SHARE LINK AS REQUESTED)
            Shows the hotel name (e.g. Grand Horizon Hotel, The Savoy, etc.) or organisation name */}
        <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs shadow-sm min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-none">
              Hotel / Organisation:
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {businesses.length > 1 ? (
                <div className="flex items-center gap-1">
                  <select
                    value={currentBusiness?.id || ''}
                    onChange={(e) => {
                      const sel = businesses.find(b => b.id === e.target.value);
                      if (sel) setCurrentBusiness(sel);
                    }}
                    className="bg-transparent border-none text-xs sm:text-sm font-black text-white outline-none cursor-pointer hover:text-cyan-300 transition-colors p-0 font-sans truncate max-w-[170px] sm:max-w-[260px]"
                    title="Switch Hotel / Organisation"
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white font-bold">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none -ml-1" />
                </div>
              ) : (
                <span className="font-black text-xs sm:text-sm text-white tracking-tight truncate max-w-[170px] sm:max-w-[260px]">
                  {currentBusiness?.name || 'Grand Heritage Hotel'}
                </span>
              )}

              {onOpenBusinessModal && (membership?.role === 'employer' || membership?.role === 'manager') && (
                <button
                  type="button"
                  onClick={onOpenBusinessModal}
                  className="p-1 rounded hover:bg-slate-700 text-cyan-400 hover:text-white transition-colors"
                  title="Rename Hotel / Edit Business Settings"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ROLE BADGE IN EXACT LOCATION DRAWN BY USER IN SCREENSHOT (YELLOW BOX):
            Shows "Management Team" if management/employer logs in, or "Normal Staff" if staff logs in */}
        {membership?.role === 'employer' || membership?.role === 'manager' ? (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/90 via-purple-900/80 to-indigo-950/90 border border-purple-500/50 text-purple-200 text-xs font-black shadow-md shadow-purple-950/50 tracking-wide"
            title="Logged in as: Management Team (Employer, Director, CEO, Operations Manager)"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="whitespace-nowrap">Management Team</span>
          </div>
        ) : (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-teal-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-black shadow-md shadow-emerald-950/50 tracking-wide"
            title="Logged in as: Normal Staff (On-site Worker)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="whitespace-nowrap">Normal Staff</span>
          </div>
        )}

        {/* 24-Hour Offline & Auto-Sync Status Indicator */}
        <OfflineSyncBanner />

        {/* Authenticated User Identity Pill & Persona Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white overflow-hidden shadow-sm flex-shrink-0">
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{currentUser.full_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          
          {/* Persona selector to easily view all features as staff or management */}
          <div className="flex items-center gap-1.5">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const sel = allProfiles.find(p => p.id === e.target.value);
                if (sel) {
                  setCurrentUser(sel);
                  toast.success(`Switched account to ${sel.full_name} (${sel.employee_id})`);
                }
              }}
              className="bg-slate-900 border border-slate-700/80 text-xs font-bold text-cyan-300 rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-cyan-500 transition-colors"
              title="Switch user account to view staff vs management features"
            >
              {allProfiles.map(p => {
                const isMgmt = p.email?.includes('elena') || p.email?.includes('marcus');
                return (
                  <option key={p.id} value={p.id}>
                    {isMgmt ? '🛡️ ' : '📱 '} {p.full_name} ({p.employee_id})
                  </option>
                );
              })}
            </select>

            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold border border-slate-700 transition-colors"
                title="View & Edit My Profile"
              >
                Profile
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Mobile Phone Simulator Toggle & Sign Out */}
        <div className="flex items-center gap-2">

          {/* Interactive Mobile Phone Simulator Toggle */}
          {onToggleMobileSimulator && (
            <button
              type="button"
              onClick={onToggleMobileSimulator}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer active:scale-95",
                isMobileSimulator
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-cyan-600/30"
                  : "bg-slate-800/90 text-cyan-300 hover:text-white border-slate-700 hover:bg-slate-700"
              )}
              title={isMobileSimulator ? "Exit phone frame view" : "See how this looks on staff's mobile phone"}
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isMobileSimulator ? 'Exit Phone' : '📱 Phone View'}</span>
            </button>
          )}

          {/* Log Out Button */}
          <button
            type="button"
            onClick={() => {
              logout();
              toast.info('Signed out successfully.');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95"
            title="Sign out of CrewPulse"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
