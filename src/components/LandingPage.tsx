import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Play, CheckCircle2, ShieldCheck, Sparkles, MessageSquare, Mic, Zap, Cpu } from 'lucide-react';

interface LandingPageProps {
  onStartFree: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onStartFree, onLogin }: LandingPageProps) {
  const features = [
    {
      icon: Mic,
      title: "Voice Natural Entry",
      desc: 'Dictate transactions like "Sold 2 milk packets to Amit" and let AI catalog entries instantly.'
    },
    {
      icon: Cpu,
      title: "Smart Bill Reading",
      desc: "Take snapshots of supplier invoices. Gemini identifies header information, items, pricing, and updates inventory."
    },
    {
      icon: Zap,
      title: "Udhaar Reminders",
      desc: "Autogenerate clear repayment timelines and respectful recovery messages based on customer trust ratings."
    },
    {
      icon: Sparkles,
      title: "Inventory Demand Predictor",
      desc: "AI forecasts seasonal inventory peaks and flags impending stock depletion before they impact sales."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col text-slate-800" id="landing-page-container">
      {/* Navbar Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex justify-between items-center bg-transparent border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg">
            L
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight flex items-center gap-1">
            LeadgerX <span className="text-[9px] bg-slate-900 text-white font-mono px-1 py-0.5 rounded">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            id="btn-landing-nav-login"
            onClick={onLogin} 
            className="text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer"
          >
            Log In
          </button>
          <button 
            id="btn-landing-nav-start"
            onClick={onStartFree} 
            className="bg-black text-white hover:bg-slate-800 text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            Start Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          {/* AI Banner */}
          <div className="inline-flex items-center gap-1.5 bg-slate-900/5 border border-slate-200 text-slate-800 px-3 py-1 rounded-full text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5 text-slate-900 animate-pulse" />
            Designed for Kiranas, Wholesalers & Retailers
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight md:leading-none">
            The AI-Powered <br />
            <span className="text-slate-950 font-black">Business Operating System</span>
          </h1>

          <p className="text-slate-600 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed font-normal">
            Manage inventory, sales, customers, udhaar ledger, and obtain smart predictive suggestions from one single platform. "Run your business smarter."
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              id="landing-cta-start"
              onClick={onStartFree}
              className="bg-black hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md group cursor-pointer"
            >
              Start Free Today
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              id="landing-cta-demo"
              onClick={onLogin}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 px-7 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-slate-800 text-slate-800" />
              Watch 1-Min Demo
            </button>
          </div>
        </motion.div>

        {/* Dashboard Mock Preview Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full mt-16 border border-slate-200/80 rounded-2xl bg-white shadow-xl shadow-slate-100 p-3 md:p-6"
        >
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-6">
            {/* Left Column Mock Summary */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-bold text-sm tracking-tight text-slate-900">Suresh Kirana Dashboard</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</p>
                  <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">₹12,450</p>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block">↑ +14%</span>
                </div>
                <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Udhaar</p>
                  <p className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">₹4,230</p>
                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block">Refill Warn</span>
                </div>
              </div>

              {/* Simulated Voice entry preview */}
              <div className="bg-slate-900 text-white rounded-xl p-5 shadow-inner flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" /> AI Assistant Active
                  </p>
                  <p className="text-sm font-semibold italic text-slate-200">"Sold 4 packets of tea to Shridhar on credit."</p>
                </div>
                <div className="h-10 w-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Mic className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>

            {/* Right Column Mock Predictions */}
            <div className="w-full md:w-80 bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">AI SMART RECOVERY COACH</span>
              <div className="border border-slate-100 p-3 rounded-lg bg-slate-50/50 space-y-1">
                <p className="font-bold text-xs text-slate-800">Priya Sharma Udhaar Due</p>
                <p className="text-[11px] text-slate-500">Suggested Action: Send friendly WhatsApp prompt.</p>
                <button 
                  onClick={onLogin}
                  className="bg-slate-900 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded mt-1.5 w-full cursor-pointer"
                >
                  Action Suggestion
                </button>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg space-y-1.5">
                <p className="font-bold text-xs text-emerald-800 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Growth Insight
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  "Suresh, Tea and Sugar orders peak 30% higher on Friday. Pre-restock tomorrow morning to capture maximum profits."
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Bento Grid */}
        <section className="w-full py-16 md:py-24" id="landing-bento-grid">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Replace Paper Registers and Excel Sheets</h2>
            <p className="text-slate-500 mt-3 text-base leading-relaxed">Let artificial intelligence supercharge your daily bookkeeping, credit tracking, and inventory sourcing on autopilot.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div key={index} className="bg-white border border-slate-200/70 hover:border-slate-400 duration-200 transition-all rounded-xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-10 w-10 bg-slate-100 text-slate-950 rounded-lg flex items-center justify-center font-bold shadow-xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">{feat.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dynamic Trust Stats Banner */}
        <section className="w-full border-t border-slate-200/80 pt-10 pb-16 flex flex-wrap justify-around items-center gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-slate-900">100%</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Automatic & Secure</p>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">&lt; 3 Sec</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">OCR Invoice Reader</p>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">0%</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Data Leaks / Safe Private Sandbox</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-auto text-center border-t border-slate-800">
        <p className="text-xs font-medium">© 2026 LeadgerX Cloud Inc. "Run Your Business Smarter." Made with pride for local merchants.</p>
      </footer>
    </div>
  );
}
