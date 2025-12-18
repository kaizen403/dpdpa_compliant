'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Key,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Copy,
    ExternalLink,
    X,
    Filter,
    Edit,
    Check,
    Globe
} from 'lucide-react';
import { api, PasswordEntry } from '@/lib/api';

const passwordCategories = ['Work', 'Personal', 'Finance', 'Social', 'Shopping', 'Other'];

export default function PasswordsPage() {
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        websiteName: '',
        websiteUrl: '',
        username: '',
        password: '',
        notes: '',
        category: 'Personal',
    });

    const fetchPasswords = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.passwords.getAll(selectedCategory || undefined);
            setPasswords(data);
        } catch (error) {
            console.error('Failed to fetch passwords:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchPasswords();
    }, [fetchPasswords]);

    const handleSubmit = async () => {
        if (!formData.websiteName || !formData.username || !formData.password) return;

        setIsSaving(true);
        try {
            if (editingId) {
                await api.passwords.update(editingId, formData);
            } else {
                await api.passwords.create(formData);
            }
            setShowModal(false);
            resetForm();
            fetchPasswords();
        } catch (error) {
            console.error('Failed to save password:', error);
            alert('Failed to save password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = async (password: PasswordEntry) => {
        // Fetch decrypted password
        try {
            const decrypted = await api.passwords.getById(password.id, true);
            setFormData({
                websiteName: decrypted.websiteName,
                websiteUrl: decrypted.websiteUrl || '',
                username: decrypted.username,
                password: decrypted.password || '',
                notes: decrypted.notes || '',
                category: decrypted.category || 'Personal',
            });
            setEditingId(password.id);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to fetch password:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this password?')) return;

        try {
            await api.passwords.delete(id);
            setPasswords(passwords.filter(p => p.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete password');
        }
    };

    const togglePasswordVisibility = async (id: string) => {
        if (visiblePasswords.has(id)) {
            setVisiblePasswords(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } else {
            try {
                const decrypted = await api.passwords.getById(id, true);
                setPasswords(prev => prev.map(p =>
                    p.id === id ? { ...p, password: decrypted.password } : p
                ));
                setVisiblePasswords(prev => new Set(prev).add(id));
            } catch (error) {
                console.error('Failed to decrypt:', error);
            }
        }
    };

    const copyToClipboard = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    };

    const copyPassword = async (id: string) => {
        try {
            const decrypted = await api.passwords.getById(id, true);
            if (decrypted.password) {
                await copyToClipboard(id + '-pw', decrypted.password);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            websiteName: '',
            websiteUrl: '',
            username: '',
            password: '',
            notes: '',
            category: 'Personal',
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Password Manager</h1>
                    <p className="text-gray-400 mt-1">
                        Store website credentials securely
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Password
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <div className="relative flex items-center">
                    <Filter className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input-field pl-12 pr-10 appearance-none cursor-pointer min-w-[180px]"
                    >
                        <option value="">All Categories</option>
                        {passwordCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Passwords List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-[#0000EE]/30 border-t-[#0000EE] rounded-full animate-spin"></div>
                </div>
            ) : passwords.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Key className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Passwords Yet</h3>
                    <p className="text-gray-400 mb-4">Store your first password securely</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Password
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {passwords.map((password) => (
                        <div key={password.id} className="glass-card p-4">
                            <div className="flex items-center gap-4">
                                {/* Icon */}
                                <div className="w-12 h-12 bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <Globe className="w-6 h-6 text-amber-400" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-white">{password.websiteName}</h4>
                                        {password.websiteUrl && (
                                            <a
                                                href={password.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#0000EE] hover:opacity-80"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">{password.username}</p>
                                    {password.category && (
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-[#411E10]/20 text-[#c67654]">
                                            {password.category}
                                        </span>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-gray-400">
                                        {visiblePasswords.has(password.id)
                                            ? password.password
                                            : '••••••••'}
                                    </span>
                                    <button
                                        onClick={() => togglePasswordVisibility(password.id)}
                                        className="p-2 hover:bg-[#141414] transition-colors"
                                    >
                                        {visiblePasswords.has(password.id)
                                            ? <EyeOff className="w-4 h-4 text-gray-400" />
                                            : <Eye className="w-4 h-4 text-gray-400" />
                                        }
                                    </button>
                                    <button
                                        onClick={() => copyPassword(password.id)}
                                        className="p-2 hover:bg-[#141414] transition-colors"
                                    >
                                        {copiedId === password.id + '-pw'
                                            ? <Check className="w-4 h-4 text-emerald-400" />
                                            : <Copy className="w-4 h-4 text-gray-400" />
                                        }
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(password)}
                                        className="p-2 hover:bg-[#141414] transition-colors"
                                    >
                                        <Edit className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(password.id)}
                                        className="p-2 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">
                                {editingId ? 'Edit Password' : 'Add Password'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#141414]">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Website Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.websiteName}
                                    onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                                    placeholder="e.g., Google"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                                <input
                                    type="url"
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                    placeholder="https://google.com"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Username/Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="your@email.com"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input-field"
                                >
                                    {passwordCategories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes..."
                                    className="input-field h-20 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!formData.websiteName || !formData.username || !formData.password || isSaving}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {editingId ? 'Update' : 'Save'} Password
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
