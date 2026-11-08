# Implicit State Machines Analysis: cheatsheet

**Verdict:** cheatsheet contains no true, formal state machines, but rather fragmented local UI state, uncoordinated timers, and implicit mode flags that introduce subtle synchronization and lifecycle bugs.

---

## 1. Executive Summary

A static analysis was conducted across all components, hooks, utilities, and lifecycle scripts in the `cheatsheet` codebase to identify implicit state machines—patterns where multi-step lifecycles, modes, or transitions are managed via ad-hoc booleans, timers, and uncoordinated state primitives instead of explicit state representations.

Four candidate locations were analyzed in detail:
1. **`InfoTable` (`src/components/infoTable.tsx`)**: Toast display, dismiss timer, and clipboard interaction.
2. **`Category` & `Subcategory` (`src/components/category.tsx`, `src/components/subcategory.tsx`)**: Collapsible card visibility and index-key state tracking.
3. **`SearchBar` (`src/components/searchBar.tsx`)**: Debounced query input and execution modes.
4. **`ServiceWorker` (`src/serviceWorker.ts`)**: Browser service worker registration lifecycle (inactive dead code).

---

## 2. In-Depth Component Analysis

### Candidate 1: `InfoTable` — Toast Notification & Clipboard Lifecycle

- **Location:** `src/components/infoTable.tsx:6-72`
- **State Primitives:**
  - `showToast` (`useState<boolean>(false)`)
  - `toastText` (`useState<string>("")`)
  - `timer` (`setTimeout` reference managed implicitly inside `useEffect`, lines 24–28)

#### States & Transitions
- **States:**
  - `IDLE`: `showToast: false`, `toastText: ""`, no timer active.
  - `SHOWING`: `showToast: true`, `toastText: td`, 5000ms auto-dismiss timer active.
- **Transitions:**
  - `IDLE -> SHOWING`: Triggered when a user clicks a table cell (`td`), `copyTextToClipboard(td)` resolves, and `handleClick(td)` sets `toastText` and `showToast = true`.
  - `SHOWING -> IDLE`: Triggered when the 5000ms `setTimeout` completes, executing `setShowToast(false)`.

```
           [ cell click + copy resolves ]
  IDLE ──────────────────────────────────────► SHOWING (5s timer)
    ▲                                             │
    └─────────────────────────────────────────────┘
                  [ 5s timeout fires ]
```

#### Defects & Architectural Issues
1. **Same-Text Re-Click Timer Stall:**
   In lines 24–28:
   ```tsx
   useEffect(() => {
       if (!showToast) return;
       const timer = setTimeout(() => setShowToast(false), 5000);
       return () => clearTimeout(timer);
   }, [showToast, toastText]);

   function handleClick(td: string) {
       setToastText(td);
       setShowToast(true);
   }
   ```
   If a user clicks the same table cell again while the toast is already visible, `handleClick(td)` sets `toastText` to the same string and `showToast` to `true` (already `true`). Because primitive state values do not change, React bails out of re-rendering and the `useEffect` hook does not re-trigger. Consequently, the active 5-second timer is **not** reset, and the toast will disappear prematurely based on the original click's deadline.
2. **Fragmented, Per-Table Toast Instances:**
   Each `InfoTable` instance instantiates its own isolated `showToast` and `toastText` state and conditionally renders `<Toast text={toastText} />` (which is styled with `fixed top-20 right-6`). If a user clicks cells in different tables or categories, multiple toast elements mount simultaneously at identical screen coordinates, resulting in visual clipping and overlapping text rather than an orderly toast queue.
3. **Missing Error State on Clipboard Failure:**
   The click handler in lines 48–53 invokes:
   ```tsx
   onClick={async () => {
       await copyTextToClipboard(td).then(() => {
           handleClick(td);
       });
   }}
   ```
   There is no `.catch()` handler or fallback state. If clipboard permissions are blocked or `document.execCommand('copy')` throws an exception, the promise rejects silently, leaving the user with zero visual feedback or error status.

#### Would Making It Explicit Help?
**Yes.** Centralizing toast notifications into an explicit application-level notification store or state machine (e.g. `IDLE` | `VISIBLE` | `ERROR`) would ensure that new notifications reset the display timer, clipboard errors trigger an error state, and toasts do not clash across component instances.

---

### Candidate 2: `Category` & `Subcategory` — Collapsible State & Index-Key Bug

- **Location:** `src/components/category.tsx:20-24`, `src/components/subcategory.tsx:7-53`
- **State Primitives:**
  - `isVisible` (`useState<boolean>(false)` in `Subcategory`)
  - Global event bus listeners (`useBus('ui/expand')`, `useBus('ui/collapse')`)

#### States & Transitions
- **States:**
  - `COLLAPSED`: `isVisible: false` (content height set to `h-0`)
  - `EXPANDED`: `isVisible: true` (content table rendered and visible)
