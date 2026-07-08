# How to Set Up the Contact Form (EmailJS)

This makes the "Send us a message" form on the website actually deliver emails to the owner's inbox.

## Step 1: Create an EmailJS account
- Go to **emailjs.com** and click **Sign Up**
- The free plan allows **200 emails/month** — more than enough for a local business

## Step 2: Add Gmail as an email service
- In the EmailJS dashboard, click **Email Services** in the sidebar
- Click **Add New Service** and choose **Gmail**
- Click **Connect Account** and sign in with `dennysanitation@gmail.com`
- Name it something like `Dennys Contact`
- Click **Create Service**
- Copy the **Service ID** (looks like `service_abc123`) — you'll need it later

## Step 3: Create an email template
- Click **Email Templates** in the sidebar
- Click **Create New Template**
- Set up the template like this:
  - **Subject:** `New message from {{name}}`
  - **Body:**
    ```
    Name: {{name}}
    Email: {{email}}
    Phone: {{phone}}
    Subject: {{subject}}

    Message:
    {{message}}
    ```
  - **To Email:** `dennysanitation@gmail.com`
- Click **Save**
- Copy the **Template ID** (looks like `template_abc123`)

## Step 4: Get your Public Key
- Click **Account** in the sidebar
- Under **API Keys**, copy the **Public Key** (looks like `abc123XYZ`)

## Step 5: Enter credentials in the admin panel
- Go to **dennys-sanitation.web.app/admin**
- Sign in
- Click the **Settings** tab
- Scroll to **Contact Form (EmailJS)**
- Paste in all three values:
  - **Public Key**
  - **Service ID**
  - **Template ID**
- Click **Save EmailJS Config**

## Step 6: Test it
- Go to the main website and submit a test message through the contact form
- Check the `dennysanitation@gmail.com` inbox — the message should arrive within seconds
