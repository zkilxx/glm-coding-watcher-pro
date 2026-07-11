# Dynamic Plan Priority Selection Design

## Goal

Allow the user to discover subscription plans from the visible GLM Coding page, select multiple acceptable plans, order them by priority, and click the highest-priority currently eligible plan exactly once.

## Plan discovery

The content script identifies visible plan-card containers using conservative structural signals: a card must contain a purchase-oriented button and a nearby visible heading or prominent label. It returns a bounded list containing a stable local fingerprint, exact normalized name, short price summary when visible, button state, and page order.

The extension does not invent plan names, query private APIs, or use fuzzy matching. Duplicate normalized names receive distinct fingerprints derived from their visible name, price summary, and page order. Discovery results are page-local observations and may change after navigation.

## Selection and priority

The popup provides a “刷新套餐列表” action. Discovered plans appear with checkboxes, price summaries, and availability states. Selecting a plan adds its fingerprint and exact identifying fields to a priority queue. Users may move selected plans up or down or remove them. The top entry is priority 1.

Selections persist in `chrome.storage.local`. After refresh, each selected target is re-associated only when its exact normalized name and price summary match a discovered card. A missing target is marked unavailable and logged; it is never silently replaced by a similar plan.

## Purchase decision

On every mutation-driven inspection:

1. rediscover visible plan cards;
2. match only selected targets using exact identity fields;
3. walk the saved priority queue from top to bottom;
4. choose the first target with a visible, enabled, idle purchase button;
5. request the existing atomic single-click claim;
6. stop refresh immediately, click that plan once, and lock all other targets;
7. record and notify the exact selected plan name.

If priority 1 is unavailable while priority 2 is eligible, priority 2 is chosen. If multiple targets are eligible simultaneously, only the highest-priority eligible target is clicked. When no target is selected, monitoring cannot start and the popup explains why.

## Messages and state

New runtime messages are `DISCOVER_PLANS` and `PLANS_DISCOVERED`. Settings add `planPriority`, an ordered array of `{ fingerprint, name, price }`. Run state adds `selectedPlan` after a click. Logs and desktop notifications include `selectedPlan.name`.

Discovery is bounded to 20 plans, names to 120 characters, and price summaries to 80 characters. No arbitrary page HTML is persisted.

## Safety and errors

All existing timing, single-tab, single-click, success confirmation, and platform-control boundaries remain unchanged. A stale or ambiguous plan match is treated as unavailable. A page layout change produces a readable discovery error and performs no click.

## Testing

Pure tests cover normalization, fingerprint stability, duplicate names, exact target matching, missing plans, queue ordering, and highest-priority eligible selection. Runtime contract tests cover discovery messages, selected-plan logging, no-target start prevention, and refresh stopping before the chosen plan button is clicked.
