# Tag your ad links so the tracker can split results by ad set

The tracker knows which ad set produced an opt-in by reading tags on the link the person clicked.
Meta adds those tags for you once you set them up on each ad.

## In Meta Ads Manager, for each ad

1. Open the ad (Ads tab, click the ad name, **Edit**).
2. Scroll to **Tracking**, find **URL parameters**, and click **Build a URL parameter** (or paste
   straight into the box).
3. Paste exactly:

   ```
   utm_source={{campaign.name}}&utm_medium={{adset.name}}&utm_campaign={{ad.name}}&utm_content={{placement}}
   ```

4. Click **Publish**.

Do this for every ad that sends traffic to your funnel. New results carry the tags from then on;
results from before the change cannot be split by ad set.

## In GoHighLevel (optional, for seeing it on contacts)

If setup created the four fields **Campaign Name**, **Ad Set**, **Ad Name** and **Ad Placement**,
you can make your opt-in form fill them:

1. **Sites > Forms > Builder**, open your opt-in form.
2. Add each of the four fields as a **hidden field**.
3. For each one, set its **query key** to the matching tag: Campaign Name `utm_source`, Ad Set
   `utm_medium`, Ad Name `utm_campaign`, Ad Placement `utm_content`.
4. Save the form.

The tracker does not need these fields. It reads the tags straight from the form submissions.
