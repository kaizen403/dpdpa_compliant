'use client';

import { useEffect, useState } from 'react';
import {
    FileText,
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Eye,
    Database,
    Trash2,
    Download,
    CheckCircle,
    XCircle,
    LogIn,
    LogOut,
    User,
    Upload,
    Key,
    StickyNote,
    Edit
} from 'lucide-react';
import {
    api,
    AuditLog,
    AuditAction,
    AuditStats,
    getActionLabel,
    formatDateTime
} from '@/lib/api';

const actionIcons: Partial<Record<AuditAction, any>> = {
    DATA_VIEW: Eye,
    DATA_CREATE: Database,
    DATA_UPDATE: Database,
    DATA_DELETE: Trash2,
    DATA_EXPORT: Download,
    CONSENT_GRANT: CheckCircle,
    CONSENT_WITHDRAW: XCircle,
    LOGIN: LogIn,
    LOGOUT: LogOut,
    PROFILE_UPDATE: User,
    FILE_UPLOAD: Upload,
    FILE_VIEW: Eye,
    FILE_DOWNLOAD: Download,
    FILE_DELETE: Trash2,
    PASSWORD_CREATE: Key,
    PASSWORD_VIEW: Eye,
    PASSWORD_UPDATE: Edit,
    PASSWORD_DELETE: Trash2,
    NOTE_CREATE: StickyNote,
    NOTE_VIEW: Eye,
    NOTE_UPDATE: Edit,
    NOTE_DELETE: Trash2,
};

const actionColors: Partial<Record<AuditAction, string>> = {
    DATA_VIEW: 'bg-blue-500/20 text-blue-400',
    DATA_CREATE: 'bg-emerald-500/20 text-emerald-400',
    DATA_UPDATE: 'bg-amber-500/20 text-amber-400',
    DATA_DELETE: 'bg-red-500/20 text-red-400',
    DATA_EXPORT: 'bg-violet-500/20 text-violet-400',
    CONSENT_GRANT: 'bg-emerald-500/20 text-emerald-400',
    CONSENT_WITHDRAW: 'bg-red-500/20 text-red-400',
    LOGIN: 'bg-[#411E10]/30 text-[#c67654]',
    LOGOUT: 'bg-slate-500/20 text-slate-400',
    PROFILE_UPDATE: 'bg-pink-500/20 text-pink-400',
    FILE_UPLOAD: 'bg-cyan-500/20 text-cyan-400',
    FILE_VIEW: 'bg-blue-500/20 text-blue-400',
    FILE_DOWNLOAD: 'bg-violet-500/20 text-violet-400',
    FILE_DELETE: 'bg-red-500/20 text-red-400',
    PASSWORD_CREATE: 'bg-emerald-500/20 text-emerald-400',
    PASSWORD_VIEW: 'bg-amber-500/20 text-amber-400',
    PASSWORD_UPDATE: 'bg-amber-500/20 text-amber-400',
    PASSWORD_DELETE: 'bg-red-500/20 text-red-400',
    NOTE_CREATE: 'bg-emerald-500/20 text-emerald-400',
    NOTE_VIEW: 'bg-blue-500/20 text-blue-400',
    NOTE_UPDATE: 'bg-amber-500/20 text-amber-400',
    NOTE_DELETE: 'bg-red-500/20 text-red-400',
};

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAction, setSelectedAction] = useState<AuditAction | ''>('');
    const [actions, setActions] = useState<AuditAction[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 15;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [logsData, statsData, actionsData] = await Promise.all([
                api.audit.getAll({
                    action: selectedAction || undefined,
                    page,
                    limit,
                }),
                api.audit.getStats(),
                api.audit.getActions(),
            ]);
            setLogs(logsData.logs);
            setTotalPages(logsData.pagination.totalPages);
            setStats(statsData);
            setActions(actionsData);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedAction, page]);

    const handleActionChange = (action: AuditAction | '') => {
        setSelectedAction(action);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
                <p className="text-slate-400 mt-1">
                    Complete history of all actions taken on your personal data
                </p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-xl">
                        <p className="text-2xl font-bold text-white">{stats.totalCount}</p>
                        <p className="text-sm text-slate-400">Total Actions</p>
                    </div>
                    <div className="glass-card p-4 rounded-xl">
                        <p className="text-2xl font-bold text-white">{stats.recentCount}</p>
                        <p className="text-sm text-slate-400">Last 7 Days</p>
                    </div>
                    <div className="glass-card p-4 rounded-xl col-span-2 md:col-span-1">
                        <p className="text-2xl font-bold text-white">
                            {Object.keys(stats.byAction).length}
                        </p>
                        <p className="text-sm text-slate-400">Action Types</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex items-center flex-1 max-w-xs">
                    <Filter className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <select
                        value={selectedAction}
                        onChange={(e) => handleActionChange(e.target.value as AuditAction | '')}
                        className="input-field pl-12 pr-10 appearance-none cursor-pointer w-full"
                    >
                        <option value="">All Actions</option>
                        {actions.map((action) => (
                            <option key={action} value={action}>
                                {getActionLabel(action)}
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

            {/* Logs Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Audit Logs</h3>
                    <p className="text-slate-400">
                        {selectedAction ? 'Try selecting a different action filter' : 'No actions have been logged yet'}
                    </p>
                </div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Action</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Entity</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400 hidden md:table-cell">Details</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400 hidden lg:table-cell">IP Address</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-400">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const Icon = actionIcons[log.action] || FileText;
                                    const colorClass = actionColors[log.action] || 'bg-slate-500/20 text-slate-400';

                                    return (
                                        <tr
                                            key={log.id}
                                            className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-white font-medium text-sm">
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-slate-300 text-sm">{log.entityType}</span>
                                                {log.entityId && (
                                                    <span className="text-slate-500 text-xs block truncate max-w-[100px]">
                                                        {log.entityId}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                {log.details ? (
                                                    <span className="text-slate-400 text-xs font-mono bg-slate-800 px-2 py-1 rounded">
                                                        {JSON.stringify(log.details).slice(0, 50)}
                                                        {JSON.stringify(log.details).length > 50 && '...'}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 hidden lg:table-cell">
                                                <span className="text-slate-400 text-sm font-mono">
                                                    {log.ipAddress || '—'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-slate-400 text-sm whitespace-nowrap">
                                                    {formatDateTime(log.timestamp)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-slate-700">
                            <p className="text-sm text-slate-400">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                                </button>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* DPDPA Info */}
            <div className="glass-card p-6 rounded-2xl bg-primary-500/5">
                <h3 className="font-semibold text-white mb-2">Accountability (DPDPA Section 8)</h3>
                <p className="text-sm text-slate-400">
                    Under DPDPA, data fiduciaries must maintain records of all data processing activities.
                    This audit log provides complete transparency into how your personal data is accessed,
                    modified, exported, or deleted, ensuring full accountability.
                </p>
            </div>
        </div>
    );
}
