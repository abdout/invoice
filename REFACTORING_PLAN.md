# Invoice App Refactoring Plan

This document outlines the plan to refactor the AmitInvoice application to:
1. Migrate from MongoDB to Neon with Prisma
2. Implement a new authentication system
3. Convert API routes to server actions

## 1. Database Migration (MongoDB → Neon + Prisma)

### Step 1: Schema Migration

#### Prisma Schema Definitions

```prisma
model User {
  id            String       @id @default(cuid())
  firstName     String?
  lastName      String?
  email         String       @unique
  emailVerified DateTime?
  currency      String       @default("USD")
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  settings      Settings?
  invoices      Invoice[]
  accounts      Account[]
  sessions      Session[]
}

model Invoice {
  id             String     @id @default(cuid())
  invoice_no     String
  invoice_date   DateTime
  due_date       DateTime
  currency       String     @default("USD")
  from           Address
  to             Address
  items          Item[]
  sub_total      Float
  discount       Float?
  tax_percentage Float?
  total          Float
  notes          String?
  status         Status     @default(UNPAID)
  userId         String
  user           User       @relation(fields: [userId], references: [id])
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([userId])
}

enum Status {
  PAID
  UNPAID
  CANCEL
}

model Item {
  id         String   @id @default(cuid())
  item_name  String
  quantity   Int
  price      Float
  total      Float
  invoiceId  String
  invoice    Invoice  @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
}

model Address {
  id        String   @id @default(cuid())
  name      String
  email     String?
  address1  String
  address2  String?
  address3  String?
  invoiceId String?
  invoice   Invoice? @relation(fields: [invoiceId], references: [id])
}

model Settings {
  id          String    @id @default(cuid())
  invoiceLogo String?
  signature   Signature?
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Signature {
  id         String    @id @default(cuid())
  name       String?
  image      String?
  settingsId String    @unique
  settings   Settings  @relation(fields: [settingsId], references: [id])
}
```

### Step 2: Database Setup

1. Create Neon Database:
   - Sign up at neon.tech
   - Create new project
   - Get connection string

2. Initialize Prisma:
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```

3. Configure Environment:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

### Step 3: Data Migration

1. Create Migration Script:
   ```typescript
   // scripts/migrate-data.ts
   import { PrismaClient } from '@prisma/client'
   import { MongoClient } from 'mongodb'

   async function migrateData() {
     // Connect to both databases
     // Fetch MongoDB data
     // Transform data format
     // Insert into Neon using Prisma
   }
   ```

2. Run Database Migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

## 2. Authentication System Migration

### Step 1: Remove Current Auth Implementation

1. Files to Remove:
   - `src/lib/auth.ts`
   - `src/app/api/auth/[...nextauth]`
   - All MongoDB auth-related code

### Step 2: Implement New Auth System

1. Core Authentication Files:
   ```
   src/
     auth/
       auth.ts           # Main auth configuration
       auth.config.ts    # Provider settings
       middleware.ts     # Route protection
       routes.ts         # Route definitions
   ```

2. Required Environment Variables:
   ```env
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   FACEBOOK_CLIENT_ID="..."
   FACEBOOK_CLIENT_SECRET="..."
   ```

3. Authentication Features:
   - Email/Password login
   - OAuth providers (Google, Facebook)
   - Email verification
   - Password reset
   - 2FA support
   - Session management

### Step 3: Update Protected Routes

1. Route Configuration:
   ```typescript
   export const publicRoutes = ["/"]
   export const authRoutes = ["/login", "/register"]
   export const apiAuthPrefix = "/api/auth"
   export const DEFAULT_LOGIN_REDIRECT = "/dashboard"
   ```

2. Middleware Protection:
   ```typescript
   import { auth } from "./auth"
   import { DEFAULT_LOGIN_REDIRECT, publicRoutes, authRoutes, apiAuthPrefix } from "./routes"

   export default auth((req) => {
     // Route protection logic
   })
   ```

## 3. Server Actions Migration

### Step 1: Create Server Action Modules

```typescript
// app/actions/
  invoice.ts
  settings.ts
  user.ts
  email.ts
  dashboard.ts
```

### Step 2: Implement Server Actions

1. Invoice Actions:
   ```typescript
   // app/actions/invoice.ts
   'use server'
   
   export async function createInvoice(data: InvoiceFormData) {
     // Validation
     // Create invoice using Prisma
   }
   
   export async function updateInvoice(id: string, data: InvoiceFormData) {
     // Update logic
   }
   ```

2. Settings Actions:
   ```typescript
   // app/actions/settings.ts
   'use server'
   
   export async function updateSettings(data: SettingsFormData) {
     // Settings update logic
   }
   ```

### Step 3: Update Frontend Components

1. Replace API Calls:
   ```typescript
   // Before
   const response = await fetch('/api/invoice', {
     method: 'POST',
     body: JSON.stringify(data)
   })

   // After
   const result = await createInvoice(data)
   ```

2. Implement Loading States:
   ```typescript
   export function InvoiceForm() {
     const [pending, startTransition] = useTransition()
     
     const onSubmit = (data: FormData) => {
       startTransition(async () => {
         await createInvoice(data)
       })
     }
   }
   ```

## Implementation Phases

### Phase 1: Database Migration
- [ ] Set up Neon database
- [ ] Create Prisma schema
- [ ] Write migration scripts
- [ ] Test data integrity
- [ ] Backup MongoDB data
- [ ] Execute migration
- [ ] Verify data

### Phase 2: Authentication
- [ ] Remove old auth system
- [ ] Install new auth dependencies
- [ ] Configure auth providers
- [ ] Set up email service
- [ ] Implement auth UI components
- [ ] Test auth flows
- [ ] Set up role-based access

### Phase 3: Server Actions
- [ ] Create action modules
- [ ] Implement form actions
- [ ] Update components
- [ ] Remove API routes
- [ ] Add error handling
- [ ] Test all functionality

## Testing Checklist

### Database Testing
- [ ] Data types validation
- [ ] Relationships integrity
- [ ] Query performance
- [ ] Data migration accuracy

### Authentication Testing
- [ ] Login flows
- [ ] OAuth providers
- [ ] Email verification
- [ ] Password reset
- [ ] 2FA functionality
- [ ] Session management
- [ ] Role-based access

### Server Actions Testing
- [ ] Form submissions
- [ ] Error handling
- [ ] Loading states
- [ ] Data validation
- [ ] File uploads
- [ ] PDF generation
- [ ] Email sending

## Security Considerations

1. Database
   - Connection string security
   - Query injection prevention
   - Data encryption

2. Authentication
   - CSRF protection
   - Rate limiting
   - Session security
   - Password policies

3. Server Actions
   - Input validation
   - Error handling
   - File upload limits
   - Request validation

## Rollback Plan

1. Database
   - Keep MongoDB running
   - Maintain data backups
   - Test rollback procedures

2. Authentication
   - Maintain old auth code
   - Document session migration
   - Plan user communication

3. Server Actions
   - Keep API routes temporarily
   - Document rollback steps
   - Monitor error rates

---

This refactoring plan provides a structured approach to upgrading the AmitInvoice application while maintaining security and functionality. Each phase should be implemented sequentially with proper testing and validation at each step.
