// script.js

document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------------------------
    // 0. PRELOADER LOGIC WITH STARFIELD
    // -----------------------------------------------------------------------
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progressBar');
    const starsCanvas = document.getElementById('preloader-stars');

    // Starfield Animation
    if (starsCanvas) {
        const starsCtx = starsCanvas.getContext('2d');
        starsCanvas.width = window.innerWidth;
        starsCanvas.height = window.innerHeight;

        const stars = [];
        for (let i = 0; i < 150; i++) {
            stars.push({
                x: Math.random() * starsCanvas.width,
                y: Math.random() * starsCanvas.height,
                radius: Math.random() * 2.5 + 0.5,
                opacity: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                color: Math.random() > 0.5 ? 'rgba(255, 0, 127,' : 'rgba(255, 102, 204,'
            });
        }

        function animateStars() {
            starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
            stars.forEach(star => {
                star.opacity += star.twinkleSpeed;
                if (star.opacity > 1 || star.opacity < 0.3) {
                    star.twinkleSpeed = -star.twinkleSpeed;
                }
                starsCtx.fillStyle = star.color + star.opacity + ')';
                starsCtx.shadowBlur = 15;
                starsCtx.shadowColor = star.color + '0.8)';
                starsCtx.beginPath();
                starsCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                starsCtx.fill();
            });
            requestAnimationFrame(animateStars);
        }
        animateStars();
    }

    if (preloader && progressBar) {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    preloader.classList.add('fade-out');
                }, 800);
            } else {
                width += Math.random() * 8;
                if (width > 100) width = 100;
                progressBar.style.width = width + '%';
            }
        }, 150);
    }

    // -----------------------------------------------------------------------
    // 1. PARTICLES BACKGROUND ANIMATION
    // -----------------------------------------------------------------------
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particlesArray;
        let mouseSparks = [];
        const mouse = {
            x: undefined,
            y: undefined
        };

        window.addEventListener('mousemove', (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
            for (let i = 0; i < 3; i++) {
                mouseSparks.push(new MouseSpark(mouse.x, mouse.y));
            }
        });

        class MouseSpark {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 5 + 1;
                this.speedX = (Math.random() * 2) - 1;
                this.speedY = (Math.random() * 2) - 1;
                this.color = 'rgba(255, 0, 127,' + this.life + ')';
                this.life = 1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.1) this.size -= 0.1;
                this.life -= 0.02;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(255, 0, 127, 0.8)';
            }
        }

        // Create particle class
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2.5 + 0.5; // Larger stars
                this.speedX = (Math.random() * 0.4) - 0.2;
                this.speedY = (Math.random() * 0.4) - 0.2;
                this.opacity = Math.random() * 0.5 + 0.5; // Brighter min opacity
                this.twinkleSpeed = Math.random() * 0.01 + 0.005;

                const colors = [
                    'rgba(255, 0, 127,',    // Hot Pink
                    'rgba(255, 102, 204,',  // Bright Pink
                    'rgba(255, 255, 255,'   // Pure White
                ];
                this.baseColor = colors[Math.floor(Math.random() * colors.length)];
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                // Handle Twinkle
                this.opacity += this.twinkleSpeed;
                if (this.opacity > 1 || this.opacity < 0.3) {
                    this.twinkleSpeed = -this.twinkleSpeed;
                }

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = this.baseColor + this.opacity + ')';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Brighter Glow
                if (this.size > 1.5) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = 'rgba(255, 0, 127, 0.8)';
                } else {
                    ctx.shadowBlur = 0;
                }
            }
        }

        function init() {
            particlesArray = [];
            // Even higher density
            let numberOfParticles = (canvas.width * canvas.height) / 5000;
            for (let i = 0; i < numberOfParticles; i++) {
                particlesArray.push(new Particle());
            }
        }

        function connect() {
            let opacityValue = 1;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                        ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

                    if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        // Pinkish faint lines
                        ctx.strokeStyle = 'rgba(255, 0, 127,' + opacityValue * 0.15 + ')';
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }
            connect();

            for (let i = 0; i < mouseSparks.length; i++) {
                mouseSparks[i].update();
                mouseSparks[i].draw();

                if (mouseSparks[i].life <= 0) {
                    mouseSparks.splice(i, 1);
                    i--;
                }
            }
        }

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        });

        init();
        animate();
    }


    // -----------------------------------------------------------------------
    // 2. TYPING EFFECT
    // -----------------------------------------------------------------------
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        const words = ["Full Stack Developer"];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentWord = words[wordIndex];

            if (isDeleting) {
                typingElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50;
            } else {
                typingElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                typeSpeed = 2000; // Pause at end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500; // Pause before next word
            }

            setTimeout(type, typeSpeed);
        }

        setTimeout(type, 1000);
    }

    // -----------------------------------------------------------------------
    // 3. 3D TILT EFFECT FOR CARDS
    // -----------------------------------------------------------------------
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // -----------------------------------------------------------------------
    // 4. NAVIGATION SCROLL EFFECT & HAMBURGER
    // -----------------------------------------------------------------------
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // -----------------------------------------------------------------------
    // 5. SMOOTH SCROLL & ACTIVE LINKS
    // -----------------------------------------------------------------------
    const navLinksItems = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    function updateActiveLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinksItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);

    navLinksItems.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetBlock = document.querySelector(targetId);

            if (targetBlock) {
                const navbarHeight = 100;
                const targetPosition = targetBlock.offsetTop - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // -----------------------------------------------------------------------
    // 6. SCROLL REVEAL ANIMATION
    // -----------------------------------------------------------------------
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));

    // -----------------------------------------------------------------------
    // 7. CONTACT FORM HANDLER (Formspree AJAX)
    // -----------------------------------------------------------------------
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Loading State
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            const formData = new FormData(contactForm);

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    body: JSON.stringify(Object.fromEntries(formData)),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    formStatus.textContent = 'Message sent successfully! Thank you.';
                    formStatus.classList.add('success');
                    contactForm.reset();
                } else {
                    formStatus.textContent = 'Failed to send message to Database.';
                    formStatus.classList.add('error');
                }
            } catch (error) {
                formStatus.textContent = 'Connection issue encountered.';
                formStatus.classList.add('error');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // -----------------------------------------------------------------------
    // NEW FEATURES: Visitor Counter, Theme, Dynamic Projects
    // -----------------------------------------------------------------------



    // 2. Theme Toggle


    // 3. Projects Tilt Initialization
    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid) {
        // Re-init VanillaTilt if available for the hardcoded cards
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
                max: 15,
                speed: 400,
                glare: true,
                "max-glare": 0.2
            });
        }
    }

});
