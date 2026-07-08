I was wrong to rely on the old `sent` rows. For this recovery we should treat all signup verification emails before the domain fix as unreliable, regardless of status.

## Plan

1. **Define the affected window**
   - Use the timestamp when `notify.apneamate.com` became verified / fixed as the cutoff.
   - Consider signup verification emails before that cutoff as potentially not delivered.

2. **Identify affected accounts**
   - Find users who:
     - signed up before the cutoff,
     - still have an unconfirmed email address,
     - are not suppressed/blocked from receiving email,
     - match signup/verification activity in the email logs where available.
   - Include your test addresses like `detogni.riccardo+test1` and `detogni.riccardo+test2` in the check.

3. **Re-trigger fresh verification emails**
   - Send new signup confirmation emails through the now-working `notify.apneamate.com` setup.
   - Do not replay old queue entries, because old auth links may be expired and old `sent` status is not trustworthy.

4. **Validate the recovery**
   - Confirm new verification emails were logged after the fix timestamp.
   - Confirm there are no new failed/dead-letter/suppressed rows for those recipients.
   - Ask you to confirm actual inbox receipt for at least the test addresses.

5. **Optional app improvement**
   - Add a visible “Resend verification email” action on the login screen so affected users can self-recover without manual intervention.

## Technical notes

- The safe resend mechanism is a fresh auth confirmation resend, not a replay of historical email records.
- I will ignore pre-fix `sent` status when selecting who needs recovery.
- I will keep this limited to unconfirmed signup verification emails, not old join-request notifications.