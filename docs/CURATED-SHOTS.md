# Editing curated shots

The homepage uses one reusable Card and one native modal, located between Hero and Process. There are no shot pages. Eight independent starter entries live in `src/content/curated-shots/shot-01.json` through `shot-08.json`. Figma contains placeholder artwork for all eight, so these entries deliberately use fallback artwork and Lorem Ipsum until populated.

## Edit an existing shot

1. Put artwork in `public/assets/curated-shots/your-project/`. Example: `public/assets/curated-shots/your-project/cover.webp`.
2. Open the corresponding JSON file. The homepage uses two columns on desktop/tablet and one on mobile. `order` controls the sequence, read left to right and then down.
3. Set `title`, `thumbnail` and `overview`.
4. Edit the `media` array in display order. The first item is the main artwork, followed by `overview`. Subsequent items have their own `description` below them.
5. Run `npm run dev`, open the homepage and click the card. Check desktop and mobile, long text, close/Escape and each video.

Use URLs beginning `/assets/...` for local files. Do not include `public` in URLs. Remote images and uploaded videos must use HTTPS. Text is plain text, not HTML; use `\n\n` inside a JSON string for paragraph spacing.

| Field | What to enter |
| --- | --- |
| `slug` | Unique stable identifier, lowercase words separated by hyphens. Connects the card and modal; creates no page. |
| `title` | Visible homepage title, also used for modal headings and accessible button/player labels. Blank falls back to the slug with spaces. |
| `order` | Number controlling homepage order, ascending. |
| `published` | `false` hides the entry from the homepage and related cards. |
| `content` | `long` renders all media; `short` renders the first media item and overview. All eight starters use `long`. |
| `thumbnail` | Card image URL. Blank, unsafe or failed image uses the Figma card fallback. |
| `overview` | Text below the first media item. Blank uses the Figma Lorem Ipsum paragraph. |
| `media` | Ordered list of media blocks. Add as many as needed. An empty list supplies three fallback blocks for Long, one for Short. |
| `media[].type` | `image`, `video`, `youtube` or `vimeo`. |
| `media[].src` | Image/video file URL or YouTube/Vimeo video URL. Never paste iframe HTML. |
| `media[].description` | Paragraph below this item, starting with the second item. Blank uses Lorem Ipsum. |
| `media[].visible` | `false` hides that media slot. Its description is controlled independently, matching Figma. |
| `media[].showDescription` | `false` hides the paragraph for that additional media item. |
| `media[].poster` | Optional image shown before an uploaded video plays. Blank uses fallback artwork. |
| `media[].captions` | Optional `.vtt` caption file URL for uploaded videos with speech. |
| `media[].captionsLanguage` | Caption language code; defaults to `en`. |

Homepage thumbnails use a locked 4:3 crop with `object-fit: cover`, 24px corners, and a title below the image. Keep essential details away from the edges and prepare a dedicated cover image. Uploaded video keeps its intrinsic aspect ratio; embedded players use 16:9.

## Complete example

```json
{
  "slug": "brand-exploration",
  "title": "Brand Exploration",
  "order": 1,
  "published": true,
  "content": "long",
  "thumbnail": "/assets/curated-shots/brand-exploration/cover.webp",
  "overview": "A visual identity exploring clarity, movement and contrast.",
  "media": [
    {
      "type": "image",
      "src": "/assets/curated-shots/brand-exploration/hero.webp"
    },
    {
      "type": "video",
      "src": "/assets/curated-shots/brand-exploration/motion.webm",
      "poster": "/assets/curated-shots/brand-exploration/motion-poster.webp",
      "description": "The mark transitions between the primary shapes."
    },
    {
      "type": "image",
      "src": "/assets/curated-shots/brand-exploration/details.webp",
      "description": "Type and colour system applications."
    }
  ]
}
```

For MP4 use `"type": "video"` with an `.mp4` URL. For a YouTube or Vimeo block, use the corresponding `type` and a normal HTTPS video link in `src`. YouTube watch, short, share and embed URLs are supported. Vimeo numeric video URLs, player URLs and unlisted URLs with a privacy hash are supported. The provider must allow embedding on your domain.

