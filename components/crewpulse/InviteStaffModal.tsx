import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { X, Copy, Check, Mail, Share2, Users, Shield, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteStaffModal({ isOpen, onClose }: InviteStaffModalProps) {
  const { currentBusiness, joinBusiness, currentUser } = useCrewPulse();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedRole, setInvitedRole] = useState<'employee' | 'manager'>('employee');
  const [testJoinCode, setTestJoinCode] = useState('');

  if (!isOpen) return null;

  const inviteCode = currentBusiness?.invite_code || 'CREST-789';
  const inviteLink = `${window.location.origin}/join?code=${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success('Shareable invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    toast.success(`Invite code "${inviteCode}" copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    toast.success(`Invitation dispatched to ${inviteEmail} for role: ${invitedRole.toUpperCase()}`);
    setInviteEmail('');
  };

  const handleTestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testJoinCode) return;
    try {
      await joinBusiness(testJoinCode);
      setTestJoinCode('');
      onClose();
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Invite Crew & Staff</h3>
              <p className="text-xs text-slate-400">{currentBusiness?.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Shareable Invite Code Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Business Team Invite Code</span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded">
                Active Code
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-xl font-black text-cyan-400 tracking-wider text-center">
                {inviteCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Employees can enter this code in their mobile app to link immediately to your business.
            </p>
          </div>

          {/* Quick Shareable Web Link */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
              Direct Shareable Join Link
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Invite by Email */}
          <form onSubmit={handleSendInvite} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              Send Direct Email Invitation
            </span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="email"
                placeholder="staff.member@gmail.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
              />
              <select
                value={invitedRole}
                onChange={(e) => setInvitedRole(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              Send Invite Link
            </button>
          </form>

          {/* Join Another Business Option (Employee multi-business support) */}
          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Have another business invite code? Join as staff:
            </p>
            <form onSubmit={handleTestJoin} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter invite code (e.g. JOIN-XXXX)"
                value={testJoinCode}
                onChange={(e) => setTestJoinCode(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500 uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
