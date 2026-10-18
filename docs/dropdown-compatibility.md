# Product picker compatibility

The product picker uses the same workbook catalogue and relation filters on every device. No user-agent or phone-brand-specific branch is used.

## Fix

- Do not remove the options on a `focusout` with a null `relatedTarget`: this can happen between a touch and the subsequent activation, losing the choice.
- Use native `button` elements (`type="button"`, `role="option"`) for suggestions. Selection happens on `click`, not touch-down, so scrolling does not select a product.
- Do not cancel `pointerdown` for touch or pen input. Only prevent the default mouse-down focus transfer.
- Close on outside pointer/click, Tab, Escape, and an explicit focus move outside. Click also covers activation without Pointer Events.
- Keep the keyboard combobox interaction; ignore Enter during IME composition.
- Clone JSON catalogue data without depending on `structuredClone` or exposing shared mutable compositions.
- Use an explicit open class instead of CSS `:has`; controls have at least 44px touch targets.

## Automated verification

`node --test scripts/drug-picker.test.mjs` mounts the actual compiled Vue component in a DOM test environment. It checks touch/pen/mouse activation with an early null-destination blur, touch scrolling/cancellation, click-only activation, keyboard selection/dismissal, IME composition, outside dismissal, independent product compositions, and workbook-only related-product filtering.

These are event/component regressions, not physical iOS, Android, Safari, Chrome, Google-app or Samsung Internet certification. Viewport resizing checks layout only; it does not change the browser engine or reproduce an on-screen keyboard.

## Physical-device follow-up

On iPhone Safari and the app where the issue was reported (Google app or Chrome), Android Chrome / Samsung Internet / Firefox, and desktop Safari / Chrome / Edge / Firefox:

1. Open Utiliser without choosing an example. Type `Leeloo`, tap the result, and verify the selected-product confirmation and composition appear.
2. In Produit 2, type `Millepertuis`, tap its result, and verify the analysis button becomes enabled. Run the analysis and confirm both names appear.
3. Change Produit 1 and confirm subsequent selections reset and the second list contains only related workbook products.
4. Open the full list, scroll before selecting, tap outside, and reopen with the arrow. Scrolling must never commit a product; a deliberate tap must commit exactly once.
5. Repeat with the keyboard open, portrait/landscape rotation, and browser text zoom. Desktop: also exercise arrows, Enter, Escape, and Tab.

Reference: [W3C combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), [Pointer Events compatibility mapping](https://www.w3.org/TR/pointerevents3/#compatibility-mapping-with-mouse-events).
