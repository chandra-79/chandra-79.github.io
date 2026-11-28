# Ziggle credits

Ziggle 2.91.4. See [LICENSE](LICENSE): all rights reserved, except the third-party data below.

## Third-party data and notices

- Open English WordNet 2024 (CC BY 4.0), derived from Princeton WordNet 3.0: [`play/OEWN-NOTICE.txt`](play/OEWN-NOTICE.txt)
- Princeton WordNet 3.0 (practice word library): [`library/v1/NOTICE.txt`](library/v1/NOTICE.txt)
- SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson: [`play/SCOWL-COPYRIGHT.txt`](play/SCOWL-COPYRIGHT.txt)
- emojibase-data (MIT), country-flag-icons (MIT), countries-list (MIT) and Unicode CLDR / Unicode data (Unicode License V3): [`play/emoji/NOTICE.txt`](play/emoji/NOTICE.txt)

## Project credits

Ziggle is an independently implemented standalone browser game collection. Its name, custom path-drawn wordmark, brain-and-zigzag icon, and Day Spark / Night Fizz visual identity were created for this project. The coral brain, citrus zigzag, sparkle, and orbital illustration are original SVG artwork; the wordmark uses drawn paths rather than a font. The home page at `/` leads to the eight games. Word Search and Crossword open at `/play/words.html`, with Word Cloud at `/play/weaver.html`, Letter Lock at `/play/lock.html`, Arrow Escape at `/play/index.html`, Memory Mischief at `/play/memory.html`, Sudoku at `/play/sudoku.html` and Sum Spark at `/play/sums.html`.

The Ziggle game code, puzzle generation, SVG illustrations, icons, and interface styling were created for this project. No third-party artwork, audio, or binaries are included in the playable Ziggle games. System fonts are used.

Word Search and Crossword draw on two word sources. The sixteen built-in themes use word lists and clue text written for Ziggle. The 📚 word-bank categories and the 400 practice choices come from Ziggle's word catalog (`library/v1/`), which is built from Princeton WordNet 3.0: its words, categories and clues are WordNet entries and their definitions (glosses), filtered and ordered by Ziggle, with SCOWL word frequencies used to prefer common words (`content-source/`). The same catalog supplies practice words for Word Cloud, Letter Lock, the typing trainer and the memory palace. WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved. WordNet's licence notice ships in `library/v1/NOTICE.txt` and inside each catalog file that uses its data. Puzzle layouts are generated locally; no third-party crossword puzzles are used. Emoji are rendered by the player's operating system.

Memory Mischief is an original Ziggle game concept and implementation: a remembered trail of friendly symbols is replayed after their positions change, with optional reverse-order rounds. Its six characters use original inline SVG artwork; promotional cards use CSS and text symbols. Any emoji are supplied by the player’s operating system. Optional tones are synthesized in the browser. No third-party memory puzzles, character assets, or audio recordings are used.


Sudoku puzzles are generated locally by Ziggle's own solver-checked engine (Classic, Addoku, Diagonal, Mini 6×6, Even/Odd). The World Tour arrow boards use original geometric silhouettes inspired by city landmarks; no map data, photos or third-party artwork are used. App icons are rendered from the Ziggle brain-spark logo.

Word Cloud and Letter Lock grew out of ideas from Mind Gym, an earlier, now retired project by the same owner; their Ziggle code, clue text and styling are new. Word Cloud's 127 weaves and clues are original. Letter Lock's word lists are derived from SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson, via the `wordlist-english` package; SCOWL's permission notice ships with the lists in `play/SCOWL-COPYRIGHT.txt`. Letter Lock's answers were curated by hand from the common-word levels. Its second answer list (1,014 words, used once the first 809 have each been a daily) was chosen by hand from the same SCOWL-derived guess list: no plurals in -s and no -ed forms, and about three in four are also entries in Ziggle's WordNet-based word catalog (`library/v1/`, see above). The typing trainer's practice words also come from SCOWL (its most common level); its sentences, number and code snippets were written for Ziggle. The blog posts are original writing; facts and figures link to their sources.

The emoji and flags learner's emoji names, code points, versions and groups come from emojibase-data (MIT, by Miles Johnson), built on the Unicode CLDR project (Unicode License V3); both notices ship in `play/emoji/NOTICE.txt`. Symbol names are the official Unicode character names. The emoji themselves are drawn by the player's device. Of its 260 flags (every flag Unicode defines except the United Nations and Sark), 83 are drawn by Ziggle's own renderer (`play/flags.js`) from each flag's published geometry and colours. The other 177 use the 3:2 flag pictures from country-flag-icons (MIT, © 2020 @catamphetamine), with capitals and continents from countries-list (MIT, © 2014 Annexare Studio); both notices ship in `play/emoji/NOTICE.txt`, and `flags-source/build-flags.mjs` rebuilds the list. Questions, levels and notes were written for Ziggle.

The memory palace trainer's word lists, objects, names, made-up historical events, Major-system pegs, Ziggle House and lessons were written for Ziggle; its faces and abstract shapes are drawn by Ziggle's own code (`play/palace-art.js`). The method of loci, the Major system and the memory-championship disciplines are traditional techniques, described here in Ziggle's own words.

The cube trainer's engine, 3D view, pictures, timer and lessons were written for Ziggle; no cube library is used. Cube notation follows the WCA regulations. The OLL, PLL, two-look, Ortega and parity algorithms are the standard ones the cubing community has shared for decades (move sequences, which Ziggle checks itself in `cube.test.js`); OLL numbers and PLL letters follow common usage. The F2L solutions are found by Ziggle's own search.

The Word Builder's meanings, example sentences, synonyms and opposites are a small selection from Open English WordNet 2024 (https://en-word.net), licensed CC BY 4.0 and derived from Princeton WordNet 3.0; the notice ships in `play/OEWN-NOTICE.txt` and is linked from the trainer. Ziggle chose the words, tiers and questions, and `vocab-build.mjs` records exactly how the data was trimmed.

The Lexicon Atlas adds no word data of its own: its regions are the Word Cloud categories, the word-game themes, the Word Builder levels and the Letter Lock list (SCOWL, see above) that Ziggle already ships. Its map drawing and code were written for Ziggle.

## Tile art

The tile pictures in `play/art/` were drawn for Ziggle (`art-source/build-art.mjs`) and use no outside images, fonts or icon sets.

## Notices that ship with the site

- `library/v1/NOTICE.txt`: Princeton WordNet 3.0 licence (word catalog).
- `play/SCOWL-COPYRIGHT.txt`: SCOWL word lists (Letter Lock, typing, catalog frequencies).
- `play/OEWN-NOTICE.txt`: Open English WordNet 2024, CC BY 4.0 (Word Builder).
- `play/emoji/NOTICE.txt`: emojibase-data (MIT), Unicode CLDR, country-flag-icons (MIT) and countries-list (MIT) (emoji and flags learner).

The same list, with links, is on the About page under Credits (`/about.html#credits`), linked from every page's footer.
