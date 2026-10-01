import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  Sparkles, 
  ExternalLink,
  ChevronDown,
  PhoneCall,
  Mail,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { ChatMessage } from '../types';

export interface CustomerSupportProps {
  onOpenFaq?: () => void;
  onOpenReturnPolicy?: () => void;
}

export const CustomerSupport: React.FC<CustomerSupportProps> = ({
  onOpenFaq,
  onOpenReturnPolicy,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'আসসালামু আলাইকুম! ZeropicBD-এ আপনাকে স্বাগতম। ✨\nআমি আপনার শপিং সহকারী। আমাদের লাক্সারি পারফিউম, ডেলিভারি, বিকাশ/নগদ পেমেন্ট, কুপন বা ৭ দিনের রিটার্ন পলিসি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন:',
      time: 'এখন',
      quickOptions: [
        '✨ সেরা লাক্সারি পারফিউম কোনগুলো?',
        '🚚 ডেলিভারি চার্জ ও সময় কত?',
        '💳 বিকাশ ও নগদে পেমেন্ট নিয়ম',
        '🎟️ কুপন কোড কীভাবে কাজ করে?',
        '🎁 ৳২০ সাইনআপ বোনাস কীভাবে কাজে লাগাব?',
        '🔄 ৭ দিনের রিটার্ন ও রিফান্ড পলিসি কী?'
      ]
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen, isTyping]);

  // Intelligent Bengali Knowledge Base
  const getAIAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('ডেলিভারি') || q.includes('সময়') || q.includes('চার্জ') || q.includes('delivery')) {
      return `🚚 **ZeropicBD ডেলিভারি সংক্রান্ত তথ্য:**\n• **ঢাকার ভিতরে:** চার্জ মাত্র ৳৬০, সময় ২৪ থেকে ৪৮ ঘণ্টা।\n• **ঢাকার বাইরে:** চার্জ ৳১২০, সময় ২ থেকে ৪ দিন।\n• ক্যাশ অন ডেলিভারিতে কোনো অগ্রিম চার্জ ছাড়াই পণ্য গ্রহণ করতে পারবেন!`;
    }

    if (q.includes('বিকাশ') || q.includes('নগদ') || q.includes('পেমেন্ট') || q.includes('bkash') || q.includes('nagad') || q.includes('trx')) {
      return `💳 **পেমেন্ট পদ্ধতি:**\n১. **ক্যাশ অন ডেলিভারি (COD):** পণ্য হাতে পেয়ে সম্পূর্ণ মূল্য পরিশোধ করুন।\n২. **bKash & Nagad মার্চেন্ট / পার্সোনাল নম্বর:** 01883418309 নম্বরে Send Money বা Cash Out করে প্রাপ্ত TrxID চেকআউটে বসিয়ে দিন। কোনো সমস্যা হলে সরাসরি আমাদের সাথে যোগাযোগ করতে পারেন।`;
    }

    if (q.includes('কুপন') || q.includes('zest20') || q.includes('coupon') || q.includes('ছাড়') || q.includes('discount')) {
      return `🎟️ **কুপন কোড অফার:**\nকার্ট পেজে কুপন বক্সে **ZEST20** লিখুন এবং Apply চাপুন। আপনি আপনার মোট পণ্যের মূল্যের উপর সাথে সাথে **১০% ফ্ল্যাট ডিসকাউন্ট** পেয়ে যাবেন!`;
    }

    if (q.includes('বোনাস') || q.includes('bonus') || q.includes('wallet') || q.includes('ওয়ালেট') || q.includes('২০')) {
      return `🎁 **৳২০ ওয়ালেট সাইনআপ বোনাস:**\nZeropicBD-এ প্রথমবার একাউন্ট খুললেই আপনার ওয়ালেটে সাথে সাথে ৳২০ বোনাস ক্রেডিট হয়ে যাবে। কার্ট ওপেন করে 'Apply ৳20 Wallet Bonus' বক্সে টিক চিহ্ন দিলেই আপনার বিল থেকে সরাসরি ৳২০ মাইনাস হয়ে যাবে!`;
    }

    if (q.includes('রিটার্ন') || q.includes('পরিবর্তন') || q.includes('পলিসি') || q.includes('return') || q.includes('refund')) {
      return `🔄 **৭ দিনের সহজ রিটার্ন পলিসি:**\nপণ্য হাতে পাওয়ার পর যদি কোনো ত্রুটি বা সমস্যা দেখতে পান, ডেলিভারির ৭ দিনের মধ্যে আমাদের হোয়াটসঅ্যাপে (01798-245190) ভিডিও বা ছবি পাঠিয়ে ফ্রি রিপ্লেসমেন্ট বা ফুল রিফান্ড নিতে পারবেন।`;
    }

    if (q.includes('ল্যাম্প') || q.includes('লাইট') || q.includes('lamp') || q.includes('glow') || q.includes('ক্যাপিবারা')) {
      return `💡 **সিলিকন গ্লো ল্যাম্প কালেকশন:**\nআমাদের **Capybara Tap-Dim Lamp** এবং **Lazy Duck Touch Lamp** বর্তমানে সর্বাধিক জনপ্রিয়! এগুলো ফুড-গ্রেড নরম সিলিকন দিয়ে তৈরি, স্পর্শ করলেই ডিম বা লাইট অন-অফ হয় এবং টাইপ-সি রিচার্জেবল ব্যাটারিতে চলে।`;
    }

    if (q.includes('আতর') || q.includes('পারফিউম') || q.includes('attar') || q.includes('perfume') || q.includes('সুগন্ধি')) {
      return `🌺 **প্রিমিয়াম আতর কালেকশন:**\nআমাদের সব আতর ১০০% অ্যালকোহল মুক্ত। বিশেষ করে **Royal White Musk** এবং **Golden Oudh Al-Amir** কাপড়ে ২৪ ঘণ্টার বেশি মিষ্টি ও মনোরম সুবাস বজায় রাখে।`;
    }

    if (q.includes('নোটবুক') || q.includes('খাতা') || q.includes('notebook') || q.includes('journal')) {
      return `📓 **নিয়ন ও হলোগ্রাফিক নোটবুক:**\n১২০ GSM এর প্রিমিয়াম ব্লিডপ্রুফ পেপারের 'Cyberpunk Neon Edge Dot-Grid' ও 'Astral Constellation' জার্নালগুলো আপনার ডায়েরি বা নোট লেখার অভিজ্ঞতা অনন্য করে তুলবে!`;
    }

    if (q.includes('খেলনা') || q.includes('ব্রিক') || q.includes('brick') || q.includes('lego') || q.includes('টয়')) {
      return `🧱 **ব্রিকস টয় কিট:**\nআমাদের মেকা রোবট, চেরি ব্লসম বনসাই এবং টোকিও রামেন বার মিনি মডেলগুলো অত্যন্ত নিখুঁত পার্টস ও এলইডি লাইট সহ আসে—উপহার বা ডেকোরেশনের জন্য দারুণ!`;
    }

    return `ধন্যবাদ আপনার মেসেজের জন্য! 😊\nআমরা সর্বদা সেরা মানের পণ্য ও দ্রুততম হোম ডেলিভারি দিতে প্রতিশ্রুতিবদ্ধ।\nআরও বিস্তারিত বা সরাসরি প্রতিনিধির সাথে কথা বলতে নিচের **WhatsApp** বাটনে ক্লিক করতে পারেন অথবা 01798-245190 এ কল করতে পারেন।`;
  };

  const handleSendMessage = (textToSend?: string) => {
    const messageText = textToSend || inputVal;
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    // AI typing delay simulation
    setTimeout(() => {
      const responseText = getAIAnswer(messageText);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Buttons Stack - Positioned above Mobile Bottom Nav (bottom-[72px] on mobile, bottom-6 on desktop) */}
      <div 
        id="floating-support-bar"
        className="fixed bottom-[72px] right-3 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end gap-2 pointer-events-none"
      >
        {/* Support quick action channels - Expandable on mobile to avoid blocking screen content */}
        <div 
          className={`flex flex-col gap-2 items-end transition-all duration-300 pointer-events-auto ${
            isMenuExpanded 
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
              : 'opacity-0 translate-y-4 scale-95 pointer-events-none sm:opacity-100 sm:translate-y-0 sm:scale-100 sm:pointer-events-auto'
          }`}
        >
          {/* WhatsApp Support Button */}
          <a
            href="https://wa.me/8801883418309?text=Hello%20Prime%20Vault%20Zone%2C%20I%20need%20support"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 sm:w-11 sm:h-11 min-h-[44px] min-w-[44px] rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative cursor-pointer"
            aria-label="WhatsApp Support"
            title="Chat on WhatsApp (+880 1883-418309)"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute right-13 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none shadow-xl">
              WhatsApp: 01883-418309
            </span>
          </a>

          {/* Live Phone Helpline Call */}
          <a
            href="tel:01883418309"
            className="w-11 h-11 sm:w-11 sm:h-11 min-h-[44px] min-w-[44px] rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Call Customer Helpline"
            title="Call Customer Care (01883-418309)"
          >
            <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            <span className="absolute right-13 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none shadow-xl">
              Helpline: 01883-418309
            </span>
          </a>

          {/* Email Support */}
          <a
            href="mailto:support@primevaultzone.com"
            className="w-11 h-11 sm:w-11 sm:h-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Email Customer Support"
            title="Email Support (support@primevaultzone.com)"
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
            <span className="absolute right-13 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none shadow-xl">
              support@primevaultzone.com
            </span>
          </a>

          {/* FAQ Modal Trigger */}
          {onOpenFaq && (
            <button
              type="button"
              onClick={() => {
                onOpenFaq();
                setIsMenuExpanded(false);
              }}
              className="w-11 h-11 sm:w-11 sm:h-11 min-h-[44px] min-w-[44px] rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative cursor-pointer"
              aria-label="Open FAQ Center"
              title="Frequently Asked Questions (FAQ)"
            >
              <HelpCircle className="w-5 h-5 text-white" />
              <span className="absolute right-13 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none shadow-xl">
                সাধারণ প্রশ্নোত্তর (FAQ)
              </span>
            </button>
          )}

          {/* 7-Day Return Policy Trigger */}
          {onOpenReturnPolicy && (
            <button
              type="button"
              onClick={() => {
                onOpenReturnPolicy();
                setIsMenuExpanded(false);
              }}
              className="w-11 h-11 sm:w-11 sm:h-11 min-h-[44px] min-w-[44px] rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group relative cursor-pointer"
              aria-label="7-Day Return Policy"
              title="৭ দিনের রিটার্ন ও রিফান্ড পলিসি"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              <span className="absolute right-13 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none shadow-xl">
                ৭ দিনের রিটার্ন পলিসি
              </span>
            </button>
          )}
        </div>

        {/* Primary Floating Support Trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mobile Quick Channels Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            aria-expanded={isMenuExpanded}
            aria-controls="floating-support-bar"
            className="sm:hidden w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg border border-slate-700 active:scale-95 transition-transform cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none"
            aria-label={isMenuExpanded ? 'Hide contact channels' : 'Show contact channels'}
            title="Customer Help Channels"
          >
            {isMenuExpanded ? (
              <X className="w-5 h-5 text-amber-400" />
            ) : (
              <PhoneCall className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Primary AI Assistant Floating Trigger */}
          <button
            id="open-ai-chat-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            aria-expanded={isChatOpen}
            aria-controls="ai-chat-modal"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 min-h-[44px] rounded-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-xl border border-indigo-500/30 hover:border-indigo-400 transition-all group cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none"
            aria-label="Open AI Shop Assistant"
          >
            <div className="relative">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border-2 border-[#0F172A] rounded-full" />
            </div>
            <span className="tracking-wide">AI চ্যাট</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* --- INTERACTIVE AI CHAT MODAL --- */}
      {isChatOpen && (
        <div 
          id="ai-chat-modal"
          role="dialog"
          aria-modal="true"
          aria-label="AI Shopping Assistant & Customer Support"
          className="fixed bottom-[72px] sm:bottom-20 right-2 sm:right-6 z-50 w-[calc(100vw-16px)] sm:w-96 max-w-[400px] max-h-[calc(100vh-90px)] h-[480px] sm:h-[520px] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-slideUp"
        >
          {/* Chat Header */}
          <div className="p-3.5 bg-[#0F172A] text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Bot className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0F172A] rounded-full" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  ZeropicBD AI
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    বাংলা
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  অনলাইন • সার্বক্ষণিক সহায়তা
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F9FAFB]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#4F46E5] text-white rounded-tr-none shadow-2xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>

                {/* Quick Option Suggestion Chips */}
                {msg.quickOptions && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                    {msg.quickOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(opt)}
                        className="text-[10px] text-left px-2.5 py-1.5 rounded-md bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-[#4F46E5] transition-colors cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-md bg-white border border-slate-200 w-16">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              id="ai-chat-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="বাংলা বা ইংরেজিতে প্রশ্ন লিখুন..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#4F46E5]"
            />
            <button
              id="ai-chat-send-btn"
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
