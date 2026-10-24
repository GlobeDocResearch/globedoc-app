# GlobeDoc App

Recreate the site app.globedoc.com, I have created that site and need to start from scratch since too many bugs. We will create it in steps, don't create anything that we haven't agreed in. Don't make assumptions without asking. It needs to be identical with the site that I have created before. 

1. Use the logo that I paste. Place it exactly like the given image.

2. Login: centered card on light blue background, GlobeDoc logo top center, "Your Deep Health" subtitle, "Welcome back" heading, email field with envelope icon, password field with lock icon and eye toggle, blue Sign in button, "New to GlobeDoc? Create an account" link, Privacy Policy & Terms of Service link at bottom.

Don't create the text inside of privacy policy & terms yet. I will give you all the text after this prompt.

3. Create an account: Update the account creation consent screen (step 2) to match exactly:
Remove the "Product updates & newsletters" checkbox entirely.
Keep these two consent items only:
Item 1 — "Terms of Service & Privacy Policy" with "Required" badge
Text: "I have read and agree to GlobeDoc's Terms of Service and Privacy Policy. I understand how GlobeDoc stores and protects my personal data."
The words "Terms of Service and Privacy Policy" should be a clickable link (placeholder link for now — the actual document will be added later).
Item 2 — "Processing of health data" with "Required" badge (remove any mention of GDPR Article 9 from the title and body text)
Text: "I explicitly consent to GlobeDoc processing my sensitive health data — including medical history, medications, allergies, vaccinations, hereditary information, and lifestyle data — solely to provide the Health Passport service.
I understand that:
• This data is stored encrypted on EU servers (Sweden/Germany)
• GlobeDoc will never sell or share my health data without my consent
• I can withdraw this consent and permanently delete all my data at any time via Settings
• I can request a full data export at any time
• Contact: privacy@globedoc.com"
Keep the blue info box at the top: "Your medical information is classified as sensitive personal data under EU law. GlobeDoc can only process this data with your explicit, separate consent."
Keep the "Create account" button and the footer text: "By creating an account you confirm the consents above. Your consent record is saved with a timestamp. You may withdraw consent at any time in Settings → Privacy & Data."
Both checkboxes must be checked before the Create account button becomes active.
The Swedish translation of all text must also be updated to match.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://globedoc.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b5e5e8e5-3e24-4f41-ac2c-04cca968157b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
