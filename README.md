# Ziggle

A little play. A lot of spark.

This repository holds only the built Ziggle website (version 2.61.1), so that it can be served by GitHub Pages.
It is not the source code and it is not open source: see [LICENSE](LICENSE) and [CREDITS.md](CREDITS.md).

Please do not open pull requests here; this repository is replaced on every release.

Online features (leaderboards, leagues, sync, reminders) are switched off in this copy; everything else works.
Each page carries its Content-Security-Policy and referrer policy as meta tags, because GitHub Pages sends no custom headers.
Headers a page can't set itself (frame-ancestors / X-Frame-Options, nosniff, COOP, Permissions-Policy, cache control) need a proxy such as Cloudflare.
