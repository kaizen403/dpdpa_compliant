'use client';

import { useState } from 'react';
import {
    Download,
    FileJson,
    FileSpreadsheet,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Shield
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ExportPage() {
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const handleExport = async (format: 'json' | 'csv') => {
        setIsExporting(format);
        setExportSuccess(null);

        try {
            const data = await api.data.export(format);

            // Create download
            const blob = format === 'csv'
                ? new Blob([data], { type: 'text/csv' })
                : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `datavault-export-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportSuccess(format.toUpperCase());
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportAudit = async (format: 'json' | 'csv') => {
        setIsExporting(`audit-${format}`);

        try {
            const data = await api.audit.export(format);

            const blob = format === 'csv'
                ? new Blob([data], { type: 'text/csv' })
                : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportSuccess(`Audit ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Audit export failed:', error);
            alert('Failed to export audit logs');
        } finally {
            setIsExporting(null);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);

        try {
            const result = await api.data.deleteAll();
            alert(`Successfully deleted ${result.deletedCount} data items.`);
            setDeleteConfirm(false);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete data');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Export & Erasure Center</h1>
                <p className="text-slate-400 mt-1">
                    Exercise your right to data portability and erasure under DPDPA
                </p>
            </div>

            {/* Success Message */}
            {exportSuccess && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <p>Successfully exported data as {exportSuccess}!</p>
                </div>
            )}

            {/* Export Personal Data */}
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                        <Download className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Export Personal Data</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Download a copy of all your personal data in your preferred format
                        </p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleExport('json')}
                        disabled={isExporting !== null}
                        className="flex items-center gap-4 p-5 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <FileJson className="w-7 h-7 text-amber-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-white">JSON Format</h3>
                            <p className="text-sm text-slate-400">Machine-readable format</p>
                        </div>
                        {isExporting === 'json' ? (
                            <div className="ml-auto w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                        ) : (
                            <Download className="ml-auto w-5 h-5 text-slate-400" />
                        )}
                    </button>

                    <button
                        onClick={() => handleExport('csv')}
                        disabled={isExporting !== null}
                        className="flex items-center gap-4 p-5 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-white">CSV Format</h3>
                            <p className="text-sm text-slate-400">Spreadsheet compatible</p>
                        </div>
                        {isExporting === 'csv' ? (
                            <div className="ml-auto w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                        ) : (
                            <Download className="ml-auto w-5 h-5 text-slate-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Export Audit Logs */}
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Export Audit Logs</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Download a complete history of all actions taken on your data
                        </p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleExportAudit('json')}
                        disabled={isExporting !== null}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <FileJson className="w-6 h-6 text-amber-400" />
                        <span className="text-white font-medium">Export as JSON</span>
                        {isExporting === 'audit-json' && (
                            <div className="ml-auto w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                        )}
                    </button>

                    <button
                        onClick={() => handleExportAudit('csv')}
                        disabled={isExporting !== null}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                        <span className="text-white font-medium">Export as CSV</span>
                        {isExporting === 'audit-csv' && (
                            <div className="ml-auto w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* Right to Erasure */}
            <div className="glass-card p-6 rounded-2xl border-red-500/20">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Right to Erasure</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Request complete deletion of all your personal data (DPDPA Section 12)
                        </p>
                    </div>
                </div>

                {!deleteConfirm ? (
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-300">
                                    <strong>Warning:</strong> This action will permanently delete all your personal data
                                    from our systems. This cannot be undone. We recommend exporting your data first.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="btn-danger"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Request Data Deletion
                        </button>
                    </div>
                ) : (
                    <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            Confirm Complete Data Erasure
                        </h3>
                        <p className="text-sm text-slate-300 mb-4">
                            Are you absolutely sure you want to delete ALL your personal data?
                            This action is permanent and cannot be reversed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteAll}
                                disabled={isDeleting}
                                className="btn-danger flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Yes, Delete Everything
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DPDPA Info */}
            <div className="glass-card p-6 rounded-2xl bg-primary-500/5">
                <h3 className="font-semibold text-white mb-3">Your Rights Under DPDPA</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-xl bg-slate-800/30">
                        <h4 className="font-medium text-primary-400 mb-1">Data Portability (Section 12)</h4>
                        <p className="text-slate-400">
                            You have the right to receive your personal data in a structured,
                            commonly used, machine-readable format.
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/30">
                        <h4 className="font-medium text-primary-400 mb-1">Right to Erasure (Section 12)</h4>
                        <p className="text-slate-400">
                            You can request deletion of your personal data when it's no longer
                            necessary for the purpose it was collected.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
