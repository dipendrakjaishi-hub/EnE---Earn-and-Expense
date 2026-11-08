import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { cn, formatCurrency } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, Bot, User as UserIcon, Loader2, Sparkles, Paperclip, 
  Search, ChevronLeft, MoreVertical, CheckCheck, Share2, 
  Users, Calendar, Clock, Download, Plus, Trash2, Mail
} from 'lucide-react';
import { ChatMessage as MessageType, WorkShift, Expense, ChatRoom, TrustedPerson } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Chat() {
  const { user, settings } = useAppContext();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | 'ai' | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'messages' | 'circle'>('messages');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isShareHubOpen, setIsShareHubOpen] = useState(false);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [reportRange, setReportRange] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly');

  const isDark = settings?.theme === 'dark';

  // Fetch Rooms (Companies act as group chats)
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['companies', user?.email],
    queryFn: async () => {
      return await (base44.entities.Company as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  const chatRooms: ChatRoom[] = companies.map(c => ({
      id: c.id,
      name: c.name,
      members: [user?.email || ''],
      type: 'group',
      created_by: c.created_by
  }));

  // AI Assistant Messages (Local or kept in UserSettings/Chat entity)
  const [aiMessages, setAiMessages] = useState<any[]>([
    { id: 'ai-0', role: 'model', text: 'Hello! I am your personal financial AI assistant. How can I help you with your reports or complaints today?', timestamp: Date.now() }
  ]);

  // Messages for selected room
  const { data: messages = [] } = useQuery<MessageType[]>({
    queryKey: ['chatMessages', (selectedRoom as ChatRoom)?.id],
    queryFn: async () => {
      if (!selectedRoom || selectedRoom === 'ai') return [];
      return await (base44.entities.ChatMessage as any).list({
        q: JSON.stringify({ group_id: (selectedRoom as ChatRoom).id }),
        sort_by: 'created_date'
      });
    },
    enabled: !!selectedRoom && selectedRoom !== 'ai'
  });

  // Fetch Trusted Circle
  const { data: trustedCircle = [] } = useQuery<TrustedPerson[]>({
    queryKey: ['trustedCircle', user?.email],
    queryFn: async () => {
      return await (base44.entities.TrustedPerson as any).list({
        q: JSON.stringify({ created_by: user?.email })
      });
    },
    enabled: !!user
  });

  const addTrustedPersonMutation = useMutation({
    mutationFn: (data: any) => (base44.entities.TrustedPerson as any).create({ ...data, created_by: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustedCircle'] });
      toast.success('Added to Trusted Circle');
    }
  });

  const deleteTrustedPersonMutation = useMutation({
    mutationFn: (id: string) => (base44.entities.TrustedPerson as any).delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustedCircle'] });
      toast.success('Removed from Trusted Circle');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => (base44.entities.ChatMessage as any).create(data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        setInput('');
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiMessages, selectedRoom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (selectedRoom === 'ai') {
        const userMsg = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
        setAiMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const modelMsgId = (Date.now() + 1).toString();
            setAiMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now() }]);
            
            const contents = aiMessages.filter(m => m.id !== 'ai-0').map(m => ({
                role: m.role as 'user' | 'model',
                parts: [{ text: m.text }]
            }));
            contents.push({ role: 'user', parts: [{ text: input }] });

            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents,
                config: { systemInstruction: "You are a professional enterprise chat assistant. Help users generate reports, complaints, or shift summaries." }
            });

            let fullText = '';
            for await (const chunk of responseStream) {
                const text = chunk.text;
                if (text) {
                    fullText += text;
                    setAiMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
                }
            }
        } catch (err) {
            toast.error("AI Error occurred");
        } finally {
            setIsLoading(false);
        }
    } else if (selectedRoom) {
        sendMessageMutation.mutate({
            group_id: selectedRoom.id,
            sender_email: user?.email,
            content: input,
            created_date: new Date().toISOString()
        });
    }
  };

  if (!selectedRoom) {
    return (
      <Layout currentPageName="Chat">
        <div className="flex flex-col h-full bg-inherit">
            {/* Sub-tabs */}
            <div className="p-4 bg-inherit sticky top-0 z-20">
                <div className={cn(
                    "flex p-1 rounded-2xl",
                    isDark ? "bg-zinc-900" : "bg-gray-100"
                )}>
                    <button 
                        onClick={() => setActiveSubTab('messages')}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeSubTab === 'messages' 
                                ? (isDark ? "bg-zinc-800 text-white" : "bg-white text-gray-900 shadow-sm")
                                : "text-zinc-500"
                        )}
                    >
                        Messages
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('circle')}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeSubTab === 'circle' 
                                ? (isDark ? "bg-zinc-800 text-white" : "bg-white text-gray-900 shadow-sm")
                                : "text-zinc-500"
                        )}
                    >
                        Trusted Circle
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {activeSubTab === 'messages' ? (
                    <div className="p-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="Search chats..." 
                                className={cn(
                                    "w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none border transition-all",
                                    isDark ? "bg-zinc-900 border-white/5 text-white" : "bg-gray-100 border-gray-200"
                                )}
                            />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 px-2 mb-2">Automations</h3>
                            <button 
                                onClick={() => setSelectedRoom('ai')}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-3xl transition-all active:scale-[0.98]",
                                    isDark ? "bg-violet-600/10 hover:bg-violet-600/20" : "bg-violet-50 hover:bg-violet-100"
                                )}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-violet-500">AI Financial Agent</h4>
                                        <Sparkles className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <p className="text-xs opacity-50 truncate">Ask me to generate reports or complaints...</p>
                                </div>
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 px-2 mb-2">Internal Teams</h3>
                            {chatRooms.length === 0 ? (
                                <div className="text-center py-20 opacity-30">
                                    <Paperclip className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-xs font-bold uppercase">No active company chats</p>
                                </div>
                            ) : (
                                chatRooms.map(room => (
                                    <button 
                                        key={room.id}
                                        onClick={() => setSelectedRoom(room)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-3xl transition-all hover:bg-zinc-500/5",
                                            isDark ? "text-white" : "text-gray-900"
                                        )}
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-500/10 flex items-center justify-center text-zinc-500 font-black text-xl">
                                            {room.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 text-left border-b border-zinc-500/5 pb-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold">{room.name} Team</h4>
                                                <span className="text-[10px] opacity-40">Active</span>
                                            </div>
                                            <p className="text-xs opacity-40 truncate">Tap to message the company staff...</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center px-2">
                             <h3 className="text-xs font-black uppercase tracking-widest opacity-40">Trusted Circle</h3>
                             <button 
                                onClick={() => setIsCircleModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-violet-600/20"
                             >
                                <Plus className="w-3.5 h-3.5" />
                                Add Member
                             </button>
                        </div>

                        {trustedCircle.length === 0 ? (
                             <div className="py-20 text-center opacity-30">
                                <Users className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase">Your circle is empty</p>
                                <p className="text-[10px] mt-1">Add trusted people to share your financial progress</p>
                             </div>
                        ) : (
                            <div className="grid gap-3">
                                {trustedCircle.map(person => (
                                    <div key={person.id} className={cn(
                                        "p-4 rounded-[32px] border flex items-center gap-4",
                                        isDark ? "bg-zinc-900 border-white/5 shadow-xl" : "bg-white border-gray-100 shadow-sm"
                                    )}>
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white",
                                            isDark ? "bg-zinc-800" : "bg-zinc-900"
                                        )}>
                                            {person.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate">{person.name}</h4>
                                            <p className="text-[10px] opacity-40 truncate uppercase tracking-widest font-black">{person.relation} • {person.access_level} access</p>
                                        </div>
                                        <button 
                                            onClick={() => deleteTrustedPersonMutation.mutate(person.id)}
                                            className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={cn(
                            "p-6 rounded-[32px] border",
                            isDark ? "bg-violet-600/5 border-violet-600/10" : "bg-violet-50 border-violet-100"
                        )}>
                            <h4 className="font-bold text-sm text-violet-500 mb-2">Why define a circle?</h4>
                            <p className="text-xs opacity-60 leading-relaxed">Trusted people can receive automated financial updates or access your reports when you share them via the Share Hub.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Add Circle Member Modal */}
        <Dialog open={isCircleModalOpen} onOpenChange={setIsCircleModalOpen}>
            <DialogContent className={cn(
                "border-none rounded-[32px] max-w-[90vw] md:max-w-md",
                isDark ? "bg-zinc-950 text-white border-white/5" : "bg-white text-gray-900"
            )}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight">Add to Circle</DialogTitle>
                    <DialogDescription className="opacity-60 text-xs">Invite someone you trust to see your progress.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Name</label>
                        <Input 
                            placeholder="e.g. John Doe"
                            className={cn(
                                "h-14 rounded-2xl px-5 border-none",
                                isDark ? "bg-zinc-900" : "bg-gray-100"
                            )}
                            id="circleName"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Email</label>
                        <Input 
                            placeholder="john@example.com"
                            className={cn(
                                "h-14 rounded-2xl px-5 border-none",
                                isDark ? "bg-zinc-900" : "bg-gray-100"
                            )}
                            id="circleEmail"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Relation</label>
                        <select 
                            className={cn(
                                "w-full h-14 rounded-2xl px-5 outline-none font-bold text-sm appearance-none",
                                isDark ? "bg-zinc-900" : "bg-gray-100"
                            )}
                            id="circleRelation"
                        >
                            <option value="Family">Family</option>
                            <option value="Friend">Friend</option>
                            <option value="Advisor">Advisor</option>
                            <option value="Spouse">Spouse</option>
                        </select>
                    </div>
                </div>
                <DialogFooter className="flex-col gap-2">
                    <Button 
                        className="bg-violet-600 hover:bg-violet-700 h-14 rounded-2xl w-full font-black text-sm uppercase tracking-widest shadow-xl shadow-violet-600/20"
                        onClick={() => {
                            const name = (document.getElementById('circleName') as HTMLInputElement).value;
                            const email = (document.getElementById('circleEmail') as HTMLInputElement).value;
                            const relation = (document.getElementById('circleRelation') as HTMLSelectElement).value;
                            if (name && email) {
                                addTrustedPersonMutation.mutate({ name, email, relation, access_level: 'read' });
                                setIsCircleModalOpen(false);
                            }
                        }}
                    >
                        Save Member
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsCircleModalOpen(false)}
                        className="h-14 rounded-2xl font-black text-sm uppercase tracking-widest opacity-40"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </Layout>
    );
  }

  return (
    <Layout currentPageName="Chat">
       <div className="flex flex-col h-[calc(100vh-160px)] relative bg-inherit">
            {/* Chat Header */}
            <div className={cn(
                "px-4 py-3 flex items-center gap-3 border-b sticky top-0 z-20 backdrop-blur-xl",
                isDark ? "bg-zinc-950/80 border-white/5" : "bg-white/80 border-gray-100"
            )}>
                <button onClick={() => setSelectedRoom(null)} className="p-2 -ml-2 rounded-xl hover:bg-zinc-500/10">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                        selectedRoom === 'ai' ? "bg-violet-600" : "bg-zinc-500"
                    )}>
                        {selectedRoom === 'ai' ? <Bot className="w-6 h-6" /> : (selectedRoom as ChatRoom).name.charAt(0)}
                    </div>
                    <div>
                    <h4 className="font-bold text-sm">{selectedRoom === 'ai' ? 'AI Assistant' : (selectedRoom as ChatRoom).name + ' Team'}</h4>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsShareHubOpen(true)}
                    className="p-3 rounded-2xl hover:bg-zinc-500/10 text-violet-500 transition-all flex items-center gap-2"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Share Hub</span>
                </button>
                <button className="p-3 rounded-2xl hover:bg-zinc-500/10">
                    <MoreVertical className="w-5 h-5 opacity-40" />
                </button>
            </div>
        </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(selectedRoom === 'ai' ? aiMessages : messages).map((msg, idx) => {
                    const isOwn = selectedRoom === 'ai' ? msg.role === 'user' : msg.sender_email === user?.email;
                    return (
                        <div key={idx} className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                        )}>
                            <div className={cn(
                                "max-w-[85%] p-3.5 rounded-2xl relative shadow-sm",
                                isOwn 
                                    ? "bg-violet-600 text-white rounded-tr-none" 
                                    : isDark ? "bg-zinc-900 text-white border border-white/5 rounded-tl-none" : "bg-white border text-gray-900 rounded-tl-none"
                            )}>
                                <p className="text-sm leading-relaxed">{selectedRoom === 'ai' ? (msg.text || (isLoading && <Loader2 className="w-4 h-4 animate-spin" />)) : (msg as any).content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                    <span className="text-[9px]">12:45 PM</span>
                                    {isOwn && <CheckCheck className="w-3 h-3" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing Area */}
            <div className={cn(
                "p-4 border-t sticky bottom-0 z-20 backdrop-blur-xl",
                isDark ? "bg-zinc-950/80 border-white/5" : "bg-white/80 border-gray-100"
            )}>
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <button className="p-3 rounded-2xl hover:bg-zinc-500/10">
                        <Paperclip className="w-5 h-5 opacity-40" />
                    </button>
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..." 
                            className={cn(
                                "w-full pl-5 pr-12 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/30 transition-all border",
                                isDark ? "bg-zinc-900 border-white/5 text-white" : "bg-gray-50 border-gray-200"
                            )}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                "absolute right-2 top-2 p-1.5 rounded-xl transition-all",
                                !input.trim() ? "opacity-20" : "text-violet-500"
                            )}
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Hub Modal */}
            <Dialog open={isShareHubOpen} onOpenChange={setIsShareHubOpen}>
                <DialogContent className={cn(
                    "border-none rounded-[40px] max-w-[95vw] md:max-w-lg p-0 overflow-hidden",
                    isDark ? "bg-zinc-950 text-white" : "bg-white text-gray-900"
                )}>
                    <div className="p-8 pb-4">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-violet-600 rounded-2xl text-white shadow-xl shadow-violet-600/20">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                Financial Share Hub
                            </DialogTitle>
                            <DialogDescription className="text-sm opacity-50 font-medium">Export and share your reports professionally.</DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Report Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['daily', 'weekly', 'monthly', 'all'] as const).map(range => (
                                        <button 
                                            key={range}
                                            onClick={() => setReportRange(range)}
                                            className={cn(
                                                "p-4 rounded-3xl border transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2",
                                                reportRange === range 
                                                    ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/20"
                                                    : (isDark ? "bg-zinc-900 border-white/5 opacity-50" : "bg-gray-50 border-gray-100 opacity-50")
                                            )}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Preview & Notification</label>
                                <div className={cn(
                                    "p-6 rounded-[32px] border",
                                    isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
                                )}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <CheckCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-40">Ready to Share</p>
                                            <p className="text-sm font-bold">Earn & Expense Report ({reportRange})</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] opacity-40 leading-relaxed italic">"Your financial report is prepared. You can either download the CSV or share it instantly with your Trusted Circle."</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "p-8 pt-4 space-y-3",
                        isDark ? "bg-zinc-900/50" : "bg-gray-50/50"
                    )}>
                        <Button 
                            className="w-full h-16 rounded-[24px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
                            onClick={() => {
                                toast.success('CSV Report downloading...');
                                setIsShareHubOpen(false);
                            }}
                        >
                            <Download className="w-5 h-5" />
                            Download CSV
                        </Button>
                        <Button 
                            className="w-full h-16 rounded-[24px] bg-violet-600 hover:bg-violet-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3"
                            onClick={() => {
                                if (trustedCircle.length === 0) {
                                    toast.error('Add someone to your Trusted Circle first');
                                    setActiveSubTab('circle');
                                    setIsShareHubOpen(false);
                                    setSelectedRoom(null);
                                    return;
                                }
                                toast.promise(new Promise(res => setTimeout(res, 1500)), {
                                    loading: 'Notifying Trusted Circle...',
                                    success: 'Financial report shared with Circle!',
                                    error: 'Failed to share'
                                });
                                setIsShareHubOpen(false);
                            }}
                        >
                            <Users className="w-5 h-5" />
                            Share to Circle
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-30"
                            onClick={() => setIsShareHubOpen(false)}
                        >
                            Dismiss Hub
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
       </div>
    </Layout>
  );
}
