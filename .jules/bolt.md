## 2025-02-17 - Avoid O(N) recalculation in filter callbacks
**Learning:** Found redundant string normalization (`query.toLowerCase()`) being called inside `array.filter()` on every element in React's `useMemo` hooks.
**Action:** When filtering items based on a search string, always hoist and cache the normalized search string (e.g. `.toLowerCase()`) outside the loop to change the string operation complexity from O(N) to O(1).
