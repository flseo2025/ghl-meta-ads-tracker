# Building and writing the sheet

All writes use the claude.ai Google connectors. Google Drive creates the file; Google Sheets writes
it. The Sheets connector has no "create spreadsheet" tool, which is why Drive is needed.

The layout comes from `templates/sheet-template.json` in the plugin folder. Read it; do not retype
it from memory.

## Create the sheet (setup only)

1. Google Drive `create_file` with `title: "<Member Name> Stat Tracker"` and
   `contentMimeType: "application/vnd.google-apps.spreadsheet"`, no content. Save the returned id.
2. Google Sheets `get_spreadsheet` with that id to read the first tab's `sheetId`.
3. Google Sheets `update_spreadsheet` with:
   - `updateSheetProperties`: title `Stat Tracker`, `gridProperties.columnCount` 27 (A to AA)
   - `mergeCells` for each range in `merges` (A2:B2)
   - `repeatCell` on row 1: bold, wrap, centered, background `style.headerInputColor`; then a
     `repeatCell` per formula column in row 1 with background `style.headerFormulaColor`
   - `repeatCell` on row 2: wrap, font size `style.targetsFontSize`
   - `repeatCell` for each number format group, rows 3 to 1000 (row indexes 2 to 1000), for its
     columns, with `numberFormat.type` CURRENCY, PERCENT or NUMBER and the template pattern
   - `repeatCell` on rows 3 and 4: background `style.sampleRowColor`
   - `updateDimensionProperties` for column widths: `default` for every column, then the named ones

   Write every `fields` mask as full comma-separated paths, for example
   `userEnteredFormat.textFormat.bold,userEnteredFormat.wrapStrategy`. The grouped form
   `userEnteredFormat(textFormat.bold,wrapStrategy)` is rejected with "Invalid field" and the whole
   batch fails.
4. Google Sheets `update_values` on `'Stat Tracker'!A1:AA1` with `headers`.
5. `update_values` on row 2: put each `targets` value under its column letter, empty string for the
   rest.
6. Sample rows 3 and 4: one `update_formulas` call on `'Stat Tracker'!A3:AA4` with all 27 cells of each
   row, input values and formulas mixed (formulas from `formulas` with `{r}` replaced by the row
   number, empty string for blank cells). `update_formulas` accepts plain numbers and text too.
7. Read rows 1 to 4 back with `get_values` and check every header, target and formula landed where
   it should. Report the sheet link to the member.

Column letters map to indexes A=0 ... Z=25, AA=26.

## Write a week's rows

1. `get_values` on `'Stat Tracker'!A1:A1000` to find the first empty row at or below row 5. Never
   trust a remembered row number; the member may have edited the sheet.
2. Check that the week is not already in column A. If it is, show the member the existing rows and
   ask whether to replace them. Never write over a row without a yes.
3. Write each row with one `update_formulas` call covering A to AA: input cells (A-G, I, K, N, O,
   R, S, V, W, AA) as values, formula columns from the template with `{r}` set to that row.
4. Blank inputs go in as empty strings so the formulas show blank rather than an error.
