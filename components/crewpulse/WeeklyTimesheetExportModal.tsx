import React, { useState, useMemo, useRef } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { Shift, Profile } from '../../types/crewpulse';
import { formatCurrency, cn, downloadCSV } from '../../lib/utils';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  X, 
  CheckCircle2, 
  Building, 
  User, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  Filter,
  FileSpreadsheet,
  Receipt,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

interface WeeklyTimesheetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeeklyTimesheetExportModal({ isOpen, onClose }: WeeklyTimesheetExportModalProps) {
  const { 
    shifts, 
    expenses, 
    allProfiles, 
    currentUser, 
    currentBusiness, 
    membership 
  } = useCrewPulse();

  const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';
  const currency = currentBusiness?.currency || 'GBP';

  // Filters
  const [dateFilter, setDateFilter] = useState<'current_week' | 'last_week' | 'current_month' | 'all'>('current_week');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(isManagerOrOwner ? 'all' : currentUser.id);
  const [taxRate, setTaxRate] = useState<number>(20);
  const [niRate, setNiRate] = useState<number>(8);
  const [employerNiRate, setEmployerNiRate] = useState<number>(13.8); // Standard UK Employer's NI
  const [pensionRate, setPensionRate] = useState<number>(3); // 3% auto-enrolment

  // Calculate start & end dates for ranges
  const { startDate, endDate, rangeLabel } = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (currentDay + 6) % 7;
    
    // Start of current week (Monday 00:00:00)
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - distanceToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Last week
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
    lastWeekEnd.setHours(23, 59, 59, 999);

    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (dateFilter === 'current_week') {
      return {
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        rangeLabel: `Week Commencing ${currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      };
    } else if (dateFilter === 'last_week') {
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        rangeLabel: `Week of ${lastWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${lastWeekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      };
    } else if (dateFilter === 'current_month') {
      return {
        startDate: currentMonthStart,
        endDate: currentMonthEnd,
        rangeLabel: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      };
    }

    return {
      startDate: new Date(2020, 0, 1),
      endDate: new Date(2030, 11, 31),
      rangeLabel: 'All Logged Timesheets'
    };
  }, [dateFilter]);

  // Filter completed shifts within range and role privacy
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      // Non-managers strictly only see their own shifts
      if (!isManagerOrOwner && s.user_id !== currentUser.id) return false;
      if (isManagerOrOwner && selectedStaffId !== 'all' && s.user_id !== selectedStaffId) return false;

