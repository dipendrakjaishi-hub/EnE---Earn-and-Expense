import React, { useState, useEffect } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { generateKYCStaffCode } from '../../api/supabaseClient';
import { cn } from '../../lib/utils';
import SelfieVerificationModal from './SelfieVerificationModal';
import UserProfileModal from './UserProfileModal';
import { 
  Play, 
  Square, 
  Coffee, 
  MapPin, 
  Clock, 
  DollarSign, 
  Shield, 
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Camera,
  ShieldCheck,
  Settings,
  User as UserIcon,
  Zap
} from 'lucide-react';

interface ClockInOutCardProps {
  onManualShiftClick: () => void;
}

export default function ClockInOutCard({ onManualShiftClick }: ClockInOutCardProps) {
  const { 
    currentUser, 
    currentBusiness, 
    membership, 
    jobSites,
    activeShift, 
    clockIn, 
    startBreak, 
    endBreak, 
    clockOut,
    allowEmployerEdit,
    setAllowEmployerEdit,
    isOnline
  } = useCrewPulse();

  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Verification modal state
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'clock_in' | 'clock_out'>('clock_in');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Set default selected site when jobSites load
  useEffect(() => {
    if (jobSites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(jobSites[0].id);
    }
  }, [jobSites, selectedSiteId]);

  const activeJobSite = jobSites.find(s => s.id === selectedSiteId) || jobSites[0] || {
    id: 'default',
    business_id: currentBusiness?.id || 'biz-1',
    name: 'Central London Venue',
    address: 'Strand, London WC2R 1LA',
    latitude: 51.5113,
    longitude: -0.1171,
    radius_meters: 20,
    created_at: new Date().toISOString()
  };

  // Ticking timer for active shift
  useEffect(() => {
    if (!activeShift) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeShift.clock_in).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeShift]);

  const formatElapsedTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currencySymbol = currentBusiness?.currency === 'GBP' ? '£' : currentBusiness?.currency === 'EUR' ? '€' : '$';
  const hourlyRate = membership?.custom_hourly_rate ?? currentBusiness?.default_hourly_rate ?? 15.00;
  const currentEarned = ((elapsedSeconds / 3600) * hourlyRate).toFixed(2);

  // Open selfie & geofence modal for Clock In
  const handleInitiateClockIn = () => {
    setVerificationMode('clock_in');
    setIsVerificationOpen(true);
  };

  // Open selfie & geofence modal for Clock Out
  const handleInitiateClockOut = () => {
    setVerificationMode('clock_out');
    setIsVerificationOpen(true);
  };

  // Handle verified selfie & GPS geofence submission
  const handleVerifiedSubmit = async (data: {
    selfieUrl: string;
    distanceMeters: number;
    isGeofenceVerified: boolean;
    locationLat: number;
    locationLng: number;
  }) => {
    if (verificationMode === 'clock_in') {
      await clockIn({
        jobSite: activeJobSite.name,
        jobSiteId: activeJobSite.id,
        notes,
        captureGps: true,
        clockInSelfie: data.selfieUrl,
        distanceFromSiteMeters: data.distanceMeters,
        isGeofenceVerified: data.isGeofenceVerified,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        locationAddress: activeJobSite.address
      });
      setNotes('');
    } else {
      await clockOut({
        notes,
        clockOutSelfie: data.selfieUrl,
        distanceFromSiteMeters: data.distanceMeters,
        isGeofenceVerified: data.isGeofenceVerified
      });
      setNotes('');
    }
  };

  const isOnBreak = activeShift?.status === 'break';

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-white">
      {/* Background glow decoration */}
      <div className={cn(
        "absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700",
        activeShift 
          ? isOnBreak ? "bg-amber-500/20" : "bg-emerald-500/20"
          : "bg-cyan-500/10"
      )} />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-3 text-left group hover:opacity-95 transition-all cursor-pointer p-1 -m-1 rounded-2xl hover:bg-slate-800/40"
          title="Click to view & edit Profile, Wallpapers, Contact Info & Rates"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 overflow-hidden group-hover:border-cyan-400 transition-colors">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser.full_name.charAt(0)
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 border border-slate-900 flex items-center justify-center shadow">
              <Settings className="w-2.5 h-2.5 text-slate-950" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 group-hover:text-cyan-300 transition-colors">
              {currentUser.full_name}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {membership?.role?.toUpperCase() || 'WORKER'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20" title="Your unique company staff ID">
                {currentUser.employee_id || generateKYCStaffCode(currentUser.full_name, currentUser.dob, currentUser.kyc_location_code)}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Assigned Base: <span className="text-slate-200 font-semibold">{currencySymbol}{hourlyRate.toFixed(2)}/hr</span>
              <span className="text-[10px] text-cyan-400 ml-1.5 underline underline-offset-2 opacity-0 group-hover:opacity-100 transition-opacity">Edit Profile</span>
            </p>
          </div>
        </button>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border",
            activeShift
              ? isOnBreak
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/20"
              : "bg-slate-800 text-slate-400 border-slate-700"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              activeShift 
                ? isOnBreak ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping"
                : "bg-slate-500"
            )} />
            {activeShift ? (isOnBreak ? 'On Break' : 'Clocked In') : 'Not Working'}
          </div>
        </div>
      </div>

      {/* Main Clock Action Section */}
      {!activeShift ? (
        /* IDLE STATE: PROMPT TO CLOCK IN */
        <div className="space-y-5 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 block">
                  Site / Job Location
                </label>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {activeJobSite.radius_meters || 20}m Pinned Perimeter
                </span>
              </div>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                {jobSites.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.radius_meters}m geofence)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Shift Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lead bartender, Section B cleanup..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Verification Protocol Banner (Selfie + 20m Geofence) */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 mt-0.5 flex-shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-extrabold text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>On-Site Verification Required</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Clocking in requires front selfie camera capture and GPS position inside the pinned venue perimeter (strictly within <strong>{activeJobSite.radius_meters || 20} meters</strong>).
              </p>
            </div>
          </div>

          {/* Offline 24-Hour Guarantee Notice */}
          {!isOnline && (
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                <span className="font-semibold">
                  ⚡ Offline Mode Active: Clock in safely without internet. Punch is recorded locally and will auto-upload within 24 hours.
                </span>
              </div>
            </div>
          )}

          {/* Giant Clock In Button (Triggers Selfie & Geofence Verification) */}
          <button
            onClick={handleInitiateClockIn}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-lg tracking-wide shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span>VERIFY SELFIE &amp; CLOCK IN</span>
          </button>

          {/* Manual Entry Secondary Option */}
          <div className="text-center pt-1">
            <button
              onClick={onManualShiftClick}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium underline underline-offset-4"
            >
              Missed a past shift? Log manual shift entry
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE CLOCKED-IN / BREAK STATE */
        <div className="space-y-6 relative z-10">
          {/* Big Live Digital Clock */}
          <div className="text-center py-4 px-6 rounded-2xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
            {/* Live Overtime Multiplier Banner */}
            {(() => {
              const otThresholdSecs = (currentBusiness?.overtime_threshold_hours || 8) * 3600;
              const isOvertimeActive = elapsedSeconds > otThresholdSecs;
              const otMultiplier = currentBusiness?.overtime_rate_multiplier || 1.5;
              const currentHour = new Date().getHours();
              const isNightShift = currentHour >= 22 || currentHour < 6;
              const nightBonus = currentBusiness?.night_shift_bonus_rate || 2.00;

              return (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                  {isOvertimeActive && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider animate-pulse shadow-sm shadow-amber-500/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ OVERTIME ACTIVE ({otMultiplier}x @ {currencySymbol}{(hourlyRate * otMultiplier).toFixed(2)}/hr)</span>
                    </span>
                  )}

                  {isNightShift && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                      <span>🌙 Night Premium (+{currencySymbol}{nightBonus.toFixed(2)}/hr)</span>
                    </span>
                  )}
                </div>
              );
            })()}

            {activeShift.is_offline_recorded && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ Offline Shift (Auto-syncs within 24h when online)</span>
                </span>
              </div>
            )}

            <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">
              {isOnBreak ? 'Break Elapsed Time' : 'Shift Duration'}
            </p>
            <h1 className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white mb-2">
              {formatElapsedTime(elapsedSeconds)}
            </h1>
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="text-slate-400">
                Started: <strong className="text-slate-200">{new Date(activeShift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-bold">
                Estimated Pay: {currencySymbol}{currentEarned}
              </span>
            </div>
            {activeShift.job_site && (
              <p className="mt-2 text-xs text-slate-400 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                {activeShift.job_site}
                {activeShift.is_geofence_verified && (
                  <span className="text-[10px] text-emerald-400 font-bold ml-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    20m GPS Verified
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Action Buttons: Break & Clock Out */}
          <div className="grid grid-cols-2 gap-3">
            {isOnBreak ? (
              <button
                onClick={endBreak}
                className="py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                RESUME SHIFT
              </button>
            ) : (
              <button
                onClick={startBreak}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm tracking-wide transition-all border border-slate-700 active:scale-95 flex items-center justify-center gap-2"
              >
                <Coffee className="w-4 h-4" />
                TAKE BREAK
              </button>
            )}

            <button
              onClick={handleInitiateClockOut}
              className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide transition-all shadow-lg shadow-rose-600/25 active:scale-95 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>SELFIE &amp; CLOCK OUT</span>
            </button>
          </div>
        </div>
      )}

      {/* WORKER PERMISSION TOGGLE (Strictly requested by User) */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "p-1.5 rounded-lg mt-0.5",
            allowEmployerEdit ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-400"
          )}>
            {allowEmployerEdit ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">
              Allow employer to edit my shifts
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              {allowEmployerEdit 
                ? 'Enabled: Employer can correct your hours. All changes recorded in audit log.' 
                : 'Default (Locked): Only you can modify your recorded shift hours.'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={allowEmployerEdit}
            onChange={(e) => setAllowEmployerEdit(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {/* Front Camera Selfie & 20m Geofence Verification Modal */}
      <SelfieVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        mode={verificationMode}
        site={activeJobSite}
        userName={currentUser.full_name}
        onVerified={handleVerifiedSubmit}
      />

      {/* Staff Profile & Wallpapers Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
