# DOCUMENT 3 — Security & Access Document (SAD)

> **Product:** AutoApply AI  
> **Version:** 1.0.0-DRAFT  
> **Last Updated:** 2026-07-18  
> **Owner:** Security Architecture Office  
> **Classification:** Confidential — Internal  
> **Status:** Draft — Pending Security Review  

---

## 1. Security Architecture Overview

### 1.1 Security Design Philosophy

AutoApply AI handles two categories of exceptionally sensitive data that demand a security-first architecture:

| Data Category | Sensitivity | Examples | Risk if Breached |
|---|---|---|---|
| **Career Identity Data** | HIGH | Resumes, cover letters, work history, education, salary information, contact details | Identity theft, social engineering, discriminatory profiling |
| **Aggregator Credentials** | CRITICAL | Naukri passwords, LinkedIn passwords, Indeed passwords — effectively the user's keys to their professional identity | Account takeover across multiple platforms, unauthorized applications, reputational damage |

The security architecture is designed around the principle that **a breach of AutoApply AI must never cascade into a breach of the user's external job-board accounts.**

### 1.2 Security Zones & Trust Boundaries

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SECURITY ZONES & TRUST BOUNDARIES                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ZONE 0: UNTRUSTED (Public Internet)                                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  • User browsers                                                   │  │
│  │  • Mobile clients                                                  │  │
│  │  • Third-party aggregator websites                                 │  │
│  │  • Attack surface: DDoS, MITM, XSS, CSRF                         │  │
│  └──────────────────────────────┬─────────────────────────────────────┘  │
│                                 │ TLS 1.3 ONLY                          │
│                                 ▼                                        │
│  ══════════════════════════ TRUST BOUNDARY 1 ═══════════════════════════ │
│                                                                          │
│  ZONE 1: DMZ (Edge / Gateway)                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  • CloudFront CDN (DDoS mitigation, geo-filtering)                │  │
│  │  • AWS WAF (OWASP rule set, rate limiting, bot detection)         │  │
│  │  • API Gateway (JWT validation, request sanitization)             │  │
│  │  • Controls: IP allowlisting, geo-blocking, request throttling    │  │
│  └──────────────────────────────┬─────────────────────────────────────┘  │
│                                 │ mTLS (Istio)                          │
│                                 ▼                                        │
│  ══════════════════════════ TRUST BOUNDARY 2 ═══════════════════════════ │
│                                                                          │
│  ZONE 2: APPLICATION (Service Mesh)                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  • Application microservices (User, Asset, Aggregator, etc.)      │  │
│  │  • Inter-service communication via Istio mTLS                     │  │
│  │  • Service-level AuthZ (OPA policies)                             │  │
│  │  • Controls: RBAC, input validation, output encoding              │  │
│  └──────────────────────────────┬─────────────────────────────────────┘  │
│                                 │ IAM Roles + VPC Security Groups       │
│                                 ▼                                        │
│  ══════════════════════════ TRUST BOUNDARY 3 ═══════════════════════════ │
│                                                                          │
│  ZONE 3: DATA (Persistence Layer)                                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  • PostgreSQL (encrypted at rest, encrypted in transit)           │  │
│  │  • Redis (AUTH + TLS, no external access)                         │  │
│  │  • S3 (bucket policies, no public access, SSE-S3/SSE-KMS)        │  │
│  │  • Elasticsearch (VPC-only access, node-to-node encryption)       │  │
│  │  • Controls: VPC isolation, security groups, no public endpoints  │  │
│  └──────────────────────────────┬─────────────────────────────────────┘  │
│                                 │ Vault Token (short-lived, scoped)     │
│                                 ▼                                        │
│  ══════════════════════════ TRUST BOUNDARY 4 ═══════════════════════════ │
│                                                                          │
│  ZONE 4: SECRETS (Highest Security)                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  • HashiCorp Vault (HSM-backed seal, audit-logged)                │  │
│  │  • AWS KMS (CMK for envelope encryption)                          │  │
│  │  • Controls: Vault policies, AppRole auth, response wrapping,     │  │
│  │    seal/unseal ceremony, break-glass procedures                   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Security Principles

| # | Principle | Implementation |
|---|---|---|
| 1 | **Least Privilege** | Every service has minimum IAM/Vault permissions required. No service can access credentials it doesn't need. |
| 2 | **Defense in Depth** | Multiple overlapping controls: WAF → API Gateway → Service AuthZ → Data Encryption → Vault. |
| 3 | **Zero Trust Networking** | All inter-service communication via mTLS (Istio). No implicit trust based on network location. |
| 4 | **Encrypt Everything** | TLS 1.3 in transit, AES-256-GCM at rest, envelope encryption for credentials. |
| 5 | **Audit Everything** | Every credential access, admin action, and authentication event is immutably logged. |
| 6 | **Fail Secure** | On security control failure, deny access rather than allow. Vault seal on anomaly. |
| 7 | **Separation of Duties** | No single individual can access production credentials. Vault unseal requires 3-of-5 key shares (Shamir). |

---

## 2. Credential Vaulting Architecture

This is the most security-critical component of the entire system. User aggregator credentials (Naukri password, LinkedIn password, etc.) are the highest-value targets for an attacker.

