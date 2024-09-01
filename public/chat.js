let allComments = '';

async function loadAllComments() {
    for (let i = 1; i <= 60; i++) {
        try {
            const response = await fetch(`static/comment${i}.txt`);
            if (response.ok) {
                const text = await response.text();
                allComments += text + '\n\n';
            }
        } catch (error) {
            console.error(`Failed to load comment${i}.txt:`, error);
        }
    }
}

async function loadChatHistory() {
    try {
        const response = await fetch('/api/chat-history');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const history = await response.json();
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = ''; // Clear existing messages
        history.forEach(entry => {
            displayMessage('You', entry.user);
            displayMessage('AI', entry.ai);
        });
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }
}

async function sendMessage(message) {
    displayMessage('You', message);
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, context: allComments }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayMessage('AI', data.response);
        
        // Reload chat history to show the new message in context
        await loadChatHistory();
    } catch (error) {
        console.error('Error:', error);
        displayMessage('AI', 'Sorry, I encountered an error while processing your request.');
    }
}

function displayMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleSendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (message) {
        sendMessage(message);
        userInput.value = '';
    }
}

document.getElementById('send-btn').addEventListener('click', handleSendMessage);

document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSendMessage();
    }
});

window.addEventListener('load', () => {
    loadAllComments();
    loadChatHistory();
});