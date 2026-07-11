# GLM Coding Watcher Pro Design

## Goal

Create and publish a public GitHub repository named `glm-coding-watcher-pro` containing a complete, dependency-free Chrome Manifest V3 extension. The extension watches the GLM Coding purchase page at a deliberately low frequency and assists only with ordinary visible-page interactions.

## Safety and scope boundaries

The extension may:

- periodically inspect the visible page for a purchase button;
- optionally refresh the page at a configurable, rate-limited interval;
- close a visible “购买人数过多” notice;
- click an enabled purchase button once per monitoring run;
- play a local alert sound and show a Chrome desktop notification;
- retain a bounded local activity log and prevent duplicate clicks.

The extension must not bypass or automate CAPTCHA, authentication, queues, rate limits, risk controls, payment, or payment confirmation. It must not call private or undocumented purchase APIs, forge requests, hide automation, or retry a successful click. Payment and any verification remain manual.

## Architecture

The repository uses plain HTML, CSS, and JavaScript with no build step or runtime dependencies.

- `manifest.json` declares Manifest V3, narrowly scoped host access, storage, notifications, scripting, and tab access required by the documented features.
- `popup.html`, `popup.css`, and `popup.js` provide controls for monitoring, intervals, optional refresh, sound, notifications, status, counters, and logs.
- `content.js` inspects visible DOM state, dismisses only the matching capacity notice, identifies plausible purchase buttons, and performs the guarded single click.
- `background.js` coordinates persisted settings and per-tab state, schedules refreshes, emits desktop notifications, and enforces the duplicate-click guard.
- A packaged local audio asset or Web Audio fallback provides the alert without network access.

Components communicate through Chrome extension messages. Settings and bounded logs are stored with `chrome.storage.local`. Monitoring state is scoped to a tab and restored conservatively after navigation; a completed click remains latched until the user explicitly starts a new run.

## Monitoring behavior

The user explicitly starts monitoring from the popup. The detection interval has a hard minimum of 3 seconds. Automatic refresh is disabled by default and has a hard minimum of 30 seconds. Invalid values are clamped to safe minimums.

On each inspection cycle, the content script:

1. checks whether monitoring is active;
2. closes a visible dialog containing the exact capacity phrase when a visible close/cancel control exists;
3. searches visible button-like elements for purchase-oriented labels;
4. rejects hidden, disabled, busy, or capacity-message elements;
5. reports status when no eligible button exists;
6. atomically claims the click through the background worker;
7. clicks once only after the claim succeeds;
8. stops active monitoring and alerts the user.

Selectors combine semantic roles, element state, and conservative Chinese button text. The README explains that site markup changes may require selector maintenance.

## Error handling and privacy

Missing permissions, unavailable tabs, page changes, and message failures are recorded as readable log entries. Logs are capped to prevent unbounded storage. No browsing data, credentials, page content, telemetry, or analytics leave the device. Notification and sound failures do not trigger repeated clicks.

## User experience

The popup uses a compact Chinese interface. It clearly states that the tool is a monitor rather than a purchase guarantee. After a click, the status changes to “已点击一次，请手动完成后续步骤,” monitoring stops, and the page remains available for manual verification and payment.

## Repository contents

The public repository will include:

- the complete unpacked extension source;
- a Chinese `README.md` with features, safety limits, installation, usage, troubleshooting, permissions, and Download ZIP instructions;
- an MIT `LICENSE`;
- a suitable `.gitignore`;
- this design document;
- lightweight automated validation scripts or tests that require no production build system.

## Validation and publication

Before publication:

- parse and validate `manifest.json` as Manifest V3;
- run JavaScript syntax checks;
- test interval clamping, purchase-button eligibility, capacity-dialog matching, and duplicate-click behavior where practical;
- inspect the final diff and repository file list;
- verify there are no secrets, generated clutter, or unrelated files.

The project will be committed to the default branch of the new public GitHub repository `glm-coding-watcher-pro`. The final handoff will include the repository URL and GitHub archive URL in the form `https://github.com/<owner>/glm-coding-watcher-pro/archive/refs/heads/main.zip`.
