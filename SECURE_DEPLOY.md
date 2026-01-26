# Secure Deployment Guide (Recommended for Public Use)

If you plan to share this chatbot publicly and want to keep your API key secure, follow this guide instead of the basic setup.

## Why Use the Secure Version?

The basic version puts your API key in the JavaScript file where anyone can see it. The secure version:
- Hides your API key on the server
- Prevents unauthorized usage
- Is production-ready
- Still completely FREE to host

## Setup Instructions

### Step 1: Get Your API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up for an account (you get $5 free credit)
3. Create an API key
4. **IMPORTANT**: Keep this key private - don't put it in any files

### Step 2: Prepare Your Files

1. In `index.html`, change this line:
   ```html
   <script src="chat.js"></script>
   ```
   To this:
   ```html
   <script src="chat-secure.js"></script>
   ```

2. That's it! Don't edit any other files.

### Step 3: Deploy to Netlify

#### Option A: Drag & Drop (Easiest)

1. Go to [netlify.com](https://www.netlify.com/) and sign up
2. Click "Add new site" → "Deploy manually"
3. Drag your entire `lawncare-chatbot` folder onto the page
4. Wait for deployment to complete

#### Option B: GitHub (Best for Updates)

1. Create a GitHub account if you don't have one
2. Create a new repository
3. Upload all your files to the repository
4. Go to [netlify.com](https://www.netlify.com/) and sign up
5. Click "Add new site" → "Import from Git"
6. Connect your GitHub account and select your repository
7. Deploy!

### Step 4: Add Your API Key as Environment Variable

This is the crucial step that keeps your key secure:

1. In your Netlify dashboard, go to your site
2. Click "Site configuration" → "Environment variables"
3. Click "Add a variable"
4. For the key, enter: `ANTHROPIC_API_KEY`
5. For the value, paste your actual API key (starts with `sk-ant-api03-`)
6. Click "Create variable"
7. Go back to "Deploys" and click "Trigger deploy" → "Clear cache and deploy"

### Step 5: Test It!

1. Open your site URL (something like `your-site-name.netlify.app`)
2. Try asking a lawncare question
3. It should work perfectly!

## Setting Usage Limits (Important!)

To prevent unexpected costs if lots of people use your chatbot:

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Click on your organization/account settings
3. Find "Usage & Billing"
4. Set a monthly spending limit (e.g., $10)
5. Add email notifications for when you reach 50%, 75%, 90% of limit

## Custom Domain (Optional)

Want to use your own domain like `lawncare.yoursite.com`?

1. Buy a domain (from Namecheap, Google Domains, etc.)
2. In Netlify, go to "Domain management"
3. Click "Add custom domain"
4. Follow the instructions to update your domain's DNS

## Monitoring Usage

Keep an eye on your usage:

1. Check Anthropic console for API usage
2. Netlify shows you how many function calls you're getting
3. Both are free for reasonable usage!

## Troubleshooting

**Chatbot shows error when trying to send message**
- Make sure you've added the `ANTHROPIC_API_KEY` environment variable
- Make sure you triggered a new deploy after adding it
- Check that the key starts with `sk-ant-api03-`

**"Function not found" error**
- Make sure the `netlify` folder with the `functions` subfolder was uploaded
- Try triggering a new deploy with "Clear cache"

**Still not working?**
- Check the Netlify function logs (Site overview → Functions → chat → View logs)
- The error message will tell you what's wrong

## Cost Estimate with Secure Backend

The secure version costs the same as the basic version:
- **Netlify hosting**: FREE (up to 125,000 function calls/month)
- **Claude API (Haiku)**: ~$2-5 for 1,000 conversations
- **Total**: Essentially FREE until you get significant traffic

## Next Steps

Your chatbot is now:
- ✅ Secure (API key hidden)
- ✅ Fast (Netlify CDN)
- ✅ Free (both hosting and API are free/cheap)
- ✅ Professional (ready for public use)
- ✅ Custom domain ready

Want to add more features like:
- Usage analytics
- User authentication
- Custom branding
- Additional AI capabilities

Just let me know!
