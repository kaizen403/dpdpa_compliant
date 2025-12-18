const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    updatedAt?: string;
    _count?: {
        personalData: number;
        consents: number;
    };
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface PersonalData {
    id: string;
    userId: string;
    category: DataCategory;
    fieldName: string;
    fieldValue: string;
    purpose: string;
    collectedAt: string;
    source: string;
    dataController: string;
    retentionDays: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    consents?: Consent[];
}

export type DataCategory =
    | 'IDENTITY'
    | 'CONTACT'
    | 'FINANCIAL'
    | 'USAGE'
    | 'ACTIVITY'
    | 'SENSITIVE';

export interface Consent {
    id: string;
    userId: string;
    personalDataId?: string;
    purpose: string;
    status: ConsentStatus;
    grantedAt?: string;
    withdrawnAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    personalData?: PersonalData;
}

export type ConsentStatus = 'GRANTED' | 'WITHDRAWN' | 'EXPIRED' | 'PENDING';

export interface AuditLog {
    id: string;
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}

export type AuditAction =
    | 'DATA_VIEW'
    | 'DATA_CREATE'
    | 'DATA_UPDATE'
    | 'DATA_DELETE'
    | 'DATA_EXPORT'
    | 'CONSENT_GRANT'
    | 'CONSENT_WITHDRAW'
    | 'LOGIN'
    | 'LOGOUT'
    | 'PROFILE_UPDATE'
    | 'FILE_UPLOAD'
    | 'FILE_VIEW'
    | 'FILE_DOWNLOAD'
    | 'FILE_DELETE'
    | 'PASSWORD_CREATE'
    | 'PASSWORD_VIEW'
    | 'PASSWORD_UPDATE'
    | 'PASSWORD_DELETE'
    | 'NOTE_CREATE'
    | 'NOTE_VIEW'
    | 'NOTE_UPDATE'
    | 'NOTE_DELETE';

// Vault Types
export type FileCategory =
    | 'DOCUMENT'
    | 'FINANCIAL'
    | 'MEDICAL'
    | 'LEGAL'
    | 'PERSONAL'
    | 'OTHER';

export interface SecureFile {
    id: string;
    userId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    purpose: string;
    category: FileCategory;
    filePath?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PasswordEntry {
    id: string;
    userId: string;
    websiteName: string;
    websiteUrl?: string;
    username: string;
    encryptedPassword: string;
    password?: string; // Decrypted, only when requested
    notes?: string;
    category?: string;
    lastUsed?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SecureNote {
    id: string;
    userId: string;
    title: string;
    content: string;
    contentPreview?: string;
    category?: string;
    isPinned: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FileStats {
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, number>;
}

export interface PasswordStats {
    totalPasswords: number;
    byCategory: Record<string, number>;
    recentlyUsed: number;
}

export interface NoteStats {
    totalNotes: number;
    pinnedNotes: number;
    byCategory: Record<string, number>;
}

export interface DataStats {
    totalData: number;
    byCategory: Record<string, number>;
    activeConsents: number;
    recentActivity: number;
}

export interface ConsentStats {
    GRANTED: number;
    WITHDRAWN: number;
    EXPIRED: number;
    PENDING: number;
}

export interface AuditStats {
    byAction: Record<string, number>;
    recentCount: number;
    totalCount: number;
}

export interface PaginatedResponse<T> {
    logs: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// API Client
class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        // Handle blob responses (for exports)
        const contentType = response.headers.get('content-type');
        const acceptHeader = options.headers && typeof options.headers === 'object' && 'Accept' in options.headers
            ? (options.headers as Record<string, string>)['Accept']
            : undefined;
        if (contentType?.includes('text/csv') || acceptHeader === 'text/csv') {
            return response.blob() as unknown as T;
        }

        return response.json();
    }

    auth = {
        register: (email: string, password: string, name: string) =>
            this.request<AuthResponse>('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, name }),
            }),

        login: (email: string, password: string) =>
            this.request<AuthResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }),

        logout: () =>
            this.request<{ message: string }>('/auth/logout', {
                method: 'POST',
            }),

