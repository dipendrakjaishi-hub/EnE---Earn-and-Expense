import { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl, cn } from '../lib/utils';
import {
  Bell,
  Globe,
  Palette,
  Smartphone,
  ShieldCheck,
  Moon,
  Sun,
  Eye,
  Settings2,
  Trash2,
  Coins,
  Loader2,
  ExternalLink,
  Sparkles,
  Info,
  Check,
  ToggleLeft,
  ChevronRight,
  ArrowLeft,
  Building2,
  Clock,
  FileText,
  Shield,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CurrencyExchange from '../components/settings/CurrencyExchange';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { Company } from '../types';

export default function Settings() {
  const { user, settings, updateSettings } = useAppContext();
  const [showWorklogSettings, setShowWorklogSettings] = useState(false);
  const [showCurrencyExchange, setShowCurrencyExchange] = useState(false);

  const isDark = settings?.theme === 'dark';

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies', user?.email],
    queryFn: async () => {
      return await (base44.entities.Company as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    base44.auth.logout();
    window.location.href = '/';
  };

  const categories = [
    {
      name: 'Work & Finance',
      items: [
        {
          icon: Building2,
          title: 'Worklog Infrastructure',
          description: 'Manage rates, overtime & companies',
          color: 'violet',
          onClick: () => setShowWorklogSettings(true),
          status: companies.length > 0 ? `${companies.length} Active` : 'Start Here',
          badgeColor: companies.length > 0 ? 'emerald' : 'violet',
        },
        {
          icon: Coins,
          title: 'Currency Hub',
          description: 'Real-time rates & global tools',
          color: 'emerald',
          onClick: () => setShowCurrencyExchange(true),
          status: 'Live',
          badgeColor: 'emerald',
        },
      ]
    },
    {
      name: 'Appearance & Privacy',
      items: [
        {
          icon: ShieldCheck,
          title: 'Data Protection',
          description: 'Encryption & privacy protocols',
          color: 'blue',
          onClick: () => toast.info('Privacy settings coming soon'),
          status: settings?.encryption_enabled ? 'Active' : 'Basic',
          badgeColor: settings?.encryption_enabled ? 'emerald' : 'zinc',
        },
        {
          icon: Palette,
          title: 'UI Customisation',
          description: 'Wallpapers, fonts & themes',
          color: 'pink',
          onClick: () => window.location.href = '#/customise',
          status: 'Enhanced',
          badgeColor: 'pink',
        },
      ]
    },
    {
      name: 'System & Support',
      items: [
        {
          icon: FileText,
          title: 'Audit Logs & Export',
          description: 'CSV, PDF & JSON data exports',
          color: 'indigo',
          onClick: () => toast.info('Export feature coming soon'),
          status: 'Ready',
          badgeColor: 'zinc',
        },
        {
          icon: HelpCircle,
          title: 'Knowledge Base',
          description: 'FAQs & direct human assistance',
          color: 'slate',
          onClick: () => toast.info('Help center is offline'),
        },
      ]
    }
  ];

  return (
    <div className={cn(
        "min-h-screen px-4 py-8 pb-32 transition-colors duration-500",
        isDark ? "bg-zinc-950 text-white" : "bg-gray-50 text-gray-900"
    )}>
      <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-10"
          >
            <Link to="/chat">
              <Button size="icon" variant="ghost" className="rounded-full hover:bg-violet-500/10 hover:text-violet-500 transition-all duration-300">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight">System Configuration</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5">
                   {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 rounded-full bg-violet-600/30" />)}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Operational Node Alpha</p>
              </div>
            </div>
            <div className="ml-auto">
                 <Link to="/profile">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-600/20",
                        "border-2 border-white/10"
                      )}
                    >
                      {user?.full_name?.[0] || 'U'}
                    </motion.div>
                 </Link>
            </div>
          </motion.div>

          {/* Quick Settings Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-14"
          >
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex items-center gap-2">
                 <Settings2 className="w-4 h-4 text-violet-500" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Core Quick Toggles</h2>
              </div>
              <Sparkles className="w-3 h-3 text-amber-500 opacity-30" />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Theme', icon: isDark ? Moon : Sun, active: isDark, onClick: () => updateSettings({ theme: isDark ? 'light' : 'dark' }), color: 'violet' },
                { label: 'Alerts', icon: Bell, active: settings?.notifications_enabled, onClick: () => updateSettings({ notifications_enabled: !settings?.notifications_enabled }), color: 'emerald' },
                { label: 'Security', icon: ShieldCheck, active: settings?.encryption_enabled, onClick: () => updateSettings({ encryption_enabled: !settings?.encryption_enabled }), color: 'blue' },
                { label: 'Cloud', icon: Globe, active: true, onClick: () => toast.success('Sync active'), color: 'amber' },
              ].map((toggle, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggle.onClick}
                  className={cn(
                    "p-4 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden",
                    toggle.active 
                      ? (isDark ? `bg-${toggle.color}-500/10 border-${toggle.color}-500/40 text-${toggle.color}-400` : `bg-${toggle.color}-50 border-${toggle.color}-200 text-${toggle.color}-600`)
                      : (isDark ? "bg-white/5 border-white/5 text-zinc-500" : "bg-white border-gray-100 text-gray-400")
                  )}
                >
                  <toggle.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", toggle.active ? "opacity-100" : "opacity-40")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{toggle.label}</span>
                  {toggle.active && <div className={cn("absolute top-2 right-2 w-1.5 h-1.5 rounded-full", isDark ? `bg-${toggle.color}-400` : `bg-${toggle.color}-500`)} />}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* User Profile Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-14"
          >
            <Card className={cn(
               "overflow-hidden relative group border-2",
               isDark ? "bg-zinc-900 border-white/5 shadow-2xl shadow-violet-900/10" : "bg-white border-gray-100 shadow-xl shadow-gray-200/50"
            )}>
              <CardContent className="p-0">
                <div className="p-6 flex items-center gap-6">
                   <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:rotate-3 transition-transform duration-500">
                         {settings?.profile_picture ? (
                           <img src={settings.profile_picture} alt="" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-black">
                               {user?.full_name?.[0] || 'U'}
                            </div>
                         )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black tracking-tight truncate">{user?.full_name || 'System Operator'}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4">{user?.email}</p>
                      <div className="flex gap-2">
                         <Link to="/profile">
                            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black px-5 h-9 shadow-lg shadow-violet-500/20 active:scale-95 transition-all">
                               Edit Profile
                            </Button>
                         </Link>
                         <Button variant="outline" size="sm" className={cn(
                            "rounded-xl font-black h-9 text-[10px] uppercase tracking-widest",
                            isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 hover:bg-gray-50"
                         )}>
                            Settings Mode: Full
                         </Button>
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Grouped Settings List */}
          <div className="space-y-12">
            {categories.map((cat, catIdx) => (
              <motion.section 
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + (catIdx * 0.1) }}
              >
                <div className="flex items-center gap-4 mb-6 px-1">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 whitespace-nowrap">
                     {cat.name}
                   </h2>
                   <div className="flex-1 h-[1px] bg-current opacity-10" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cat.items.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -6, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-all border-2 relative overflow-hidden group h-full",
                            isDark 
                              ? "bg-zinc-900 border-white/5 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-900/10" 
                              : "bg-white border-transparent hover:border-violet-500/20 shadow-lg shadow-gray-200/40 hover:shadow-2xl"
                          )}
                          onClick={item.onClick}
                        >
                          <CardContent className="p-6 flex flex-col items-start gap-4 h-full relative z-10">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6", 
                              `bg-${item.color}-500/10`
                            )}>
                                <Icon className={cn("w-6 h-6", `text-${item.color}-500`)} />
                            </div>
                            <div className="flex-1 w-full">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="font-black text-sm tracking-tight leading-tight">{item.title}</h3>
                                  {item.status && (
                                    <span className={cn(
                                      "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg shrink-0",
                                      item.badgeColor === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                                      item.badgeColor === 'pink' ? "bg-pink-500/10 text-pink-500" :
                                      item.badgeColor === 'amber' ? "bg-amber-500/10 text-amber-500" :
                                      item.badgeColor === 'blue' ? "bg-blue-500/10 text-blue-500" :
                                      item.badgeColor === 'violet' ? "bg-violet-500/10 text-violet-500" :
                                      "bg-zinc-500/10 text-zinc-500"
                                    )}>
                                      {item.status}
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-500 text-[10px] leading-relaxed font-bold tracking-tight opacity-50 line-clamp-2">
                                  {item.description}
                                </p>
                            </div>
                            <div className="w-full pt-4 mt-auto border-t border-current opacity-5 flex items-center justify-between">
                               <div className="flex gap-1">
                                  {[1, 2].map(d => <div key={d} className="w-4 h-1 rounded-full bg-current opacity-20" />)}
                               </div>
                               <ChevronRight className="w-4 h-4 text-zinc-600 transition-all duration-300 group-hover:translate-x-2" />
                            </div>
                          </CardContent>
                          
                          {/* Background Glow */}
                          <div className={cn(
                             "absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-700",
                             `bg-${item.color}-500`
                          )} />
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Footer Actions */}
          <motion.footer 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 pt-12 border-t border-current opacity-10"
          >
            <div className="flex flex-col items-center gap-8">
              <Button
                  onClick={handleLogout}
                  variant="outline"
                  className={cn(
                    "w-full max-w-sm h-16 rounded-[2rem] text-lg font-black transition-all border-2 group",
                    isDark ? "bg-rose-500/5 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-white border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white shadow-lg shadow-rose-500/5"
                  )}
              >
                  <LogOut className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-1" />
                  Deauthenticate Session
              </Button>
              <div className="text-center opacity-40 space-y-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.6em]">System Version 1.4.0-STABLE</p>
                  <div className="flex justify-center items-center gap-3">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <p className="text-[7px] font-bold italic">Node {user?.id?.slice(0, 8)} active and encrypted</p>
                  </div>
              </div>
            </div>
          </motion.footer>
      </div>

      {/* Modals remain the same but wrapped in AnimatePresence if needed, but Dialog handles its own */}

      {/* Worklog Settings Modal */}
      <WorklogSettingsModal
        open={showWorklogSettings}
        onClose={() => setShowWorklogSettings(false)}
        companies={companies}
        isDark={isDark}
      />

      {/* Currency Exchange Modal */}
      <Dialog open={showCurrencyExchange} onOpenChange={setShowCurrencyExchange}>
        <DialogContent className={cn(
            "border-white/10 max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl p-6",
            isDark ? "bg-zinc-950 text-white" : "bg-white text-gray-900"
        )}>
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Coins className="w-6 h-6 text-emerald-500" />
              </div>
              Currency Hub
            </DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium">
              Real-time exchange rates powered by Global Finance
            </DialogDescription>
          </DialogHeader>
          <CurrencyExchange />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorklogSettingsModal({ open, onClose, companies, isDark }: any) {
  const queryClient = useQueryClient();
  const { user } = useAppContext();
  const [newCompanyName, setNewCompanyName] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => (base44.entities.Company as any).create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deployed successfully');
      setNewCompanyName('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => (base44.entities.Company as any).update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => (base44.entities.Company as any).delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
          "border-white/10 max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] p-0 outline-none",
          isDark ? "bg-zinc-950 text-zinc-100" : "bg-white text-gray-900"
      )}>
        <div className="p-8 pb-4">
          <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tight">
            <div className="w-14 h-14 rounded-3xl bg-violet-500/10 flex items-center justify-center border-2 border-violet-500/20">
              <Building2 className="w-8 h-8 text-violet-500" />
            </div>
            Company Hub
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-bold mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Manage base rates, currency and overtime rules
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar">
          {/* New Company Input Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-4 border-b border-white/5"
          >
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Deploy New Work Infrastructure</Label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter company name..."
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className={cn(
                      "rounded-2xl h-14 font-black text-lg px-5 border-2 transition-all",
                      isDark ? "bg-zinc-800 border-white/5 focus:border-violet-500/50" : "bg-white border-gray-200"
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const handleAddCompany = () => {
                          if (!newCompanyName.trim()) {
                            toast.error('Entity name required');
                            return;
                          }
                          createMutation.mutate({
                            name: newCompanyName.trim(),
                            created_by: user?.email,
                            hourly_rate: 15,
                            currency: 'GBP',
                            color: '#8b5cf6',
                            overtime_rate: 1.5,
                            overtime_start_hours: 8,
                            is_active: true
                          });
                        };
                        handleAddCompany();
                      }
                    }}
                  />
                  <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                </div>
                <Button 
                  onClick={() => {
                    if (!newCompanyName.trim()) {
                      toast.error('Entity name required');
                      return;
                    }
                    createMutation.mutate({
                      name: newCompanyName.trim(),
                      created_by: user?.email,
                      hourly_rate: 15,
                      currency: 'GBP',
                      color: '#8b5cf6',
                      overtime_rate: 1.5,
                      overtime_start_hours: 8,
                      is_active: true
                    });
                  }}
                  disabled={createMutation.isPending}
                  className="h-14 w-14 rounded-2xl bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                >
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </motion.div>

          {companies.length === 0 ? (
            <div className="text-center py-20 opacity-30 space-y-4">
                <Building2 className="w-16 h-16 mx-auto stroke-[1]" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">No infrastructure detected</p>
            </div>
          ) : (
            companies.map((company: any) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={company.id}
              >
                <Card className={cn(
                  "overflow-hidden border-2 transition-all group",
                  isDark ? "bg-zinc-900 border-white/5 hover:border-violet-500/30" : "bg-gray-50 border-gray-100 shadow-sm"
                )}>
                  <CardContent className="p-0">
                    <div className="p-6 border-b border-current opacity-10 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: (company.color || '#8b5cf6') + '15' }}
                      >
                        <Building2 className="w-6 h-6" style={{ color: company.color || '#8b5cf6' }} />
                      </div>
                      <div className="flex-1">
                          <h4 className="font-black text-xl">{company.name}</h4>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40">NODE_ID: {company.id.slice(0, 12)}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Verify Termination: Are you sure you want to delete this company? Linked logs will persist.')) {
                            deleteMutation.mutate(company.id);
                          }
                        }}
                        className="h-10 w-10 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="p-6 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Base Hourly Rate</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={company.hourly_rate || ''}
                              onChange={(e) =>
                                updateMutation.mutate({
                                  id: company.id,
                                  data: { hourly_rate: parseFloat(e.target.value) || 0 },
                                })
                              }
                              className={cn(
                                "rounded-2xl h-14 font-black text-lg px-5 border-2 transition-all",
                                isDark ? "bg-zinc-800 border-white/5 focus:border-violet-500/50" : "bg-white border-gray-200"
                              )}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 font-black">/HR</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Asset Currency</Label>
                          <Select
                            value={company.currency || 'GBP'}
                            onValueChange={(v: string) =>
                              updateMutation.mutate({ id: company.id, data: { currency: v } })
                            }
                          >
                            <SelectTrigger className={cn(
                                  "rounded-2xl h-14 font-black text-lg px-5 border-2 transition-all",
                                  isDark ? "bg-zinc-800 border-white/5" : "bg-white border-gray-200"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={cn(isDark ? "bg-zinc-900 border-white/10" : "bg-white")}>
                              {['GBP', 'USD', 'EUR', 'INR', 'AUD', 'CAD'].map((c) => (
                                <SelectItem key={c} value={c} className="font-black">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">OT Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={company.overtime_rate || 1.5}
                            onChange={(e) =>
                              updateMutation.mutate({
                                id: company.id,
                                data: { overtime_rate: parseFloat(e.target.value) || 1.5 },
                              })
                            }
                            className={cn(
                              "rounded-2xl h-14 font-black text-lg px-5 border-2 transition-all",
                              isDark ? "bg-zinc-800 border-white/5 focus:border-violet-500/50" : "bg-white border-gray-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-1">Daily Cap (Hrs)</Label>
                          <Input
                            type="number"
                            value={company.overtime_start_hours || 8}
                            onChange={(e) =>
                              updateMutation.mutate({
                                id: company.id,
                                data: { overtime_start_hours: parseFloat(e.target.value) || 8 },
                              })
                            }
                            className={cn(
                              "rounded-2xl h-14 font-black text-lg px-5 border-2 transition-all",
                              isDark ? "bg-zinc-800 border-white/5 focus:border-violet-500/50" : "bg-white border-gray-200"
                            )}
                          />
                        </div>
                      </div>

                      <div className={cn(
                          "flex items-center justify-between p-5 rounded-3xl border-2 transition-all duration-300",
                          isDark 
                            ? (company.is_active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-800/50 border-white/5") 
                            : (company.is_active ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100")
                      )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center",
                              company.is_active ? "bg-emerald-500 text-white" : "bg-zinc-500/20 text-zinc-500"
                            )}>
                              {company.is_active ? <Check className="w-6 h-6" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                                <Label className="text-sm font-black uppercase tracking-wider block">Operational Status</Label>
                                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{company.is_active ? 'Online / Active' : 'Offline / Inactive'}</p>
                            </div>
                        </div>
                        <Switch
                          checked={company.is_active ?? true}
                          onCheckedChange={(v) =>
                            updateMutation.mutate({ id: company.id, data: { is_active: v } })
                          }
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-8 bg-zinc-950/50 border-t border-white/5 backdrop-blur-xl">
             <Button onClick={onClose} className="w-full bg-violet-600 hover:bg-violet-500 h-16 rounded-3xl text-xl font-black shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all active:scale-95">
                Apply System Changes
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
