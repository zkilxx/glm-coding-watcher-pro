# Priority-Cycle Monitoring Design

## Goal

Keep the selected-plan priority queue synchronized with user choices and actively inspect unavailable targets across monthly, quarterly, and annual billing periods until one becomes eligible.

## Popup state ownership

The 500ms live refresh updates only volatile run fields: status, active indicator, check count, next refresh, reason, and logs. It must not replace `planPriority`, discovered plans, filters, form inputs, or DOM rows while the user is editing.

Checkbox changes optimistically update the local priority queue, persist once, then reconcile with the saved response. Unchecking removes the exact `{name, billingPeriod, price}` identity. Discovery re-associates targets exactly and labels missing variants without removing or substituting them.

## Monitoring cycle

Monitoring groups the ordered targets by billing period while preserving first occurrence priority. On every cycle it begins at priority 1:

1. switch to the target's billing-period control if necessary;
2. wait for the plan price/button state to update, at most 2 seconds;
3. inspect the exact target card;
4. if eligible, atomically claim and click once after clearing refresh;
5. if unavailable, continue to the next priority target;
6. avoid switching again for consecutive targets in the same period;
7. after all targets are unavailable, schedule the configured refresh/backoff;
8. after navigation, restart at priority 1.

The cycle lock prevents MutationObserver and fallback timers from starting overlapping period scans. Stop, click completion, or success confirmation cancels the active cycle and all timers. Unavailable targets remain valid monitoring targets; availability is never required to start.

## Feedback and errors

Run status names the current target and period, for example `检查 Pro（月付）`. The popup shows selected targets with `不可用`, `可购买`, or `当前未发现`. A missing billing control logs an error and continues to the next target. If every selected target is missing, the extension waits and refreshes rather than clicking another plan.

## Testing

Tests cover optimistic queue updates, no queue redraw during live polling, exact uncheck removal, priority order across periods, same-period switch deduplication, unavailable-target continuation, all-unavailable refresh scheduling, restart after navigation, overlapping-cycle prevention, and stop/click cancellation.
