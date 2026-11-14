# Security Specification & Dirty Dozen Threat Model

## 1. Data Invariants

1. **Identity Ownership (`/users/{userId}`)**: A user profile document ID `{userId}` must strictly match `^[a-zA-Z0-9_\-]+$` (<= 128 chars), and `data.uid` must equal both `{userId}` and `request.auth.uid` on self-creation.
2. **Verified Write Gate**: Every write operation requires an authenticated, email-verified user (`request.auth != null && request.auth.token.email_verified == true`).
3. **Zero Self-Assigned Privileges**: During `/users/{userId}` creation by a non-admin, `role` must strictly be `'user'`, `plan` must strictly be `'Free Member'`, `dailyLimit` must strictly equal `15`, and `status` must strictly be `'active'`. No user can modify `role`, `plan`, `dailyLimit`, `status`, `uid`, `email`, or `createdAt` during an update unless they are an existing verified Admin (`isAdmin()`).
4. **No PII Leakage**: Only the document owner (`request.auth.uid == userId`) or a verified Admin (`isAdmin()`) may `get` a `/users/{userId}` document. Non-admins cannot `list` other users' documents (`allow list` requires `resource.data.uid == request.auth.uid || isBootstrappedAdmin()` with zero `get()`/`exists()` reads).
5. **Trusted Admin Grants (`/admins/{adminId}`)**: Only existing verified Admins may read, list (bootstrapped admin only), create, update, or delete `/admins/{adminId}` documents. Bootstrapped admin detection requires both exact email match AND `request.auth.token.email_verified == true`.
6. **Temporal Integrity**: `createdAt` must equal `request.time` on creation and remain immutable forever (`incoming().createdAt == existing().createdAt`). `updatedAt` must equal `request.time` on both creation and every update.
7. **Strict Keys & Volumetric Bounds**: Shadow/ghost fields are rejected via `data.keys().hasAll(...) && data.keys().hasOnly(...)` in validation helpers and `incoming().diff(existing()).affectedKeys().hasOnly(...)` on every update branch. Every string field has explicit `.size()` bounds; `areasOfInterest` list is bounded (`<= 20` items) with element type verification.

## 2. The "Dirty Dozen" Attack Payloads

1. **Unauthenticated Profile Read**: Unauthenticated client attempts `get(/users/usr_123)` -> `PERMISSION_DENIED`.
2. **Cross-User PII Read**: Authenticated user A (`uid_A`) attempts `get(/users/uid_B)` -> `PERMISSION_DENIED`.
3. **Directory Enumeration / Scrape**: Standard authenticated user attempts `list(/users)` without `where('uid', '==', uid_A)` -> `PERMISSION_DENIED`.
4. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts `set(/users/uid_A, ...)` -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Create**: Verified user A (`uid_A`) attempts `set(/users/uid_B, { uid: 'uid_B', ... })` or `{ uid: 'uid_B' }` under `/users/uid_A` -> `PERMISSION_DENIED`.
6. **Privilege Escalation on Create**: Verified non-admin user A creates `/users/uid_A` with `{ role: 'admin', dailyLimit: 999999, plan: 'Enterprise SuperAdmin' }` -> `PERMISSION_DENIED`.
7. **Privilege Escalation on Update (Role/Limit)**: Verified non-admin user A attempts `update(/users/uid_A, { role: 'admin' })` or `{ dailyLimit: 999999 }` -> `PERMISSION_DENIED`.
8. **Shadow/Ghost Field Injection**: Verified user A sends an update `{ name: 'Valid Name', isVerified: true, secretBackdoor: 1, updatedAt: SERVER_TIME }` -> `PERMISSION_DENIED`.
9. **Immutable Timestamp Forgery**: Verified user A creates or updates `/users/uid_A` with client timestamp `'2020-01-01T00:00:00Z'` instead of `request.time`, or mutates `createdAt` -> `PERMISSION_DENIED`.
10. **Admin Email Spoofing**: Attacker signs up with admin email while `email_verified: false` and attempts admin read/write -> `PERMISSION_DENIED`.
11. **Self-Grant Admin Document**: Non-admin user attempts `set(/admins/uid_A, { uid: 'uid_A', ... })` -> `PERMISSION_DENIED`.
12. **Resource Poisoning / Oversized Payload**: Verified user sends `{ name: '<2000-char string>' }` or `userId = '<500-char ID with $badchars>'` or 100-item `areasOfInterest` -> `PERMISSION_DENIED`.

## 3. Verification Test Specification (`firestore.rules.test.ts` Reference)

```ts
// Emulator test matrix verifying all 12 Dirty Dozen payloads return PERMISSION_DENIED
// and legitimate owner/admin operations succeed.
export const DIRTY_DOZEN_CASES = [
  'unauthenticated-user-get',
  'cross-user-pii-get',
  'non-admin-users-list',
  'unverified-email-create',
  'uid-spoof-create',
  'self-assigned-admin-create',
  'role-escalation-update',
  'shadow-ghost-field-update',
  'forged-timestamp-write',
  'unverified-admin-email-spoof',
  'self-admin-grant-write',
  'oversized-string-and-bad-id',
] as const;
```
