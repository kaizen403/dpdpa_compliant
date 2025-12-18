'use client';

import { useState } from 'react';
import {
    User,
    Mail,
    Shield,
    Calendar,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/api';

export default function SettingsPage() {
    const { user } = useAuth();
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 mt-1">
                    Manage your account and privacy preferences
                </p>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <p>Settings saved successfully!</p>
                </div>
            )}

            {/* Profile Section */}
            <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50">
                        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-400">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-white">{user?.name}</p>
                            <p className="text-slate-400">{user?.email}</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                defaultValue={user?.name}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                defaultValue={user?.email}
                                disabled
                                className="input-field opacity-60"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>Account created: {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}</span>
                    </div>
                </div>
            </div>

            {/* Privacy Settings */}
            <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-6">Privacy Settings</h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                        <div>
                            <p className="font-medium text-white">Activity Tracking</p>
                            <p className="text-sm text-slate-400">Record login times and IP addresses</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                        <div>
                            <p className="font-medium text-white">Email Notifications</p>
                            <p className="text-sm text-slate-400">Receive alerts about data access</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                        <div>
                            <p className="font-medium text-white">Audit Log Retention</p>
                            <p className="text-sm text-slate-400">Keep detailed logs of all data access</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* DPDPA Rights Summary */}
            <div className="glass-card p-6 rounded-2xl bg-primary-500/5">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Your DPDPA Rights</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Right to access your personal data
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Right to correction of inaccurate data
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Right to erasure of personal data
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Right to data portability
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Right to withdraw consent
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                Right to grievance redressal
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button onClick={handleSave} className="btn-primary">
                Save Changes
            </button>

            {/* Legal Notice */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400">
                        DataVault is designed to demonstrate DPDPA compliance features.
                        All data is stored locally and securely. For any concerns about your
                        personal data, please contact the Data Protection Officer.
                    </p>
                </div>
            </div>
        </div>
    );
}