        me: () => this.request<User>('/auth/me'),
    };

    data = {
        getAll: (params?: { category?: DataCategory; search?: string }) => {
            const query = new URLSearchParams();
            if (params?.category) query.set('category', params.category);
            if (params?.search) query.set('search', params.search);
            const queryString = query.toString();
            return this.request<PersonalData[]>(`/data${queryString ? `?${queryString}` : ''}`);
        },

        getById: (id: string) => this.request<PersonalData>(`/data/${id}`),

        getStats: () => this.request<DataStats>('/data/stats'),

        export: (format: 'json' | 'csv' = 'json') =>
            this.request<Blob | any>(`/data/export/all?format=${format}`),

        delete: (id: string) =>
            this.request<{ message: string }>(`/data/${id}`, {
                method: 'DELETE',
            }),

        deleteAll: () =>
            this.request<{ message: string; deletedCount: number }>('/data/delete-all/confirm', {
                method: 'DELETE',
            }),
    };

    consent = {
        getAll: (status?: ConsentStatus) => {
            const query = status ? `?status=${status}` : '';
            return this.request<Consent[]>(`/consent${query}`);
        },

        getById: (id: string) => this.request<Consent>(`/consent/${id}`),

        getStats: () => this.request<ConsentStats>('/consent/stats'),

        withdraw: (id: string) =>
            this.request<{ message: string; consent: Consent }>(`/consent/${id}/withdraw`, {
                method: 'POST',
            }),

        grant: (id: string) =>
            this.request<{ message: string; consent: Consent }>(`/consent/${id}/grant`, {
                method: 'POST',
            }),

        withdrawAll: () =>
            this.request<{ message: string; count: number }>('/consent/withdraw-all/confirm', {
                method: 'POST',
            }),
    };

    audit = {
        getAll: (params?: {
            action?: AuditAction;
            page?: number;
            limit?: number;
            startDate?: string;
            endDate?: string;
        }) => {
            const query = new URLSearchParams();
            if (params?.action) query.set('action', params.action);
            if (params?.page) query.set('page', params.page.toString());
            if (params?.limit) query.set('limit', params.limit.toString());
            if (params?.startDate) query.set('startDate', params.startDate);
            if (params?.endDate) query.set('endDate', params.endDate);
            const queryString = query.toString();
            return this.request<PaginatedResponse<AuditLog>>(
                `/audit${queryString ? `?${queryString}` : ''}`
            );
        },

        getStats: () => this.request<AuditStats>('/audit/stats'),

        export: (format: 'json' | 'csv' = 'json') =>
            this.request<Blob | any>(`/audit/export?format=${format}`),

        getActions: () => this.request<AuditAction[]>('/audit/actions'),
    };

    // Vault: Files
    files = {
        upload: async (file: File, purpose: string, category: FileCategory) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('purpose', purpose);
            formData.append('category', category);

            const headers: HeadersInit = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${API_BASE_URL}/files/upload`, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(error.error || 'Upload failed');
            }

            return response.json() as Promise<SecureFile>;
        },

        getAll: (category?: FileCategory) => {
            const query = category ? `?category=${category}` : '';
            return this.request<SecureFile[]>(`/files${query}`);
        },

        getById: (id: string) => this.request<SecureFile>(`/files/${id}`),

        download: async (id: string, fileName: string) => {
            const headers: HeadersInit = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${API_BASE_URL}/files/${id}/download`, { headers });
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        },

        delete: (id: string) =>
            this.request<{ message: string }>(`/files/${id}`, { method: 'DELETE' }),

        getStats: () => this.request<FileStats>('/files/stats/summary'),
    };

    // Vault: Passwords
    passwords = {
        create: (data: {
            websiteName: string;
            websiteUrl?: string;
            username: string;
            password: string;
            notes?: string;
            category?: string;
        }) =>
            this.request<PasswordEntry>('/passwords', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        getAll: (category?: string) => {
            const query = category ? `?category=${category}` : '';
            return this.request<PasswordEntry[]>(`/passwords${query}`);
        },

        getById: (id: string, decrypt = false) =>
            this.request<PasswordEntry>(`/passwords/${id}?decrypt=${decrypt}`),

        update: (id: string, data: Partial<{
            websiteName: string;
            websiteUrl: string;
            username: string;
            password: string;
            notes: string;
            category: string;
        }>) =>
            this.request<PasswordEntry>(`/passwords/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),

        delete: (id: string) =>
            this.request<{ message: string }>(`/passwords/${id}`, { method: 'DELETE' }),

        getCategories: () => this.request<string[]>('/passwords/categories/list'),

        getStats: () => this.request<PasswordStats>('/passwords/stats/summary'),
    };

    // Vault: Notes
    notes = {
        create: (data: { title: string; content: string; category?: string; isPinned?: boolean }) =>
            this.request<SecureNote>('/notes', {
                method: 'POST',
                body: JSON.stringify(data),
            }),

        getAll: (params?: { category?: string; pinned?: boolean }) => {
            const query = new URLSearchParams();
            if (params?.category) query.set('category', params.category);
            if (params?.pinned) query.set('pinned', 'true');
            const queryString = query.toString();
            return this.request<SecureNote[]>(`/notes${queryString ? `?${queryString}` : ''}`);
        },

        getById: (id: string) => this.request<SecureNote>(`/notes/${id}`),

        update: (id: string, data: Partial<{
            title: string;
            content: string;
            category: string;
            isPinned: boolean;
        }>) =>
            this.request<SecureNote>(`/notes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),

        togglePin: (id: string) =>
            this.request<SecureNote>(`/notes/${id}/pin`, { method: 'PATCH' }),

        delete: (id: string) =>
            this.request<{ message: string }>(`/notes/${id}`, { method: 'DELETE' }),

        getCategories: () => this.request<string[]>('/notes/categories/list'),

        getStats: () => this.request<NoteStats>('/notes/stats/summary'),
    };
}

