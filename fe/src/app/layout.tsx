import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
    title: 'DataVault - Your Personal Data Locker',
    description: 'Secure, DPDPA-compliant personal data management platform',
    keywords: ['DPDPA', 'data privacy', 'personal data', 'consent management', 'data protection'],
    themeColor: '#020202',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-[#020202] text-slate-50 antialiased font-sans">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
