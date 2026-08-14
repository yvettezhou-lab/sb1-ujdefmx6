# Carina Engineering Rules

- Carina is a personal local-first expense tracker.
- React + TypeScript + Vite + Dexie/IndexedDB + PWA.
- Quick Entry is the primary daily interaction.
- UI does not own persistence logic.
- Database access stays in database/services.
- Learning is isolated from transaction creation.
- Do not add fields without a product reason.
- No unrelated refactoring.
- `/quick-entry` is a first-class deep link for iOS Shortcuts / Action Button.
- User can manually override learned suggestions.
