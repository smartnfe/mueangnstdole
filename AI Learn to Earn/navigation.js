// Navigation Logic
const pages = [
    'page01.html',
    'page02.html',
    'page03.html',
    'page04.html',
    'page05.html',
    'page06.html',
    'page07.html',
    'page08.html',
    'page09.html',
    'page010.html',
    'page011.html',
    'page012.html',
    'page013.html',
    'page014.html'
];

function getCurrentPageIndex() {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    return pages.indexOf(page);
}

function navigateTo(index) {
    if (index >= 0 && index < pages.length) {
        // Add a simple fade out effect before navigating
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            window.location.href = pages[index];
        }, 300);
    }
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    const currentIndex = getCurrentPageIndex();
    if (e.key === 'ArrowRight' || e.key === ' ') {
        navigateTo(currentIndex + 1);
    } else if (e.key === 'ArrowLeft') {
        navigateTo(currentIndex - 1);
    }
});

// UI Navigation Buttons
function createNavButtons() {
    const currentIndex = getCurrentPageIndex();
    
    // Styles
    const style = document.createElement('style');
    style.textContent = `
        .nav-btn {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            font-size: 20px;
            transition: all 0.3s ease;
            z-index: 9999;
            opacity: 0;
        }
        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }
        body:hover .nav-btn {
            opacity: 1;
        }
        .nav-prev { left: 20px; }
        .nav-next { right: 20px; }
    `;
    document.head.appendChild(style);

    // Prev Button
    if (currentIndex > 0) {
        const prevBtn = document.createElement('div');
        prevBtn.className = 'nav-btn nav-prev';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.onclick = () => navigateTo(currentIndex - 1);
        document.body.appendChild(prevBtn);
    }

    // Next Button
    if (currentIndex < pages.length - 1) {
        const nextBtn = document.createElement('div');
        nextBtn.className = 'nav-btn nav-next';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.onclick = () => navigateTo(currentIndex + 1);
        document.body.appendChild(nextBtn);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Fade in effect
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });
    
    createNavButtons();
});
