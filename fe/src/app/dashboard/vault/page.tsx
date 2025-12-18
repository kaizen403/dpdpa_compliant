'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Lock,
    FileText,
    Key,
    StickyNote,
    Upload,
    Plus,
    ArrowRight,
    Shield,
    HardDrive
} from 'lucide-react';
import { api, FileStats, PasswordStats, NoteStats } from '@/lib/api';

export default function VaultPage() {
    const [fileStats, setFileStats] = useState<FileStats | null>(null);
    const [passwordStats, setPasswordStats] = useState<PasswordStats | null>(null);
    const [noteStats, setNoteStats] = useState<NoteStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [files, passwords, notes] = await Promise.all([
                    api.files.getStats().catch(() => null),
                    api.passwords.getStats().catch(() => null),
                    api.notes.getStats().catch(() => null),
                ]);
                setFileStats(files);
                setPasswordStats(passwords);
                setNoteStats(notes);
            } catch (error) {
                console.error('Failed to fetch vault stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const vaultSections = [
        {
            title: 'Secure Files',
            description: 'Upload and store sensitive documents',
            icon: FileText,
            href: '/dashboard/vault/files',
            stats: fileStats ? `${fileStats.totalFiles} files • ${formatBytes(fileStats.totalSize)}` : '0 files',
            color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            buttonText: 'Manage Files',
        },
        {
            title: 'Password Manager',
            description: 'Store website credentials securely',
            icon: Key,
            href: '/dashboard/vault/passwords',
            stats: passwordStats ? `${passwordStats.totalPasswords} passwords` : '0 passwords',
            color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            buttonText: 'Manage Passwords',
        },
        {
            title: 'Secure Notes',
            description: 'Encrypted notes and sensitive info',
            icon: StickyNote,
            href: '/dashboard/vault/notes',
            stats: noteStats ? `${noteStats.totalNotes} notes • ${noteStats.pinnedNotes} pinned` : '0 notes',
            color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
            buttonText: 'Manage Notes',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#411E10] flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Secure Vault</h1>
                    <p className="text-gray-400 mt-1">
                        Store and protect your sensitive data with DPDPA compliance
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0000EE]/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-[#0000EE]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {isLoading ? '...' : (fileStats?.totalFiles || 0) + (passwordStats?.totalPasswords || 0) + (noteStats?.totalNotes || 0)}
                            </p>
                            <p className="text-xs text-gray-400">Total Items</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/20 flex items-center justify-center">
                            <HardDrive className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {isLoading ? '...' : formatBytes(fileStats?.totalSize || 0)}
                            </p>
                            <p className="text-xs text-gray-400">Storage Used</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/20 flex items-center justify-center">
                            <Key className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {isLoading ? '...' : passwordStats?.totalPasswords || 0}
                            </p>
                            <p className="text-xs text-gray-400">Passwords</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-500/20 flex items-center justify-center">
                            <StickyNote className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {isLoading ? '...' : noteStats?.totalNotes || 0}
                            </p>
                            <p className="text-xs text-gray-400">Secure Notes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vault Sections */}
            <div className="grid md:grid-cols-3 gap-6">
                {vaultSections.map((section) => (
                    <div key={section.title} className="glass-card p-6 card-hover">
                        <div className={`w-14 h-14 ${section.color} border flex items-center justify-center mb-4`}>
                            <section.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">{section.description}</p>
                        <p className="text-sm text-gray-500 mb-4">{section.stats}</p>
                        <Link
                            href={section.href}
                            className="btn-secondary w-full flex items-center justify-center gap-2"
                        >
                            {section.buttonText}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/vault/files" className="btn-primary flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload File
                    </Link>
                    <Link href="/dashboard/vault/passwords" className="btn-secondary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Password
                    </Link>
                    <Link href="/dashboard/vault/notes" className="btn-secondary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create Note
                    </Link>
                </div>
            </div>

            {/* DPDPA Info */}
            <div className="glass-card p-6 bg-[#0000EE]/5 border-[#0000EE]/20">
                <h3 className="font-semibold text-white mb-2">DPDPA Vault Compliance</h3>
                <p className="text-sm text-gray-400">
                    All items in your vault are stored with purpose tracking (Section 5),
                    require your consent (Section 6-7), and can be exported or deleted
                    under your Data Principal rights (Section 11-12). Every action is
                    audit-logged for accountability (Section 8).
                </p>
            </div>
        </div>
    );
}
