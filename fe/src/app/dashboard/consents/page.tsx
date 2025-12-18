'use client';

import { useEffect, useState } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    ToggleLeft,
    ToggleRight,
    Filter,
    RefreshCw
} from 'lucide-react';
import {
    api,
    Consent,
    ConsentStatus,
    ConsentStats,
    getCategoryLabel,
    formatDate,
    formatDateTime
} from '@/lib/api';

const statusFilters: { value: ConsentStatus | ''; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'GRANTED', label: 'Granted' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'EXPIRED', label: 'Expired' },
];

const statusIcons: Record<ConsentStatus, any> = {
    GRANTED: CheckCircle,
    WITHDRAWN: XCircle,
    PENDING: Clock,
    EXPIRED: AlertTriangle,
};

const statusColors: Record<ConsentStatus, string> = {
    GRANTED: 'text-emerald-400',
    WITHDRAWN: 'text-red-400',
    PENDING: 'text-amber-400',
    EXPIRED: 'text-slate-400',
};

export default function ConsentsPage() {
    const [consents, setConsents] = useState<Consent[]>([]);
    const [stats, setStats] = useState<ConsentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<ConsentStatus | ''>('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [consentsData, statsData] = await Promise.all([
                api.consent.getAll(selectedStatus || undefined),
                api.consent.getStats(),
            ]);
            setConsents(consentsData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch consents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedStatus]);

    const handleToggleConsent = async (consent: Consent) => {
        setProcessingId(consent.id);
        try {
            if (consent.status === 'GRANTED') {
                await api.consent.withdraw(consent.id);
            } else {
                await api.consent.grant(consent.id);
            }
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle consent:', error);
            alert('Failed to update consent');
        } finally {
            setProcessingId(null);
        }
    };

    const handleWithdrawAll = async () => {
        if (!confirm('Are you sure you want to withdraw ALL consents? This action can be reversed by re-granting individual consents.')) {
            return;
        }

        setIsLoading(true);
        try {
            await api.consent.withdrawAll();
            await fetchData();
        } catch (error) {
            console.error('Failed to withdraw all:', error);
            alert('Failed to withdraw all consents');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Consent Management</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your consent for data collection and processing
                    </p>
                </div>
                <button
                    onClick={handleWithdrawAll}
                    className="btn-danger flex items-center gap-2 whitespace-nowrap"
                >
                    <XCircle className="w-4 h-4" />
                    Withdraw All
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.GRANTED}</p>
                                <p className="text-xs text-slate-400">Granted</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.WITHDRAWN}</p>
                                <p className="text-xs text-slate-400">Withdrawn</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.PENDING}</p>
                                <p className="text-xs text-slate-400">Pending</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.EXPIRED}</p>
                                <p className="text-xs text-slate-400">Expired</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-4">
                <div className="relative flex items-center">
                    <Filter className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as ConsentStatus | '')}
                        className="input-field pl-12 pr-10 appearance-none cursor-pointer min-w-[180px]"
                    >
                        {statusFilters.map((filter) => (
                            <option key={filter.value} value={filter.value}>
                                {filter.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={fetchData}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Consents List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
            ) : consents.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Consents Found</h3>
                    <p className="text-slate-400">
                        {selectedStatus ? 'Try selecting a different status filter' : 'No consent records available'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {consents.map((consent) => {
                        const StatusIcon = statusIcons[consent.status];
                        const isProcessing = processingId === consent.id;
                        const canToggle = consent.status === 'GRANTED' || consent.status === 'WITHDRAWN';

                        return (
                            <div
                                key={consent.id}
                                className="glass-card p-5 rounded-2xl hover:bg-slate-800/80 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Status Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${consent.status === 'GRANTED' ? 'bg-emerald-500/20' :
                                        consent.status === 'WITHDRAWN' ? 'bg-red-500/20' :
                                            consent.status === 'PENDING' ? 'bg-amber-500/20' :
                                                'bg-slate-500/20'
                                        }`}>
                                        <StatusIcon className={`w-6 h-6 ${statusColors[consent.status]}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white">
                                            {consent.personalData?.fieldName || 'General Consent'}
                                        </h3>
                                        <p className="text-sm text-slate-400 truncate">{consent.purpose}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            {consent.personalData && (
                                                <span className={`badge-${consent.personalData.category.toLowerCase()} px-2 py-0.5 rounded-full`}>
                                                    {getCategoryLabel(consent.personalData.category)}
                                                </span>
                                            )}
                                            {consent.grantedAt && (
                                                <span>Granted: {formatDate(consent.grantedAt)}</span>
                                            )}
                                            {consent.expiresAt && (
                                                <span>Expires: {formatDate(consent.expiresAt)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Toggle */}
                                    {canToggle && (
                                        <button
                                            onClick={() => handleToggleConsent(consent)}
                                            disabled={isProcessing}
                                            className={`p-2 rounded-xl transition-all ${consent.status === 'GRANTED'
                                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                                                : 'bg-slate-700 hover:bg-slate-600'
                                                }`}
                                        >
                                            {isProcessing ? (
                                                <div className="w-8 h-8 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                                                </div>
                                            ) : consent.status === 'GRANTED' ? (
                                                <ToggleRight className="w-8 h-8 text-emerald-400" />
                                            ) : (
                                                <ToggleLeft className="w-8 h-8 text-slate-400" />
                                            )}
                                        </button>
                                    )}

                                    {/* Status Badge for non-toggleable */}
                                    {!canToggle && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium badge-${consent.status.toLowerCase()}`}>
                                            {consent.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Banner */}
            <div className="glass-card p-6 rounded-2xl bg-primary-500/5 border-primary-500/20">
                <h3 className="font-semibold text-white mb-2">About Consent (DPDPA Section 6-7)</h3>
                <p className="text-sm text-slate-400">
                    Under DPDPA, your consent must be freely given, specific, informed, and unambiguous.
                    You have the right to withdraw consent at any time. When you withdraw consent,
                    the associated data processing will stop, though the data may be retained for
                    legal compliance purposes.
                </p>
            </div>
        </div>
    );
}
