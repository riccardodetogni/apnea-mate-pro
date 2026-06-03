The 'Vicino a te' (near you) filter currently defaults to 200 km, which is too wide. Change it to 100 km.

Changes needed:
1. Update `DEFAULT_RADIUS_KM` in `src/hooks/useCommunityContext.ts` from `200` to `100`.
2. Update project memory `mem://features/community-sorting-and-radius` to reflect the new 100 km default.