import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Sparkles, Send, BrainCircuit, Mic, Plus, HelpCircle, Check, Play } from 'lucide-react';
import { ChatMessage } from '../types';

interface CoachProps {
  chatLogs: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  loading: boolean;
}

export default function CoachView({ chatLogs, onSendMessage, loading }: CoachProps) {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const starterPrompts = [
    { title: "How can I increase profit?", desc: "Analyze high yield products margins." },
    { title: "Review my Udhaar Risk limits", desc: "Identify highest confidence debtors." },
    { title: "Which stock is running low?", desc: "Review impending shelf shelfouts." },
    { title: "Suggest weekend bundle promotion", desc: "Bundle fast moving snacks with tea." }
  ];

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    const txt = inputText;
    setInputText('');
    await onSendMessage(txt);
  };

  const selectStarterPrompt = async (promptText: string) => {
    if (loading) return;
    await onSendMessage(promptText);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs, loading]);

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4.5rem)] flex flex-col justify-between" id="ai-coach-module-container">
      {/* Upper Module header */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-3xl shrink-0 flex items-center justify-between" id="ai-coach-header">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" /> LeadgerX AI Business Coach
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Talk with your smart operations advisor. We analyze active logs & stocks to help optimize your cash flow.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold leading-none shrink-0">
          <BrainCircuit className="h-4 w-4 text-emerald-600 shrink-0" />
          Active Agent
        </div>
      </div>

      {/* Main Conversation container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl my-6 p-6 overflow-hidden flex flex-col justify-between shadow-sm">
        {/* Messages Stream Scroll area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[500px]">
          {chatLogs.map((msg) => {
            const isAss = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80vw] ${isAss ? 'justify-start mr-12' : 'justify-end ml-12'}`}
              >
                {/* Assistant avatar */}
                {isAss && (
                  <div className="h-9 w-9 bg-black rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-base">
                    L
                  </div>
                )}
                
                <div className={`p-4 rounded-xl leading-relaxed text-xs shadow-3xs ${
                  isAss 
                    ? 'bg-slate-50 border border-slate-150 text-slate-800 font-medium' 
                    : 'bg-slate-900 dark:bg-slate-950 text-white font-bold'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</p>
                  <span className={`text-[9px] block mt-1.5 text-right leading-none ${isAss ? 'text-slate-400' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="h-9 w-9 bg-black rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-base animate-pulse">
                L
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  Coach Think Level High
                </div>
                <p className="text-xs text-slate-500 font-medium">Assembling active transaction statistics and preparing playbook...</p>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Starter pills */}
        {chatLogs.length <= 1 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-100 mb-4 shrink-0" id="ai-prompts-carousel">
            {starterPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectStarterPrompt(p.title)}
                className="text-left p-3 border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl cursor-pointer duration-200 transition-all shadow-3xs"
              >
                <p className="font-bold text-xs text-slate-900 leading-none">{p.title}</p>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">{p.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Input Text Form Area */}
        <form onSubmit={handleSendSubmit} className="flex gap-3 border-t border-slate-100 pt-4 shrink-0" id="ai-chat-input-bar">
          <input
            type="text"
            value={inputText}
            id="coach-text-query"
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything about profit margin, low inventory reorders, or credit recoveries..."
            className="flex-1 bg-slate-50 hover:bg-white border border-slate-200 focus:border-black text-xs px-5 py-3 rounded-full focus:outline-none transition-all font-medium text-slate-800"
          />
          <button
            type="submit"
            id="btn-ai-coach-send"
            disabled={loading || !inputText.trim()}
            className="bg-black hover:bg-slate-800 text-white rounded-full h-11 w-11 flex items-center justify-center transition-all cursor-pointer shadow-md disabled:bg-slate-200 shrink-0"
          >
            <Send className="h-4.5 w-4.5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
