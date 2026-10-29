// frontend/src/features/auth/pages/LoginPage.tsx
// IMPORT MOULE.
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login({ username, password });
            alert('เข้าสู่ระบบสำเร็จ!');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
                
                {/* 🛡️ Header โลโก้ระบบ MedShield-EHR */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-3 text-emerald-400">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">MedShield-EHR</h1>
                    <p className="text-sm text-slate-400 mt-1">Healthcare Information System (ISO 27799 / NIST)</p>
                </div>
                {/* ⚠️ กล่องแจ้งเตือน Error */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
                {/* 📝 ฟอร์มกรอกข้อมูล */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="กรอกชื่อผู้ใช้ เช่น dr_house"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>กำลังยืนยันตัวตน...</span>
                            </>
                        ) : (
                            <span>เข้าสู่ระบบ (Sign In)</span>
                        )}
                    </button>
                </form>
                <div className="mt-6 text-center text-xs text-slate-500">
                    Protected by NIST SP 800-63B Rate Limiting
                </div>
            </div>
        </div>
    );
};