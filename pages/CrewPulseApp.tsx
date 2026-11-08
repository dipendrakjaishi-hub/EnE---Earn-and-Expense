import React, { useState, useContext } from 'react';
import { useCrewPulse, CrewPulseContext, CrewPulseProvider } from '../context/CrewPulseContext';
import RoleSwitcherBar from '../components/crewpulse/RoleSwitcherBar';
import ClockInOutCard from '../components/crewpulse/ClockInOutCard';
import MyHoursSummary from '../components/crewpulse/MyHoursSummary';
import ShiftListFeed from '../components/crewpulse/ShiftListFeed';
import ManualShiftModal from '../components/crewpulse/ManualShiftModal';
import InviteStaffModal from '../components/crewpulse/InviteStaffModal';
import BusinessProfileModal from '../components/crewpulse/BusinessProfileModal';
import PinnedSiteSettingModal from '../components/crewpulse/PinnedSiteSettingModal';
import UserProfileModal from '../components/crewpulse/UserProfileModal';
import IncomeAnalyticsModal from '../components/crewpulse/IncomeAnalyticsModal';
import ShiftExpenseModal from '../components/crewpulse/ShiftExpenseModal';
import ShiftAIAssistantModal from '../components/crewpulse/ShiftAIAssistantModal';
import LiveStaffSitesMapView from '../components/crewpulse/LiveStaffSitesMapView';
import ManagementApprovalsCard from '../components/crewpulse/ManagementApprovalsCard';
import AuthLoginGate from '../components/crewpulse/AuthLoginGate';
import UserDetailsCard from '../components/crewpulse/UserDetailsCard';
import UpcomingRotaSchedule from '../components/crewpulse/UpcomingRotaSchedule';
import WeeklyTimesheetExportModal from '../components/crewpulse/WeeklyTimesheetExportModal';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Share2, 
  Building, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  AlertCircle, 
  Database, 
  User, 
  Settings, 
  TrendingUp, 
  Receipt, 
  Bot,
  Map as MapIcon,
  LayoutGrid,
  Calendar,
  BadgeCheck
} from 'lucide-react';

