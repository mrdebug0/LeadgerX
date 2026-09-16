import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Lock, Mail, Store, UserCheck, ShieldCheck } from 'lucide-react';
import { apiClient } from '../api/client';

interface AuthPageProps {
  onAuthSuccess: (user: any, token?: string) => void;
  onBack: () => void;
}

export default function AuthPage({ onAuthSuccess, onBack }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { name, email, storeName, password };

      const data = await apiClient.post(endpoint, body);
      if (data && data.success) {
        if (data.token) {
          localStorage.setItem('leadgerx_token', data.token);
          if (data.storeId) {
            localStorage.setItem('leadgerx_active_store_id', data.storeId);
          }
        }
        onAuthSuccess(data.user, data.token);
      } else {
        setError(data?.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError('');
    try {
      const data = await apiClient.post('/api/auth/demo');
      if (data && data.success) {
        if (data.token) {
          localStorage.setItem('leadgerx_token', data.token);
          if (data.storeId) {
            localStorage.setItem('leadgerx_active_store_id', data.storeId);
          }
        }
        onAuthSuccess(data.user, data.token);
      } else {
        setError(data?.error || 'Demo mode initialization failed.');
      }
    } catch (e: any) {
      setError('Failed to activate demo mode. ' + (e.message || ''));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const data = await apiClient.post('/api/auth/google', { credential: 'mock-google-client-token' });
      if (data && data.success) {
        if (data.token) {
          localStorage.setItem('leadgerx_token', data.token);
          if (data.storeId) {
            localStorage.setItem('leadgerx_active_store_id', data.storeId);
          }
        }
        onAuthSuccess(data.user, data.token);
      } else {
        setError(data?.error || 'Google authentication failed.');
      }
    } catch (e: any) {
      setError('Google login: ' + (e.message || 'Google OAuth is not configured in this environment.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center p-6 relative overflow-hidden" id="auth-page-container">
      {/* Background shape */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 bg-slate-200/50 rounded-full blur-3xl -translate-y-12"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 z-10"
      >
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-11 w-11 bg-black rounded-xl items-center justify-center text-white font-black text-2xl shadow-sm mb-3">
            L
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            {isLogin ? 'Welcome back to LeadgerX' : 'Register your Store'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium leading-none">
            {isLogin ? 'Manage your bookkeeping and udhaar ledger' : 'Configure your shop in 30 seconds'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-lg border border-red-100 mb-5" id="auth-error-banner">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3.5 rounded-lg border border-emerald-100 mb-5">
            {infoMessage}
          </div>
        )}

        {/* Demo Mode Quick Access Banner */}
        <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Test Drive LeadgerX
            </p>
            <p className="text-[11px] text-slate-500">Explore pre-populated Suresh Kirana Store</p>
          </div>
          <button
            type="button"
            id="btn-quick-demo"
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {demoLoading ? 'Loading...' : 'Launch Demo'}
          </button>
        </div>

        <form onSubmit={handleSubmit} action="javascript:void(0);" method="POST" className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    id="input-reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 duration-150 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Store name / Business Title</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Store className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    id="input-reg-store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="E.g. Sharma General Store"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 duration-150 transition-all font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-mail Address</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                id="input-auth-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 duration-150 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                id="input-auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 duration-150 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-slate-600 mt-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 focus:ring-black h-3.5 w-3.5" 
              />
              Remember my store
            </label>
            <button 
              type="button" 
              id="btn-auth-forgot"
              onClick={() => setInfoMessage('Please check your email address for instructions to securely reset your password.')}
              className="text-slate-900 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            id="btn-auth-submit"
            disabled={loading}
            className="w-full py-3 bg-black hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all mt-4 disabled:bg-slate-400 cursor-pointer shadow-sm"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In to Dashboard' : 'Create Merchant Account'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <span className="relative bg-white px-3.5 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Or authenticate with</span>
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleLogin}
          id="btn-google-auth"
          disabled={loading}
          className="w-full py-2.5 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.111C18.28 1.845 15.539 1 12.24 1 5.922 1 1 5.922 1 12s4.922 11 11.24 11c6.598 0 11.02-4.636 11.02-11.21 0-.756-.08-1.332-.2-1.895l-10.82.39z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Toggle mode links */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            id="toggle-auth-mode"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setInfoMessage('');
            }}
            type="button"
            className="text-slate-900 font-bold hover:underline ml-1 cursor-pointer"
          >
            {isLogin ? 'Create free store' : 'Sign in here'}
          </button>
        </div>

        {/* Back and exit */}
        <button
          onClick={onBack}
          id="btn-auth-back-landing"
          type="button"
          className="w-full text-center text-[10px] uppercase text-slate-400 hover:text-slate-900 mt-6 font-bold tracking-widest block transition-colors cursor-pointer"
        >
          ← Go back to main site
        </button>
      </motion.div>
    </div>
  );
}
