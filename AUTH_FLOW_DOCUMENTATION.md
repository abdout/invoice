# Authentication System Flow Documentation

## Overview

This Next.js application implements a comprehensive authentication system using **NextAuth.js v5** with multiple providers, two-factor authentication, role-based access control, and comprehensive session management.

## 🏗️ Architecture Components

### Core Authentication Files
- `auth.ts` - Main NextAuth configuration
- `auth.config.ts` - Provider configurations (Google, Facebook, Credentials)
- `middleware.ts` - Route protection and authentication middleware
- `routes.ts` - Route definitions (public, auth, protected)

### Database Models (Prisma)
- `User` - Core user data with roles and 2FA settings
- `Account` - OAuth account linking
- `Session` - User sessions
- `VerificationToken` - Email verification tokens
- `PasswordResetToken` - Password reset tokens
- `TwoFactorToken` - 2FA verification codes
- `TwoFactorConfirmation` - 2FA confirmation tracking

## 🔐 Authentication Providers

### 1. Credentials Provider
```typescript
// Custom email/password authentication
authorize(credentials) {
  - Validates credentials using Zod schema
  - Retrieves user by email
  - Compares hashed password with bcrypt
  - Returns user object if valid
}
```

### 2. Google OAuth
```typescript
// Google Sign-In
profile(profile) {
  - Maps Google profile to user structure
  - Auto-verifies email
  - Uses consent prompt for permissions
}
```

### 3. Facebook OAuth
```typescript
// Facebook Sign-In
profile(profile) {
  - Maps Facebook profile to user structure
  - Handles missing email scenarios
  - Auto-verifies email
}
```

## 🔄 Authentication Flow

### 1. Initial Access Flow

```
User Visits App → Middleware Check → Is Route Public?
├─ Yes → Allow Access
└─ No → Is User Authenticated?
   ├─ Yes → Allow Access
   └─ No → Redirect to /login → Login Page
```

### 2. Login Process Flow

```
Login Form Submission → Validation Schema Check → Valid Input?
├─ No → Return Validation Errors
└─ Yes → Check User Exists → User Found?
   ├─ No → Return 'Email does not exist'
   └─ Yes → Email Verified?
      ├─ No → Send Verification Email
      └─ Yes → 2FA Enabled?
         ├─ No → Sign In with Credentials → Redirect to Dashboard
         └─ Yes → 2FA Code Provided?
            ├─ No → Send 2FA Code
            └─ Yes → Verify 2FA Code → Code Valid?
               ├─ No → Return 'Invalid Code'
               └─ Yes → Create 2FA Confirmation → Sign In → Dashboard
```

### 3. OAuth Flow

```
OAuth Button Click → Redirect to Provider → User Authenticates with Provider
→ Provider Returns to Callback → NextAuth Processes Response → Account Exists?
├─ No → Create New Account → Auto-verify Email → Create Session → Dashboard
└─ Yes → Link to Existing User → Auto-verify Email → Create Session → Dashboard
```

## 🛡️ Security Features

### 1. Route Protection (Middleware)

```typescript
// middleware.ts protection levels:
- API Auth Routes: Always allowed
- Public Routes: Open access
- Auth Routes: Redirect if logged in
- Platform Routes: Require authentication
- Protected Routes: Require authentication + redirect with callback
```

### 2. Two-Factor Authentication

```
2FA Setup Request → Generate Secret → Display QR Code → User Scans with App
→ User Enters Verification Code → Code Valid?
├─ No → Display Error
└─ Yes → Enable 2FA on Account → Generate Backup Codes
```

### 3. Password Security
- **Hashing**: bcryptjs with salt rounds
- **Validation**: Minimum 6 characters required
- **Reset Flow**: Secure token-based reset system

### 4. Session Management
- **Strategy**: JWT-based sessions
- **Security**: HTTP-only cookies with SameSite protection
- **Expiration**: Configurable session timeouts

## 🎭 Role-Based Access Control

### User Roles
```typescript
enum UserRole {
  ADMIN    // Full system access
  USER     // Basic user access
  MANAGER  // Property management access
  TENANT   // Tenant-specific access
}
```

### Role Assignment Flow
1. **Registration**: New users get `USER` role by default
2. **OAuth**: Social logins get `USER` role
3. **Admin Assignment**: Only admins can modify roles
4. **Role Gates**: Components check roles before rendering

## 📧 Email Verification System