export const api = new ApiClient();

// Utility functions
export function getCategoryColor(category: DataCategory): string {
    const colors: Record<DataCategory, string> = {
        IDENTITY: 'blue',
        CONTACT: 'emerald',
        FINANCIAL: 'amber',
        USAGE: 'violet',
        ACTIVITY: 'pink',
        SENSITIVE: 'red',
    };
    return colors[category] || 'slate';
}

export function getCategoryLabel(category: DataCategory): string {
    const labels: Record<DataCategory, string> = {
        IDENTITY: 'Identity',
        CONTACT: 'Contact',
        FINANCIAL: 'Financial',
        USAGE: 'Usage',
        ACTIVITY: 'Activity',
        SENSITIVE: 'Sensitive',
    };
    return labels[category] || category;
}

export function getConsentStatusColor(status: ConsentStatus): string {
    const colors: Record<ConsentStatus, string> = {
        GRANTED: 'emerald',
        WITHDRAWN: 'red',
        EXPIRED: 'slate',
        PENDING: 'amber',
    };
    return colors[status] || 'slate';
}

export function getActionLabel(action: AuditAction): string {
    const labels: Record<AuditAction, string> = {
        DATA_VIEW: 'Viewed Data',
        DATA_CREATE: 'Created Data',
        DATA_UPDATE: 'Updated Data',
        DATA_DELETE: 'Deleted Data',
        DATA_EXPORT: 'Exported Data',
        CONSENT_GRANT: 'Granted Consent',
        CONSENT_WITHDRAW: 'Withdrew Consent',
        LOGIN: 'Logged In',
        LOGOUT: 'Logged Out',
        PROFILE_UPDATE: 'Updated Profile',
        FILE_UPLOAD: 'Uploaded File',
        FILE_VIEW: 'Viewed File',
        FILE_DOWNLOAD: 'Downloaded File',
        FILE_DELETE: 'Deleted File',
        PASSWORD_CREATE: 'Created Password',
        PASSWORD_VIEW: 'Viewed Password',
        PASSWORD_UPDATE: 'Updated Password',
        PASSWORD_DELETE: 'Deleted Password',
        NOTE_CREATE: 'Created Note',
        NOTE_VIEW: 'Viewed Note',
        NOTE_UPDATE: 'Updated Note',
        NOTE_DELETE: 'Deleted Note',
    };
    return labels[action] || action;
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
