let allComments = '';
let chatHistory = [];

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

function loadChatHistory() {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
        chatHistory = JSON.parse(storedHistory);
        chatHistory.forEach(message => displayMessage(message.sender, message.content));
    }
}

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

async function sendMessage(message) {
    displayMessage('You', message);
    chatHistory.push({ sender: 'You', content: message });
    saveChatHistory();
    
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
        chatHistory.push({ sender: 'AI', content: data.response });
        saveChatHistory();
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = 'Sorry, I encountered an error while processing your request.';
        displayMessage('AI', errorMessage);
        chatHistory.push({ sender: 'AI', content: errorMessage });
        saveChatHistory();
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

function clearChat() {
    chatHistory = [];
    localStorage.removeItem('chatHistory');
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
}

document.getElementById('clear-chat-btn').addEventListener('click', clearChat);

window.addEventListener('load', () => {
    loadAllComments();
    loadChatHistory();
});