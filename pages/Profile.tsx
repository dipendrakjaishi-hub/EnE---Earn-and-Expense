import { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl, cn } from '../lib/utils';
import { ArrowLeft, Camera, User, Mail, FileText, Save, Footprints, TrendingUp, MessagesSquare, Wallet, Sparkles, ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { useCrewPulse } from '../context/CrewPulseContext';

const TAB_WALLPAPERS = [
  { key: 'wallpaper_work', label: 'Work', icon: Footprints, color: 'violet' },
  { key: 'wallpaper_income', label: 'Income', icon: TrendingUp, color: 'emerald' },
  { key: 'wallpaper_chat', label: 'Chat', icon: MessagesSquare, color: 'blue' },
  { key: 'wallpaper_expenses', label: 'Expenses', icon: Wallet, color: 'rose' },
  { key: 'wallpaper_customise', label: 'Customise', icon: Sparkles, color: 'amber' },
];

export default function Profile() {
  const { user, settings, refetchSettings, updateUser } = useAppContext();
  const { currentUser, updateProfile: updateCrewPulseProfile } = useCrewPulse();
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [wallpapers, setWallpapers] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingWallpaper, setUploadingWallpaper] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const isDark = settings?.theme === 'dark';

  useEffect(() => {
    if (settings) {
      setBio(settings.bio || '');
      setProfilePicture(settings.profile_picture || '');
      setWallpapers({
        wallpaper_work: settings.wallpaper_work || '',
        wallpaper_income: settings.wallpaper_income || '',
        wallpaper_chat: settings.wallpaper_chat || '',
        wallpaper_expenses: settings.wallpaper_expenses || '',
        wallpaper_customise: settings.wallpaper_customise || '',
      });
    }
  }, [settings]);

  const createMutation = useMutation({
    mutationFn: (data: any) => (base44.entities.UserSettings as any).create({
      ...data,
      created_by: user?.email
    }),
    onSuccess: () => {
      refetchSettings();
      toast.success('Profile created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => (base44.entities.UserSettings as any).update(id, data),
    onSuccess: () => {
      refetchSettings();
      toast.success('Profile updated');
    },
  });

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
        const { file_url } = await (base44.integrations.Core as any).UploadFile({ file });
        setProfilePicture(file_url);
        toast.success('Profile picture uploaded');
    } catch (err) {
        toast.error('Upload failed');
    } finally {
        setUploading(false);
    }
  };

  const handleWallpaperUpload = async (e: any, key: string) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingWallpaper(key);
    try {
        const { file_url } = await (base44.integrations.Core as any).UploadFile({ file });
        setWallpapers(prev => ({ ...prev, [key]: file_url }));
        toast.success('Wallpaper uploaded');
    } catch (err) {
        toast.error('Upload failed');
    } finally {
        setUploadingWallpaper(null);
    }
  };

  const removeWallpaper = (key: string) => {
    setWallpapers(prev => ({ ...prev, [key]: '' }));
  };

  const handleSave = () => {
    const data = { 
      bio, 
      profile_picture: profilePicture, 
      ...wallpapers 
    };
    
    // Update settings
    if (settings?.id) {
      updateMutation.mutate({ id: settings.id, data });
    } else {
      createMutation.mutate(data);
    }

    // Update user profile details
    updateUser({
      phone_number: phoneNumber,
      address: address,
      short_note: shortNote
    });

    if (updateCrewPulseProfile && currentUser) {
      updateCrewPulseProfile({
        full_name: user?.full_name || currentUser.full_name,
        phone: phoneNumber,
        phone_number: phoneNumber,
        address,
        short_note: shortNote,
        bio,
        avatar_url: profilePicture,
        wallpaper_work: wallpapers.wallpaper_work,
        wallpaper_income: wallpapers.wallpaper_income,
        wallpaper_chat: wallpapers.wallpaper_chat,
        wallpaper_expenses: wallpapers.wallpaper_expenses,
        wallpaper_customise: wallpapers.wallpaper_customise
      });
    }
  };

  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [shortNote, setShortNote] = useState('');

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phone_number || '');
      setAddress(user.address || '');
      setShortNote(user.short_note || '');
    }
  }, [user]);

  return (
    <div className={cn(
        "min-h-screen px-4 py-6 pb-32 transition-colors duration-300",
        isDark ? "bg-zinc-950 text-white" : "bg-gray-50 text-gray-900"
    )}>
      <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button size="icon" variant="ghost" className={cn(isDark ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-gray-500")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-inherit">Profile</h1>
              <p className={cn("text-xs font-medium uppercase tracking-widest mt-1 opacity-50")}>Your personal workspace</p>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-[4px] shadow-2xl shadow-violet-500/20">
                <div className={cn(
                    "w-full h-full rounded-full overflow-hidden flex items-center justify-center",
                    isDark ? "bg-zinc-900" : "bg-white"
                )}>
                  {profilePicture ? (
                    <img src={profilePicture} alt={user?.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-zinc-400/30" />
                  )}
                </div>
              </div>
              <label className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center cursor-pointer hover:bg-violet-500 transition-all shadow-xl hover:scale-110 active:scale-95 border-4 border-zinc-950">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className={cn(isDark ? "bg-zinc-900 border-white/5" : "bg-white border-gray-200")}>
              <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Name</p>
                    <p className="font-semibold text-lg">{user?.full_name || 'Not set'}</p>
                  </div>
              </CardContent>
            </Card>

            <Card className={cn(isDark ? "bg-zinc-900 border-white/5" : "bg-white border-gray-200")}>
              <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Email</p>
                    <p className="font-semibold">{user?.email || 'Not set'}</p>
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Details */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-40 px-1 text-inherit">Phone Number</Label>
                    <input 
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 234 567 890"
                      className={cn(
                        "w-full h-12 px-4 rounded-2xl outline-none border focus:ring-2 focus:ring-violet-500/30 transition-all",
                        isDark ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-gray-200"
                      )}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest opacity-40 px-1 text-inherit">Address</Label>
                    <input 
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, City, Country"
                      className={cn(
                        "w-full h-12 px-4 rounded-2xl outline-none border focus:ring-2 focus:ring-violet-500/30 transition-all",
                        isDark ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-gray-200"
                      )}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-40 px-1 text-inherit">Professional Note (Visible to employer)</Label>
                <Textarea 
                  value={shortNote}
                  onChange={(e) => setShortNote(e.target.value)}
                  placeholder="Tell companies a bit about yourself..."
                  className={cn(
                    "min-h-[100px] rounded-2xl p-4 border outline-none focus:ring-2 focus:ring-violet-500/30 transition-all",
                    isDark ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-gray-200"
                  )}
                />
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2 mb-3 px-1 text-inherit">
              <FileText className="w-3 h-3" />
              Private Notes (Internal AI use)
            </Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What's on your mind? This will be used by the AI assistant but is private to you."
              className={cn(
                  "border-white/10 text-white placeholder:text-zinc-600 h-32 rounded-3xl p-5 leading-relaxed",
                  isDark ? "bg-zinc-900" : "bg-white text-gray-900"
              )}
            />
          </div>

          {/* Tab Wallpapers */}
          <div className="mb-10">
            <Label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2 mb-3 px-1 text-inherit">
              <ImagePlus className="w-3 h-3" />
              Custom Wallpapers
            </Label>
            <p className={cn("text-xs opacity-50 mb-5 px-1")}>Personalize each tab with a unique background image.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {TAB_WALLPAPERS.map((tab) => {
                const Icon = tab.icon;
                const wallpaperUrl = wallpapers[tab.key];
                const isUploading = uploadingWallpaper === tab.key;
                
                return (
                  <div key={tab.key} className="relative group">
                    <label className={cn(
                        "block aspect-[4/3] rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden transition-all relative",
                        wallpaperUrl ? 'border-transparent' : isDark ? "border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-violet-500/30" : "border-gray-200 bg-gray-100 hover:bg-gray-200"
                    )}>
                      {wallpaperUrl ? (
                        <div className="relative w-full h-full">
                          <img src={wallpaperUrl} alt={tab.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-2 text-center">
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin opacity-50" />
                          ) : (
                            <>
                              <Icon className={cn("w-6 h-6 opacity-40", `text-${tab.color}-500`)} />
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{tab.label}</span>
                            </>
                          )}
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleWallpaperUpload(e, tab.key)} 
                        disabled={isUploading}
                      />
                    </label>
                    {wallpaperUrl && (
                      <button
                        onClick={() => removeWallpaper(tab.key)}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg hover:scale-110 active:scale-95 border-2 border-zinc-950"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full bg-violet-600 hover:bg-violet-500 h-14 rounded-3xl text-lg font-semibold shadow-xl shadow-violet-500/20" 
            disabled={updateMutation.isPending || createMutation.isPending}
          >
            {updateMutation.isPending || createMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
                <Save className="w-5 h-5 mr-3" />
            )}
            Save Profile
          </Button>
      </div>
    </div>
  );
}
