---
description: Fill one week of the GHL Meta Ads Stat Tracker from the member's two screenshots (Meta Ads Manager ad sets and the GoHighLevel funnel stats page) plus their GoHighLevel data. Use when the member says "fill my stat tracker", "do this week's tracker", "update the tracker for the week of ...", or sends the two weekly screenshots.
---

# Fill one week

Paths for this run (use these wherever the reference files say `${CLAUDE_PLUGIN_ROOT}` or
`${CLAUDE_PLUGIN_DATA}`):

- Plugin folder: `${CLAUDE_PLUGIN_ROOT}`
- Member data folder: `${CLAUDE_PLUGIN_DATA}`

1. **Load the config** at `${CLAUDE_PLUGIN_DATA}/config.json`. If it is missing, tell the member
   setup has not been run and start the `setup` skill.
2. **Pin down the week.** Ask which week if they did not say. Convert it to that week's Sunday and
   run `node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs" week <sunday> <config.timezone>`. Never
   work out dates or times yourself.
3. **Get the two screenshots.** If they are not attached, give the member the steps in
   `${CLAUDE_PLUGIN_ROOT}/reference/screenshots.md`. Check that the date range visible on each
   screenshot is exactly that Sunday to Saturday. If not, ask for new ones; nothing reconciles
   across different ranges.
4. **Read the screenshots.** From Ads Manager: every ad set's name, campaign and amount spent. From
   the funnel stats: opt-in page uniques, opt-in page opt-ins, application page opt-ins. Read the
   figures back to the member in one short list and ask them to confirm, because a misread digit
   here flows into every formula.
5. **Follow `${CLAUDE_PLUGIN_ROOT}/reference/procedure.md` steps 1 to 7** exactly.
6. **Ask for what only the member knows**, in one message: for each attended call, was the prospect
   in their target market (Y/N); any closes this week, with SOG $ and upfront $ amounts. Blank is
   fine if they do not know yet; say so in the note.
7. **Show the rows before writing.** One short table per ad set with the input figures and the
   note. Write only after the member says go.
8. **Write and verify** with `${CLAUDE_PLUGIN_ROOT}/reference/sheet-build.md` ("Write a week's rows")
   and `${CLAUDE_PLUGIN_ROOT}/reference/verification.md`.
9. **Save the ledger** to `${CLAUDE_PLUGIN_DATA}/weeks/<sunday>/ledger.json`.
10. **Report** in a few lines: what was written and where, anything that did not reconcile, any
    returning leads, and the sheet link.

Rules that always hold:

- Never adjust a number so that two sources agree. Explain the gap in the note instead.
- Never write over an existing row without the member's yes.
- Use only the GoHighLevel connector named by `config.ghl_tool_prefix`, and check it still returns
  `config.location_id` before the first call.
