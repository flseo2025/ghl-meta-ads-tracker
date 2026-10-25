# Verifying a week after writing it

Typing is where errors enter, so the check is reading back what was written. Re-reading the source
does not catch a typing error.

1. **Read every written cell back** with Google Sheets `get_values`, a different route from the
   write calls. Compare each input cell with the ledger.
2. **Re-read spend and page views from the screenshots** and compare with what was entered.
3. **Recompute every formula column by hand** from that row's own inputs and compare with the value
   the sheet shows.
4. **Reconcile booked calls against the calendar** list from step 4 of the procedure, which is an
   independent source from the form submissions.
5. **Opt-ins: per-ad plus no-UTM equals the funnel total**, or the gap is explained in the note.

If any check fails, fix the cell, then report to the member exactly what changed: the cell, the old
value and the new value.

On a backfill, also re-pull one whole week from the API from scratch at the end and compare it
with what was written, rather than trusting the earlier notes.
