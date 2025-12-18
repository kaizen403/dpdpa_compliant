import { PrismaClient, DataCategory, ConsentStatus, AuditAction } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create demo user
    const passwordHash = await bcrypt.hash('sibi123', 10);

    const user = await prisma.user.upsert({
        where: { email: 'sibisir@gmail.com' },
        update: {},
        create: {
            email: 'sibisir@gmail.com',
            passwordHash,
            name: 'Sibi Sir',
        },
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create sample personal data items
    const personalDataItems = [
        // Identity Data
        {
            category: DataCategory.IDENTITY,
            fieldName: 'Full Name',
            fieldValue: 'Sibi Sir',
            purpose: 'Account identification and personalization',
            source: 'User Registration',
            dataController: 'DataVault Inc.',
            retentionDays: 365,
        },
        {
            category: DataCategory.IDENTITY,
            fieldName: 'Date of Birth',
            fieldValue: '1990-05-15',
            purpose: 'Age verification and compliance',
            source: 'Profile Setup',
            dataController: 'DataVault Inc.',
            retentionDays: 365,
        },
        {
            category: DataCategory.IDENTITY,
            fieldName: 'Gender',
            fieldValue: 'Not Specified',
            purpose: 'Demographic analysis and personalization',
            source: 'Profile Setup',
            dataController: 'DataVault Inc.',
            retentionDays: 365,
        },
        // Contact Data
        {
            category: DataCategory.CONTACT,
            fieldName: 'Email Address',
            fieldValue: 'sibisir@gmail.com',
            purpose: 'Account login and communication',
            source: 'User Registration',
            dataController: 'DataVault Inc.',
            retentionDays: 365,
        },
        {
            category: DataCategory.CONTACT,
            fieldName: 'Phone Number',
            fieldValue: '+91 98765 43210',
            purpose: 'Two-factor authentication and alerts',
            source: 'Profile Setup',
            dataController: 'DataVault Inc.',
            retentionDays: 180,
        },
        {
            category: DataCategory.CONTACT,
            fieldName: 'Address',
            fieldValue: '123 Privacy Lane, Bangalore, Karnataka 560001',
            purpose: 'Service delivery and verification',
            source: 'Profile Setup',
            dataController: 'DataVault Inc.',
            retentionDays: 180,
        },
        // Usage Data
        {
            category: DataCategory.USAGE,
            fieldName: 'Language Preference',
            fieldValue: 'English',
            purpose: 'User experience customization',
            source: 'App Settings',
            dataController: 'DataVault Inc.',
            retentionDays: 90,
        },
        {
            category: DataCategory.USAGE,
            fieldName: 'Theme Preference',
            fieldValue: 'Dark Mode',
            purpose: 'User experience customization',
            source: 'App Settings',
            dataController: 'DataVault Inc.',
            retentionDays: 90,
        },
        {
            category: DataCategory.USAGE,
            fieldName: 'Notification Settings',
            fieldValue: 'Email: On, SMS: Off, Push: On',
            purpose: 'Communication preferences',
            source: 'App Settings',
            dataController: 'DataVault Inc.',
            retentionDays: 90,
        },
        // Activity Data
        {
            category: DataCategory.ACTIVITY,
            fieldName: 'Last Login',
            fieldValue: new Date().toISOString(),
            purpose: 'Security monitoring and session management',
            source: 'System Generated',
            dataController: 'DataVault Inc.',
            retentionDays: 30,
        },
        {
            category: DataCategory.ACTIVITY,
            fieldName: 'IP Address',
            fieldValue: '192.168.1.100',
            purpose: 'Security and fraud prevention',
            source: 'System Generated',
            dataController: 'DataVault Inc.',
            retentionDays: 30,
        },
        {
            category: DataCategory.ACTIVITY,
            fieldName: 'Device Info',
            fieldValue: 'Chrome 120 on Windows 11',
            purpose: 'Security and compatibility',
            source: 'System Generated',
            dataController: 'DataVault Inc.',
            retentionDays: 30,
        },
        // Financial Data
        {
            category: DataCategory.FINANCIAL,
            fieldName: 'PAN Number',
            fieldValue: 'ABCDE1234F',
            purpose: 'Tax compliance and verification',
            source: 'KYC Process',
            dataController: 'DataVault Inc.',
            retentionDays: 365 * 7, // 7 years for tax records
        },
    ];

    // Delete existing data for demo user
    await prisma.consent.deleteMany({ where: { userId: user.id } });
    await prisma.personalData.deleteMany({ where: { userId: user.id } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });

    // Create personal data and consents
    for (const item of personalDataItems) {
        const personalData = await prisma.personalData.create({
            data: {
                ...item,
                userId: user.id,
            },
        });

        // Create consent for each data item
        await prisma.consent.create({
            data: {
                userId: user.id,
                personalDataId: personalData.id,
                purpose: item.purpose,
                status: ConsentStatus.GRANTED,
                grantedAt: new Date(),
                expiresAt: new Date(Date.now() + item.retentionDays * 24 * 60 * 60 * 1000),
            },
        });
    }

    console.log(`✅ Created ${personalDataItems.length} personal data items with consents`);

    // Create some audit log entries
    const auditEntries = [
        {
            action: AuditAction.LOGIN,
            entityType: 'User',
            entityId: user.id,
            details: { method: 'password' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 Chrome/120',
        },
        {
            action: AuditAction.DATA_VIEW,
            entityType: 'PersonalData',
            details: { category: 'IDENTITY' },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 Chrome/120',
        },
        {
            action: AuditAction.DATA_EXPORT,
            entityType: 'PersonalData',
            details: { format: 'JSON', itemCount: 13 },
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 Chrome/120',
        },
    ];

    for (const entry of auditEntries) {
        await prisma.auditLog.create({
            data: {
                ...entry,
                userId: user.id,
            },
        });
    }

    console.log(`✅ Created ${auditEntries.length} audit log entries`);

    console.log('');
    console.log('🎉 Seeding complete!');
    console.log('');
    console.log('Demo credentials:');
    console.log('  Email: sibisir@gmail.com');
    console.log('  Password: sibi123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
