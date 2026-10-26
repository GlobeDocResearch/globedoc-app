# Footer licence and prototype notice
- [x] Add a muted footer line with AGPL-3.0 and CC BY 4.0 links plus the research-prototype notice.
- [x] Verify the line and both links on the start and sign-in pages.
- [x] Extend the CC BY 4.0 exception to "except photographs and the GlobeDoc name and logo".

# Avatar privacy and file backups
- [x] Make avatars private and preserve signed-in image display using signed URLs.
- [x] Verify anonymous denial and signed-in image loading.
- [ ] Set up regular stored-file backups (blocked: Cloud does not provide automatic storage backups or permit custom service-role file-copy backup code).

# Site icons and header mark
- [x] Replace favicon, apple-touch-icon and icon-512 in public/ and the header logo with the new GlobeDoc symbol, keeping names, sizes and positions.
- [x] Verify icons serve correctly and the header shows the new mark signed in and out.
- [x] Regenerate icon-192 and the maskable icon from the new symbol (globe inside the maskable safe zone on white) and use the full, uncropped globe on the create-account/email-confirmation pages.

# Entry page split

# Optional patient identity
- [x] Add optional profile fields and paired clinician display, protecting saved answers from translation.
- [x] Verify saving, readback, export and limits.

# Logged-in frame styling
- [x] Align patient and professional headers, bottom navigation and general frame styling without changing Health Passport colours or behaviour.
- [x] Verify signed-in pages and controls at desktop and narrow widths.

- [x] Add patient and professional entry pages preserving existing flows and root page.
- [x] Verify entry navigation, password reset view, and visual appearance.
- [x] Apply required package security update and check preview.

# Sign-in presentation fixes
- [x] Correct footer separators and align role chooser content.
- [x] Match professional entry to the patient sign-in card and preserve existing sign-in and pairing flows.
- [x] Verify the updated pages and controls.

# GlobeDoc entry styling
- [x] Match header, typography, colours, cards and footer on chooser and sign-in pages only.
- [x] Add device-specific installation guidance and supported browser install button without caching.
- [x] Verify navigation, password reset, language selection and desktop/mobile presentation.
- [x] Always show both installation instructions with the visitor's device first; remove the other-devices toggle.
- [x] Pairing: access level set by the server, not chosen by the caller (security fix)
