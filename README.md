# Great Questions landing page

The public page for the Great Questions Mac app (internal preview): what it does, a live animation of the
app at work, how to install it, and an FAQ.

**Live:** https://greatquestion.github.io/great-questions-landing-page/

## What's here

- `index.html`: the page, with its styles and a little script inline. Sections: the hero with the download
  button and the animation, **Set up in about five minutes** (`#install`), and **Frequently asked
  questions** (`#faq`, each answer has its own link).
- `assets/`: the logo, favicon, touch icon, and `hero.js`, the built animation.
- `hero/`: the animation's source (below).

Fonts (Inter, Newsreader, JetBrains Mono) load from Google Fonts.

## The hero animation

A silent loop, live HTML rather than a video: Slack, Linear and GitHub messages pile up, get read and tagged,
the untested assumptions surface, and one becomes the app's real question card. It cycles through three demo
questions. Phones (a hero under 640px wide) get a shorter, simpler version. People who prefer reduced motion
get a still of a finished card.

It's React and GSAP, drawn in a shadow root so its styles and the page's never mix, and it renders the app's
own components (`QuestionCard`, `BrandIcon`, ...) and demo data from
[great-questions](https://github.com/GreatQuestion/great-questions). That repo needs to be checked out next
to this one to build (or set `GQ_APP` to its path).

- `hero/src/timeline.ts`: the desktop loop, beat by beat. `phoneTimeline.ts`: the phone loop.
  `motion.ts`: what they share (curves, tints, the message-to-card steps).
- `hero/src/copy.ts`: the messages and their tags. The cards' text comes from the app's demo data.
- To review one moment, open the page with `?t=` and a time in seconds, e.g. `?t=16` holds the finished card.

Rebuild `assets/hero.js` after changing anything in `hero/`, and commit it with your change:

```bash
cd hero && pnpm install && pnpm build
```

## The download button

It points at
`https://github.com/GreatQuestion/great-questions-releases/releases/latest/download/Great-Questions.dmg`,
which always serves the newest release. Nothing here needs to change when a new version ships, as long
as the release keeps the file name `Great-Questions.dmg` (the app's release script does).

## Edit and publish

Preview with a local server from the repo root (`python3 -m http.server`); the hero is an ES module, so
opening `index.html` as a file won't load it. Pushing to `main` publishes: GitHub Pages serves the repo root
from `main`, usually within a minute.

## Related

- App code: [GreatQuestion/great-questions](https://github.com/GreatQuestion/great-questions) (private)
- Built releases and install guide: [GreatQuestion/great-questions-releases](https://github.com/GreatQuestion/great-questions-releases)
