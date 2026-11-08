import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl, cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { 
  Footprints, 
  TrendingUp, 
  MessagesSquare, 
  Wallet, 
  Sparkles,
  Settings,
  User as UserIcon,
  FileSpreadsheet
} from 'lucide-react';

interface LayoutProps {
  children?: ReactNode;
  currentPageName: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const { user, settings, isLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState('Chat');

  const tabs = [
    { id: 'Work', icon: Footprints, page: 'Home' },
    { id: 'Income', icon: TrendingUp, page: 'Income' },
    { id: 'Chat', icon: MessagesSquare, page: 'Chat' },
    { id: 'Expenses', icon: Wallet, page: 'Expenses' },
    { id: 'Customise', icon: Sparkles, page: 'Customise' },
  ];

  useEffect(() => {
    const pageToTab: Record<string, string | null> = {
      'Home': 'Work',
      'Income': 'Income',
      'Chat': 'Chat',
      'Expenses': 'Expenses',
      'Customise': 'Customise',
      'Settings': null,
      'Profile': null,
    };
    if (pageToTab[currentPageName] !== undefined && pageToTab[currentPageName] !== null) {
      setActiveTab(pageToTab[currentPageName] as string);
    }
  }, [currentPageName]);

  const isDark = settings?.theme === 'dark' || (!settings && true);

  // Get wallpaper for current tab
  const getWallpaper = () => {
    const wallpaperMap: Record<string, any> = {
      'Home': settings?.wallpaper_work || settings?.wallpaper_home,
      'Income': settings?.wallpaper_income,
      'Chat': settings?.wallpaper_chat,
      'Expenses': settings?.wallpaper_expenses,
      'Customise': settings?.wallpaper_customise,
      'Settings': settings?.wallpaper_settings,
      'Profile': settings?.wallpaper_profile,
      'CompanyDetail': settings?.wallpaper_work || settings?.wallpaper_home,
    };
    return wallpaperMap[currentPageName] || null;
  };

  const currentWallpaper = getWallpaper();

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center bg-black"
      )}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col relative",
      isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Background Wallpaper */}
      {currentWallpaper && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${currentWallpaper})` }}
        >
          <div className={cn(
            "absolute inset-0",
            isDark ? "bg-black/70" : "bg-white/70"
          )} />
        </div>
      )}
      
      <style>{`
        :root {
          --bg-primary: ${isDark ? '#000000' : '#f9fafb'};
          --bg-secondary: ${isDark ? '#111111' : '#ffffff'};
          --bg-tertiary: ${isDark ? '#1a1a1a' : '#f3f4f6'};
          --text-primary: ${isDark ? '#ffffff' : '#111827'};
          --text-secondary: ${isDark ? '#9ca3af' : '#6b7280'};
          --border-color: ${isDark ? '#262626' : '#e5e7eb'};
          --accent: #8b5cf6;
          --accent-light: #a78bfa;
        }
      `}</style>

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 px-4 py-3 flex items-center justify-between relative",
        currentWallpaper 
          ? (isDark ? "bg-black/60 backdrop-blur-xl border-b border-white/5" : "bg-white/60 backdrop-blur-xl border-b border-gray-200")
          : (isDark ? "bg-black/90 backdrop-blur-xl border-b border-white/5" : "bg-white/90 backdrop-blur-xl border-b border-gray-200")
      )}>
        <div className="flex items-center gap-3">
                    <Link to={createPageUrl('Profile')}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center overflow-hidden">
                        {settings?.profile_picture ? (
                          <img src={settings.profile_picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </Link>
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      EnE
                    </span>
                  </div>

        <div className="flex items-center gap-2">
          <Link 
            to="/home?view=sheet"
            className={cn(
              "px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all border",
              currentPageName === 'Home' 
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-sm" 
                : isDark 
                  ? "bg-white/5 hover:bg-white/10 text-gray-300 border-white/5" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
            )}
            title="Open Job Hours & Payrate Worksheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Excel Sheet</span>
          </Link>

          <Link to={createPageUrl('Settings')}>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
            )}>
              <Settings className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24 relative z-10">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 pt-1",
        currentWallpaper
          ? (isDark ? "bg-black/60 backdrop-blur-xl border-t border-white/5" : "bg-white/60 backdrop-blur-xl border-t border-gray-200")
          : (isDark ? "bg-black/95 backdrop-blur-xl border-t border-white/5" : "bg-white/95 backdrop-blur-xl border-t border-gray-200")
      )}>
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={createPageUrl(tab.page)}
                className="flex flex-col items-center py-2 px-3 relative group"
                onClick={() => setActiveTab(tab.id)}
              >
                <div className={cn(
                  "relative p-2 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30" 
                    : isDark ? "bg-transparent group-hover:bg-white/5" : "bg-transparent group-hover:bg-gray-100"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium transition-colors",
                  isActive 
                    ? "text-violet-400" 
                    : isDark ? "text-gray-500" : "text-gray-400"
                )}>
                  {tab.id}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
