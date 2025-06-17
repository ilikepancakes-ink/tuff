// Enhanced script for ilikepancakes.ink with 2009 vibes
console.log("Welcome to ilikepancakes.ink! >_<");

// Random words that float in the background
const floatingWords = [
    "pancakes", "syrup", "butter", "fluffy", "stack", "breakfast", "yummy", ":3", ">_<", ">~<",
    "web dev", "HTML", "CSS", "JavaScript", "retro", "2009", "nostalgia", "pixels", "gradients",
    "rainbow", "pride", "love", "inclusive", "community", "coding", "creative", "fun", "cozy",
    "aesthetic", "vibes", "chill", "uwu", "owo", "nya", "meow", "purr", "soft", "warm",
    "digital", "internet", "website", "homepage", "blog", "portfolio", "projects", "dreams"
];

// Animation state management
let animationEnabled = true;
let circles = [];
let textElements = [];

// Check for reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animationEnabled = false;
}

// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing 2009-style animations! ✨");

    if (animationEnabled) {
        initializeBackgroundAnimations();
        startFloatingText();
        startBouncingCircles();
    }

    // Show popup after a delay (classic 2009 behavior!)
    setTimeout(() => {
        showPopup();
    }, 3000);

    // Add some retro console messages
    setTimeout(() => {
        console.log("🥞 Did someone say pancakes?");
    }, 2000);

    setTimeout(() => {
        console.log("💜 Thanks for visiting my retro corner of the web!");
    }, 5000);
});

// Create bouncing circles
function startBouncingCircles() {
    const circlesContainer = document.querySelector('.floating-circles');
    if (!circlesContainer) return;

    // Create initial circles
    for (let i = 0; i < 8; i++) {
        createCircle(circlesContainer);
    }

    // Add new circles periodically
    setInterval(() => {
        if (circles.length < 12) {
            createCircle(circlesContainer);
        }
    }, 3000);
}

function createCircle(container) {
    const circle = document.createElement('div');
    circle.className = `circle ${Math.random() > 0.5 ? 'black' : 'white'}`;

    // Random size between 20px and 80px
    const size = Math.random() * 60 + 20;
    circle.style.width = size + 'px';
    circle.style.height = size + 'px';

    // Random starting position
    circle.style.left = Math.random() * (window.innerWidth - size) + 'px';
    circle.style.top = Math.random() * (window.innerHeight - size) + 'px';

    // Random animation delay
    circle.style.animationDelay = Math.random() * 3 + 's';
    circle.style.animationDuration = (Math.random() * 2 + 2) + 's';

    container.appendChild(circle);
    circles.push(circle);

    // Remove circle after some time to prevent memory leaks
    setTimeout(() => {
        if (circle.parentNode) {
            circle.parentNode.removeChild(circle);
            circles = circles.filter(c => c !== circle);
        }
    }, 15000);
}

// Create floating text
function startFloatingText() {
    const textContainer = document.querySelector('.floating-text');
    if (!textContainer) return;

    // Create floating words periodically
    setInterval(() => {
        if (textElements.length < 15) {
            createFloatingWord(textContainer);
        }
    }, 2000);
}

function createFloatingWord(container) {
    const word = document.createElement('div');
    word.className = 'floating-word';
    word.textContent = floatingWords[Math.floor(Math.random() * floatingWords.length)];

    // Random horizontal position
    word.style.left = Math.random() * (window.innerWidth - 100) + 'px';

    // Random animation duration
    word.style.animationDuration = (Math.random() * 4 + 6) + 's';
    word.style.animationDelay = Math.random() * 2 + 's';

    // Random font variations for that 2009 feel
    const fonts = ['Arial', 'Verdana', 'Tahoma', 'Georgia'];
    word.style.fontFamily = fonts[Math.floor(Math.random() * fonts.length)];

    container.appendChild(word);
    textElements.push(word);

    // Remove word after animation completes
    setTimeout(() => {
        if (word.parentNode) {
            word.parentNode.removeChild(word);
            textElements = textElements.filter(t => t !== word);
        }
    }, 10000);
}

// Handle window resize
window.addEventListener('resize', function() {
    // Reposition elements that might be off-screen
    circles.forEach(circle => {
        const rect = circle.getBoundingClientRect();
        if (rect.left > window.innerWidth) {
            circle.style.left = '0px';
        }
        if (rect.top > window.innerHeight) {
            circle.style.top = '0px';
        }
    });
});

// Easter egg: Konami code for extra pancakes
let konamiCode = [];
const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.keyCode);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }

    if (konamiCode.length === konamiSequence.length &&
        konamiCode.every((code, index) => code === konamiSequence[index])) {

        console.log("🥞🥞🥞 PANCAKE POWER ACTIVATED! 🥞🥞🥞");

        // Create a burst of pancake emojis
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const pancake = document.createElement('div');
                pancake.textContent = '🥞';
                pancake.style.position = 'fixed';
                pancake.style.left = Math.random() * window.innerWidth + 'px';
                pancake.style.top = '-50px';
                pancake.style.fontSize = '2em';
                pancake.style.zIndex = '1000';
                pancake.style.pointerEvents = 'none';
                pancake.style.animation = 'float 3s linear forwards';

                document.body.appendChild(pancake);

                setTimeout(() => {
                    if (pancake.parentNode) {
                        pancake.parentNode.removeChild(pancake);
                    }
                }, 3000);
            }, i * 100);
        }

        konamiCode = []; // Reset
    }
});

// Popup functions
function showPopup() {
    const popup = document.getElementById('popup-ad');
    if (popup) {
        popup.style.display = 'flex';
        console.log("🎉 Popup activated! Classic 2009 experience!");
    }
}

function closePopup() {
    const popup = document.getElementById('popup-ad');
    if (popup) {
        popup.style.display = 'none';
        console.log("👋 Popup closed! Thanks for not using AdBlock! >_<");
    }
}

// Window control functions (just for show)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('window-button')) {
        if (e.target.textContent === '×') {
            alert("You can't close this window! This is the internet! >_<");
        } else if (e.target.textContent === '□') {
            alert("Maximize? This IS maximized! Welcome to 2009! :3");
        } else if (e.target.textContent === '_') {
            alert("Minimize? But then you'd miss all the pancakes! >~<");
        }
    }
});

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('script-loaded');
    console.log("⚡ Script performance marked!");
}