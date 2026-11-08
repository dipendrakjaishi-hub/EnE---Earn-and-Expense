import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { Shift } from '../../types/crewpulse';
import { formatCurrency, cn, downloadCSV } from '../../lib/utils';
import { 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Camera, 
  MapPin, 
  Search, 
  TrendingUp, 
  Calculator,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface ShiftSpreadsheetGridProps {
  shifts: Shift[];
  currency: string;
}

export default function ShiftSpreadsheetGrid({ shifts, currency }: ShiftSpreadsheetGridProps) {
  const { updateShift, deleteShift, membership } = useCrewPulse();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Shift>>({});

  const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';

  const filteredShifts = shifts.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (s.profile?.full_name || '').toLowerCase().includes(q) ||
      (s.job_site || '').toLowerCase().includes(q) ||
      (s.notes || '').toLowerCase().includes(q)
    );
  });

  // Calculate summary metrics (Totals & Means)
  const totalHours = filteredShifts.reduce((acc, s) => acc + (s.total_hours || 0), 0);
  const totalOtHours = filteredShifts.reduce((acc, s) => acc + (s.overtime_hours || 0), 0);
  const totalWages = filteredShifts.reduce((acc, s) => acc + (s.estimated_pay || 0), 0);
  const meanHourlyRate = filteredShifts.length > 0
    ? filteredShifts.reduce((acc, s) => acc + (s.hourly_rate_at_shift || 0), 0) / filteredShifts.length
    : 15;
  const meanPayPerShift = filteredShifts.length > 0 ? totalWages / filteredShifts.length : 0;

  const handleStartEdit = (shift: Shift) => {
    setEditingRowId(shift.id);
    setEditValues({
      total_hours: shift.total_hours,
      hourly_rate_at_shift: shift.hourly_rate_at_shift,
      overtime_hours: shift.overtime_hours || 0,
      notes: shift.notes || '',
      job_site: shift.job_site || ''
    });
  };

  const handleSaveEdit = async (shiftId: string) => {
    try {
      await updateShift(shiftId, editValues);
      setEditingRowId(null);
      setEditValues({});
    } catch (e: any) {
      toast.error('Failed to update shift row');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Shift ID',
      'Worker Name',
      'Date',
      'Clock In',
      'Clock Out',
      'Total Hours',
      'Regular Hours',
      'Overtime Hours',
      'Hourly Rate',
      'Estimated Pay',
      'Job Site',
      'Geofence Verified',
      'Selfie Verified',
      'Notes'
    ];

    const rows = filteredShifts.map(s => [
      s.id,
      s.profile?.full_name || 'Worker',
      s.clock_in.split('T')[0],
      new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
      s.total_hours.toFixed(2),
      (s.regular_hours ?? s.total_hours).toFixed(2),
      (s.overtime_hours ?? 0).toFixed(2),
      s.hourly_rate_at_shift.toFixed(2),
      s.estimated_pay.toFixed(2),
      s.job_site || 'Site',
      s.is_geofence_verified ? 'YES' : 'NO',
      s.clock_in_selfie ? 'YES' : 'NO',
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    downloadCSV([headers, ...rows], `crewpulse_shifts_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Spreadsheet exported to CSV successfully.');
  };

  return (
    <div className="space-y-4">
      {/* Spreadsheet Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs text-white">Interactive Shift Spreadsheet Grid</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {filteredShifts.length} Rows
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500 w-36 sm:w-48 placeholder-slate-600"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Grid Table Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Staff / Worker</th>
                <th className="py-3 px-3">Venue / Job Site</th>
                <th className="py-3 px-3">Clock In - Out</th>
                <th className="py-3 px-3 text-right">Total Hours</th>
                <th className="py-3 px-3 text-right">Overtime</th>
                <th className="py-3 px-3 text-right">Rate/Hr</th>
                <th className="py-3 px-3 text-right">Total Wages</th>
                <th className="py-3 px-3 text-center">On-Site Proof</th>
                <th className="py-3 px-3">Shift Notes</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredShifts.map((s, idx) => {
                const isEditing = editingRowId === s.id;
                const dateStr = s.clock_in.split('T')[0];
                const startTime = new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTime = s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'RUNNING';

                return (
                  <tr 
                    key={s.id} 
                    className={cn(
                      "transition-colors hover:bg-slate-900/70",
                      idx % 2 === 0 ? "bg-slate-950/40" : "bg-slate-900/20"
                    )}
                  >
                    <td className="py-2.5 px-3 text-slate-300 font-sans whitespace-nowrap">
                      {dateStr}
                    </td>

                    <td className="py-2.5 px-3 font-sans font-semibold text-white whitespace-nowrap">
                      <span>{s.profile?.full_name || 'Worker'}</span>
                      {s.profile?.employee_id && (
                        <span className="text-[10px] text-cyan-400 font-mono ml-1.5 font-bold">
                          ({s.profile.employee_id})
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-sans text-slate-300 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.job_site || ''}
                          onChange={(e) => setEditValues({ ...editValues, job_site: e.target.value })}
                          className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white outline-none w-32"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{s.job_site || 'Site A'}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {startTime} - {endTime}
                    </td>

                    <td className="py-2.5 px-3 text-right font-black text-white whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.25"
                          value={editValues.total_hours ?? s.total_hours}
                          onChange={(e) => setEditValues({ ...editValues, total_hours: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white text-right outline-none w-16"
                        />
                      ) : (
                        `${s.total_hours.toFixed(2)}h`
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.25"
                          value={editValues.overtime_hours ?? (s.overtime_hours || 0)}
                          onChange={(e) => setEditValues({ ...editValues, overtime_hours: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white text-right outline-none w-16"
                        />
                      ) : (s.overtime_hours && s.overtime_hours > 0) ? (
                        <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
                          +{s.overtime_hours.toFixed(2)}h (1.5x)
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={editValues.hourly_rate_at_shift ?? s.hourly_rate_at_shift}
                          onChange={(e) => setEditValues({ ...editValues, hourly_rate_at_shift: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white text-right outline-none w-16"
                        />
                      ) : (
                        `${formatCurrency(s.hourly_rate_at_shift, currency)}/h`
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-black text-emerald-400 whitespace-nowrap">
                      {formatCurrency(s.estimated_pay, currency)}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {s.is_geofence_verified && (
                          <span title="GPS Pin Verified (<20m)" className="text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {s.clock_in_selfie && (
                          <span title="Front Camera Selfie Attached" className="text-cyan-400">
                            <Camera className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px] truncate max-w-[150px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.notes || ''}
                          onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                          className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white outline-none w-full"
                        />
                      ) : (
                        s.notes || '-'
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(s.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Save Row"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingRowId(null)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(s)}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                          >
                            Edit
                          </button>
                          {isManagerOrOwner && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this shift?')) {
                                  deleteShift(s.id);
                                }
                              }}
                              className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                              title="Delete Shift"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Summary Row (Mean & Totals) */}
            <tfoot>
              <tr className="bg-slate-900 border-t-2 border-slate-700 font-mono font-bold text-slate-200">
                <td colSpan={4} className="py-3 px-3 font-black text-white uppercase font-sans">
                  Summary Totals &amp; Mean Values
                </td>
                <td className="py-3 px-3 text-right font-black text-white">
                  {totalHours.toFixed(2)}h
                </td>
                <td className="py-3 px-3 text-right font-black text-amber-400">
                  {totalOtHours > 0 ? `+${totalOtHours.toFixed(2)}h` : '-'}
                </td>
                <td className="py-3 px-3 text-right text-slate-300">
                  <span className="text-[10px] text-slate-500 block uppercase">Mean Rate</span>
                  {formatCurrency(meanHourlyRate, currency)}/h
                </td>
                <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                  {formatCurrency(totalWages, currency)}
                </td>
                <td colSpan={3} className="py-3 px-3 text-right text-slate-400 font-sans text-[11px]">
                  Average per Shift: <strong className="text-white">{formatCurrency(meanPayPerShift, currency)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
