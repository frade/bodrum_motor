let currentPage = 1;
const totalPages = 60;

function convertUrlsToLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
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
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
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

window.addEventListener('load', () => {
    loadComment(currentPage);
    document.getElementById('prev-btn').addEventListener('click', prevPage);
    document.getElementById('next-btn').addEventListener('click', nextPage);
});

// Debug information
console.log('Current working directory:', window.location.href);