import React, { useState, useEffect } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { ShiftExpense } from '../../types/crewpulse';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  X, 
  Receipt, 
  DollarSign, 
  Calendar, 
  Tag, 
  FileText, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface ShiftExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedShiftId?: string | null;
  expenseToEdit?: ShiftExpense | null;
}

const CATEGORIES = [
  { id: 'Travel', label: 'Travel & Transport', icon: '🚗' },
  { id: 'Food', label: 'Food & Subsistence', icon: '🍔' },
  { id: 'Supplies', label: 'Supplies & Tools', icon: '🔧' },
  { id: 'Parking', label: 'Parking & Congestion', icon: '🅿️' },
  { id: 'Uniform', label: 'Uniform & PPE', icon: '🦺' },
  { id: 'Utilities', label: 'Utilities / Phone', icon: '📱' },
  { id: 'Other', label: 'Other Out-of-pocket', icon: '📦' }
];

export default function ShiftExpenseModal({
  isOpen,
  onClose,
  preselectedShiftId,
  expenseToEdit
}: ShiftExpenseModalProps) {
  const { 
    currentBusiness, 
    currentUser, 
    shifts, 
    membership, 
    saveExpense, 
    deleteExpense 
  } = useCrewPulse();

  const [shiftId, setShiftId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Travel');
  const [amount, setAmount] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'reimbursed'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currency = currentBusiness?.currency || 'GBP';
  const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';

  useEffect(() => {
    if (expenseToEdit) {
      setShiftId(expenseToEdit.shift_id || '');
      setTitle(expenseToEdit.title);
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setNotes(expenseToEdit.notes || '');
      setReceiptUrl(expenseToEdit.receipt_url || '');
      setStatus(expenseToEdit.status);
    } else {
      setShiftId(preselectedShiftId || (shifts[0]?.id || ''));
      setTitle('');
      setCategory('Travel');
      setAmount('');
      setNotes('');
      setReceiptUrl('');
      setStatus('pending');
    }
  }, [expenseToEdit, preselectedShiftId, shifts, isOpen]);

  if (!isOpen) return null;

  // Handle receipt image file selection
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<ShiftExpense> = {
        id: expenseToEdit?.id,
        business_id: currentBusiness?.id || 'biz-1',
        shift_id: shiftId || undefined,
        user_id: expenseToEdit?.user_id || currentUser.id,
        title: title.trim(),
        category,
        amount: Number(amount) || 0,
        currency,
        receipt_url: receiptUrl || undefined,
        status: isManagerOrOwner ? status : (expenseToEdit?.status || 'pending'),
        notes: notes.trim() || undefined
      };

      await saveExpense(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToEdit?.id) return;
    if (confirm('Are you sure you want to delete this expense claim?')) {
      await deleteExpense(expenseToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {expenseToEdit ? 'Edit Expense Claim' : 'Claim Shift-Linked Expense'}
              </h3>
              <p className="text-xs text-slate-400">
                Log mileage, travel, tools, or meals for employer reimbursement
              </p>
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
          {/* Shift Linked Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Associate with Shift
            </label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="">General Expense (Not tied to single shift)</option>
              {shifts.map(s => {
                const dateStr = new Date(s.clock_in).toLocaleDateString([], { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                return (
                  <option key={s.id} value={s.id}>
                    {dateStr} • {s.job_site || 'Site'} ({s.total_hours?.toFixed(1) || 0}h)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Expense Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Train ticket, Congestion charge"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Amount ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono font-bold text-white outline-none focus:border-cyan-500"
                />
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                  {currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Approval Status
              </label>
              {isManagerOrOwner ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 capitalize"
                >
                  <option value="pending">⏳ Pending Review</option>
                  <option value="approved">✅ Approved</option>
                  <option value="reimbursed">💸 Reimbursed</option>
                </select>
              ) : (
                <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2.5 text-xs font-bold flex items-center gap-1.5 capitalize text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{status} (Manager Approval Needed)</span>
                </div>
              )}
            </div>
          </div>

          {/* Receipt Proof Photo / File Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Receipt Proof (Photo or Document)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-800/60 cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Upload Receipt Photo / Scan</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
              {receiptUrl && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-500/40 flex-shrink-0 bg-black">
                  <img src={receiptUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setReceiptUrl('')}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-rose-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Return journey after evening shift overrun..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder-slate-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
            {expenseToEdit?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Expense Claim'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
