import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, cn, downloadCSV } from '../lib/utils';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, ReceiptText, TrendingUp, TrendingDown, Wallet, Download, Share2, Tag, FileSpreadsheet, LayoutDashboard } from 'lucide-react';
import { Expense, WorkShift } from '../types';
import { toast } from 'sonner';
import ExpensesExcelSheet from '../components/ExpensesExcelSheet';

export default function Expenses() {
  const { user, settings, updateSettings } = useAppContext();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'sheet' | 'cards'>('sheet');

  const isDark = settings?.theme === 'dark';

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

  const { data: shifts = [] } = useQuery<WorkShift[]>({
    queryKey: ['workShifts', user?.email],
    queryFn: async () => {
      return await (base44.entities.WorkShift as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (newExpense: any) => {
      return await (base44.entities.Expense as any).create({
        ...newExpense,
        created_by: user?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsAdding(false);
      setTitle('');
      setAmount('');
      setCustomCategory('');
      setIsCustom(false);
      toast.success('Expense added successfully');
    }
  });

  const deleteExpenseMutation = useMutation({
      mutationFn: async (id: string) => {
          return await (base44.entities.Expense as any).delete(id);
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          toast.success('Expense deleted');
      }
  });

  const totalIncome = shifts.reduce((sum, s) => sum + (s.total_income || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const savings = totalIncome - totalExpense;

  const handleExport = () => {
    if (expenses.length === 0) return;
    const exportData = expenses.map(e => ({
        Date: e.date,
        Title: e.title,
        Category: e.category,
        Amount: e.amount,
        Notes: e.notes || ''
    }));
    downloadCSV(exportData, `Expenses_Report_${new Date().toLocaleDateString()}.csv`);
    toast.success("Expenses report downloaded!");
  };

  const defaultCategories = [
    { id: 'groceries', label: 'Groceries', color: 'emerald' },
    { id: 'rent', label: 'Rent', color: 'rose' },
    { id: 'transportation', label: 'Transportation', color: 'blue' },
    { id: 'utilities', label: 'Utilities', color: 'cyan' },
    { id: 'subscriptions', label: 'Subscriptions', color: 'violet' },
    { id: 'entertainment', label: 'Entertainment', color: 'pink' },
    { id: 'food', label: 'Food', color: 'orange' },
    { id: 'travel', label: 'Travel', color: 'blue' },
    { id: 'supplies', label: 'Supplies', color: 'yellow' },
    { id: 'tools', label: 'Tools', color: 'amber' },
    { id: 'other', label: 'Other', color: 'slate' },
  ];

  const customCategories = (settings?.expense_categories || []).map(cat => ({
    id: cat.toLowerCase().replace(/\s+/g, '_'),
    label: cat,
    color: 'slate' as const,
    isCustom: true
  }));

  const allCategories = [...defaultCategories, ...customCategories];

  const getCategoryColor = (catId: string) => {
    const cat = allCategories.find(c => c.id === catId);
    if (cat) return cat.color;
    return 'slate';
  };

  const getCategoryLabel = (catId: string) => {
    const cat = allCategories.find(c => c.id === catId);
    if (cat) return cat.label;
    return catId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleAddPersistentCategory = async () => {
    if (!newCustomCategory.trim()) return;
    try {
      const current = settings?.expense_categories || [];
      if (current.includes(newCustomCategory.trim())) {
        toast.error('Category already exists');
        return;
      }
      await updateSettings({
        expense_categories: [...current, newCustomCategory.trim()]
      });
      setNewCustomCategory('');
      setIsAddingCustom(false);
      toast.success(`Category "${newCustomCategory.trim()}" added!`);
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !title) return;
    const finalCategory = isCustom ? customCategory || 'Other' : category;
    addExpenseMutation.mutate({
      amount: parseFloat(amount),
      title,
      category: finalCategory,
      date,
    });
  };

  return (
    <Layout currentPageName="Expenses">
      <div className="p-4 space-y-6">
        
        {/* Financial Overview Card */}
        <div className={cn(
            "p-6 rounded-[32px] border relative overflow-hidden",
            isDark ? "bg-black/40 border-white/10 backdrop-blur-md" : "bg-white border-gray-100 shadow-xl"
        )}>
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="font-black uppercase tracking-widest text-xs opacity-50">Financial Report</h3>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-all">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Total Income
                    </p>
                    <p className="text-2xl font-black text-inherit">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Total Expenses
                    </p>
                    <p className="text-2xl font-black text-inherit">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-200 flex items-center gap-1">
                        <Wallet className="w-3 h-3" /> Total Savings
                    </p>
                    <p className="text-2xl font-black text-white">{formatCurrency(savings)}</p>
                </div>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="mt-8 h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (totalIncome + totalExpense > 0 ? (totalIncome/(totalIncome+totalExpense))*100 : 50))}%` }} 
                />
                <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (totalIncome + totalExpense > 0 ? (totalExpense/(totalIncome+totalExpense))*100 : 50))}%` }} 
                />
            </div>
        </div>

        {/* View Mode Segmented Control Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-600/10 via-pink-600/10 to-violet-600/10 border border-rose-500/20 p-2 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Expenses & Tax Deductions
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => setViewMode('sheet')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'sheet'
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <FileSpreadsheet className="w-4 h-4 text-rose-300" />
              <span>📊 Excel Sheet View</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'cards'
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <ReceiptText className="w-4 h-4 text-violet-300" />
              <span>💳 Cards View</span>
            </button>
          </div>
        </div>

        {viewMode === 'sheet' ? (
          <ExpensesExcelSheet />
        ) : (
          <>
            <div className="flex items-center justify-between">
                <h1 className={cn("text-2xl font-black uppercase tracking-tighter", isDark ? "text-white" : "text-gray-900")}>Expenses</h1>
                <button 
                    onClick={() => {
                        if (isAdding) {
                            setIsCustom(false);
                            setCustomCategory('');
                        }
                        setIsAdding(!isAdding);
                    }}
                    className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 hover:bg-rose-400 transition-all active:scale-95"
                >
                    <Plus className={cn("w-7 h-7 transition-transform", isAdding ? "rotate-45" : "")} />
                </button>
            </div>

        {/* Add Form */}
        {isAdding && (
            <div className={cn(
                "p-6 rounded-[32px] border animate-in slide-in-from-top-4 fade-in duration-300",
                isDark ? "bg-black/60 border-white/10 backdrop-blur-md" : "bg-white border-gray-200 shadow-xl"
            )}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-50">Expense Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Monthly Rent, SIM Bill..."
                            className={cn(
                                "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/50 transition-all border",
                                isDark ? "bg-white/5 text-white border-white/5" : "bg-gray-50 border-gray-200 text-gray-900"
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-50">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className={cn(
                                    "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/50 transition-all border",
                                    isDark ? "bg-white/5 text-white border-white/5" : "bg-gray-50 border-gray-200 text-gray-900"
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-50">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={cn(
                                    "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/50 transition-all border text-xs",
                                    isDark ? "bg-white/5 text-white border-white/5" : "bg-gray-50 border-gray-200 text-gray-900"
                                )}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1 px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Category</label>
                            <button 
                                type="button"
                                onClick={() => setIsAddingCustom(!isAddingCustom)}
                                className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
                            >
                                {isAddingCustom ? 'Cancel' : '+ Add Category'}
                            </button>
                        </div>

                        {isAddingCustom && (
                            <div className="flex gap-2 mb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                                <input
                                    type="text"
                                    value={newCustomCategory}
                                    onChange={(e) => setNewCustomCategory(e.target.value)}
                                    placeholder="Category name..."
                                    className={cn(
                                        "flex-1 p-3 rounded-xl text-xs outline-none border",
                                        isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddPersistentCategory}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                            {allCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setCategory(cat.id);
                                        setIsCustom(false);
                                    }}
                                    className={cn(
                                        "p-3 rounded-xl text-center text-[10px] font-bold uppercase transition-all border break-words",
                                        category === cat.id && !isCustom
                                            ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/20" 
                                            : isDark ? "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10" : "bg-gray-50 border-gray-200 text-gray-500"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsCustom(true)}
                                className={cn(
                                    "p-3 rounded-xl text-center text-[10px] font-bold uppercase transition-all border",
                                    isCustom
                                        ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/20" 
                                        : isDark ? "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10" : "bg-gray-50 border-gray-200 text-gray-500"
                                )}
                            >
                                One-off Custom
                            </button>
                        </div>
                    </div>
                    {isCustom && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-50">Custom Category Name</label>
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="e.g. Health, Education..."
                                className={cn(
                                    "w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/50 transition-all border",
                                    isDark ? "bg-white/5 text-white border-white/5" : "bg-gray-50 border-gray-200 text-gray-900"
                                )}
                            />
                        </div>
                    )}
                    <button 
                      disabled={addExpenseMutation.isPending}
                      type="submit" 
                      className="w-full py-4 mt-2 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" /> {addExpenseMutation.isPending ? 'Logging...' : 'Save Expense'}
                    </button>
                </form>
            </div>
        )}

        {/* List */}
        <div className="space-y-4">
            {expenses.map((e) => (
                <div key={e.id} className={cn(
                    "p-5 rounded-[32px] border transition-all relative group",
                    isDark ? "bg-black/40 border-white/5 backdrop-blur-md" : "bg-white border-gray-100 shadow-sm"
                )}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                getCategoryColor(e.category || 'other') === 'emerald' ? (isDark ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-500") :
                                getCategoryColor(e.category || 'other') === 'rose' ? (isDark ? "bg-rose-500/10 text-rose-500" : "bg-rose-50 text-rose-500") :
                                getCategoryColor(e.category || 'other') === 'blue' ? (isDark ? "bg-blue-500/10 text-blue-500" : "bg-blue-50 text-blue-500") :
                                getCategoryColor(e.category || 'other') === 'cyan' ? (isDark ? "bg-cyan-500/10 text-cyan-500" : "bg-cyan-50 text-cyan-500") :
                                getCategoryColor(e.category || 'other') === 'violet' ? (isDark ? "bg-violet-500/10 text-violet-500" : "bg-violet-50 text-violet-500") :
                                getCategoryColor(e.category || 'other') === 'pink' ? (isDark ? "bg-pink-500/10 text-pink-500" : "bg-pink-50 text-pink-500") :
                                getCategoryColor(e.category || 'other') === 'orange' ? (isDark ? "bg-orange-500/10 text-orange-500" : "bg-orange-50 text-orange-500") :
                                getCategoryColor(e.category || 'other') === 'amber' ? (isDark ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-500") :
                                getCategoryColor(e.category || 'other') === 'yellow' ? (isDark ? "bg-yellow-500/10 text-yellow-500" : "bg-yellow-50 text-yellow-500") :
                                getCategoryColor(e.category || 'other') === 'indigo' ? (isDark ? "bg-indigo-500/10 text-indigo-500" : "bg-indigo-50 text-indigo-500") :
                                (isDark ? "bg-slate-500/10 text-slate-500" : "bg-slate-50 text-slate-500")
                            )}>
                                <Tag className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={cn("font-bold text-lg leading-tight", isDark ? "text-white" : "text-gray-900")}>{e.title}</h4>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1 opacity-40")}>
                                  {getCategoryLabel(e.category || 'other')} • {e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-rose-500">-{formatCurrency(e.amount)}</p>
                            <button 
                              onClick={(ev) => {
                                ev.stopPropagation();
                                deleteExpenseMutation.mutate(e.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-rose-500/10 rounded-full text-rose-500"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
             {expenses.length === 0 && (
                <div className="text-center py-20 opacity-30 space-y-2">
                    <ReceiptText className="w-12 h-12 mx-auto" />
                    <p className="font-black uppercase tracking-widest text-xs">No expenses logged</p>
                </div>
            )}
        </div>
        </>
        )}
      </div>
    </Layout>
  );
}
