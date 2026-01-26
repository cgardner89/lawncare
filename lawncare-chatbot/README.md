# 🌱 Lawncare Chatbot

A beautiful, cost-effective lawncare assistant chatbot powered by Claude AI (Haiku model).

## Features

- ✅ Clean, mobile-friendly chat interface
- ✅ Powered by Claude Haiku (extremely affordable - ~$0.25 per million input tokens)
- ✅ Conversation memory (maintains context)
- ✅ Easy to deploy (works on free hosting)
- ✅ No backend server needed

## Cost Estimate

Using Claude Haiku model:
- **Input**: ~$0.25 per million tokens
- **Output**: ~$1.25 per million tokens
- **Real cost example**: 1,000 conversations (~500 messages each) = approximately $2-5

This is **dramatically cheaper** than ChatGPT API which costs about 10-20x more!

## Setup Instructions

### Step 1: Get Your API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up for an account (you get $5 free credit to start)
3. Go to "API Keys" in your dashboard
4. Click "Create Key" and copy your API key

### Step 2: Configure the Chatbot

1. Open `chat.js` in a text editor
2. Find this line near the top:
   ```javascript
   const API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
   ```
3. Replace `YOUR_ANTHROPIC_API_KEY_HERE` with your actual API key:
   ```javascript
   const API_KEY = 'sk-ant-api03-your-actual-key-here';
   ```
4. Save the file

### Step 3: Test Locally

1. Simply open `index.html` in your web browser
2. You should see the chat interface
3. Try asking a lawncare question!

### Step 4: Deploy Online (FREE)

#### Option A: Netlify (Recommended - Easiest)

1. Go to [netlify.com](https://www.netlify.com/) and sign up (free)
2. Drag and drop your entire `lawncare-chatbot` folder onto their deployment area
3. Your site will be live in seconds at a URL like: `your-site-name.netlify.app`
4. (Optional) You can add a custom domain in settings

#### Option B: Vercel

1. Go to [vercel.com](https://vercel.com/) and sign up (free)
2. Click "New Project"
3. Upload your folder or connect to GitHub
4. Deploy!

#### Option C: GitHub Pages

1. Create a GitHub account if you don't have one
2. Create a new repository
3. Upload these files
4. Go to Settings > Pages
5. Enable GitHub Pages
6. Your site will be at: `username.github.io/repository-name`

## Security Note

**IMPORTANT**: Since your API key is in the JavaScript file, it will be visible to anyone who looks at your website's code. To protect yourself:

1. Set spending limits in your Anthropic account dashboard
2. Monitor your usage regularly
3. Consider implementing a simple backend proxy if you expect high traffic

For a production app with lots of users, you'd want to move the API key to a backend server. I can help you with that if needed.

## Customization

### Change the System Prompt

In `chat.js`, find the `SYSTEM_PROMPT` variable and modify it to change how the assistant behaves:

```javascript
const SYSTEM_PROMPT = `You are a helpful and knowledgeable lawncare assistant...`;
```

### Change the Colors/Design

Edit the CSS in `index.html` to customize colors, fonts, layout, etc.

### Add More Models

To use a different Claude model, change this line in `chat.js`:

```javascript
model: 'claude-haiku-4-5-20251001',  // This is Haiku (cheapest)
```

Other options:
- `claude-sonnet-4-5-20250929` (more capable, ~10x more expensive)
- `claude-opus-4-5-20251101` (most capable, ~30x more expensive)

## Troubleshooting

**"Please configure your API key" error**
- Make sure you've replaced `YOUR_ANTHROPIC_API_KEY_HERE` with your actual API key

**"API Error: 401" message**
- Your API key is invalid or expired - get a new one from console.anthropic.com

**Chatbot not responding**
- Check your browser's console (F12) for error messages
- Make sure you have internet connection
- Verify your API key is correct

**Slow responses**
- This is normal - Haiku typically responds in 2-5 seconds
- If it's taking longer, check your internet connection

## Next Steps

Want to enhance this further? Here are some ideas:

1. **Add a backend**: Move API key to a secure server (I can help with this)
2. **Add rate limiting**: Prevent abuse if sharing publicly
3. **Add authentication**: Only allow certain users to access
4. **Custom domain**: Use your own domain name
5. **Analytics**: Track how many people use it
6. **Multi-language**: Support other languages

Let me know if you need help with any of these!

## Support

If you run into any issues or want to customize this further, just ask!

## License

Free to use and modify however you'd like!
