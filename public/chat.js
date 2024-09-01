let allComments = '';
let userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');

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
            displayMessage(entry);
        });
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }
}

async function sendMessage(message) {
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
        
        // Reload chat history to show the new message in context
        await loadChatHistory();
    } catch (error) {
        console.error('Error:', error);
        alert('Sorry, I encountered an error while processing your request.');
    }
}

function displayMessage(entry) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <p><strong>You:</strong> ${entry.user}</p>
        <p><strong>AI:</strong> ${entry.ai}</p>
        <div class="voting">
            <button onclick="vote(${entry.id}, 'up')" class="vote-btn up ${userVotes[entry.id] === 'up' ? 'active' : ''}">👍 ${entry.upvotes}</button>
            <button onclick="vote(${entry.id}, 'down')" class="vote-btn down ${userVotes[entry.id] === 'down' ? 'active' : ''}">👎 ${entry.downvotes}</button>
        </div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function vote(id, type) {
    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, type, previousVote: userVotes[id] }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (userVotes[id] === type) {
            delete userVotes[id];
        } else {
            userVotes[id] = type;
        }
        localStorage.setItem('userVotes', JSON.stringify(userVotes));

        // Update the vote count in the UI
        const voteButton = document.querySelector(`.message:has(button[onclick="vote(${id}, '${type}')"])`);
        if (voteButton) {
            const countElement = voteButton.querySelector(`.vote-btn.${type}`);
            if (countElement) {
                countElement.textContent = `${type === 'up' ? '👍' : '👎'} ${result[type + 'votes']}`;
            }
        }

    } catch (error) {
        console.error('Error voting:', error);
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
        event.preventDefault();
        handleSendMessage();
    }
});

window.addEventListener('load', () => {
    loadAllComments();
    loadChatHistory();
});