### 2.1 Encryption Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│               CREDENTIAL ENCRYPTION ARCHITECTURE                        │
│               (Envelope Encryption with HSM-backed Root)                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER ENTERS CREDENTIALS (e.g., Naukri password)                        │
│      │                                                                   │
│      │ TLS 1.3 (client → API Gateway → Aggregator Service)              │
│      ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │               ENCRYPTION FLOW (Write Path)                       │    │
│  │                                                                  │    │
│  │  Step 1: Aggregator Service receives plaintext credential        │    │
│  │          (exists in memory for < 100ms)                          │    │
│  │                                                                  │    │
│  │  Step 2: Request Data Encryption Key (DEK) from Vault            │    │
│  │          POST /v1/transit/datakey/plaintext/user-credentials     │    │
│  │          Response: {                                             │    │
│  │            "plaintext_dek": "base64(DEK)",     ← use to encrypt │    │
│  │            "ciphertext_dek": "vault:v1:..."    ← store this     │    │
│  │          }                                                       │    │
│  │                                                                  │    │
│  │  Step 3: Encrypt credential with DEK                             │    │
│  │          Algorithm: AES-256-GCM                                  │    │
│  │          Input: plaintext_credential + random 96-bit IV          │    │
│  │          Output: encrypted_credential + IV + auth_tag            │    │
│  │                                                                  │    │
│  │  Step 4: Store in Vault KV secrets engine                        │    │
│  │          Path: secret/data/users/{userId}/aggregators/{aggId}   │    │
│  │          Payload: {                                              │    │
│  │            "encrypted_credential": "base64(...)",                │    │
│  │            "iv": "base64(96-bit IV)",                            │    │
│  │            "auth_tag": "base64(128-bit tag)",                    │    │
│  │            "encrypted_dek": "vault:v1:...",                      │    │
│  │            "algorithm": "AES-256-GCM",                           │    │
│  │            "key_version": 3,                                     │    │
│  │            "created_at": "2026-07-18T00:00:00Z",                │    │
│  │            "rotated_at": null                                    │    │
│  │          }                                                       │    │
│  │                                                                  │    │
│  │  Step 5: Zero plaintext credential from memory                   │    │
│  │          (explicit buffer.fill(0) / memset equivalent)           │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │               DECRYPTION FLOW (Read Path)                        │    │
│  │                                                                  │    │
│  │  Step 1: Form Filler requests credential for application         │    │
│  │          (authenticated via Vault AppRole token)                 │    │
│  │                                                                  │    │
│  │  Step 2: Read encrypted payload from Vault KV                    │    │
│  │          GET /v1/secret/data/users/{userId}/aggregators/{aggId} │    │
│  │                                                                  │    │
│  │  Step 3: Decrypt DEK via Vault Transit engine                    │    │
│  │          POST /v1/transit/decrypt/user-credentials               │    │
│  │          Body: { "ciphertext": "vault:v1:..." }                  │    │
│  │          Response: { "plaintext": "base64(DEK)" }                │    │
│  │                                                                  │    │
│  │  Step 4: Decrypt credential with DEK                             │    │
│  │          AES-256-GCM decrypt with stored IV and auth_tag         │    │
│  │                                                                  │    │
│  │  Step 5: Use credential for aggregator login                     │    │
│  │          (credential exists in memory only during login)         │    │
│  │                                                                  │    │
│  │  Step 6: Zero credential from memory immediately after use       │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │               KEY HIERARCHY                                      │    │
│  │                                                                  │    │
│  │  Level 0: HSM Root Key (AWS CloudHSM)                            │    │
│  │      │    • Never leaves HSM boundary                            │    │
│  │      │    • FIPS 140-2 Level 3 certified                         │    │
│  │      │    • Used to seal/unseal Vault                            │    │
│  │      ▼                                                           │    │
│  │  Level 1: Vault Master Key (derived from HSM)                    │    │
│  │      │    • Protects Vault's storage backend                     │    │
│  │      │    • Shamir's Secret Sharing: 3-of-5 key shares           │    │
│  │      ▼                                                           │    │
│  │  Level 2: Transit Encryption Key (Vault-managed)                 │    │
│  │      │    • Named key: "user-credentials"                        │    │
│  │      │    • Type: aes256-gcm96                                   │    │
│  │      │    • Auto-rotation: every 90 days                         │    │
│  │      │    • Supports versioned decryption (old versions valid)   │    │
│  │      ▼                                                           │    │
│  │  Level 3: Data Encryption Keys (DEKs)                            │    │
│  │           • Unique per credential                                │    │
│  │           • Generated via Vault Transit datakey endpoint         │    │
│  │           • Encrypted DEK stored alongside encrypted credential  │    │
│  │           • Plaintext DEK never persisted to disk               │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 HashiCorp Vault Configuration

#### Vault Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    VAULT DEPLOYMENT TOPOLOGY                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────── ap-south-1 (Mumbai) ───────────────────────┐       │
│  │                                                               │       │
│  │  Vault Cluster (Primary):                                     │       │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │       │
│  │  │ Vault-1 │  │ Vault-2 │  │ Vault-3 │                      │       │
│  │  │ (Leader)│  │(Standby)│  │(Standby)│                      │       │
│  │  │  AZ-1a  │  │  AZ-1b  │  │  AZ-1c  │                      │       │
│  │  └────┬────┘  └────┬────┘  └────┬────┘                      │       │
│  │       │            │            │                             │       │
│  │       └────────────┼────────────┘                             │       │
│  │                    │                                          │       │
│  │              ┌─────▼──────┐                                   │       │
│  │              │  Consul    │  (Service discovery + storage     │       │
│  │              │  Cluster   │   backend for Vault)              │       │
│  │              │  (3 nodes) │                                   │       │
│  │              └────────────┘                                   │       │
│  │                                                               │       │
│  │  Seal Provider: AWS CloudHSM (FIPS 140-2 Level 3)            │       │
│  │  Storage Backend: Consul (encrypted, HA)                      │       │
│  │  Audit Backend: File + Syslog → Datadog                      │       │
│  │                                                               │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                           │                                              │
│                           │ Vault Replication (DR)                       │
│                           ▼                                              │
│  ┌────────────────── us-east-1 (Virginia) ──────────────────────┐       │
│  │                                                               │       │
│  │  Vault Cluster (DR Secondary):                                │       │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │       │
│  │  │ Vault-4 │  │ Vault-5 │  │ Vault-6 │                      │       │
│  │  │  AZ-1a  │  │  AZ-1b  │  │  AZ-1c  │                      │       │
│  │  └─────────┘  └─────────┘  └─────────┘                      │       │
│  │                                                               │       │
│  │  Mode: Read-only DR replica                                   │       │
│  │  Promotion: Manual (requires break-glass procedure)           │       │
│  │                                                               │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Vault Policy Definitions

```hcl
# Policy: aggregator-service (can store and read credentials)
path "secret/data/users/+/aggregators/*" {
  capabilities = ["create", "read", "update", "delete"]
}
path "transit/datakey/plaintext/user-credentials" {
  capabilities = ["update"]
}
path "transit/decrypt/user-credentials" {
  capabilities = ["update"]
}

# Policy: form-filler (can ONLY read credentials — never write)
path "secret/data/users/+/aggregators/*" {
  capabilities = ["read"]
}
path "transit/decrypt/user-credentials" {
  capabilities = ["update"]
}

# Policy: scanner (can ONLY read credentials for login — never write)
path "secret/data/users/+/aggregators/*" {
  capabilities = ["read"]
}
path "transit/decrypt/user-credentials" {
  capabilities = ["update"]
}

# Policy: admin-readonly (security team — audit only)
path "sys/audit/*" {
  capabilities = ["read", "list"]
}
path "secret/metadata/*" {
  capabilities = ["read", "list"]
}
# Explicitly DENY access to secret data
path "secret/data/*" {
  capabilities = ["deny"]
}

# Policy: key-rotation (automated rotation service)
path "transit/keys/user-credentials/rotate" {
  capabilities = ["update"]
}
path "transit/keys/user-credentials" {
  capabilities = ["read"]
}
```

