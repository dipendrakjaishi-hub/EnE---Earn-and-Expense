import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, cn } from '../lib/utils';
import { base44 } from '../api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Briefcase, ReceiptText, Clock, Calendar, DollarSign, Building, FileSpreadsheet, LayoutDashboard, Plus } from 'lucide-react';
import { WorkShift, Expense } from '../types';
import WorkExcelSheet from '../components/WorkExcelSheet';

export default function Home() {
  const { user, settings } = useAppContext();
  const isDark = settings?.theme === 'dark';

  const { data: shifts = [] } = useQuery<WorkShift[]>({
    queryKey: ['workShifts', user?.email],
    queryFn: async () => {
      return await (base44.entities.WorkShift as any).list({
        q: JSON.stringify({ created_by: user?.email }),
        sort_by: '-date'
      });
    },
    enabled: !!user
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['expenses', user?.email],
    queryFn: async () => {
      return await (base44.entities.Expense as any).list({
        q: JSON.stringify({ created_by: user?.email }),
        sort_by: '-date'
      });
    },
    enabled: !!user
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['companies', user?.email],
    queryFn: async () => {
      return await (base44.entities.Company as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'sheet' | 'overview'>(
    searchParams.get('view') === 'overview' ? 'overview' : 'sheet'
  );

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    if (searchParams.get('view') === 'sheet') {
      setViewMode('sheet');
    }
  }, [searchParams]);

  const currency = settings?.currency || 'USD';
  const totalIncome = shifts.reduce((sum, s) => sum + (s.total_income || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const getCategoryLabel = (catId: string) => {
    const labels: Record<string, string> = {
        'groceries': 'Groceries',
        'rent': 'Rent',
        'transportation': 'Transportation',
        'utilities': 'Utilities',
        'subscriptions': 'Subscriptions',
        'entertainment': 'Entertainment',
        'food': 'Food',
        'supplies': 'Supplies',
        'tools': 'Tools',
        'sim': 'SIM/Phone',
        'other': 'Other'
    };
    return labels[catId] || catId.charAt(0).toUpperCase() + catId.slice(1);
  };

  // Combine for transactions list
  const recentActivity = [
    ...shifts.map(s => {
      const comp = companies.find(c => c.id === s.company_id);
      return {
        id: s.id,
        title: comp?.name || s.job_description || 'Work Shift',
        amount: s.total_income || 0,
        date: s.date,
        type: 'income' as const,
        category: 'Work',
        details: {
          startTime: s.start_time,
          endTime: s.end_time,
          totalHours: s.total_hours,
          hourlyRate: s.hourly_rate,
          company: comp?.name,
          color: comp?.color
        }
      };
    }),
    ...expenses.map(e => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      date: e.date || '',
      type: 'expense' as const,
      category: getCategoryLabel(e.category || 'Other'),
      details: null
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Prepare chart data (last 30 days summary)
  const chartData = recentActivity.slice(0, 15).reverse().map(item => ({
    name: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    amount: item.amount,
    type: item.type
  }));

  return (
    <Layout currentPageName="Home">
      <div className="p-4 space-y-5">
        {/* View Mode Segmented Control Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-600/10 via-violet-600/10 to-indigo-600/10 border border-emerald-500/20 p-2 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Work & Job Hours Tracker
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => {
                setViewMode('sheet');
                setSearchParams({ view: 'sheet' });
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'sheet'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>📊 Excel Sheet View</span>
            </button>

            <button
              onClick={() => {
                setViewMode('overview');
                setSearchParams({ view: 'overview' });
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'overview'
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <LayoutDashboard className="w-4 h-4 text-violet-300" />
              <span>📈 Dashboard Overview</span>
            </button>
          </div>
        </div>

        {/* View 1: Excel Sheet Mode */}
        {viewMode === 'sheet' && (
          <div className="space-y-4">
            <WorkExcelSheet />
          </div>
        )}

        {/* View 2: Dashboard Overview Mode (or shown below if desired) */}
        {viewMode === 'overview' && (
          <>
            {/* Balance Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 shadow-2xl shadow-violet-500/20">
                <div className="relative z-10">
                    <p className="text-violet-200 text-sm font-medium mb-1">Total Balance</p>
                    <h1 className="text-4xl font-bold text-white mb-4">{formatCurrency(balance, currency)}</h1>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                            <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-violet-200">Income</p>
                                <p className="text-sm font-semibold text-white">{formatCurrency(totalIncome, currency)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                            <div className="w-6 h-6 rounded-full bg-rose-400/20 flex items-center justify-center text-rose-400">
                                <ArrowDownRight className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-violet-200">Expenses</p>
                                <p className="text-sm font-semibold text-white">{formatCurrency(totalExpense, currency)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-black/10 blur-2xl"></div>
            </div>

        {/* Analytics Chart */}
        <div className={cn(
            "rounded-3xl p-5 border shadow-sm",
            isDark ? "bg-black/40 border-white/10 backdrop-blur-md" : "bg-white border-gray-100"
        )}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>Activity</h3>
                <span className={cn("text-xs px-2 py-1 rounded-full", isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")}>Recent</span>
            </div>
            <div className="h-48 w-full relative">
                {isMounted && chartData.length > 0 && (
                    <ResponsiveContainer width={'100%'} height={'100%'} minWidth={0} minHeight={0} debounce={100}>
                        <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: isDark ? '#111' : '#fff', 
                                borderRadius: '12px', 
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                            }} 
                            itemStyle={{ color: isDark ? '#fff' : '#000' }}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
                )}
            </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className={cn("font-black uppercase tracking-[0.2em] text-[10px] opacity-50", isDark ? "text-white" : "text-gray-900")}>Operational History</h3>
                <div className="flex gap-1">
                   {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 rounded-full bg-violet-600/30" />)}
                </div>
            </div>
            
            {recentActivity.length === 0 ? (
                <div className={cn(
                    "text-center py-16 rounded-[2rem] border-2 border-dashed",
                    isDark ? "border-white/5 text-gray-500" : "border-gray-100 text-gray-400"
                )}>
                    <div className="mb-4 opacity-20">
                        <Briefcase className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-[10px]">No logs detected in core memory</p>
                </div>
            ) : (
                recentActivity.slice(0, 10).map((t) => (
                    <div key={`${t.type}-${t.id}`} className={cn(
                        "p-5 rounded-[32px] border-2 transition-all duration-300 relative group overflow-hidden",
                        isDark 
                          ? "bg-black/40 border-white/5 backdrop-blur-md hover:bg-white/5 hover:border-violet-500/20" 
                          : "bg-white border-gray-50 hover:shadow-2xl hover:shadow-gray-200/50 hover:border-violet-500/10"
                    )}>
                        {t.type === 'income' && t.details ? (
                            <div className="space-y-5">
                                {/* Header: Company & Amount */}
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-500">
                                            <Briefcase className="w-7 h-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xl font-black tracking-tight truncate max-w-[140px] sm:max-w-none">
                                                {t.details.company || t.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 inline-flex">
                                                 <Calendar className="w-3 h-3 text-emerald-600" />
                                                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                     {new Date(t.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                 </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-emerald-500 leading-none mb-1">
                                            +{formatCurrency(t.amount)}
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Gross Earnings</p>
                                    </div>
                                </div>

                                {/* Detailed Grid */}
                                <div className={cn(
                                    "grid grid-cols-2 gap-px bg-current opacity-10 rounded-2xl overflow-hidden border-2",
                                    isDark ? "border-white/5" : "border-gray-100"
                                )}>
                                    <div className={cn("p-4", isDark ? "bg-zinc-900/50" : "bg-gray-50/50")}>
                                        <div className="flex items-center gap-2 mb-1.5 opacity-40">
                                            <Clock className="w-3 h-3" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">Shift Window</p>
                                        </div>
                                        <p className="text-xs font-black">{t.details.startTime || '--:--'} - {t.details.endTime || '--:--'}</p>
                                    </div>
                                    <div className={cn("p-4", isDark ? "bg-zinc-900/50" : "bg-gray-50/50")}>
                                        <div className="flex items-center gap-2 mb-1.5 opacity-40">
                                            <Clock className="w-3 h-3" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">Logged Duration</p>
                                        </div>
                                        <p className="text-xs font-black">{t.details.totalHours || 0} Hours</p>
                                    </div>
                                    <div className={cn("col-span-2 p-4", isDark ? "bg-zinc-900/50" : "bg-gray-50/50")}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 opacity-40">
                                                <DollarSign className="w-3 h-3" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">Hourly Value</p>
                                            </div>
                                            <p className="text-sm font-black text-violet-500">{formatCurrency(t.details.hourlyRate || 0)} <span className="opacity-30 text-[9px]">/ HOUR</span></p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Background Glow Decor */}
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            </div>
                        ) : (
                            /* Expense Layout */
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-500">
                                        <ReceiptText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className={cn("font-black text-lg tracking-tight", isDark ? "text-white" : "text-gray-900")}>
                                            {t.title}
                                        </h4>
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest mt-0.5", isDark ? "text-zinc-500" : "text-gray-400")}>
                                            {t.category} • {new Date(t.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-xl tracking-tight text-rose-500">
                                        -{formatCurrency(t.amount)}
                                    </span>
                                    <div className="flex justify-end gap-0.5 mt-1 opacity-20">
                                        {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-rose-500" />)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
        </>
        )}
      </div>
    </Layout>
  );
}
