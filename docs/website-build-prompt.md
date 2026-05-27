# Food Truck Finder Website Prompt

Use this prompt with an AI coding assistant if you want to rebuild or extend the public GitHub Pages website.

## Prompt

Create a polished, conversion-focused marketing website for `Food Truck Finder` inside this GitHub Pages repo.

Important context:

- This is a static GitHub Pages site, so use plain `HTML`, `CSS`, and lightweight `JavaScript`.
- Do not use a build step, framework, or package manager.
- The site must feel premium, intentional, and mobile-friendly.
- The product serves `three audiences`: `foodies`, `food truck owners`, and `event organizers`.
- The visual direction should feel warm, energetic, and local-food-driven:
  - Use a warm cream background with strong orange accents and a cool teal secondary accent.
  - Avoid generic template design.
  - Use expressive typography, strong spacing, large headlines, and layered screenshot layouts.
- Keep legal/support links visible:
  - `privacy-policy/index.html`
  - `delete-account.html`
  - support email: `Foodtruckfinderinfo@gmail.com`
- App download links:
  - App Store: `https://apps.apple.com/us/app/ftf-food-truck-finder/id6742719545`
  - Google Play: `https://play.google.com/store/apps/details?id=com.innoryzen.foodtruckfinder`

Assets already available in this repo:

- Hero and foodie assets:
  - `assets/media/foodies/explore-live-simulator.png`
  - `assets/media/foodies/explore-screen.png`
  - `assets/media/foodies/home-feed.png`
  - `assets/media/foodies/home-live-simulator.png`
- Owner assets:
  - `assets/media/owners/owner-dashboard.png`
  - `assets/media/owners/owner-schedule-explained.png`
  - `assets/media/owners/owner-menu-explained.png`
  - `assets/media/owners/edit-truck-fields.png`
  - `assets/media/owners/owner-overview-explained.png`
- Organizer assets:
  - `assets/media/organizers/discovery-map.png`
  - `assets/media/organizers/invites-explained.png`
  - `assets/media/organizers/role-signup.png`
- Video slot:
  - `assets/media/video/ftf-demo.mp4`
  - If the file is missing, show a polished placeholder state instead of a broken player.

The homepage should include:

1. A strong hero section
   - Explain the app clearly in one sentence.
   - Make it obvious that the product serves foodies, owners, and organizers.
   - Include download buttons and a contact CTA.
   - Use screenshot layering, not just text.

2. A role overview section
   - Three cards for foodies, owners, and organizers.
   - Each card should explain the problem it solves.

3. A demo section
   - Embed the demo video if it exists.
   - Fallback to a polished placeholder if it does not.
   - Explain what the demo covers.

4. A `Foodies` section
   - Explain the value in practical language.
   - Include a short how-to or step-by-step usage guide.
   - Include screenshots with captions.

5. An `Owners` section
   - Focus on business outcomes:
     - easier discovery
     - clearer location info
     - menus and specials
     - stronger trust
   - Include a short owner onboarding walkthrough.
   - Include screenshots with captions.
   - Mention support email for onboarding or referral code help.

6. An `Organizers` section
   - Explain truck discovery and coordination value clearly.
   - Include a short event-planning workflow.
   - Use available organizer/invite screenshots.
   - If dedicated organizer UI is limited, write the section honestly but confidently.

7. A feature clarity section
   - Summarize the main product promises in plain language.
   - Focus on what users get, not just UI labels.

8. A FAQ section
   - Answer likely questions from all three audiences.

9. A final CTA section
   - Push users to download the app or contact the team.

10. A footer
   - Include privacy policy, delete account, media library, prompt doc, and support email links.

Technical requirements:

- Use semantic HTML.
- Keep JavaScript minimal.
- Make the navigation responsive with a mobile toggle if needed.
- Ensure screenshots scale cleanly on mobile.
- Use CSS variables for theme values.
- Add subtle motion only where it improves the page.
- Avoid giant walls of text.

Voice and messaging:

- Sound direct, useful, and credible.
- Avoid startup fluff.
- Avoid vague claims like "revolutionary" or "game-changing."
- Make the app feel practical and worth trying right now.

Extra requirement:

- Keep the site easy to maintain by centralizing styles in one stylesheet and minimal behavior in one script.
