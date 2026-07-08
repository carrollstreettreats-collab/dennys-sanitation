# How to Connect GoDaddy Domain to Firebase Hosting

This makes the customer's existing domain (e.g., dennyssanitation.com) point to the new Firebase-hosted website.

## Step 1: Open Firebase Hosting settings
- Go to **console.firebase.google.com**
- Select the **dennys-sanitation** project
- Click **Hosting** in the left sidebar
- Click **Add custom domain**

## Step 2: Enter the domain
- Type in the domain name (e.g., `dennyssanitation.com`)
- Click **Continue**
- Firebase will give you a **TXT record** for verification — copy it
- **Also add `www.dennyssanitation.com`** as a second custom domain (repeat this process)

## Step 3: Add the TXT record in GoDaddy
- Log in to **godaddy.com**
- Go to **My Products** > find the domain > click **DNS** (or **Manage DNS**)
- Click **Add Record**
  - **Type:** TXT
  - **Name:** `@`
  - **Value:** paste the verification string Firebase gave you
  - **TTL:** leave default
- Click **Save**
- Go back to Firebase and click **Verify** (may take a few minutes)

## Step 4: Update the A records in GoDaddy
- After verification, Firebase will show you **two A records** (IP addresses)
- Back in GoDaddy DNS, **delete the existing A record** that points to the old website
- Add **two new A records:**
  - **Type:** A | **Name:** `@` | **Value:** first IP address from Firebase
  - **Type:** A | **Name:** `@` | **Value:** second IP address from Firebase
- For `www`, add a **CNAME record:**
  - **Type:** CNAME | **Name:** `www` | **Value:** `dennys-sanitation.web.app`
- Click **Save**

## Step 5: Wait for SSL
- Firebase automatically provisions a free **SSL certificate** (https)
- This can take **a few minutes to 24 hours**
- The Firebase console will show the status — once it says **Connected**, you're live

## Step 6: Update website references
- Once the domain is working, all references in the code need to be updated (canonical URLs, Open Graph tags, sitemap, etc.) from `dennys-sanitation.web.app` to the custom domain
- This is a quick code change — just let Claude handle it

## Important notes
- **Don't cancel the GoDaddy domain registration** — you still need GoDaddy to own the domain name. You're just pointing it to Firebase instead of the old host.
- If the old website is hosted somewhere else (not GoDaddy), you can cancel that old hosting plan after the DNS switch is complete and verified working.
