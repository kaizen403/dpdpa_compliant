'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Search,
    Filter,
    Trash2,
    Eye,
    X,
    User,
    Mail,
    CreditCard,
    Settings,
    Activity,
    AlertTriangle,
    Calendar,
    Building,
    Clock,
    CheckCircle
} from 'lucide-react';
import {
    api,
    PersonalData,
    DataCategory,
    getCategoryLabel,
    formatDate,
    formatDateTime
} from '@/lib/api';

const categories: { value: DataCategory | ''; label: string }[] = [
    { value: '', label: 'All Categories' },
    { value: 'IDENTITY', label: 'Identity' },
    { value: 'CONTACT', label: 'Contact' },
    { value: 'FINANCIAL', label: 'Financial' },
    { value: 'USAGE', label: 'Usage' },
    { value: 'ACTIVITY', label: 'Activity' },
    { value: 'SENSITIVE', label: 'Sensitive' },
];

const categoryIcons: Record<string, any> = {
    IDENTITY: User,
    CONTACT: Mail,
    FINANCIAL: CreditCard,
    USAGE: Settings,
    ACTIVITY: Activity,
    SENSITIVE: AlertTriangle,
};

export default function DataPage() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('category') as DataCategory | null;

    const [data, setData] = useState<PersonalData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<DataCategory | ''>(initialCategory || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<PersonalData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: { category?: DataCategory; search?: string } = {};
            if (selectedCategory) params.category = selectedCategory;
            if (searchQuery) params.search = searchQuery;

            const result = await api.data.getAll(params);
            setData(result);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this data item? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.data.delete(id);
            setData(data.filter(item => item.id !== id));
            setSelectedItem(null);
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete data item');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">My Personal Data</h1>
                <p className="text-slate-400 mt-1">
                    View and manage all personal data collected about you
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex items-center flex-1">
                    <Search className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, value, or purpose..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-12 w-full"
                    />
                </div>
                <div className="relative flex items-center">
                    <Filter className="absolute left-4 w-5 h-5 text-gray-500 pointer-events-none" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as DataCategory | '')}
                        className="input-field pl-12 pr-10 appearance-none cursor-pointer min-w-[180px]"
                    >
                        {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
            ) : data.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Data Found</h3>
                    <p className="text-slate-400">
                        {searchQuery || selectedCategory
                            ? 'Try adjusting your search or filters'
                            : 'No personal data has been collected yet'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.map((item) => {
                        const Icon = categoryIcons[item.category] || User;
                        const hasConsent = item.consents && item.consents.length > 0;

                        return (
                            <div
                                key={item.id}
                                className="glass-card p-5 rounded-2xl hover:bg-slate-800/80 transition-colors cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center badge-${item.category.toLowerCase()}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate">{item.fieldName}</h3>
                                        <p className="text-sm text-slate-400 truncate">{item.fieldValue}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium badge-${item.category.toLowerCase()}`}>
                                        {getCategoryLabel(item.category)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {hasConsent ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        )}
                                        <span className="text-xs text-slate-400">
                                            {hasConsent ? 'Consented' : 'No consent'}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                                    Purpose: {item.purpose}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="glass-card p-6 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Data Details</h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Field Info */}
                            <div className="p-4 rounded-xl bg-slate-800/50">
                                <p className="text-sm text-slate-400 mb-1">{getCategoryLabel(selectedItem.category)}</p>
                                <p className="text-lg font-semibold text-white">{selectedItem.fieldName}</p>
                                <p className="text-primary-400 mt-1">{selectedItem.fieldValue}</p>
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Eye className="w-4 h-4" />
                                        <span className="text-xs">Purpose</span>
                                    </div>
                                    <p className="text-sm text-white">{selectedItem.purpose}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Building className="w-4 h-4" />
                                        <span className="text-xs">Data Controller</span>
                                    </div>
                                    <p className="text-sm text-white">{selectedItem.dataController}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs">Collected On</span>
                                    </div>
                                    <p className="text-sm text-white">{formatDate(selectedItem.collectedAt)}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs">Retention</span>
                                    </div>
                                    <p className="text-sm text-white">{selectedItem.retentionDays} days</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-800/50">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <span className="text-xs">Source</span>
                                </div>
                                <p className="text-sm text-white">{selectedItem.source}</p>
                            </div>

                            {/* Consent Status */}
                            <div className="p-4 rounded-xl bg-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">Consent Status</span>
                                    {selectedItem.consents && selectedItem.consents.length > 0 ? (
                                        <span className="badge-granted px-3 py-1 rounded-full text-xs font-medium">
                                            Granted
                                        </span>
                                    ) : (
                                        <span className="badge-pending px-3 py-1 rounded-full text-xs font-medium">
                                            No Consent
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleDelete(selectedItem.id)}
                                    disabled={isDeleting}
                                    className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Delete Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