### 2.3 Key Rotation & Lifecycle

| Key Type | Rotation Frequency | Mechanism | Impact on Existing Data |
|---|---|---|---|
| **HSM Root Key** | Annually (or on compromise) | Manual ceremony, 3-of-5 key custodians | Vault re-seal/unseal with new key |
| **Vault Transit Key** | Every 90 days (automated) | `POST /v1/transit/keys/user-credentials/rotate` | Old versions retained for decryption; new encryptions use latest version |
| **Data Encryption Keys (DEKs)** | On Transit Key rotation | Lazy re-encryption: DEKs re-wrapped with new Transit Key version on next read | Transparent to application; old ciphertext_dek still decryptable |
| **User Aggregator Passwords** | Not rotated by system | User responsibility; system re-validates every 6 hours | If validation fails → alert user to update credentials |
| **Service AppRole Tokens** | Every 24 hours (TTL-based) | Vault AppRole with `secret_id_ttl=86400` | Auto-renewed by Vault Agent sidecar in K8s pods |
| **JWT Signing Keys** | Every 30 days | RS256 key pair rotation; old public keys retained in JWKS for token validation | Tokens signed with old key remain valid until expiry |

### 2.4 Credential Access Audit Trail

Every credential access generates an immutable audit log entry:

```json
{
  "time": "2026-07-18T03:14:22.847Z",
  "type": "response",
  "auth": {
    "client_token": "hmac-sha256:abc123...",
    "accessor": "hmac-sha256:def456...",
    "display_name": "approle-form-filler",
    "policies": ["form-filler"],
    "token_type": "service",
    "token_ttl": 3600
  },
  "request": {
    "id": "req-uuid-789",
    "operation": "read",
    "path": "secret/data/users/user-uuid-001/aggregators/naukri",
    "remote_address": "10.0.42.17",
    "namespace": { "id": "root" }
  },
  "response": {
    "data": {
      "encrypted_credential": "hmac-sha256:...",
      "metadata": { "version": 3 }
    }
  },
  "correlation_id": "trace-id-from-otel-abc",
  "user_context": {
    "user_id": "user-uuid-001",
    "aggregator": "naukri",
    "purpose": "application_submission",
    "application_id": "app-uuid-456"
  }
}
```

**Audit Log Retention:** 2 years (regulatory compliance) → S3 Glacier after 90 days.

**Anomaly Detection Rules:**

| Rule | Threshold | Action |
|---|---|---|
| Excessive reads from single service | > 100 credential reads in 1 minute | Auto-revoke token, alert security team |
| Read from unauthorized IP | Source IP not in expected K8s pod CIDR | Auto-deny, P1 alert |
| Credential read outside business hours | Access between 2 AM – 6 AM local time (and no active applications) | Flag for review |
| Bulk credential enumeration | Reading credentials for > 50 different users in 5 minutes | Auto-seal Vault, P0 incident |
| Failed authentication spike | > 20 failed Vault auth attempts in 1 minute | Block source, P1 alert |

---

## 3. Authentication & Authorization

