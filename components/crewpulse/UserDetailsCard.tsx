import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { generateKYCStaffCode } from '../../api/supabaseClient';
import { formatCurrency, cn } from '../../lib/utils';
import DigitalStaffIdCard from './DigitalStaffIdCard';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  BadgeCheck, 
  ShieldCheck, 
  Lock, 
  Copy, 
  Check, 
  Edit3, 
  Clock, 
  TrendingUp, 
  Building,
  Smartphone,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface UserDetailsCardProps {
  onOpenEditProfile: () => void;
  onNavigateToShifts?: () => void;
  onOpenExportTimesheet?: () => void;
}

export default function UserDetailsCard({ 
  onOpenEditProfile, 
  onNavigateToShifts,
  onOpenExportTimesheet
}: UserDetailsCardProps) {
  const { currentUser, currentBusiness, membership, shifts } = useCrewPulse();
  const [copiedId, setCopiedId] = useState(false);

  const role = membership?.role || 'employee';
  const isEmployer = role === 'employer';
  const isManager = role === 'manager';
  const isStaff = !isEmployer && !isManager;

  const staffId = currentUser.employee_id || generateKYCStaffCode(currentUser.full_name, currentUser.dob, currentUser.kyc_location_code);
  const currency = currentBusiness?.currency || 'GBP';

  // Stats for this user only
  const myShifts = shifts.filter(s => s.user_id === currentUser.id);
  const myCompletedShifts = myShifts.filter(s => s.status === 'completed');
  const myTotalHours = myCompletedShifts.reduce((acc, s) => acc + (s.total_hours || 0), 0);
  const myTotalEarnings = myCompletedShifts.reduce((acc, s) => acc + (s.estimated_pay || 0), 0);
  const activeShift = myShifts.find(s => s.status === 'active' || s.status === 'break');

  const handleCopyId = () => {
    navigator.clipboard.writeText(staffId);
    setCopiedId(true);
    toast.success(`Staff ID "${staffId}" copied to clipboard!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Format DOB display e.g. "21 Feb 1998"
  const formattedDob = currentUser.dob ? (() => {
    try {
      const d = new Date(currentUser.dob);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return currentUser.dob;
    }
  })() : '21 Feb 1998';

  return (
    <div className="w-full space-y-4">
      {/* Main Official User Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        
        {/* Top Header: Avatar, Name, Role & Edit Button */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-xl shadow-cyan-500/20">
                {currentUser.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt={currentUser.full_name} 
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white rounded-[14px] bg-slate-900">
                    {currentUser.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <span className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-md",
                activeShift ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
              )}>
                {activeShift ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : (
                  <User className="w-2.5 h-2.5" />
                )}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentUser.full_name}
                </h2>
                {isEmployer || isManager ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-400" />
                    {isEmployer ? 'Employer (CEO / Director / Owner)' : 'Management (Operations Manager)'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-400" />
                    Employee (Worker)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentBusiness?.name || 'Organisation'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Personal Staff Portal</span>
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={onOpenEditProfile}
            className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-sm ml-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Personal Details</span>
          </button>
        </div>

        {/* =========================================================================
            OFFICIAL DIGITAL STAFF ID CARD AREA (REQUESTED BY USER IN YELLOW BOX)
            Banking-app card style with Full Name, Working Right (Full/Part Time),
            Organisation, Working Post, Profile photo, and Unique ID QR Code
            ========================================================================= */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                Official Digital Staff ID Card (KYC Verified)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Digital Pass
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Banking-style card • Scan QR for gate verification
            </span>
          </div>

          <DigitalStaffIdCard 
            profile={currentUser}
            businessName={currentBusiness?.name || 'Organisation'}
            onOpenEditProfile={onOpenEditProfile}
          />
        </div>

        {/* Detailed User Information Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Gmail / Email */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-cyan-400" />
              Gmail / Work Email
            </span>
            <span className="font-semibold text-white truncate block">
              {currentUser.email}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Used for login</span>
          </div>

          {/* Phone Number */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-cyan-400" />
              Phone Number
            </span>
            <span className="font-semibold text-white block">
              {currentUser.phone || '+44 7700 900333'}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Editable by you</span>
          </div>

          {/* Date of Birth & Age */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              Date of Birth (DDMM)
            </span>
            <span className="font-semibold text-white block">
              {formattedDob}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Generates ID digits</span>
          </div>

          {/* Assigned Hourly Rate */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Assigned Hourly Rate
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm block">
              {formatCurrency(15.50, currency)}/hr
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Locked by management</span>
          </div>
        </div>

        {/* Shift Summary & Quick Tracker Action */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Shift Status</span>
              <span className={cn(
                "font-bold flex items-center gap-1 mt-0.5",
                activeShift ? "text-emerald-400" : "text-slate-400"
              )}>
                <span className={cn("w-2 h-2 rounded-full", activeShift ? "bg-emerald-400 animate-pulse" : "bg-slate-600")} />
                {activeShift ? 'Currently Working' : 'Not Working / Off Shift'}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">My Logged Hours</span>
              <span className="font-mono font-bold text-white mt-0.5 block">
                {myTotalHours.toFixed(1)} hrs ({formatCurrency(myTotalEarnings, currency)})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenExportTimesheet && (
              <button
                type="button"
                onClick={onOpenExportTimesheet}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Timesheet &amp; Payslip</span>
              </button>
            )}

            {onNavigateToShifts && (
              <button
                type="button"
                onClick={onNavigateToShifts}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Clock In &amp; Shifts →</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
