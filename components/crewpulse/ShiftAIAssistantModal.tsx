import React, { useState, useRef, useEffect } from 'react';
import { useCrewPulse } from '../../context/CrewPulseContext';
import { GoogleGenAI } from '@google/genai';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  Check, 
  Trash2, 
  Zap, 
  FileText, 
  Building, 
  Receipt,
  HelpCircle
} from 'lucide-react';

interface ShiftAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: '📊 Monthly Hours & Wages', prompt: 'Summarize my shift hours and gross earnings for this month.' },
  { label: '💰 Net Take-Home After Tax', prompt: 'Calculate my estimated take-home pay after 20% tax and NI deductions.' },
  { label: '🏢 Top Venues Worked', prompt: 'Which job sites or venues gave me the most shift hours?' },
  { label: '⚡ Overtime & Shifts Check', prompt: 'Check for any overtime hours, missing clock-outs, or long shifts.' },
  { label: '🧾 Expense Claims Status', prompt: 'Summarize my claimed expenses, categories, and approval status.' }
];

export default function ShiftAIAssistantModal({ isOpen, onClose }: ShiftAIAssistantModalProps) {
  const { shifts, expenses, currentBusiness, currentUser, membership } = useCrewPulse();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${currentUser.full_name}! I'm your CrewPulse Shift Intelligence Copilot. I can analyze your shifts, compute overtime multipliers, estimate take-home pay after tax, and audit your expense claims. Ask me anything or select a prompt below.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currency = currentBusiness?.currency || 'GBP';
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Build live shift context for AI prompt
  const buildContextString = () => {
    const totalHours = shifts.reduce((sum, s) => sum + (s.total_hours || 0), 0);
    const regularHours = shifts.reduce((sum, s) => sum + (s.regular_hours || (s.total_hours || 0)), 0);
    const overtimeHours = shifts.reduce((sum, s) => sum + (s.overtime_hours || 0), 0);
    const grossEarnings = shifts.reduce((sum, s) => sum + (s.estimated_pay || 0), 0);
    const overtimePay = shifts.reduce((sum, s) => sum + (s.overtime_pay || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const shiftSummaries = shifts.slice(0, 15).map((s, idx) => {
      return `Shift #${idx + 1}: Date=${s.clock_in.split('T')[0]}, Site=${s.job_site || 'Venue'}, Hours=${s.total_hours?.toFixed(2) || 0}h (OT=${s.overtime_hours?.toFixed(2) || 0}h), BaseRate=${currencySymbol}${s.hourly_rate_at_shift || 15}/h, Pay=${currencySymbol}${s.estimated_pay?.toFixed(2) || 0}, Status=${s.status}, Verified=${s.is_geofence_verified ? 'Yes (20m)' : 'Manual'}`;
    }).join('\n');

    const expenseSummaries = expenses.map(e => {
      return `Expense: ${e.title} (${e.category}) - ${currencySymbol}${e.amount} [Status: ${e.status}]`;
    }).join('\n');

    return `
Worker Name: ${currentUser.full_name}
Role: ${membership?.role || 'employee'}
Business: ${currentBusiness?.name || 'Apex Crew'}
Currency: ${currency} (${currencySymbol})
Base Rate: ${currencySymbol}${currentBusiness?.default_hourly_rate || 15}/h
Overtime Policy: >${currentBusiness?.overtime_threshold_hours || 8} hrs @ ${currentBusiness?.overtime_rate_multiplier || 1.5}x
Total Logged Shifts: ${shifts.length}
Total Hours: ${totalHours.toFixed(2)}h (Regular: ${regularHours.toFixed(2)}h, Overtime: ${overtimeHours.toFixed(2)}h)
Total Gross Earnings: ${currencySymbol}${grossEarnings.toFixed(2)} (Overtime Pay: ${currencySymbol}${overtimePay.toFixed(2)})
Total Claimed Expenses: ${currencySymbol}${totalExpenses.toFixed(2)}

Recent Shifts:
${shiftSummaries || 'None logged yet'}

Expenses:
${expenseSummaries || 'None claimed'}
`;
  };

  const handleSend = async (userPromptText?: string) => {
    const textToSend = userPromptText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!userPromptText) setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }]);

    try {
      const apiKey = process.env.GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback local smart summary if API key is not configured in environment
        setTimeout(() => {
          let fallbackReply = `Here is your shift breakdown:\n\n` +
            `• **Total Shifts**: ${shifts.length}\n` +
            `• **Total Hours**: ${shifts.reduce((s, x) => s + (x.total_hours || 0), 0).toFixed(2)}h\n` +
            `• **Gross Earnings**: ${currencySymbol}${shifts.reduce((s, x) => s + (x.estimated_pay || 0), 0).toFixed(2)}\n` +
            `• **Estimated 20% Tax**: -${currencySymbol}${(shifts.reduce((s, x) => s + (x.estimated_pay || 0), 0) * 0.20).toFixed(2)}\n` +
            `• **Net Take-Home**: ${currencySymbol}${(shifts.reduce((s, x) => s + (x.estimated_pay || 0), 0) * 0.80).toFixed(2)}\n\n` +
            `You can configure an API key in Settings > Secrets to unlock full conversational Gemini reasoning.`;
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fallbackReply } : m));
          setIsLoading(false);
        }, 500);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const context = buildContextString();

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Context of Worker Data:\n${context}\n\nUser Question: ${textToSend}`
              }
            ]
          }
        ],
        config: {
          systemInstruction: 'You are CrewPulse AI, an intelligent shift, payroll, and expense analyst for hourly staff and managers. Answer user queries accurately using their provided shift data. Calculate hours, overtime multipliers, estimated taxes (20% standard rate), and expenses cleanly with bullet points and bold figures. Be friendly, precise, and professional.'
        }
      });

      let accumulated = '';
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          accumulated += text;
          setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulated } : m));
        }
      }
    } catch (err: any) {
      console.error('Gemini error:', err);
      const errorMsg = 'I had trouble connecting to the Gemini intelligence engine. Please check your network or try again in a moment.';
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: errorMsg } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation cleared. How can I help you analyze your CrewPulse shifts today?`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  CrewPulse AI Shift Copilot
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live insights into your shifts, overtime, taxes &amp; expenses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClear}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Query Prompt Chips */}
        <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.prompt)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-600/20 hover:border-cyan-500/30 border border-slate-700/60 text-[11px] font-semibold text-slate-300 hover:text-cyan-200 transition-all active:scale-95 flex items-center gap-1"
            >
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed relative group",
                    isUser
                      ? "bg-cyan-600 text-white rounded-tr-none shadow-md"
                      : "bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60"
                  )}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">
                    {msg.content || (
                      <span className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        Analyzing your shifts &amp; calculating...
                      </span>
                    )}
                  </div>

                  {/* Copy button */}
                  {!isUser && msg.content && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="absolute right-2 bottom-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-slate-900/80 text-slate-400 hover:text-white transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your hours, overtime, tax estimate, or expenses..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white outline-none focus:border-cyan-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "p-3 rounded-2xl bg-cyan-600 text-white font-bold transition-all shadow-md active:scale-95 flex items-center justify-center",
                isLoading || !input.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-cyan-500 shadow-cyan-600/30"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
