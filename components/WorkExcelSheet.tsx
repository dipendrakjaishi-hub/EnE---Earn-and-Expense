import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, cn, downloadCSV } from '../lib/utils';
import { WorkShift, Company } from '../types';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Calculator, 
  Clock, 
  DollarSign, 
  Copy, 
  Check, 
  Search,
  Sparkles,
  ArrowUpDown,
  Filter,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkExcelSheetProps {
  onShiftUpdated?: () => void;
  className?: string;
}

interface EditableShiftRow {
  id: string;
  isNew?: boolean;
  date: string;
  company_id: string;
  job_description: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  total_hours: number;
  hourly_rate: number;
  overtime_rate: number;
  overtime_hours: number;
  total_income: number;
  remarks: string;
  visibility: 'private' | 'shared';
}

export default function WorkExcelSheet({ onShiftUpdated, className }: WorkExcelSheetProps) {
  const { user, settings } = useAppContext();
  const queryClient = useQueryClient();
  const currency = settings?.currency || 'USD';
  const isDark = settings?.theme === 'dark';

  const [activeCell, setActiveCell] = useState<{ row: number; col: string; name: string; formula: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies', user?.email],
    queryFn: async () => {
      return await (base44.entities.Company as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  // Fetch shifts
  const { data: rawShifts = [], isLoading: isLoadingShifts } = useQuery<WorkShift[]>({
    queryKey: ['workShifts', user?.email],
    queryFn: async () => {
      return await (base44.entities.WorkShift as any).list({
        q: JSON.stringify({ created_by: user?.email }),
        sort_by: '-date'
      });
    },
    enabled: !!user
  });

  // Local state rows for spreadsheet editing
  const [rows, setRows] = useState<EditableShiftRow[]>([]);

  // Helper to calculate hours & income from inputs
  const calculateShiftMath = (
    startTime: string,
    endTime: string,
    breakMins: number,
    rate: number,
    compId: string
  ) => {
    let totalHours = 0;
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      let startTotal = (startH || 0) * 60 + (startM || 0);
      let endTotal = (endH || 0) * 60 + (endM || 0);
      
      // Handle overnight shift (e.g., 22:00 to 06:00)
      if (endTotal < startTotal) {
        endTotal += 24 * 60;
      }
      
      const workedMins = Math.max(0, endTotal - startTotal - (breakMins || 0));
      totalHours = Math.round((workedMins / 60) * 100) / 100;
    }

    const company = companies.find(c => c.id === compId);
    const otThreshold = company?.overtime_start_hours || 8;
    const otRate = company?.overtime_rate || (rate * 1.5);

    const overtimeHours = totalHours > otThreshold ? Math.round((totalHours - otThreshold) * 100) / 100 : 0;
    const regularHours = totalHours - overtimeHours;
    const totalIncome = Math.round(((regularHours * rate) + (overtimeHours * otRate)) * 100) / 100;

    return {
      totalHours,
      overtimeHours,
      overtimeRate: otRate,
      totalIncome
    };
  };

  // Synchronize incoming shifts to rows when loaded
  useEffect(() => {
    if (rawShifts.length > 0) {
      const formatted: EditableShiftRow[] = rawShifts.map(s => {
        const comp = companies.find(c => c.id === s.company_id);
        const rate = s.hourly_rate ?? comp?.hourly_rate ?? 15;
        const math = calculateShiftMath(
          s.start_time || '09:00',
          s.end_time || '17:00',
          s.break_minutes ?? 30,
          rate,
          s.company_id
        );

        return {
          id: s.id,
          date: s.date || new Date().toISOString().split('T')[0],
          company_id: s.company_id || (companies[0]?.id || ''),
          job_description: s.job_description || '',
          start_time: s.start_time || '09:00',
          end_time: s.end_time || '17:00',
          break_minutes: s.break_minutes ?? 30,
          total_hours: s.total_hours ?? math.totalHours,
          hourly_rate: rate,
          overtime_rate: math.overtimeRate,
          overtime_hours: math.overtimeHours,
          total_income: s.total_income ?? math.totalIncome,
          remarks: s.remarks || '',
          visibility: s.visibility || 'private'
        };
      });
      setRows(formatted);
    } else if (!isLoadingShifts && rows.length === 0) {
      // Create at least one empty template row
      handleAddNewRow();
    }
  }, [rawShifts, companies, isLoadingShifts]);

  // Update a single field in a row and recalculate formula fields
  const handleCellChange = (index: number, field: keyof EditableShiftRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      // If company changed, update hourly rate default
      if (field === 'company_id') {
        const selectedComp = companies.find(c => c.id === value);
        if (selectedComp && selectedComp.hourly_rate) {
          row.hourly_rate = selectedComp.hourly_rate;
        }
      }

      // Recalculate if hours or rate changed
      if (['start_time', 'end_time', 'break_minutes', 'hourly_rate', 'company_id'].includes(field)) {
        const math = calculateShiftMath(
          row.start_time,
          row.end_time,
          Number(row.break_minutes) || 0,
          Number(row.hourly_rate) || 0,
          row.company_id
        );
        row.total_hours = math.totalHours;
        row.overtime_hours = math.overtimeHours;
        row.overtime_rate = math.overtimeRate;
        row.total_income = math.totalIncome;
      }

      next[index] = row;
      return next;
    });

    setHasUnsavedChanges(true);
  };

  // Add a new row to the top of the spreadsheet
  const handleAddNewRow = () => {
    const defaultComp = companies[0];
    const defaultRate = defaultComp?.hourly_rate || 18.50;
    const math = calculateShiftMath('08:30', '17:00', 30, defaultRate, defaultComp?.id || '');

    const newRow: EditableShiftRow = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      isNew: true,
      date: new Date().toISOString().split('T')[0],
      company_id: defaultComp?.id || '',
      job_description: 'General Shift Duties',
      start_time: '08:30',
      end_time: '17:00',
      break_minutes: 30,
      total_hours: math.totalHours,
      hourly_rate: defaultRate,
      overtime_rate: math.overtimeRate,
      overtime_hours: math.overtimeHours,
      total_income: math.totalIncome,
      remarks: '',
      visibility: 'shared'
    };

    setRows(prev => [newRow, ...prev]);
    setHasUnsavedChanges(true);
    toast.info('New row added. Fill details and click Save or edit directly.');
  };

  // Duplicate a row
  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    if (!target) return;
    const duplicated: EditableShiftRow = {
      ...target,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      isNew: true,
      remarks: target.remarks ? `${target.remarks} (Copy)` : 'Copy'
    };
    setRows(prev => [
      ...prev.slice(0, index + 1),
      duplicated,
      ...prev.slice(index + 1)
    ]);
    setHasUnsavedChanges(true);
    toast.success('Row duplicated');
  };

  // Delete a row
  const handleDeleteRow = async (index: number) => {
    const target = rows[index];
    if (!target) return;

    if (!target.isNew && !target.id.startsWith('temp_')) {
      try {
        await (base44.entities.WorkShift as any).delete(target.id);
        queryClient.invalidateQueries({ queryKey: ['workShifts'] });
      } catch (e) {
        console.error('Failed to delete row from backend:', e);
      }
    }

    setRows(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
    toast.success('Row deleted');
  };

  // Save all rows to persistent store
  const handleSaveAll = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      for (const row of rows) {
        const payload = {
          date: row.date,
          company_id: row.company_id,
          job_description: row.job_description,
          start_time: row.start_time,
          end_time: row.end_time,
          break_minutes: Number(row.break_minutes) || 0,
          total_hours: Number(row.total_hours) || 0,
          hourly_rate: Number(row.hourly_rate) || 0,
          total_income: Number(row.total_income) || 0,
          remarks: row.remarks || '',
          visibility: row.visibility || 'private',
          created_by: user.email
        };

        if (row.isNew || row.id.startsWith('temp_')) {
          await (base44.entities.WorkShift as any).create(payload);
        } else {
          await (base44.entities.WorkShift as any).update(row.id, payload);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['workShifts'] });
      setHasUnsavedChanges(false);
      toast.success('Spreadsheet saved successfully! Hours & pay rates calculated.');
      if (onShiftUpdated) onShiftUpdated();
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered rows for viewing
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchComp = companyFilter === 'all' || r.company_id === companyFilter;
      const compName = companies.find(c => c.id === r.company_id)?.name || '';
      const matchSearch = searchTerm === '' ||
        r.job_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
        compName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm);
      return matchComp && matchSearch;
    });
  }, [rows, companyFilter, searchTerm, companies]);

  // Aggregate Totals for the Summary Footer Row
  const totals = useMemo(() => {
    let hours = 0;
    let otHours = 0;
    let income = 0;
    let rateSum = 0;

    filteredRows.forEach(r => {
      hours += Number(r.total_hours) || 0;
      otHours += Number(r.overtime_hours) || 0;
      income += Number(r.total_income) || 0;
      rateSum += Number(r.hourly_rate) || 0;
    });

    const avgRate = filteredRows.length > 0 ? Math.round((rateSum / filteredRows.length) * 100) / 100 : 0;

    return {
      count: filteredRows.length,
      hours: Math.round(hours * 100) / 100,
      otHours: Math.round(otHours * 100) / 100,
      income: Math.round(income * 100) / 100,
      avgRate
    };
  }, [filteredRows]);

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error('No rows to export');
      return;
    }
    const data = rows.map((r, i) => {
      const comp = companies.find(c => c.id === r.company_id);
      return {
        'Row': i + 1,
        'Date': r.date,
        'Company / Job': comp?.name || r.company_id,
        'Job Description': r.job_description,
        'Start Time': r.start_time,
        'End Time': r.end_time,
        'Break (mins)': r.break_minutes,
        'Total Hours': r.total_hours,
        'Hourly Rate': r.hourly_rate,
        'Overtime Hours': r.overtime_hours,
        'Overtime Rate': r.overtime_rate,
        'Total Pay Earned': r.total_income,
        'Currency': currency,
        'Remarks': r.remarks
      };
    });
    downloadCSV(data, `Job_Hours_PayRate_Sheet_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Spreadsheet exported to Excel/CSV!');
  };

  return (
    <div className={cn(
      "w-full rounded-2xl border shadow-xl flex flex-col overflow-hidden transition-all",
      isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200",
      className
    )}>
      {/* Excel Ribbon & Top Header Bar */}
      <div className={cn(
        "px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3",
        isDark ? "bg-[#161b22] border-white/10 text-white" : "bg-[#f3f4f6] border-gray-200 text-gray-800"
      )}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 font-bold text-xs tracking-wider">
            XL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Job Hours & Pay Rate Worksheet
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Formula Grid
              </span>
            </div>
            <p className={cn("text-xs hidden sm:block", isDark ? "text-gray-400" : "text-gray-500")}>
              Auto-calculates hours = (End - Start) - Break, and Gross Income = Hours × Pay Rate
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNewRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95"
            title="Add a new job shift row"
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
            title="Save worksheet changes to database"
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
            title="Export to Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Formula Bar (Excel-style fx bar) */}
      <div className={cn(
        "px-4 py-2 border-b flex items-center gap-3 text-xs font-mono",
        isDark ? "bg-[#090d13] border-white/5 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"
      )}>
        <div className={cn(
          "px-2 py-0.5 rounded border font-semibold flex items-center justify-center min-w-[70px]",
          isDark ? "bg-black/40 border-white/10 text-emerald-400" : "bg-white border-gray-300 text-emerald-600"
        )}>
          {activeCell ? `${activeCell.col}${activeCell.row + 1}` : 'A1'}
        </div>
        <div className="text-gray-400 italic flex items-center gap-1 font-serif text-sm">
          fx
        </div>
        <div className="flex-1 truncate text-xs">
          {activeCell ? (
            <span className="text-emerald-400 font-sans">
              <span className="font-semibold text-white/90">{activeCell.name}:</span> {activeCell.formula}
            </span>
          ) : (
            <span className="text-gray-400 font-sans">
              Formula: Total Hours = (End - Start) - (Break/60) | Gross Pay = (Hours × Rate) + (OT Hours × OT Rate)
            </span>
          )}
        </div>

        {/* Search & Company Filter */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-7 pr-2 py-1 text-xs rounded border outline-none w-36 transition-all",
                isDark ? "bg-black/40 border-white/10 text-white placeholder-gray-500 focus:border-emerald-500" : "bg-white border-gray-300 text-gray-900"
              )}
            />
          </div>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className={cn(
              "px-2 py-1 text-xs rounded border outline-none transition-all",
              isDark ? "bg-[#161b22] border-white/10 text-white focus:border-emerald-500" : "bg-white border-gray-300 text-gray-900"
            )}
          >
            <option value="all">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spreadsheet Grid Container */}
      <div className="overflow-x-auto max-h-[620px] select-text">
        <table className="w-full border-collapse text-left text-xs font-sans">
          {/* Column Letter Coordinate Row (A, B, C, D...) */}
          <thead>
            <tr className={cn(
              "border-b select-none text-[11px] font-mono",
              isDark ? "bg-[#161b22]/70 text-gray-400 border-white/10" : "bg-gray-100 text-gray-500 border-gray-200"
            )}>
              <th className="w-10 px-2 py-1 text-center font-normal border-r border-white/5">#</th>
              <th className="w-28 px-2 py-1 text-center font-normal border-r border-white/5">A (Date)</th>
              <th className="w-44 px-2 py-1 font-normal border-r border-white/5">B (Job / Company)</th>
              <th className="w-48 px-2 py-1 font-normal border-r border-white/5">C (Job Description / Role)</th>
              <th className="w-24 px-2 py-1 text-center font-normal border-r border-white/5">D (Start)</th>
              <th className="w-24 px-2 py-1 text-center font-normal border-r border-white/5">E (End)</th>
              <th className="w-24 px-2 py-1 text-center font-normal border-r border-white/5">F (Break m)</th>
              <th className="w-24 px-2 py-1 text-center font-normal bg-emerald-500/10 text-emerald-400 border-r border-white/5">G (Hours fx)</th>
              <th className="w-28 px-2 py-1 text-right font-normal border-r border-white/5">H (Rate/hr)</th>
              <th className="w-24 px-2 py-1 text-center font-normal border-r border-white/5">I (OT Hrs)</th>
              <th className="w-32 px-2 py-1 text-right font-normal bg-emerald-600/10 text-emerald-400 border-r border-white/5">J (Gross Pay fx)</th>
              <th className="min-w-[150px] px-2 py-1 font-normal border-r border-white/5">K (Remarks)</th>
              <th className="w-20 px-2 py-1 text-center font-normal">Actions</th>
            </tr>
          </thead>

          {/* Grid Rows */}
          <tbody className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-100")}>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-gray-500 animate-pulse" />
                    <p className="font-medium text-sm">No job shift rows found</p>
                    <p className="text-xs text-gray-400">Click &quot;Add Row&quot; above to start filling job hours and calculate pay rate.</p>
                    <button
                      onClick={handleAddNewRow}
                      className="mt-2 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
                    >
                      + Add First Shift Row
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const comp = companies.find(c => c.id === row.company_id);
                return (
                  <tr 
                    key={row.id}
                    className={cn(
                      "transition-colors group",
                      isDark ? "hover:bg-white/[0.04]" : "hover:bg-emerald-50/50",
                      row.isNew && (isDark ? "bg-emerald-500/5" : "bg-emerald-50/70")
                    )}
                  >
                    {/* Row Index */}
                    <td className={cn(
                      "px-2 py-1 text-center font-mono text-[11px] border-r select-none",
                      isDark ? "text-gray-400 bg-[#161b22]/40 border-white/5" : "text-gray-400 bg-gray-50 border-gray-200"
                    )}>
                      {index + 1}
                    </td>

                    {/* Date (Col A) */}
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="date"
                        value={row.date}
                        onFocus={() => setActiveCell({ row: index, col: 'A', name: 'Shift Date', formula: row.date })}
                        onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                        className={cn(
                          "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs text-center focus:ring-1 focus:ring-emerald-500 rounded-none",
                          isDark ? "text-gray-200 focus:bg-white/10" : "text-gray-800 focus:bg-white"
                        )}
                      />
                    </td>

                    {/* Company / Job (Col B) */}
                    <td className="p-0 border-r border-white/5">
                      <div className="flex items-center px-1">
                        {comp?.color && (
                          <span 
                            className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" 
                            style={{ backgroundColor: comp.color }} 
                          />
                        )}
                        <select
                          value={row.company_id}
                          onFocus={() => setActiveCell({ 
                            row: index, 
                            col: 'B', 
                            name: 'Employer / Company', 
                            formula: comp ? `${comp.name} (Base: ${formatCurrency(comp.hourly_rate || 0, currency)}/hr)` : 'Select company' 
                          })}
                          onChange={(e) => handleCellChange(index, 'company_id', e.target.value)}
                          className={cn(
                            "w-full py-1.5 bg-transparent border-0 outline-none text-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer",
                            isDark ? "text-gray-200 focus:bg-[#161b22]" : "text-gray-800 focus:bg-white"
                          )}
                        >
                          {companies.map(c => (
                            <option key={c.id} value={c.id} className={isDark ? "bg-[#161b22] text-white" : "bg-white text-gray-900"}>
                              {c.name} ({formatCurrency(c.hourly_rate || 0, currency)}/hr)
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Job Description (Col C) */}
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="text"
                        placeholder="e.g. Supervisor, Delivery, Coding"
                        value={row.job_description}
                        onFocus={() => setActiveCell({ row: index, col: 'C', name: 'Job Role / Description', formula: row.job_description || 'None' })}
                        onChange={(e) => handleCellChange(index, 'job_description', e.target.value)}
                        className={cn(
                          "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs focus:ring-1 focus:ring-emerald-500 truncate",
                          isDark ? "text-gray-200 focus:bg-white/10 placeholder-gray-600" : "text-gray-800 focus:bg-white placeholder-gray-400"
                        )}
                      />
                    </td>

                    {/* Start Time (Col D) */}
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="time"
                        value={row.start_time}
                        onFocus={() => setActiveCell({ row: index, col: 'D', name: 'Start Time', formula: `Clock in at ${row.start_time}` })}
                        onChange={(e) => handleCellChange(index, 'start_time', e.target.value)}
                        className={cn(
                          "w-full px-1.5 py-1.5 bg-transparent border-0 outline-none text-xs text-center focus:ring-1 focus:ring-emerald-500 font-mono",
                          isDark ? "text-gray-200 focus:bg-white/10" : "text-gray-800 focus:bg-white"
                        )}
                      />
                    </td>

                    {/* End Time (Col E) */}
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="time"
                        value={row.end_time}
                        onFocus={() => setActiveCell({ row: index, col: 'E', name: 'End Time', formula: `Clock out at ${row.end_time}` })}
                        onChange={(e) => handleCellChange(index, 'end_time', e.target.value)}
                        className={cn(
                          "w-full px-1.5 py-1.5 bg-transparent border-0 outline-none text-xs text-center focus:ring-1 focus:ring-emerald-500 font-mono",
                          isDark ? "text-gray-200 focus:bg-white/10" : "text-gray-800 focus:bg-white"
                        )}
                      />
                    </td>

                    {/* Break Minutes (Col F) */}
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={row.break_minutes}
                        onFocus={() => setActiveCell({ row: index, col: 'F', name: 'Unpaid Break Minutes', formula: `${row.break_minutes} mins = ${(row.break_minutes / 60).toFixed(2)} hrs deduction` })}
                        onChange={(e) => handleCellChange(index, 'break_minutes', e.target.value)}
                        className={cn(
                          "w-full px-1.5 py-1.5 bg-transparent border-0 outline-none text-xs text-center focus:ring-1 focus:ring-emerald-500 font-mono",
                          isDark ? "text-gray-200 focus:bg-white/10" : "text-gray-800 focus:bg-white"
                        )}
                      />
                    </td>

                    {/* Total Hours (Col G) - Calculated Formula */}
                    <td className={cn(
                      "px-2 py-1.5 text-center font-mono font-bold text-xs border-r border-white/5 select-all",
                      isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                    )}>
                      <div 
                        className="cursor-pointer"
                        onClick={() => setActiveCell({ 
                          row: index, 
                          col: 'G', 
                          name: 'Calculated Hours', 
                          formula: `(${row.end_time} - ${row.start_time}) - (${row.break_minutes}m) = ${row.total_hours} hrs` 
                        })}
                      >
                        {row.total_hours.toFixed(2)}h
                      </div>
                    </td>

                    {/* Hourly Pay Rate (Col H) */}
                    <td className="p-0 border-r border-white/5">
                      <div className="flex items-center px-1">
                        <span className="text-gray-400 text-[11px] mr-1">{currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={row.hourly_rate}
                          onFocus={() => setActiveCell({ 
                            row: index, 
                            col: 'H', 
                            name: 'Hourly Rate', 
                            formula: `Hourly base wage: ${formatCurrency(row.hourly_rate, currency)}/hr` 
                          })}
                          onChange={(e) => handleCellChange(index, 'hourly_rate', e.target.value)}
                          className={cn(
                            "w-full py-1.5 bg-transparent border-0 outline-none text-xs text-right font-mono focus:ring-1 focus:ring-emerald-500",
                            isDark ? "text-gray-200 focus:bg-white/10" : "text-gray-800 focus:bg-white"
                          )}
                        />
                      </div>
                    </td>

                    {/* Overtime Hours (Col I) */}
                    <td className="px-2 py-1.5 text-center font-mono text-xs border-r border-white/5">
                      <span className={cn(
                        row.overtime_hours > 0 ? "text-amber-400 font-semibold" : "text-gray-400"
                      )}>
                        {row.overtime_hours > 0 ? `+${row.overtime_hours.toFixed(2)}h` : '0h'}
                      </span>
                    </td>

                    {/* Total Gross Pay (Col J) - Calculated Formula */}
                    <td className={cn(
                      "px-2 py-1.5 text-right font-mono font-bold text-xs border-r border-white/5 select-all",
                      isDark ? "bg-emerald-600/15 text-emerald-300" : "bg-emerald-100/70 text-emerald-900"
                    )}>
                      <div 
                        className="cursor-pointer"
                        onClick={() => setActiveCell({ 
                          row: index, 
                          col: 'J', 
                          name: 'Calculated Gross Income', 
                          formula: `${row.total_hours}h @ ${formatCurrency(row.hourly_rate, currency)} = ${formatCurrency(row.total_income, currency)}` 
                        })}
                      >
                        {formatCurrency(row.total_income, currency)}
                      </div>
                    </td>

                    {/* Remarks (Col K) */}
                    <td className="p-0 border-r border-white/5">
                      <input
                        type="text"
                        placeholder="Location, overtime note, project..."
                        value={row.remarks}
                        onFocus={() => setActiveCell({ row: index, col: 'K', name: 'Remarks & Notes', formula: row.remarks || 'None' })}
                        onChange={(e) => handleCellChange(index, 'remarks', e.target.value)}
                        className={cn(
                          "w-full px-2 py-1.5 bg-transparent border-0 outline-none text-xs focus:ring-1 focus:ring-emerald-500 truncate",
                          isDark ? "text-gray-300 focus:bg-white/10 placeholder-gray-600" : "text-gray-800 focus:bg-white placeholder-gray-400"
                        )}
                      />
                    </td>

                    {/* Row Actions */}
                    <td className="px-1 py-1 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDuplicateRow(index)}
                          className={cn(
                            "p-1 rounded hover:bg-white/10 transition-colors",
                            isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                          )}
                          title="Duplicate row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(index)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Spreadsheet Totals Footer Row (Excel Summary) */}
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className={cn(
                "border-t-2 font-mono text-xs select-none sticky bottom-0 z-20 shadow-lg",
                isDark ? "bg-[#161b22] border-emerald-500/40 text-white" : "bg-gray-100 border-emerald-500 text-gray-900"
              )}>
                <td className="px-2 py-2 text-center text-gray-400 border-r border-white/10 font-bold">
                  ∑
                </td>
                <td className="px-2 py-2 text-center font-bold border-r border-white/10 text-emerald-400">
                  TOTALS
                </td>
                <td className="px-2 py-2 border-r border-white/10 text-gray-300 font-semibold" colSpan={2}>
                  {totals.count} Shifts Recorded
                </td>
                <td className="px-2 py-2 border-r border-white/10 text-center text-gray-400" colSpan={3}>
                  Summary
                </td>
                {/* Total Hours */}
                <td className={cn(
                  "px-2 py-2 text-center font-bold border-r border-white/10 text-emerald-400 text-sm",
                  isDark ? "bg-emerald-500/20" : "bg-emerald-100"
                )}>
                  {totals.hours.toFixed(2)}h
                </td>
                {/* Avg Rate */}
                <td className="px-2 py-2 text-right border-r border-white/10 text-gray-300">
                  Avg: {formatCurrency(totals.avgRate, currency)}
                </td>
                {/* OT Hours */}
                <td className="px-2 py-2 text-center border-r border-white/10 text-amber-400 font-bold">
                  {totals.otHours > 0 ? `+${totals.otHours.toFixed(2)}h` : '0h'}
                </td>
                {/* Grand Total Income */}
                <td className={cn(
                  "px-3 py-2 text-right font-extrabold border-r border-white/10 text-emerald-400 text-sm",
                  isDark ? "bg-emerald-500/25" : "bg-emerald-200"
                )}>
                  {formatCurrency(totals.income, currency)}
                </td>
                <td className="px-2 py-2 text-gray-400 text-[11px]" colSpan={2}>
                  Gross Earned
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Quick Tips & Helper Banner */}
      <div className={cn(
        "px-4 py-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px]",
        isDark ? "bg-[#0d1117] border-white/10 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"
      )}>
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>
            <strong>Spreadsheet Tip:</strong> Click any cell to edit. Change Start, End, Break or Pay Rate to recalculate automatically.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-500 font-semibold">
            {totals.hours.toFixed(1)} hrs = {formatCurrency(totals.income, currency)}
          </span>
          <button
            onClick={handleAddNewRow}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            + Add Another Row
          </button>
        </div>
      </div>
    </div>
  );
}
