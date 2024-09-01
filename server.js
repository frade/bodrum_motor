require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = 3000;

// Increase the limit for JSON payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const AI_API_KEY = process.env.AI_API_KEY;
const CHAT_HISTORY_FILE = path.join(__dirname, 'chat_history.json');

if (!AI_API_KEY) {
    console.error('AI_API_KEY is not set in environment variables');
    process.exit(1);
}

async function loadChatHistory() {
    try {
        const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveChatHistory(history) {
    await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(history, null, 2));
}

app.get('/api/chat-history', async (req, res) => {
    const history = await loadChatHistory();
    res.json(history);
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        console.log('Sending request to Anthropic API...');
        console.log('API Key:', AI_API_KEY.substring(0, 5) + '...' + AI_API_KEY.slice(-5));
        
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-opus-20240229",
            max_tokens: 1000,
            system: "You are an AI assistant answering questions about the provided context.",
            messages: [
                { role: "user", content: `Context: ${context}\n\nQuestion: ${message}` }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AI_API_KEY,
                'anthropic-version': '2023-06-01'
            },
        });

        console.log('Received response from Anthropic API');
        const aiResponse = response.data.content[0].text;
        
        // Save to chat history with initial vote counts
        const history = await loadChatHistory();
        const newEntry = {
            id: Date.now(), // Use timestamp as a simple unique ID
            timestamp: new Date().toISOString(),
            user: message,
            ai: aiResponse,
            upvotes: 0,
            downvotes: 0
        };
        history.unshift(newEntry);
        await saveChatHistory(history);

        res.json({ response: aiResponse });
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.post('/api/vote', async (req, res) => {
    try {
        const { id, type, previousVote } = req.body;
        const history = await loadChatHistory();
        const entry = history.find(e => e.id === parseInt(id));
        
        if (entry) {
            if (previousVote === type) {
                // User is un-voting
                if (type === 'up') entry.upvotes = Math.max(0, entry.upvotes - 1);
                if (type === 'down') entry.downvotes = Math.max(0, entry.downvotes - 1);
            } else {
                // User is changing vote or voting for the first time
                if (previousVote) {
                    // Remove previous vote
                    if (previousVote === 'up') entry.upvotes = Math.max(0, entry.upvotes - 1);
                    if (previousVote === 'down') entry.downvotes = Math.max(0, entry.downvotes - 1);
                }
                // Add new vote
                if (type === 'up') entry.upvotes++;
                if (type === 'down') entry.downvotes++;
            }
            
            await saveChatHistory(history);
            res.json({ 
                success: true, 
                upvotes: entry.upvotes, 
                downvotes: entry.downvotes 
            });
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'An error occurred while processing your vote.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
});