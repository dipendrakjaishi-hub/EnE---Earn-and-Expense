import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  User, 
  MapPin, 
  AlertCircle,
  FileText,
  BadgeCheck,
  ChevronRight,
  Eye,
  Lock,
  ArrowLeftRight,
  Hand
} from 'lucide-react';
import { toast } from 'sonner';

export default function ManagementApprovalsCard() {
  const { 
    shifts, 
    allProfiles, 
    currentBusiness, 
    membership, 
    approveShift, 
    rejectShift,
    updateProfile,
    swapRequests,
    approveShiftSwap,
    rejectShiftSwap
  } = useCrewPulse();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ id: string; text: string } | null>(null);

  const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';

  const currency = currentBusiness?.currency || 'GBP';

  // Shifts awaiting management approval (e.g., manual shifts submitted by staff)
  const pendingShifts = shifts.filter(s => s.approval_status === 'pending');

  // Staff with pending KYC
  const pendingKYCProfiles = allProfiles.filter(p => p.kyc_status === 'pending');

  // Shift swaps/covers awaiting management approval (peer agreed)
  const pendingSwaps = swapRequests.filter(r => r.status === 'peer_accepted');

  const totalPending = pendingShifts.length + pendingKYCProfiles.length + pendingSwaps.length;

  const handleApprove = async (shiftId: string) => {
    setProcessingId(shiftId);
    try {
      await approveShift(shiftId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve shift');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (shiftId: string) => {
    setProcessingId(shiftId);
    try {
      await rejectShift(shiftId, rejectReason?.text || 'Rejected by management');
      setRejectReason(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject shift');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveKYC = async (profileId: string) => {
    try {
      await updateProfile({ kyc_status: 'verified' });
      toast.success('Staff KYC and unique staff code verified!');
    } catch (err: any) {
      toast.error('Failed to verify KYC');
    }
  };

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">Management Approvals Queue</h3>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                totalPending > 0 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse" 
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              )}>
                {totalPending > 0 ? `${totalPending} Action Needed` : 'All Caught Up'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Only management can review &amp; approve manual shifts, adjust staff pay, and verify KYC codes.
            </p>
          </div>
        </div>

        {/* Permission Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          <span>Management Side Only</span>
        </div>
      </div>

      {/* Pending Items List */}
      {totalPending === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center py-6 text-xs text-slate-400 space-y-1">
          <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-80" />
          <p className="font-bold text-slate-300">All staff shifts and KYC credentials are up to date.</p>
          <p className="text-slate-500">When staff submit missing shifts manually or update their KYC, they will appear here for your approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending Shifts */}
          {pendingShifts.map((shift) => {
            const worker = shift.profile || allProfiles.find(p => p.id === shift.user_id);
            const dateStr = new Date(shift.clock_in).toLocaleDateString([], { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
            const startTime = new Date(shift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = shift.clock_out 
              ? new Date(shift.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : 'End';

            return (
              <div 
                key={shift.id} 
                className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 hover:border-amber-500/60 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-sm">
                      {worker?.full_name?.charAt(0) || 'W'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {worker?.full_name || 'Staff Member'}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {worker?.employee_id || 'ID Pending'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Pending Approval
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {startTime} - {endTime}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {shift.job_site || 'Manual Site'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Pay */}
                  <div className="text-right">
                    <div className="font-mono font-black text-base text-white">
                      {shift.total_hours.toFixed(2)} hrs
                    </div>
                    <div className="text-xs font-bold text-emerald-400">
                      Est. {formatCurrency(shift.estimated_pay, currency)}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        (@ {formatCurrency(shift.hourly_rate_at_shift, currency)}/h)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Worker's justification note */}
                {shift.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-400">Staff Note: </span>
                      <span>&ldquo;{shift.notes}&rdquo;</span>
                    </div>
                  </div>
                )}

                {/* Reject Reason input dialog inline if opened */}
                {rejectReason?.id === shift.id && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                    <label className="text-xs font-semibold text-rose-300 block">
                      State reason for rejection (visible to worker):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hours do not match client venue timesheet..."
                      value={rejectReason.text}
                      onChange={(e) => setRejectReason({ id: shift.id, text: e.target.value })}
                      className="w-full bg-slate-900 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setRejectReason(null)}
                        className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(shift.id)}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 italic">
                    Staff cannot modify approved shifts once signed off.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processingId === shift.id}
                      onClick={() => setRejectReason({ id: shift.id, text: '' })}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingId === shift.id}
                      onClick={() => handleApprove(shift.id)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{processingId === shift.id ? 'Approving...' : 'Approve Shift'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pending Shift Swap & Cover Transfers */}
          {pendingSwaps.map((swap) => {
            const shift = swap.scheduled_shift;
            const requester = swap.requester_profile || allProfiles.find(p => p.id === swap.requester_id);
            const target = swap.target_profile || allProfiles.find(p => p.id === swap.target_user_id);
            const dateStr = shift ? new Date(shift.start_time).toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }) : 'Upcoming';
            const timeStr = shift 
              ? `${new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : '';

            return (
              <div 
                key={swap.id}
                className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 hover:border-purple-500/60 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          Shift Transfer: {requester?.full_name} ({requester?.employee_id || 'ID'}) ➔ {target?.full_name} ({target?.employee_id || 'ID'})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Peer Agreed • Requires Management Sign-off
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {timeStr}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {shift?.job_site || 'Client Site'}
                        </span>
                        <span className="text-purple-300 font-semibold">
                          {shift?.role_title}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-500 block font-bold">Hourly Wage</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(shift?.hourly_rate || 15.50, currency)}/hr
                    </span>
                  </div>
                </div>

                {/* Reason provided */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-400">Transfer Reason: </span>
                    <span>&ldquo;{swap.reason}&rdquo;</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500">
                    Approving will automatically reassign this shift on the weekly rota to {target?.full_name}.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processingId === swap.id}
                      onClick={async () => {
                        setProcessingId(swap.id);
                        try {
                          await rejectShiftSwap(swap.id, 'Management declined shift transfer');
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to reject swap');
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={processingId === swap.id}
                      onClick={async () => {
                        setProcessingId(swap.id);
                        try {
                          await approveShiftSwap(swap.id);
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to approve swap');
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{processingId === swap.id ? 'Transferring...' : 'Approve & Reassign Shift'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pending KYC Submissions */}
          {pendingKYCProfiles.map((p) => (
            <div 
              key={p.id}
              className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{p.full_name}</span>
                    <span className="text-[10px] font-mono font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Suggested ID: {p.employee_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    KYC Document: <strong>{p.kyc_document_type || 'Passport'}</strong> • DOB: {p.dob || 'Not set'} • Location: {p.kyc_location_code || 'LDN'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-400 font-medium">Awaiting Manager Verification</span>
                <button
                  type="button"
                  onClick={() => handleApproveKYC(p.id)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Staff ID</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
