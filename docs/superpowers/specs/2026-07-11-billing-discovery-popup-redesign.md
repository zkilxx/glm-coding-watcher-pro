# Billing Discovery and Popup Redesign

## Goal

Discover Lite, Pro, and Max subscriptions for monthly, quarterly, and annual billing automatically, while replacing the existing cramped popup with the accepted polished productivity-tool layout.

## Accepted visual reference

The implementation follows `docs/design/subscription-popup-concept.png`: true-white background, cool-gray dividers, deep navy text, cobalt primary actions, restrained green/amber status colors, open list rows, 10–12px radii, no gradients, no decorative illustration, and approximately 420px popup width.

The generated concept contains illustrative prices and a selector field that are not product requirements. Real RMB prices come only from the page, and the implementation retains the existing numeric DOM scan interval rather than exposing an arbitrary CSS selector.

## Billing-period discovery

When the user clicks “刷新全部套餐”, the content script:

1. records the currently selected billing period;
2. finds the visible period controls whose exact labels normalize to `连续包月`, `连续包季`, and `连续包年`;
3. clicks each period sequentially;
4. waits for the selected state and at least one plan price/button text to change, with a 2-second timeout per period;
5. extracts Lite, Pro, and Max name, current price, availability, button label, and billing period;
6. restores the original billing-period control;
7. returns a deduplicated maximum of nine variants.

Discovery is read-only except for switching the page’s visible billing-period control. It never clicks a subscription button. A timeout records a readable error for that period and continues with the others.

Plan identity becomes exact `{name, billingPeriod, price}`. Priority targets persist these fields, so Lite monthly, quarterly, and annual are independent choices. A stale or missing variant remains unavailable and is never substituted.

## Popup information architecture

- Header: product title and compact status indicator.
- Timing mode: four-option segmented control.
- Billing summary: month/quarter/year filters plus “刷新全部套餐”. Filters affect display only; refresh always scans all periods.
- Discovered plans: compact table-like rows with checkbox, plan, period, RMB price, and availability.
- Priority queue: numbered rows with accessible up/down/remove icon buttons.
- Monitoring settings: auto-refresh, DOM scan milliseconds, refresh seconds, sound, and desktop notification.
- Actions: full-width blue “开始监测” and neutral “停止”.
- Activity: check count, next refresh, selected plan/status, and collapsible log.
- Safety notice: monitoring only; payment remains manual.

The popup body may scroll vertically, but the header, primary status, and mode control appear without scrolling. Controls use explicit focus, hover, selected, disabled, and warning states.

## Data flow and errors

`DISCOVER_PLANS` becomes asynchronous and returns `{plans, errors}`. The popup shows per-period progress while scanning and displays partial results when one period fails. Starting monitoring remains blocked without a target. Refreshing discovery does not erase already selected targets; unmatched targets remain in the queue with “当前未发现”.

## Testing

Pure tests cover billing-period normalization, nine-variant identity, deduplication, and exact cross-period matching. Runtime tests cover sequential period switching, restoration, change/timeout handling, sold-out discovery, and never clicking subscription buttons during discovery. UI tests cover the accepted layout labels, filters, progress, partial errors, queue states, settings, actions, and safety copy. Browser QA compares the rendered popup screenshot against the accepted concept.
