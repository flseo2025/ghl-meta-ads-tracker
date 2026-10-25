# GHL Meta Ads Stat Tracker

Fills your weekly ad stat tracker for you. You give it two screenshots a week, one from Meta Ads Manager and one from your GoHighLevel funnel stats page. It pulls the rest from your own GoHighLevel account: opt-ins, applications, booked calls and attended calls, split per ad set. Then it writes the row into your Google Sheet with all the formulas filled in.

> **Status: first test version (0.1.0), Claude Code only.** Install steps are in [`claude/`](claude/).

## Pick your folder

| You use | Go to | What you download |
|---|---|---|
| **Claude Code** | [`claude/`](claude/) | The Claude Code plugin. This is the first version. |
| **Codex** | [`codex/`](codex/) | Planned. Not available yet. |

Each folder has its own install steps. Open only the folder for the tool you use.

## What it does

- **First-time setup.** Connects to your GoHighLevel account with your own token. You pick your existing funnel, opt-in form and application survey. If you have no booking calendar or no ad-tracking fields, it creates them. It also creates your stat tracker sheet in your Google Drive.
- **Weekly fill.** Fills one week, Sunday to Saturday, from your two screenshots.
- **Backfill.** If you have been running ads and never filled the tracker, send two screenshots for each past week and it fills them all.

## What you need

- A GoHighLevel account with a funnel, an opt-in form and an application survey already built
- Meta ads running to that funnel, with UTM tags on the ad links
- A Google account for the sheet
- The AI tool for your folder (see the table above)

## Your data

Your GoHighLevel token stays on your own computer. This repository contains no one's account data.
