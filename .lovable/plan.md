ns

# Fix CO2 table: warn when decrease step exceeds breath time

## Bug
In the CO2 table config, the breath time per round is computed as:
`Math.max(15, startBreathSeconds - i * decreaseStep)`

With `startBreathSeconds=45`, `decreaseStep=30`, `rounds=5`:
- Round 1: 45s
- Round 2: 15s (would be 15, clamped — OK)
- Round 3: 15s (would be -15, clamped)
- Round 4: 15s (clamped)
- Round 5: 15s (clamped)

So from round 3 onward, breath time is "stuck" at the 15s floor — the user's intended progression is silently broken and the table effectively doesn't honor the configuration.

## Fix

In `src/components/training/Co2TableConfig.tsx`:

1. **Detect the invalid configuration** — compute the last round whose natural (non-clamped) breath time is still ≥ 15s:
   `maxValidRounds = Math.floor((startBreathSeconds - 15) / decreaseStep) + 1`
   If `config.rounds > maxValidRounds`, the configuration produces clamped (meaningless) rounds.

2. **Show an inline warning banner** above the preview table (using the existing `Alert` component or a styled `card-session` with warning colors) when the condition is true. Message (IT / EN via `t()`):
   - IT: "Configurazione non valida: con un decremento di {decreaseStep}s a partire da {startBreath}s, solo i primi {N} cicli sono completi. I cicli successivi restano fissi al minimo (15s)."
   - EN: "Invalid setup: with a {decreaseStep}s decrease from {startBreath}s, only the first {N} rounds are complete. The remaining rounds stay at the minimum (15s)."

3. **Disable the "Start training" button** while the warning is active, to prevent starting a broken session. (The bookmark/save button stays enabled so users can still save partial work.)

   Alternatively, keep Start enabled but require confirmation. Recommend disabling — it's clearer and matches the user's request that the setup "doesn't make sense".

4. **Skip the warning when the user has manually edited the table** (`customRows !== null`) — in that case the user has explicit control and the auto-decrease formula no longer drives the values.

5. Add the two new i18n keys (`co2InvalidConfig` for IT/EN) in `src/lib/i18n.ts`.

## Out of scope
- No change to the timer logic itself.
- No change to the `generateCo2Steps` floor (kept at 15s as a safety net).
- O2 table uses an *increasing* hold time so it does not have the same issue — no changes there.
