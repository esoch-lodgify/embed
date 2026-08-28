# Handover prompt — fix the variant race in `lodgify-demo.js`

> Copy everything below the line into a fresh Claude Cowork session that has the
> `marketing-demo` source repo connected.

---

## Context

You are fixing a **race condition** in the Lodgify marketing demo widget (the React app
published as `cdn.lodgify.com/marketing-demo/<version>/lodgify-demo.js`, mounted into
`#lodgify-demo` on Webflow pages).

The bug has already been diagnosed against the live `v0.17.0` bundle. Do **not** re-diagnose
it — the findings below are verified. Your job is to implement the fix in the source repo.

### The bug

De-minified from the shipped `v0.17.0` bundle, the bootstrap is:

```js
function Ag(e) {                                     // resolves the "newDesign" flag
  let t = new URLSearchParams(window.location.search).get('variant');
  return t === 'a' ? true
       : t === 'b' ? false
       : e.dataset.variant === 'a';                  // ← reads data-variant, ONCE
}

function Mg({ host: e }) {
  return <Sg locale={Og(e)} cue={kg(e)} surveyEnabled={true} newDesign={Ag(e)} />;
}

function Ng() {
  let e = document.getElementById('lodgify-demo');
  e && (e._lodgifyMounted || (e._lodgifyMounted = true,
    jg(),                                            // injects <style id="lodgify-demo-styles">
    createRoot(e).render(
      <StrictMode><Provider scope="lodgify-demo"><Mg host={e} /></Provider></StrictMode>
    )));
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', Ng)
  : Ng();
```

Three properties combine into the defect:

1. `data-variant` is read **exactly once**, at mount, and frozen into a React prop.
2. Mount fires on `DOMContentLoaded`, guarded by `_lodgifyMounted`, so it can never re-run.
3. The bundle contains **zero** `MutationObserver` and no `attributeChangedCallback`
   (verified by string search against the built file). Nothing ever re-reads the attribute.

Meanwhile the A/B tool (GrowthBook, `@growthbook/growthbook` auto bundle) sets
`data-variant="a"` from a variation's Custom JS, which can only run **after** its feature
payload resolves from `cdn.growthbook.io`.

Measured on the live page `https://www.lodgify.com/saba-iframe-testing/`:

| Event | Cold cache | Warm cache (refresh) |
|---|---|---|
| `DOMContentLoaded` — widget mounts | **774 ms** | 654 ms |
| GrowthBook feature payload resolves | **1395 ms** | 577 ms |
| Outcome | attribute lands ~620 ms **late** → control renders | attribute lands ~80 ms early → variant renders |

That is the entire "it only works after I refresh" symptom: on the refresh the payload is
already in `localStorage.gbFeaturesCache` (~38 KB) so it applies in ~1 ms and beats
`DOMContentLoaded`. It is a coin-flip, not a consistent failure.

Confirmed independently: setting `data-variant="a"` on the host **after** mount and waiting
2.5 s produces byte-identical rendered text. The attribute is genuinely ignored post-mount.

### What is NOT broken (do not "fix" these)

- **GrowthBook config is correct.** On `?exp_growth_questionnairenewdesignandsignup_202608=0`
  the SDK reports `variationId: 0, inExperiment: true, hashUsed: false` — the querystring
  override is honoured. Variation 0 has empty JS; variation 1 carries the Custom JS.
- **The `data-modal-open` half of the experiment's Custom JS is fine.** The Webflow page binds
  a *delegated* listener on `document` that calls `e.target.closest('[data-modal-open]')` and
  reads the attribute at **click** time. Late attribute writes are harmless there.

Only `data-variant` on `#lodgify-demo` races.

---

## What to build

Implement a **three-layer** resolution strategy in the widget's bootstrap. Layer 1 is the fix;
layers 2 and 3 are the belt-and-braces that make it bulletproof.

### Layer 1 — gate the mount on variant resolution (primary)

Do not mount until the variant is known, **bounded by a timeout**, and **only when an
experiment framework is actually present on the page**.

```
resolveGate():
  1. If ?variant=a or ?variant=b is in the URL  → resolve immediately, synchronously.
  2. If host already has [data-variant]         → resolve immediately (GrowthBook won the race).
  3. If no experiment framework detected        → resolve immediately (zero delay for
                                                   pages not running a test).
  4. Otherwise wait, resolving on the FIRST of:
       a. GrowthBook's official ready callback
       b. a MutationObserver seeing data-variant appear on the host
       c. a timeout (default 1500 ms) → fall back to the default variant
```

**Framework detection** — the page has been confirmed to expose all three of these globals:
`window.growthbook_queue`, `window.growthbook_config`, `window._growthbook`. Detect via those,
plus a `script[src*="growthbook"]` check as a backstop. If none are present, skip the gate
entirely.

**GrowthBook ready callback** — use the auto bundle's documented hook, which is already in use
on the page:

```js
window.growthbook_queue = window.growthbook_queue || [];
window.growthbook_queue.push(function (gb) { /* SDK initialised, auto-experiments applied */ });
```

Push onto it *and* run the MutationObserver *and* the timeout — whichever fires first wins,
then tear all three down. Do not rely on the queue alone: it never fires if GrowthBook is
blocked by an ad blocker or a consent gate.

**Requirements while gated:**

- Render **nothing** (or a fixed-height skeleton) — never render the control and then swap.
  The host already carries a height via `--lodgify-demo-h-desktop` / `xl:h-[660px]`; reserve
  that space so Cumulative Layout Shift does not regress.
