console.log("Welcome to ilikepancakes.ink! >_<");

const floatingWords = [
    "pancakes", "syrup", "butter", "fluffy", "stack", "breakfast", "yummy", ":3", ">_<", ">~<",
    "web dev", "HTML", "CSS", "JavaScript", "retro", "2009", "nostalgia", "pixels", "gradients",
    "rainbow", "pride", "love", "inclusive", "community", "coding", "creative", "fun", "cozy",
    "aesthetic", "vibes", "chill", "uwu", "owo", "nya", "meow", "purr", "soft", "warm",
    "digital", "internet", "website", "homepage", "blog", "portfolio", "projects", "dreams",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "goon :3", "i use arch btw", "arch is better than windows", "Arch Linux"
];

let animationEnabled = true;
let circles = [];
let textElements = [];

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animationEnabled = false;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing 2009-style animations! ✨");

    if (animationEnabled) {
        startFloatingText();
        startBouncingCircles();
    }

    setTimeout(() => {
        showPopup();
    }, 3000);

    setTimeout(() => {
        console.log("🥞 Did someone say pancakes?");
    }, 2000);

    setTimeout(() => {
        console.log("💜 Thanks for visiting my retro corner of the web!");
    }, 5000);
});

function startBouncingCircles() {
    const circlesContainer = document.querySelector('.floating-circles');
    if (!circlesContainer) return;

    for (let i = 0; i < 8; i++) {
        createCircle(circlesContainer);
    }

    setInterval(() => {
        if (circles.length < 12) {
            createCircle(circlesContainer);
        }
    }, 3000);
}

function createCircle(container) {
    const circle = document.createElement('div');
    circle.className = `circle ${Math.random() > 0.5 ? 'black' : 'white'}`;

    const size = Math.random() * 60 + 20;
    circle.style.width = size + 'px';
    circle.style.height = size + 'px';

    circle.style.left = Math.random() * (window.innerWidth - size) + 'px';
    circle.style.top = Math.random() * (window.innerHeight - size) + 'px';

    circle.style.animationDelay = Math.random() * 3 + 's';
    circle.style.animationDuration = (Math.random() * 2 + 2) + 's';

    container.appendChild(circle);
    circles.push(circle);

    setTimeout(() => {
        if (circle.parentNode) {
            circle.parentNode.removeChild(circle);
            circles = circles.filter(c => c !== circle);
        }
    }, 15000);
}

function startFloatingText() {
    const textContainer = document.querySelector('.floating-text');
    if (!textContainer) return;

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

    word.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    word.style.top = Math.random() * (window.innerHeight - 50) + 'px';

    const moveX = (Math.random() - 0.5) * 200;
    const moveY = (Math.random() - 0.5) * 200;
    const duration = Math.random() * 8 + 10;

    word.style.animation = `floatAround ${duration}s infinite ease-in-out`;
    word.style.setProperty('--moveX', moveX + 'px');
    word.style.setProperty('--moveY', moveY + 'px');

    const fonts = ['Arial', 'Verdana', 'Tahoma', 'Georgia', 'Courier New'];
    word.style.fontFamily = fonts[Math.floor(Math.random() * fonts.length)];

    const colors = [
        'rgba(255, 255, 255, 0.3)',
        'rgba(0, 255, 255, 0.3)',
        'rgba(255, 0, 255, 0.3)',
        'rgba(255, 255, 0, 0.3)',
        'rgba(0, 255, 0, 0.3)'
    ];
    word.style.color = colors[Math.floor(Math.random() * colors.length)];

    container.appendChild(word);
    textElements.push(word);

    setTimeout(() => {
        if (word.parentNode) {
            word.parentNode.removeChild(word);
            textElements = textElements.filter(t => t !== word);
        }
    }, duration * 1000 + 2000);
}

window.addEventListener('resize', function() {
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

let konamiCode = [];
const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.keyCode);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }

    if (konamiCode.length === konamiSequence.length &&
        konamiCode.every((code, index) => code === konamiSequence[index])) {

        console.log("🥞🥞🥞 PANCAKE POWER ACTIVATED! 🥞🥞🥞");

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

        konamiCode = [];
    }
});

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

if (window.performance && window.performance.mark) {
    window.performance.mark('script-loaded');
    console.log("⚡ Script performance marked!");
}