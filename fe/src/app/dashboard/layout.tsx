'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Database,
    CheckSquare,
    Download,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Lock,
    Key,
    StickyNote,
    FolderLock
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/data', label: 'My Data', icon: Database },
    {
        href: '/dashboard/vault',
        label: 'Secure Vault',
        icon: Lock,
        subItems: [
            { href: '/dashboard/vault/files', label: 'Files', icon: FolderLock },
            { href: '/dashboard/vault/passwords', label: 'Passwords', icon: Key },
            { href: '/dashboard/vault/notes', label: 'Notes', icon: StickyNote },
        ]
    },
    { href: '/dashboard/consents', label: 'Consents', icon: CheckSquare },
    { href: '/dashboard/export', label: 'Export', icon: Download },
    { href: '/dashboard/audit', label: 'Audit Logs', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020202] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#0000EE]/30 border-t-[#0000EE] rounded-full animate-spin"></div>
                    <p className="text-gray-400">Loading your vault...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#020202] flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-[#0a0a0a] border-r border-[#1f1f1f]">
                {/* Logo */}
                <div className="p-6 border-b border-[#1f1f1f]">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <span className="text-xl font-heading font-bold text-white">DataVault</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.subItems && pathname.startsWith(item.href));
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        return (
                            <div key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${isActive
                                        ? 'bg-[#0000EE]/20 text-[#0000EE] border-l-2 border-[#0000EE]'
                                        : 'text-gray-400 hover:bg-[#141414] hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                                {hasSubItems && isActive && (
                                    <div className="ml-4 mt-1 space-y-1 border-l border-[#1f1f1f]">
                                        {item.subItems.map((sub) => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${isSubActive
                                                        ? 'text-[#0000EE] bg-[#0000EE]/10'
                                                        : 'text-gray-500 hover:text-gray-300'
                                                        }`}
                                                >
                                                    <sub.icon className="w-4 h-4" />
                                                    <span>{sub.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-[#1f1f1f]">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-10 h-10 bg-[#411E10] flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{user?.name}</p>
                            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#1f1f1f]">
                <div className="flex items-center justify-between p-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="text-lg font-heading font-bold text-white">DataVault</span>
                    </Link>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <nav className="p-4 space-y-1 border-t border-[#1f1f1f]">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${isActive
                                        ? 'bg-[#0000EE]/20 text-[#0000EE]'
                                        : 'text-gray-400 hover:bg-[#141414] hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </nav>
                )}
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:overflow-y-auto">
                <div className="lg:hidden h-16"></div> {/* Spacer for mobile header */}
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
