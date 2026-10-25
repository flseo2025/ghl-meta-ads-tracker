# Connect Google Drive and Google Sheets to Claude

The tracker creates your sheet with Google Drive and fills it with Google Sheets. Both connectors
are free and made by Google. You connect them once.

You must be signed in to Claude Code with your Claude account (Pro or Max), not with an API key.
Connectors do not load under an API key.

## Steps

1. In your web browser, go to **claude.ai** and sign in.
2. In the left sidebar, click **Customize**.
3. At the top, click **Connectors**.
4. Under **Top connectors**, click **Google Sheets**.
5. Click **Connect** at the top right. Choose your Google account and click **Allow** on the
   Google screens. The button changes to **Connected**.
6. Click **Connectors** (top left, with the back arrow) to go back.
7. Click **Google Drive**, then **Connect**, and allow it the same way.
8. Still on the Google Drive page, click **Your tool permissions**. Under **Write/delete tools**,
   find **Create file** and make sure it is **not** set to the blocked icon (the circle with a line
   through it). The tick (always allow) or the hand (ask me each time) both work.
9. Do the same on the Google Sheets page: **Your tool permissions**, and make sure **update_values**,
   **update_formulas** and **update_spreadsheet** are not blocked.
10. Go back to Claude Code. Type `/exit`, then start Claude Code again. New connectors only appear
    in a fresh session.
11. Type `/mcp` and press Enter. You should see Google Drive and Google Sheets in the list. Press
    Esc to close it.

Then run setup again: say **set up my stat tracker**.
