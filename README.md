# Great Questions landing page

The public page for the Great Questions Mac app (internal preview): what it does, a demo video, how to
install it, and an FAQ.

**Live:** https://greatquestion.github.io/great-questions-landing-page/

## What's here

- `index.html`: the whole page, with its styles and a little script inline. Sections: the hero with the
  download button and demo video, **Set up in about five minutes** (`#install`), and **Frequently asked
  questions** (`#faq`, each answer has its own link).
- `assets/`: the demo video (`teaser.mp4`) and its poster image, the logo, favicon and touch icon.

Fonts (Inter, Newsreader, JetBrains Mono) load from Google Fonts. There's no build step.

## The download button

It points at
`https://github.com/GreatQuestion/great-questions-releases/releases/latest/download/Great-Questions.dmg`,
which always serves the newest release. Nothing here needs to change when a new version ships, as long
as the release keeps the file name `Great-Questions.dmg` (the app's release script does).

## Edit and publish

Open `index.html` in a browser to preview. Pushing to `main` publishes: GitHub Pages serves the repo root
from `main`, usually within a minute.

## Related

- App code: [GreatQuestion/great-questions](https://github.com/GreatQuestion/great-questions) (private)
- Built releases and install guide: [GreatQuestion/great-questions-releases](https://github.com/GreatQuestion/great-questions-releases)