function CrewPulseAppContent() {
  const { 
    currentUser, 
    setCurrentUser,
    currentBusiness, 
    membership, 
    shifts, 
    allProfiles,
    jobSites,
    isLoading,
    isAuthenticated
  } = useCrewPulse();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isPinnedSiteModalOpen, setIsPinnedSiteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // Default to 'details' tab so only user details show immediately after logging in
  const [activeTab, setActiveTab] = useState<'details' | 'rota' | 'clock' | 'shifts' | 'management'>('details');
  const [isMobileSimulator, setIsMobileSimulator] = useState(false);

  const [liveCrewView, setLiveCrewView] = useState<'map' | 'cards' | 'both'>('both');

  const currency = currentBusiness?.currency || 'GBP';
  const role = membership?.role || 'employee';
  const isEmployer = role === 'employer';
  const isManager = role === 'manager';

  // Live team stats for employers/managers
  const activeNowShifts = shifts.filter(s => s.status === 'active' || s.status === 'break');
  const todayCompletedShifts = shifts.filter(s => {
    const todayStr = new Date().toISOString().split('T')[0];
    return s.clock_in.startsWith(todayStr) && s.status === 'completed';
  });

  const todayHours = todayCompletedShifts.reduce((acc, s) => acc + (s.total_hours || 0), 0);
  const todayPay = todayCompletedShifts.reduce((acc, s) => acc + (s.estimated_pay || 0), 0);

  // Gate app access: Show login interface first until credentials are submitted
  if (!isAuthenticated) {
    return <AuthLoginGate />;
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Interactive Role & Business Switcher Bar */}
      <RoleSwitcherBar 
        onOpenInviteModal={() => setIsInviteModalOpen(true)}
        onOpenBusinessModal={() => setIsBusinessModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        isMobileSimulator={isMobileSimulator}
        onToggleMobileSimulator={() => setIsMobileSimulator(prev => !prev)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Business Hero Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  {currentBusiness?.name || 'Organisation'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  Code: <strong className="text-slate-200">{currentBusiness?.invite_code}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {isEmployer || isManager 
                  ? 'Employer Command Centre' 
                  : 'Employee Command Centre'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                {isEmployer || isManager
                  ? 'Executive & Operations Management (Manager, Director, CEO, Employer). Manage business hourly rates, monitor real-time staff on Google Maps, approve shift swaps, and inspect company audit logs.'
                  : 'Worker Shift & Rota Portal. Clock in with 20m GPS verification, confirm upcoming weekly rotas, record rest breaks, and download verified timesheets.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Shift Copilot</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs border border-blue-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>{isEmployer || isManager ? 'Payroll & Timesheet Export' : 'Timesheet & Payslip PDF'}</span>
              </button>

              <button
                onClick={() => setIsAnalyticsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Earnings &amp; Tax</span>
              </button>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Expense Claims</span>
              </button>

              {(isEmployer || isManager) && (
                <button
                  onClick={() => setIsPinnedSiteModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Site Geofence (20m)</span>
                </button>
              )}

              {(isEmployer || isManager) && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Invite Staff</span>
                </button>
              )}

              <button
                onClick={() => setIsManualModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Shift</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive All-Features Guide & Explorer Banner */}
        <div className="rounded-2xl p-4 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-purple-950/30 border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-xs sm:text-sm text-white">
                Platform Features Tour (All 10 Modules Active)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                Interactive
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Click any feature below to switch views or launch the module instantly:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {/* 1. User Details */}
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                activeTab === 'details'
                  ? "bg-cyan-950/60 border-cyan-500/60 text-white shadow-md"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  1. My Details
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                KYC ID, Rate, Geofenced Site
              </span>
            </button>

            {/* 2. Upcoming Rota */}
            <button
              type="button"
              onClick={() => setActiveTab('rota')}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                activeTab === 'rota'
                  ? "bg-cyan-950/60 border-cyan-500/60 text-white shadow-md"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  2. Weekly Rota
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Attendance Check &amp; Swaps
              </span>
            </button>

            {/* 3. GPS Clock In/Out */}
            <button
              type="button"
              onClick={() => setActiveTab('clock')}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                activeTab === 'clock'
                  ? "bg-cyan-950/60 border-cyan-500/60 text-white shadow-md"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  3. GPS Clock-In
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                20m Geofence, Breaks &amp; Selfie
              </span>
            </button>

            {/* 4. Shift History */}
            <button
              type="button"
              onClick={() => setActiveTab('shifts')}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                activeTab === 'shifts'
                  ? "bg-cyan-950/60 border-cyan-500/60 text-white shadow-md"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  4. Shift History
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Audited Timesheets &amp; Pay
              </span>
            </button>

            {/* 5. Management & Map */}
            <button
              type="button"
              onClick={() => setActiveTab('management')}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                activeTab === 'management'
                  ? "bg-purple-950/60 border-purple-500/60 text-white shadow-md"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-purple-500/40 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] flex items-center gap-1 text-purple-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  5. Manager Map
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Google Map &amp; Approvals
              </span>
            </button>

            {/* 6. Payroll Export */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="p-2.5 rounded-xl border bg-slate-950/60 border-slate-800/80 hover:border-blue-500/50 text-slate-300 hover:text-white text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px] flex items-center gap-1 text-blue-300">
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  6. Payroll CSV
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                Export Wages &amp; Timesheets
              </span>
            </button>
          </div>
        </div>

        {/* Primary View Navigation Tabs - My User Details is active on login */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'details'
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>🪪 My User Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rota')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'rota'
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📅 Upcoming Rota</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clock')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'clock'
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏱️ Clock In / Out</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shifts')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'shifts'
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📋 Shift History</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('management')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'management'
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>🛡️ Management &amp; Map</span>
              {!isEmployer && !isManager && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-normal">
                  Preview
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5">
              <BadgeCheck className="w-3 h-3 text-cyan-400" />
              <span>ID: {currentUser.employee_id || 'LM-2102-LDN'}</span>
            </span>
          </div>
        </div>

        {/* Content Rendered based on Active Tab */}
        {isMobileSimulator ? (
          /* Mobile Simulator Frame View */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Live Smartphone View Simulator (iPhone / Android)</h4>
                  <p className="text-slate-400 text-[11px]">
                    Showing staff view on mobile phone. Staff details, unique ID, and shifts are exclusively filtered to {currentUser.full_name}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSimulator(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors ml-auto cursor-pointer"
              >
                Exit Phone Simulator
              </button>
            </div>

            {/* Mobile Phone Mockup Frame */}
            <div className="max-w-[420px] mx-auto rounded-[52px] border-[10px] border-slate-800 bg-[#070b12] shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden relative ring-1 ring-slate-700/60 text-slate-100">
              {/* Dynamic Island Status Bar */}
              <div className="pt-3 pb-2 px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/90 border-b border-slate-900 sticky top-0 z-30">
                <span>9:41</span>
                <div className="w-24 h-5 rounded-full bg-black border border-slate-800 flex items-center justify-center gap-2 shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Mobile In-App Header */}
              <div className="p-3.5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white overflow-hidden shadow-md">
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentUser.full_name?.charAt(0) || 'W'}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block truncate max-w-[140px]">
                      {currentBusiness?.name || 'Company'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate max-w-[100px]">
                        {currentUser.full_name}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {currentUser.employee_id || 'LM-2102-LDN'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-bold text-[10px] border border-cyan-500/30 transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              {/* Mobile Tab Navigation */}
              <div className="grid grid-cols-4 p-1 bg-slate-950 border-b border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    "py-1.5 rounded-lg text-center transition-all",
                    activeTab === 'details' ? "bg-cyan-600 text-white" : "text-slate-400"
                  )}
                >
                  🪪 Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rota')}
                  className={cn(
                    "py-1.5 rounded-lg text-center transition-all",
                    activeTab === 'rota' ? "bg-cyan-600 text-white" : "text-slate-400"
                  )}
                >
                  📅 Rota
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clock')}
                  className={cn(
                    "py-1.5 rounded-lg text-center transition-all",
                    activeTab === 'clock' ? "bg-cyan-600 text-white" : "text-slate-400"
                  )}
                >
                  ⏱️ Clock
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shifts')}
                  className={cn(
                    "py-1.5 rounded-lg text-center transition-all",
                    activeTab === 'shifts' ? "bg-cyan-600 text-white" : "text-slate-400"
                  )}
                >
                  📋 Shifts
                </button>
              </div>

              {/* Mobile Scrollable Screen Content */}
              <div className="p-3.5 space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <UserDetailsCard 
                      onOpenEditProfile={() => setIsProfileModalOpen(true)}
                      onNavigateToShifts={() => setActiveTab('clock')}
                      onOpenExportTimesheet={() => setIsExportModalOpen(true)}
                    />
                    <MyHoursSummary />
                  </div>
                )}

                {activeTab === 'rota' && (
                  <div className="space-y-4">
                    <UpcomingRotaSchedule />
                  </div>
                )}

                {activeTab === 'clock' && (
                  <div className="space-y-4">
                    <ClockInOutCard onManualShiftClick={() => setIsManualModalOpen(true)} />
                    <MyHoursSummary />
                  </div>
                )}

                {activeTab === 'shifts' && (
                  <ShiftListFeed />
                )}
              </div>

              {/* Native iOS/Android Home Indicator */}
              <div className="py-2.5 flex justify-center bg-slate-950 border-t border-slate-900">
                <div className="w-32 h-1 rounded-full bg-slate-600" />
              </div>
            </div>
          </div>
        ) : (
          /* Standard Desktop & Tablet Responsive Views */
          <div className="space-y-6">
            {/* TAB 1: My User Details (Default on login) */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <UserDetailsCard 
                  onOpenEditProfile={() => setIsProfileModalOpen(true)}
                  onNavigateToShifts={() => setActiveTab('clock')}
                  onOpenExportTimesheet={() => setIsExportModalOpen(true)}
                />
                <MyHoursSummary />
              </div>
            )}

            {/* TAB 2: Upcoming Rota & Shift Assignment */}
            {activeTab === 'rota' && (
              <div className="space-y-6">
                <UpcomingRotaSchedule />
              </div>
            )}

            {/* TAB 3: Shift Clock In / Out */}
            {activeTab === 'clock' && (
              <div className="space-y-6">
                <ClockInOutCard onManualShiftClick={() => setIsManualModalOpen(true)} />
                <MyHoursSummary />
              </div>
            )}

            {/* TAB 4: Shift History Feed */}
            {activeTab === 'shifts' && (
              <div className="space-y-6">
                <ShiftListFeed />
              </div>
            )}

            {/* TAB 5: Management & Live Map (Visible for Employers/Managers & Preview for Staff) */}
            {activeTab === 'management' && (
              <div className="space-y-6">
                {!isEmployer && !isManager && (
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-200">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-white">Management Command Centre &amp; Live Map (Staff Preview Mode)</p>
                        <p className="text-[11px] text-purple-300">
                          Inspect live Google Maps pins, on-site worker tracking, and shift/swap approval queues.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const elena = allProfiles.find(p => p.email?.includes('elena'));
                        if (elena) setCurrentUser(elena);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ml-auto"
                    >
                      Switch to Elena (Employer Mode) →
                    </button>
                  </div>
                )}
                <ManagementApprovalsCard />

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-bold text-sm text-white">Live On-Site Crew Operations</h3>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        {activeNowShifts.length} Clocked In Right Now
                      </span>
                    </div>

                    <div className="flex p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setLiveCrewView('map')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all",
                          liveCrewView === 'map' ? "bg-cyan-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <MapIcon className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Google Map</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveCrewView('cards')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all",
                          liveCrewView === 'cards' ? "bg-cyan-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Cards</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveCrewView('both')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hidden sm:flex",
                          liveCrewView === 'both' ? "bg-cyan-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        )}
                      >
                        <span>Both</span>
                      </button>
                    </div>
                  </div>

                  {(liveCrewView === 'map' || liveCrewView === 'both') && (
                    <LiveStaffSitesMapView 
                      shifts={shifts}
                      jobSites={jobSites}
                      allProfiles={allProfiles}
                      businessName={currentBusiness?.name}
                    />
                  )}

                  {(liveCrewView === 'cards' || liveCrewView === 'both') && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                          Live Worker Status Badges
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {activeNowShifts.length} Active / On Break
                        </span>
                      </div>

                      {activeNowShifts.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-center text-xs text-slate-400">
                          No workers currently clocked in. Staff can clock in using their mobile PWA.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {activeNowShifts.map(s => {
                            const worker = s.profile || allProfiles.find(p => p.id === s.user_id);
                            const isOnBreak = s.status === 'break';
                            return (
                              <div 
                                key={s.id} 
                                className={cn(
                                  "p-3.5 rounded-2xl border transition-all",
                                  isOnBreak ? "bg-amber-500/5 border-amber-500/30" : "bg-emerald-500/5 border-emerald-500/30"
                                )}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-bold text-sm text-white">{worker?.full_name || 'Worker'}</span>
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                    isOnBreak ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                                  )}>
                                    {isOnBreak ? 'On Break' : 'Active'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                  {s.job_site || 'Site A'}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                                  Clocked In: {new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 1 Architecture & Free Tier Badges Footer */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Supabase Free Tier (Postgres + RLS)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              PWA Offline Clock-In Ready
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            Phase 1 Complete (Auth, Business, Invites, Mobile Clock In/Out, Shift Feed). Say &ldquo;next&rdquo; for Phase 2.
          </div>
        </div>
      </main>

      {/* Modals */}
      <ManualShiftModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
      />

      <InviteStaffModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />

      <BusinessProfileModal 
        isOpen={isBusinessModalOpen} 
        onClose={() => setIsBusinessModalOpen(false)} 
      />

      <PinnedSiteSettingModal
        isOpen={isPinnedSiteModalOpen}
        onClose={() => setIsPinnedSiteModalOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <IncomeAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      <ShiftExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <ShiftAIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      <WeeklyTimesheetExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

export default function CrewPulseApp() {
  const ctx = useContext(CrewPulseContext);
  if (!ctx) {
    return (
      <CrewPulseProvider>
        <CrewPulseAppContent />
      </CrewPulseProvider>
    );
  }
  return <CrewPulseAppContent />;
}
