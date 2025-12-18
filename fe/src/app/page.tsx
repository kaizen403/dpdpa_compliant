import Link from 'next/link';
import {
    Shield,
    Lock,
    Download,
    Eye,
    FileText,
    CheckCircle,
    ArrowRight,
    Database,
    Key,
    Trash2,
    ClipboardList
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#020202]">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020202]/90 backdrop-blur-lg border-b border-[#1f1f1f]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-heading font-bold text-white">DataVault</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors font-medium"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="btn-primary"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#411E10]/20 border border-[#411E10]/40 mb-8">
                        <CheckCircle className="w-4 h-4 text-[#c67654]" />
                        <span className="text-sm font-medium text-[#c67654]">DPDPA Compliant</span>
                    </div>

                    {/* Heading - Using Pandawa serif heading font */}
                    <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight text-white">
                        Your Personal Data,
                        <br />
                        <span className="text-[#0000EE]">Your Control</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        DataVault puts you in charge of your personal information.
                        View, manage, export, and protect your data with complete transparency —
                        fully compliant with India's Digital Personal Data Protection Act.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link href="/register" className="btn-primary flex items-center gap-2 text-lg">
                            Start Securing Your Data
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/login" className="btn-secondary flex items-center gap-2 text-lg">
                            <Key className="w-5 h-5" />
                            Demo Account
                        </Link>
                    </div>

                    {/* Hero Visual */}
                    <div className="relative max-w-4xl mx-auto">
                        <div className="absolute inset-0 bg-[#0000EE]/10 blur-3xl"></div>
                        <div className="relative glass-card p-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: Database, label: 'Data Items', value: '24' },
                                    { icon: CheckCircle, label: 'Active Consents', value: '18' },
                                    { icon: ClipboardList, label: 'Audit Logs', value: '156' },
                                    { icon: Shield, label: 'Privacy Score', value: '94%' },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[#141414] p-4 text-center border border-[#1f1f1f]">
                                        <stat.icon className="w-8 h-8 mx-auto mb-2 text-[#0000EE]" />
                                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                                        <div className="text-sm text-gray-400">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold mb-4 text-white">DPDPA Rights, Simplified</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Exercise your rights under the Digital Personal Data Protection Act
                            with an intuitive, user-friendly interface.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Eye,
                                title: 'Right to Access',
                                description: 'View all personal data collected about you in one centralized dashboard, organized by category.',
                                color: 'bg-[#0000EE]',
                            },
                            {
                                icon: FileText,
                                title: 'Purpose Transparency',
                                description: 'Understand exactly why each piece of data is collected and who controls it.',
                                color: 'bg-purple-600',
                            },
                            {
                                icon: CheckCircle,
                                title: 'Consent Management',
                                description: 'Grant or withdraw consent for specific data uses with a single click.',
                                color: 'bg-emerald-600',
                            },
                            {
                                icon: Download,
                                title: 'Data Portability',
                                description: 'Export your complete data in JSON or CSV format anytime you want.',
                                color: 'bg-amber-600',
                            },
                            {
                                icon: Trash2,
                                title: 'Right to Erasure',
                                description: 'Delete individual data items or request complete erasure of your personal data.',
                                color: 'bg-red-600',
                            },
                            {
                                icon: ClipboardList,
                                title: 'Audit Trail',
                                description: 'Complete log of all actions taken on your data for full accountability.',
                                color: 'bg-[#411E10]',
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="glass-card p-6 card-hover"
                            >
                                <div className={`w-14 h-14 ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Data Categories Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-heading font-bold mb-4 text-white">Organized Data Categories</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Your personal data is neatly organized into clear categories,
                            making it easy to understand and manage.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { name: 'Identity', color: 'bg-indigo-600', items: 'Name, DOB, Gender' },
                            { name: 'Contact', color: 'bg-emerald-600', items: 'Email, Phone, Address' },
                            { name: 'Financial', color: 'bg-amber-600', items: 'PAN, Bank Info' },
                            { name: 'Usage', color: 'bg-purple-600', items: 'Preferences, Settings' },
                            { name: 'Activity', color: 'bg-pink-600', items: 'Logs, IP, Sessions' },
                            { name: 'Sensitive', color: 'bg-red-600', items: 'Health, Biometric' },
                        ].map((category, i) => (
                            <div
                                key={i}
                                className="glass-card p-4 text-center card-hover"
                            >
                                <div className={`w-12 h-12 ${category.color} mx-auto mb-3 flex items-center justify-center`}>
                                    <Lock className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="font-semibold mb-1 text-white">{category.name}</h4>
                                <p className="text-xs text-gray-400">{category.items}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="glass-card p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#411E10]/20 via-[#0000EE]/10 to-[#411E10]/20"></div>
                        <div className="relative">
                            <h2 className="text-4xl font-heading font-bold mb-4 text-white">Take Control Today</h2>
                            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                                Join thousands of users who trust DataVault to manage and protect their personal information.
                            </p>
                            <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg">
                                Create Your Vault
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-[#1f1f1f]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#411E10]" />
                        <span className="font-semibold text-white">DataVault</span>
                    </div>
                    <p className="text-sm text-gray-400">
                        © 2024 DataVault. DPDPA-Compliant Personal Data Management.
                    </p>
                </div>
            </footer>
        </div>
    );
}