- **Transitions:**
  - Header click: toggles `isVisible` (`!isVisible`)
  - `ui/expand` bus event: forces `isVisible = true`
  - `ui/collapse` bus event: forces `isVisible = false`

#### Defects & Architectural Issues
- **Index-Key State Inheritance After Search (`src/components/category.tsx:21`):**
  In `Category`:
  ```tsx
  {
    category.content.map((subcategory: Subcategory, index: number) => {
      return subcategory.table.length > 0 && <SubcategoryComponent key={'Subcat-' + index} subcategory={subcategory} />;
    })
  }
  ```
  `SubcategoryComponent` instances are keyed by the loop's `index` (`key={'Subcat-' + index}`). Because the items are filtered dynamically based on search queries (`subcategory.table.length > 0`), the list indices change when the user searches.
  React uses the `key` to preserve component local state across re-renders. Because the key is tied to the array index rather than a stable entity identifier (like `subcategory.parameter`), expanding the first item (`index = 0`) causes the *new* first item after a search filter to inherit the open `isVisible = true` state. The open/closed state tracks the slot index rather than the card itself.

#### Would Making It Explicit Help?
**Partially.** An FSM for a single binary toggle is over-engineering; however, the state should either:
- Use a stable key (e.g. `key={subcategory.parameter}`), or
- Lift expansion state into an explicit set of expanded card IDs (`expandedCardIds: Set<string>`) managed centrally.

---

### Candidate 3: `SearchBar` — Input Debouncing & Mode Switching

- **Location:** `src/components/searchBar.tsx:8-47`
- **State Primitives:**
  - `value` (`useState<string>('')`)
  - `searchTimeout` (`useRef<number | null>(null)`)

#### States & Transitions
- **States:**
  - `EMPTY`: `value = ""`, clear button hidden, no pending timer.
  - `DEBOUNCING`: `0 < value.length < 5`, 300ms `setTimeout` active, waiting to fire `onSearch(text)`.
  - `IMMEDIATE_SEARCH`: `value.length >= 5`, `onSearch(text)` executed synchronously on every keystroke.
- **Transitions:**
  - Typing (< 5 chars): Cancels pending timer, starts new 300ms delay before calling `onSearch`.
  - Typing (≥ 5 chars): Cancels pending timer, invokes `onSearch` immediately.
  - Clear button click / deletion: Cancels pending timer, invokes `onSearch('')`, transitions to `EMPTY`.

#### Would Making It Explicit Help?
**Moderately.** While handling debouncing via `useRef` and `setTimeout` is common in React, the dual-mode threshold (< 5 chars debounced vs. ≥ 5 chars immediate) represents an implicit mode switch. Encapsulating this behavior in a dedicated `useDebounce` hook or reducer would clarify lifecycle management and cleanup.

---

### Candidate 4: `ServiceWorker` — Registration Lifecycle (Inactive Dead Code)

- **Location:** `src/serviceWorker.ts:28-145`
- **State Primitives:**
  - Browser Service Worker states (`installing`, `installed`, `activating`, `activated`, `redundant`)
  - `installingWorker.onstatechange` listener

#### Evaluation
- **Status:** **Inactive / Dead Code**
- Although `serviceWorker.ts` implements a full state transition listener for service worker registration and updates:
  1. `register()` is never called anywhere in the application.
  2. `src/index.tsx:16` explicitly executes:
     ```tsx
     serviceWorker.unregister();
     ```
  Because the service worker is explicitly unregistered and never registered, this state machine is entirely dormant and never executes in production or development.

---

## 3. Summary Matrix

| Component | State Variables | Implicit Machine? | Active? | Primary Bugs / Risks | Recommended Fix |
|---|---|---|---|---|---|
| **`InfoTable`** (`src/components/infoTable.tsx`) | `showToast`, `toastText`, `timer` | Yes (Timer & feedback lifecycle) | Active | Re-clicks on same text don't restart timer; multiple toasts clash on screen; unhandled clipboard rejection | Central toast notification context or reducer with request IDs and error handling |
| **`Category` / `Subcategory`** (`src/components/category.tsx`, `src/components/subcategory.tsx`) | `isVisible`, bus events | Minor (Binary toggle) | Active | Keyed by index (`key={'Subcat-' + index}`); open/closed state attaches to list position after filtering | Use stable key (`key={subcategory.parameter}`) or lift expanded ID set |
| **`SearchBar`** (`src/components/searchBar.tsx`) | `value`, `searchTimeout` | Minor (Debounce mode) | Active | Dual-mode threshold logic embedded in input handler | Extract to `useDebounce` hook |
| **`ServiceWorker`** (`src/serviceWorker.ts`) | `installingWorker.state` | Yes (Browser SW lifecycle) | **Inactive** | Dead code; `register()` is never called and `index.tsx` unregisters it | Remove file or retain as dormant boilerplate |
