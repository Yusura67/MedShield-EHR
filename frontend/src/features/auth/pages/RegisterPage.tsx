// frontend/src/features/auth/pages/RegisterPage.tsx
// IMPORT MODULES.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Mail, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { registerApi } from '../api/auth.api';
import type { Role } from '../types';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('doctor');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            await registerApi({ username, email, password, role });
            setSuccessMessage('สมัครสมาชิกสำเร็จ! กำลังพาคุณไปหน้าเข้าสู่ระบบ...');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Registration failed. Please check your inputs.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
                
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-3 text-emerald-400">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">สร้างบัญชีผู้ใช้ใหม่</h1>
                    <p className="text-sm text-slate-400 mt-1">MedShield-EHR Access Registration</p>
                </div>

                {/* กล่องแจ้งเตือน Error */}
                {error && (
                    <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* กล่องแจ้งเตือนสำเร็จ */}
                {successMessage && (
                    <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* ฟอร์มสมัครสมาชิก */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="เช่น dr_somchai"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@hospital.com"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                            Password (ขั้นต่ำ 8 ตัวอักษร)
                        </label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-11 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                            System Role (บทบาทในระบบ)
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as Role)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                        >
                            <option value="doctor">แพทย์ (Doctor)</option>
                            <option value="nurse">พยาบาล (Nurse)</option>
                            <option value="patient">ผู้ป่วย (Patient)</option>
                            <option value="auditor">ผู้ตรวจการ (Auditor)</option>
                        </select>
                    </div>

                    {/* ปุ่มยืนยัน */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>กำลังบันทึกข้อมูล...</span>
                            </>
                        ) : (
                            <span>ลงทะเบียนบัญชี (Register)</span>
                        )}
                    </button>
                </form>

                {/* ลิงก์กลับไปหน้า Login */}
                <div className="mt-6 text-center text-sm text-slate-400">
                    มีบัญชีผู้ใช้อยู่แล้ว?{' '}
                    <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline">
                        เข้าสู่ระบบที่นี่
                    </Link>
                </div>
            </div>
        </main>
    );
};