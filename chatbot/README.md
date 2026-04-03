# AI-Powered Chatbot System

A complete, production-ready chatbot system with a beautiful interface and intelligent responses using OpenAI GPT, DeepSeek, or Anthropic Claude.

## Project Structure

```
chatbot/
├── frontend/
│   └── index.html          # Complete frontend (HTML + CSS + JS)
├── backend/
│   ├── server.js           # Node.js/Express backend
│   ├── package.json        # Node dependencies
│   └── .env.example        # Environment variables template
└── README.md               # Setup instructions
```

## Quick Start

### Backend Setup (Node.js)

```bash
# Navigate to backend folder
cd chatbot/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your API key
# For OpenAI: OPENAIAPIKEY=sk-your-key
# For DeepSeek: AIPROVIDER=deepseek and DEEPSEEKAPIKEY=your-key
# For Claude: ANTHROPICAPIKEY=sk-ant-your-key

# Start the server
npm start
```

### Frontend Testing

Open `chatbot/frontend/index.html` directly in your browser, or serve it:

```bash
# Using Python
cd chatbot/frontend
python -m http.server 8080

# Using Node.js
npx serve chatbot/frontend
```

Then visit http://localhost:8080.

## Configuration

DeepSeek notes:

- DeepSeek exposes an OpenAI-compatible API.
- Official docs list `https://api.deepseek.com` as the base URL.
- Official model IDs include `deepseek-chat` and `deepseek-reasoner`.
- If the shared chat specified a different model, set it via `DEEPSEEK_MODEL` in `chatbot/backend/.env`.

Update the CONFIG object in the JavaScript to customize:

```javascript
const CONFIG = {
    // Your backend URL
    apiUrl: 'https://your-api.com/chat',
    
    // Messages to keep for context
    maxHistoryLength: 10,
    
    // Typing indicator delay
    typingDelay: 500,
    
    // Enable emojis
    enableEmoji: true
};
```

## Embedding on Your Website

### Option 1: Direct Embed

Copy the entire `<div class="chat-container">...</div>` section and the `<style>` and `<script>` tags into your website's HTML, just before the closing `</body>` tag.

### Option 2: External Files

- `chatbot.css` — Extract the CSS into a separate file.
- `chatbot.js` — Extract the JavaScript into a separate file.

Then in your HTML:

```html
<!-- Add to <head> -->
<link rel="stylesheet" href="/path/to/chatbot.css">

<!-- Add before </body> -->
<div class="chat-container" id="chatContainer">
    <!-- Chat widget HTML here -->
</div>
<script src="/path/to/chatbot.js"></script>
```

### Option 3: iframe Embed

Host the chatbot on a subdomain and embed via iframe:

```html
<iframe 
    src="https://chat.yoursite.com" 
    style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; z-index: 9999;"
></iframe>
```

## Production Deployment

### Backend Deployment Options

| Platform | Command/Notes |
|----------|---------------|
| Heroku | `heroku create && git push heroku main` |
| Railway | Connect GitHub repo, auto-deploys |
| Render | Free tier available, easy setup |
| Vercel | Create `api/chat.js` as serverless function |
| AWS Lambda | Use with API Gateway |
| DigitalOcean | App Platform or Droplet |

## Security Checklist

- [ ] Restrict CORS origins to your domain only
- [ ] Add rate limiting (e.g., `express-rate-limit`)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Add input sanitization
- [ ] Monitor API usage and costs

This system is ready to use. Start the backend, open the frontend, and you'll have a working AI chatbot. Let me know if you need help with deployment or customization!
