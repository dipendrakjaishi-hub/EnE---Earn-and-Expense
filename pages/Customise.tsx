import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Image, Moon, Sun, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '../api/base44Client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function Customise() {
  const { settings, updateSettings } = useAppContext();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const isDark = settings?.theme === 'dark';

  const wallpapers = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop', // Office
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070&auto=format&fit=crop', // Money
    'https://images.unsplash.com/photo-1526304640152-d4619684e484?q=80&w=2070&auto=format&fit=crop', // Abstract Chart
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2071&auto=format&fit=crop', // Calculator/Finance
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop', // Landscape
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop', // Abstract Dark
  ];

  const handleThemeToggle = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const handleWallpaperChange = (url: string, key: string) => {
      updateSettings({ [key]: url });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKey(key);
    try {
      const { file_url } = await (base44.integrations.Core as any).UploadFile({ file });
      updateSettings({ [key]: file_url });
      toast.success('Custom wallpaper uploaded!');
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemoveWallpaper = (key: string) => {
    updateSettings({ [key]: '' });
    toast.success('Wallpaper removed');
  };

  const sections = [
    { key: 'wallpaper_work', label: 'Work' },
    { key: 'wallpaper_income', label: 'Income' },
    { key: 'wallpaper_chat', label: 'Chat' },
    { key: 'wallpaper_expenses', label: 'Expenses' },
    { key: 'wallpaper_customise', label: 'Customise' },
  ];

  return (
    <Layout currentPageName="Customise">
      <div className="p-6 max-w-4xl mx-auto space-y-12 pb-32">
        
        {/* Theme Toggle */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-[32px] border transition-all",
            isDark ? "bg-black/40 border-white/10 backdrop-blur-md" : "bg-white border-gray-100 shadow-sm"
          )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                        {isDark ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className={cn("text-lg font-black uppercase tracking-tight", isDark ? "text-white" : "text-gray-900")}>App Appearance</h2>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40")}>Personalize your visual experience</p>
                    </div>
                </div>
                <button 
                    onClick={handleThemeToggle}
                    className={cn(
                        "px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95",
                        isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
                    )}
                >
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </motion.section>

        {/* Wallpaper Sections */}
        <div className="space-y-10">
          <div className="flex items-center gap-3 mb-2 px-1">
             <Image className="w-5 h-5 text-violet-500" />
             <h2 className={cn("text-xl font-black uppercase tracking-tighter", isDark ? "text-white" : "text-gray-900")}>Tab Wallpapers</h2>
          </div>

          {sections.map((section, sectionIdx) => {
              const currentWallpaper = (settings as any)?.[section.key];
              const isUploading = uploadingKey === section.key;

              return (
                  <motion.section 
                    key={section.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sectionIdx * 0.05 }}
                    className="space-y-4"
                  >
                      <div className="flex items-center justify-between px-1">
                        <h3 className={cn("text-xs font-black uppercase tracking-widest opacity-60", isDark ? "text-white" : "text-gray-900")}>
                            {section.label} Background
                        </h3>
                        {currentWallpaper && (
                          <button 
                            onClick={() => handleRemoveWallpaper(section.key)}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                          >
                             <X className="w-3 h-3" /> Remove Custom
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                          {/* Upload Option */}
                          <label className={cn(
                              "relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95",
                              isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                          )}>
                              {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-violet-500 mb-2" />
                                  <span className="text-[8px] font-black uppercase tracking-widest text-center px-2">Upload Custom</span>
                                </>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(e, section.key)}
                                disabled={isUploading}
                              />
                          </label>

                          {/* Default Presets */}
                          {wallpapers.map((url, idx) => (
                              <button
                                  key={idx}
                                  onClick={() => handleWallpaperChange(url, section.key)}
                                  className={cn(
                                      "relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 group",
                                      currentWallpaper === url ? "border-violet-500 ring-4 ring-violet-500/20" : "border-transparent"
                                  )}
                              >
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  <div className={cn(
                                    "absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center",
                                    currentWallpaper === url ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  )}>
                                     {currentWallpaper === url ? <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" /> : <Sparkles className="w-4 h-4 text-white" />}
                                  </div>
                              </button>
                          ))}
                          
                          {/* Display Custom if uploaded but not in presets */}
                          {currentWallpaper && !wallpapers.includes(currentWallpaper) && (
                            <button
                              className={cn(
                                  "relative aspect-video sm:aspect-square rounded-2xl overflow-hidden border-2 transition-all border-violet-500 ring-4 ring-violet-500/20"
                              )}
                            >
                                <img src={currentWallpaper} alt="Custom" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                   <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                                </div>
                            </button>
                          )}
                      </div>
                  </motion.section>
              );
          })}
        </div>

      </div>
    </Layout>
  );
}