### 3.1 OAuth 2.0 + OpenID Connect

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION ARCHITECTURE                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SUPPORTED AUTH METHODS:                                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  1. Email + Password                                               │  │
│  │     • Password requirements: 12+ chars, 1 uppercase, 1 number,    │  │
│  │       1 special char. Checked against HaveIBeenPwned API.         │  │
│  │     • Hashing: Argon2id (memory: 64MB, iterations: 3, parallelism:│  │
│  │       4, salt: 16 bytes, hash: 32 bytes)                          │  │
│  │     • Rate limiting: 5 failed attempts → 15-min lockout           │  │
│  │       (per email, not per IP, to prevent credential stuffing)     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  2. Google OAuth 2.0 (OpenID Connect)                              │  │
│  │     • Flow: Authorization Code + PKCE                              │  │
│  │     • Scopes: openid, email, profile                               │  │
│  │     • Token exchange: Server-side (no implicit flow)               │  │
│  │     • ID Token validation: RS256 signature, iss, aud, exp, nonce   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  3. LinkedIn OAuth 2.0 (OpenID Connect)                            │  │
│  │     • Flow: Authorization Code + PKCE                              │  │
│  │     • Scopes: openid, profile, email                               │  │
│  │     • Note: LinkedIn OAuth for PLATFORM login only — separate      │  │
│  │       from LinkedIn aggregator credential storage                  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  AUTHENTICATION FLOW:                                                    │
│                                                                          │
│  ┌─────────┐                    ┌──────────┐                            │
│  │  User   │───── Login ───────►│  Auth    │                            │
│  │ Browser │    (credentials)   │  Service │                            │
│  └────┬────┘                    └────┬─────┘                            │
│       │                              │                                   │
│       │                              ├── Validate credentials            │
│       │                              ├── Check MFA requirement           │
│       │                              ├── Generate token pair:            │
│       │                              │                                   │
│       │                              │   Access Token (JWT):             │
│       │                              │   ┌──────────────────────┐       │
│       │                              │   │ Header: RS256        │       │
│       │                              │   │ Payload:             │       │
│       │                              │   │  sub: "user-uuid"    │       │
│       │                              │   │  email: "user@..."   │       │
│       │                              │   │  role: "user"        │       │
│       │                              │   │  tier: "pro"         │       │
│       │                              │   │  iat: 1721267200     │       │
│       │                              │   │  exp: 1721270800     │       │
│       │                              │   │  jti: "unique-id"    │       │
│       │                              │   │  iss: "autoapply.ai" │       │
│       │                              │   └──────────────────────┘       │
│       │                              │   TTL: 1 hour                    │
│       │                              │                                   │
│       │                              │   Refresh Token (Opaque):         │
│       │                              │   • Stored server-side (Redis)   │
│       │                              │   • TTL: 30 days                 │
│       │                              │   • Single-use (rotated on use)  │
│       │                              │   • Bound to device fingerprint  │
│       │                              │                                   │
│       │◄────── Set Cookies ──────────┤                                   │
│       │  access_token: HttpOnly,     │                                   │
│       │    Secure, SameSite=Strict,  │                                   │
│       │    Path=/api, Max-Age=3600   │                                   │
│       │                              │                                   │
│       │  refresh_token: HttpOnly,    │                                   │
│       │    Secure, SameSite=Strict,  │                                   │
│       │    Path=/api/auth/refresh,   │                                   │
│       │    Max-Age=2592000           │                                   │
│       │                              │                                   │
│       │  __csrf: Secure,             │                                   │
│       │    SameSite=Strict           │                                   │
│       │                              │                                   │
└───────┴──────────────────────────────┴───────────────────────────────────┘
```

### 3.2 Multi-Factor Authentication (MFA)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MFA ARCHITECTURE                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MFA ENFORCEMENT POLICY:                                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Tier         │ MFA Requirement                                     │  │
│  ├──────────────┼─────────────────────────────────────────────────────┤  │
│  │ Free         │ Optional (recommended)                              │  │
│  │ Pro          │ Required for credential management actions          │  │
│  │ Enterprise   │ Required for all logins (configurable by admin)     │  │
│  │ Admin/Staff  │ Required always (TOTP + hardware key)               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  SUPPORTED MFA METHODS (Priority Order):                                 │
│                                                                          │
│  1. TOTP (Time-based One-Time Password):                                │
│     • Standard: RFC 6238 (TOTP) + RFC 4226 (HOTP base)                 │
│     • Apps: Google Authenticator, Authy, 1Password                      │
│     • Secret: 160-bit, base32 encoded                                   │
│     • Algorithm: HMAC-SHA1, 6 digits, 30-second window                  │
│     • Clock drift tolerance: ±1 window (±30 seconds)                    │
│     • Backup codes: 10 single-use codes, Argon2id hashed               │
│                                                                          │
│  2. SMS OTP (Fallback — less secure):                                    │
│     • Provider: AWS SNS (India) / Twilio (International)                │
│     • OTP: 6 digits, 5-minute expiry, single-use                       │
│     • Rate limit: Max 5 SMS per hour per user                           │
│     • Note: SMS MFA is offered but discouraged in UX; TOTP preferred   │
│                                                                          │
│  3. WebAuthn / Passkeys (Phase 2):                                      │
│     • FIDO2 standard                                                     │
│     • Hardware keys (YubiKey) and platform authenticators               │
│     • Strongest MFA option — phishing-resistant                          │
│                                                                          │
│  MFA-PROTECTED ACTIONS (require step-up authentication):                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Action                              │ MFA Required?                │  │
│  ├─────────────────────────────────────┼──────────────────────────────┤  │
│  │ View dashboard, activity feed       │ No (session token sufficient)│  │
│  │ Upload/edit resume                  │ No                           │  │
│  │ Connect new aggregator (credential) │ YES (always)                 │  │
│  │ View stored credentials             │ Not possible (by design)     │  │
│  │ Update aggregator credentials       │ YES (always)                 │  │
│  │ Delete account                      │ YES (always)                 │  │
│  │ Change password                     │ YES (always)                 │  │
│  │ Change email                        │ YES (always)                 │  │
│  │ Disable MFA                         │ YES (always) + email confirm│  │
│  │ Export personal data (GDPR)         │ YES (always)                 │  │
│  │ Modify billing/subscription         │ YES (always)                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  STEP-UP AUTHENTICATION FLOW:                                            │
│                                                                          │
│  User triggers MFA-protected action                                      │
│      │                                                                   │
│      ▼                                                                   │
│  API returns 403 with header: X-MFA-Required: true                      │
│      │                                                                   │
│      ▼                                                                   │
│  Frontend displays MFA challenge modal                                   │
│      │                                                                   │
│      ▼                                                                   │
│  User enters TOTP code / SMS OTP                                         │
│      │                                                                   │
│      ▼                                                                   │
│  Auth Service validates code → issues step-up token                      │
│  (short-lived JWT with elevated claim: "mfa_verified": true,            │
│   "mfa_exp": now + 5 minutes)                                           │
│      │                                                                   │
│      ▼                                                                   │
│  Original request retried with step-up token                             │
│  API Gateway validates mfa_verified claim                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Session Management & Token Lifecycle

| Token Type | Storage | TTL | Rotation | Revocation |
|---|---|---|---|---|
| **Access Token (JWT)** | HttpOnly cookie (browser) | 1 hour | On refresh | Cannot be revoked (short TTL mitigates); for immediate revocation: add `jti` to Redis blocklist (checked at API Gateway) |
| **Refresh Token** | HttpOnly cookie (browser) + Redis (server) | 30 days | Rotated on every use (old token invalidated) | Delete from Redis; all refresh tokens for user revoked on password change |
| **Vault AppRole Token** | K8s pod env (via Vault Agent) | 24 hours | Auto-renewed by Vault Agent sidecar | Revoked on pod termination |
| **OAuth Provider Tokens** | Server-side encrypted (PostgreSQL) | Provider-dependent | Refresh via OAuth refresh_token flow | Revoked on account deletion or aggregator disconnect |
| **CSRF Token** | Non-HttpOnly cookie (read by JS) | Per-session | Regenerated on login | Invalidated on logout |

**Session Security Controls:**

| Control | Implementation |
|---|---|
| **Concurrent session limit** | Max 5 active sessions per user. Oldest session terminated on 6th login. |
| **Session binding** | Refresh token bound to: User-Agent hash + IP subnet (/24). Mismatch → require re-authentication. |
| **Idle timeout** | 30 minutes of inactivity → access token not refreshed → forced re-login. |
| **Absolute timeout** | 30 days maximum session lifetime (refresh token expiry). |
| **Logout** | Client-side: clear cookies. Server-side: delete refresh token from Redis, add access token `jti` to blocklist. |
| **Password change** | Revoke ALL refresh tokens for user (force re-login on all devices). |
| **Suspicious activity** | New device/location login → email notification + optional MFA challenge. |

### 3.4 Role-Based Access Control (RBAC)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     RBAC MODEL                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ROLES:                                                                  │
│                                                                          │
│  ┌─────────────┬──────────────────────────────────────────────────────┐  │
│  │ Role        │ Permissions                                          │  │
│  ├─────────────┼──────────────────────────────────────────────────────┤  │
│  │ user:free   │ • CRUD own profile, resume, cover letters           │  │
│  │             │ • Connect up to 2 aggregators                        │  │
│  │             │ • View own applications (max 5/day)                  │  │
│  │             │ • View basic skill-gap feedback                      │  │
│  │             │ • Cannot: access premium insights, unlimited apply   │  │
│  ├─────────────┼──────────────────────────────────────────────────────┤  │
│  │ user:pro    │ • All user:free permissions                          │  │
│  │             │ • Connect unlimited aggregators                      │  │
│  │             │ • Unlimited daily applications                       │  │
│  │             │ • Full AI feedback center access                     │  │
│  │             │ • Cover letter generation (all modes)                │  │
│  │             │ • Priority application queue                         │  │
│  ├─────────────┼──────────────────────────────────────────────────────┤  │
│  │ user:ent    │ • All user:pro permissions                           │  │
│  │             │ • API access for bulk operations                     │  │
│  │             │ • Team dashboard (view team members' activity)       │  │
│  │             │ • Custom aggregator configuration                    │  │
│  │             │ • Dedicated support channel                          │  │
│  ├─────────────┼──────────────────────────────────────────────────────┤  │
│  │ admin       │ • All user permissions (impersonation)               │  │
│  │             │ • User management (suspend, delete, tier change)     │  │
│  │             │ • System configuration (feature flags, rate limits)  │  │
│  │             │ • View aggregated analytics (never individual data)  │  │
│  │             │ • Adapter management (enable/disable/update)         │  │
│  │             │ • Cannot: access user credentials (Vault denies)     │  │
│  ├─────────────┼──────────────────────────────────────────────────────┤  │
│  │ security    │ • Audit log access (read-only)                       │  │
│  │             │ • Vault audit log access                             │  │
│  │             │ • Incident response tools                            │  │
│  │             │ • Cannot: access user data or credentials            │  │
│  ├─────────────┼──────────────────────────────────────────────────────┤  │
│  │ service:*   │ • Service-specific permissions via Vault AppRole     │  │
│  │             │ • Each service has a unique AppRole with minimum     │  │
│  │             │   required Vault/DB/Kafka permissions                │  │
│  │             │ • Defined in Vault policies (see Section 2.2)        │  │
│  └─────────────┴──────────────────────────────────────────────────────┘  │
│                                                                          │
│  AUTHORIZATION ENFORCEMENT:                                              │
│                                                                          │
│  Layer 1: API Gateway — JWT claim validation (role, tier)                │
│  Layer 2: Service-level — NestJS Guards (custom decorators)              │
│  Layer 3: Data-level — PostgreSQL Row-Level Security (RLS)               │
│           WHERE user_id = current_setting('app.current_user_id')         │
│  Layer 4: Vault-level — AppRole policies per service                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Protection & Privacy Compliance

### 4.1 GDPR Compliance (EU Users)

| GDPR Article | Requirement | AutoApply AI Implementation |
|---|---|---|
| **Art. 6** — Lawful Basis | Valid legal basis for processing | **Consent** (explicit opt-in at registration) + **Contract** (service delivery). Aggregator credential storage: explicit, granular consent per aggregator. |
| **Art. 7** — Conditions for Consent | Freely given, specific, informed, unambiguous | Consent collected via clear modal with: purpose, data types, third-party sharing, withdrawal method. No pre-checked boxes. Consent records timestamped and versioned. |
| **Art. 12-14** — Transparency | Clear privacy notice | Privacy Policy: plain language, layered format, available at registration and in settings. Cookie Policy: detailed, consent-based (CMP via OneTrust). |
| **Art. 15** — Right of Access | Data subject access requests (DSAR) | Self-service "Download My Data" feature: exports all personal data as ZIP (JSON + original files). Processing time: < 72 hours. |
| **Art. 17** — Right to Erasure | "Right to be forgotten" | Self-service account deletion: 7-day grace period → 30-day soft delete → hard delete. Cascading purge: user record, parsed profiles, applications, credentials (Vault), embeddings, cover letters, S3 files. Erasure confirmation email sent. |
| **Art. 20** — Data Portability | Machine-readable data export | Export includes: profile (JSON), resumes (original files), application history (CSV), skill-gap reports (JSON). Standard format, interoperable. |
| **Art. 25** — Data Protection by Design | Privacy by default | Minimum data collection. Credentials encrypted at rest (AES-256-GCM). Embeddings not reversible to original text. Analytics use anonymized/aggregated data only. |
| **Art. 28** — Processor Obligations | Data processing agreements | DPAs signed with: AWS, OpenAI, Anthropic, Stripe, SendGrid, proxy providers. Sub-processor list maintained and communicated to users. |
| **Art. 33-34** — Breach Notification | 72-hour breach notification | Incident response plan: detect → contain → assess → notify DPA within 72h → notify affected users "without undue delay" if high risk. |
| **Art. 35** — DPIA | Data Protection Impact Assessment | DPIA completed for: credential vaulting, AI-driven application submission, profile data processing. Reviewed annually or on significant processing changes. |
| **Art. 44-49** — International Transfers | Cross-border data transfer | EU user data processed in eu-west-1 (Phase 2). Standard Contractual Clauses (SCCs) with US sub-processors. Supplementary measures: encryption in transit + at rest, Vault access controls. |

### 4.2 India DPDP Act 2023 Compliance

| DPDP Provision | Requirement | AutoApply AI Implementation |
|---|---|---|
| **Section 4** — Lawful Processing | Consent or legitimate use | Explicit consent at registration. Consent for each aggregator credential stored separately. Consent withdrawal mechanism in settings. |
| **Section 5** — Notice | Clear notice before processing | Registration notice: purpose, data types, retention period, rights, grievance officer contact. Available in English and Hindi. |
| **Section 6** — Consent | Free, specific, informed, unambiguous, clear affirmative action | Granular consent toggles: (1) Profile data processing, (2) Credential storage per aggregator, (3) AI-driven application submission, (4) Market analysis data collection, (5) Communication preferences. |
| **Section 8** — Rights of Data Principal | Access, correction, erasure, grievance redressal | Self-service data access and deletion. Grievance officer: designated DPO, response within 30 days. Grievance escalation to Data Protection Board of India. |
| **Section 9** — Duties of Data Fiduciary | Accuracy, completeness, consistency; security safeguards | Data accuracy: user-editable profiles, AI parsing with human review. Security: encryption, access controls, audit logging. Data retention policy: 3 years post account inactivity → auto-purge with 30-day notice. |
| **Section 11** — Significant Data Fiduciary | Enhanced obligations for significant fiduciaries | Proactive compliance: annual DPIA, independent audit, DPO appointment. Even if not designated as SDF initially, architecture is built to comply. |
| **Section 16** — Data Breach Notification | Notify DPBI and affected individuals | Same incident response plan as GDPR (Section 4.1). Additional notification to Data Protection Board of India. |
| **Section 17** — Cross-Border Transfer | Data transfer restrictions | Indian user career data stored in ap-south-1 (Mumbai). Credentials never leave Indian region for Indian users. Only anonymized analytics may be processed in us-east-1. |

### 4.3 Data Residency & Cross-Border Transfer Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  DATA RESIDENCY ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────── INDIAN USERS ───────────────────────────────┐      │
│  │                                                                │      │
│  │  Data Residency: ap-south-1 (Mumbai)                          │      │
│  │                                                                │      │
│  │  ┌───────────────────────────────────────────────────────┐    │      │
│  │  │ Personal Data (NEVER leaves ap-south-1):              │    │      │
│  │  │ • User profiles, parsed resumes, contact info         │    │      │
│  │  │ • Aggregator credentials (Vault Mumbai)               │    │      │
│  │  │ • Application records, cover letters                  │    │      │
│  │  │ • Resume files (S3 ap-south-1)                        │    │      │
│  │  │ • Skill-gap feedback, personal insights               │    │      │
│  │  └───────────────────────────────────────────────────────┘    │      │
│  │                                                                │      │
│  │  ┌───────────────────────────────────────────────────────┐    │      │
│  │  │ Cross-Border (Anonymized only):                       │    │      │
│  │  │ • Anonymized JD corpus → Elasticsearch (us-east-1)    │    │      │
│  │  │   (no PII, only JD text + metadata)                   │    │      │
│  │  │ • Aggregated platform analytics → ClickHouse          │    │      │
│  │  │   (no individual user data)                           │    │      │
│  │  │ • LLM API calls → OpenAI/Anthropic (US)              │    │      │
│  │  │   (prompts contain resume excerpts — covered by DPA   │    │      │
│  │  │    + data processing addendum with providers)          │    │      │
│  │  └───────────────────────────────────────────────────────┘    │      │
│  │                                                                │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌────────────────── INTERNATIONAL USERS ────────────────────────┐      │
│  │                                                                │      │
│  │  Data Residency: us-east-1 (Virginia) — default               │      │
│  │                  eu-west-1 (Ireland) — for EU users (Phase 2)  │      │
│  │                                                                │      │
│  │  Determination: User's registration country / billing address │      │
│  │  Migration: Not supported post-registration (Phase 1)         │      │
│  │                                                                │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌────────────────── LLM API DATA FLOW ──────────────────────────┐      │
│  │                                                                │      │
│  │  CONCERN: Resume content sent to OpenAI/Anthropic APIs        │      │
│  │                                                                │      │
│  │  MITIGATIONS:                                                  │      │
│  │  1. Data Processing Addenda (DPA) signed with:                │      │
│  │     • OpenAI: Zero data retention (ZDR) API tier              │      │
│  │     • Anthropic: Enterprise agreement with DPA                 │      │
│  │  2. Prompt minimization: Only send relevant resume excerpts,  │      │
│  │     not full resume (reduces data exposure surface)            │      │
│  │  3. PII stripping: Before sending to LLM, strip:             │      │
│  │     • Phone numbers (replace with [PHONE])                    │      │
│  │     • Email addresses (replace with [EMAIL])                  │      │
│  │     • Physical addresses (replace with [CITY, COUNTRY])       │      │
│  │     Re-inject PII into generated output post-LLM              │      │
│  │  4. Self-hosted models (Llama 3.1 via vLLM) for sensitive     │      │
│  │     operations: skill extraction runs entirely on-premise     │      │
│  │  5. User consent: Explicit consent for "AI processing"        │      │
│  │     collected at registration with ability to opt-out          │      │
│  │     (degrades to template-only cover letters)                  │      │
│  │                                                                │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Application Security

### 5.1 OWASP Top 10 Mitigations

| OWASP Risk | Mitigation |
|---|---|
| **A01: Broken Access Control** | JWT-based AuthZ at API Gateway + NestJS Guards + PostgreSQL RLS. All API endpoints require authentication. Admin endpoints require admin role + MFA. No CORS wildcard (whitelist: app.autoapply.ai). |
| **A02: Cryptographic Failures** | TLS 1.3 enforced (TLS 1.2 minimum). AES-256-GCM for credentials. Argon2id for passwords. No MD5/SHA1 anywhere. Certificate pinning for mobile (Phase 2). |
| **A03: Injection** | Parameterized queries (TypeORM/Prisma). Input validation via Zod/Joi schemas on all API endpoints. Output encoding (React's default JSX escaping). CSP headers block inline scripts. |
| **A04: Insecure Design** | Threat modeling completed pre-development. Security review gate in CI/CD. Rate limiting on all endpoints. Fail-secure defaults. |
| **A05: Security Misconfiguration** | Infrastructure as Code (Terraform) — reviewed and version-controlled. No default credentials. Security headers: HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy. Automated security scanning (tfsec, checkov). |
| **A06: Vulnerable Components** | Automated dependency scanning (Snyk/Dependabot). Weekly vulnerability reports. SLA: Critical CVE patched within 48 hours. Container base images: distroless/minimal. |
| **A07: Auth Failures** | Argon2id password hashing. Account lockout after 5 failed attempts. Breach password check (HIBP). MFA for sensitive actions. Session binding (UA + IP subnet). |
| **A08: Data Integrity Failures** | Signed JWTs (RS256). HMAC verification on Kafka events. S3 object versioning + MFA Delete. CI/CD pipeline: signed commits, image signing (cosign). |
| **A09: Logging & Monitoring Failures** | Structured logging with correlation IDs. All auth events logged. Vault audit log. SIEM integration (Datadog Security). Real-time alerting via PagerDuty. |
| **A10: SSRF** | Aggregator URLs validated against allowlist. Playwright browser: network access restricted to known aggregator domains via proxy allowlist. Internal services: no outbound internet access (NAT Gateway restricted). |

### 5.2 Security Headers Configuration

```nginx
# Applied via API Gateway / CloudFront
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  # Deprecated; CSP handles this
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.autoapply.ai;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://cdn.autoapply.ai https://*.amazonaws.com;
  connect-src 'self' https://api.autoapply.ai wss://ws.autoapply.ai;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### 5.3 API Security Controls

