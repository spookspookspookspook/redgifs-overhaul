## what it does

a tampermonkey/violentmonkey userscript for redgifs.com. the main thing it does is let you filter out gif cards by tag or username — hides them from both the main feed and the explore page.

**filtering**
- add tags or usernames to a blocklist, cards matching either get hidden
- wildcards work — `*word*` for contains, `word*` for starts with, etc.
- filters persist between sessions (stored via GM storage, so they survive page reloads)
- works on both the standard feed and the explore page grid

**the panel**
- floating panel injected into the corner of the page
- collapsible / draggable so it stays out of the way
- shows your active filters as pills you can remove individually
- each section (tags / users) has a count badge and a clear-all button
- if you have a lot of filters the list scrolls rather than blowing out the panel

**quick-add**
- hover any gif card and a strip appears above it
- shows the creator and tags for that card as clickable pills
- click one to add it to your blocklist without opening the panel
