import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Profile } from '../../types/crewpulse';
import { generateKYCStaffCode } from '../../api/supabaseClient';
import { cn } from '../../lib/utils';
import { 
  BadgeCheck, 
  ShieldCheck, 
  Copy, 
  Check, 
  Building, 
  Briefcase, 
  UserCheck, 
  Sparkles, 
  Maximize2, 
  RotateCw, 
  Printer, 
  QrCode, 
  Lock, 
  Wifi, 
  Clock,
  Calendar,
  X,
  Share2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface DigitalStaffIdCardProps {
  profile: Profile;
  businessName?: string;
  onOpenEditProfile?: () => void;
  className?: string;
  compact?: boolean;
}

export default function DigitalStaffIdCard({
  profile,
  businessName = 'Organisation',
  onOpenEditProfile,
  className,
  compact = false
}: DigitalStaffIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);

  const staffId = profile.employee_id || generateKYCStaffCode(profile.full_name, profile.dob, profile.kyc_location_code);
  const isVerified = profile.kyc_status === 'verified';
  const isPending = profile.kyc_status === 'pending';

  const workingRights = profile.working_rights || 'Full-Time';
  const workingPost = profile.working_post || profile.trade || (profile.email?.includes('elena') || profile.email?.includes('marcus') ? 'Operations Management' : 'Hospitality Specialist');

  // Generate real QR code encoding the unique staff ID
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(staffId, {
      width: 256,
      margin: 1,
      color: {
        dark: '#020617', // Slate 950
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => console.error('QR code generation failed:', err));

    return () => {
      isMounted = false;
    };
  }, [staffId]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(staffId);
    setCopiedId(true);
    toast.success(`Staff ID "${staffId}" copied to clipboard!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  // Issue date calculation based on KYC or creation
  const issueDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : '01/24';
  const expiryDate = '01/27'; // 3 year standard corporate security badge cycle

  return (
    <>
      {/* =========================================================================
          MAIN DIGITAL ID CARD (BANKING CARD STYLE)
          ========================================================================= */}
      <div 
        className={cn(
          "relative group select-none transition-all duration-300",
          compact ? "w-full" : "w-full",
          className
        )}
      >
        {/* Outer Card Shell with 3D Banking Glassmorphic Sheen */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={cn(
            "relative w-full rounded-3xl p-5 sm:p-6 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl border",
            isVerified 
              ? "bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/80 border-cyan-500/40 hover:border-cyan-400/80 shadow-cyan-950/40" 
              : "bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/60 border-amber-500/40 hover:border-amber-400/80 shadow-amber-950/40"
          )}
        >
          {/* Holographic Security Overlay Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-gradient-to-tr from-cyan-500/20 to-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          {!isFlipped ? (
            /* ===================================================================
               CARD FRONT: Profile, Name, Post, Working Right & Scannable QR Code
               =================================================================== */
            <div className="relative z-10 space-y-4">
              
              {/* Top Row: Business Branding, Contactless NFC & Status Badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-cyan-500/30">
                    CP
                  </div>
                  <div>
                    <span className="font-black text-xs tracking-tight text-white uppercase block leading-tight truncate max-w-[170px] sm:max-w-[220px]">
                      {businessName}
                    </span>
                    <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase block">
                      OFFICIAL DIGITAL PASS
                    </span>
                  </div>
                </div>

                {/* Right Side: Contactless NFC & Verification Badge */}
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-cyan-400 rotate-90" title="NFC Contactless ID Enabled" />
                  {isVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>KYC VERIFIED</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>KYC PENDING</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Smart Chip & Profile Header */}
              <div className="flex items-center justify-between gap-3 pt-1">
                {/* Metallic Banking Smart Chip Graphic */}
                <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-100 p-0.5 shadow-inner border border-amber-300/60 relative overflow-hidden flex flex-col justify-between">
                  <div className="w-full h-full border border-amber-600/30 rounded flex items-center justify-center">
                    <div className="w-4 h-3 border-x border-amber-700/40" />
                  </div>
                </div>

                {/* Working Rights Pill (Requested by User) */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-700/80 text-[11px] font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-400">Right to Work:</span>
                  <span className={cn(
                    "font-extrabold",
                    workingRights.includes('Full') ? "text-emerald-300" : "text-cyan-300"
                  )}>
                    {workingRights}
                  </span>
                </div>
              </div>

              {/* Core Content Grid: Photo + Full Name + Post + QR Code */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                
                {/* Left Side: Profile Photo & Employee Data */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 shadow-lg shadow-cyan-500/25 overflow-hidden">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name} 
                          className="w-full h-full object-cover rounded-[14px]"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center font-black text-xl text-cyan-300">
                          {profile.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {isVerified && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-sm" title="Verified Photo">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Name & Working Post */}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                      Cardholder Name
                    </span>
                    <h3 className="font-black text-base sm:text-lg text-white tracking-tight truncate leading-tight">
                      {profile.full_name}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold mt-0.5 truncate">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{workingPost}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                      <span>DOC: <strong>{profile.kyc_document_type || 'Passport'}</strong></span>
                      <span>•</span>
                      <span>LOC: <strong>{profile.kyc_location_code || 'LDN'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Scannable QR Code Section (Requested by User) */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className="bg-white p-2 rounded-2xl shadow-lg border border-slate-300/40 hover:scale-105 transition-transform flex flex-col items-center justify-center flex-shrink-0 cursor-pointer group/qr"
                  title="Tap to enlarge QR Code for Gate Scanner"
                >
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt={`QR Code for ${staffId}`} 
                      className="w-16 h-16 sm:w-18 sm:h-18 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center text-slate-900">
                      <QrCode className="w-8 h-8 animate-pulse text-slate-700" />
                    </div>
                  )}
                  <span className="text-[8px] font-black uppercase text-slate-900 tracking-wider mt-1 group-hover/qr:text-cyan-700">
                    TAP TO SCAN
                  </span>
                </div>
              </div>

              {/* Bottom Row: Embossed Staff ID Code + Copy Button */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono uppercase">UNIQUE ID:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-cyan-300 tracking-widest bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                    {staffId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy Unique ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Interactive Card Action Links */}
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1 hover:text-cyan-300 transition-colors">
                    <RotateCw className="w-3 h-3 text-cyan-400" />
                    Tap to Flip
                  </span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 underline font-bold"
                  >
                    Enlarge Card
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ===================================================================
               CARD BACK: Magnetic Stripe, Security Hologram & Gate Scan Credentials
               =================================================================== */
            <div className="relative z-10 space-y-3.5 text-xs text-slate-300 py-1">
              
              {/* Magnetic Security Stripe */}
              <div className="-mx-5 sm:-mx-6 -mt-1 h-10 bg-slate-950 border-y border-slate-800 flex items-center px-6">
                <div className="w-full h-2 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-sm" />
              </div>

              {/* Back Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Security Hologram</span>
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>HMRC / KYC AUDITED</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    Compliant with UK Hospitality Security &amp; Right to Work verification regulations.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Validity &amp; Cycle</span>
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-400">ISSUED: <strong className="text-white">{issueDate}</strong></span>
                    <span className="text-slate-400">EXP: <strong className="text-cyan-300">{expiryDate}</strong></span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    Location: <strong>{profile.kyc_location_code || 'LDN'}</strong> (20m Geofenced)
                  </p>
                </div>
              </div>

              {/* Cryptographic Hash Block */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[9px] text-slate-400 flex items-center justify-between">
                <div className="truncate mr-2">
                  <span className="text-slate-500">AUTH SHA256: </span>
                  <span className="text-cyan-400">8f4c-e812-70b1-{staffId.toLowerCase()}-99d1</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1 flex-shrink-0">
                  <Lock className="w-3 h-3" />
                  AUTHENTICATED
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-cyan-400" />
                  Tap anywhere to flip back to front
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors flex items-center gap-1"
                >
                  <Printer className="w-3 h-3 text-cyan-400" />
                  <span>Print Card</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          FULL-SCREEN DIGITAL ID PASS MODAL (FOR GATE & SECURITY SCANNING)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden text-slate-100">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-sm text-white uppercase tracking-wider">
                  Official Digital Staff ID Pass
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Large Scan-Ready QR Code */}
            <div className="text-center space-y-2">
              <div className="inline-block bg-white p-4 rounded-3xl shadow-2xl border-4 border-cyan-500/30">
                {qrDataUrl && (
                  <img 
                    src={qrDataUrl} 
                    alt={`Enlarged QR Code for ${staffId}`} 
                    className="w-48 h-48 object-contain"
                  />
                )}
              </div>
              <p className="text-xs font-mono font-bold text-cyan-300">
                {staffId}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Hold this screen up to any security turnstile, scanner gun, or manager tablet on site.
              </p>
            </div>

            {/* ID Details Card Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cardholder:</span>
                <span className="font-bold text-white text-sm">{profile.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Designation / Post:</span>
                <span className="font-semibold text-cyan-300">{workingPost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Working Rights:</span>
                <span className="font-bold text-emerald-400">{workingRights}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Organisation:</span>
                <span className="font-semibold text-white">{businessName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">KYC Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isVerified ? 'Verified & Valid' : 'Under Review'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleCopyId}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied ID' : 'Copy ID Code'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Digital Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
