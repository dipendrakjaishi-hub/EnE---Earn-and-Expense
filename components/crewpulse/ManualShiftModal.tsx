import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { formatCurrency } from '../../lib/utils';
import { X, Calendar, Clock, MapPin, FileText, Check } from 'lucide-react';

interface ManualShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualShiftModal({ isOpen, onClose }: ManualShiftModalProps) {
  const { createManualShift, currentBusiness, membership } = useCrewPulse();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [jobSite, setJobSite] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currency = currentBusiness?.currency || 'GBP';
  const hourlyRate = membership?.custom_hourly_rate ?? currentBusiness?.default_hourly_rate ?? 15.00;

  // Live hours calculation
  const calculateHours = () => {
    if (!startTime || !endTime) return 0;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);

    let start = sH * 60 + sM;
    let end = eH * 60 + eM;
    if (end < start) end += 24 * 60; // Overnight

    const mins = Math.max(0, end - start - (Number(breakMinutes) || 0));
    return Math.round((mins / 60) * 100) / 100;
  };

  const calculatedHours = calculateHours();
  const estimatedPay = Math.round(calculatedHours * hourlyRate * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createManualShift({
        date,
        startTime,
        endTime,
        breakMinutes: Number(breakMinutes) || 0,
        jobSite: jobSite || 'Direct Assignment',
        notes
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Log Manual Shift</h3>
              <p className="text-xs text-slate-400">Add past hours or off-app shifts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Shift Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono text-center"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Unpaid Break (Minutes)</label>
            <input
              type="number"
              min="0"
              step="5"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Job Site / Client</label>
            <input
              type="text"
              placeholder="e.g. Somerset House, City Venue"
              value={jobSite}
              onChange={(e) => setJobSite(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Duties performed, supervisor sign-off..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Live Preview Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Calculated Duration</span>
              <span className="font-bold text-white font-mono">{calculatedHours.toFixed(2)} Hours</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Est. Pay ({formatCurrency(hourlyRate, currency)}/hr)</span>
              <span className="font-bold text-emerald-400 font-mono">{formatCurrency(estimatedPay, currency)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
