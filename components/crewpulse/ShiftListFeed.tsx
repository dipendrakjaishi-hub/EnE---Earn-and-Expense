import React, { useState, useMemo } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { Shift, UserRole } from '../../types/crewpulse';
import { formatCurrency, cn } from '../../lib/utils';
import ShiftSpreadsheetGrid from './ShiftSpreadsheetGrid';
import ShiftExpenseModal from './ShiftExpenseModal';
import WeeklyTimesheetExportModal from './WeeklyTimesheetExportModal';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock,
  Briefcase,
  Camera,
  ShieldCheck,
  Eye,
  X,
  Table,
  LayoutGrid,
  Receipt,
  Plus,
  Zap,
  Download
} from 'lucide-react';

export default function ShiftListFeed() {
  const { shifts, currentBusiness, currentUser, membership, expenses } = useCrewPulse();
  const [viewMode, setViewMode] = useState<'feed' | 'spreadsheet'>('feed');
  const [filterRange, setFilterRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSelfie, setViewingSelfie] = useState<{ url: string; title: string; subtitle: string } | null>(null);
  const [expenseModalShiftId, setExpenseModalShiftId] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isExportTimesheetOpen, setIsExportTimesheetOpen] = useState(false);

  const currency = currentBusiness?.currency || 'GBP';
  const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';

  const filteredShifts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return shifts.filter(s => {
      // Data privacy: If not manager/employer, staff only see THEIR OWN shifts
      if (!isManagerOrOwner && s.user_id !== currentUser?.id) {
        return false;
      }

      const shiftDate = new Date(s.clock_in);
      const shiftDateStr = s.clock_in.split('T')[0];

      // Time range filter
      if (filterRange === 'today' && shiftDateStr !== todayStr) return false;
      if (filterRange === 'week' && shiftDate < oneWeekAgo) return false;
      if (filterRange === 'month' && shiftDate < startOfMonth) return false;

      // Search term filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const site = (s.job_site || '').toLowerCase();
        const workerName = (s.profile?.full_name || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();
        return site.includes(query) || workerName.includes(query) || notes.includes(query);
      }

      return true;
    });
  }, [shifts, filterRange, searchTerm, isManagerOrOwner, currentUser?.id]);

  return (
    <div className="w-full space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-white">
            {isManagerOrOwner ? 'Team Shift Activity' : 'My Shift History'}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {filteredShifts.length}
          </span>
        </div>

        {/* View Mode Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Card Feed vs Excel Spreadsheet View Mode Toggle */}
          <div className="flex p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('feed')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all",
                viewMode === 'feed'
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
              title="Mobile Card Feed View"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all",
                viewMode === 'spreadsheet'
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
              title="Interactive Excel Spreadsheet Grid"
            >
              <Table className="w-3.5 h-3.5 text-emerald-300" />
              <span>Excel Grid</span>
            </button>
          </div>

          {/* Timesheet Export Button */}
          <button
            type="button"
            onClick={() => setIsExportTimesheetOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
            title="Official Weekly Timesheet & Payroll Export (PDF / CSV)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Timesheet</span>
          </button>

          {/* Time Filter Pills */}
          <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            {(['all', 'today', 'week', 'month'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterRange(tab)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold capitalize transition-all",
                  filterRange === tab
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search site or worker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500 w-36 lg:w-44 placeholder-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Mode vs Card Feed Mode */}
      {viewMode === 'spreadsheet' ? (
        <ShiftSpreadsheetGrid shifts={filteredShifts} currency={currency} />
      ) : filteredShifts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 text-slate-400 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
          <p className="text-xs font-semibold">No shifts logged for selected filter</p>
          <p className="text-[11px] text-slate-500">Clock in from the mobile card above or add a manual shift.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredShifts.map((shift) => {
            const isMe = shift.user_id === currentUser.id;
            const worker = shift.profile || currentUser;
            const dateStr = new Date(shift.clock_in).toLocaleDateString([], { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
            const startTime = new Date(shift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = shift.clock_out 
              ? new Date(shift.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : 'Now';

            const isActive = shift.status === 'active';
            const isOnBreak = shift.status === 'break';

            return (
              <div
                key={shift.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all relative overflow-hidden group",
                  isActive
                    ? "bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                    : isOnBreak
                    ? "bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5"
                    : "bg-slate-900/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Worker & Site Details */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : isOnBreak
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-slate-800 text-slate-300"
                    )}>
                      {worker.full_name?.charAt(0) || 'W'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {isMe ? `${worker.full_name} (You)` : worker.full_name}
                        </span>
                        {worker.employee_id && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {worker.employee_id}
                          </span>
                        )}
                        {shift.is_manual && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            Manual
                          </span>
                        )}
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : isOnBreak
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        )}>
                          {shift.status}
                        </span>

                        {/* Shift Approval Status Badge */}
                        {shift.approval_status === 'pending' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending Approval
                          </span>
                        ) : shift.approval_status === 'rejected' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Approved
                          </span>
                        )}

                        {shift.is_offline_recorded && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border",
                            shift.synced_to_cloud
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
                          )}>
                            <Zap className="w-3 h-3" />
                            {shift.synced_to_cloud ? "✓ Synced (24h Auto)" : "⚡ Recorded Offline (Queued)"}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {startTime} - {endTime}
                        </span>
                        {shift.job_site && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {shift.job_site}
                          </span>
                        )}
                        {shift.distance_from_site_meters !== undefined && (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            {shift.distance_from_site_meters}m from pin (20m perimeter verified)
                          </span>
                        )}
                      </div>

                      {/* Selfie Proof Badges */}
                      {(shift.clock_in_selfie || shift.clock_out_selfie) && (
                        <div className="flex items-center gap-2 mt-2">
                          {shift.clock_in_selfie && (
                            <button
                              type="button"
                              onClick={() => setViewingSelfie({
                                url: shift.clock_in_selfie!,
                                title: `Clock-In Selfie Proof: ${worker.full_name}`,
                                subtitle: `${dateStr} at ${startTime} • Site: ${shift.job_site || 'Venue'}`
                              })}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-colors"
                            >
                              <img 
                                src={shift.clock_in_selfie} 
                                alt="Clock In Selfie" 
                                className="w-4 h-4 rounded-full object-cover border border-cyan-400"
                              />
                              <span>Selfie In</span>
                              <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                            </button>
                          )}

                          {shift.clock_out_selfie && (
                            <button
                              type="button"
                              onClick={() => setViewingSelfie({
                                url: shift.clock_out_selfie!,
                                title: `Clock-Out Selfie Proof: ${worker.full_name}`,
                                subtitle: `${dateStr} at ${endTime} • Site: ${shift.job_site || 'Venue'}`
                              })}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-colors"
                            >
                              <img 
                                src={shift.clock_out_selfie} 
                                alt="Clock Out Selfie" 
                                className="w-4 h-4 rounded-full object-cover border border-rose-400"
                              />
                              <span>Selfie Out</span>
                              <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Right: Calculated Hours & Estimated Pay */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shift.is_geofence_verified && (
                          <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>On-Site Verified</span>
                          </div>
                        )}

                        {shift.overtime_hours && shift.overtime_hours > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold">
                            <Zap className="w-3 h-3 text-amber-400 fill-current" />
                            <span>+{shift.overtime_hours.toFixed(1)}h OT</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="font-mono font-black text-base text-white">
                          {isActive ? (
                            <span className="text-emerald-400 animate-pulse">Running</span>
                          ) : (
                            `${Number(shift.total_hours || 0).toFixed(2)}h`
                          )}
                        </div>
                        <div className="text-xs font-bold text-emerald-400">
                          {formatCurrency(shift.estimated_pay || 0, currency)}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            (@ {formatCurrency(shift.hourly_rate_at_shift || 0, currency)}/h)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shift-Linked Expenses Section & Action */}
                  {(() => {
                    const shiftExpenses = expenses.filter(e => e.shift_id === shift.id);
                    const totalExpenses = shiftExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

                    return (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {shiftExpenses.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Receipt className="w-3 h-3 text-cyan-400" />
                                Claimed Expenses:
                              </span>
                              {shiftExpenses.map(exp => (
                                <span 
                                  key={exp.id} 
                                  className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1",
                                    exp.status === 'approved' 
                                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                      : exp.status === 'reimbursed'
                                      ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                                      : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                  )}
                                >
                                  {exp.category}: {formatCurrency(exp.amount, currency)} ({exp.status})
                                </span>
                              ))}
                              <span className="text-[11px] font-mono font-bold text-slate-300 ml-1">
                                Total: {formatCurrency(totalExpenses, currency)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              No expenses claimed for this shift
                            </span>
                          )}
                        </div>

                        {/* Button to add/claim expense for this specific shift */}
                        <button
                          type="button"
                          onClick={() => {
                            setExpenseModalShiftId(shift.id);
                            setIsExpenseModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[11px] font-bold text-cyan-300 transition-all flex items-center gap-1 active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Claim Expense</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Notes if present */}
                  {shift.notes && (
                    <p className="mt-2 text-[11px] text-slate-400 italic">
                      &ldquo;{shift.notes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      }

      {/* Shift Expense Claim Modal */}
      <ShiftExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseModalShiftId(null);
        }}
        preselectedShiftId={expenseModalShiftId}
      />

      {/* Selfie Photo Inspection Modal */}
      {viewingSelfie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl relative text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-white">{viewingSelfie.title}</h4>
                <p className="text-[11px] text-slate-400">{viewingSelfie.subtitle}</p>
              </div>
              <button
                onClick={() => setViewingSelfie(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-slate-800 bg-black">
              <img 
                src={viewingSelfie.url} 
                alt="Enlarged Selfie Verification" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Camera selfie verified by CrewPulse on-site security protocol.</span>
            </div>

            <button
              onClick={() => setViewingSelfie(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Official Weekly Timesheet & Payroll Export Modal */}
      <WeeklyTimesheetExportModal
        isOpen={isExportTimesheetOpen}
        onClose={() => setIsExportTimesheetOpen(false)}
      />
    </div>
  );
}
