# Weekly procedure: how one week of the tracker is filled

This is the agent procedure behind the `weekly` and `backfill` skills. It was built from eight real
weeks of backfill and a full audit of every row. Every rule below exists because skipping it
produced a wrong number that looked right.

Read the member's config first: `${CLAUDE_PLUGIN_DATA}/config.json`. Every id below comes from it.
If it does not exist, stop and run the `setup` skill.

## Tools

- **GoHighLevel**: the connector whose tool prefix is `config.ghl_tool_prefix` (normally this
  plugin's own, `mcp__plugin_ghl-meta-ads-tracker_ghl__`): its `search_operations`,
  `describe_operation`, `execute_operation` and `list_locations` tools. Never use a different
  GoHighLevel connector; it may point at someone else's account. Before the first call of a run,
  call `list_locations` and check that it returns `config.location_id`; if not, stop.
- **Week math and counting**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs"`. Use it for every
  date boundary and every count. Never work out a timestamp or a UTC offset by hand or with the
  shell's `date` command; shells on some machines are off by hours.
- **Google Sheets**: the claude.ai Google Sheets connector (`update_values`, `update_formulas`,
  `get_values`).

Always pass `locationId` (from config) both as the `locationId` argument of `execute_operation`
and inside `params`. The submissions and calendar endpoints reject the call without it in
`params`, even on a single-location token.

**Large results:** when a result is too big for the conversation, Claude Code saves it to a file and
gives the path. Pass that path straight to the script; it reads the saved result as is.

**Which URL tag holds which name.** The standard Rebels ad URL template is
`utm_source={{campaign.name}}&utm_medium={{adset.name}}&utm_campaign={{ad.name}}&utm_content={{placement}}`,
so `utm_medium` is the ad set, `utm_source` the campaign, `utm_campaign` the ad and
`utm_content` the placement. If setup found a different mapping, it is in `config.utm_map`; pass it
to the script as `--utmMap`.

## Inputs from the member

Two screenshots per week, both set to the same Sunday to Saturday range. See `screenshots.md`.

1. **Meta Ads Manager, Ad sets tab**: amount spent per ad set, plus campaign and ad set names.
2. **GoHighLevel funnel Stats tab**: unique page views of the opt-in page, opt-ins, applications.

Everything else comes from the API. Ask the member for the money columns (Closed, SOG $, Upfront $)
and whether each attended call's prospect was in their target market (column R). These have no
other source. If they do not know yet, leave the cells blank and say so in the note.

## Step 0: the week

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs" week <sunday YYYY-MM-DD> <config.timezone>
```

The output gives the column A label (`10/11 - 10/17`, seven days, never eight), the exact start and
end in UTC and in epoch milliseconds, and `queryStartAt` / `queryEndAt`, which are one day wider on
each side. Use all of these exactly as printed.

**Why wider:** the submission endpoints filter by UTC date. A Saturday-evening submission in the
member's timezone carries a Sunday UTC date and is lost without the wider window. The script then
filters back to the exact local week.

## Step 1: opt-ins

```
execute_operation get-forms-submissions
  params: { formId: <config.optin_form.id>, startAt: <queryStartAt>, endAt: <queryEndAt>, limit: 100, page: 1 }
  locationId: <config.location_id>
```

If `meta.total` is above 100, fetch the next pages. If there is one page, use the saved result file (or save the result) as is. If there are several,
save every page's `submissions` into one JSON array at
`${CLAUDE_PLUGIN_DATA}/weeks/<sunday>/optins.json`. Then:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs" tally <sunday> <tz> "<that file>" --formId <form id> --exclude "<config.exclude joined by commas>"
```

The tally gives submissions per ad set, keyed by the normalized `utm_medium`, plus people counts,
submissions with no UTM, excluded test records and every contact id.

Rules:

- **Attribution is by the ad this submission came through**, read from that submission's own
  tags, even if the person first opted in through a different ad weeks ago.
- **`utm_medium` holds the ad set name** in the standard Rebels setup. Normalization (plus sign to
  space, collapse spaces, lowercase) is done by the script. Without it, `FB+IG` and `FB IG` count as
  two ad sets and both look plausible.
- **Count submissions, not people.** The column asks for opt-ins; one person submitting three times
  is three opt-ins. When people and submissions differ, say both in the note.
- **A submission with no UTM** is a real opt-in that belongs to no ad row. It counts toward the
  funnel total, goes in the note, and is never forced onto an ad.
- **The member's own test records** are dropped by `--exclude`. When your count is lower than the
  stats page, suspect a test record before suspecting the method.

## Step 2: returning leads

Take the `contactIds` from the tally and look them up:

```
search_operations "search contacts advanced" -> describe it -> execute with
  filters: [{ field: "id", operator: "contains_set", value: [<contact ids>] }]
```

Any contact whose `dateAdded` is **before the week's `startUtc`** opted in before and created no
new contact this week. That is a returning lead. Name each one in the row note with the date the
contact was first created. The contacts screen cannot show this, which is why the member cannot
reconcile the week alone.

## Step 3: applications

Same as step 1 with `get-surveys-submissions`, `surveyId: <config.application_survey.id>`, saved to
`applications.json`, tallied with `--surveyId`. The application's own `utm_medium` attributes it. It
can differ from the opt-in's: someone can opt in from an ad and reach the application page directly,
and then the application carries no ad.

## Step 4: booked and attended calls

```
execute_operation get-calendar-events
  params: { calendarId: <config.calendar.id>, startTime: <this week's startMs>, endTime: <endMs of the week 8 weeks later>, locationId: <config.location_id> }
```

`startTime` and `endTime` **must be epoch milliseconds**, taken from the week script output.
ISO dates return an empty list with HTTP 200, which looks exactly like a week with no calls. The
endpoint filters by when the call takes place, so the window runs 8 weeks forward to catch calls
booked this week for a later date. Get that end by running the `week` command for the Sunday 8
weeks later and using its `endMs`. Do not do the arithmetic yourself.

Save to `calls.json`, then:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs" calls <sunday> <tz> "<calls.json>"
```

- **Booked** (column N) = bookings **made** this week (`dateAdded` inside the week).
- **Attended** (column O) = calls **held** this week with status `showed`.
- **No-show** = status `noshow`. If `config.no_show_tag` is set, a contact carrying that tag is also
  a no-show even when the calendar still says `confirmed`.
- **Unmarked past calls** (still `confirmed` after they happened) are listed by the script. Ask the
  member, by name and date, whether each one showed. Do not guess.
- Attribute each booking to an ad set through the contact's opt-in UTM (the tally's
  `contactAdSet`) or, when the opt-in was in an earlier week, through that contact's earliest form
  submission (`get-forms-submissions` with `q: <contactId>`) or the four ad custom fields on the
  contact.

## Step 5: build one row per ad set

One row for every ad set that spent money or produced a result that week. Same date range in
column A on each row.

| Column | Source |
|---|---|
| A | week label from the script |
| B | campaign name from the Ads Manager screenshot (the tally's `campaigns` should match) |
| C | ad set name exactly as Ads Manager spells it |
| D | ad name from the tally's `adNames`, or from Ads Manager |
| E | `FB`, `IG` or `FB/IG` from the tally's `placements` |
| F | unique page views from the funnel stats screenshot |
| G | amount spent for this ad set, from the Ads Manager screenshot |
| I | opt-ins for this ad set from step 1 |
| K | applications for this ad set from step 3 |
| N | bookings made this week attributed to this ad set |
| O | calls attended this week attributed to this ad set |
| R | the member's answer, if they gave one |
| S, V, W | the member's answers, if they gave them |
| AA | the note, see below |

Formula columns (H, J, L, M, P, Q, T, U, X, Y, Z) are written as formulas from
`templates/sheet-template.json`, never as typed numbers.

**Page views are funnel-level.** The stats page cannot split them by ad, so the same figure goes on
every row of the week and each note says it must not be summed.

## Step 6: reconcile before writing anything

Per-ad opt-ins plus no-UTM opt-ins must equal the funnel total on the stats screenshot. If they do
not, find out why before entering a number. The legitimate causes are:

- returning leads (step 2)
- an opt-in with no UTM
- a test record
- the screenshot's date range not being exactly Sunday to Saturday

**Never adjust a figure to make two sources agree.** Enter the real figures and explain the gap in
the note. If you cannot explain it, stop and show the member both numbers.

**Meta's Results column is not a cross-check.** It runs about double the real opt-ins because it
counts its own attributed conversions, including view-through and cross-device. GoHighLevel counts
actual form submissions.

## Step 7: the note (column AA)

Every row gets one. At minimum:

- page views are funnel-level and shared with the other rows of this week
- this ad set's opt-ins, and the funnel total
- every returning lead by name, with the date they were first created
- any test records excluded
- any opt-in or application with no ad attribution
- any call whose attendance the member confirmed by hand

## Step 8: write, then verify

Write the rows (see `sheet-build.md` for the write calls), then run every check in
`verification.md`. Save the derived figures for the week to
`${CLAUDE_PLUGIN_DATA}/weeks/<sunday>/ledger.json` as the audit trail: inputs read from the
screenshots, every API count, the reconciliation, and the rows written.
