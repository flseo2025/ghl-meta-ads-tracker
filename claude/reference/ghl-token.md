# Create your GoHighLevel token

The tracker reads your GoHighLevel data with a **Private Integration token**. It is a key that
belongs to your own sub-account and only works for the permissions you tick. It starts with `pit-`.

You need to be an admin of the sub-account.

## Steps

1. Sign in to GoHighLevel and open the **sub-account** your funnel lives in (not the agency view).
2. In the bottom left, click **Settings**.
3. In the settings menu, click **Private Integrations**.
   If you do not see it, the feature is switched off for your account. Ask your agency admin to turn
   on Private Integrations (it is under Labs in the agency settings), or to create the token for you.
4. Click **Create new Integration**.
5. Name it `Stat Tracker` and give it a description such as `Weekly ad stat tracker`. Click
   **Next**.
6. Tick these permissions. Type each name below into the search box on the permissions screen and
   tick it (the screen may show a friendlier label next to it, such as "View Contacts"):
   - `forms.readonly`
   - `surveys.readonly`
   - `contacts.readonly`
   - `calendars.readonly`
   - `calendars.write`
   - `calendars/events.readonly`
   - `locations.readonly`
   - `locations/customFields.readonly`
   - `locations/customFields.write`
   - `locations/tags.readonly`
   - `funnels/funnel.readonly`
   - `users.readonly`
7. Click **Create**.
8. Copy the token that appears. **It is only shown once.** Paste it straight into Claude Code
   when it asks for the token (see the install steps). If you lose it, delete the integration and
   create a new one.

Never paste the token into a chat message, an email or a document. It only goes into the Claude
Code plugin prompt, which stores it in your computer's secure credential store.

## Changing the token later

In Claude Code, type `/plugin`, open the **Installed** tab, select **ghl-meta-ads-tracker**, choose
**Configure**, and paste the new token. Then type `/reload-plugins`.
