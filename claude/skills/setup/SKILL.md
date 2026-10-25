---
description: First-time setup for the GHL Meta Ads Stat Tracker. Connects to the member's GoHighLevel account, has them pick their funnel, opt-in form, application survey and booking calendar, creates a calendar and the four ad tracking fields only if missing, and creates their stat tracker Google Sheet. Use when the member says "set up the stat tracker", "set up the tracker", runs this skill, or when the weekly or backfill skill finds no config.
---

# Stat tracker setup

Paths for this run (use these wherever the reference files say `${CLAUDE_PLUGIN_ROOT}` or
`${CLAUDE_PLUGIN_DATA}`):

- Plugin folder: `${CLAUDE_PLUGIN_ROOT}`
- Member data folder: `${CLAUDE_PLUGIN_DATA}`
- Config file: `${CLAUDE_PLUGIN_DATA}/config.json`

The member is usually not technical. Talk in plain words, one question at a time, and when they
have to do something, give numbered click-by-click steps. Never show them raw JSON.

If `config.json` already exists, show what it holds in plain words and ask whether to redo setup or
keep it.

## Hard rules

- **Never create a funnel, form or survey.** Those need human steps in the GoHighLevel editors.
  Discover the member's existing ones and let them pick. If one is missing, stop and tell them to
  build it first.
- **Only two things may be created**, and only after the member says yes: a booking calendar if
  they have none, and any of the four ad tracking fields that are missing.
- Use only the GoHighLevel connector chosen in Step 1 and saved as `ghl_tool_prefix` in the config.
- Never compute dates or epoch times by hand or with the shell `date` command. Use
  `node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs"`.

## Step 0: check Node.js

Run `node --version`. The tracker's helper script needs Node.js 18 or newer. If the command is not
found or the version is older, tell the member: go to **nodejs.org**, click the **LTS** download,
run the installer with the default options, then close and reopen Claude Code. Then run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/week-math.mjs" selftest` and confirm every line says ok.

## Step 1: check the GoHighLevel connection

Call `mcp__plugin_ghl-meta-ads-tracker_ghl__list_locations`. If it works, the connector prefix is
`mcp__plugin_ghl-meta-ads-tracker_ghl__`.

- **Tool not found, but another GoHighLevel connector exists:** Claude Code hides a plugin's
  connector when the member already set up their own connector to the same GoHighLevel address.
  Use ToolSearch for `list_locations` and look for tools ending in `__list_locations` whose
  connector is GoHighLevel (`claude mcp list` shows the URL
  `services.leadconnectorhq.com/mcp`). Call that connector's `list_locations` and show the
  member the sub-account name it returns. If it is the right sub-account, use that connector: save
  its prefix (everything before `list_locations`, for example `mcp__my-ghl__`) as
  `ghl_tool_prefix`. If it is a different sub-account, tell the member their own connector is
  blocking the plugin's, and to remove it with `claude mcp remove <name>` in a terminal (the name
  is shown in `/mcp`), restart Claude Code, and run setup again. Never remove it for them.
- **Tool not found and no other GoHighLevel connector:** the plugin is not enabled or the token was
  never entered. Tell the member:
  1. Type `/plugin` and press Enter.
  2. Open the **Installed** tab, select **ghl-meta-ads-tracker**, choose **Configure**.
  3. Paste the token (steps to create one are in `${CLAUDE_PLUGIN_ROOT}/reference/ghl-token.md`;
     walk them through it).
  4. Type `/reload-plugins`, then run setup again.
- **Error 401 or "unauthorized":** the token is wrong or was deleted. Walk them through creating a
  new one with `reference/ghl-token.md`, then `/plugin configure ghl-meta-ads-tracker@ghl-meta-ads-tracker`.
- **Several locations returned:** the token is an agency token. Ask which sub-account to use.
- **One location:** use it.

Then `execute_operation` `get-location` with `locationId`. Record the location name and its
`timezone` (an IANA name like `America/Chicago`). If no timezone is set, ask the member which time
zone their business runs on and confirm the IANA name with them.

## Step 2: check the Google connectors

Use ToolSearch for `select:mcp__claude_ai_Google_Drive__create_file,mcp__claude_ai_Google_Sheets__update_values`.

If either is missing, stop and walk them through `reference/connect-google.md`, then ask them to
restart Claude Code and run setup again. Do not continue without both: the sheet cannot be created
or filled without them.

## Step 3: about the member

Ask:

1. Their name as it should appear on the sheet title ("<Name> Stat Tracker").
2. The names and email addresses they use when **testing** their own funnel. These are excluded from
   every count. If they are not sure, check the last 60 days of opt-ins in step 5 for submissions
   with their name or email and ask about each.

## Step 4: pick the funnel, form and survey

1. `getFunnels` (paginate with `offset` until all are listed). Show the names, numbered. The member
   picks the funnel their Meta ads send traffic to.
