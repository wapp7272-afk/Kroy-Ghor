import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  Bot, 
  Sparkles,
  MessageCircle
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'আসসালামু আলাইকুম! Kroyghor-এ আপনাকে স্বাগতম। ✨\nআমি আপনার শপিং সহকারী। আমাদের প্রিমিয়াম পণ্য, ডেলিভারি, বিকাশ/নগদ পেমেন্ট, কুপন বা অর্ডার ট্র্যাকিং সম্পর্কে যেকোনো প্রশ্ন করতে পারেন:',
      time: 'এখন',
      quickOptions: [
        '✨ সেরা পণ্য ও কালেকশন কোনগুলো?',
        '🚚 ডেলিভারি চার্জ ও সময় কত?',
        '💳 বিকাশ ও নগদে পেমেন্ট নিয়ম',
        '🎟️ কুপন কোড কীভাবে কাজ করে?',
        '🎁 ৳২০ ওয়ালেট বোনাস কীভাবে কাজে লাগাব?',
        '🛡️ ১০০% অরিজিনাল পণ্যের নিশ্চয়তা কী?'
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

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/8801883418309?text=Hi%20Kroyghor,%20I%20need%20help', '_blank');
  };

  // Intelligent Knowledge Base
  const getAIAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('ডেলিভারি') || q.includes('সময়') || q.includes('চার্জ') || q.includes('delivery')) {
      return `🚚 **Kroyghor ডেলিভারি তথ্য:**\n• **ঢাকার ভিতরে:** চার্জ মাত্র ৳৬০, সময় ২৪ থেকে ৪৮ ঘণ্টা।\n• **ঢাকার বাইরে:** চার্জ ৳১২০, সময় ২ থেকে ৪ দিন।\n• ক্যাশ অন ডেলিভারিতে কোনো অগ্রিম চার্জ ছাড়াই পণ্য গ্রহণ করতে পারবেন!`;
    }

    if (q.includes('বিকাশ') || q.includes('নগদ') || q.includes('পেমেন্ট') || q.includes('bkash') || q.includes('nagad') || q.includes('trx')) {
      return `💳 **পেমেন্ট পদ্ধতি:**\n১. **ক্যাশ অন ডেলিভারি (COD):** পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।\n২. **bKash & Nagad:** 01883418309 নম্বরে পেমেন্ট করে TrxID বসালেই অর্ডার কনফার্ম হবে!`;
    }

    if (q.includes('কুপন') || q.includes('zest20') || q.includes('coupon') || q.includes('ছাড়') || q.includes('discount')) {
      return `🎟️ **কুপন অফার:**\nকার্ট পেজে কুপন বক্সে **ZEST20** প্রয়োগ করলে সাথে সাথে **১০% ফ্ল্যাট ডিসকাউন্ট** পাবেন!`;
    }

    if (q.includes('বোনাস') || q.includes('bonus') || q.includes('wallet') || q.includes('ওয়ালেট') || q.includes('২০')) {
      return `🎁 **৳২০ ওয়ালেট সাইনআপ বোনাস:**\nKroyghor-এ একাউন্ট খুললেই ৳২০ বোনাস পাবেন যা চেকআউটে সরাসরি ক্যাশ ডিসকাউন্ট হিসেবে কাটা যাবে।`;
    }

    if (q.includes('অরিজিনাল') || q.includes('নিশ্চয়তা') || q.includes('quality') || q.includes('original')) {
      return `🛡️ **১০০% অথেনটিক ও কোয়ালিটি নিশ্চয়তা:**\nKroyghor-এর প্রতিটি পণ্য সরাসরি যাচাইকৃত সোর্স থেকে সংগৃহীত। ডেলিভারির সময় পণ্য দেখে বুঝে নেওয়ার পূর্ণ সুবিধা রয়েছে।`;
    }

    return `ধন্যবাদ আপনার বার্তার জন্য! 😊\nসরাসরি সাপোর্ট টিমের সাথে কথা বলতে উপরের **WhatsApp** বাটনে ক্লিক করুন।`;
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
    }, 600);
  };

  return (
    <>
      {/* Floating Buttons Column - Fixed right-4 bottom-24 z-50 */}
      <div 
        id="floating-support-bar"
        className="fixed right-4 bottom-24 z-50 flex flex-col gap-3 items-end pointer-events-auto select-none"
      >
        {/* 1. WhatsApp Direct Chat Button (ABOVE) */}
        <button
          type="button"
          onClick={handleWhatsAppClick}
          className="relative w-12 h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
          aria-label="Direct WhatsApp Chat"
          title="Chat on WhatsApp (+880 1883-418309)"
        >
          <MessageCircle className="w-5.5 h-5.5 text-white fill-white" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-[0_0_10px_#10B981] animate-pulse" />
          
          <span className="absolute right-14 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700">
            WhatsApp Support
          </span>
        </button>

        {/* 2. Floating AI Assistant Button (BELOW) */}
        <button
          id="open-ai-chat-btn"
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="relative w-12 h-12 rounded-full bg-slate-900/90 text-amber-400 border border-amber-400/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-xl cursor-pointer group hover:shadow-amber-500/20"
          aria-label="Open AI Assistant"
          aria-expanded={isChatOpen}
        >
          <Sparkles className="w-5.5 h-5.5 text-amber-400" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-slate-900 flex items-center justify-center rounded-full shadow-[0_0_8px_#F59E0B]">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </span>

          <span className="absolute right-14 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700">
            Kroyghor AI Assistant
          </span>
        </button>
      </div>

      {/* --- INTERACTIVE AI CHAT MODAL --- */}
      {isChatOpen && (
        <div 
          id="ai-chat-modal"
          role="dialog"
          aria-modal="true"
          aria-label="AI Shopping Assistant & Customer Support"
          className="fixed bottom-36 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-96 max-w-[400px] h-[480px] sm:h-[520px] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-slideUp"
        >
          {/* Chat Header */}
          <div className="p-3.5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Bot className="w-5 h-5 text-orange-400" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Kroyghor AI
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
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-tr-none shadow-2xs font-medium'
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
                        className="text-[10px] text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 w-16">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-bounce [animation-delay:0.4s]" />
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
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
            <button
              id="ai-chat-send-btn"
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default CustomerSupport;
