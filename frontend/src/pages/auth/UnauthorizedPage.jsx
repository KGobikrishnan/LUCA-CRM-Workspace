import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <ShieldAlert className="w-12 h-12 text-red-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-800 rounded-full border-2 border-red-500/40 flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Access Denied</h1>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px w-12 bg-red-500/40" />
              <span className="text-red-400 text-xs font-black uppercase tracking-widest">403 Forbidden</span>
              <div className="h-px w-12 bg-red-500/40" />
            </div>

            {/* Message box */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-300 mb-1">Restricted Access</p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    You do not have the required permissions to view this page. This section is restricted to <span className="text-white font-bold">Admin</span> and <span className="text-white font-bold">Super Admin</span> roles only.
                  </p>
                </div>
              </div>
            </div>

            {/* Port-forward notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 text-left">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">⚠ External Access Notice</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you accessed this workspace via a <span className="text-amber-300 font-bold">port-forwarded link</span>, please be aware that your account does not have the clearance needed for this section. Contact your system administrator for elevated access.
              </p>
            </div>

            {/* Back button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Return to Dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs font-medium mt-6">
          Navi Promo — Enterprise Workspace · Access Control System
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