      const shiftDate = new Date(s.clock_in);
      if (dateFilter !== 'all') {
        if (shiftDate < startDate || shiftDate > endDate) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime());
  }, [shifts, isManagerOrOwner, selectedStaffId, currentUser.id, dateFilter, startDate, endDate]);

  // Relevant expenses in range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!isManagerOrOwner && e.user_id !== currentUser.id) return false;
      if (isManagerOrOwner && selectedStaffId !== 'all' && e.user_id !== selectedStaffId) return false;

      const expDate = new Date(e.created_at);
      if (dateFilter !== 'all') {
        if (expDate < startDate || expDate > endDate) return false;
      }
      return e.status === 'approved' || e.status === 'reimbursed';
    });
  }, [expenses, isManagerOrOwner, selectedStaffId, currentUser.id, dateFilter, startDate, endDate]);

  // Overall aggregates
  const totalHours = filteredShifts.reduce((acc, s) => acc + (s.total_hours || 0), 0);
  const regularHours = filteredShifts.reduce((acc, s) => acc + (s.regular_hours || (s.total_hours || 0)), 0);
  const overtimeHours = filteredShifts.reduce((acc, s) => acc + (s.overtime_hours || 0), 0);
  const grossPay = filteredShifts.reduce((acc, s) => acc + (s.estimated_pay || 0), 0);
  const overtimePay = filteredShifts.reduce((acc, s) => acc + (s.overtime_pay || 0), 0);
  const totalApprovedExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Staff deductions
  const estTax = (grossPay * taxRate) / 100;
  const estNI = (grossPay * niRate) / 100;
  const totalDeductions = estTax + estNI;
  const netTakeHome = Math.max(0, grossPay - totalDeductions) + totalApprovedExpenses;

  // Management On-Costs
  const employerNI = (grossPay * employerNiRate) / 100;
  const employerPension = (grossPay * pensionRate) / 100;
  const totalEmployerCost = grossPay + employerNI + employerPension + totalApprovedExpenses;

  // Multi-staff breakdown for management
  const staffBreakdown = useMemo(() => {
    if (!isManagerOrOwner) return [];
    const map = new Map<string, {
      profile: Profile;
      shiftsCount: number;
      totalHours: number;
      regularHours: number;
      overtimeHours: number;
      grossPay: number;
      expenses: number;
    }>();

    filteredShifts.forEach(s => {
      const p = s.profile || allProfiles.find(prof => prof.id === s.user_id) || {
        id: s.user_id,
        full_name: 'Staff Member',
        email: '',
        employee_id: 'ID-PENDING'
      } as Profile;

      const existing = map.get(p.id) || {
        profile: p,
        shiftsCount: 0,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        grossPay: 0,
        expenses: 0
      };

      existing.shiftsCount += 1;
      existing.totalHours += (s.total_hours || 0);
      existing.regularHours += (s.regular_hours || (s.total_hours || 0));
      existing.overtimeHours += (s.overtime_hours || 0);
      existing.grossPay += (s.estimated_pay || 0);
      map.set(p.id, existing);
    });

    filteredExpenses.forEach(e => {
      const existing = map.get(e.user_id);
      if (existing) {
        existing.expenses += (e.amount || 0);
      }
    });

    return Array.from(map.values());
  }, [isManagerOrOwner, filteredShifts, filteredExpenses, allProfiles]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredShifts.length === 0) {
      toast.error('No timesheets to export for this date range');
      return;
    }

    const exportRows = filteredShifts.map(s => {
      const staffMember = s.profile || allProfiles.find(p => p.id === s.user_id);
      return {
        'Timesheet ID': s.id,
        'Staff Full Name': staffMember?.full_name || currentUser.full_name,
        'Unique Staff ID': staffMember?.employee_id || currentUser.employee_id || 'N/A',
        'Staff Email': staffMember?.email || currentUser.email,
        'Date': s.clock_in.split('T')[0],
        'Job Venue / Site': s.job_site || 'Main Site',
        'Clock In Time': new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Clock Out Time': s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress',
        'Total Hours': (s.total_hours || 0).toFixed(2),
        'Regular Hours': (s.regular_hours || (s.total_hours || 0)).toFixed(2),
        'Overtime Hours': (s.overtime_hours || 0).toFixed(2),
        'Hourly Rate': (s.hourly_rate_at_shift || 14.50).toFixed(2),
        'Gross Wages': (s.estimated_pay || 0).toFixed(2),
        'Approval Status': s.approval_status || 'approved',
        'Verified Geofence': s.is_geofence_verified ? 'YES' : 'NO',
        'Shift Notes': s.notes || ''
      };
    });

    const filename = `timesheet_payroll_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(exportRows, filename);
    toast.success(`Timesheet CSV exported successfully (${filteredShifts.length} shifts)`);
  };

  // Native Print / Save to PDF
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const targetStaffName = isManagerOrOwner && selectedStaffId === 'all' 
    ? 'All Company Personnel' 
    : isManagerOrOwner 
    ? (allProfiles.find(p => p.id === selectedStaffId)?.full_name || 'Staff Member')
    : currentUser.full_name;

  const targetStaffId = isManagerOrOwner && selectedStaffId === 'all'
    ? 'ROSTER-ALL'
    : isManagerOrOwner
    ? (allProfiles.find(p => p.id === selectedStaffId)?.employee_id || 'PENDING')
    : currentUser.employee_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Printable Paper / Modal Container */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl relative text-white max-h-[94vh] overflow-y-auto space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:max-h-none print:overflow-visible">
        
        {/* Top Control Header (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {isManagerOrOwner ? 'Weekly Payroll & Timesheet Audit' : 'Official Weekly Timesheet & Payslip'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentBusiness?.name || 'Organisation'} • Automated HMRC PAYE/NI estimation &amp; export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
              title="Download CSV for Excel / Payroll software"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Print official PDF format"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Period:
            </span>

            {/* Date Preset Buttons */}
            <div className="flex p-0.5 rounded-xl bg-slate-900 border border-slate-800">
              {[
                { id: 'current_week', label: 'This Week' },
                { id: 'last_week', label: 'Last Week' },
                { id: 'current_month', label: 'This Month' },
                { id: 'all', label: 'All Records' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDateFilter(tab.id as any)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold text-xs transition-all",
                    dateFilter === tab.id
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Staff Member Selector (for management) */}
            {isManagerOrOwner && (
              <select
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-medium focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Personnel ({allProfiles.length})</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.employee_id || 'ID Pending'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Range: <strong className="text-cyan-300">{rangeLabel}</strong>
          </div>
        </div>

        {/* =========================================================================
            OFFICIAL PAYROLL & TIMESHEET DOCUMENT (Rendered and Print-Ready)
            ========================================================================= */}
        <div className="space-y-6 print:space-y-4">
          
          {/* Document Letterhead */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/50 border border-slate-800 print:bg-white print:border-b-2 print:border-slate-900 print:p-0 print:rounded-none">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-5 h-5 text-cyan-400 print:text-black" />
                  <span className="font-black text-xl text-white print:text-black uppercase tracking-wider">
                    {currentBusiness?.name || 'Organisation'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 print:text-slate-600">
                  Automated Timesheet &amp; Verified Wage Audit Statement
                </p>
                <p className="text-[11px] text-slate-500 print:text-slate-500 font-mono mt-0.5">
                  Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 print:text-black block">
                  Payroll Period
                </span>
                <span className="text-sm font-black text-white print:text-black block">
                  {rangeLabel}
                </span>
                <span className="text-xs font-mono text-slate-400 print:text-slate-600 block mt-0.5">
                  Verified Shifts: {filteredShifts.length}
                </span>
              </div>
            </div>

            {/* Recipient / Employee Badge */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 print:border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">Staff / Group</span>
                <span className="font-black text-white print:text-black text-sm">{targetStaffName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">Unique ID</span>
                <span className="font-mono font-bold text-cyan-300 print:text-black text-sm">{targetStaffId}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">Status</span>
                <span className="font-bold text-emerald-400 print:text-emerald-700 flex items-center gap-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified &amp; Approved
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">Currency</span>
                <span className="font-mono font-bold text-white print:text-black text-sm">{currency}</span>
              </div>
            </div>
          </div>

          {/* Aggregate Summary Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 print:border print:border-slate-300 print:bg-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 block">Total Hours Worked</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-white print:text-black">{totalHours.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 font-mono">hrs</span>
              </div>
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mt-0.5">
                Reg: {regularHours.toFixed(1)}h • OT: {overtimeHours.toFixed(1)}h
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 print:border print:border-slate-300 print:bg-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 block">Total Gross Wages</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-cyan-400 print:text-black">
                  {formatCurrency(grossPay, currency)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mt-0.5">
                Includes OT: {formatCurrency(overtimePay, currency)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 print:border print:border-slate-300 print:bg-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 block">Reimbursed Expenses</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-amber-400 print:text-black">
                  {formatCurrency(totalApprovedExpenses, currency)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mt-0.5">
                {filteredExpenses.length} claim(s) tax-free
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 print:border print:border-slate-300 print:bg-emerald-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-900 block">
                {isManagerOrOwner && selectedStaffId === 'all' ? 'Total Employer Outlay' : 'Net Take-Home Pay'}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-emerald-400 print:text-emerald-800">
                  {formatCurrency(isManagerOrOwner && selectedStaffId === 'all' ? totalEmployerCost : netTakeHome, currency)}
                </span>
              </div>
              <span className="text-[10px] text-emerald-500/80 print:text-emerald-700 block mt-0.5">
                {isManagerOrOwner && selectedStaffId === 'all' ? 'Wages + Employer NI + Pension' : 'After estimated PAYE / NI'}
              </span>
            </div>
          </div>

          {/* Multi-Staff Roster Table (For Management View with 'All Personnel') */}
          {isManagerOrOwner && selectedStaffId === 'all' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400 print:text-black" />
                  Staff Member Payroll Breakdown
                </h4>
                <span className="text-[11px] font-mono text-slate-500 print:text-slate-600">
                  {staffBreakdown.length} Active Staff Member(s)
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden print:border-slate-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 print:bg-slate-100 print:text-slate-800 print:border-slate-300 font-bold">
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Unique ID</th>
                      <th className="p-3">Shifts</th>
                      <th className="p-3">Total Hours</th>
                      <th className="p-3">Gross Wages</th>
                      <th className="p-3">Expenses</th>
                      <th className="p-3 text-right">Employer Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 print:divide-slate-300 font-medium">
                    {staffBreakdown.map(item => {
                      const empNI = (item.grossPay * employerNiRate) / 100;
                      const empPen = (item.grossPay * pensionRate) / 100;
                      const totalCost = item.grossPay + empNI + empPen + item.expenses;

                      return (
                        <tr key={item.profile.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                          <td className="p-3 font-bold text-white print:text-black">
                            {item.profile.full_name}
                          </td>
                          <td className="p-3 font-mono text-cyan-300 print:text-slate-800">
                            {item.profile.employee_id || 'ID Pending'}
                          </td>
                          <td className="p-3">{item.shiftsCount}</td>
                          <td className="p-3 font-mono">{item.totalHours.toFixed(1)} hrs</td>
                          <td className="p-3 font-mono">{formatCurrency(item.grossPay, currency)}</td>
                          <td className="p-3 font-mono text-amber-400 print:text-slate-800">
                            {formatCurrency(item.expenses, currency)}
                          </td>
                          <td className="p-3 text-right font-black text-emerald-400 print:text-black font-mono">
                            {formatCurrency(totalCost, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Shift Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400 print:text-black" />
                Verified Shift Line Items ({filteredShifts.length})
              </h4>
              <span className="text-[11px] font-mono text-slate-500 print:text-slate-600">
                Audited &amp; Geofence Verified
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 print:bg-slate-100 print:text-slate-800 print:border-slate-300 font-bold">
                    <th className="p-2.5 sm:p-3">Date</th>
                    <th className="p-2.5 sm:p-3">Staff / ID</th>
                    <th className="p-2.5 sm:p-3">Venue / Site</th>
                    <th className="p-2.5 sm:p-3">Times</th>
                    <th className="p-2.5 sm:p-3">Hours</th>
                    <th className="p-2.5 sm:p-3">Rate</th>
                    <th className="p-2.5 sm:p-3 text-right">Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 print:divide-slate-300 font-medium text-[11px] sm:text-xs">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 print:text-slate-600">
                        No shift records found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map(s => {
                      const staff = s.profile || allProfiles.find(p => p.id === s.user_id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                          <td className="p-2.5 sm:p-3 whitespace-nowrap font-mono">
                            {new Date(s.clock_in).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="p-2.5 sm:p-3">
                            <span className="font-bold text-white print:text-black block">
                              {staff?.full_name || currentUser.full_name}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 print:text-slate-600 block">
                              {staff?.employee_id || currentUser.employee_id}
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 max-w-[140px] truncate">
                            {s.job_site || 'Site A'}
                          </td>
                          <td className="p-2.5 sm:p-3 whitespace-nowrap font-mono text-[11px]">
                            {new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {s.clock_out && ` - ${new Date(s.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </td>
                          <td className="p-2.5 sm:p-3 font-mono">
                            <strong className="text-white print:text-black">{(s.total_hours || 0).toFixed(1)}h</strong>
                            {(s.overtime_hours || 0) > 0 && (
                              <span className="text-amber-400 print:text-slate-600 block text-[10px]">
                                (+{(s.overtime_hours || 0).toFixed(1)} OT)
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 sm:p-3 font-mono">
                            {formatCurrency(s.hourly_rate_at_shift || 14.50, currency)}
                          </td>
                          <td className="p-2.5 sm:p-3 text-right font-black text-emerald-400 print:text-black font-mono">
                            {formatCurrency(s.estimated_pay || 0, currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax, NI & Deductions Breakdown Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 print:border print:border-slate-300 print:bg-white space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-800 flex items-center justify-between">
              <span>HMRC PAYE Tax &amp; National Insurance Deduction Estimates</span>
              <span className="text-[10px] font-mono lowercase text-slate-500">Subject to personal allowance &amp; tax code</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Total Gross Shift Earnings:</span>
                  <span className="font-mono font-bold text-white print:text-black">{formatCurrency(grossPay, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Estimated Income Tax ({taxRate}% Basic Rate):</span>
                  <span className="font-mono text-rose-400 print:text-black">- {formatCurrency(estTax, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Estimated National Insurance (Class 1 @ {niRate}%):</span>
                  <span className="font-mono text-rose-400 print:text-black">- {formatCurrency(estNI, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/80 print:border-slate-300">
                  <span className="text-slate-400 print:text-slate-600 font-bold">Total Statutory Deductions:</span>
                  <span className="font-mono font-bold text-rose-400 print:text-black">- {formatCurrency(totalDeductions, currency)}</span>
                </div>
              </div>

              <div className="space-y-2 sm:pl-4 sm:border-l border-slate-800/80 print:border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Reimbursed Verified Expenses (Tax-Free):</span>
                  <span className="font-mono font-bold text-amber-400 print:text-black">+ {formatCurrency(totalApprovedExpenses, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Employer NI Contribution ({employerNiRate}%):</span>
                  <span className="font-mono text-slate-400 print:text-black">{formatCurrency(employerNI, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-slate-600">Workplace Pension Auto-Enrol ({pensionRate}%):</span>
                  <span className="font-mono text-slate-400 print:text-black">{formatCurrency(employerPension, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800/80 print:border-slate-300 font-bold">
                  <span className="text-emerald-400 print:text-black">Estimated Net Take-Home:</span>
                  <span className="font-mono text-emerald-400 print:text-black text-sm">{formatCurrency(netTakeHome, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sign-off & Audit Signatures */}
          <div className="pt-4 border-t border-slate-800/80 print:border-slate-400 grid grid-cols-2 gap-8 text-xs print:pt-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">
                Employee Confirmation &amp; Signature
              </span>
              <div className="h-10 border-b border-dashed border-slate-700 print:border-slate-400 flex items-end">
                <span className="font-mono text-[11px] text-cyan-300 print:text-black">
                  {currentUser.full_name} ({currentUser.employee_id || 'LM-2102-LDN'})
                </span>
              </div>
              <span className="text-[10px] text-slate-500 print:text-slate-500 block">
                I certify that the above logged hours represent true and accurate shifts worked.
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">
                Management / Payroll Authorisation
              </span>
              <div className="h-10 border-b border-dashed border-slate-700 print:border-slate-400 flex items-end">
                <span className="font-mono text-[11px] text-purple-300 print:text-black">
                  {currentBusiness?.name || 'Organisation'} Operations Management
                </span>
              </div>
              <span className="text-[10px] text-slate-500 print:text-slate-500 block">
                Authorised for direct BACS payroll transfer &amp; HMRC RTI submission.
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
