# Architecture rules
- Keep the login entry presentation in a shared LoginEntryPage with audience variants so patient, professional, and legacy sign-in views preserve the same forms and appearance.
- /pro is a layout with a public index entry; authenticate only its workspace children and send successful professional sign-in to /connect to preserve the existing destination.
- Use the Button plain variant when preserving pre-existing custom control styling without adding default button backgrounds.