| Control | Implementation |
|---|---|
| **Rate Limiting** | Per-user: 100 req/min (free), 300 req/min (pro), 1000 req/min (enterprise). Per-IP: 500 req/min. Sliding window via Redis. 429 response with Retry-After header. |
| **Request Size Limits** | Max body: 10 MB (for resume upload). Max header: 16 KB. Max URL: 8 KB. |
| **Input Validation** | Zod schemas on all request bodies. Reject unknown fields (strict mode). File upload: validate MIME type (application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document) + magic bytes verification. Max file size: 10 MB. |
| **Output Sanitization** | PII masking in API responses where applicable. Error messages: generic (no stack traces in production). Log redaction: password fields, credential data, PII auto-redacted via log scrubbing rules. |
| **API Versioning** | URL-based versioning (/v1/...). Deprecated versions: 6-month sunset with migration guide. |
| **CORS** | Allowed origins: `https://app.autoapply.ai`, `https://staging.autoapply.ai`. No wildcards. Allowed methods: GET, POST, PUT, PATCH, DELETE. Credentials: true. |

---

## 6. Incident Response & Audit Logging

### 6.1 Incident Response Plan

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    INCIDENT RESPONSE FRAMEWORK                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SEVERITY CLASSIFICATION:                                                │
│                                                                          │
│  ┌────────┬────────────────────────────────────────────────────────────┐ │
│  │ Level  │ Description                              │ Response SLA  │ │
│  ├────────┼──────────────────────────────────────────┼───────────────┤ │
│  │ P0     │ Active data breach, credential exposure, │ Immediate     │ │
│  │ (SEV1) │ Vault compromise, production down        │ (< 15 min)    │ │
│  ├────────┼──────────────────────────────────────────┼───────────────┤ │
│  │ P1     │ Potential breach, anomalous credential   │ < 1 hour      │ │
│  │ (SEV2) │ access, single adapter compromised       │               │ │
│  ├────────┼──────────────────────────────────────────┼───────────────┤ │
│  │ P2     │ Security vulnerability discovered,       │ < 4 hours     │ │
│  │ (SEV3) │ non-exploited CVE, config drift          │               │ │
│  ├────────┼──────────────────────────────────────────┼───────────────┤ │
│  │ P3     │ Security improvement opportunity,        │ < 24 hours    │ │
│  │ (SEV4) │ low-risk finding, policy update          │               │ │
│  └────────┴──────────────────────────────────────────┴───────────────┘ │
│                                                                          │
│  INCIDENT RESPONSE PHASES:                                               │
│                                                                          │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌───────────┐ │
│  │ DETECT  │→│ CONTAIN  │→│ ASSESS  │→│ REMEDIATE│→│ POST-     │ │
│  │         │  │          │  │         │  │          │  │ INCIDENT  │ │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └────┬─────┘  └─────┬─────┘ │
│       │            │             │             │               │        │
│       ▼            ▼             ▼             ▼               ▼        │
│  • SIEM alert  • Vault auto- • Scope      • Patch/fix    • Blameless  │
│  • Anomaly       seal           assessment • Credential     retrospect │
│    detection  • Revoke        • Data         rotation     • Timeline   │
│  • User         tokens          exposure   • User           document  │
│    report     • Isolate         analysis     notification• Update      │
│  • Automated    affected      • Root cause • DPA/DPBI      runbook    │
│    scanning     services        analysis     notification• Improve     │
│               • Preserve                   (if required)   controls   │
│                 evidence                                              │
│                                                                          │
│  CREDENTIAL BREACH SPECIFIC RUNBOOK:                                     │
│                                                                          │
│  1. IMMEDIATE (0-15 min):                                                │
│     • Auto-seal Vault (prevents further credential reads)               │
│     • Revoke all active Vault tokens                                    │
│     • Alert security on-call + CTO                                      │
│                                                                          │
│  2. CONTAINMENT (15 min - 1 hour):                                      │
│     • Identify scope: which users' credentials potentially exposed     │
│     • Disable all aggregator automation (pause AI Engine globally)      │
│     • Preserve Vault audit logs, K8s pod logs, network flow logs        │
│                                                                          │
│  3. NOTIFICATION (1-4 hours):                                            │
│     • Notify affected users: "Your aggregator credentials may have      │
│       been compromised. Please change your passwords on [Naukri,        │
│       LinkedIn, etc.] immediately."                                      │
│     • Provide direct links to each aggregator's password reset page     │
│     • Notify DPBI (India) and relevant DPA (EU) within 72 hours        │
│                                                                          │
│  4. REMEDIATION (1-7 days):                                              │
│     • Root cause analysis and fix                                        │
│     • Force credential re-entry for all affected users                  │
│     • Independent security audit of Vault configuration                 │
│     • Rotate all encryption keys (Transit key, DEKs)                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Audit Log Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AUDIT LOG ARCHITECTURE                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AUDIT EVENT SOURCES:                                                    │
│                                                                          │
│  ┌─────────────────────┬──────────────────────────────────────────────┐  │
│  │ Source              │ Events Captured                              │  │
│  ├─────────────────────┼──────────────────────────────────────────────┤  │
│  │ Auth Service        │ Login success/failure, MFA challenge,        │  │
│  │                     │ password change, OAuth grant, token refresh, │  │
│  │                     │ session creation/termination, account        │  │
│  │                     │ lockout                                      │  │
│  ├─────────────────────┼──────────────────────────────────────────────┤  │
│  │ Vault (built-in)    │ Every secret read/write, token creation,     │  │
│  │                     │ policy change, seal/unseal, auth method      │  │
│  │                     │ configuration                                │  │
│  ├─────────────────────┼──────────────────────────────────────────────┤  │
│  │ Aggregator Service  │ Credential stored/updated/deleted, connection│  │
│  │                     │ validated, connection failed                 │  │
│  ├─────────────────────┼──────────────────────────────────────────────┤  │
│  │ AI Engine           │ Application submitted (anonymized), form     │  │
│  │                     │ fill completed, CAPTCHA encountered          │  │
│  ├─────────────────────┼──────────────────────────────────────────────┤  │
│  │ Admin Panel         │ User suspension, tier change, feature flag   │  │
│  │                     │ toggle, adapter enable/disable               │  │
│  ├─────────────────────┼──────────────────────────────────────────────┤  │
│  │ User Actions        │ Account deletion request, data export        │  │
│  │                     │ request, consent change, MFA enable/disable  │  │
│  ├─────────────────────┼──────────────────────────────────────────────┤  │
│  │ AWS CloudTrail      │ IAM changes, S3 bucket policy changes, RDS  │  │
│  │                     │ parameter changes, security group changes    │  │
│  └─────────────────────┴──────────────────────────────────────────────┘  │
│                                                                          │
│  AUDIT LOG PIPELINE:                                                     │
│                                                                          │
│  Sources → Kafka topic: `audit.events` → Flink (enrichment +            │
│  anomaly detection) → Elasticsearch (searchable, 90-day hot) →          │
│  S3 (cold storage, 2-year retention) → S3 Glacier (7-year archive)      │
│                                                                          │
│  IMMUTABILITY:                                                           │
│  • Kafka: append-only, no consumer deletes                              │
│  • S3: Object Lock (WORM) with Governance mode                          │
│  • Elasticsearch: read-only indices after rollover                       │
│  • CloudTrail: Log file validation (hash chain)                          │
│                                                                          │
│  AUDIT LOG SCHEMA (Standardized):                                        │
│  {                                                                       │
│    "event_id": "uuid",                                                   │
│    "timestamp": "ISO8601",                                               │
│    "event_type": "auth.login.success",                                  │
│    "actor": {                                                            │
│      "type": "user | service | admin",                                  │
│      "id": "actor-uuid",                                                │
│      "ip": "1.2.3.4",                                                   │
│      "user_agent": "Mozilla/5.0...",                                    │
│      "geo": { "country": "IN", "city": "Pune" }                        │
│    },                                                                    │
│    "resource": {                                                         │
│      "type": "credential | user | application",                        │
│      "id": "resource-uuid",                                             │
│      "aggregator": "naukri"                                             │
│    },                                                                    │
│    "action": "read | write | delete | login | logout",                  │
│    "outcome": "success | failure | denied",                             │
│    "metadata": { },                                                      │
│    "trace_id": "otel-trace-id"                                          │
│  }                                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Threat Model Summary

