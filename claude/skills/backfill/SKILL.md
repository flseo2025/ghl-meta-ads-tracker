---
description: Catch up the GHL Meta Ads Stat Tracker for many past weeks at once, for members whose ads have been running but whose tracker was never filled. The member supplies two screenshots per past week. Use when the member says "backfill my stat tracker", "catch up my tracker", "fill all the past weeks", or hands over a folder of weekly screenshots.
---

# Backfill past weeks

Paths for this run (use these wherever the reference files say `${CLAUDE_PLUGIN_ROOT}` or
`${CLAUDE_PLUGIN_DATA}`):

- Plugin folder: `${CLAUDE_PLUGIN_ROOT}`
- Member data folder: `${CLAUDE_PLUGIN_DATA}`

1. **Load the config** at `${CLAUDE_PLUGIN_DATA}/config.json`. If it is missing, run the `setup`
   skill first.
2. **Find the range.** Ask when their ads started. Turn that into the first Sunday on or before the
   start date, and the last complete week (the Sunday before last Saturday). List the weeks with
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs" weeks <first sunday> <last sunday> <config.timezone>`.
   Show the member the list of weeks and how many screenshots that means (two per week).
3. **Check which weeks are already in the sheet** (`get_values` on column A). Skip those unless the
   member asks to redo them.
4. **Collect the screenshots.** Point them to `${CLAUDE_PLUGIN_ROOT}/reference/screenshots.md`,
   including the file naming for a backfill (`YYYY-MM-DD-meta.png`, `YYYY-MM-DD-ghl.png`, named by
   the Sunday). Ask for a folder path. Match each file to its week by name, and check the date range
   visible inside every screenshot against its week. List any week that is missing a screenshot or
   whose screenshot shows the wrong range, and ask before going on.
5. **Pull the data once, not per week.** Opt-ins and applications: one `get-forms-submissions` and
   one `get-surveys-submissions` call over the whole range (from the first week's `queryStartAt` to
   the last week's `queryEndAt`), paginating with `page` until every submission is fetched. Calendar
   events: one call from the first week's `startMs` to the `endMs` of the week 8 weeks after
   the last one (calls booked in a week can take place weeks later). The script filters
   each week out of the same files.
6. **Fill the weeks oldest first.** For each week, run procedure steps 1 to 7 from
   `${CLAUDE_PLUGIN_ROOT}/reference/procedure.md` against the shared files. Ask the member-only
   questions (target market, closes) for all weeks in one message, not week by week.
7. **Show all rows before writing**, one compact table per week, and write only after the member
   says go.
8. **Write and verify every week** with `sheet-build.md` and `verification.md`. At the end, re-pull
   one whole week from the API from scratch and compare it with what was written.
9. **Save a ledger per week** in `${CLAUDE_PLUGIN_DATA}/weeks/<sunday>/ledger.json`.
10. **Report**: weeks written, rows per week, anything that did not reconcile, and the sheet link.

Rules that always hold:

- A week with ads switched off still gets rows if any ad set spent money or produced a result.
- Results can come from an ad that has since been switched off. The tags on the submission are the
  truth, not the list of ads running today.
- Never adjust a number so that two sources agree. Never write over an existing row without a yes.
- Use only the GoHighLevel connector named by `config.ghl_tool_prefix`, and check it still returns
  `config.location_id` before the first call.