- The timeout must be configurable from the Webflow markup, e.g.
  `data-variant-timeout="1500"`, and overridable to `0` to opt out of gating per page.
- The gate must be safe if `DOMContentLoaded` has already fired when the script loads.

### Layer 2 — post-mount correction (fallback)

Keep a `MutationObserver` on the host's `data-variant` alive after mount. If the attribute
arrives or changes *after* the gate has already resolved (i.e. GrowthBook was slower than the
timeout), call `root.render()` again with the corrected prop.

**Guard it:** only apply the late correction while the widget is still in its pristine initial
state. If the user has already interacted (answered a questionnaire step, opened a panel,
clicked into the iframe), suppress the swap and log it instead — silently resetting someone's
progress is worse than serving them the wrong variant.

Use `root.render()` on the existing root, not a fresh `createRoot` — React should reconcile,
not remount.

### Layer 3 — explicit public API (the real long-term contract)

Expose a small global so future experiments never have to attribute-sniff:

```js
window.LodgifyDemo = {
  mount(),                       // idempotent; honours the same guard as _lodgifyMounted
  setVariant('a' | 'b'),         // resolves the gate immediately with this value
  ready,                         // Promise resolving to the applied variant
  getAppliedVariant(),
};
```

`setVariant()` called before mount must resolve the gate instantly — that gives the growth team
a deterministic, race-free path (`window.LodgifyDemo.setVariant('a')` from Custom JS) instead of
the current attribute write.

**Precedence, highest first:** `?variant=` URL param → `setVariant()` → `data-variant`
attribute → default.

### Observability (required — this is how we prove it stays fixed)

On every mount, emit one event to `window.dataLayer` (and the existing analytics path if the
widget already has one) with at least:

```js
{
  event: 'lodgify_demo_variant_applied',
  variant: 'a' | 'b',
  resolved_from: 'url' | 'attribute-presync' | 'growthbook-queue' | 'mutation' | 'timeout-default' | 'api',
  waited_ms: <int>,
  late_correction: true | false
}
```

`resolved_from: 'timeout-default'` appearing in production is the alarm that the race is back.
This also lets the team reconcile GrowthBook exposures against what actually rendered.

---

## Constraints — do not break these

- Preserve `?variant=a` / `?variant=b` as a **synchronous** override with top precedence. QA
  relies on it today.
- Preserve idempotency: double-including the script tag must not double-mount. Keep the
  `_lodgifyMounted` semantics (or a clearly equivalent guard).
- Preserve `jg()` style injection and the `#lodgify-demo-styles` de-dupe guard.
- `Og()` (locale) and `kg()` (cue) read from the same dataset at the same moment — moving the
  read later must not change their behaviour. Both also honour URL params (`?cue=off|ghostpulse`);
  keep that.
- Keep `StrictMode`. Make sure the gate and observers are not double-registered or leaked under
  StrictMode's double-invocation.
- Disconnect every observer and clear every timer once resolved. No leaks if the host is removed.
- **Ship as a new version directory** (e.g. `v0.18.0`) and leave `v0.17.0` in place. The Webflow
  page pins the version in the script URL, so rollback = revert one URL. Do not overwrite
  `v0.17.0`.

---

## Acceptance criteria — all must pass before you call this done

Test against `https://www.lodgify.com/saba-iframe-testing/` (or a staging equivalent) with the
new bundle. Automate what you can.

1. **Cold cache, first load.** Clear `localStorage.gbFeaturesCache` *and* disable HTTP cache,
   then load `?exp_growth_questionnairenewdesignandsignup_202608=1`. The new design must render
   on the **first** load — 20 consecutive runs, 20 passes.
2. **Throttled network.** Repeat test 1 with the network throttled to Slow 3G. Still correct.
3. **Control path.** `...=0` renders the control, 20/20, and never briefly flashes the variant.
4. **GrowthBook blocked.** Block `cdn.growthbook.io` at the network layer (ad-blocker
   simulation). The widget must still render the default within the timeout and must **never**
   be left blank or stuck on a skeleton.
5. **No-experiment regression check.** On a page with no GrowthBook script, measure
   time-to-first-render against the current `v0.17.0` build. Delta must be < 20 ms.
6. **URL override.** `?variant=a` and `?variant=b` resolve synchronously and beat everything
   else, including a conflicting `data-variant`.
7. **Layout stability.** CLS score for the demo container must be ≤ the `v0.17.0` build.
8. **Idempotency.** Including the script twice mounts exactly one instance.
9. **Late correction guard.** Simulate `data-variant` arriving 3 s after mount: it swaps if
   untouched, and does **not** swap if the user has already answered a questionnaire step.

---

## Before you start

Verify these yourself — they were not part of the diagnosis:

- Locate the source repo and confirm which file contains the bootstrap shown above (search for
  `_lodgifyMounted`, `lodgify-demo-styles`, and the `newDesign` prop).
- Identify the build and publish pipeline to `cdn.lodgify.com/marketing-demo/<version>/`, and
  confirm how the version directory is produced.
- Check for an existing test harness / Storybook, and whether the `newDesign` prop is consumed
  in more than one component.
- Confirm the CDN's cache headers on the versioned path, so a rollback takes effect promptly.

Report back with: the diff, which acceptance criteria you ran and their results, and anything in
the constraints list you could not satisfy. Do not deploy — hand back for review.
