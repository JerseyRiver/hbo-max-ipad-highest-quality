# HBO Max Highest Quality on iPad — Loon Plugin

A Loon plugin for HBO Max on iPad when the app does not automatically select the highest available video quality. It rewrites the playback device identity and filters the HLS master playlist so the player uses the highest video tier returned by the server, with a preferred audio group such as Dolby Atmos.

If the playlist includes 4K, the plugin selects 4K. If the highest available tier is 1080p, it selects 1080p. It does not add quality tiers that the server has not provided.

## Installation

Add this URL in Loon's plugin settings. Only one plugin is needed; the scripts are loaded automatically:

```
https://raw.githubusercontent.com/sanyue025-create/hbo-appletv-maxav-loon/main/HBO-AppleTV-MaxAV.plugin
```

1. Enable scripting and MITM in Loon. Install and trust the MITM certificate.
2. Disable other plugins that rewrite HBO playback requests or master playlists. If you installed the earlier separate Apple TV identity, video/audio quality, or StartupTest plugins, disable them too.
3. Fully quit HBO Max and reopen it before starting playback.

## How it works

The plugin runs two steps during playback:

1. **Rewrite the playback request.** For the specified `playbackInfo` endpoint, change the iPad device identity to Apple TV / tvOS to attempt to obtain additional video tiers. Existing account, session and DRM data are preserved.
2. **Filter the master playlist.** Keep one video variant at the highest available resolution, together with one preferred audio group and its languages, audio descriptions and referenced subtitle groups. Removing lower video tiers prevents the player from selecting them.

One plugin invokes two scripts at their respective stages. It does not modify player code or fake a bandwidth measurement.

## Video and audio selection

- Video: highest pixel count first. At the same resolution, prefer Dolby Vision Profile 5 → HEVC HDR → HEVC SDR → AVC, then select the variant with the highest average bitrate.
- Audio: within the selected video format, prefer Dolby Atmos → EAC3 (Dolby Digital Plus) → AC3 (Dolby Digital) → AAC. Languages in the selected group are retained; languages exclusive to other groups may no longer be available.
- Original playback URLs, session keys and referenced subtitle groups are preserved. Default subtitle language is not changed.

Audio selection is a format preference, not a guarantee of better perceived sound or lossless audio.

## Compatibility and limitations

This plugin targets the specified HBO Max playback endpoint and HLS master playlists on iPad. Compatibility with other devices, app versions and regions is not guaranteed. The Apple TV identity rewrite is experimental.

An eligible subscription, supported content and a compatible device are still required. The plugin cannot turn a 1080p source into 4K, unlock subscription entitlements or bypass DRM.

Locking the highest tier removes the player's lower-quality fallback and can increase startup time, seeking delays or buffering. If Atmos is available but the client cannot play it, the plugin does not automatically fall back to AAC; playback may fail or have no sound. This is a workaround, not a guaranteed fix for every low-quality playback or buffering issue.

To restore normal quality selection, disable the plugin, fully quit the app and reopen it.

## Manual installation

For a local installation, place both `.js` files in iCloud Drive → Loon → Script and import a local `.plugin` file that uses relative script paths. The `.plugin` published in this repository uses online script URLs.

## Privacy

The published files contain no traffic captures, account tokens, subscription details, personal server configuration or private keys. The scripts add no network requests, analytics or uploads. They only process the existing HBO requests and playlists inside Loon.

Normal logs include the device model and selected video/audio formats, but not request bodies, playback URLs or DRM data. Errors produce a generic message. The log prefixes `[HBO AppleTV experiment]` and `[HBO MaxAV]` correspond to the two processing steps.

## License

Created by **JerseyRiver**. MIT. See [LICENSE](LICENSE). This project is not affiliated with HBO, Apple or Loon.
