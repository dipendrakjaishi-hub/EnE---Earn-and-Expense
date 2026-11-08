import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, cn, downloadCSV } from '../lib/utils';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Briefcase, Calendar, Clock, Trash2, Share2, Users, ShieldCheck, Download, Trash, Target, TrendingUp, Sparkles, X, FileSpreadsheet } from 'lucide-react';
import { Company, WorkShift, TrustedPerson, IncomeGoal } from '../types';
import { toast } from 'sonner';
import WorkExcelSheet from '../components/WorkExcelSheet';

export default function Income() {
  const { user, settings } = useAppContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'shifts' | 'sheet' | 'companies' | 'trusted' | 'goals'>('sheet');
  const [isAdding, setIsAdding] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [reportRange, setReportRange] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  
  // States for new shift
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [hourlyRate, setHourlyRate] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // States for new company
  const [companyName, setCompanyName] = useState('');
  const [defaultRate, setDefaultRate] = useState('');

  // States for trusted person
  const [trustedEmail, setTrustedEmail] = useState('');
  const [trustedRelation, setTrustedRelation] = useState('');

  // States for new goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalProgress, setGoalProgress] = useState('');
  const [goalPeriod, setGoalPeriod] = useState('Monthly Savings');
  const [goalCategory, setGoalCategory] = useState('Savings');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [tempProgress, setTempProgress] = useState('');

  const isDark = settings?.theme === 'dark';

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies', user?.email],
    queryFn: async () => {
      return await (base44.entities.Company as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

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

  const { data: trustedCircle = [] } = useQuery<TrustedPerson[]>({
    queryKey: ['trustedCircle', user?.email],
    queryFn: async () => {
      return await (base44.entities.TrustedPerson as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  const addShiftMutation = useMutation({
    mutationFn: async (newShift: any) => {
      return await (base44.entities.WorkShift as any).create({
        ...newShift,
        created_by: user?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workShifts'] });
      setIsAdding(false);
      toast.success('Shift added successfully');
      setJobDescription('');
    }
  });

  const addCompanyMutation = useMutation({
    mutationFn: async (newCompany: any) => {
      return await (base44.entities.Company as any).create({
        ...newCompany,
        created_by: user?.email,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsAdding(false);
      toast.success('Company added successfully');
      setCompanyName('');
      setDefaultRate('');
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
        return await (base44.entities.WorkShift as any).delete(id);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workShifts'] });
        toast.success('Shift deleted');
    }
  });

  const addTrustedMutation = useMutation({
    mutationFn: async (person: any) => {
        return await (base44.entities.TrustedPerson as any).create({
            ...person,
            created_by: user?.email,
            access_level: 'read'
        });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['trustedCircle'] });
        setIsAdding(false);
        setTrustedEmail('');
        setTrustedRelation('');
        toast.success('Trusted person added');
    }
  });

  const deleteTrustedMutation = useMutation({
    mutationFn: (id: string) => (base44.entities.TrustedPerson as any).delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trustedCircle'] })
  });

  const { data: goals = [] } = useQuery<IncomeGoal[]>({
    queryKey: ['incomeGoals', user?.email],
    queryFn: async () => {
      return await (base44.entities.IncomeGoal as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  const addGoalMutation = useMutation({
    mutationFn: async (newGoal: any) => {
      return await (base44.entities.IncomeGoal as any).create({
        ...newGoal,
        created_by: user?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeGoals'] });
      setIsAdding(false);
      toast.success('Income goal set successfully');
      setGoalTitle('');
      setGoalTarget('');
      setGoalProgress('');
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await (base44.entities.IncomeGoal as any).update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeGoals'] });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return await (base44.entities.IncomeGoal as any).delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeGoals'] });
      toast.success('Goal removed');
    }
  });

  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !date || !startTime || !endTime) {
        toast.error('Please fill in required fields');
        return;
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
    const hours = diffMs / (1000 * 60 * 60);
    
    const comp = companies.find(c => c.id === companyId);
    const rate = parseFloat(hourlyRate) || comp?.hourly_rate || 0;

    let totalIncome = hours * rate;
    const otStart = comp?.overtime_start_hours || 0;
    const otMultiplier = comp?.overtime_rate || 1;

    if (otStart > 0 && hours > otStart) {
      const standardHours = otStart;
      const overtimeHours = hours - otStart;
      totalIncome = (standardHours * rate) + (overtimeHours * rate * otMultiplier);
    }

    addShiftMutation.mutate({
      company_id: companyId,
      date,
      start_time: startTime,
      end_time: endTime,
      hourly_rate: rate,
      total_hours: hours,
      total_income: totalIncome,
      job_description: jobDescription,
      month: new Date(date).getMonth() + 1,
      year: new Date(date).getFullYear()
    });
  };

  const calculatePreviewIncome = () => {
    const rate = parseFloat(hourlyRate) || 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
    const hours = diffMs / 3600000;
    
    const comp = companies.find(c => c.id === companyId);
    const otStart = comp?.overtime_start_hours || 0;
    const otMultiplier = comp?.overtime_rate || 1;

    if (otStart > 0 && hours > otStart) {
      const standardHours = otStart;
      const overtimeHours = hours - otStart;
      return (standardHours * rate) + (overtimeHours * rate * otMultiplier);
    }
    return hours * rate;
  };

  // Summary Calculations
  const now = new Date();
  const thisWeekShifts = shifts.filter(s => {
      const d = new Date(s.date);
      const diff = now.getTime() - d.getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
  });
  const thisMonthShifts = shifts.filter(s => s.month === now.getMonth() + 1 && s.year === now.getFullYear());

  const weeklyIncome = thisWeekShifts.reduce((sum, s) => sum + (s.total_income || 0), 0);
  const monthlyIncome = thisMonthShifts.reduce((sum, s) => sum + (s.total_income || 0), 0);

  const handleExport = (range: 'daily' | 'weekly' | 'monthly' | 'all' = 'all') => {
      let filteredShifts = [...shifts];
      const now = new Date();

      if (range === 'daily') {
          filteredShifts = shifts.filter(s => s.date === now.toISOString().split('T')[0]);
      } else if (range === 'weekly') {
          filteredShifts = shifts.filter(s => {
              const d = new Date(s.date);
              return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
          });
      } else if (range === 'monthly') {
          filteredShifts = shifts.filter(s => s.month === now.getMonth() + 1 && s.year === now.getFullYear());
      }

      if (filteredShifts.length === 0) {
          toast.error(`No data for the selected period: ${range}`);
          return;
      }

      const exportData = filteredShifts.map(s => {
          const comp = companies.find(c => c.id === s.company_id);
          return {
              Date: s.date,
              Company: comp?.name || 'Unknown',
              'Start Time': s.start_time,
              'End Time': s.end_time,
              'Total Hours': s.total_hours?.toFixed(2),
              Rate: s.hourly_rate,
              Income: s.total_income?.toFixed(2),
              Description: s.job_description || ''
          };
      });
      downloadCSV(exportData, `Income_Report_${range}_${new Date().toLocaleDateString()}.csv`);
      toast.success(`${range.toUpperCase()} report downloaded!`);
  };

  const handleShareToCircle = (range: string) => {
    if (trustedCircle.length === 0) {
        toast.error("Add someone to your Trusted Circle first");
        setActiveTab('trusted');
        return;
    }
    toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
            loading: `Preparing ${range} report...`,
            success: `Report shared with ${trustedCircle.length} people in your circle!`,
            error: 'Failed to share report',
        }
    );
    setIsSharing(false);
  };

  return (
    <Layout currentPageName="Income">
      <div className="p-4 space-y-6">
        
        {/* Income Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-2">
            <div className={cn(
                "p-4 rounded-3xl border flex flex-col justify-between",
                isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"
            )}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Weekly Earnings</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-xl font-bold text-emerald-500">{formatCurrency(weeklyIncome)}</h3>
                </div>
                <div className="mt-2 flex items-center justify-between opacity-40">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{thisWeekShifts.reduce((sum, s) => sum + (s.total_hours || 0), 0).toFixed(1)}h</span>
                    </div>
                    <span className="text-[10px] font-bold">{thisWeekShifts.length} Shifts</span>
                </div>
            </div>
            <div className={cn(
                "p-4 rounded-3xl border flex flex-col justify-between",
                isDark ? "bg-violet-500/10 border-violet-500/20" : "bg-violet-50 border-violet-100"
            )}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Monthly Earnings</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-xl font-bold text-violet-500">{formatCurrency(monthlyIncome)}</h3>
                </div>
                <div className="mt-2 flex items-center justify-between opacity-40">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{thisMonthShifts.reduce((sum, s) => sum + (s.total_hours || 0), 0).toFixed(1)}h</span>
                    </div>
                    <span className="text-[10px] font-bold">{thisMonthShifts.length} Shifts</span>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between">
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                <button 
                  onClick={() => setActiveTab('sheet')}
                  className={cn(
                    "text-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                    activeTab === 'sheet' ? "text-emerald-400 font-extrabold" : "text-gray-500 opacity-50 scale-90"
                  )}
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>Excel Sheet</span>
                </button>
                <button 
                  onClick={() => setActiveTab('shifts')}
                  className={cn(
                    "text-xl font-bold transition-all whitespace-nowrap",
                    activeTab === 'shifts' ? (isDark ? "text-white" : "text-gray-900") : "text-gray-500 opacity-50 scale-90"
                  )}
                >
                  Shifts
                </button>
                <button 
                  onClick={() => setActiveTab('companies')}
                  className={cn(
                    "text-xl font-bold transition-all whitespace-nowrap",
                    activeTab === 'companies' ? (isDark ? "text-white" : "text-gray-900") : "text-gray-500 opacity-50 scale-90"
                  )}
                >
                  Companies
                </button>
                <button 
                  onClick={() => setActiveTab('trusted')}
                  className={cn(
                    "text-xl font-bold transition-all whitespace-nowrap",
                    activeTab === 'trusted' ? (isDark ? "text-white" : "text-gray-900") : "text-gray-500 opacity-50 scale-90"
                  )}
                >
                  Trusted Circle
                </button>
                <button 
                  onClick={() => setActiveTab('goals')}
                  className={cn(
                    "text-xl font-bold transition-all whitespace-nowrap",
                    activeTab === 'goals' ? (isDark ? "text-white" : "text-gray-900") : "text-gray-500 opacity-50 scale-90"
                  )}
                >
                  Income Goals
                </button>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsSharing(true)}
                    className={cn(
                        "p-2.5 rounded-2xl flex items-center gap-2 transition-all active:scale-95",
                        isDark ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                    )}
                >
                    <Share2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Share Hub</span>
                </button>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-colors"
                >
                    <Plus className={cn("w-6 h-6 transition-transform", isAdding ? "rotate-45" : "")} />
                </button>
            </div>
        </div>

        {/* Share Hub Modal */}
        {isSharing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className={cn(
                    "w-full max-w-lg rounded-[40px] border relative overflow-hidden",
                    isDark ? "bg-zinc-950 border-white/10" : "bg-white border-gray-100 shadow-2xl"
                )}>
                    <div className="p-8 pb-4">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-violet-600 rounded-2xl text-white shadow-xl shadow-violet-600/20">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Financial Share Hub</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Export & circle notification</p>
                                </div>
                            </div>
                            <button onClick={() => setIsSharing(false)} className="p-3 rounded-2xl hover:bg-zinc-500/10 opacity-50">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Select Period</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['daily', 'weekly', 'monthly', 'all'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setReportRange(range as any)}
                                            className={cn(
                                                "p-4 rounded-[20px] border text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                                reportRange === range 
                                                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20" 
                                                    : isDark ? "bg-white/5 border-white/5 text-zinc-500" : "bg-gray-50 border-gray-100 text-gray-500"
                                            )}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={cn(
                                "p-6 rounded-[32px] border",
                                isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                            )}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Identity Status</p>
                                        <p className="text-[10px] opacity-40 font-bold uppercase">{trustedCircle.length} Circle members verified</p>
                                    </div>
                                </div>
                                <p className="text-[10px] opacity-40 leading-relaxed font-bold italic">"Your income progress report is ready. You can download the full spreadsheet or notify your inner circle immediately."</p>
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "p-8 pt-4 flex flex-col gap-3",
                        isDark ? "bg-zinc-900/50" : "bg-gray-50/50"
                    )}>
                        <button 
                            onClick={() => handleExport(reportRange)}
                            className="h-16 rounded-[24px] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20"
                        >
                            <Download className="w-5 h-5" /> Download CSV Report
                        </button>
                        <button 
                            onClick={() => handleShareToCircle(reportRange)}
                            className="h-16 rounded-[24px] bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-violet-600/20"
                        >
                            <Users className="w-5 h-5" /> Share to Circle
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Forms */}
        {isAdding && (
            <div className={cn(
                "p-5 rounded-3xl border animate-in slide-in-from-top-4 fade-in duration-300",
                isDark ? "bg-black/60 border-white/10 backdrop-blur-md" : "bg-white border-gray-200 shadow-xl"
            )}>
                {activeTab === 'shifts' ? (
                    <form onSubmit={handleShiftSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Select Company</label>
                                <select
                                    value={companyId}
                                    onChange={(e) => {
                                        setCompanyId(e.target.value);
                                        const comp = companies.find(c => c.id === e.target.value);
                                        if (comp?.hourly_rate) setHourlyRate(comp.hourly_rate.toString());
                                    }}
                                    className={cn(
                                        "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                                        isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                                    )}
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Work Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                                        isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>In</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                                        isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Out</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                                        isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Rate (/hr)</label>
                                <input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    placeholder="0.00"
                                    className={cn(
                                        "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                                        isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                                    )}
                                />
                            </div>
                            <div>
                                <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Est. Total</label>
                                <div className={cn(
                                    "w-full p-4 rounded-2xl text-center font-bold flex items-center justify-center",
                                    isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    {formatCurrency(calculatePreviewIncome())}
                                </div>
                            </div>
                        </div>
                        <button 
                          disabled={addShiftMutation.isPending}
                          type="submit" 
                          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" /> {addShiftMutation.isPending ? 'Logging...' : 'Log Shift'}
                        </button>
                    </form>
                ) : activeTab === 'trusted' ? (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!trustedEmail || !trustedRelation) return;
                        addTrustedMutation.mutate({ 
                            email: trustedEmail, 
                            name: trustedEmail.split('@')[0], 
                            relation: trustedRelation 
                        });
                    }} className="space-y-4">
                        <div className="space-y-2">
                           <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Person's Email</label>
                           <input
                            type="email"
                            value={trustedEmail}
                            onChange={(e) => setTrustedEmail(e.target.value)}
                            placeholder="mother@example.com"
                            className={cn(
                                "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                                isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                            )}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Relationship</label>
                           <input
                            type="text"
                            value={trustedRelation}
                            onChange={(e) => setTrustedRelation(e.target.value)}
                            placeholder="Wife, Father, Accountant..."
                            className={cn(
                                "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                                isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                            )}
                           />
                        </div>
                        <button 
                          disabled={addTrustedMutation.isPending}
                          type="submit" 
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-5 h-5" /> Add to Circle
                        </button>
                    </form>
                ) : activeTab === 'goals' ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!goalTitle || !goalTarget) return;
                    addGoalMutation.mutate({
                      title: goalTitle,
                      target_amount: parseFloat(goalTarget),
                      current_progress: parseFloat(goalProgress) || 0,
                      period: goalPeriod,
                      category: goalCategory
                    });
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Goal Title</label>
                        <input
                          type="text"
                          value={goalTitle}
                          onChange={(e) => setGoalTitle(e.target.value)}
                          placeholder="e.g., New Laptop, Car Deposit"
                          className={cn(
                            "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                            isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                          )}
                        />
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Target Amount</label>
                        <input
                          type="number"
                          value={goalTarget}
                          onChange={(e) => setGoalTarget(e.target.value)}
                          placeholder="0.00"
                          className={cn(
                            "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                            isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                          )}
                        />
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Initial Progress</label>
                        <input
                          type="number"
                          value={goalProgress}
                          onChange={(e) => setGoalProgress(e.target.value)}
                          placeholder="0.00"
                          className={cn(
                            "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                            isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                          )}
                        />
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Goal Period</label>
                        <select
                          value={goalPeriod}
                          onChange={(e) => setGoalPeriod(e.target.value)}
                          className={cn(
                            "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                            isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                          )}
                        >
                          <option>Monthly Savings</option>
                          <option>Quarterly Target</option>
                          <option>Yearly Investment</option>
                          <option>Special Occasion</option>
                        </select>
                      </div>
                      <div>
                        <label className={cn("text-xs font-bold uppercase tracking-widest ml-1 mb-1 block", isDark ? "text-gray-400" : "text-gray-500")}>Category</label>
                        <select
                          value={goalCategory}
                          onChange={(e) => setGoalCategory(e.target.value)}
                          className={cn(
                            "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 transition-all",
                            isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 text-gray-900 border border-gray-200"
                          )}
                        >
                          <option>Savings</option>
                          <option>Investment</option>
                          <option>Purchase</option>
                          <option>Travel</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      disabled={addGoalMutation.isPending}
                      type="submit" 
                      className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" /> {addGoalMutation.isPending ? 'Setting goal...' : 'Set Income Goal'}
                    </button>
                  </form>
                ) : (
                    <form onSubmit={(e) => {
                         e.preventDefault();
                         if (!companyName) return;
                         addCompanyMutation.mutate({ name: companyName, hourly_rate: parseFloat(defaultRate) || 0 });
                    }} className="space-y-4">
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Company Name"
                            className={cn("w-full p-4 rounded-2xl", isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 border border-gray-200")}
                        />
                         <input
                            type="number"
                            value={defaultRate}
                            onChange={(e) => setDefaultRate(e.target.value)}
                            placeholder="Default Hourly Rate"
                            className={cn("w-full p-4 rounded-2xl", isDark ? "bg-white/5 text-white border border-white/5" : "bg-gray-50 border border-gray-200")}
                        />
                        <button type="submit" className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold">Add Company</button>
                    </form>
                )}
            </div>
        )}

        {/* Content List */}
        <div className="space-y-4">
            {activeTab === 'sheet' ? (
                <WorkExcelSheet />
            ) : activeTab === 'shifts' ? (
                shifts.length === 0 ? (
                    <div className="text-center py-20 opacity-30 space-y-2">
                        <Calendar className="w-12 h-12 mx-auto" />
                        <p className="font-bold uppercase tracking-widest text-xs">No shifts logged</p>
                    </div>
                ) : (
                    shifts.map((s) => {
                        const comp = companies.find(c => c.id === s.company_id);
                        return (
                            <div key={s.id} className={cn(
                                "p-6 rounded-[32px] border transition-all relative group overflow-hidden",
                                isDark ? "bg-black/40 border-white/5 backdrop-blur-md" : "bg-white border-gray-100 shadow-sm"
                            )}>
                                {/* Header: Company & Date */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg",
                                            isDark ? "bg-zinc-800" : "bg-zinc-900"
                                        )}>
                                            {comp?.name.charAt(0) || <Briefcase className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className={cn("font-black text-xl tracking-tight leading-none", isDark ? "text-white" : "text-gray-900")}>
                                              {comp?.name || 'Unknown Company'}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Calendar className="w-3 h-3 opacity-40" />
                                                <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40")}>
                                                  {new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-1",
                                            isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            Paid
                                        </div>
                                        <button 
                                            onClick={() => deleteShiftMutation.mutate(s.id)}
                                            className="p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Shift Stats Grid */}
                                <div className={cn(
                                    "grid grid-cols-3 gap-4 p-4 rounded-2xl mb-4",
                                    isDark ? "bg-white/5 border border-white/5" : "bg-gray-50 border border-gray-100"
                                )}>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Timing</p>
                                        <div className="flex items-center gap-1.5 text-xs font-bold">
                                            <Clock className="w-3.5 h-3.5 text-violet-500" />
                                            <span>{s.start_time} - {s.end_time}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Total Hours</p>
                                        <p className="text-xs font-bold">{s.total_hours?.toFixed(2)} hrs</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Hourly Rate</p>
                                        <p className="text-xs font-bold">{formatCurrency(s.hourly_rate || 0)}/hr</p>
                                    </div>
                                </div>

                                {/* Footer: Job Description & Total Income */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 mr-4">
                                        {s.job_description && (
                                            <p className="text-xs opacity-50 italic line-clamp-1">"{s.job_description}"</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Total Earned</p>
                                        <p className="text-2xl font-black text-emerald-500 leading-none mt-1">
                                            {formatCurrency(s.total_income || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )
            ) : activeTab === 'trusted' ? (
                <div className="space-y-3">
                    <div className={cn(
                        "p-4 rounded-2xl border flex items-center gap-3",
                        isDark ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    )}>
                        <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                        <p className="text-xs font-semibold leading-relaxed">People in your Trusted Circle can view your income reports to help track your financial progress.</p>
                    </div>
                    {trustedCircle.map(person => (
                        <div key={person.id} className={cn(
                            "flex items-center justify-between p-5 rounded-3xl border",
                            isDark ? "bg-black/40 border-white/5 backdrop-blur-md" : "bg-white border-gray-100 shadow-sm"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-500">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>{person.name}</h4>
                                    <div className="flex gap-2 items-center mt-1">
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-500 font-bold uppercase">{person.relation}</span>
                                        <span className={cn("text-[10px] font-bold opacity-40", isDark ? "text-white" : "text-black")}>{person.email}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => deleteTrustedMutation.mutate(person.id)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {trustedCircle.length === 0 && (
                        <div className="text-center py-20 opacity-30 space-y-2">
                             <Users className="w-12 h-12 mx-auto" />
                             <p className="font-bold uppercase tracking-widest text-xs">Your circle is empty</p>
                        </div>
                    )}
                </div>
            ) : activeTab === 'goals' ? (
                <div className="space-y-4">
                    <div className={cn(
                        "p-6 rounded-[32px] border",
                        isDark ? "bg-violet-500/5 border-violet-500/10" : "bg-violet-50 border-violet-100"
                    )}>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-600/20">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Financial Targets</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Track your milestones</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {goals.length === 0 ? (
                            <div className="text-center py-20 opacity-30 space-y-2">
                                <TrendingUp className="w-12 h-12 mx-auto" />
                                <p className="font-bold uppercase tracking-widest text-xs">No goals set yet</p>
                            </div>
                        ) : (
                            goals.map(goal => {
                                const progress = Math.min(100, (goal.current_progress / goal.target_amount) * 100);
                                const isEditing = editingGoalId === goal.id;
                                
                                return (
                                    <div key={goal.id} className={cn(
                                        "p-6 rounded-[32px] border transition-all relative group overflow-hidden",
                                        isDark ? "bg-black/40 border-white/5 backdrop-blur-md" : "bg-white border-gray-100 shadow-sm"
                                    )}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg",
                                                        isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"
                                                    )}>
                                                        {goal.category}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-30">
                                                        {goal.period}
                                                    </span>
                                                </div>
                                                <h4 className="text-xl font-black tracking-tight">{goal.title}</h4>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        if (isEditing) {
                                                            setEditingGoalId(null);
                                                        } else {
                                                            setEditingGoalId(goal.id);
                                                            setTempProgress(goal.current_progress.toString());
                                                        }
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        isEditing 
                                                            ? "bg-amber-500 text-white" 
                                                            : isDark ? "bg-white/5 text-gray-400 hover:text-white" : "bg-gray-100 text-gray-400 hover:text-gray-900"
                                                    )}
                                                >
                                                    <Plus className={cn("w-4 h-4 transition-transform", isEditing ? "rotate-45" : "")} />
                                                </button>
                                                <button 
                                                    onClick={() => deleteGoalMutation.mutate(goal.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Current Progress</p>
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                autoFocus
                                                                value={tempProgress}
                                                                onChange={(e) => setTempProgress(e.target.value)}
                                                                className={cn(
                                                                    "w-24 p-2 rounded-lg text-sm font-bold outline-none",
                                                                    isDark ? "bg-white/10 border border-white/10" : "bg-gray-50 border border-gray-200"
                                                                )}
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    updateGoalMutation.mutate({ 
                                                                        id: goal.id, 
                                                                        data: { current_progress: parseFloat(tempProgress) || 0 } 
                                                                    });
                                                                    setEditingGoalId(null);
                                                                }}
                                                                className="p-2 bg-emerald-500 text-white rounded-lg"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xl font-bold text-emerald-500">{formatCurrency(goal.current_progress)}</p>
                                                    )}
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Target Amount</p>
                                                    <p className="text-xl font-black opacity-30">{formatCurrency(goal.target_amount)}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="relative h-2 w-full bg-black/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="absolute h-full left-0 top-0 bg-violet-600 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                    <span className="opacity-40">{progress.toFixed(0)}% Complete</span>
                                                    {progress >= 100 && (
                                                        <span className="text-emerald-500 flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3" /> Goal Achieved
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : (
                companies.map((c) => (
                    <div key={c.id} className={cn(
                        "flex items-center justify-between p-5 rounded-3xl border transition-all",
                        isDark ? "bg-black/40 border-white/10 backdrop-blur-md" : "bg-white border-gray-100"
                    )}>
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl"
                                style={{ backgroundColor: c.color || '#8b5cf6' }}
                            >
                                {c.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>{c.name}</h4>
                                <p className={cn("text-xs font-bold text-emerald-500")}>
                                  {formatCurrency(c.hourly_rate || 0)}/hr base
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                c.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
                            )}>
                                {c.is_active ? 'Active' : 'Paused'}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </Layout>
  );
}
