# GHL Meta Ads Stat Tracker for Claude Code

Fills your weekly ad stat tracker in Google Sheets. Each week you give Claude two screenshots. It
pulls everything else from your own GoHighLevel account and writes one row per ad set, with all the
formulas.

## Before you start

You need:

1. **Claude Code**, signed in with a Claude **Pro or Max** account (not an API key).
2. **Node.js 18 or newer.** Check by typing `node --version` in a terminal. If it is missing, install
   the **LTS** version from nodejs.org.
3. **A GoHighLevel sub-account** with your funnel, opt-in form and application survey already
   built. The tracker never builds these for you.
4. **Your GoHighLevel token.** Follow [reference/ghl-token.md](reference/ghl-token.md) to create it.
   Keep it ready to paste; it is shown only once.
5. **Google Drive and Google Sheets connected to Claude.** Follow
   [reference/connect-google.md](reference/connect-google.md).

## Install

1. Open Claude Code.
2. Type this and press Enter:

   ```
   /plugin marketplace add flseo2025/ghl-meta-ads-tracker
   ```

3. Then type this and press Enter:

   ```
   /plugin install ghl-meta-ads-tracker@ghl-meta-ads-tracker
   ```

4. When it asks for the **GoHighLevel Private Integration token**, paste your token and press Enter.
   It is stored in your computer's secure credential store, not in a file.
5. Type `/reload-plugins` and press Enter.

## First run

Say: **set up my stat tracker**

Claude will:

- connect to your GoHighLevel account and read its time zone
- ask you to pick your funnel, opt-in form, application survey and booking calendar
- create a booking calendar only if you have none, and only if you say yes
- create the four ad tracking fields (Campaign Name, Ad Set, Ad Name, Ad Placement) only if they are
  missing, and only if you say yes
- check that your ads carry tracking tags (see [reference/utm-setup.md](reference/utm-setup.md))
- create your sheet, **"[Your Name] Stat Tracker"**, in your Google Drive

## Every week

1. Take the two screenshots in [reference/screenshots.md](reference/screenshots.md).
2. Drop them into Claude Code and say: **fill my stat tracker for the week of [Sunday's date]**.
3. Claude reads them back to you, asks anything only you know (closes, money collected), shows you
   the rows, and writes them once you say go.

## Catching up on past weeks

If your ads have been running and the tracker was never filled, say: **backfill my stat tracker**.
Claude will list the weeks and the screenshots it needs, two per week.

## Updating

In a terminal window (not inside Claude Code), type this and press Enter:

```
claude plugin update ghl-meta-ads-tracker@ghl-meta-ads-tracker
```

Then restart Claude Code. Your settings and sheet are kept.

## What stays private

- Your token is kept in your computer's secure credential store.
- Your settings and weekly audit notes stay in Claude Code's plugin data folder on your computer.
- Nothing is sent anywhere except your own GoHighLevel account and your own Google Drive.