Videos autoplay muted with controls when visible in the open overlay. They stop when closed or switched away; offscreen players pause/unload. Reduced-motion viewers receive manual playback. Browser settings can still block autoplay. YouTube/Vimeo frames are not loaded while their shot is closed; loading them connects to those providers. Provider errors remain visible in their own player; malformed/missing URLs use fallback artwork. Native video load errors show fallback artwork. Real provider playback needs browser verification with your actual videos.

## Add another shot

1. Duplicate a JSON file as, for example, `shot-09.json`.
2. Give it a new unique `slug` and an `order` of `9` (or another desired position).
3. Replace its fields and media blocks. Keep `content: "long"` for a multi-media shot.
4. Save. The grid and related-shot links update automatically; no component editing is required.

Related shots are the next entries in display order, wrapping around and excluding the current entry. The overlay shows up to two at every viewport width: two columns from 644px, and both stacked below 644px. When no entries are published, the entire section is omitted.

## Payload integration

Thumbnail and media-block alternative text comes only from the selected Media item’s `alt` field. Edit it in Media; Curated Shots has no separate thumbnail or media-block override. Image/GIF alt text falls back to an empty string; video and YouTube labels fall back to the shot title when asset alt is unavailable. The adapter keeps the Media URL and alt together in `thumbnail`. Missing/empty alt renders as `alt=""`; missing or invalid image URLs use decorative fallback artwork. Local thumbnail URL strings remain supported with empty alt. Cards retain their accessible shot title.

Payload is a good match for this structured model: a Curated Shots collection, an ordered media array and upload relationships. Astro remains the public frontend. Payload runs as a separate application with its admin interface, database and persistent media storage. This repository does not install or host that backend.

An adapter is implemented in `src/lib/payload-curated-shots.ts`. The starter collection configuration is in `docs/payload/collections.ts.example`; copy it into your **Payload application**, rename it to `.ts`, and register both collections in its config. It assumes only trusted editors have CMS accounts. Use image/video upload relationships for files and `src` for provider links or external file URLs. Local JSON `thumbnail` becomes a Payload upload relationship; `media[].file`, `posterImage` and `captionFile` become populated upload objects. The adapter normalizes those to the same frontend model.

Once Payload is running:

1. Configure the database, administrator authentication and persistent storage in the Payload app.
2. Register `CuratedShots` and `Media`, and upload your media. Payload uses draft/published status; public reads expose only published shots.
3. Create the eight entries, preserving slugs and ordering. Upload local files and select them in their relationship fields.
4. Set `PAYLOAD_URL=https://your-cms-domain.example` in this Astro app’s build environment (or local `.env`). Leave it unset to use local JSON.
5. Rebuild the Astro site. The adapter fetches `/api/curated-shots` with populated uploads, pagination and a published filter. It fails the build on an API error rather than silently publishing placeholder content. Local JSON is not merged when Payload is enabled.
6. Add a publish/unpublish build webhook when configuring hosting: this site is static, so CMS changes appear after a successful rebuild. CMS preview is a separate future integration.

No live endpoint, database, hosting or storage has been configured or tested in this task. The adapter is tested with mocked Payload responses. The collection template must be typechecked and tested inside your chosen Payload application before use.

