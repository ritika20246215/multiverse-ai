/*
  AI Chatbot Backend Server
  Supports OpenAI, DeepSeek, and Anthropic Claude APIs
  
  Features:
  - Chat history management (last 10 messages per session)
  - CORS enabled for cross-origin requests
  - Error handling and rate limiting ready
  - Easy switching between AI providers
 */

// ============================================
// IMPORTS AND CONFIGURATION
// ============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Enable CORS for all origins (restrict in production)
app.use(cors({
    origin: '*', // Change to your domain in production
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// Parse JSON request bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// AI PROVIDER CONFIGURATION
// ============================================

const AIPROVIDER = process.env.AI_PROVIDER || process.env.AIPROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAIAPIKEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPICAPIKEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEKAPIKEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// System prompt for the AI
const SYSTEMPROMPT = process.env.SYSTEMPROMPT || `You are a helpful, friendly AI assistant embedded in a website. 
Your role is to:
• Answer questions clearly and concisely
• Be warm and engaging, using occasional emojis 😊
• Provide accurate information
• Ask clarifying questions when needed
• Keep responses focused and not too long

Remember: You're chatting in a small widget, so keep responses readable.`;

// ============================================
// OPENAI INTEGRATION
// ============================================

let openai = null;
let deepseek = null;

if (AIPROVIDER === 'openai' && OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({
        apiKey: OPENAI_API_KEY
    });
    console.log('✅ OpenAI client initialized');
}

if (AIPROVIDER === 'deepseek' && DEEPSEEK_API_KEY) {
    const OpenAI = require('openai');
    deepseek = new OpenAI({
        apiKey: DEEPSEEK_API_KEY,
        baseURL: DEEPSEEK_BASE_URL
    });
    console.log('DeepSeek client initialized');
}

/*
  Generate response using OpenAI GPT
  @param {string} userMessage - Current user message
  @param {Array} history - Previous messages for context
  @returns {Promise<string>} AI response
 */
async function getOpenAIResponse(userMessage, history = []) {
    // Build messages array with system prompt and history
    const messages = [
        { role: 'system', content: SYSTEMPROMPT },
        ...history.slice(-10), // Keep last 10 messages
        { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7, // Balance creativity and consistency
    });

    return completion.choices[0].message.content;
}

/*
  Generate response using DeepSeek
  @param {string} userMessage - Current user message
  @param {Array} history - Previous messages for context
  @returns {Promise<string>} AI response
 */
async function getDeepSeekResponse(userMessage, history = []) {
    const messages = [
        { role: 'system', content: SYSTEMPROMPT },
        ...history.slice(-10),
        { role: 'user', content: userMessage }
    ];

    const requestBody = {
        model: DEEPSEEK_MODEL,
        messages: messages,
        max_tokens: 500
    };

    if (DEEPSEEK_MODEL !== 'deepseek-reasoner') {
        requestBody.temperature = 0.7;
    }

    const completion = await deepseek.chat.completions.create(requestBody);

    return completion.choices[0].message.content;
}

// ============================================
// CLAUDE/ANTHROPIC INTEGRATION
// ============================================

let anthropic = null;

if (AIPROVIDER === 'claude' && ANTHROPIC_API_KEY) {
    const Anthropic = require('@anthropic-ai/sdk');
    anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });
    console.log('✅ Anthropic Claude client initialized');
}

/*
  Generate response using Anthropic Claude
  @param {string} userMessage - Current user message
  @param {Array} history - Previous messages for context
  @returns {Promise<string>} AI response
 */
async function getClaudeResponse(userMessage, history = []) {
    // Build messages array (Claude format)
    const messages = [
        ...history.slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        })),
        { role: 'user', content: userMessage }
    ];

    const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        system: SYSTEMPROMPT,
        messages: messages
    });

    return response.content[0].text;
}

// ============================================
// FALLBACK RESPONSE (No API configured)
// ============================================

/*
  Simple fallback responses when no AI API is configured
  Useful for testing the frontend without API keys
 */
function getFallbackResponse(userMessage) {
    const responses = [
        "I'm a demo bot! To get real AI responses, please configure your OpenAI or Claude API key. 🔑",
        "This is a test response. Connect me to an AI API for intelligent conversations! 🤖",
        `You said: "${userMessage}" - I'm just echoing because no AI API is configured yet.`,
        "Hello! I'm running in demo mode. Add your API key to .env to unlock my full potential! ✨"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// ============================================
// API ROUTES
// ============================================

/*
  Health check endpoint
  GET /
 */
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'AI Chatbot API is running',
        provider: AIPROVIDER,
        configured:
            AIPROVIDER === 'openai'
                ? !!openai
                : AIPROVIDER === 'deepseek'
                    ? !!deepseek
                    : !!anthropic
    });
});

/*
  Main chat endpoint
  POST /chat
  
  Request body:
  {
    "message": "User's message",
    "history": [
      { "role": "user", "content": "Previous user message" },
      { "role": "assistant", "content": "Previous bot response" }
    ]
  }
  
  Response:
  {
    "reply": "AI response text",
    "success": true
  }
 */
app.post('/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // Validate input
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Invalid request: message is required',
                success: false
            });
        }

        // Trim and limit message length
        const userMessage = message.trim().slice(0, 2000);

        if (!userMessage) {
            return res.status(400).json({
                error: 'Message cannot be empty',
                success: false
            });
        }

        console.log(`📨 Received message: "${userMessage.slice(0, 50)}..."`);

        let reply;

        // Route to appropriate AI provider
        if (AIPROVIDER === 'openai' && openai) {
            reply = await getOpenAIResponse(userMessage, history);
        } else if (AIPROVIDER === 'deepseek' && deepseek) {
            reply = await getDeepSeekResponse(userMessage, history);
        } else if (AIPROVIDER === 'claude' && anthropic) {
            reply = await getClaudeResponse(userMessage, history);
        } else {
            // Fallback for testing without API
            reply = getFallbackResponse(userMessage);
        }

        console.log(`✅ Generated response: "${reply.slice(0, 50)}..."`);

        res.json({
            reply: reply,
            success: true
        });

    } catch (error) {
        console.error('❌ Error processing chat:', error);

        // Handle specific API errors
        if (error.code === 'insufficientquota') {
            return res.status(429).json({
                error: 'API quota exceeded. Please check your billing.',
                reply: "I'm temporarily unavailable due to high demand. Please try again later! 😔",
                success: false
            });
        }

        if (error.status === 401) {
            return res.status(401).json({
                error: 'Invalid API key',
                reply: "There's a configuration issue. Please contact support. 🔧",
                success: false
            });
        }

        // Generic error response
        res.status(500).json({
            error: 'Internal server error',
            reply: "Sorry, I encountered an error. Please try again! 🙏",
            success: false
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: ['GET /', 'POST /chat']
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Something went wrong',
        success: false
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
🚀 AI Chatbot Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:${PORT}
🤖 Provider: ${AIPROVIDER}
✅ Status: ${
  AIPROVIDER === 'openai'
    ? (openai ? `OpenAI Connected (${OPENAI_MODEL})` : 'OpenAI Not Configured')
    : AIPROVIDER === 'deepseek'
      ? (deepseek ? `DeepSeek Connected (${DEEPSEEK_MODEL})` : 'DeepSeek Not Configured')
      : (anthropic ? `Claude Connected (${CLAUDE_MODEL})` : 'Claude Not Configured')
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});
