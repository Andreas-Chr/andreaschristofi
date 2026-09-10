# Typography

Source: [01 - Foundations / Text Styles](https://www.figma.com/design/FXrcGSbJF7X4lbbGanlb6d/andreaschristofi.com?node-id=5077-2746), read 10 September 2026. Includes all 19 local text styles, including the two narrow H1 variants.

Use the matching `text-*` class in `src/styles/typography.css` for the complete visual style. Choose HTML semantics separately: for example, `<span class="text-headings-h5">Menu</span>`. The `--text-*` custom properties provide font shorthands for component CSS; use the class when case, decoration and optical size must also match. These are explicit styles, not global overrides of semantic heading elements or the existing responsive typography.

| Figma style | CSS class | Font | Weight | Size / line height | Case | Decoration |
|---|---|---|---|---|---|---|
| Headings/H1 | `text-headings-h1` | Zalando Sans Expanded | 900 | 64px / 72px | Uppercase | None |
| Headings/H1 Alt | `text-headings-h1-alt` | Zalando Sans Expanded | 900 | 64px / 72px | Original | None |
| Headings/H1 - Narrow | `text-headings-h1-narrow` | Zalando Sans Expanded | 900 | 40px / 64px | Uppercase | None |
| Headings/H1 - Ultranarrow | `text-headings-h1-ultranarrow` | Zalando Sans Expanded | 900 | 32px / 48px | Uppercase | None |
| Headings/H2 | `text-headings-h2` | Zalando Sans Expanded | 900 | 36px / 40px | Uppercase | None |
| Headings/H3 | `text-headings-h3` | Zalando Sans Expanded | 900 | 24px / 36px | Uppercase | None |
| Headings/H4 | `text-headings-h4` | Zalando Sans Expanded | 900 | 32px / 48px | Original | None |
| Headings/H5 | `text-headings-h5` | Zalando Sans Expanded | 900 | 18px / 24px | Uppercase | None |
| Headings/H6 | `text-headings-h6` | Zalando Sans Expanded | 400 | 12px / 16px | Uppercase | None |
| Display/Large | `text-display-large` | DM Sans | 400 | 40px / 48px | Original | None |
| Display/Medium | `text-display-medium` | DM Sans | 300 | 32px / 48px | Original | None |
| Display/Small | `text-display-small` | DM Sans | 500 | 20px / 36px | Original | None |
| Body/Large | `text-body-large` | DM Sans | 500 | 20px / 36px | Original | Underline |
| Body/Medium | `text-body-medium` | DM Sans | 400 | 16px / 32px | Original | None |
| Body/Small | `text-body-small` | Zalando Sans Expanded | 900 | 14px / 24px | Original | None |
| Navigation/Large Paragraph Link | `text-navigation-large-paragraph-link` | DM Sans | 500 | 20px / 36px | Original | Underline |
| Navigation/Medium Paragraph Link | `text-navigation-medium-paragraph-link` | DM Sans | 500 | 16px / 24px | Original | Underline |
| Navigation/Small Paragraph Link | `text-navigation-small-paragraph-link` | DM Sans | 500 | 14px / 24px | Original | Underline |
| Navigation/Navigation Link | `text-navigation-navigation-link` | Zalando Sans Expanded | 900 | 40px / 48px | Original | None |

All styles use zero letter spacing and zero Figma paragraph spacing. Layout containers own spacing between separate paragraphs. DM Sans optical size is 9 for Display/Large and Body/Medium, and 14 for the other DM Sans styles; the declarations preserve these values (static font files cannot change optical axes). Ligatures are disabled to match the foundations frame.

Body/Large is underlined in Figma; Display/Small has the same font metrics without an underline. The final four specimens in the frame have duplicate “Body/Small” layer labels, but their linked styles are the four Navigation styles listed above. Use the linked style names, not the specimen labels.

Narrow H1 styles are explicit variants; existing responsive heading behavior continues to be controlled by the site's breakpoints. H5 is always 18px / 24px.

