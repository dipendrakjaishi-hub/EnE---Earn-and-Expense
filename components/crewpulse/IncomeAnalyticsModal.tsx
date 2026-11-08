import React, { useState, useMemo } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  PieChart as PieIcon, 
  BarChart3, 
  Clock, 
  Receipt, 
  Download, 
  ShieldCheck, 
  Info,
  Calendar,
  Zap,
  Building
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend
} from 'recharts';

interface IncomeAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IncomeAnalyticsModal({ isOpen, onClose }: IncomeAnalyticsModalProps) {
  const { shifts, expenses, currentBusiness, currentUser } = useCrewPulse();
  const [timeRange, setTimeRange] = useState<'month' | '30days' | 'all'>('month');
  const [taxRate, setTaxRate] = useState<number>(20); // standard 20% basic rate
  const [niRate, setNiRate] = useState<number>(8); // standard 8% NI estimate

  const currency = currentBusiness?.currency || 'GBP';

  // Filter shifts based on time range
  const filteredShifts = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    return shifts.filter(s => {
      const shiftDate = new Date(s.clock_in);
      if (timeRange === 'month' && shiftDate < startOfMonth) return false;
      if (timeRange === '30days' && shiftDate < thirtyDaysAgo) return false;
      return true;
    });
  }, [shifts, timeRange]);

  // Aggregate Metrics
  const totalHours = useMemo(() => {
    return filteredShifts.reduce((acc, s) => acc + (s.total_hours || 0), 0);
  }, [filteredShifts]);

  const regularHours = useMemo(() => {
    return filteredShifts.reduce((acc, s) => acc + (s.regular_hours || (s.total_hours || 0)), 0);
  }, [filteredShifts]);

  const overtimeHours = useMemo(() => {
    return filteredShifts.reduce((acc, s) => acc + (s.overtime_hours || 0), 0);
  }, [filteredShifts]);

  const grossEarnings = useMemo(() => {
    return filteredShifts.reduce((acc, s) => acc + (s.estimated_pay || 0), 0);
  }, [filteredShifts]);

  const overtimePay = useMemo(() => {
    return filteredShifts.reduce((acc, s) => acc + (s.overtime_pay || 0), 0);
  }, [filteredShifts]);

  // Filter and sum expenses
  const relevantExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (timeRange === 'all') return true;
      const now = new Date();
      const expDate = new Date(e.created_at);
      if (timeRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return expDate >= startOfMonth;
      }
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      return expDate >= thirtyDaysAgo;
    });
  }, [expenses, timeRange]);

  const approvedExpensesTotal = useMemo(() => {
    return relevantExpenses
      .filter(e => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [relevantExpenses]);

  // Tax and NI Calculations
  const estimatedTax = (grossEarnings * taxRate) / 100;
  const estimatedNI = (grossEarnings * niRate) / 100;
  const totalDeductions = estimatedTax + estimatedNI;
  const netTakeHome = Math.max(0, grossEarnings - totalDeductions) + approvedExpensesTotal;

  // Mean Calculations
  const shiftCount = filteredShifts.length;
  const meanPayPerShift = shiftCount > 0 ? grossEarnings / shiftCount : 0;
  const meanHourlyRate = totalHours > 0 ? grossEarnings / totalHours : 0;

  // Hours by Venue / Site Chart Data
  const venueChartData = useMemo(() => {
    const venueMap: Record<string, { hours: number; gross: number }> = {};

    filteredShifts.forEach(s => {
      const site = s.job_site || 'Unassigned Site';
      if (!venueMap[site]) {
        venueMap[site] = { hours: 0, gross: 0 };
      }
      venueMap[site].hours += (s.total_hours || 0);
      venueMap[site].gross += (s.estimated_pay || 0);
    });

    return Object.entries(venueMap).map(([name, data]) => ({
      name,
      hours: Number(data.hours.toFixed(1)),
      gross: Number(data.gross.toFixed(2))
    }));
  }, [filteredShifts]);

  // Deduction Distribution Chart Data
  const paySplitData = useMemo(() => {
    return [
      { name: 'Take-Home Net', amount: Number((grossEarnings - totalDeductions).toFixed(2)), color: '#10b981' },
      { name: 'Income Tax (20%)', amount: Number(estimatedTax.toFixed(2)), color: '#f59e0b' },
      { name: 'NI & Levies (8%)', amount: Number(estimatedNI.toFixed(2)), color: '#ef4444' }
    ];
  }, [grossEarnings, totalDeductions, estimatedTax, estimatedNI]);

  // Export Tax Summary CSV
  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Time Period', timeRange === 'month' ? 'This Month' : timeRange === '30days' ? 'Last 30 Days' : 'All Time'],
      ['Total Shifts Worked', shiftCount.toString()],
      ['Total Hours', totalHours.toFixed(2)],
      ['Regular Hours', regularHours.toFixed(2)],
      ['Overtime Hours', overtimeHours.toFixed(2)],
      ['Gross Wages', grossEarnings.toFixed(2)],
      ['Overtime Wages', overtimePay.toFixed(2)],
      [`Estimated Income Tax (${taxRate}%)`, estimatedTax.toFixed(2)],
      [`Estimated National Insurance (${niRate}%)`, estimatedNI.toFixed(2)],
      ['Approved Reimbursable Expenses', approvedExpensesTotal.toFixed(2)],
      ['Estimated Net Take-Home Pay', netTakeHome.toFixed(2)],
      ['Mean Hourly Rate', meanHourlyRate.toFixed(2)],
      ['Mean Pay Per Shift', meanPayPerShift.toFixed(2)]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crewpulse_earnings_and_tax_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white max-h-[92vh] overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Earnings, Overtime &amp; Tax Analytics</h3>
              <p className="text-xs text-slate-400">
                Detailed wage breakdown, mean hourly earnings &amp; HMRC tax estimate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Range Toggle */}
            <div className="flex p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setTimeRange('month')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors",
                  timeRange === 'month' ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors",
                  timeRange === '30days' ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors",
                  timeRange === 'all' ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                All Time
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Gross Wages */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Gross Earnings
            </p>
            <p className="text-xl font-mono font-black text-white">
              {formatCurrency(grossEarnings, currency)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {totalHours.toFixed(1)}h logged ({shiftCount} shifts)
            </p>
          </div>

          {/* Overtime Wages */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Overtime Pay
              </p>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl font-mono font-black text-amber-300">
              {formatCurrency(overtimePay, currency)}
            </p>
            <p className="text-[10px] text-amber-400/70 mt-1">
              {overtimeHours.toFixed(1)} OT hours @ 1.5x
            </p>
          </div>

          {/* Tax & NI Deductions */}
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
            <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
              Est. Tax &amp; NI (-28%)
            </p>
            <p className="text-xl font-mono font-black text-rose-300">
              -{formatCurrency(totalDeductions, currency)}
            </p>
            <p className="text-[10px] text-rose-400/70 mt-1">
              {taxRate}% Tax + {niRate}% NI
            </p>
          </div>

          {/* Net Take-Home */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Est. Take-Home Net
            </p>
            <p className="text-xl font-mono font-black text-emerald-300">
              {formatCurrency(netTakeHome, currency)}
            </p>
            <p className="text-[10px] text-emerald-400/70 mt-1">
              +{formatCurrency(approvedExpensesTotal, currency)} expenses
            </p>
          </div>
        </div>

        {/* Statistical Means Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium">Mean Hourly Rate</p>
              <p className="font-mono font-bold text-white text-sm">
                {formatCurrency(meanHourlyRate, currency)}/hr
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium">Mean Pay Per Shift</p>
              <p className="font-mono font-bold text-white text-sm">
                {formatCurrency(meanPayPerShift, currency)}/shift
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium">Approved Claims</p>
              <p className="font-mono font-bold text-white text-sm">
                {formatCurrency(approvedExpensesTotal, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Hours Worked By Venue / Job Site Chart */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">Hours Worked by Venue</h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {venueChartData.length} locations
            </span>
          </div>

          {venueChartData.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No shift records logged in this timeframe.
            </div>
          ) : (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={venueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    angle={-20} 
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`${val} hours`, 'Hours']}
                  />
                  <Bar dataKey="hours" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tax Deduction Breakdown Configurator */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Deductions Calculator Configuration</span>
            </div>
            <span className="text-[11px] text-slate-500">Preview estimates only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Income Tax Bracket Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                National Insurance / Pension Levy (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={niRate}
                onChange={(e) => setNiRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-2 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download CSV Statement</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
