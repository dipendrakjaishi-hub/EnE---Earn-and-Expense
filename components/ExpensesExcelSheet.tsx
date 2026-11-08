import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, cn, downloadCSV } from '../lib/utils';
import { Expense, Company } from '../types';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Download, 
  Check, 
  Search, 
  ReceiptText,
  DollarSign,
  Info,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface ExpensesExcelSheetProps {
  onExpenseUpdated?: () => void;
  className?: string;
}

interface EditableExpenseRow {
  id: string;
  isNew?: boolean;
  date: string;
  title: string;
  category: string;
  amount: number;
  is_deductible: boolean;
  company_id?: string;
  notes: string;
}

export default function ExpensesExcelSheet({ onExpenseUpdated, className }: ExpensesExcelSheetProps) {
  const { user, settings } = useAppContext();
  const queryClient = useQueryClient();
  const currency = settings?.currency || 'USD';
  const isDark = settings?.theme === 'dark';

  const [activeCell, setActiveCell] = useState<{ row: number; col: string; name: string; formula: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch companies for job linking
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies', user?.email],
    queryFn: async () => {
      return await (base44.entities.Company as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  // Fetch expenses
  const { data: rawExpenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses', user?.email],
    queryFn: async () => {
      return await (base44.entities.Expense as any).list({
        q: JSON.stringify({ created_by: user?.email }),
        sort_by: '-date'
      });
    },
    enabled: !!user
  });

  const [rows, setRows] = useState<EditableExpenseRow[]>([]);

  const defaultCategories = [
    'groceries', 'rent', 'transportation', 'utilities', 
    'subscriptions', 'entertainment', 'food', 'tools', 'other'
  ];

  // Initialize rows from loaded data
  useEffect(() => {
    if (rawExpenses.length > 0) {
      setRows(rawExpenses.map(e => ({
        id: e.id,
        date: e.date || new Date().toISOString().split('T')[0],
        title: e.title || '',
        category: e.category || 'other',
        amount: Number(e.amount) || 0,
        is_deductible: !!e.is_deductible,
        company_id: e.company_id || '',
        notes: e.notes || ''
      })));
    } else if (!isLoading && rows.length === 0) {
      handleAddNewRow();
    }
  }, [rawExpenses, isLoading]);

  const handleCellChange = (index: number, field: keyof EditableExpenseRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddNewRow = () => {
    const newRow: EditableExpenseRow = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      isNew: true,
      date: new Date().toISOString().split('T')[0],
      title: 'New Expense Item',
      category: 'transportation',
      amount: 25.00,
      is_deductible: true,
      notes: ''
    };
    setRows(prev => [newRow, ...prev]);
    setHasUnsavedChanges(true);
    toast.info('New expense row added.');
  };

  const handleDeleteRow = async (index: number) => {
    const target = rows[index];
    if (!target) return;

    if (!target.isNew && !target.id.startsWith('temp_')) {
      try {
        await (base44.entities.Expense as any).delete(target.id);
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      } catch (e) {
        console.error(e);
      }
    }

    setRows(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
    toast.success('Expense row removed');
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      for (const row of rows) {
        const payload = {
          date: row.date,
          title: row.title,
          category: row.category,
          amount: Number(row.amount) || 0,
          is_deductible: row.is_deductible,
          company_id: row.company_id || undefined,
          notes: row.notes || '',
          created_by: user.email
        };

        if (row.isNew || row.id.startsWith('temp_')) {
          await (base44.entities.Expense as any).create(payload);
        } else {
          await (base44.entities.Expense as any).update(row.id, payload);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setHasUnsavedChanges(false);
      toast.success('Expenses worksheet saved!');
      if (onExpenseUpdated) onExpenseUpdated();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save expenses');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchCat = categoryFilter === 'all' || r.category === categoryFilter;
      const matchSearch = searchTerm === '' ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm);
      return matchCat && matchSearch;
    });
  }, [rows, categoryFilter, searchTerm]);

  const totals = useMemo(() => {
    let sumTotal = 0;
    let deductibleTotal = 0;

    filteredRows.forEach(r => {
      const amt = Number(r.amount) || 0;
      sumTotal += amt;
      if (r.is_deductible) {
        deductibleTotal += amt;
      }
    });

    return {
      count: filteredRows.length,
      sumTotal: Math.round(sumTotal * 100) / 100,
      deductibleTotal: Math.round(deductibleTotal * 100) / 100,
      nonDeductible: Math.round((sumTotal - deductibleTotal) * 100) / 100
    };
  }, [filteredRows]);

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error('No rows to export');
      return;
    }
    const data = rows.map((r, i) => ({
      'Row': i + 1,
      'Date': r.date,
      'Title / Description': r.title,
      'Category': r.category,
      'Amount': r.amount,
      'Currency': currency,
      'Tax Deductible': r.is_deductible ? 'Yes' : 'No',
      'Notes': r.notes
    }));
    downloadCSV(data, `Expenses_Worksheet_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Expenses exported to Excel/CSV!');
  };

  return (
    <div className={cn(
      "w-full rounded-2xl border shadow-xl flex flex-col overflow-hidden transition-all",
      isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200",
      className
    )}>
      {/* Header ribbon */}
      <div className={cn(
        "px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3",
        isDark ? "bg-[#161b22] border-white/10 text-white" : "bg-[#f3f4f6] border-gray-200 text-gray-800"
      )}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30 font-bold text-xs tracking-wider">
            XL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-rose-500" />
                Expenses & Tax Deductions Worksheet
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Formula Grid
              </span>
            </div>
            <p className={cn("text-xs hidden sm:block", isDark ? "text-gray-400" : "text-gray-500")}>
              Auto-calculates grand totals, tax write-offs, and category expense sums
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95",
              hasUnsavedChanges
                ? "bg-violet-600 hover:bg-violet-500 text-white animate-pulse"
                : "bg-white/10 hover:bg-white/15 text-white/90 border border-white/10"
            )}
          >
            <Check className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes *' : 'Saved'}
          </button>

          <button
            onClick={handleExportCSV}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300" : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
            )}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className={cn(
        "px-4 py-2 border-b flex items-center gap-3 text-xs font-mono",
        isDark ? "bg-[#090d13] border-white/5 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"
      )}>
        <div className={cn(
          "px-2 py-0.5 rounded border font-semibold flex items-center justify-center min-w-[70px]",
          isDark ? "bg-black/40 border-white/10 text-rose-400" : "bg-white border-gray-300 text-rose-600"
        )}>
          {activeCell ? `${activeCell.col}${activeCell.row + 1}` : 'A1'}
        </div>
        <div className="text-gray-400 italic flex items-center gap-1 font-serif text-sm">
          fx
        </div>
        <div className="flex-1 truncate text-xs">
          {activeCell ? (
            <span className="text-rose-400 font-sans">
              <span className="font-semibold text-white/90">{activeCell.name}:</span> {activeCell.formula}
            </span>
          ) : (
            <span className="text-gray-400 font-sans">
              Formula: Grand Total = SUM(Amount) | Tax Deductible Total = SUMIF(is_deductible, True)
            </span>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "px-2 py-1 text-xs rounded border outline-none w-36 transition-all",
              isDark ? "bg-black/40 border-white/10 text-white focus:border-rose-500" : "bg-white border-gray-300 text-gray-900"
            )}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={cn(
              "px-2 py-1 text-xs rounded border outline-none transition-all",
              isDark ? "bg-[#161b22] border-white/10 text-white focus:border-rose-500" : "bg-white border-gray-300 text-gray-900"
            )}
          >
            <option value="all">All Categories</option>
            {defaultCategories.map(cat => (
              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto max-h-[600px] select-text">
        <table className="w-full border-collapse text-left text-xs font-sans">
          <thead>
            <tr className={cn(
              "border-b select-none text-[11px] font-mono",
              isDark ? "bg-[#161b22]/70 text-gray-400 border-white/10" : "bg-gray-100 text-gray-500 border-gray-200"
            )}>
              <th className="w-10 px-2 py-1 text-center font-normal border-r border-white/5">#</th>
              <th className="w-28 px-2 py-1 text-center font-normal border-r border-white/5">A (Date)</th>
              <th className="w-56 px-2 py-1 font-normal border-r border-white/5">B (Expense Item / Title)</th>
              <th className="w-36 px-2 py-1 font-normal border-r border-white/5">C (Category)</th>
              <th className="w-32 px-2 py-1 text-right font-normal bg-rose-500/10 text-rose-400 border-r border-white/5">D (Amount fx)</th>
              <th className="w-28 px-2 py-1 text-center font-normal border-r border-white/5">E (Deductible?)</th>
              <th className="w-40 px-2 py-1 font-normal border-r border-white/5">F (Linked Job / Comp)</th>
              <th className="min-w-[150px] px-2 py-1 font-normal border-r border-white/5">G (Notes / Receipt)</th>
              <th className="w-16 px-2 py-1 text-center font-normal">Actions</th>
            </tr>
          </thead>

          <tbody className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-100")}>
            {filteredRows.map((row, index) => (
              <tr 
                key={row.id}
                className={cn(
                  "transition-colors group",
                  isDark ? "hover:bg-white/[0.04]" : "hover:bg-rose-50/50"
                )}
              >
                <td className={cn(
                  "px-2 py-1 text-center font-mono text-[11px] border-r select-none",
                  isDark ? "text-gray-400 bg-[#161b22]/40 border-white/5" : "text-gray-400 bg-gray-50 border-gray-200"
                )}>
                  {index + 1}
                </td>

                <td className="p-0 border-r border-white/5">
                  <input
                    type="date"
                    value={row.date}
                    onFocus={() => setActiveCell({ row: index, col: 'A', name: 'Expense Date', formula: row.date })}
                    onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                    className={cn(
                      "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs text-center focus:ring-1 focus:ring-rose-500",
                      isDark ? "text-gray-200 focus:bg-white/10" : "text-gray-800 focus:bg-white"
                    )}
                  />
                </td>

                <td className="p-0 border-r border-white/5">
                  <input
                    type="text"
                    value={row.title}
                    placeholder="e.g. Fuel, Lunch, Equipment"
                    onFocus={() => setActiveCell({ row: index, col: 'B', name: 'Item Title', formula: row.title })}
                    onChange={(e) => handleCellChange(index, 'title', e.target.value)}
                    className={cn(
                      "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs focus:ring-1 focus:ring-rose-500",
                      isDark ? "text-gray-200 focus:bg-white/10" : "text-gray-800 focus:bg-white"
                    )}
                  />
                </td>

                <td className="p-0 border-r border-white/5">
                  <select
                    value={row.category}
                    onFocus={() => setActiveCell({ row: index, col: 'C', name: 'Expense Category', formula: row.category })}
                    onChange={(e) => handleCellChange(index, 'category', e.target.value)}
                    className={cn(
                      "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs focus:ring-1 focus:ring-rose-500 capitalize cursor-pointer",
                      isDark ? "text-gray-200 focus:bg-[#161b22]" : "text-gray-800 focus:bg-white"
                    )}
                  >
                    {defaultCategories.map(cat => (
                      <option key={cat} value={cat} className={isDark ? "bg-[#161b22] text-white" : "bg-white text-gray-900"}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </td>

                <td className={cn(
                  "p-0 border-r border-white/5 font-mono",
                  isDark ? "bg-rose-500/5" : "bg-rose-50/50"
                )}>
                  <div className="flex items-center px-1">
                    <span className="text-gray-400 text-[11px] mr-1">{currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.amount}
                      onFocus={() => setActiveCell({ row: index, col: 'D', name: 'Expense Amount', formula: `${formatCurrency(row.amount, currency)}` })}
                      onChange={(e) => handleCellChange(index, 'amount', e.target.value)}
                      className={cn(
                        "w-full py-1.5 bg-transparent border-0 outline-none text-xs text-right font-mono font-bold focus:ring-1 focus:ring-rose-500",
                        isDark ? "text-rose-400 focus:bg-white/10" : "text-rose-600 focus:bg-white"
                      )}
                    />
                  </div>
                </td>

                <td className="px-2 py-1.5 text-center border-r border-white/5">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.is_deductible}
                      onChange={(e) => handleCellChange(index, 'is_deductible', e.target.checked)}
                      className="rounded border-gray-600 text-rose-500 focus:ring-rose-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className={cn("ml-1.5 text-[11px]", row.is_deductible ? "text-emerald-400 font-semibold" : "text-gray-400")}>
                      {row.is_deductible ? 'Tax Deductible' : 'Personal'}
                    </span>
                  </label>
                </td>

                <td className="p-0 border-r border-white/5">
                  <select
                    value={row.company_id || ''}
                    onChange={(e) => handleCellChange(index, 'company_id', e.target.value)}
                    className={cn(
                      "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs focus:ring-1 focus:ring-rose-500 cursor-pointer",
                      isDark ? "text-gray-200 focus:bg-[#161b22]" : "text-gray-800 focus:bg-white"
                    )}
                  >
                    <option value="">(None / General)</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id} className={isDark ? "bg-[#161b22] text-white" : "bg-white text-gray-900"}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-0 border-r border-white/5">
                  <input
                    type="text"
                    value={row.notes}
                    placeholder="Receipt ref, vendor, details..."
                    onChange={(e) => handleCellChange(index, 'notes', e.target.value)}
                    className={cn(
                      "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs focus:ring-1 focus:ring-rose-500",
                      isDark ? "text-gray-200 focus:bg-white/10 placeholder-gray-600" : "text-gray-800 focus:bg-white placeholder-gray-400"
                    )}
                  />
                </td>

                <td className="px-1 py-1 text-center">
                  <button
                    onClick={() => handleDeleteRow(index)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          {filteredRows.length > 0 && (
            <tfoot>
              <tr className={cn(
                "border-t-2 font-mono text-xs select-none sticky bottom-0 z-20 shadow-lg",
                isDark ? "bg-[#161b22] border-rose-500/40 text-white" : "bg-gray-100 border-rose-500 text-gray-900"
              )}>
                <td className="px-2 py-2 text-center text-gray-400 border-r border-white/10 font-bold">∑</td>
                <td className="px-2 py-2 text-center font-bold border-r border-white/10 text-rose-400">TOTALS</td>
                <td className="px-2 py-2 border-r border-white/10 text-gray-300 font-semibold" colSpan={2}>
                  {totals.count} Expenses | Deductible: {formatCurrency(totals.deductibleTotal, currency)}
                </td>
                <td className={cn(
                  "px-3 py-2 text-right font-extrabold border-r border-white/10 text-rose-400 text-sm",
                  isDark ? "bg-rose-500/25" : "bg-rose-100"
                )}>
                  {formatCurrency(totals.sumTotal, currency)}
                </td>
                <td className="px-2 py-2 border-r border-white/10 text-center text-emerald-400 font-semibold" colSpan={4}>
                  Tax Savings Eligible: {formatCurrency(totals.deductibleTotal, currency)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
