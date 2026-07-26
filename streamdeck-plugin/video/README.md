# ContextDeck Marketplace Promo Video

Code-driven promotional video for the **ContextDeck** Stream Deck plugin,
built with [Remotion](https://www.remotion.dev/).

## Output

- Resolution: 1920 × 1080
- Frame rate: 60 fps
- Duration: 34 seconds
- Codec: H.264, yuv420p
- Destination: `../../marketplace/promo.mp4`

## Commands

| Command | Result |
|---|---|
| `npm run studio` | Opens Remotion Studio |
| `npm run typecheck` | Checks the TypeScript project |
| `npm run frames` | Renders six representative QA frames into `out/` |
| `npm run render:preview` | Renders a half-resolution preview |
| `npm run render` | Renders the final Marketplace MP4 |
| `npm run frame:moderator` | Renders a QA frame from the real-use demo |
| `npm run render:moderator` | Renders the polished moderator demo |

The Remotion packages are pinned to `4.0.499`. TypeScript is pinned to `6.0.3`,
the newest release compatible with Remotion's current bundler; TypeScript 7
changed its CommonJS API and cannot yet be used by this Remotion release.

## Storyboard

| Time | Scene |
|---|---|
| 0–5s | ContextDeck hero and four supported selection contexts |
| 5–11.6s | Selected text activates the user-configured Text profile |
| 11.6–19.2s | Text, file, folder, and image profiles switch in sequence |
| 19.2–25.3s | Stream Deck-style settings and fully configurable profiles |
| 25.3–30s | Local detection and privacy explanation |
| 30–34s | Product closing and Marketplace call-to-action |

## Music

The background track is **Digital Clouds** by **Alejandro Magaña (A. M.)**,
downloaded from Mixkit. It is different from the track used by the other
Stream Deck plugin promos.

Mixkit lists the track under the **Mixkit Stock Music Free License** and permits
its use in online videos and advertisements without mandatory attribution.
Full provenance is recorded in [MUSIC-LICENSE.md](MUSIC-LICENSE.md).

## Moderator demo

`ContextDeckModeratorDemo` wraps a single real Windows capture with a short
intro and outro. The capture shows live text, file, folder, and image
selections alongside the connected Stream Deck application, with each
user-editable profile becoming visible in turn.

- Privacy-trimmed capture: `public/moderator-demo-capture.mp4`
- Final output: `../../marketplace/moderator-demo.mp4`
- Final duration: 41 seconds
- Capture resolution stays at 1920 × 1080
