# Button components

Source: [02 - Components / Button Components](https://www.figma.com/design/FXrcGSbJF7X4lbbGanlb6d?node-id=5111-1672).

| Figma component | Astro component | Variants |
| --- | --- | --- |
| Button/Main (`5040:805`) | `src/components/ButtonMain.astro` | `hierarchy="primary\|secondary"`; optional `icon` URL and `iconPosition="left\|right"` |
| Button/Icon (`5105:2232`) | `src/components/ButtonIcon.astro` | `version="primary\|secondary\|tertiary"`; `size="large\|small"`; optional `compact` for 32px below 640px |
| Button/Accordion (`5044:2837`) | `src/components/ButtonAccordion.astro` | Native hover, focus, active, disabled; `aria-expanded` controls plus/minus |

Main and Icon render an anchor when given `href`, otherwise a native button with `type="button"`. `disabled` removes a link's destination and tab stop, or disables a native button. `aria-disabled` alone communicates an unavailable action; callers must not attach activation handlers to an unavailable control. Interaction states use CSS, not manually supplied state props.

Main is 48px high. Icon is 48px or 32px square. Accordion has a 40px indicator with an 8px radius. Icons reuse local SVG assets at the site's previously approved 16px size. Shared Main/Icon styles live in `src/styles/buttons.css`; colors use `src/styles/tokens.css`.

```astro
<ButtonMain href={site.cv} download hierarchy="secondary" icon="/assets/icons/download.svg">Resume</ButtonMain>
<ButtonIcon version="tertiary" aria-label="Open main menu" aria-expanded="false" aria-controls="main-navigation">
  <!-- Existing animated menu icon -->
</ButtonIcon>
<ButtonAccordion aria-expanded="false" aria-controls="details-panel" indicatorClass="details-toggle">
  Details
</ButtonAccordion>
```

ButtonIcon requires an accessible `aria-label`. ButtonAccordion takes a label in its default slot (or `aria-label` for an icon-only use). Its indicator is decorative; never place a second button inside the trigger. Owners retain panel state, positioning, card hover targets (`data-accordion-card`), and progressive enhancement.

Native attributes, ARIA attributes, data attributes, custom classes, and Astro scope attributes are forwarded to the root. Layout rules stay in the owning page or component; shared components own their visual states. Use `:global()` in owner styles when targeting the Accordion's internal indicator.

## Migrated instances

| Location | Component |
| --- | --- |
| Hero / Curated Works | Main, primary, unlinked |
| About / Resume | Main, secondary, right icon |
| Header menu / Resume | Main, primary, right icon |
| 404 / Return Home | Main, primary, right icon |
| Header menu trigger | Icon, tertiary, large; existing animated glyph retained |
| All SocialLinks instances | Icon, secondary on light surfaces, tertiary on dark surfaces |
| Footer contact close | Icon, secondary, small |
| Standalone ContactPopup close and Resume | Icon, secondary, large; Main, primary |
| Approach and Experience cards | Accordion, with existing full trigger contents and panel behavior |

The shared header/footer cover Home, Legal, and 404. The large Footer/ContactCta, logo, navigation links, and paragraph links are separate Figma components and keep their own implementations. The standalone ContactPopup remains available without adding a new page or trigger.
