# Build 1 UI Notes

The 3D geography must remain stable across analysis modes.

- **Normal:** selected activity plus immediate links only.
- **Critical:** fade non-critical activities; show critical dependency chain.
- **Drivers:** requires a selected activity; fade unrelated activities; show only dependencies that control the target's CPM early start.
- Selecting a new activity while Drivers mode is active recalculates the driver chain for the new target.
- Clearing selection while Drivers mode is active returns to Normal mode.
- Analysis color is reserved for meaning; do not recolor the entire world.
- Float appears numerically in the inspector in Build 1. Spatial float envelopes are deferred.