2. `get-forms` with `limit: 50` (paginate with `skip`). They pick the **opt-in form** on that
   funnel's first page.
3. `get-surveys` with `limit: 50`. They pick the **application survey** on the application page.

If they are unsure which form is the opt-in, pull `get-forms-submissions` for each candidate form
over the last 30 days (dates from the week script) and show the counts: the opt-in form is the one
with the most recent submissions arriving with `utm_medium` set.

## Step 5: check that the ads carry UTM tags

Pull the opt-in form's submissions for the last 30 days. Count how many have
`others.eventData.url_params.utm_medium`.

- **Most have it:** show the member the distinct values of `utm_source`, `utm_medium`,
  `utm_campaign` and `utm_content`, and confirm the standard mapping: `utm_medium` = ad set,
  `utm_source` = campaign, `utm_campaign` = ad, `utm_content` = placement. If their ad set names
  sit in a different tag, store the mapping in `utm_map` (keys `campaign`, `adSet`, `ad`,
  `placement`, values the tag names). Otherwise leave `utm_map` null.
- **None or few:** tell the member plainly that the tracker can fill funnel totals but cannot split
  opt-ins by ad set until their ad links carry UTM tags. Explain the fix in
  `reference/utm-setup.md` and continue setup; it is not a blocker.

## Step 6: booking calendar

`get-calendars`. Show the names; the member picks the one their application page books into.

**If there is none**, offer to create one. Only on a yes:

1. `search-users` to find the member's own user id (match their name or email).
2. `create-calendar` with body `{ "name": "Strategy Call", "calendarType": "personal",
   "slotDuration": 30, "slotDurationUnit": "mins", "teamMembers": [{ "userId": "<id>",
   "isPrimary": true }] }`, and an `idempotencyKey`.
3. Tell them what is still theirs to do, click by click: set the calendar's availability
   (**Calendars > Calendar Settings > Strategy Call > Availability**), and put the calendar on their
   funnel's booking page. Until both are done, no calls can be booked through it.

## Step 7: the four ad tracking fields

`get-custom-fields` with `model: contact`. Look for fields named (ignoring case) **Campaign Name**,
**Ad Set**, **Ad Name** and **Ad Placement**.

List which exist and which are missing. For the missing ones, ask once: "Create these N fields?"
On a yes, for each: `locations.create-custom-field` with body `{ "name": "<name>", "dataType":
"TEXT", "model": "contact" }` and an `idempotencyKey`. Do **not** use
`custom-fields.create-custom-field`; it only works for custom objects.

Tell the member that new fields stay empty until their opt-in form fills them from the ad's UTM
tags, and point them to `reference/utm-setup.md`. The tracker does not depend on these fields; it
reads the UTM tags from the form submissions directly. The fields make the split visible in the
contacts screen.

## Step 8: how no-shows are marked

Ask: "When someone books a call and doesn't show up, how do you mark it?"

- In the calendar, by setting the appointment to **No Show**: nothing to store.
- With a tag on the contact: ask for the tag name (`get-location-tags` lists them) and store it.
- They do not mark it: tell them that each week the tracker will ask about every past call that is
  still unmarked.

## Step 9: create the sheet

Follow `${CLAUDE_PLUGIN_ROOT}/reference/sheet-build.md`, section "Create the sheet", using
`${CLAUDE_PLUGIN_ROOT}/templates/sheet-template.json`. Give the member the link.

## Step 10: save the config

Write `${CLAUDE_PLUGIN_DATA}/config.json`:

```json
{
  "version": 1,
  "ghl_tool_prefix": "mcp__plugin_ghl-meta-ads-tracker_ghl__",
  "member_name": "",
  "location_id": "",
  "location_name": "",
  "timezone": "",
  "funnel": { "id": "", "name": "" },
  "optin_form": { "id": "", "name": "" },
  "application_survey": { "id": "", "name": "" },
  "calendar": { "id": "", "name": "", "created_by_plugin": false },
  "ad_fields": { "campaign_name": "", "ad_set": "", "ad_name": "", "ad_placement": "" },
  "exclude": [],
  "no_show_tag": null,
  "utm_ok": true,
  "utm_map": null,
  "sheet": { "id": "", "url": "", "title": "", "tab": "Stat Tracker" },
  "setup_completed": ""
}
```

`setup_completed` is today's date as YYYY-MM-DD. Read the file back to confirm it saved.

## Step 11: finish

Tell the member, in a few lines:

- what was found and picked
- what was created, if anything, and any steps still theirs to do
- the sheet link
- what to do next: "Each week, take the two screenshots in
  `${CLAUDE_PLUGIN_ROOT}/reference/screenshots.md` and say **fill my stat tracker for the week of
  [date]**. If you have past weeks to catch up on, say **backfill my stat tracker**."
