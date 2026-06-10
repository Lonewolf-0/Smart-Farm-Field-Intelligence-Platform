# Security Policy



## Reporting a Vulnerability

We take the security of the Smart Farm Field Intelligence Platform seriously. If you discover a security vulnerability, we would appreciate it if you could report it to us privately so we can fix it before it is exploited.

### How to Report

Please do **not** report security vulnerabilities through public GitHub issues.

Instead, please report them by emailing **aryan.tyagi202@gmail.com**. Include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### Response Time

You can expect to receive an acknowledgment of your report within 48 hours of receipt. We will then triage the issue and determine the best course of action. We will keep you informed of our progress and will notify you when the issue has been resolved.

### Disclosure Policy

We ask that you do not disclose the vulnerability publicly until we have had a chance to fix it and release an update. We will coordinate with you to ensure that the vulnerability is disclosed responsibly.

## Best Practices

When deploying the Smart Farm Field Intelligence Platform, please follow these security best practices:
- **Environment Variables**: Never commit `.env` files or hardcode sensitive credentials (e.g., API keys, database passwords) in the source code.
- **Dependencies**: Keep Node.js dependencies updated by regularly running `npm audit` and updating packages with known vulnerabilities.
- **Authentication**: Ensure strong password policies are enforced and utilize the provided JWT mechanisms securely.
