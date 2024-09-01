let currentPage = 1;
const totalPages = 60;

function convertUrlsToLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        if (url.includes('youtu.be') || url.includes('youtube.com')) {
            return createYouTubeEmbed(url);
        }
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

function createYouTubeEmbed(url) {
    let videoId;
    if (url.includes('youtu.be')) {
        videoId = url.split('/').pop();
    } else if (url.includes('youtube.com')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
    }
    if (videoId) {
        return `<div class="video-container"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
    }
    return `<a href="${url}" target="_blank">${url}</a>`;
}

async function loadComment(page) {
    const container = document.getElementById('comment-container');
    container.innerHTML = ''; // Clear previous content
    
    try {
        const response = await fetch(`static/comment${page}.txt`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        const article = document.createElement('article');
        article.className = 'comment';
        
        const title = document.createElement('h2');
        title.textContent = `Комментарий ${page}`;
        article.appendChild(title);
        
        // Check if an image exists for this comment
        const img = document.createElement('img');
        img.src = `static/comment${page}.jpg`;
        img.onerror = () => img.style.display = 'none';
        article.appendChild(img);
        
        const content = document.createElement('div');
        const processedText = convertUrlsToLinks(text);
        content.innerHTML = processedText.replace(/\n/g, '<br>');
        article.appendChild(content);
        
        container.appendChild(article);
        
        // Add this at the end of the function

        // Save the current page to local storage
        localStorage.setItem('lastReadComment', page);
    } catch (error) {
        console.error(`Failed to load comment${page}.txt:`, error);
        container.innerHTML = `
            <p>Failed to load comment ${page}.</p>
            <p>Error details: ${error.message}</p>
            <p>Make sure the file static/comment${page}.txt exists.</p>
        `;
    }
    
    updatePagination();
}

function updatePagination() {
    document.getElementById('page-info').textContent = `${currentPage} / ${totalPages}`;
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage === totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadComment(currentPage);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadComment(currentPage);
    }
}

document.getElementById('prev-btn').addEventListener('click', prevPage);
document.getElementById('next-btn').addEventListener('click', nextPage);

// Load the last read comment or the first comment when the page loads
window.addEventListener('load', () => {
    const lastReadComment = localStorage.getItem('lastReadComment');
    currentPage = lastReadComment ? parseInt(lastReadComment) : 1;
    loadComment(currentPage);
});