# Lumi Authorization Matrix

## Roles

- **Guest:** unauthenticated visitor.
- **Customer:** authenticated shopper.
- **Staff:** trusted operations user with limited support, catalog, inventory,
  and fulfillment permissions.
- **Administrator:** privileged user who manages staff, roles, and high-impact
  business settings.
- **System:** authenticated internal job or verified third-party webhook. It is
  not a human superuser and receives only purpose-specific permissions.

Roles provide a baseline. Ownership, order state, resource scope, and explicit
permissions must also be checked. All access is denied unless a rule permits it.

## Customer-facing resources

| Capability | Guest | Customer | Staff | Administrator | Required conditions |
| --- | --- | --- | --- | --- | --- |
| View published catalog/products | Allow | Allow | Allow | Allow | Only published, customer-visible fields |
| Search/filter published catalog | Allow | Allow | Allow | Allow | Rate limits and bounded queries |
| Maintain guest cart/wishlist | Local only | N/A | N/A | N/A | Browser data is untrusted and non-authoritative |
| View own profile | Deny | Own | Scoped support view | Allow | Field filtering; sensitive access audited |
| Update profile | Deny | Own | Deny by default | Allow | Re-authenticate for sensitive identity changes |
| View/create/update address | Deny | Own | Deny by default | Allow | Ownership checked from session, not request owner ID |
| View/update wishlist | Deny | Own | Deny | Deny by default | Ownership on every record |
| Create checkout/order | Guest checkout if enabled | Own | Deny | Deny | Server calculates totals and validates state/inventory |
| View order | Valid signed guest lookup if enabled | Own | Assigned support scope | Allow | Never authorize using order ID alone |
| Cancel order | Signed guest flow if enabled | Own | Scoped | Allow | Only permitted states; inventory/payment compensation |
| Request return/refund | Signed guest flow if enabled | Own | Scoped | Allow | Policy window and order ownership/state enforced |
| Add product review | Deny | Own verified purchase | Moderate only | Moderate | One policy-compliant review per eligible line item |
| Manage newsletter consent | Own email verification | Own | Deny | Scoped reporting only | Confirmation/unsubscribe token is purpose-bound |

## Operations and administration

| Capability | Customer | Staff | Administrator | System | Required conditions |
| --- | --- | --- | --- | --- | --- |
| Create/edit product drafts | Deny | If `catalog:write` | Allow | Import scope only | Explicit fields; audit event |
| Publish/unpublish products | Deny | Deny by default | Allow | Deny | Re-authentication for bulk/high-impact changes |
| Adjust inventory | Deny | If `inventory:write` | Allow | Reservation job only | Reason required; atomic update; audit event |
| View customer list | Deny | If `support:read` | Allow | Deny | Pagination, field masking, audit access |
| Edit customer account | Own fields only | Limited support fields | Allow | Deny | Cannot set roles through customer update endpoint |
| Disable customer account | Deny | Deny by default | Allow | Fraud rule may flag only | Revoke sessions; record reason and actor |
| View all orders | Deny | If `orders:read` | Allow | Fulfillment scope | Sensitive fields minimized |
| Update fulfillment state | Deny | If `orders:fulfill` | Allow | Carrier job scope | Enforce valid order transition |
| Issue refund | Request only | If `refunds:write` within limit | Allow | Provider callback confirms only | Amount/order checks, idempotency, audit; approval threshold |
| Manage coupons/pricing | Deny | Deny by default | Allow | Scheduled rule scope | Validate constraints; audit event |
| Manage Staff accounts/roles | Deny | Deny | Allow | Deny | MFA and recent re-authentication; cannot remove last admin |
| Read audit logs | Deny | Deny by default | Allow | Append only | Logs are immutable to normal admin actions |
| Manage secrets/infrastructure | Deny | Deny | Separate deployment privilege | Purpose-specific | Not exposed through normal application admin UI |
| Process payment webhook | Deny | Deny | Deny | Verified Paystack webhook only | Signature, raw payload, amount/currency/reference, replay checks |
| Send transactional email | Deny | Trigger via allowed workflow | Trigger via allowed workflow | Queue worker only | Templates and recipients derived from authorized records |

## Enforcement rules

1. The API derives identity and role from the authenticated server-side session.
   It never accepts them from request bodies or query parameters.
2. Each endpoint declares its required permission and performs resource-level
   ownership/scope checks inside the service operation.
3. Collection endpoints filter at query time. They do not load all records and
   hide unauthorized ones only in the response.
4. Updates use explicit field allowlists. Customer DTOs cannot include role,
   owner, price, inventory, payment, fulfillment, or audit fields.
5. Staff and Administrator accounts require MFA. Sensitive actions require a
   recent authentication event and may require a second approver.
6. Background jobs and webhooks use separate purpose-bound identities. They do
   not inherit Administrator privileges.
7. Authorization failures return a safe response and generate a security event
   when repeated or high risk.
8. Role and permission changes revoke active privileged sessions and are always
   audited.

## Required negative tests

Every protected resource must include tests for:

- unauthenticated access;
- a different customer's identifier;
- a valid user with the wrong role;
- a Staff user outside their assigned permission or scope;
- disallowed fields added to an otherwise valid request;
- access after logout, password reset, account disablement, or role change;
- invalid workflow state and repeated requests; and
- list/search queries that could expose unauthorized records.

The test suite should create at least two independent customers. A feature is
not authorization-complete if it tests only the successful owner path.

