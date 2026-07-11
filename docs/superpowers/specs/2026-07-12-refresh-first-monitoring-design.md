# Refresh-First Monitoring Design

## Goal

Make full-page refresh the mandatory driver while a monitoring run is active. DOM observation remains a fast secondary signal after each load and never replaces refresh.

## State machine

`START_MONITORING` always enables the refresh loop. The popup no longer exposes an optional auto-refresh toggle.

Each run performs:

1. load or reload the GLM Coding page;
2. inspect selected targets in strict priority order, switching billing periods as required;
3. if one target is eligible, clear refresh, atomically claim, and click once;
4. if all targets are unavailable or missing, compute the configured delay and schedule a full `location.reload()`;
5. after navigation, restore run state and restart at priority 1.

Stop, click completion, or success confirmation clears the pending refresh and cancels the active cycle. The minimum refresh interval remains one second. Capacity and risk signals may increase the delay through the existing backoff rules.

## DOM observation

MutationObserver and the fallback scan may trigger a faster inspection between page load and the next scheduled refresh. They cannot cancel or replace the mandatory refresh unless a target becomes eligible, the run stops, or success is confirmed.

## UI and state

Remove the auto-refresh control. Rename the setting to `页面刷新间隔`. Starting a run persists refresh as active regardless of legacy `autoRefresh` values. Existing installations migrate safely because runtime behavior no longer reads that flag.

The popup always shows the next refresh countdown while active and all targets remain unavailable. It shows `正在检查` during a priority cycle and `等待刷新` after the cycle schedules navigation.

## Testing

Tests cover mandatory scheduling with legacy refresh disabled, all-unavailable reload, minimum one-second delay, navigation restart, DOM observer not cancelling refresh, and stop/click cancellation.
