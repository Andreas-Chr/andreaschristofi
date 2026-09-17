# ParagraphLink

Source: [02 - Components / Typography/ParagraphLink](https://www.figma.com/design/FXrcGSbJF7X4lbbGanlb6d?node-id=5044-4232), inspected 17 September 2026. Implementation: [`src/components/ParagraphLink.astro`](../src/components/ParagraphLink.astro).

Inline, underlined text links. Use the default slot for meaningful link text; use native `href`, `target`, `rel`, `download`, ARIA/data attributes, and `class` as needed.

| Prop | Values | Default / purpose |
| --- | --- | --- |
| `mode` | `dark`, `light` | `dark`; Figma's text color, not the surface color |
| `size` | `large`, `medium`, `small`, `inherit` | `large`; `inherit` follows surrounding paragraph size/line height |
| `disabled` | boolean | `false`; renders unavailable, non-focusable text without a destination |
| `aria-disabled` | boolean or string | `true` also disables navigation |

Figma's component uses Navigation/Large Paragraph Link: DM Sans Medium, 500, 20px/36px, zero tracking, optical size 14, ligatures off, underline from font. `medium` (16px/24px) and `small` (14px/24px) reuse the existing [foundation styles](TYPOGRAPHY.md); these are code sizing options, not Figma component variants. `inherit` retains the existing responsive paragraph layouts.

| Figma state | Dark mode | Light mode | Browser behavior |
| --- | --- | --- | --- |
| Default | `--color-text-dark` (#303030) | `--color-text-light` (#fff) | Native anchor |
| Hover / Active | `--color-text-hover` (#4b09f5) | Same | `:hover` / `:active` |
| Focus | Default color | Default color | `:focus-visible`, plus the existing 3px outline for keyboard visibility |
| Disabled | `--color-text-disabled` (#676767) | Same | `<span role="link" aria-disabled="true">`, no destination/tab stop |

Dark variant nodes: `5044:4231`, `5044:4233`, `5044:4242`, `5044:4244`, `5044:4246`. Light variant nodes: `5478:3532`, `5478:3534`, `5478:3536`, `5478:3538`, `5478:3540` (Default, Hover, Focus, Active, Disabled respectively). Interaction states are browser-driven; there is no simulated `state` prop. The outline is an accessibility addition to Figma's otherwise identical Default/Focus appearance.

```astro
---
import ParagraphLink from './ParagraphLink.astro';
---
<ParagraphLink mode="dark" href="mailto:hello@andreaschristofi.com">Email Andreas</ParagraphLink>
<ParagraphLink mode="light" size="medium" href="/legal/">Privacy &amp; Cookie Policy</ParagraphLink>
<ParagraphLink mode="light" size="inherit" href="https://example.com" target="_blank" rel="noopener noreferrer">Reference</ParagraphLink>
<ParagraphLink disabled>Unavailable resource</ParagraphLink>
```

## Site-wide usage

| Owner | Instances | Mode / size | Routes |
| --- | --- | --- | --- |
| `Header.astro` | Menu email | dark / large | Home, Legal, 404 |
| `SiteFooter.astro` | Contact email | dark / inherit | Home, Legal, 404 |
| `SiteFooter.astro` | Privacy & Cookie Policy | light / medium | Home, Legal, 404 |
| `LegalText.astro` | All detected inline URLs and email addresses, in paragraphs and lists | light / inherit | Legal |
| `ContactPopup.astro` | Email | dark / large | Home, mounted by `Hero.astro` |

All matching website instances already imported ParagraphLink; each now declares its mode and sizing. The footer's previous one-off legal-link size rule is owned by `size="medium"`. The footer contact owner retains its existing below-400px font weight override and responsive text sizing. Logo links, primary navigation, social icon buttons, the skip link, and CTA buttons remain separate components.

## Edge cases and accessibility

- Long URLs/emails wrap within narrow paragraphs; the component stays inline instead of copying Figma's fixed-width frame and no-wrap text.
- Keep nonempty, descriptive slot text. Enabled links require a valid `href`; no destination is invented for missing content.
- Disabled text keeps IDs, titles, language, style, hidden, ARIA/data and Astro scope attributes, but removes navigation attributes, tab stops and activation handlers.
- External links retain the existing explicit `target` and `rel`; mail links retain `mailto:` without opening a new tab.
- Reduced motion disables the color transition. Keyboard focus remains visible.
