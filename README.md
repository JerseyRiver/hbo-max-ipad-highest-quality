# HBO Max Highest Quality on iPad — Loon Plugin

For HBO Max on iPad when the app does not automatically select the highest available quality. Version **1.2.0 is experimental**: it retains pre-roll choices and replaces the main program's video and audio segments with the highest available targets.

If the server provides 4K, the main video target is 4K. If its highest tier is 1080p, the target is 1080p. The plugin cannot create missing tiers, unlock subscription entitlements or bypass DRM.

## Install or update

Add this URL in Loon's plugin settings, or update your existing installation:

```
https://raw.githubusercontent.com/JerseyRiver/hbo-max-ipad-highest-quality/main/HBO-Max-iPad-Highest-Quality.plugin
```

1. Enable scripting and MITM; install and trust Loon's certificate.
2. Disable other HBO playback or playlist rewrites, including earlier separate identity, quality and StartupTest plugins.
3. Verify that the plugin version is 1.2.0. Fully quit HBO Max, reopen it and start a new playback session.

One plugin loads three scripts automatically. No manual audio setting is needed for this experiment. To restore normal selection, disable the plugin and restart HBO Max.

## What changes

1. `hbo-playback.request.js` rewrites the playback request's device identity to Apple TV / tvOS to request additional tiers. Account, session and FairPlay data are preserved.
2. `hbo-period-plan.response.js` records the original manifest URL and main chapter's asset ID, start and duration from `playbackInfo`. It leaves that response unchanged. **The main-only fallback introduced in 1.1.0 is no longer selected**: the observed fallback capped video at 720p.
3. `hbo-period-quality.response.js` handles the master and media playlists. It keeps video resolution choices within the selected video encoding family and retains their audio groups. For each mapped media playlist, it substitutes only the main chapter with the highest target's segments, initialization information and encryption tags. Pre-roll and post-roll segments remain from the requested playlist. The main target is fixed even if the player selects a lower rendition.

This is a playlist rewrite prepared before playback, not a timed command to the player. Main segments can be downloaded before the main program starts. The player still controls buffering, download timing, audio language and output-device processing.

Pre-roll choices are retained, but unrestricted original adaptive selection is not guaranteed: video is limited to one encoding family, and variant metadata must advertise the main program's maximum resolution, codecs and bandwidth. That metadata can affect the player's initial selection. Audio playlists declare both their original and replacement codecs where needed.

## Selection and validation

- Main video: highest pixel count, then Dolby Vision Profile 5 → HEVC HDR → HEVC SDR → AVC, then preferred audio format and bitrate.
- Main audio: prefer Atmos → EAC3 → AC3 → AAC within the selected video family. Map only matching language, associated language and accessibility role. If there is no matching target, retain that audio playlist. This is a format preference, not a claim of lossless or perceptually better sound.
- Preserve referenced subtitle groups and session keys. Do not alter subtitle language or license requests.
- Accept complete VOD playlists only. Validate the main chapter's boundary, asset path, duration and initialization section before replacement. Resolve relative URLs and implicit segment byte ranges. Leave unsupported, mismatched or failed responses unchanged.

Offline checks against an actual 90-variant master and four media playlists verified a 3840×1920 main video target, same-language AAC-to-Atmos main replacement, unchanged pre/post-roll sections, byte ranges, caching and failure handling. These checks do **not** establish successful playback on iPad.

## Experimental limitations

Switching AAC to EAC3/Atmos at a chapter boundary may be rejected by the iPad player despite discontinuity and codec declarations. Device identity rewriting and Dolby Vision support also depend on the client. Audio output still depends on the device and connected speakers or headphones.

The plugin does not change advertising decisions, skip controls or ad-blocking rules. It is not a proven fix for the observed skip stall. A playlist that fails validation remains original and may therefore stay below the highest quality. Unsupported formats, concurrent playback sessions and app/server changes can also prevent replacement.

Fetching a target media playlist can add startup latency. Forcing high quality can increase buffering and seek delays; this plugin does not increase network speed or change player buffer limits.

## Local installation

Place `hbo-playback.request.js`, `hbo-period-plan.response.js` and `hbo-period-quality.response.js` in iCloud Drive → Loon → Script, then import the local plugin using relative script paths. The public plugin uses online URLs.

## Privacy

Published files contain no captures, account tokens, private keys or server configuration. There are no analytics or uploads. The rewrite may fetch the server-provided highest media playlist from an allowed HBO CDN over verified HTTPS; it does not download extra video segments itself or copy request cookies into that fetch.

Loon's local persistent storage holds one current playback plan, including signed playback URLs and up to six cached target media playlists. A new valid playback response replaces the plan; expired data is removed when a later playlist request reads it (six-hour lifetime, not a background deletion timer). Disabling or uninstalling the plugin does not itself erase this storage. Remove the `HBO.iPad.PeriodPlan.v1` key from Loon's script storage to clear it immediately. Do not share the contents of that key.

Logs report processing steps, resolution and format, without signed URLs, account details or DRM data. Prefixes: `[HBO iPad Playback]` and `[HBO iPad Period]`.

## License

Created by **JerseyRiver**. MIT. See [LICENSE](LICENSE). Not affiliated with HBO, Apple or Loon.
