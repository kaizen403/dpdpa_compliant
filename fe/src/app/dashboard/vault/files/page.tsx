'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    FileText,
    Upload,
    Trash2,
    Download,
    X,
    File,
    Image,
    FileSpreadsheet,
    Filter,
    Plus
} from 'lucide-react';
import { api, SecureFile, FileCategory } from '@/lib/api';

const fileCategories: { value: FileCategory | ''; label: string }[] = [
    { value: '', label: 'All Categories' },
    { value: 'DOCUMENT', label: 'Documents' },
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'MEDICAL', label: 'Medical' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'PERSONAL', label: 'Personal' },
    { value: 'OTHER', label: 'Other' },
];

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    return File;
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function FilesPage() {
    const [files, setFiles] = useState<SecureFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<FileCategory | ''>('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPurpose, setUploadPurpose] = useState('');
    const [uploadCategory, setUploadCategory] = useState<FileCategory>('DOCUMENT');
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.files.getAll(selectedCategory || undefined);
            setFiles(data);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleUpload = async () => {
        if (!uploadFile || !uploadPurpose) return;

        setIsUploading(true);
        try {
            await api.files.upload(uploadFile, uploadPurpose, uploadCategory);
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadPurpose('');
            fetchFiles();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (file: SecureFile) => {
        try {
            await api.files.download(file.id, file.originalName);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await api.files.delete(id);
            setFiles(files.filter(f => f.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete file');
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setUploadFile(e.dataTransfer.files[0]);
            setShowUploadModal(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Secure Files</h1>
                    <p className="text-gray-400 mt-1">
                        Upload and manage sensitive documents
                    </p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    Upload File
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <div className="relative flex items-center">
                    <Filter className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as FileCategory | '')}
                        className="input-field pl-12 pr-10 appearance-none cursor-pointer min-w-[180px]"
                    >
                        {fileCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-8 text-center transition-colors ${dragActive ? 'border-[#0000EE] bg-[#0000EE]/10' : 'border-[#1f1f1f]'
                    }`}
            >
                <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Drag and drop files here, or click Upload</p>
                <p className="text-xs text-gray-500 mt-1">Max 10MB • PDF, Images, Documents</p>
            </div>

            {/* Files Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-[#0000EE]/30 border-t-[#0000EE] rounded-full animate-spin"></div>
                </div>
            ) : files.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Files Yet</h3>
                    <p className="text-gray-400 mb-4">Upload your first secure file</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Upload File
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {files.map((file) => {
                        const FileIcon = getFileIcon(file.mimeType);
                        return (
                            <div key={file.id} className="glass-card p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-[#141414] flex items-center justify-center flex-shrink-0">
                                        <FileIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-white truncate">{file.originalName}</h4>
                                        <p className="text-xs text-gray-500">{formatBytes(file.fileSize)}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-[#411E10]/20 text-[#c67654]">
                                            {file.category}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                                    Purpose: {file.purpose}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-1"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Upload File</h2>
                            <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-[#141414]">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* File Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="input-field file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-[#0000EE] file:text-white file:cursor-pointer"
                                />
                                {uploadFile && (
                                    <p className="text-sm text-gray-400 mt-1">{uploadFile.name}</p>
                                )}
                            </div>

                            {/* Purpose (DPDPA required) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Purpose <span className="text-red-400">*</span>
                                    <span className="text-xs text-gray-500 ml-2">(DPDPA Required)</span>
                                </label>
                                <input
                                    type="text"
                                    value={uploadPurpose}
                                    onChange={(e) => setUploadPurpose(e.target.value)}
                                    placeholder="e.g., Tax document for FY 2024"
                                    className="input-field"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value as FileCategory)}
                                    className="input-field"
                                >
                                    {fileCategories.slice(1).map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!uploadFile || !uploadPurpose || isUploading}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload
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