### Verification Flow
```
User Registers → Generate Verification Token → Send Verification Email
→ User Clicks Email Link → Verify Token → Token Valid?
├─ No → Show Error
└─ Yes → Mark Email as Verified → Allow Login
```

### Email Types
- **Verification**: Account email confirmation
- **Password Reset**: Secure password reset links
- **2FA Codes**: Time-limited authentication codes

## 🔄 Session Lifecycle

### Session Creation
1. **Successful Authentication** → Create JWT token
2. **Token Population** → Add user data, role, 2FA status
3. **Cookie Setting** → Secure HTTP-only cookie
4. **Database Session** → Optional session storage

### Session Updates
```typescript
// JWT Callback runs on every session access
async jwt({ token }) {
  - Refresh user data from database
  - Update role and permissions
  - Check account linking status
  - Validate 2FA status
}

// Session Callback shapes final session object
async session({ token, session }) {
  - Map token data to session
  - Add custom user properties
  - Return cleaned session object
}
```

### Session Termination
- **Explicit Logout**: User clicks logout
- **Token Expiration**: Natural session timeout
- **Security Logout**: Forced logout on security events

## 🚨 Error Handling

### Authentication Errors
```typescript
// Credential validation errors
"Invalid fields!" - Schema validation failed
"Email does not exist!" - User not found
"Invalid credentials!" - Wrong password
"Email not verified!" - Pending verification

// 2FA Errors
"Invalid code!" - Wrong 2FA code
"Code expired!" - 2FA timeout
"2FA setup required!" - Missing 2FA setup

// OAuth Errors
"OAuth account linking failed" - Provider issues
"Account already exists" - Email conflicts
```

### Error Recovery
- **Automatic Retry**: For transient failures
- **User Guidance**: Clear error messages
- **Fallback Options**: Alternative auth methods
- **Support Escalation**: Contact information

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Email Service
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
```

### Route Configuration
```typescript
// Public Routes (No Auth Required)
["/", "/new-verification", "/admin", "/client", "/server", "/setting"]

// Auth Routes (Redirect if Logged In)
["/login", "/register", "/error", "/reset", "/new-password"]

// Protected Platform Routes
["/dashboard", "/project", "/task", "/wallet", "/daily", "/resource"]
```

## 🧪 Testing & Debugging

### Debug Mode
```typescript
// auth.ts
debug: true // Enables detailed logging
```

### Console Logging
- **Sign-in Events**: User login tracking
- **OAuth Events**: Provider authentication
- **Error Events**: Authentication failures
- **Session Events**: Session creation/updates

### Verification Tools
- Database inspection via Prisma Studio
- JWT token decoding
- Session storage examination
- Email delivery confirmation

## 📱 Frontend Integration

### Authentication Hooks
```typescript
// Get current user data
const user = useCurrentUser()

// Get current user role  
const role = useCurrentRole()

// Check authentication status
const { data: session, status } = useSession()
```

### Protected Components
```typescript
// Role-based component rendering
<RoleGate allowedRole="ADMIN">
  <AdminPanel />
</RoleGate>

// Authentication-required wrapper
<LoginButton>
  <SecureContent />
</LoginButton>
```

### Form Components
- **LoginForm**: Email/password authentication
- **RegisterForm**: New user registration
- **ResetForm**: Password reset request
- **VerificationForm**: Email confirmation
- **TwoFactorForm**: 2FA code entry

## 🚀 Deployment Considerations

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] OAuth providers configured
- [ ] Email service operational
- [ ] HTTPS certificates installed
- [ ] Session security headers set
- [ ] CORS policies configured
- [ ] Rate limiting implemented

### Security Hardening
- **CSRF Protection**: Built-in NextAuth protection
- **XSS Prevention**: Sanitized outputs
- **SQL Injection**: Prisma ORM protection
- **Brute Force**: Rate limiting on auth endpoints
- **Session Fixation**: Automatic session rotation

## 📊 Monitoring & Analytics

### Key Metrics
- **Authentication Success Rate**: Login success vs failures
- **Provider Usage**: OAuth vs credentials usage
- **2FA Adoption**: Percentage of users with 2FA
- **Session Duration**: Average user session length
- **Security Events**: Failed login attempts, suspicious activity

### Logging Strategy
- **Authentication Events**: All login/logout events
- **Security Events**: Failed attempts, role changes
- **Performance Events**: Slow authentication responses
- **Error Events**: System failures and exceptions

---

This authentication system provides enterprise-grade security with user-friendly features, comprehensive error handling, and excellent developer experience. The modular design allows for easy extension and customization as requirements evolve. 