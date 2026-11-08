import React, { useState, useEffect, useRef } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { useAppContext } from '../../context/AppContext';
import { generateKYCStaffCode } from '../../api/supabaseClient';
import { cn } from '../../lib/utils';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Briefcase, 
  DollarSign, 
  Camera, 
  ImagePlus, 
  Sparkles, 
  ShieldCheck, 
  Bell, 
  Download, 
  Trash2, 
  Save, 
  Footprints, 
  TrendingUp, 
  MessagesSquare, 
  Wallet, 
  Lock, 
  Unlock,
  Check,
  RefreshCw,
  Award,
  Copy,
  Building,
  BadgeCheck,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAB_WALLPAPERS = [
  { key: 'wallpaper_work', label: 'Work Tab', icon: Footprints, color: 'text-violet-400', border: 'border-violet-500/30' },
  { key: 'wallpaper_income', label: 'Income Tab', icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { key: 'wallpaper_chat', label: 'Chat Tab', icon: MessagesSquare, color: 'text-blue-400', border: 'border-blue-500/30' },
  { key: 'wallpaper_expenses', label: 'Expenses Tab', icon: Wallet, color: 'text-rose-400', border: 'border-rose-500/30' },
  { key: 'wallpaper_customise', label: 'Customise Tab', icon: Sparkles, color: 'text-amber-400', border: 'border-amber-500/30' },
];

const PRESET_AVATARS = [
  { label: 'Hospitality', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { label: 'Event Crew', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { label: 'Lead Specialist', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200' },
  { label: 'Operations', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
  { label: 'Executive', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200' }
];

const TRADE_TAGS = [
  'Lead Bartender',
  'Barista',
  'Event Host',
  'Commercial Cleaning',
  'CSCS Site Operative',
  'Forklift Operator',
  'SIA Door Supervisor',
  'Kitchen Porter',
  'Warehouse Logistics',
  'Operations Supervisor'
];

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { 
    currentUser, 
    updateProfile, 
    currentBusiness, 
    membership, 
    shifts, 
    allowEmployerEdit, 
    setAllowEmployerEdit 
  } = useCrewPulse();

  const appContext = useAppContext?.();

  // Active section tab
  const [activeSection, setActiveSection] = useState<'profile' | 'kyc' | 'professional' | 'wallpapers' | 'preferences'>('profile');

  // Form states initialized from currentUser
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [shortNote, setShortNote] = useState('');
  const [bio, setBio] = useState('');
  const [trade, setTrade] = useState('Lead Bartender');
  const [hourlyRatePref, setHourlyRatePref] = useState<number>(15);
  const [employeeId, setEmployeeId] = useState<string>('LM-2102-LDN');
  const [hasCopiedId, setHasCopiedId] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [gpsConsent, setGpsConsent] = useState(true);

  // KYC States
  const [dob, setDob] = useState<string>('1998-02-21');
  const [kycLocationCode, setKycLocationCode] = useState<string>('LDN');
  const [kycDocType, setKycDocType] = useState<string>('Passport');
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified'>('verified');
  const [kycDocUrl, setKycDocUrl] = useState<string>('');

  // Working Rights & Post on Digital ID Card
  const [workingRights, setWorkingRights] = useState<'Full-Time' | 'Part-Time' | 'Student Visa (20h/wk)' | 'Flexible'>('Full-Time');
  const [workingPost, setWorkingPost] = useState<string>('Senior Banquet Bartender');

  // Wallpapers
  const [wallpapers, setWallpapers] = useState<Record<string, string>>({
    wallpaper_work: '',
    wallpaper_income: '',
    wallpaper_chat: '',
    wallpaper_expenses: '',
    wallpaper_customise: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setEmail(currentUser.email || '');
      setPhoneNumber(currentUser.phone || currentUser.phone_number || '');
      setAddress(currentUser.address || '');
      setAvatarUrl(currentUser.avatar_url || '');
      setShortNote(currentUser.short_note || '');
      setBio(currentUser.bio || '');
      setTrade(currentUser.trade || 'Lead Bartender');
      setHourlyRatePref(currentUser.hourly_rate_preference ?? membership?.custom_hourly_rate ?? 15);
      
      const userDob = currentUser.dob || '1998-02-21';
      const userLoc = currentUser.kyc_location_code || 'LDN';
      setDob(userDob);
      setKycLocationCode(userLoc);
      setKycDocType(currentUser.kyc_document_type || 'Passport');
      setKycStatus(currentUser.kyc_status || 'verified');
      setKycDocUrl(currentUser.kyc_document_url || '');

      const defaultGenerated = generateKYCStaffCode(currentUser.full_name || 'Worker', userDob, userLoc);
      setEmployeeId(currentUser.employee_id || defaultGenerated);
      
      setNotificationsEnabled(currentUser.notifications_enabled ?? true);
      setGpsConsent(currentUser.gps_consent ?? true);
      setWorkingRights(currentUser.working_rights || 'Full-Time');
      setWorkingPost(currentUser.working_post || currentUser.trade || (currentUser.email?.includes('elena') || currentUser.email?.includes('marcus') ? 'Operations Management' : 'Hospitality Specialist'));
      setWallpapers({
        wallpaper_work: currentUser.wallpaper_work || '',
        wallpaper_income: currentUser.wallpaper_income || '',
        wallpaper_chat: currentUser.wallpaper_chat || '',
        wallpaper_expenses: currentUser.wallpaper_expenses || '',
        wallpaper_customise: currentUser.wallpaper_customise || ''
      });
    }
  }, [currentUser, membership, isOpen]);

  const handleCopyStaffId = () => {
    if (!employeeId) return;
    navigator.clipboard.writeText(employeeId);
    setHasCopiedId(true);
    toast.success(`Company Staff ID ${employeeId} copied to clipboard!`);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  // Clean up camera stream on unmount/close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  // Camera capture handlers
  const handleStartCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      toast.error('Could not access front camera. Select a photo or preset instead.');
      setIsCameraActive(false);
    }
  };

  const handleSnapCameraPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setAvatarUrl(dataUrl);
        toast.success('Selfie avatar captured!');
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetKey?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (targetKey) {
        setWallpapers(prev => ({ ...prev, [targetKey]: result }));
        toast.success(`Wallpaper set for ${targetKey.replace('wallpaper_', '')}`);
      } else {
        setAvatarUrl(result);
        toast.success('Profile photo uploaded!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';
      
      // Calculate code from KYC: {Initials}-{DDMM}-{LOC}
      const calculatedCode = generateKYCStaffCode(fullName, dob, kycLocationCode);
      const finalEmployeeId = isManagerOrOwner ? employeeId.trim() : (currentUser.employee_id || calculatedCode);

      // If staff updated DOB or Location, set status to pending unless already verified by employer
      let finalKycStatus = kycStatus;
      if (!isManagerOrOwner) {
        if (dob !== currentUser.dob || kycLocationCode !== currentUser.kyc_location_code) {
          finalKycStatus = 'pending';
        }
      }

      const updates = {
        full_name: fullName,
        email,
        phone: phoneNumber,
        phone_number: phoneNumber,
        address,
        avatar_url: avatarUrl,
        short_note: shortNote,
        bio,
        trade,
        working_rights: workingRights,
        working_post: workingPost,
        hourly_rate_preference: isManagerOrOwner ? Number(hourlyRatePref) : (currentUser.hourly_rate_preference ?? 15),
        employee_id: finalEmployeeId,
        dob,
        kyc_status: finalKycStatus,
        kyc_document_type: kycDocType,
        kyc_location_code: kycLocationCode,
        kyc_document_url: kycDocUrl,
        notifications_enabled: notificationsEnabled,
        gps_consent: gpsConsent,
        ...wallpapers
      };

      await updateProfile(updates);

      // Keep AppContext in sync if present
      if (appContext?.updateUser) {
        appContext.updateUser({
          full_name: fullName,
          phone_number: phoneNumber,
          address,
          short_note: shortNote
        });
      }

      if (!isManagerOrOwner && finalKycStatus === 'pending') {
        toast.info(`KYC updated! Staff Code ${calculatedCode} submitted for management sign-off.`);
      }

      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const myShifts = shifts.filter(s => s.user_id === currentUser.id);
    const exportPayload = {
      profile: currentUser,
      business: currentBusiness,
      membership,
      shifts: myShifts,
      exported_at: new Date().toISOString(),
      gdpr_compliance: 'EU/UK GDPR Data Portability Article 20'
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crewpulse_profile_export_${currentUser.full_name.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Your complete GDPR profile & shifts export has been downloaded.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative text-white flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white overflow-hidden shadow-lg shadow-cyan-500/20 border border-white/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  {fullName || 'Staff Profile'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                  {membership?.role || 'Worker'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-cyan-400" />
                  ID: {employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage company staff ID, personal contact, work note, &amp; hourly rates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 my-4 flex-shrink-0 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'profile', label: '1. Personal Info', icon: User },
            { id: 'kyc', label: '2. KYC & Staff ID', icon: BadgeCheck },
            { id: 'professional', label: '3. Work & Rates', icon: Briefcase },
            { id: 'wallpapers', label: '4. Wallpapers', icon: ImagePlus },
            { id: 'preferences', label: '5. Privacy & GDPR', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={cn(
                  "flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all whitespace-nowrap",
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto pr-1 space-y-5">
          
          {/* SECTION 1: PERSONAL INFO & AVATAR (Editable by Staff) */}
          {activeSection === 'profile' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Quick ID Status Banner with link to Tab 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Company Staff Reference ID
                    </span>
                    <span className="font-mono text-base font-black text-cyan-300 tracking-wider">
                      {employeeId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    kycStatus === 'verified'
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  )}>
                    {kycStatus === 'verified' ? '✓ KYC Verified' : '⏳ Pending Review'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSection('kyc')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-cyan-300 border border-slate-700 transition-colors"
                  >
                    View KYC Code
                  </button>
                </div>
              </div>

              {/* Avatar Selector Section */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    Profile Picture / Front Camera Selfie
                  </span>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Photo
                    </button>
                  )}
                </div>

                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500 bg-black aspect-video flex flex-col items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                    <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleSnapCameraPhoto}
                        className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        SNAP SELFIE NOW
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
                          setIsCameraActive(false);
                        }}
                        className="px-3 py-2 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleStartCamera}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Snap Front Selfie
                        </button>

                        <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
                          <ImagePlus className="w-3.5 h-3.5" />
                          Upload Photo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e)} />
                        </label>
                      </div>

                      {/* Preset avatars */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500">Presets:</span>
                        {PRESET_AVATARS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(p.url)}
                            className="w-7 h-7 rounded-full overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all hover:scale-110"
                            title={p.label}
                          >
                            <img src={p.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Names and Contact (Editable by Staff) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Legal / Preferred Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Liam Murphy"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="liam.murphy@crewteam.co.uk"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Phone Number (Shift Coordinator Contact)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+44 7700 900333"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Home Base / Area Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Islington, London, UK"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: KYC & UNIQUE STAFF CODE GENERATION */}
          {activeSection === 'kyc' && (() => {
            const isManagerOrOwner = membership?.role === 'employer' || membership?.role === 'manager';
            const generatedCode = generateKYCStaffCode(fullName, dob, kycLocationCode);
            
            // Extract components for formula explainer
            const parts = fullName.trim().split(/\s+/).filter(Boolean);
            const initialLetters = (parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : fullName.slice(0, 2)).toUpperCase() || 'LM';
            const dateParts = dob.split('-');
            const dayCode = dateParts.length === 3 ? `${dateParts[2]}${dateParts[1]}` : '2102';
            const dayNum = dateParts.length === 3 ? dateParts[2] : '21';
            const monthNum = dateParts.length === 3 ? dateParts[1] : '02';

            return (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Formula Breakdown Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <BadgeCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                          Official KYC Rule Algorithm
                        </span>
                        <h4 className="text-sm font-extrabold text-white">
                          Unique Staff ID Generation Formula
                        </h4>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                      kycStatus === 'verified'
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {kycStatus === 'verified' ? 'Status: KYC Verified' : 'Status: Pending Verification'}
                    </span>
                  </div>

                  {/* Formula Diagram Pills */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center mb-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">1. Initials</span>
                      <span className="font-mono text-base font-black text-cyan-300">{initialLetters}</span>
                      <span className="text-[9px] text-slate-500 block truncate">{fullName.split(' ')[0]}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">2. Birth DDMM</span>
                      <span className="font-mono text-base font-black text-amber-300">{dayCode}</span>
                      <span className="text-[9px] text-slate-500 block">Day {dayNum} • Mo {monthNum}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">3. Location</span>
                      <span className="font-mono text-base font-black text-emerald-300">{kycLocationCode}</span>
                      <span className="text-[9px] text-slate-500 block">City Hub</span>
                    </div>
                  </div>

                  {/* Generated Result Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {isManagerOrOwner ? 'Active Staff ID (Manager Override Allowed)' : 'Your Auto-Generated KYC Staff Code'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-2xl font-black text-white tracking-widest text-cyan-300">
                          {isManagerOrOwner ? employeeId : generatedCode}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {isManagerOrOwner ? 'MANAGEMENT' : 'STAFF'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const target = isManagerOrOwner ? employeeId : generatedCode;
                        navigator.clipboard.writeText(target);
                        setHasCopiedId(true);
                        toast.success(`Staff ID ${target} copied!`);
                        setTimeout(() => setHasCopiedId(false), 2000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      {hasCopiedId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Permission Boundary Explainer */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                    {isManagerOrOwner ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-purple-400" />
                            Management Controls (Unlocked)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Management can override ID or verify KYC
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-400">Override ID:</span>
                          <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 outline-none w-36 uppercase"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEmployeeId(generatedCode);
                              toast.info(`Reset to formula: ${generatedCode}`);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                          >
                            Reset to Formula
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setKycStatus('verified');
                              toast.success('KYC marked as verified by Management!');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] ml-auto"
                          >
                            ✓ Verify KYC Now
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-slate-400 leading-relaxed text-[11px]">
                        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300">Staff Permission Rule: </strong>
                          Staff can update their personal details, birth date, location, and KYC documents below. However, the official unique ID and roster verification are <strong>locked and can only be approved by Management</strong>. Once saved, your update is queued for management sign-off.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff KYC Input Form */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    KYC Identity Verification Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date of Birth */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Date of Birth (Sets middle DDMM code)
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Example: 21 Feb 1998 generates <strong>2102</strong>
                      </span>
                    </div>

                    {/* Location City Hub Code */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Assigned Location Hub (Sets last 3 letters)
                      </label>
                      <select
                        value={kycLocationCode}
                        onChange={(e) => setKycLocationCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      >
                        <option value="LDN">LDN - London (Headquarters &amp; Greater London)</option>
                        <option value="MAN">MAN - Manchester (North West Hub)</option>
                        <option value="BIR">BIR - Birmingham (Midlands Hub)</option>
                        <option value="EDI">EDI - Edinburgh (Scotland Hub)</option>
                        <option value="GLA">GLA - Glasgow (Clyde &amp; West)</option>
                        <option value="LDS">LDS - Leeds (Yorkshire &amp; Humber)</option>
                        <option value="BRS">BRS - Bristol (South West Hub)</option>
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Selected code: <strong>{kycLocationCode}</strong>
                      </span>
                    </div>

                    {/* Document Type */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Government Identity Document
                      </label>
                      <select
                        value={kycDocType}
                        onChange={(e) => setKycDocType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      >
                        <option value="Passport">Passport (International / UK / EU)</option>
                        <option value="Driving Licence">Full UK / EU Driving Licence</option>
                        <option value="National ID Card">National Identity Card</option>
                        <option value="Biometric Residence Permit">Biometric Residence Permit (BRP)</option>
                      </select>
                    </div>

                    {/* Document Upload */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Upload Document Copy or Photo Proof
                      </label>
                      <label className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-cyan-500 text-xs text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <ImagePlus className="w-4 h-4 text-cyan-400" />
                        <span>{kycDocUrl ? 'Document Photo Attached ✓' : 'Upload ID Document'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => {
                                setKycDocUrl(r.result as string);
                                toast.success('KYC Document attached!');
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECTION 2: WORK, RATES & PROFESSIONAL NOTE */}
          {activeSection === 'professional' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Primary Trade / Crew Role
                  </label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  >
                    {TRADE_TAGS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Assigned Base Hourly Rate ({currentBusiness?.currency || '£'})
                    </label>
                    {membership?.role === 'employer' || membership?.role === 'manager' ? (
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                        <Unlock className="w-3 h-3 text-purple-400" />
                        Management Editable
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        Locked for Staff
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      step="0.25"
                      disabled={membership?.role === 'employee'}
                      value={hourlyRatePref}
                      onChange={(e) => setHourlyRatePref(parseFloat(e.target.value) || 0)}
                      className={cn(
                        "w-full rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold outline-none",
                        membership?.role === 'employee'
                          ? "bg-slate-950/80 border border-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-slate-950 border border-slate-700 text-white focus:border-emerald-500"
                      )}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {membership?.role === 'employee'
                      ? 'Base hourly pay rate is locked by employer. Staff cannot change wages directly.'
                      : `Business default is ${currentBusiness?.currency || '£'}${currentBusiness?.default_hourly_rate?.toFixed(2) || '15.00'}/hr`}
                  </span>
                </div>
              </div>

              {/* Working Rights & Working Post (Appears on Digital Staff ID Card) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    Working Right (Right to Work Status)
                  </label>
                  <select
                    value={workingRights}
                    onChange={(e: any) => setWorkingRights(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-semibold cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time (40h/wk UK Right to Work)</option>
                    <option value="Part-Time">Part-Time Contract</option>
                    <option value="Student Visa (20h/wk)">Student Visa (Term-time 20h cap)</option>
                    <option value="Flexible">Flexible / Zero-Hours</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Displays on official digital banking-style staff ID card.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    Working Post / Job Designation
                  </label>
                  <input
                    type="text"
                    value={workingPost}
                    onChange={(e) => setWorkingPost(e.target.value)}
                    placeholder="e.g. Senior Banquet Bartender, Operations Director"
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Official job title printed on digital ID card.
                  </span>
                </div>
              </div>

              {/* Professional Note (Visible to employer) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Professional Note &amp; Certifications (Visible to Agency / Employer)
                </label>
                <textarea
                  rows={3}
                  value={shortNote}
                  onChange={(e) => setShortNote(e.target.value)}
                  placeholder="e.g. SIA Door Supervisor certified, 5+ years cocktail experience, full clean UK driving licence..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder-slate-600"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  This note is shown to the employer during rota allocation and shift planning.
                </p>
              </div>

              {/* Private Notes / Bio */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Private Personal Notes &amp; Availability Preferences
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Available Thursday to Sunday evening shifts only. Prefer central London venues..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-cyan-500 placeholder-slate-600"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: CUSTOM TAB WALLPAPERS */}
          {activeSection === 'wallpapers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <p className="font-bold text-white flex items-center gap-1.5 mb-1">
                  <ImagePlus className="w-4 h-4 text-cyan-400" />
                  Custom Tab Background Wallpapers
                </p>
                <p className="text-[11px] text-slate-400">
                  Set custom background images for each tab of your application (Work, Income, Chat, Expenses, Customise).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {TAB_WALLPAPERS.map(tab => {
                  const Icon = tab.icon;
                  const bgUrl = wallpapers[tab.key];

                  return (
                    <div key={tab.key} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-bold flex items-center gap-1.5", tab.color)}>
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </span>
                        {bgUrl && (
                          <button
                            type="button"
                            onClick={() => setWallpapers(prev => ({ ...prev, [tab.key]: '' }))}
                            className="text-[10px] text-rose-400 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className={cn(
                        "relative aspect-video rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center bg-slate-900",
                        bgUrl ? "border-transparent" : tab.border
                      )}>
                        {bgUrl ? (
                          <>
                            <img src={bgUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <label className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-bold cursor-pointer">
                                Change
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, tab.key)} 
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800/50 transition-colors">
                            <ImagePlus className="w-5 h-5 text-slate-500" />
                            <span className="text-[10px] text-slate-400 font-medium">Click to Upload Wallpaper</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, tab.key)} 
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: PREFERENCES & GDPR DATA PORTABILITY */}
          {activeSection === 'preferences' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Toggles */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">Shift Reminders &amp; Rota Notifications</p>
                      <p className="text-[11px] text-slate-400">Receive alert 1 hour before scheduled shift start</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">GPS On-Site Geofence Verification</p>
                      <p className="text-[11px] text-slate-400">Consent to capture distance from pinned venue at clock-in</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gpsConsent}
                      onChange={(e) => setGpsConsent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Worker Permission Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {allowEmployerEdit ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
                    <div>
                      <p className="text-xs font-bold text-slate-200">Allow Employer to Edit My Shifts</p>
                      <p className="text-[11px] text-slate-400">
                        {allowEmployerEdit ? 'Enabled: Employer can correct hours with full audit log' : 'Default Locked: Only you can modify logged shift hours'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowEmployerEdit}
                      onChange={(e) => setAllowEmployerEdit(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* GDPR Portability Box */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyan-400" />
                    GDPR Article 20: Personal Data Portability
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Download a copy of your complete shift history, selfies, wages earned, and profile metadata in machine-readable JSON format.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Download My Complete GDPR Shift History</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
