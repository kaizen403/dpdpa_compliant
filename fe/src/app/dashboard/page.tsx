'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Database,
    CheckCircle,
    Clock,
    Shield,
    User,
    Mail,
    CreditCard,
    Settings,
    Activity,
    AlertTriangle,
    ArrowRight,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api, DataStats, AuditLog, getCategoryLabel, getActionLabel, formatDateTime } from '@/lib/api';

const categoryIcons: Record<string, any> = {
    IDENTITY: User,
    CONTACT: Mail,
    FINANCIAL: CreditCard,
    USAGE: Settings,
    ACTIVITY: Activity,
    SENSITIVE: AlertTriangle,
};

const categoryColors: Record<string, string> = {
    IDENTITY: 'from-blue-500 to-blue-600',
    CONTACT: 'from-emerald-500 to-emerald-600',
    FINANCIAL: 'from-amber-500 to-amber-600',
    USAGE: 'from-violet-500 to-violet-600',
    ACTIVITY: 'from-pink-500 to-pink-600',
    SENSITIVE: 'from-red-500 to-red-600',
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DataStats | null>(null);
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, logsData] = await Promise.all([
                    api.data.getStats(),
                    api.audit.getAll({ limit: 5 }),
                ]);
                setStats(statsData);
                setRecentLogs(logsData.logs);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Welcome back, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-slate-400 mt-1">
                    Here's an overview of your personal data vault
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <Database className="w-6 h-6 text-primary-400" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.totalData || 0}</p>
                    <p className="text-slate-400 text-sm">Total Data Items</p>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.activeConsents || 0}</p>
                    <p className="text-slate-400 text-sm">Active Consents</p>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-violet-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.recentActivity || 0}</p>
                    <p className="text-slate-400 text-sm">Actions (7 days)</p>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-amber-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {stats?.totalData && stats.activeConsents
                            ? Math.round((stats.activeConsents / stats.totalData) * 100)
                            : 0}%
                    </p>
                    <p className="text-slate-400 text-sm">Privacy Score</p>
                </div>
            </div>

            {/* Data Categories */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Data by Category</h2>
                    <Link
                        href="/dashboard/data"
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
                    >
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(categoryColors).map(([category, gradient]) => {
                        const Icon = categoryIcons[category] || Database;
                        const count = stats?.byCategory?.[category] || 0;
                        return (
                            <Link
                                key={category}
                                href={`/dashboard/data?category=${category}`}
                                className="glass-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} mx-auto mb-3 flex items-center justify-center`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-white">{count}</p>
                                <p className="text-xs text-slate-400">{getCategoryLabel(category as any)}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                        <Link
                            href="/dashboard/audit"
                            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                        >
                            View All
                        </Link>
                    </div>
                    {recentLogs.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">No recent activity</p>
                    ) : (
                        <div className="space-y-4">
                            {recentLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                        <Activity className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium">{getActionLabel(log.action)}</p>
                                        <p className="text-sm text-slate-400">{log.entityType}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">{formatDateTime(log.timestamp)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link
                            href="/dashboard/data"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Database className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">View My Data</p>
                                <p className="text-sm text-slate-400">See all personal data items</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
                        </Link>

                        <Link
                            href="/dashboard/consents"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Manage Consents</p>
                                <p className="text-sm text-slate-400">Grant or withdraw consent</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
                        </Link>

                        <Link
                            href="/dashboard/export"
                            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Export My Data</p>
                                <p className="text-sm text-slate-400">Download in JSON or CSV</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* DPDPA Rights Banner */}
            <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-primary-500/10 to-accent-500/10">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Your DPDPA Rights</h3>
                        <p className="text-slate-300 text-sm mb-3">
                            Under the Digital Personal Data Protection Act 2025, you have the right to access,
                            correct, erase, and port your personal data. DataVault makes exercising these rights simple.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-300">Right to Access</span>
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-300">Right to Erasure</span>
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-300">Data Portability</span>
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-300">Consent Management</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
