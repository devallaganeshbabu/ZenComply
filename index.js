// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
});

// Animated counter for stats
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString() + (element.parentElement.querySelector('.stat-label').textContent.includes('Uptime') ? '%' : '+');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + (element.parentElement.querySelector('.stat-label').textContent.includes('Uptime') ? '%' : '+');
        }
    }, 16);
};

// Intersection Observer for stats animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                animateCounter(stat, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.5
});

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Intersection Observer for fade-in animations
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

// Observe feature cards
document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    fadeObserver.observe(card);
});

// Observe testimonial cards
document.querySelectorAll('.testimonial-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    fadeObserver.observe(card);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Parallax effect for floating cards
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-card');
    
    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
});

// Add mouse move effect to hero cards
const heroImage = document.querySelector('.hero-image');
if (heroImage) {
    heroImage.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.floating-card');
        const { left, top, width, height } = heroImage.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        
        cards.forEach((card, index) => {
            const moveX = (x - 0.5) * 20 * (index + 1);
            const moveY = (y - 0.5) * 20 * (index + 1);
            card.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });
    
    heroImage.addEventListener('mouseleave', () => {
        const cards = document.querySelectorAll('.floating-card');
        cards.forEach(card => {
            card.style.transform = 'translate(0, 0)';
        });
    });
}

// Add hover effect to compliance badges
const complianceBadges = document.querySelectorAll('.compliance-badge');
complianceBadges.forEach(badge => {
    badge.addEventListener('mouseenter', () => {
        badge.style.transform = 'scale(1.1) translateY(-10px)';
        badge.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    });
    
    badge.addEventListener('mouseleave', () => {
        badge.style.transform = 'scale(1) translateY(0)';
        badge.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    });
});

// Loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});


function animateScore(target, duration = 2000) {
    const el = document.getElementById("scoreValue");
    let current = 0;
    let startTime = null;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;

        let progress = Math.min((timestamp - startTime) / duration, 1);
        let easeOut = 1 - Math.pow(1 - progress, 3); // smooth easing

        let value = Math.floor(easeOut * target);
        el.textContent = value + "%";

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            el.classList.add("score-pulse"); // beautiful finishing pulse
        }
    }

    requestAnimationFrame(animate);
}

window.addEventListener("load", () => {
    animateScore(92);
});


console.log('ZenComply Landing Page Loaded Successfully');

