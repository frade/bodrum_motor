require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const AI_API_KEY = process.env.AI_API_KEY;

if (!AI_API_KEY) {
    console.error('AI_API_KEY is not set in environment variables');
    process.exit(1);
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        console.log('Sending request to Anthropic API...');
        console.log('API Key:', AI_API_KEY.substring(0, 5) + '...' + AI_API_KEY.slice(-5));
        
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-opus-20240229",
            max_tokens: 1000,
            messages: [
                { role: "system", content: "You are an AI assistant answering questions about the provided context." },
                { role: "user", content: `Context: ${context}\n\nQuestion: ${message}` }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AI_API_KEY,
                'anthropic-version': '2023-06-01' // Add this line
            },
        });

        console.log('Received response from Anthropic API');
        res.json({ response: response.data.content[0].text });
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
});