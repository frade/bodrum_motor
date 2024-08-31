let allComments = '';

async function loadAllComments() {
    for (let i = 1; i <= totalPages; i++) {
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
    } catch (error) {
        console.error('Error:', error);
        displayMessage('AI', 'Sorry, I encountered an error while processing your request.');
    }
}

function displayMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<span>${sender}:</span> `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add typing effect
    if (sender === 'AI') {
        const letters = message.split('');
        letters.forEach((letter, index) => {
            setTimeout(() => {
                messageElement.innerHTML += letter;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, index * 20);
        });
    } else {
        messageElement.innerHTML += message;
    }
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
        event.preventDefault(); // Prevent default form submission
        handleSendMessage();
    }
});

window.addEventListener('load', loadAllComments);

function toggleChatWindow() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.toggle('chat-minimized');
    const chatHeader = document.getElementById('chat-header');
    chatHeader.textContent = chatContainer.classList.contains('chat-minimized') ? 'Open Chat' : 'Chat with AI';
}

document.getElementById('chat-header').addEventListener('click', toggleChatWindow);