# Fade in up

Page elements rise 24px into place and fade in the first time they scroll into view. Each one starts once its top reaches 20% up from the bottom of the viewport (`TRIGGER_LINE`), so the motion happens where it is seen. Elements that enter together cascade 60ms apart (capped at 480ms). Reaching the end of the page reveals any last elements that can never scroll up to that line.

- Script: `src/scripts/reveal.ts`, loaded by `BaseLayout`. It uses one IntersectionObserver and only toggles attributes.
- Styles: `src/styles/reveal.css`. A single CSS keyframe animates `opacity` and `translate`, so each element's own `transform` is left alone. Duration, distance and easing are the `--reveal-*` custom properties.

## Adding an element

Add `data-reveal` to an element in the page or section markup:

```astro
<h2 data-reveal>Stack</h2>
```

On a component that spreads its attributes (`ButtonMain`, `ParagraphLink`), pass an empty value: `data-reveal=""`. Otherwise Astro renders it as `"true"` and the script ignores it.

`ProjectCard` and `CuratedShotCard` take a `reveal` prop instead. Only the homepage grids set it, so the same cards stay still inside the Curated Shots modal. A deferred (search-hidden) project card passes the reveal on to the card that replaces it.

Mark individual elements (headings, paragraphs, media, cards, list items), not whole sections.

## Where it is off

- Legal page: `BaseLayout reveal={false}` also turns it off for the footer.
- Header, modals (Contact popup, Curated Shots overlay), the hero video and Go to top (which has its own entrance) have no `data-reveal`.
- Reduced motion: nothing is hidden or animated.
- Without JavaScript: nothing is hidden, because only elements the script picks up become `pending`.

## Lifecycle

`data-reveal` (in markup) → `pending` (hidden until in view) → `shown` (animating, with `--reveal-delay`) → `done` (no animation or inline style left). On page load the observer waits for the page loader's `page-loader:done` event, so the first screen animates as it is uncovered. Content the page is already scrolled past (a restored scroll position) goes straight to `done`.
