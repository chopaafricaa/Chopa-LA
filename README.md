# Chopa landing page

Static site for chopaafrica.com. Plain HTML and CSS with one small script for the application form. No build step and no dependencies.

## Files

- `index.html` is the whole page.
- `images/` holds all photos and screenshots used on the page.
- `og-image.jpg` is the link preview image (1200 x 630) for WhatsApp, Facebook, LinkedIn and X. It must be served at `https://chopaafrica.com/og-image.jpg`.
- `chopa-logo.png` is the square logo, used as the favicon and referenced in the structured data.

## Deploy on Vercel

1. Create a new GitHub repository (for example `chopa-site`) and push this folder to it.
2. In Vercel, choose Add New > Project, import the repository, and keep the defaults (Framework: Other, no build command, output directory = root).
3. In the project's Settings > Domains, add `chopaafrica.com` and `www.chopaafrica.com`.
4. In Porkbun's DNS settings for chopaafrica.com, add the records Vercel shows (usually an A record for the root and a CNAME for `www`). Remove the Porkbun parking records.
5. Open https://chopaafrica.com in a private window to confirm the Chopa page loads, not the Porkbun parking page.

## After going live

- Paste the link into a WhatsApp chat and check the preview card shows the image and title. If an old preview appears, test with `https://chopaafrica.com/?v=2`.
- Add the site to Google Search Console.

## Application form

The form checks that name, phone, restaurant name, location and the confirmation box are filled. It then opens WhatsApp to +233 50 409 3221 with the details already typed in; the "Send it by email instead" link opens an email to chopaafricaa@gmail.com. Nothing is stored on a server. To save applications in a database later, replace the submit handler at the bottom of `index.html` with a POST to your backend.

## Fonts

Headings use Saira ExtraBold Italic from Google Fonts. Body text uses the system font stack.
