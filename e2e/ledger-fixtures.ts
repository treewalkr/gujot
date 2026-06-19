// Shared constants for the #3 ledger gate specs. Kept in a non-spec module so
// importing it does not register any Playwright tests (an import from a *.spec
// file would pull in its `test()` definitions and run them in every phase).
export const PERSISTED_LABEL = "Persisted lunch";
