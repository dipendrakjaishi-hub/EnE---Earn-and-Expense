import React, { useMemo } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { Clock, TrendingUp, Calendar, DollarSign, Award } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export default function MyHoursSummary() {
  const { shifts, currentUser, currentBusiness } = useCrewPulse();
  const currency = currentBusiness?.currency || 'GBP';

  // Calculate my stats
  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const myShifts = shifts.filter(s => s.user_id === currentUser.id && s.status === 'completed');

    let weekHours = 0;
    let weekPay = 0;
    let monthHours = 0;
    let monthPay = 0;

    myShifts.forEach(s => {
      const shiftDate = new Date(s.clock_in);
      const hours = Number(s.total_hours) || 0;
      const pay = Number(s.estimated_pay) || 0;

      if (shiftDate >= oneWeekAgo) {
        weekHours += hours;
        weekPay += pay;
      }

      if (shiftDate >= startOfMonth) {
        monthHours += hours;
        monthPay += pay;
      }
    });

    return {
      weekHours: Math.round(weekHours * 10) / 10,
      weekPay: Math.round(weekPay * 100) / 100,
      monthHours: Math.round(monthHours * 10) / 10,
      monthPay: Math.round(monthPay * 100) / 100,
      totalCompleted: myShifts.length
    };
  }, [shifts, currentUser]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      {/* This Week Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            This Week
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="text-2xl font-black text-white font-mono">{stats.weekHours}h</h3>
          <span className="text-xs font-bold text-emerald-400">
            {formatCurrency(stats.weekPay, currency)}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Rolling 7-day total hours</p>
      </div>

      {/* This Month Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            This Month
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="text-2xl font-black text-white font-mono">{stats.monthHours}h</h3>
          <span className="text-xs font-bold text-emerald-400">
            {formatCurrency(stats.monthPay, currency)}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Calendar month earnings</p>
      </div>

      {/* Shifts Completed Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 col-span-2 lg:col-span-1 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Log Summary
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="text-2xl font-black text-white font-mono">{stats.totalCompleted}</h3>
          <span className="text-xs font-bold text-slate-400">
            Completed Shifts
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Verified on business ledger</p>
      </div>
    </div>
  );
}
