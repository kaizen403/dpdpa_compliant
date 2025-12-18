# DataVault - DPDPA Compliant Personal Data Locker

A secure personal data management platform enabling users to view, manage, and control their personal data in compliance with India's Digital Personal Data Protection Act (DPDPA) 2025.

## Features

- **📊 Data Dashboard** - View all your personal data in one place
- **🏷️ Purpose Labels** - Understand why each piece of data is collected
- **✅ Consent Management** - Grant or withdraw consent for data usage
- **📤 Data Export** - Download your data in JSON or CSV format
- **🗑️ Right to Erasure** - Delete your personal data
- **📜 Audit Logs** - Complete history of all data actions

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT

## Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose
- npm or yarn

## Quick Start

1. **Clone and install dependencies**
   ```bash
   npm run install:all
   ```

2. **Start with the development script**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

   Or manually:
   ```bash
   # Start PostgreSQL
   docker-compose up -d

   # Run migrations
   npm run db:migrate

   # Seed database (optional)
   npm run db:seed

   # Start development servers
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Prisma Studio: `npm run db:studio`

## Project Structure

```
dpdpa/
├── fe/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/        # App Router pages
│   │   ├── components/ # Reusable components
│   │   └── lib/        # Utilities
│   └── ...
├── be/                 # Node.js Backend
│   ├── prisma/         # Database schema
│   └── src/
│       ├── routes/     # API routes
│       ├── middleware/ # Auth, logging
│       └── services/   # Business logic
└── ...
```

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | User login |
| `/api/auth/me` | GET | Get current user |

### Personal Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data` | GET | List all personal data |
| `/api/data/:id` | GET | Get specific data item |
| `/api/data/export` | GET | Export data (JSON/CSV) |
| `/api/data/:id` | DELETE | Delete data item |

### Consent
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/consent` | GET | List all consents |
| `/api/consent/:id/withdraw` | POST | Withdraw consent |
| `/api/consent/:id/grant` | POST | Grant consent |

### Audit
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/audit` | GET | Get audit logs |

## DPDPA Compliance

| Feature | DPDPA Section |
|---------|---------------|
| Right to Access | Section 11 |
| Purpose Limitation | Section 5 |
| Consent Management | Section 6-7 |
| Data Portability | Section 12 |
| Right to Erasure | Section 12 |
| Accountability | Section 8 |

## License

MIT
