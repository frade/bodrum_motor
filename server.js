const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const AI_API_KEY = process.env.AI_API_KEY; // Store your API key in an environment variable

app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
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
            },
        });

        res.json({ response: response.data.content[0].text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});