References: [Astro’s Payload guide](https://docs.astro.build/en/guides/cms/payload/), [Payload REST API](https://payloadcms.com/docs/rest-api/overview), [uploads](https://payloadcms.com/docs/upload/overview), [arrays](https://payloadcms.com/docs/fields/array), [drafts](https://payloadcms.com/docs/versions/drafts).

## Component and Figma mapping

| Figma | Implementation |
| --- | --- |
| Project Media Components / Card `5529:3632` | `CuratedShotCard.astro`, Default and Hover (`state`), with hover also available on keyboard focus. |
| Overlay / Curated Shot `5184:2223` | The existing `CuratedShotOverlay.astro`, updated to Desktop `5184:2221`, Tablet `5555:1670`, and Mobile `5555:1715`. Layout follows viewport width and content length. |
| Title, Overview, Media 01 | `title`, `overview`, `media[0]`. |
| Media 02/03 and descriptions | Subsequent usable `media[]` entries and each entry’s `description`; the array extends the same pattern for additional blocks. Blank descriptions and unusable media URLs are omitted. A first-media description is retained beneath the overview. |
| Other Curated Shots | Next two published records, wrapping display order; each card’s title, thumbnail and modal action use that record. |
| Footer/ContactCta | Shared `site.email` value and `ParagraphLink` mail action. |
| Homepage `5492:1725`, `5547:7239`, `5547:7285`, `5547:7321`, `5547:7357` | `CuratedShots.astro` and the Card's `layout="caption"`: two columns at 1440/1024/768px, one at 480/320px, 4px column gaps, 32px row gaps, and 16px between thumbnail and title. |

The modal starts 25px below the viewport top with a black 60% backdrop. A centered secondary small (32px) close control sits outside the white panel with a 16px gap. The panel has 24px top-left and top-right corners, square bottom corners, and 24px vertical padding; it scrolls independently so the close control remains available. Native dialog supplies modal focus containment and Escape dismissal. Closing returns focus to the original homepage card, including after related-shot navigation; switching shots resets panel scrolling and stops the previous media.

Opening fades the modal in while moving it up 24px over 360ms; the backdrop fades in over 240ms. The close button, Escape and complete backdrop clicks fade the modal and backdrop out over 240ms, moving the modal down 16px. The native dialog stays open and page scrolling stays locked until the exit finishes, then media is cleared and focus returns to the original card. Repeated close requests and shot navigation during the exit are ignored. Reduced-motion users open and close immediately; page transitions also clean up immediately.

Desktop content is capped at 1024px with 16px gutters (992px artwork); tablet uses 16px gutters, mobile below 644px uses 8px. Main media corners are 24px from 1024px, 16px from 644px, and 8px below 644px. Uploaded image/GIF/video proportions remain content-driven, and YouTube players retain 16:9. The header and media blocks have 24px gaps, and the body, related section and contact footer have 40px gaps. Related and contact sections each have 40px vertical padding and 24px internal gaps.

Related cards reuse the homepage caption component with dark 24px/36px titles at every modal width, Figma’s 694:521 thumbnail ratio, 24px corners, and a 16px title gap. The grid has a 4px gap and stacks both cards below 644px. Keyboard focus uses the purple focus token for contrast on white. The modal title and contact heading use 32px/48px, rich text uses 16px/32px, and contact copy uses 20px/36px.

The homepage switches to two columns at 644px, the minimum width for two 304px cards, their 4px gap, and 16px page gutters. Existing page gutters are 24px from 1200px, 16px from 400px, and 8px below 400px. The section has 160px top and bottom padding at every size. Titles use 24px/36px, changing to 18px/24px below 400px. Desktop hover (from 1200px with a hover-capable pointer) and keyboard focus reveal a centered 48px lime arrow over a 35% black thumbnail overlay. Titles remain visible in every state; touch/tablet hover stays disabled. Titles, thumbnails, and modal content come from the same shot record and are connected by its slug.

The September 30, 2026 homepage replacement was checked in Chrome at 1440, 1024, 768, 480, and 320px, with additional checks at the 643/644px column boundary and 1920px. Screenshots and rendered measurements verified the 4:3 thumbnails, gutters, gaps, typography, desktop hover, and keyboard focus. All eight published CMS records were checked against the rendered title/thumbnail and their modal media; related navigation, Escape, and focus return passed. This verification covers the homepage replacement and its existing modal connections.

Validation for the homepage replacement: Astro check, the CMS-backed production build, and all 11 focused Curated Shots tests pass. The card-connection test checks the current built records instead of assuming the local starter count or empty media. The full suite was not run for this scoped change. No deployment was performed.
