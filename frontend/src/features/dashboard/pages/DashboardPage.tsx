// frontend/src/features/dashboard/pages/DashboardPage.tsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, LogOut, User, Mail, Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-lg tracking-wide text-white">MedShield-EHR</span>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                        <div>
                            <h1 className="text-xl font-bold text-white">System Session</h1>
                            <p className="text-sm text-slate-400">Authenticated via Secure HttpOnly Cookie</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                            {user?.role}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                            <User className="w-5 h-5 text-slate-500" />
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-medium">Username</div>
                                <div className="text-sm font-semibold text-white">{user?.username}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                            <Mail className="w-5 h-5 text-slate-500" />
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-medium">Email Address</div>
                                <div className="text-sm font-semibold text-white">{user?.email}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 flex items-center gap-4">
                    <Activity className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                        <div className="text-sm font-medium text-white">Security & Audit Notice</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                            All access and clinical requests are monitored under ISO 27799 audit requirements.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