### 7.1 STRIDE Threat Analysis

| Threat | Category | Attack Scenario | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| **T1** | Spoofing | Attacker uses stolen OAuth token to impersonate user | Medium | Critical | Short-lived JWTs (1h), refresh token rotation, session binding (UA + IP subnet), anomalous login detection |
| **T2** | Tampering | Attacker modifies application data in transit | Low | High | TLS 1.3, mTLS between services, HMAC on Kafka events, JWT signature verification |
| **T3** | Repudiation | User denies having authorized an application | Medium | Medium | Immutable audit log of all AI Engine actions with user consent records, application screenshots |
| **T4** | Information Disclosure | Breach of credential vault exposes aggregator passwords | Low | Critical | Envelope encryption (AES-256-GCM + HSM), Vault policies (least privilege), audit logging, anomaly detection, auto-seal on breach indicators |
| **T5** | Information Disclosure | LLM provider stores resume data from API calls | Medium | High | Zero Data Retention (ZDR) API tiers, DPAs, PII stripping before LLM calls, self-hosted models for sensitive ops |
| **T6** | Denial of Service | Attacker overwhelms browser automation pool | Medium | Medium | Rate limiting, WAF (DDoS protection), auto-scaling, queue-based backpressure, per-user resource quotas |
| **T7** | Denial of Service | Aggregator blocks AutoApply IPs | High | High | Residential proxy rotation, anti-detection measures, conservative rate limiting, adapter health monitoring with auto-disable |
| **T8** | Elevation of Privilege | Compromised service escalates Vault permissions | Low | Critical | Least-privilege AppRole policies, service-specific Vault tokens, no wildcard policies, runtime policy auditing |
| **T9** | Spoofing | Credential phishing via fake AutoApply login page | Medium | High | HSTS preload, CSP, email notifications on new logins, user education, future: WebAuthn/passkeys (phishing-resistant) |
| **T10** | Tampering | Insider threat: engineer accesses production credentials | Low | Critical | No engineer has Vault root token. Vault unseal: 3-of-5 Shamir shares held by different individuals. Production access via break-glass only (recorded session). No persistent prod DB access. |

