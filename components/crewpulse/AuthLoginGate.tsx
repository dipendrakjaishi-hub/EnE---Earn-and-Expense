import React, { useState } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { generateKYCStaffCode } from '../../api/supabaseClient';
import { cn } from '../../lib/utils';
import { 
  Mail, 
  Hash, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Building, 
  User, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  BadgeCheck,
  Smartphone,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Send,
  Inbox,
  Briefcase,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { isDeviceOnline, isSimulatedOffline, setSimulatedOffline } from '../../lib/offlineSyncManager';

export default function AuthLoginGate() {
  const { login, registerStaff, currentBusiness } = useCrewPulse();

  const [email, setEmail] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regAccountType, setRegAccountType] = useState<'staff' | 'management'>('staff');
  const [regOrganisationName, setRegOrganisationName] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('1998-02-21');
  const [regLocation, setRegLocation] = useState('LDN');

  // Gmail Delivery Receipt state
  const [gmailReceipt, setGmailReceipt] = useState<{
    fullName: string;
    email: string;
    phone: string;
    locationCode: string;
    locationName: string;
    uniqueId: string;
    sentAt: string;
    organisationName: string;
    isManagement: boolean;
  } | null>(null);

  const [hasCopiedReceiptId, setHasCopiedReceiptId] = useState(false);
  const [online, setOnline] = useState<boolean>(isDeviceOnline());
  const [simulated, setSimulated] = useState<boolean>(isSimulatedOffline());

  React.useEffect(() => {
    const handleStatus = () => {
      setOnline(isDeviceOnline());
      setSimulated(isSimulatedOffline());
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    window.addEventListener('crewpulse_offline_state_changed', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      window.removeEventListener('crewpulse_offline_state_changed', handleStatus);
    };
  }, []);

  const handleToggleSimulatedOffline = () => {
    const next = !simulated;
    setSimulatedOffline(next);
    setSimulated(next);
    setOnline(isDeviceOnline());
    if (next) {
      toast.warning('⚡ Simulated Offline Mode ON. Test logging in with no internet.');
    } else {
      toast.success('🌐 Online mode restored.');
    }
  };

  const LOCATION_LABELS: Record<string, string> = {
    LDN: 'London (LDN)',
    MAN: 'Manchester (MAN)',
    BIR: 'Birmingham (BIR)',
    EDI: 'Edinburgh (EDI)',
    GLA: 'Glasgow (GLA)',
    LDS: 'Leeds (LDS)',
    BRS: 'Bristol (BRS)'
  };

  const previewGeneratedId = generateKYCStaffCode(regFullName || 'Staff', regDob, regLocation);

  // Active organisation name (if created by management, show that organisation name)
  const displayOrgName = currentBusiness?.name && currentBusiness.name !== 'Organisation'
    ? currentBusiness.name
    : '';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your Gmail / Email address');
      return;
    }
    if (!uniqueId.trim()) {
      toast.error('Please enter your Unique Staff ID (e.g. LM-2102-LDN)');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, uniqueId, password);
      if (!res.success && res.error) {
        toast.error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regAccountType === 'management' && !regOrganisationName.trim()) {
      toast.error('Please enter your Organisation / Company Name');
      return;
    }
    if (!regFullName.trim()) {
      toast.error('Please enter your full legal name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid Gmail / Email address');
      return;
    }
    if (!regPhone.trim()) {
      toast.error('Please enter your contact mobile number');
      return;
    }
    if (!password) {
      toast.error('Please choose a secret password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerStaff({
        fullName: regFullName,
        email,
        phone: regPhone,
        locationCode: regLocation,
        dob: regDob,
        password,
        organisationName: regAccountType === 'management' ? regOrganisationName.trim() : undefined,
        accountType: regAccountType
      });

      if (res.success) {
        const orgDisp = res.business?.name || regOrganisationName.trim() || currentBusiness?.name || 'Organisation';
        toast.success(`Account registered! Your Unique ID is ${res.generatedId}`);
        // Set Gmail dispatch confirmation receipt
        setGmailReceipt({
          fullName: regFullName,
          email,
          phone: regPhone,
          locationCode: regLocation,
          locationName: LOCATION_LABELS[regLocation] || regLocation,
          uniqueId: res.generatedId,
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          organisationName: orgDisp,
          isManagement: regAccountType === 'management'
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReceiptId = () => {
    if (!gmailReceipt) return;
    navigator.clipboard.writeText(gmailReceipt.uniqueId);
    setHasCopiedReceiptId(true);
    toast.success(`Unique ID "${gmailReceipt.uniqueId}" copied!`);
    setTimeout(() => setHasCopiedReceiptId(false), 2000);
  };

  // Gmail prefill compose URL for web client
  const gmailComposeUrl = gmailReceipt ? (
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(gmailReceipt.email)}&su=${encodeURIComponent('Welcome to ' + gmailReceipt.organisationName + ' - Your Unique Staff ID: ' + gmailReceipt.uniqueId)}&body=${encodeURIComponent(
      `Hello ${gmailReceipt.fullName},\n\nWelcome to ${gmailReceipt.organisationName}! Your ${gmailReceipt.isManagement ? 'management' : 'staff'} registration has been recorded.\n\nHere are your login credentials:\n• Organisation: ${gmailReceipt.organisationName}\n• Gmail: ${gmailReceipt.email}\n• Unique ID: ${gmailReceipt.uniqueId}\n• Mobile Phone: ${gmailReceipt.phone}\n• Assigned Location: ${gmailReceipt.locationName}\n\nLogin at: ${window.location.origin}\nUse your Gmail, Unique ID, and secret password.\n\nBest regards,\n${gmailReceipt.organisationName} Operations Team`
    )}`
  ) : '#';

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xl shadow-lg shadow-cyan-500/30 mb-1">
            CP
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              CrewPulse Authentication
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
              Secure
            </span>
          </div>

          {/* Dynamic Organisation Subtitle (Shows organisation name if created by management) */}
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {displayOrgName ? (
              <>
                <strong className="text-cyan-300 font-semibold">{displayOrgName}</strong> Staff &amp; Management Portal. Enter your credentials to unlock the shift tracker and dashboard.
              </>
            ) : (
              <>
                Staff &amp; Management Portal. Enter your credentials to unlock the shift tracker and dashboard.
              </>
            )}
          </p>
        </div>

        {/* Offline Mode Banner & Quick Tester Toggle */}
        <div className="mb-4">
          {!online ? (
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start justify-between gap-2.5 shadow-sm">
              <div className="flex items-start gap-2">
                <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-white flex items-center gap-1.5">
                    ⚡ Offline Mode Active (No Internet)
                  </span>
                  <p className="text-[11px] text-amber-200/80 leading-normal">
                    You can still log in using your saved credentials (e.g. Liam, Elena, or any previously registered staff). All punches are queued locally for 24-hour auto-sync.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSimulatedOffline}
                className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-[10px] font-bold text-amber-100 whitespace-nowrap"
                title="Toggle online mode"
              >
                Go Online
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Online Mode (24h Offline Sync Ready)
              </span>
              <button
                type="button"
                onClick={handleToggleSimulatedOffline}
                className="text-[10px] text-slate-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                title="Simulate offline condition to test login without internet"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Test Offline Login</span>
              </button>
            </div>
          )}
        </div>

        {/* Existing Staff Login Form */}
        {!isRegisterMode ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* 1. Gmail / Email Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  1. Gmail / Work Email Address
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Step 1 of 3</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Gmail or work email address"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* 2. Unique Staff ID Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                  2. Unique Company Staff ID
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Step 2 of 3</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                  placeholder="e.g. LM-2102-LDN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-600 outline-none focus:border-cyan-500 uppercase tracking-wider transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Code format:</span>
                <strong className="text-slate-400 font-mono">Initials - Birth DDMM - Location</strong>
              </p>
            </div>

            {/* 3. Password Set by User */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  3. Password Set by User
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Step 3 of 3</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secret password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Enter the secret password set for your account.
              </p>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Registration Mode */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Account Type Selector (Staff vs Management/Employer) */}
            <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRegAccountType('staff')}
                className={cn(
                  "py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  regAccountType === 'staff'
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>Employee (Worker)</span>
              </button>

              <button
                type="button"
                onClick={() => setRegAccountType('management')}
                className={cn(
                  "py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  regAccountType === 'management'
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Employer (Manager / CEO / Director)</span>
              </button>
            </div>

            {/* If Management: Enter Organisation / Company Name */}
            {regAccountType === 'management' && (
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                <label className="text-xs font-bold text-purple-200 block flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  Organisation / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={regOrganisationName}
                  onChange={(e) => setRegOrganisationName(e.target.value)}
                  placeholder="e.g. Apex Events Ltd, Metro Logistics, Nova Care"
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-400 font-semibold"
                />
                <p className="text-[10px] text-purple-300">
                  This organisation name will appear on the portal, for your staff, and across shifts.
                </p>
              </div>
            )}

            {/* Full Legal Name */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Liam Murphy"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            {/* Gmail / Work Email */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Gmail / Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                <span>📧</span>
                <span>Your Unique Staff ID and confirmation will be dispatched to this Gmail.</span>
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                Mobile Phone Number
              </label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="e.g. +44 7700 900333"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            {/* Birth Date & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Birth Date (DDMM)
                </label>
                <input
                  type="date"
                  required
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Location
                </label>
                <select
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="LDN">London (LDN)</option>
                  <option value="MAN">Manchester (MAN)</option>
                  <option value="BIR">Birmingham (BIR)</option>
                  <option value="EDI">Edinburgh (EDI)</option>
                  <option value="GLA">Glasgow (GLA)</option>
                  <option value="LDS">Leeds (LDS)</option>
                  <option value="BRS">Bristol (BRS)</option>
                </select>
              </div>
            </div>

            {/* Generated Code Preview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Staff ID to be dispatched:
                </span>
                <span className="font-mono text-lg font-black text-cyan-300 tracking-wider">
                  {previewGeneratedId}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Formula Match
              </span>
            </div>

            {/* Set Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Set Your Secret Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose your secret password (e.g. crew123)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>
                {isLoading 
                  ? 'Registering & Dispatching to Gmail...' 
                  : regAccountType === 'management'
                  ? 'Create Organisation & Send Details to Gmail'
                  : 'Register & Send Details to Gmail'}
              </span>
            </button>
          </form>
        )}

        {/* Toggle between Login and Registration */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-4 cursor-pointer"
          >
            {isRegisterMode 
              ? '← Back to Sign In' 
              : 'New here? Register Staff Details or Create Organisation'}
          </button>
        </div>
      </div>

      {/* Security Footer */}
      <div className="mt-5 text-center text-xs text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>20m Geofenced GPS Shift Verification &amp; KYC Code Integrity Protected</span>
      </div>

      {/* GMAIL DELIVERY CONFIRMATION & CREDENTIALS RECEIPT MODAL */}
      {gmailReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm">
                  <Mail className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    <span>Official Onboarding Sent to Gmail</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Dispatched
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sent to: <strong className="text-cyan-300">{gmailReceipt.email}</strong>
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                {gmailReceipt.sentAt}
              </span>
            </div>

            {/* Simulated Gmail Message Envelope */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3 font-sans text-xs">
              <div className="border-b border-slate-800/80 pb-2.5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span><strong>From:</strong> {gmailReceipt.organisationName} Operations &lt;onboarding@{gmailReceipt.organisationName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'agency'}.com&gt;</span>
                </div>
                <div className="text-slate-400">
                  <span><strong>Subject:</strong> Welcome to {gmailReceipt.organisationName}! Your Company Staff ID is <span className="font-mono font-bold text-cyan-300">{gmailReceipt.uniqueId}</span></span>
                </div>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed">
                <p>Hello <strong>{gmailReceipt.fullName}</strong>,</p>
                <p className="text-slate-400">
                  Welcome to <strong>{gmailReceipt.organisationName}</strong>! Your registration details have been received and recorded in our management portal:
                </p>

                {/* Credentials Highlight Card */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Your Unique Staff ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-base font-black text-cyan-300">{gmailReceipt.uniqueId}</span>
                      <button
                        type="button"
                        onClick={handleCopyReceiptId}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copy ID"
                      >
                        {hasCopiedReceiptId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Organisation:</span>
                    <span className="font-semibold text-white">{gmailReceipt.organisationName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Registered Gmail:</span>
                    <span className="font-semibold text-white">{gmailReceipt.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Contact Number:</span>
                    <span className="font-semibold text-white">{gmailReceipt.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Assigned Location:</span>
                    <span className="font-semibold text-white">{gmailReceipt.locationName}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Please keep this message safe. Whenever you sign in, enter your registered Gmail, your Unique Staff ID (<code className="text-cyan-400 font-mono">{gmailReceipt.uniqueId}</code>), and your secret password.
                </p>
              </div>
            </div>

            {/* Actions: Open in Gmail & Proceed to Dashboard */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <a
                href={gmailComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                <span>Open in Gmail</span>
              </a>

              <button
                type="button"
                onClick={() => setGmailReceipt(null)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95 ml-auto"
              >
                <span>Proceed to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
