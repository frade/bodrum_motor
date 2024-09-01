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
    for (let i = 1000; i <= 1002; i++) {
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
        console.log('Received chat history:', history); // Debug log
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = ''; // Clear existing messages
        history.forEach(entry => {
            if (!entry.id) {
                console.error('Entry has no id:', entry);
            }
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
            <button class="vote-btn up" data-id="${entry.id || ''}">👍 ${entry.upvotes || 0}</button>
            <button class="vote-btn down" data-id="${entry.id || ''}">👎 ${entry.downvotes || 0}</button>
        </div>
    `;
    
    const upButton = messageElement.querySelector('.vote-btn.up');
    const downButton = messageElement.querySelector('.vote-btn.down');
    
    if (entry.id) {
        upButton.addEventListener('click', () => vote(entry.id, 'up'));
        downButton.addEventListener('click', () => vote(entry.id, 'down'));
        
        if (userVotes[entry.id] === 'up') {
            upButton.classList.add('active');
        } else if (userVotes[entry.id] === 'down') {
            downButton.classList.add('active');
        }
    } else {
        console.error('Entry has no id:', entry);
        upButton.disabled = true;
        downButton.disabled = true;
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function vote(id, type) {
    try {
        console.log(`Voting ${type} for message ${id}`); // Debug log
        if (id === null || id === undefined) {
            console.error('Invalid id:', id);
            return;
        }
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: Number(id), type, previousVote: userVotes[id] }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Vote result:', result); // Debug log

        if (userVotes[id] === type) {
            delete userVotes[id];
        } else {
            userVotes[id] = type;
        }
        localStorage.setItem('userVotes', JSON.stringify(userVotes));

        // Update the vote counts in the UI
        const messageElement = document.querySelector(`.message:has(button[data-id="${id}"])`);
        if (messageElement) {
            const upButton = messageElement.querySelector('.vote-btn.up');
            const downButton = messageElement.querySelector('.vote-btn.down');
            
            upButton.textContent = `👍 ${result.upvotes}`;
            downButton.textContent = `👎 ${result.downvotes}`;
            
            upButton.classList.toggle('active', userVotes[id] === 'up');
            downButton.classList.toggle('active', userVotes[id] === 'down');
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