import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { X, Building, DollarSign, Globe, MapPin, Check } from 'lucide-react';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessProfileModal({ isOpen, onClose }: BusinessProfileModalProps) {
  const { currentBusiness, createBusiness } = useCrewPulse();

  const [name, setName] = useState(currentBusiness?.name || 'Apex Crew Agency');
  const [address, setAddress] = useState(currentBusiness?.address || '10 Finsbury Square, London EC2A 1AF');
  const [currency, setCurrency] = useState(currentBusiness?.currency || 'GBP');
  const [timezone, setTimezone] = useState(currentBusiness?.timezone || 'Europe/London');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(currentBusiness?.default_hourly_rate || 15.00);
  const [overtimeThreshold, setOvertimeThreshold] = useState(currentBusiness?.overtime_threshold_hours || 8);
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(currentBusiness?.overtime_rate_multiplier || 1.5);
  const [nightShiftBonus, setNightShiftBonus] = useState(currentBusiness?.night_shift_bonus_rate || 2.00);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createBusiness({
        name,
        address,
        currency,
        timezone,
        default_hourly_rate: Number(defaultHourlyRate) || 15.00,
        overtime_threshold_hours: Number(overtimeThreshold) || 8,
        overtime_rate_multiplier: Number(overtimeMultiplier) || 1.5,
        night_shift_bonus_rate: Number(nightShiftBonus) || 2.00
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create New Business</h3>
              <p className="text-xs text-slate-400">Configure profile, currency & base rate</p>
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Business Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Hospitality, Sparkle Cleaners"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Registered Address / Office</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 10 Finsbury Square, London"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Default Base Rate (/hr)</label>
              <input
                type="number"
                step="0.50"
                min="5"
                value={defaultHourlyRate}
                onChange={(e) => setDefaultHourlyRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Business Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
            </select>
          </div>

          {/* Overtime & Night Shift Policy */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                ⚡ Overtime &amp; Multiplier Policy
              </span>
              <span className="text-[10px] text-slate-500">Auto-calculated</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Threshold</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={overtimeThreshold}
                    onChange={(e) => setOvertimeThreshold(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white text-center outline-none focus:border-amber-400"
                  />
                  <span className="text-[9px] text-slate-500 block text-center mt-0.5">&gt; hours/shift</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">OT Multiplier</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    value={overtimeMultiplier}
                    onChange={(e) => setOvertimeMultiplier(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-amber-300 text-center outline-none focus:border-amber-400"
                  />
                  <span className="text-[9px] text-slate-500 block text-center mt-0.5">e.g. 1.5x</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Night Bonus</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={nightShiftBonus}
                    onChange={(e) => setNightShiftBonus(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-cyan-300 text-center outline-none focus:border-cyan-400"
                  />
                  <span className="text-[9px] text-slate-500 block text-center mt-0.5">+£/hr (22h-06h)</span>
                </div>
              </div>
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
              className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Create Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
