import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { ScheduledShift, ShiftScheduleStatus, ShiftSwapRequest } from '../../types/crewpulse';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  User, 
  Shirt, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Filter, 
  Send,
  Building,
  Check,
  X,
  Sparkles,
  ArrowLeftRight,
  Hand,
  Users,
  RefreshCw,
  BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function UpcomingRotaSchedule() {
  const { 
    scheduledShifts, 
    currentUser, 
    allProfiles, 
    jobSites, 
    currentBusiness, 
    membership, 
    confirmScheduledShift, 
    declineScheduledShift, 
    createScheduledShift, 
    deleteScheduledShift,
    swapRequests,
    createShiftSwapRequest,
    claimShiftCover,
    cancelShiftSwap,
    approveShiftSwap,
    rejectShiftSwap
  } = useCrewPulse();

  const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';
  const currency = currentBusiness?.currency || 'GBP';

  // Sub-tab: Schedule Rota vs Swap & Cover Board
  const [activeRotaView, setActiveRotaView] = useState<'rota' | 'swaps'>('rota');

  // Management filter state
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Decline shift modal state
  const [declineTargetShiftId, setDeclineTargetShiftId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('Personal / family commitment');
  const [isDeclining, setIsDeclining] = useState(false);
  const [isConfirmingId, setIsConfirmingId] = useState<string | null>(null);

  // Shift Swap / Cover Request Modal State
  const [swapModalShift, setSwapModalShift] = useState<ScheduledShift | null>(null);
  const [swapType, setSwapType] = useState<'cover' | 'swap'>('cover');
  const [swapColleagueId, setSwapColleagueId] = useState<string>('');
  const [swapReason, setSwapReason] = useState<string>('Personal schedule clash / study commitment');
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);

  // Claiming cover loading state
  const [claimingSwapId, setClaimingSwapId] = useState<string | null>(null);

  // New Shift Form State
  const [newShiftStaffId, setNewShiftStaffId] = useState<string>(allProfiles[0]?.id || '');
  const [newShiftSite, setNewShiftSite] = useState<string>(jobSites[0]?.name || 'Somerset House Gala');
  const [newShiftDate, setNewShiftDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [newShiftStartTime, setNewShiftStartTime] = useState<string>('14:00');
  const [newShiftEndTime, setNewShiftEndTime] = useState<string>('22:00');
  const [newShiftRole, setNewShiftRole] = useState<string>('Senior Banquet Bartender');
  const [newShiftRate, setNewShiftRate] = useState<number>(currentBusiness?.default_hourly_rate || 15.50);
  const [newShiftUniform, setNewShiftUniform] = useState<string>('Full Black: Tailored trousers, long sleeve shirt, black polished shoes.');
  const [newShiftNotes, setNewShiftNotes] = useState<string>('Report to staff briefing room 15 minutes before shift starts.');
  const [isSubmittingNewShift, setIsSubmittingNewShift] = useState(false);

  // Filter shifts based on role & active filters
  const shiftsToDisplay = scheduledShifts.filter(s => {
    // Staff only ever see their own shifts in the rota view
    if (!isManagerOrOwner && s.user_id !== currentUser.id) {
      return false;
    }
    // Management filters
    if (isManagerOrOwner) {
      if (selectedStaffFilter !== 'all' && s.user_id !== selectedStaffFilter) return false;
      if (selectedStatusFilter !== 'all' && s.status !== selectedStatusFilter) return false;
    }
    return true;
  });

  // Calculate high-level summary metrics
  const totalShiftsCount = shiftsToDisplay.length;
  const confirmedCount = shiftsToDisplay.filter(s => s.status === 'confirmed').length;
  const awaitingCount = shiftsToDisplay.filter(s => s.status === 'scheduled').length;

  const totalScheduledHours = shiftsToDisplay.reduce((acc, s) => {
    const start = new Date(s.start_time).getTime();
    const end = new Date(s.end_time).getTime();
    const hours = Math.max(0, (end - start) / 3600000);
    return acc + hours;
  }, 0);

  const totalEstimatedCost = shiftsToDisplay.reduce((acc, s) => {
    const start = new Date(s.start_time).getTime();
    const end = new Date(s.end_time).getTime();
    const hours = Math.max(0, (end - start) / 3600000);
    const rate = s.hourly_rate || currentBusiness?.default_hourly_rate || 14.50;
    return acc + (hours * rate);
  }, 0);

  // Active cover/swap requests metrics
  const openCoverRequests = swapRequests.filter(r => r.status === 'open');
  const pendingManagerSwaps = swapRequests.filter(r => r.status === 'peer_accepted');
  const approvedSwaps = swapRequests.filter(r => r.status === 'approved');

  const handleConfirmShift = async (shiftId: string) => {
    setIsConfirmingId(shiftId);
    try {
      await confirmScheduledShift(shiftId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm shift');
    } finally {
      setIsConfirmingId(null);
    }
  };

  const handleDeclineShift = async () => {
    if (!declineTargetShiftId) return;
    setIsDeclining(true);
    try {
      await declineScheduledShift(declineTargetShiftId, declineReason);
      setDeclineTargetShiftId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline shift');
    } finally {
      setIsDeclining(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setIsSubmittingNewShift(true);

    try {
      const startDateTime = `${newShiftDate}T${newShiftStartTime}:00`;
      let endDateTime = `${newShiftDate}T${newShiftEndTime}:00`;

      if (newShiftEndTime <= newShiftStartTime) {
        const nextDay = new Date(newShiftDate);
        nextDay.setDate(nextDay.getDate() + 1);
        endDateTime = `${nextDay.toISOString().split('T')[0]}T${newShiftEndTime}:00`;
      }

      await createScheduledShift({
        user_id: newShiftStaffId || currentUser.id,
        business_id: currentBusiness.id,
        job_site: newShiftSite,
        address: jobSites.find(j => j.name === newShiftSite)?.address || 'London, UK',
        role_title: newShiftRole,
        start_time: startDateTime,
        end_time: endDateTime,
        hourly_rate: Number(newShiftRate),
        uniform_requirements: newShiftUniform,
        notes: newShiftNotes,
        created_by: currentUser.id,
        status: 'scheduled'
      });

      setIsAssignModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shift assignment');
    } finally {
      setIsSubmittingNewShift(false);
    }
  };

  // Submit Shift Swap / Cover Request
  const handleSubmitSwapRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapModalShift) return;
    setIsSubmittingSwap(true);

    try {
      await createShiftSwapRequest({
        scheduledShiftId: swapModalShift.id,
        targetUserId: swapType === 'swap' && swapColleagueId ? swapColleagueId : undefined,
        swapType,
        reason: swapReason
      });
      setSwapModalShift(null);
      setActiveRotaView('swaps');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shift swap request');
    } finally {
      setIsSubmittingSwap(false);
    }
  };

  // Claim Open Cover Request
  const handleClaimCover = async (swapRequestId: string) => {
    setClaimingSwapId(swapRequestId);
    try {
      await claimShiftCover(swapRequestId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim shift cover');
    } finally {
      setClaimingSwapId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {isManagerOrOwner ? 'Management Weekly Rota' : 'My Upcoming Rota'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {currentBusiness?.name || 'Organisation'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isManagerOrOwner ? 'Crew Shift Scheduling & Attendance' : 'Upcoming Assigned Shifts'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              {isManagerOrOwner
                ? 'Assign shifts to verified team members, review peer shift swaps, set uniform requirements, and monitor wage budget.'
                : 'View your rostered shifts, uniform guidelines, request peer shift swaps or cover, and confirm attendance with 1 tap.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isManagerOrOwner && (
              <button
                type="button"
                onClick={() => {
                  setNewShiftStaffId(allProfiles[0]?.id || currentUser.id);
                  setIsAssignModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Shift to Staff</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Bar: Weekly Rota vs Shift Swap & Cover Board */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveRotaView('rota')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                activeRotaView === 'rota' ? "bg-cyan-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isManagerOrOwner ? 'Weekly Rota Schedule' : 'My Upcoming Shifts'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/80 text-cyan-200">
                {totalShiftsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRotaView('swaps')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                activeRotaView === 'swaps' ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-purple-300" />
              <span>Shift Swap &amp; Cover Board</span>
              {openCoverRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-black animate-pulse">
                  {openCoverRequests.length} Open
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {openCoverRequests.length > 0 && (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Hand className="w-3.5 h-3.5" />
                {openCoverRequests.length} shift(s) available for team cover
              </span>
            )}
          </div>
        </div>

        {/* High-Level Rota Metrics Cards (Visible in Rota View) */}
        {activeRotaView === 'rota' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Shifts</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-white">{totalShiftsCount}</span>
                <span className="text-[10px] text-slate-500 font-mono">scheduled</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">Confirmed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-emerald-400">{confirmedCount}</span>
                <span className="text-[10px] text-emerald-500/80 font-mono">
                  {totalShiftsCount > 0 ? `${Math.round((confirmedCount / totalShiftsCount) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">Awaiting Confirmation</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-amber-400">{awaitingCount}</span>
                <span className="text-[10px] text-amber-500/80 font-mono">pending tap</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {isManagerOrOwner ? 'Total Rota Cost' : 'Est. Total Earnings'}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-cyan-400">
                  {formatCurrency(totalEstimatedCost, currency)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">({totalScheduledHours.toFixed(1)} hrs)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW 1: REGULAR ROTA SCHEDULE
          ========================================================================= */}
      {activeRotaView === 'rota' && (
        <div className="space-y-4">
          {/* Management Filters Bar */}
          {isManagerOrOwner && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-xs">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter Rota:
                </span>

                <select
                  value={selectedStaffFilter}
                  onChange={e => setSelectedStaffFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Staff Members ({allProfiles.length})</option>
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.employee_id || 'ID Pending'})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Awaiting Confirmation</option>
                  <option value="confirmed">Confirmed Attendance</option>
                  <option value="declined">Declined Shifts</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-400 font-mono ml-auto">
                Showing <strong className="text-white">{shiftsToDisplay.length}</strong> shifts
              </div>
            </div>
          )}

          {/* Shifts Feed */}
          {shiftsToDisplay.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-white text-base">No upcoming shifts found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isManagerOrOwner 
                  ? 'No scheduled shifts match your active filters. Click "Assign Shift to Staff" above to add new rota assignments.'
                  : 'You have no scheduled upcoming shifts assigned to your unique ID right now.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {shiftsToDisplay.map(shift => {
                const startDate = new Date(shift.start_time);
                const endDate = new Date(shift.end_time);
                const durationHours = Math.max(0, (endDate.getTime() - startDate.getTime()) / 3600000);
                const rate = shift.hourly_rate || currentBusiness?.default_hourly_rate || 14.50;
                const estimatedPay = durationHours * rate;
                const isConfirmed = shift.status === 'confirmed';
                const isDeclined = shift.status === 'declined';
                const isPending = shift.status === 'scheduled';
                const worker = shift.profile || allProfiles.find(p => p.id === shift.user_id);
                const isOwnShift = shift.user_id === currentUser.id;

                // Check if shift has an active swap or cover request
                const activeSwap = swapRequests.find(r => 
                  r.scheduled_shift_id === shift.id && 
                  (r.status === 'open' || r.status === 'peer_accepted')
                );

                return (
                  <div 
                    key={shift.id}
                    className={cn(
                      "p-5 sm:p-6 rounded-3xl border transition-all duration-200 relative overflow-hidden",
                      isConfirmed 
                        ? "bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-950/10" 
                        : isDeclined 
                        ? "bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50" 
                        : "bg-slate-900 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-950/10"
                    )}
                  >
                    {/* Accent top stripe */}
                    <div 
                      className={cn(
                        "absolute top-0 left-0 right-0 h-1",
                        isConfirmed ? "bg-emerald-500" : isDeclined ? "bg-rose-500" : "bg-amber-400"
                      )} 
                    />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Shift Details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Confirmation Badge */}
                          {isConfirmed && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirmed Attendance</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[11px] flex items-center gap-1.5 animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Awaiting Staff Confirmation</span>
                            </span>
                          )}
                          {isDeclined && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[11px] flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Declined</span>
                            </span>
                          )}

                          {/* Swap / Cover Request Badge if active */}
                          {activeSwap && (
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-[11px] flex items-center gap-1.5">
                              <ArrowLeftRight className="w-3 h-3 text-purple-400" />
                              <span>
                                {activeSwap.status === 'open' 
                                  ? 'Cover Requested (Open on Board)' 
                                  : 'Cover Claimed (Awaiting Manager Approval)'}
                              </span>
                            </span>
                          )}

                          {/* Staff Identity (for management view) */}
                          {isManagerOrOwner && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[11px] flex items-center gap-1.5 font-mono">
                              <User className="w-3 h-3 text-cyan-400" />
                              <span>{worker?.full_name || 'Staff'} ({worker?.employee_id || 'ID'})</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-lg sm:text-xl font-black text-white">
                            {startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </h3>
                          <span className="text-cyan-400 font-mono text-sm font-bold">
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            ({durationHours.toFixed(1)} hrs)
                          </span>
                        </div>

                        {/* Venue & Role */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                          <span className="font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            {shift.role_title || 'Hospitality Associate'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            {shift.job_site}
                          </span>
                          <span className="font-mono text-slate-400">
                            Rate: <strong className="text-emerald-400">{formatCurrency(rate, currency)}/hr</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Est Pay & Actions */}
                      <div className="flex flex-wrap items-center lg:flex-col lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Est. Shift Earnings</span>
                          <span className="text-lg sm:text-xl font-black text-emerald-400">
                            {formatCurrency(estimatedPay, currency)}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Staff 1-Click Confirmation Buttons */}
                          {isOwnShift && isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleConfirmShift(shift.id)}
                                disabled={isConfirmingId === shift.id}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{isConfirmingId === shift.id ? 'Confirming...' : 'Confirm'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeclineTargetShiftId(shift.id);
                                  setDeclineReason('Personal / family commitment');
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 font-bold text-xs border border-slate-700 hover:border-rose-500/40 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </>
                          )}

                          {/* Staff: Request Swap / Cover Button */}
                          {isOwnShift && !activeSwap && !isDeclined && (
                            <button
                              type="button"
                              onClick={() => {
                                setSwapModalShift(shift);
                                setSwapType('cover');
                                setSwapColleagueId(allProfiles.find(p => p.id !== currentUser.id)?.id || '');
                                setSwapReason('Personal schedule clash / study commitment');
                              }}
                              className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-xs border border-purple-500/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                              title="Request a colleague to cover or swap this shift"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>Swap / Cover</span>
                            </button>
                          )}

                          {/* Management Remove Button */}
                          {isManagerOrOwner && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to cancel and remove this shift from the rota?')) {
                                  await deleteScheduledShift(shift.id);
                                }
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition-colors"
                              title="Remove shift from rota"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Uniform & Notes Details */}
                    {(shift.uniform_requirements || shift.notes || shift.decline_reason) && (
                      <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {shift.uniform_requirements && (
                          <div className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                            <Shirt className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-300 block">Uniform Requirements:</span>
                              <span className="text-slate-400">{shift.uniform_requirements}</span>
                            </div>
                          </div>
                        )}

                        {shift.notes && (
                          <div className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                            <FileText className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-300 block">Venue / Arrival Notes:</span>
                              <span className="text-slate-400">{shift.notes}</span>
                            </div>
                          </div>
                        )}

                        {shift.decline_reason && (
                          <div className="col-span-full flex items-start gap-2 bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/30">
                            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-rose-300 block">Staff Decline Reason:</span>
                              <span className="text-rose-200">{shift.decline_reason}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: PEER-TO-PEER SHIFT SWAP & COVER BOARD
          ========================================================================= */}
      {activeRotaView === 'swaps' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary Stat Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Open for Cover</span>
                <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{openCoverRequests.length}</span>
                <span className="text-[11px] text-slate-500">Available to claim</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Hand className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Awaiting Manager Sign-Off</span>
                <span className="text-2xl font-black text-amber-400 mt-0.5 block">{pendingManagerSwaps.length}</span>
                <span className="text-[11px] text-slate-500">Colleague agreed</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Approved Transfers</span>
                <span className="text-2xl font-black text-cyan-400 mt-0.5 block">{approvedSwaps.length}</span>
                <span className="text-[11px] text-slate-500">Completed swaps</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <BadgeCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section: Open Cover Requests (Claimable by peers) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Hand className="w-4 h-4 text-emerald-400" />
                <span>Open Shifts Needing Cover ({openCoverRequests.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Click &ldquo;Offer Cover&rdquo; to volunteer for colleague shifts
              </span>
            </div>

            {openCoverRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <h4 className="font-bold text-white text-sm">No open cover requests right now</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All shifts are currently staffed. When a colleague needs shift cover, it will appear here for you to claim.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openCoverRequests.map(req => {
                  const shift = req.scheduled_shift;
                  const requester = req.requester_profile;
                  const isMine = req.requester_id === currentUser.id;
                  const startDate = shift ? new Date(shift.start_time) : new Date();
                  const endDate = shift ? new Date(shift.end_time) : new Date();
                  const hours = Math.max(0, (endDate.getTime() - startDate.getTime()) / 3600000);
                  const rate = shift?.hourly_rate || 15.50;
                  const pay = hours * rate;

                  return (
                    <div 
                      key={req.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-lg space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                              Open For Cover
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs font-mono text-cyan-300">
                              {requester?.full_name} ({requester?.employee_id || 'ID'})
                            </span>
                          </div>
                          <h4 className="text-base font-black text-white">
                            {shift?.job_site || 'Main Site'}
                          </h4>
                          <p className="text-xs text-purple-300 font-semibold mt-0.5">
                            {shift?.role_title || 'Hospitality Associate'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase text-slate-500 block font-bold">Shift Pay</span>
                          <span className="text-base font-black text-emerald-400">
                            {formatCurrency(pay, currency)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">({hours.toFixed(1)} hrs)</span>
                        </div>
                      </div>

                      {/* Time & Date */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-white font-bold">
                          {startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-cyan-400">
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="font-bold text-slate-300 block mb-0.5">Colleague Reason:</span>
                        <span>&ldquo;{req.reason}&rdquo;</span>
                      </div>

                      {/* Action */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                        {isMine ? (
                          <>
                            <span className="text-[11px] text-slate-400 italic">Posted by you</span>
                            <button
                              type="button"
                              onClick={() => cancelShiftSwap(req.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs transition-colors"
                            >
                              Withdraw Request
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] text-slate-400">Earn {formatCurrency(pay, currency)}</span>
                            <button
                              type="button"
                              onClick={() => handleClaimCover(req.id)}
                              disabled={claimingSwapId === req.id}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 ml-auto"
                            >
                              <Hand className="w-3.5 h-3.5" />
                              <span>{claimingSwapId === req.id ? 'Claiming...' : 'I Can Cover This Shift'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Pending Management Approvals */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="font-black text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Awaiting Management Approval ({pendingManagerSwaps.length})</span>
            </h3>

            {pendingManagerSwaps.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 text-center">
                No shift transfers currently awaiting management sign-off.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingManagerSwaps.map(req => {
                  const shift = req.scheduled_shift;
                  const requester = req.requester_profile;
                  const target = req.target_profile;
                  const startDate = shift ? new Date(shift.start_time) : new Date();

                  return (
                    <div 
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-white font-mono">{requester?.full_name} ({requester?.employee_id || 'ID'})</span>
                          <span className="text-amber-400 font-bold">➔ Transferring to:</span>
                          <span className="font-bold text-cyan-300 font-mono">{target?.full_name || 'Substitute'} ({target?.employee_id || 'ID'})</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{shift?.job_site} • {startDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 italic">&ldquo;{req.reason}&rdquo;</span>
                        </div>
                      </div>

                      {/* Management 1-Click Approval */}
                      {isManagerOrOwner ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => approveShiftSwap(req.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Approve Transfer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectShiftSwap(req.id, 'Management declined swap')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 font-bold text-xs transition-colors"
                          >
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          Pending Manager Review
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Completed & Approved Transfers */}
          {approvedSwaps.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="font-black text-sm text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-cyan-400" />
                <span>Recently Approved Shift Transfers ({approvedSwaps.length})</span>
              </h3>

              <div className="space-y-2">
                {approvedSwaps.slice(0, 3).map(req => (
                  <div key={req.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        <strong className="text-white">{req.target_profile?.full_name}</strong> successfully took over shift at <strong>{req.scheduled_shift?.job_site || 'Site'}</strong> from {req.requester_profile?.full_name}.
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Transfer Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Decline Reason Modal */}
      {declineTargetShiftId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Cannot Attend Shift</h3>
                  <p className="text-xs text-slate-400">Please provide a reason for management</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setDeclineTargetShiftId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                Select or describe reason:
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Personal / family commitment',
                  'Academic exam / lecture clash',
                  'Illness or medical emergency',
                  'Transportation / transit unavailability',
                  'Short notice conflict'
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDeclineReason(r)}
                    className={cn(
                      "p-2.5 rounded-xl text-xs text-left font-medium border transition-all",
                      declineReason === r
                        ? "bg-rose-500/20 border-rose-500 text-rose-200 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="Additional details for management..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineTargetShiftId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineShift}
                disabled={isDeclining}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                {isDeclining ? 'Submitting...' : 'Submit Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Swap / Cover Request Modal */}
      {swapModalShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Request Shift Swap or Cover</h3>
                  <p className="text-xs text-slate-400">Find a colleague to cover or exchange shifts</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSwapModalShift(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSwapRequest} className="space-y-4">
              {/* Shift Summary Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Selected Shift</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-black text-white text-sm">{swapModalShift.job_site}</span>
                  <span className="text-xs font-mono text-cyan-400">
                    {new Date(swapModalShift.start_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>{swapModalShift.role_title}</span>
                  <span>•</span>
                  <span>{new Date(swapModalShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(swapModalShift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Request Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">Request Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSwapType('cover')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold text-left transition-all",
                      swapType === 'cover'
                        ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/10"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <span className="block font-black">📢 Open Shift Cover</span>
                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                      Post to team board for any available colleague to take
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSwapType('swap')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold text-left transition-all",
                      swapType === 'swap'
                        ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/10"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <span className="block font-black">👥 Direct Colleague Trade</span>
                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                      Target a specific colleague to swap shifts with
                    </span>
                  </button>
                </div>
              </div>

              {/* Colleague Target (if swap) */}
              {swapType === 'swap' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Select Colleague to Trade With *
                  </label>
                  <select
                    value={swapColleagueId}
                    onChange={e => setSwapColleagueId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {allProfiles.filter(p => p.id !== currentUser.id).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.employee_id || 'ID Pending'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Reason for Request *
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    'Academic / exam clash',
                    'Family / personal commitment',
                    'Transit / transport disruption',
                    'Medical appointment'
                  ].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSwapReason(r)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={swapReason}
                  onChange={e => setSwapReason(e.target.value)}
                  required
                  placeholder="e.g. University exam review session"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Policy Notice */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  Once a colleague accepts your cover request, it will be automatically forwarded to management for final sign-off before the shift transfers.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSwapModalShift(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSwap}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingSwap ? 'Posting Request...' : 'Post Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign New Shift Modal (Management Only) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Assign Shift to Staff</h3>
                  <p className="text-xs text-slate-400">Publish new shift to staff roster</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Assign to Staff Member *
                </label>
                <select
                  value={newShiftStaffId}
                  onChange={e => {
                    setNewShiftStaffId(e.target.value);
                    const selected = allProfiles.find(p => p.id === e.target.value);
                    if (selected?.hourly_rate_preference) {
                      setNewShiftRate(selected.hourly_rate_preference);
                    }
                  }}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.employee_id || 'ID Pending'}) — {p.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Client Venue / Job Site *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={newShiftSite}
                    onChange={e => setNewShiftSite(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {jobSites.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.address})
                      </option>
                    ))}
                    <option value="Somerset House Gala">Somerset House Gala (Strand, WC2R 1LA)</option>
                    <option value="Canary Wharf Banquet">Canary Wharf Banquet (E14 5AB)</option>
                    <option value="Mayfair Luxury Suite">Mayfair Luxury Suite (W1K 4QT)</option>
                    <option value="Guildhall Logistics Hub">Guildhall Logistics Hub (EC2V 7HH)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Shift Date *</label>
                  <input
                    type="date"
                    value={newShiftDate}
                    onChange={e => setNewShiftDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={newShiftStartTime}
                    onChange={e => setNewShiftStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">End Time *</label>
                  <input
                    type="time"
                    value={newShiftEndTime}
                    onChange={e => setNewShiftEndTime(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Role / Position *</label>
                  <input
                    type="text"
                    value={newShiftRole}
                    onChange={e => setNewShiftRole(e.target.value)}
                    placeholder="e.g. Senior Banquet Bartender"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Hourly Rate ({currency}) *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="10"
                    value={newShiftRate}
                    onChange={e => setNewShiftRate(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Uniform Guidelines *</label>
                  <span className="text-[10px] text-cyan-400">Quick Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: 'All Black Hospitality', val: 'Full Black: Tailored trousers, long sleeve button-up shirt, black polished shoes.' },
                    { label: 'Formal Waiter', val: 'White long sleeve formal shirt, black bowtie, black tailored waistcoat & trousers.' },
                    { label: 'High-Vis Logistics', val: 'Safety steel-toe boots, yellow high-visibility vest, dark cargo trousers.' },
                    { label: 'Smart Casual', val: 'Dark jeans, smart polo shirt, clean dark trainers.' }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setNewShiftUniform(p.val)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newShiftUniform}
                  onChange={e => setNewShiftUniform(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Arrival Instructions &amp; Briefing Notes
                </label>
                <textarea
                  value={newShiftNotes}
                  onChange={e => setNewShiftNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Enter via staff door on south entrance. Ask for floor supervisor."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewShift}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingNewShift ? 'Publishing Shift...' : 'Publish to Rota'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
