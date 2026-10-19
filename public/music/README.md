# Local lo-fi recording

`portfolio-lofi.mp3` is the original recording **Everything You Ever Dreamed.** by **HoliznaCC0**, served locally after an explicit playback choice. It replaces the earlier procedural composition. Existing unrelated MP3s are untouched.

## Provenance and permission

- Individual official track: <https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/everything-you-ever-dreamed/>
- License: **CC0 1.0 Universal**, linked by that individual page: <https://creativecommons.org/publicdomain/zero/1.0/>
- Exact recording source: <https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/yFLu7P69mDjxhW2aF5MS16GVCqpw4oCqSKw4eSVN.mp3>
- Parent-verified metadata: **Instrumental Yes**, **AI generated No**; album **Lo-fi And Chill**, described as lo-fi hip-hop tracks.

This credit is retained as good attribution practice; CC0 does not require a visible attribution banner. Genre/instrumental information is source metadata, not an audition or quality guarantee. No listening acceptance has been performed.

## Download integrity

| Check | Observed result |
| --- | --- |
| HTTPS response | 200, `audio/mpeg`; no redirects followed |
| Bounds | 30-second timeout, maximum 16 MiB |
| Original bytes | 8,801,280; no transcoding or edits |
| First 10 bytes (hex) | `fffbe404000000000069` (MPEG frame signature) |
| SHA-256 | `c5a2e0aa16cd92df54bb76322ab49e83b0bff5c30e751fe74d3a603e3ddb030f` |

Playback uses `/music/portfolio-lofi.mp3` on the same origin through Web Audio. Visitors make no third-party audio requests; local routing avoids cross-origin MediaElementSource silence. The source URL above is provenance only, not a visitor hotlink.

## Additional selectable recordings

Three more original, unedited recordings by **HoliznaCC0** from the same album (**Lo-fi And Chill**) are served locally for the track selector. Each individual official page lists **CC0 1.0 Universal**, **Instrumental Yes** and **AI generated No**. Each file was downloaded over HTTPS (200, `audio/mpeg`, no redirects, size-capped) and starts with an `ID3` tag followed by MPEG audio. As above, genre and instrumental data are source metadata, not an audition.

| Local file | Title | Official page | Source file | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| `portfolio-morning-coffee.mp3` | Morning Coffee | <https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/morning-coffee/> | `https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/3oECfGbiMKRefansiQFDoumFo0fXknIhsLtlE3x4.mp3` | 7,680,205 | `91de2d8f409730a7fa9b0d94f52d5637d7f913e8cee11d54e462a99b06a86758` |
| `portfolio-autumn.mp3` | Autumn | <https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/autumn/> | `https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/G9jhd1SmuzSTxEjWyzPlUKulshtcz7q4axOZDTxa.mp3` | 6,794,125 | `c12190c1c3587e61580078d01c54d4ab7ab1f742857dc07b9d9d712735631b1a` |
| `portfolio-clouds.mp3` | Clouds | <https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/clouds-6/> | `https://files.freemusicarchive.org/storage-freemusicarchive-org/tracks/hjYBS3lAHkfXNRjdRlACQbBwNPDMdW0dfLh4W2Tw.mp3` | 9,188,345 | `ae970bdaf997065c5b5ea3520c909514f3a4ed2c84521a83eed1325bffaa26c9` |

Only the selected track is requested, and only after an explicit play (`preload = 'none'`).
