DUCKETT OPS HUB (live version)

What this is
One app for you and Brandon. The Permits and Licenses page and the expiration countdown on the Home page read the same live data, so a permit added on one phone shows on the other within about a minute.

Viewing never needs a passphrase. Editing needs the one shared passphrase you create on first use.

HOW TO DEPLOY (same GitHub method as your door codes app)

1. Unzip this file. Open the unzipped folder. Directly inside you should see: netlify.toml, package.json, a folder named public, and a folder named netlify.
2. On GitHub, create a new PRIVATE repository named duckett-hub.
3. On the repository page choose Add file, then Upload files. Open the unzipped folder, select EVERYTHING inside it, and drag it in. Do not drag the outer folder itself. Commit.
4. Check the top level of the repository. You must see netlify.toml, package.json, public and netlify right there. If you see a single folder instead, the files went in one level too deep. In that case set Base directory in Netlify to that folder name, the same fix you used for door codes.
5. In Netlify choose Add new site, then Import an existing project, then GitHub, and pick duckett-hub. Leave every setting as is. Leave the build command blank. Click Deploy.
6. When it finishes, rename the site under Site configuration to something nobody would guess.
7. Open the site. Tap Permits and Licenses, then Set up editing. Create your shared passphrase (8 or more characters). Your current licenses and permits load in automatically. Do this before you share the link.
8. Text Brandon the link and the passphrase. On each phone remove the old Duckett icon and use Add to Home Screen on the new address.

CHANGING THINGS LATER
Permits, licenses, and registrations: change them inside the app. No redeploy.
The tool list, pricing, or bin day data: send the change to Claude and upload the updated public/index.html to GitHub. Netlify redeploys on its own.
Your saved permit data lives on Netlify, not in these files, so a redeploy never erases it.

NOTES
The data is stored on Netlify. Licenses and permits are public records in Baltimore, which is why viewing does not ask for a passphrase. Editing and changing the passphrase always do.
If you open the hub with no connection, it shows the last list saved on that phone and turns editing off until it reconnects.
