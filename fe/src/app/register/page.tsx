'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading: authLoading } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [consentChecked, setConsentChecked] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!consentChecked) {
            setError('You must consent to the data collection to register');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await register(email, password, name);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] flex items-center justify-center px-6 py-12">
            {/* Background gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#0000EE]/10 blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#411E10]/20 blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <span className="text-3xl font-heading font-bold text-white">DataVault</span>
                    </Link>
                    <p className="text-gray-400 mt-4">Create your personal data vault</p>
                </div>

                {/* Register Form */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                Full Name
                            </label>
                            <div className="relative flex items-center">
                                <User className="absolute left-4 w-5 h-5 text-gray-500" />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative flex items-center">
                                <Mail className="absolute left-4 w-5 h-5 text-gray-500" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 w-5 h-5 text-gray-500" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 w-5 h-5 text-gray-500" />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field pl-12"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* DPDPA Consent Card */}
                        <div className="p-4 bg-[#0a0a0a] border border-[#1f1f1f]">
                            <div className="flex items-start gap-3 mb-3">
                                <FileText className="w-5 h-5 text-[#0000EE] flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-1">DPDPA Consent Notice</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Under the Digital Personal Data Protection Act 2025 (Section 6-7),
                                        we collect your <strong className="text-gray-300">name</strong> and{' '}
                                        <strong className="text-gray-300">email</strong> for account authentication purposes.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 pt-3 border-t border-[#1f1f1f]">
                                <input
                                    type="checkbox"
                                    id="consent"
                                    checked={consentChecked}
                                    onChange={(e) => setConsentChecked(e.target.checked)}
                                    className="mt-1 w-4 h-4 accent-[#0000EE] bg-[#0a0a0a] border-[#1f1f1f]"
                                />
                                <label htmlFor="consent" className="text-xs text-gray-400 cursor-pointer">
                                    I consent to the collection and processing of my personal data.
                                    I understand I can <span className="text-[#0000EE]">withdraw consent</span> anytime
                                    from my dashboard.
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || authLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-[#0000EE]/30 border-t-[#0000EE] rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Create Vault
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-gray-400 mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#0000EE] hover:opacity-80 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer Notice */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    Your data is protected under DPDPA 2025.
                </p>
            </div>
        </div>
    );
}