### 7.2 Attack Surface Summary

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ATTACK SURFACE MAP                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EXTERNAL ATTACK SURFACE:                                                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • Web application (app.autoapply.ai) — XSS, CSRF, clickjacking   │  │
│  │ • API endpoints (api.autoapply.ai) — injection, broken auth      │  │
│  │ • OAuth callbacks — CSRF, code injection                          │  │
│  │ • File upload endpoint — malicious file upload, path traversal    │  │
│  │ • WebSocket endpoint — WS hijacking, DOS                          │  │
│  │ • Email links (password reset) — token theft, phishing           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  INTERNAL ATTACK SURFACE:                                                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • Inter-service communication — service impersonation (mTLS)      │  │
│  │ • Kafka topics — unauthorized consumption, message tampering      │  │
│  │ • Vault API — credential theft (AppRole token compromise)        │  │
│  │ • Database — SQL injection (parameterized queries + RLS)          │  │
│  │ • K8s API — pod escape, privilege escalation (PSP/PSA)            │  │
│  │ • CI/CD pipeline — supply chain attack (signed images, SBOMs)    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  THIRD-PARTY ATTACK SURFACE:                                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • LLM API providers — data exfiltration via prompts               │  │
│  │ • Aggregator websites — credential exposure during automation     │  │
│  │ • Proxy providers — MITM on automation traffic                    │  │
│  │ • CAPTCHA solving services — credential leakage                   │  │
│  │ • Payment providers — billing fraud                               │  │
│  │ • CDN — cache poisoning                                           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  SECURITY TESTING SCHEDULE:                                              │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • Automated: SAST (Semgrep) — every PR                            │  │
│  │ • Automated: DAST (OWASP ZAP) — nightly against staging          │  │
│  │ • Automated: Dependency scan (Snyk) — daily                      │  │
│  │ • Automated: Container scan (Trivy) — every image build          │  │
│  │ • Automated: IaC scan (tfsec/checkov) — every Terraform PR       │  │
│  │ • Manual: Penetration test — quarterly (third-party vendor)       │  │
│  │ • Manual: Vault configuration review — quarterly                  │  │
│  │ • Manual: Threat model review — biannually or on major changes   │  │
│  │ • Compliance: SOC 2 Type I audit — pre-launch                     │  │
│  │ • Compliance: SOC 2 Type II audit — 12 months post-launch        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

> **📋 END OF DOCUMENT 3 — SECURITY & ACCESS DOCUMENT**
>
> Type **"CONTINUE"** to generate **DOCUMENT 4: Frontend Specification Document (FSD)**.
