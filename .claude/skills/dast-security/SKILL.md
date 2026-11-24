---
name: dast-security
description: Practical guide and test procedures for Dynamic Application Security Testing (DAST), IDOR audits, and OWASP ZAP scans
---

# Dynamic Application Security Testing (DAST) Guide

This skill guides security engineers and developers in executing runtime penetration tests, API fuzzing, and DAST scans against Zprofile Node.

---

### 1. Pre-requisites & Local Environment
Ensure the local server or staging environment is running:
```bash
npm run dev
# Target: http://localhost:3000
```

---

### 2. IDOR & Authorization Boundary Tests
Use authenticated session cookies to verify horizontal and vertical RBAC enforcement:

#### Test A: Vertical Privilege Escalation (Engineer -> Admin Endpoint)
```bash
# Engineer attempting to list all administrative users
curl -i -X GET http://localhost:3000/api/users \
  -H "Cookie: next-auth.session-token=<ENGINEER_SESSION_TOKEN>"

# Expected Result: HTTP 403 Forbidden
```

#### Test B: Horizontal Privilege Escalation (Engineer A -> Engineer B Profile)
```bash
# Engineer A attempting to update Engineer B's profile (ID 31406)
curl -i -X PUT http://localhost:3000/api/profiles/31406 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<ENGINEER_A_SESSION_TOKEN>" \
  -d '{"post_title": "Hacked Profile Title"}'

# Expected Result: HTTP 403 Forbidden: "You are not authorized to update this profile"
```

#### Test C: Unauthenticated API Access
```bash
# Public request to sensitive profile endpoints
curl -i -X GET http://localhost:3000/api/profiles/31406

# Expected Result: HTTP 401 Unauthorized
```

---

### 3. Injection & Fuzzing Verification

#### SQL Injection Fuzzing
```bash
# Test search parameter with SQLi payloads
curl -i -G "http://localhost:3000/api/profiles" \
  --data-urlencode "search=' OR '1'='1" \
  -H "Cookie: next-auth.session-token=<VALID_SESSION>"

# Expected Result: HTTP 200 with 0 matches or safe search, ZERO SQL syntax errors or leaked schemas
```

#### Stored XSS Verification
Submit payload:
```json
{
  "post_title": "<script>alert('xss')</script>",
  "post_content": "<img src=x onerror=alert(document.cookie)>"
}
```
Verify upon retrieval via `/profiles/[id]` that React renders the payload as harmless text, preventing JavaScript execution in the DOM.

---

### 4. HTTP Defensive Headers Audit
Run a header check against the application root:
```bash
curl -I http://localhost:3000/
```

Verify presence of:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Ensure `X-Powered-By` header is absent.

---

### 5. Automated OWASP ZAP Baseline Scan
To run an automated baseline container scan using official OWASP ZAP Docker:
```bash
docker run --rm -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap-report.html \
  -I
```
Review `zap-report.html` for any alert classifications (High, Medium, Low).
