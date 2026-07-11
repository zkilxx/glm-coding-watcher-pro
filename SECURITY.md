# Security Policy

## Reporting

Please open a GitHub issue for non-sensitive defects. For a vulnerability that could expose credentials or enable unintended automation, use GitHub's private vulnerability reporting feature if it is enabled for the repository.

Do not include account credentials, cookies, payment details, or unredacted screenshots in a report.

## Intended boundary

This extension monitors visible DOM state at a low frequency and performs at most one ordinary click per explicitly started run. Reports requesting CAPTCHA, authentication, rate-limit, queue, risk-control, or payment bypass are out of scope and will not be implemented.
