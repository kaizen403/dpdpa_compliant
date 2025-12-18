'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    StickyNote,
    Plus,
    Trash2,
    Pin,
    PinOff,
    X,
    Filter,
    Edit,
    Search
} from 'lucide-react';
import { api, SecureNote } from '@/lib/api';

const noteCategories = ['Personal', 'Work', 'Ideas', 'Finance', 'Health', 'Other'];

export default function NotesPage() {
    const [notes, setNotes] = useState<SecureNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<SecureNote | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Personal',
        isPinned: false,
    });

    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.notes.getAll(
                selectedCategory ? { category: selectedCategory } : undefined
            );
            setNotes(data);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) return;

        setIsSaving(true);
        try {
            if (editingId) {
                await api.notes.update(editingId, formData);
            } else {
                await api.notes.create(formData);
            }
            setShowModal(false);
            resetForm();
            fetchNotes();
        } catch (error) {
            console.error('Failed to save note:', error);
            alert('Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (note: SecureNote) => {
        setFormData({
            title: note.title,
            content: note.content || '',
            category: note.category || 'Personal',
            isPinned: note.isPinned,
        });
        setEditingId(note.id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await api.notes.delete(id);
            setNotes(notes.filter(n => n.id !== id));
            if (selectedNote?.id === id) setSelectedNote(null);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete note');
        }
    };

    const handleTogglePin = async (id: string) => {
        try {
            const updated = await api.notes.togglePin(id);
            setNotes(notes.map(n => n.id === id ? updated : n));
        } catch (error) {
            console.error('Toggle pin failed:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            category: 'Personal',
            isPinned: false,
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Secure Notes</h1>
                    <p className="text-gray-400 mt-1">
                        Encrypted notes for sensitive information
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Note
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex items-center flex-1">
                    <Search className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-12 w-full"
                    />
                </div>
                <div className="relative flex items-center">
                    <Filter className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input-field pl-12 pr-10 appearance-none cursor-pointer min-w-[180px]"
                    >
                        <option value="">All Categories</option>
                        {noteCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notes Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-[#0000EE]/30 border-t-[#0000EE] rounded-full animate-spin"></div>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <StickyNote className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Notes Yet</h3>
                    <p className="text-gray-400 mb-4">Create your first secure note</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Note
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredNotes.map((note) => (
                        <div
                            key={note.id}
                            className={`glass-card p-4 cursor-pointer card-hover ${note.isPinned ? 'border-l-2 border-l-[#0000EE]' : ''
                                }`}
                            onClick={() => setSelectedNote(note)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-white line-clamp-1">{note.title}</h4>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleTogglePin(note.id); }}
                                    className="p-1 hover:bg-[#141414] transition-colors"
                                >
                                    {note.isPinned
                                        ? <Pin className="w-4 h-4 text-[#0000EE]" />
                                        : <PinOff className="w-4 h-4 text-gray-500" />
                                    }
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-3 mb-3">
                                {note.contentPreview || note.content}
                            </p>
                            <div className="flex items-center justify-between">
                                {note.category && (
                                    <span className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-400">
                                        {note.category}
                                    </span>
                                )}
                                <span className="text-xs text-gray-500">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Note Detail Modal */}
            {selectedNote && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedNote(null)}
                >
                    <div
                        className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">{selectedNote.title}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(selectedNote)}
                                    className="p-2 hover:bg-[#141414] transition-colors"
                                >
                                    <Edit className="w-5 h-5 text-gray-400" />
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedNote.id)}
                                    className="p-2 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </button>
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className="p-2 hover:bg-[#141414] transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            {selectedNote.category && (
                                <span className="px-2 py-1 text-xs bg-violet-500/20 text-violet-400">
                                    {selectedNote.category}
                                </span>
                            )}
                            {selectedNote.isPinned && (
                                <span className="px-2 py-1 text-xs bg-[#0000EE]/20 text-[#0000EE] flex items-center gap-1">
                                    <Pin className="w-3 h-3" /> Pinned
                                </span>
                            )}
                        </div>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-gray-300 whitespace-pre-wrap">{selectedNote.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-[#1f1f1f]">
                            Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">
                                {editingId ? 'Edit Note' : 'Create Note'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#141414]">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Note title"
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Content <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Write your note..."
                                    className="input-field h-40 resize-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="input-field"
                                    >
                                        {noteCategories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer p-3 hover:bg-[#141414]">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPinned}
                                            onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                                            className="w-4 h-4 accent-[#0000EE]"
                                        />
                                        <Pin className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-400">Pin</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!formData.title || !formData.content || isSaving}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>{editingId ? 'Update' : 'Create'} Note</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
