# Editing curated shots

The homepage uses one reusable Card and one native modal, located between Hero and Process. There are no shot pages. Eight independent starter entries live in `src/content/curated-shots/shot-01.json` through `shot-08.json`. Figma contains placeholder artwork for all eight, so these entries deliberately use fallback artwork and Lorem Ipsum until populated.

## Edit an existing shot

1. Put artwork in `public/assets/curated-shots/your-project/`. Example: `public/assets/curated-shots/your-project/cover.webp`.
2. Open the corresponding JSON file. The first homepage row is `shot-01`–`shot-04`; the second is `shot-05`–`shot-08` at 1440px. `order` controls this sequence.
3. Set `title`, `thumbnail`, `thumbnailAlt` and `overview`.
4. Edit the `media` array in display order. The first item is the main artwork, followed by `overview`. Subsequent items have their own `description` below them.
5. Run `npm run dev`, open the homepage and click the card. Check desktop and mobile, long text, close/Escape and each video.

Use URLs beginning `/assets/...` for local files. Do not include `public` in URLs. Remote images and uploaded videos must use HTTPS. Text is plain text, not HTML; use `\n\n` inside a JSON string for paragraph spacing.

| Field | What to enter |
| --- | --- |
| `slug` | Unique stable identifier, lowercase words separated by hyphens. Connects the card and modal; creates no page. |
| `title` | Shot title, also used for accessible button/player labels. Blank becomes “Lorem Ipsum”. |
| `order` | Number controlling homepage order, ascending. |
| `published` | `false` hides the entry from the homepage and related cards. |
| `content` | `long` renders all media; `short` renders the first media item and overview. All eight starters use `long`. |
| `thumbnail` | Card image URL. Blank, unsafe or failed image uses the Figma card fallback. |
| `thumbnailAlt` | Describe the thumbnail when it provides information beyond the title. |
| `overview` | Text below the first media item. Blank uses the Figma Lorem Ipsum paragraph. |
| `media` | Ordered list of media blocks. Add as many as needed. An empty list supplies three fallback blocks for Long, one for Short. |
| `media[].type` | `image`, `video`, `youtube` or `vimeo`. |
| `media[].src` | Image/video file URL or YouTube/Vimeo video URL. Never paste iframe HTML. |
| `media[].alt` | Image description or accessible video title. |
| `media[].description` | Paragraph below this item, starting with the second item. Blank uses Lorem Ipsum. |
| `media[].visible` | `false` hides that media slot. Its description is controlled independently, matching Figma. |
| `media[].showDescription` | `false` hides the paragraph for that additional media item. |
| `media[].poster` | Optional image shown before an uploaded video plays. Blank uses fallback artwork. |
| `media[].captions` | Optional `.vtt` caption file URL for uploaded videos with speech. |
| `media[].captionsLanguage` | Caption language code; defaults to `en`. |

Images use Figma’s 4:3 crop inside the overlay; cards use a square crop on the homepage. Keep essential details away from the edges and prepare a dedicated cover image. Uploaded video keeps its intrinsic aspect ratio; embedded players use 16:9.

## Complete example

```json
{
  "slug": "brand-exploration",
  "title": "Brand Exploration",
  "order": 1,
  "published": true,
  "content": "long",
  "thumbnail": "/assets/curated-shots/brand-exploration/cover.webp",
  "thumbnailAlt": "Blue and white brand identity composition",
  "overview": "A visual identity exploring clarity, movement and contrast.",
  "media": [
    {
      "type": "image",
      "src": "/assets/curated-shots/brand-exploration/hero.webp",
      "alt": "Brand identity overview"
    },
    {
      "type": "video",
      "src": "/assets/curated-shots/brand-exploration/motion.webm",
      "poster": "/assets/curated-shots/brand-exploration/motion-poster.webp",
      "alt": "Animated brand mark",
      "description": "The mark transitions between the primary shapes."
    },
    {
      "type": "image",
      "src": "/assets/curated-shots/brand-exploration/details.webp",
      "alt": "Typography and colour details",
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

Related shots are the next entries in display order, wrapping around and excluding the current entry. The overlay shows up to three on desktop, two on tablet and one on mobile. When no entries are published, the entire section is omitted.

## Payload integration

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
| Overlay / Curated Shot `5184:2223` | `CuratedShotOverlay.astro`, responsive Desktop/Tablet/Mobile for Long and Short content. Layout follows viewport width rather than an editorial setting. |
| Title, Overview, Media 01 | `title`, `overview`, `media[0]`. |
| Media 02/03 and descriptions | `media[1]` / `media[2]`, `description`, `visible`, `showDescription`; the array extends the same pattern for additional blocks. |
| Homepage `5492:1725` | `CuratedShots.astro`, eight cards at 1440px in four columns, 4px gaps and 24px corners. |

The modal sits 50px below the viewport top with a black 60% backdrop and a sticky large (48px) close control. Native dialog supplies modal focus containment and Escape dismissal. Closing returns focus to the original homepage card, including after related-shot navigation. Desktop content is capped at 1024px with 16px gutters (992px artwork); tablet uses 16px gutters, mobile 8px. The responsive homepage grid uses two columns below 1024px and one below 600px as an implementation choice; only the 1440px homepage section was supplied for this change.

Browser visual QA remains unverified because the available browser tool reported no browser. Automated checks are not visual sign-off.

Validation: Astro check and production build pass. Focused tests exercise all eight card connections, related navigation, focus restoration, deferred/muted video activation, reduced motion, backdrop dismissal, image fallback, input URL restrictions and Payload mapping/pagination. The full suite has two existing failures outside this change: an assertion for the removed Process “Approach” heading and an assertion that rejects the Contact Popup’s intentional `method="dialog"` submit button. Those source components were unchanged.
