/* =========================================================
   Mubaswira Ibnat Zidney — Portfolio
   Interactions: nav, progress, reveal, counters, filters,
   lightbox (+swipe), spotlight, tilt, form
   ========================================================= */

(() => {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    // -----------------------------------------------------
    // Navigation
    // -----------------------------------------------------
    const navbar = $('.navbar');
    const navLinks = $$('.nav-link');
    const sections = $$('section[id]');
    const progressBar = $('#scrollProgress');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const top = target.getBoundingClientRect().top + window.scrollY - 70;
                    window.scrollTo({ top, behavior: prefersReduced.matches ? 'auto' : 'smooth' });
                }
            }
        });
    });

    // -----------------------------------------------------
    // Theme toggle (initial class set by inline head script)
    // -----------------------------------------------------
    const themeToggle = $('#themeToggle');
    const applyThemeIcon = () => {
        const icon = themeToggle?.querySelector('i');
        if (icon) {
            icon.className = document.documentElement.classList.contains('light-theme')
                ? 'fas fa-sun' : 'fas fa-moon';
        }
    };
    let themeTransTimer = null;
    themeToggle?.addEventListener('click', () => {
        const root = document.documentElement;
        const next = root.classList.contains('light-theme') ? 'dark' : 'light';
        root.classList.add('theme-transition');
        root.classList.remove('light-theme', 'dark-theme');
        root.classList.add(next + '-theme');
        try { localStorage.setItem('selected-theme', next); } catch { /* private mode */ }
        applyThemeIcon();
        clearTimeout(themeTransTimer);
        themeTransTimer = setTimeout(() => root.classList.remove('theme-transition'), 400);
    });
    applyThemeIcon();

    // -----------------------------------------------------
    // Hero typewriter
    // -----------------------------------------------------
    const typedEl = $('#typedText');
    if (typedEl) {
        const words = [
            'machine learning models',
            'RAG & LLM systems',
            'computer-vision pipelines',
            'enterprise backends',
            'research prototypes'
        ];
        if (prefersReduced.matches) {
            typedEl.textContent = words[0];
        } else {
            let wi = 0, ci = words[0].length, deleting = true;
            const tick = () => {
                if (deleting) {
                    ci -= 1;
                    typedEl.textContent = words[wi].slice(0, ci);
                    if (ci === 0) {
                        deleting = false;
                        wi = (wi + 1) % words.length;
                        setTimeout(tick, 350);
                    } else {
                        setTimeout(tick, 42);
                    }
                } else {
                    ci += 1;
                    typedEl.textContent = words[wi].slice(0, ci);
                    if (ci === words[wi].length) {
                        deleting = true;
                        setTimeout(tick, 2200);
                    } else {
                        setTimeout(tick, 72);
                    }
                }
            };
            setTimeout(tick, 2400);
        }
    }

    // Scroll-driven nav state + reading progress
    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 40);

        if (progressBar) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
        }

        let current = sections[0]?.id;
        for (const s of sections) {
            if (y + 120 >= s.offsetTop) current = s.id;
        }
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
        });
    };
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => { onScroll(); scrollTicking = false; });
            scrollTicking = true;
        }
    }, { passive: true });
    onScroll();

    // -----------------------------------------------------
    // Reveal on scroll — staggered within each batch.
    // Classes are stripped once the transition finishes so
    // hover transforms are never overridden afterwards.
    // -----------------------------------------------------
    const revealTargets = $$([
        '.section-header',
        '.about-bio',
        '.about-stats > *',
        '.service-card',
        '.cta-banner',
        '.awards-list > li',
        '.gallery-item',
        '.timeline-item',
        '.project-card',
        '.projects-cta',
        '.research-card',
        '.workshop-strip > *',
        '.skills-card',
        '.contact-info',
        '.contact-form'
    ].join(','));

    const settleReveal = (el, delay) => {
        setTimeout(() => {
            el.classList.remove('reveal', 'in');
            el.style.removeProperty('--reveal-delay');
        }, delay + 900);
    };

    if (!prefersReduced.matches && 'IntersectionObserver' in window) {
        revealTargets.forEach(el => el.classList.add('reveal'));
        const io = new IntersectionObserver((entries) => {
            let batch = 0;
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const delay = Math.min(batch * 70, 420);
                batch += 1;
                entry.target.style.setProperty('--reveal-delay', `${delay}ms`);
                entry.target.classList.add('in');
                settleReveal(entry.target, delay);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealTargets.forEach(el => io.observe(el));
    }

    // -----------------------------------------------------
    // Animated counters
    // -----------------------------------------------------
    const counters = $$('[data-count]');
    const runCounter = (el) => {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        if (Number.isNaN(target)) return;
        if (prefersReduced.matches) {
            el.textContent = target + suffix;
            return;
        }
        const duration = 1300;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    if (counters.length && 'IntersectionObserver' in window) {
        const cio = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    runCounter(entry.target);
                    cio.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(el => cio.observe(el));
    }

    // -----------------------------------------------------
    // Category filters (projects + gallery)
    // -----------------------------------------------------
    const setupFilter = (filtersEl, itemsEl) => {
        if (!filtersEl || !itemsEl) return;
        const btns = $$('.filter-btn', filtersEl);
        const filterItems = $$('[data-cat]', itemsEl);
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                btns.forEach(b => {
                    b.classList.toggle('active', b === btn);
                    b.setAttribute('aria-selected', String(b === btn));
                });
                filterItems.forEach(item => {
                    const match = filter === 'all' || item.dataset.cat === filter;
                    item.classList.toggle('is-hidden', !match);
                    if (match) {
                        // restart the entrance fade so filtering feels alive
                        item.style.animation = 'none';
                        void item.offsetWidth;
                        item.style.animation = '';
                    }
                });
            });
        });
    };
    setupFilter($('#projectFilters'), $('#projectGrid'));
    setupFilter($('#galleryFilters'), $('#gallery'));

    // -----------------------------------------------------
    // Lightbox (keyboard + swipe)
    // -----------------------------------------------------
    const gallery = $('#gallery');
    const items = gallery ? $$('.gallery-item', gallery) : [];

    const lightbox = $('#lightbox');
    const lbImg = $('#lbImg');
    const lbCount = $('#lbCount');
    const lbClose = $('#lbClose');
    const lbPrev = $('#lbPrev');
    const lbNext = $('#lbNext');

    let currentList = [];
    let currentIndex = 0;
    let lastFocused = null;

    const buildList = () => items.filter(it => !it.classList.contains('is-hidden'));

    const lbCap = $('#lbCap');
    const updateLightbox = () => {
        const node = currentList[currentIndex];
        if (!node) return;
        const img = $('img', node);
        lbImg.src = img.src;
        lbImg.alt = img.alt || 'Photo';
        if (lbCap) lbCap.textContent = img.alt || '';
        lbCount.textContent = `${currentIndex + 1} / ${currentList.length}`;
    };

    const openLightbox = (node) => {
        currentList = buildList();
        currentIndex = currentList.indexOf(node);
        if (currentIndex < 0) currentIndex = 0;
        updateLightbox();
        lastFocused = document.activeElement;
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('menu-open');
        lbClose.focus();
    };

    const closeLightbox = () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('menu-open');
        if (lastFocused) lastFocused.focus();
    };

    const prev = () => {
        if (!currentList.length) return;
        currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
        updateLightbox();
    };
    const next = () => {
        if (!currentList.length) return;
        currentIndex = (currentIndex + 1) % currentList.length;
        updateLightbox();
    };

    items.forEach(item => {
        item.addEventListener('click', () => openLightbox(item));
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(item);
            }
        });
        // Caption below the tag, sourced from the image's alt text
        const img = $('img', item);
        const fc = $('figcaption', item);
        if (img && fc && img.alt) {
            const cap = document.createElement('span');
            cap.className = 'gallery-cap';
            cap.textContent = img.alt;
            fc.appendChild(cap);
        }
    });

    lbClose?.addEventListener('click', closeLightbox);
    lbPrev?.addEventListener('click', prev);
    lbNext?.addEventListener('click', next);
    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (!lightbox?.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') prev();
        else if (e.key === 'ArrowRight') next();
    });

    // Swipe: horizontal to navigate, downward to dismiss
    let touchX = 0, touchY = 0;
    lightbox?.addEventListener('touchstart', (e) => {
        touchX = e.changedTouches[0].clientX;
        touchY = e.changedTouches[0].clientY;
    }, { passive: true });
    lightbox?.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) prev(); else next();
        } else if (dy > 70 && Math.abs(dy) > Math.abs(dx)) {
            closeLightbox();
        }
    }, { passive: true });

    // Workshop strip → also opens lightbox via the gallery list
    $$('.workshop-strip img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            const match = items.find(it => $('img', it).src === img.src);
            if (match) openLightbox(match);
        });
    });

    // -----------------------------------------------------
    // Cursor spotlight on cards (desktop only)
    // -----------------------------------------------------
    if (finePointer.matches) {
        const SPOT = '.project-card, .skills-card, .service-card, .research-card, .timeline-card';
        let spotEvent = null;
        let spotTicking = false;
        document.addEventListener('pointermove', (e) => {
            spotEvent = e;
            if (spotTicking) return;
            spotTicking = true;
            requestAnimationFrame(() => {
                spotTicking = false;
                const card = spotEvent.target?.closest?.(SPOT);
                if (!card) return;
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${spotEvent.clientX - r.left}px`);
                card.style.setProperty('--my', `${spotEvent.clientY - r.top}px`);
            });
        }, { passive: true });
    }

    // -----------------------------------------------------
    // Contact form — composes a real email
    // -----------------------------------------------------
    const form = $('#contactForm');

    const toast = (msg, type = 'info') => {
        $$('.toast').forEach(t => t.remove());
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
        el.innerHTML = `<i class="fas fa-${icon}"></i><span>${msg}</span>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 320);
        }, 4200);
    };

    const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        if (!data.name || !data.email || !data.subject || !data.message) {
            toast('Please fill in all fields.', 'error');
            return;
        }
        if (!isEmail(data.email)) {
            toast('Please enter a valid email address.', 'error');
            return;
        }
        const body = `${data.message}\n\n— ${data.name}\n${data.email}`;
        window.location.href =
            `mailto:zidney145@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
        toast('Opening your email app with the message ready to send…', 'info');
    });

    // -----------------------------------------------------
    // Service worker
    // -----------------------------------------------------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        });
    }

    // -----------------------------------------------------
    // Slideshow / Showcase
    // -----------------------------------------------------
    const slideshowTrack = $('#slideshowTrack');
    const slides = slideshowTrack ? $$('.slide', slideshowTrack) : [];
    const prevSlideBtn = $('#slidePrev');
    const nextSlideBtn = $('#slideNext');
    const indicators = $$('.indicator', $('#slideshowIndicators'));
    
    if (slideshowTrack && slides.length > 0) {
        let currentSlideIndex = 0;
        let slideInterval = null;

        const updateSlideshow = () => {
            slideshowTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
            slides.forEach((slide, idx) => {
                slide.classList.toggle('active', idx === currentSlideIndex);
            });
            indicators.forEach((ind, idx) => {
                ind.classList.toggle('active', idx === currentSlideIndex);
            });
        };

        const nextSlide = () => {
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            updateSlideshow();
            resetSlideInterval();
        };

        const prevSlide = () => {
            currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
            updateSlideshow();
            resetSlideInterval();
        };

        const resetSlideInterval = () => {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        };

        nextSlideBtn?.addEventListener('click', nextSlide);
        prevSlideBtn?.addEventListener('click', prevSlide);
        
        indicators.forEach((ind, idx) => {
            ind.addEventListener('click', () => {
                currentSlideIndex = idx;
                updateSlideshow();
                resetSlideInterval();
            });
        });

        // Touch swipe support for slideshow
        let slideTouchX = 0;
        slideshowTrack.addEventListener('touchstart', (e) => {
            slideTouchX = e.changedTouches[0].clientX;
            if (slideInterval) clearInterval(slideInterval);
        }, { passive: true });
        
        slideshowTrack.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - slideTouchX;
            if (dx > 50) prevSlide();
            else if (dx < -50) nextSlide();
            else resetSlideInterval();
        }, { passive: true });

        // Pause on hover
        slideshowTrack.addEventListener('mouseenter', () => clearInterval(slideInterval));
        slideshowTrack.addEventListener('mouseleave', resetSlideInterval);

        resetSlideInterval();
        updateSlideshow(); // Initial setup
    }

    // -----------------------------------------------------
    // Console signature
    // -----------------------------------------------------
    console.log('%cMubaswira · Portfolio', 'color:#0A84FF;font-weight:700;font-size:14px');
    console.log('Reach out → zidney145@gmail.com');
})();
