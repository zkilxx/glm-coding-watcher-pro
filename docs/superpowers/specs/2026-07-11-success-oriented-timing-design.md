# Success-Oriented Timing Design

## Goal

Improve the probability of promptly detecting and performing one ordinary purchase-button click without bypassing CAPTCHA, authentication, queues, rate limits, risk controls, payment, or payment confirmation.

## Core strategy

DOM changes are the primary trigger. A `MutationObserver` inspects only affected page state as soon as the purchase button appears or changes. A configurable foreground fallback scan covers site changes that do not emit a useful mutation. Refreshing is treated as a comparatively expensive network action and uses bounded modes plus adaptive backoff.

## Modes

- **Stable:** 500 ms fallback scan; 10–30 second refresh range; intended for long monitoring.
- **Balanced (default):** 200 ms fallback scan; 3–5 second refresh range; intended for ordinary use.
- **Sprint:** 100 ms fallback scan; minimum 1 second refresh; hard maximum duration of 5 minutes, then automatically returns to Balanced.

Automatic refresh remains disabled until the user enables it. Custom values may not go below 100 ms for DOM scanning or 1 second for refresh.

## Refresh scheduling

Sub-30-second refreshes run in the content script because Chrome extension alarms do not provide production-grade sub-30-second repetition. Only one monitored tab may be active at a time.

The next refresh delay is state-dependent:

- ordinary unavailable state: use the active mode's base refresh interval;
- visible “购买人数过多” response: use the sequence 1, 1, 2, 3, 5, 8 seconds and cap at 8 seconds while capacity responses continue;
- network or explicit throttling/risk state: use 30, 60, and 120 seconds, capped at 120 seconds;
- ordinary stable/balanced refreshes use ±10 percent jitter; Sprint uses no jitter.

Each full navigation conservatively restores the current run and schedules only one new refresh timer. A stop, completed click, success signal, tab change, or expired Sprint clears scan and refresh timers.

## Click and success handling

Before a click, the content script requests an atomic click claim from the service worker. Only a successful first claim may click. After clicking, fast DOM/URL observation continues only for success confirmation, while all page refreshes stop immediately.

Success is confirmed by any of:

- navigation away from the GLM Coding offer route toward an order, checkout, or payment route;
- a visible payment QR-code/order/checkout container with conservative labels;
- an explicit visible order-created or purchase-success message.

If no confirmation appears, the run remains locked against a second click and reports “已点击一次，等待手动完成后续步骤.” The user must explicitly start a new run to clear the lock.

## User interface

The popup provides Stable, Balanced, and Sprint presets plus custom timing. It displays the effective scan delay, next refresh countdown, current backoff reason, Sprint time remaining, and a warning that aggressive refresh may trigger platform limits. Sprint requires an explicit click and cannot run longer than five minutes.

The popup explains that keeping the page visible improves foreground timer reliability. The extension does not play silent audio, modify browser flags, use hidden network APIs, or attempt to defeat Chrome throttling.

## Testing

Pure functions cover mode normalization, 100 ms and 1 second minimums, capacity and risk backoff sequences, jitter bounds, Sprint expiry, success-signal classification, single-active-tab behavior, and stop-after-click behavior. Runtime checks cover timer clearing, Manifest permissions, JavaScript syntax, documentation, and the existing duplicate-click guard.
