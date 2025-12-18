# DataVault: DPDPA 2023 Implementation Guide

---

## Slide 1: Introduction
**Title**: Practical Implementation of DPDPA 2023
**Subtitle**: Mapping Legal Requirements to Code
**Goal**: Demonstrating direct compliance with the Digital Personal Data Protection Act.

---

# Part 1: Demo Scenarios (Core Compliance)

---

## Slide 2: Section 6 - Notice & Consent
**DPDPA Requirement**: Consent must be free, specific, informed, unconditional, and unambiguous.

**Implementation**: "Consent Manager"
*   **How it works**: System tracks every permission granted by the user with a specific purpose.
*   **Frontend**: `/dashboard/consents`
    *   File: `fe/src/app/dashboard/consents/page.tsx`
*   **Backend**: `GET/POST /api/consent`
    *   File: `be/src/routes/consent.routes.ts`
    *   Logic: `prisma.consent.create({ data: { purpose: ... } })`

---

## Slide 3: Section 7 - Legitimate Uses (Purpose Limitation)
**DPDPA Requirement**: Data Fiduciaries must use personal data only for the purpose for which consent was given.

**Implementation**: "Mandatory Purpose Declaration"
*   **How it works**: Users must specify "Purpose" (e.g., "Tax Filing", "Insurance") when uploading sensitive documents.
*   **Frontend**: `/dashboard/vault/files` (Upload Modal)
    *   File: `fe/src/app/dashboard/vault/files/page.tsx`
*   **Backend**: `POST /api/files/upload`
    *   File: `be/src/routes/files.routes.ts`
    *   Logic: Validates `req.body.purpose` is present before processing.

---

## Slide 4: Section 11 - Right to Access
**DPDPA Requirement**: Data Principals have the right to obtain a summary of personal data being processed.

**Implementation**: "My Data Dashboard"
*   **How it works**: Centralized view of all stored Personal Identifiable Information (PII).
*   **Frontend**: `/dashboard/data`
    *   File: `fe/src/app/dashboard/data/page.tsx`
*   **Backend**: `GET /api/data/profile`
    *   File: `be/src/routes/data.routes.ts`
    *   Logic: Aggregates User, Files, and Consent data into a single view.

---

## Slide 5: Section 12 - Right to Correction
**DPDPA Requirement**: Right to correction, completion, and updating of personal data.

**Implementation**: "Profile Management"
*   **How it works**: Users can directly edit their PII and update inaccurate records.
*   **Frontend**: `/dashboard/settings`
    *   File: `fe/src/app/dashboard/settings/page.tsx`
*   **Backend**: `PUT /api/auth/profile`
    *   File: `be/src/routes/auth.routes.ts`
    *   Logic: `prisma.user.update(...)` accepts changes to editable fields.

---

## Slide 6: Section 12 - Right to Erasure
**DPDPA Requirement**: Right to erasure of personal data unless retention is necessary for a legal purpose.

**Implementation**: "Data Deletion & Vault Clearing"
*   **How it works**: "Delete" actions in Vault perform a secure removal (or soft-delete for audit).
*   **Frontend**: `/dashboard/vault/files` (Delete Action)
    *   File: `fe/src/app/dashboard/vault/files/page.tsx`
*   **Backend**: `DELETE /api/files/:id`
    *   File: `be/src/routes/files.routes.ts`
    *   Logic: Marks data as `isActive: false` (Soft Delete) or removes entirely.

---

## Slide 7: Section 8 - Duties of Data Fiduciary (Transparency)
**DPDPA Requirement**: Accountability for data processing activities.

**Implementation**: "Immutable Audit Logs"
*   **How it works**: Every single action (View, Create, Delete) is recorded with User ID, IP, and Timestamp.
*   **Frontend**: `/dashboard/audit`
    *   File: `fe/src/app/dashboard/audit/page.tsx`
*   **Backend**: `GET /api/audit`
    *   File: `be/src/routes/audit.routes.ts`
    *   Logic: `auditService.createAuditLog()` interceptor runs on every sensitive request.

---

## Slide 8: Section 8 - Duties of Data Fiduciary (Security Safeguards)
**DPDPA Requirement**: Implementation of appropriate technical and organizational measures to prevent data breach.

**Implementation**: "Encryption & Access Control"
*   **How it works**: Sensitive fields (Passwords, Notes) are encrypted at rest.
*   **Backend Implementation**:
    *   File: `be/src/routes/passwords.routes.ts`
    *   Logic: `encryptedPassword` field stores obfuscated data.
    *   Middleware: `helmet` (Headers) & `rateLimit` (DoS Protection).

---

# Part 2: Additional Compliance & Future Scope

---

## Slide 9: Section 9 - Processing of Data of Children
**Requirement**: Verify age and obtain verifiable parental consent before processing data of children; Do not track behavioral monitoring.
**Future Implementation Plan**:
*   **Age Gating**: Implementation of Age Verification API during Sign Up.
*   **Parental Dashboard**: Separate dashboard for parents to approve/revoke child data access.
*   **Status**: *Planned for Phase 2*.

---

## Slide 10: Section 10 - Significant Data Fiduciary (SDF)
**Requirement**: SDFs have additional obligations: Appoint a Data Protection Officer (DPO), Independent Data Auditor, and conduct Data Protection Impact Assessments (DPIA).
**Relevance**: Only applies if DataVault scales to process huge volumes of sensitive data.
**Future Implementation Plan**:
*   **DPO Portal**: Admin interface for appointed Data Protection Officer.
*   **Automated DPIA**: Periodic automated risk assessment reports.

---

## Slide 11: Section 13 - Right to Grievance Redressal
**Requirement**: Readily available means of grievance redressal. Data Principal must exhaust this before approaching the Data Protection Board.
**Future Implementation Plan**:
*   **Support Ticket System**: In-app ticketing system for users to file privacy complaints.
*   **Resolution Tracking**: Workflow for admin to respond within legal timeframes (e.g., 7 days).
*   **Status**: *Backlog*.

---

## Slide 12: Section 14 - Duties of Data Principal
**Requirement**:
1.  Do not register a false or frivolous grievance.
2.  Do not impersonate another person.
3.  Furnish only verifiably authentic information.
**Implementation Considerations**:
*   **Identity Verification**: Integration with Aadhaar (optional) or Mobile OTP to prevent impersonation.
*   **Terms of Service**: Explicit clause regarding Section 14 penalties for frivolous complaints.

---

## Slide 13: Section 33 - Penalties & Adjudication
**Context**: Financial penalties for breach of observances.
*   **Up to ₹250 Cr**: Failure to take security safeguards (covered by our Encryption & Audit Logs).
*   **Up to ₹200 Cr**: Failure to notify Board/Principal of breach.
**Mitigation Strategy**:
*   **Breach Notification System**: Automated alert system to notify Admin & Users instantly upon detecting unauthorized access patterns (Anomaly Detection).

---

## Slide 14: Conclusion
**DataVault** demonstrates a practical, architectural approach to DPDPA compliance.
*   **Core Compliance (Sections 6-8, 11-12)**: **Implemented & Live**.
*   **Extended Compliance (Sections 9, 10, 13)**: **Architected for Future Integration**.

**Thank You**
