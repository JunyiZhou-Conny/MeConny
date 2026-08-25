/* ========================================
   Javis Ng — Portfolio v2 Interactions
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initTilt();
    initDecrypt();
    initMagnetic();
    initMobileMenu();
    initFooterYear();
    initSmoothScroll();
    initLogoLoop();
    initHeroParticles();
    initSkillUniverse();
    initBorderGlow();
    initTokenMonitorWidget();
});

/* ── 1. Scroll Reveal ──────────────────── */
function initReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.delay) || 0;
                setTimeout(() => entry.target.classList.add('visible'), delay);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => obs.observe(el));
}

/* ── 2. 3D Tilt ────────────────────────── */
function initTilt() {
    if ('ontouchstart' in window) return;
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            card.style.transform =
                `perspective(800px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 5}deg) scale3d(1.01,1.01,1.01)`;
        });
        card.addEventListener('mouseenter', () => { card.style.transition = 'transform .15s ease-out'; });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform .4s var(--ease)';
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
        });
    });
}

/* ── 3. Decrypted Text ─────────────────── */
function initDecrypt() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    document.querySelectorAll('[data-decrypt]').forEach(el => {
        const original = el.textContent;
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { scramble(el, original, chars); obs.unobserve(el); }
            });
        }, { threshold: 0.5 });
        obs.observe(el);
    });
}

function scramble(el, original, chars) {
    let i = 0;
    const iv = setInterval(() => {
        el.textContent = original.split('').map((c, idx) => {
            if (c === ' ') return ' ';
            return idx < i ? original[idx] : chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        i += 0.5;
        if (i >= original.length) { el.textContent = original; clearInterval(iv); }
    }, 30);
}

/* ── 4. Magnetic Buttons ───────────────── */
function initMagnetic() {
    if ('ontouchstart' in window) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px,${(e.clientY - r.top - r.height / 2) * 0.15}px)`;
        });
        el.addEventListener('mouseenter', () => { el.style.transition = 'transform .15s ease-out'; });
        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform .4s var(--ease)';
            el.style.transform = 'translate(0,0)';
        });
    });
}

/* ── 5. Mobile Menu — Dropdown card ────── */
function initMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const dropdown = document.querySelector('.nav-dropdown');
    if (!toggle || !dropdown) return;

    const shut = () => { dropdown.classList.remove('open'); toggle.classList.remove('open'); };

    toggle.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        toggle.classList.toggle('open');
    });

    dropdown.querySelectorAll('a').forEach(a => a.addEventListener('click', shut));

    document.addEventListener('click', e => {
        if (!toggle.contains(e.target) && !dropdown.contains(e.target)) shut();
    });
}

/* ── 6. Footer Year ───────────────────── */
function initFooterYear() {
    const el = document.querySelector('.footer-copy');
    if (!el) return;

    const startYear = parseInt(el.dataset.startYear || '', 10);
    const name = el.dataset.name || 'Javis Ng';
    if (!startYear) return;

    const currentYear = new Date().getFullYear();
    const yearText = currentYear > startYear ? `${startYear}–${currentYear}` : `${currentYear}`;
    el.textContent = `${name} © ${yearText}`;
}

/* ── 7. Logo Loop — RAF + exponential velocity smoothing ── */
function initLogoLoop() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const TAU = 0.25; // velocity smoothing constant (~250ms to settle)

    document.querySelectorAll('.logo-loop-wrap').forEach(wrap => {
        let isHovered = false;
        wrap.addEventListener('mouseenter', () => { isHovered = true; });
        wrap.addEventListener('mouseleave', () => { isHovered = false; });

        wrap.querySelectorAll('.logo-track').forEach(track => {
            const isReverse = track.classList.contains('logo-track--rev');
            const speed = parseFloat(wrap.dataset.speed || '80');
            const BASE = isReverse ? -speed : speed; // px/s normal
            const SLOW = BASE * 0.25; // px/s on hover

            let seqWidth = 0;
            let offset   = 0;
            let vel      = BASE;
            let prevTs   = null;

            const tick = ts => {
                // Measure exact float width by diffing the first item of each copy
                if (seqWidth === 0) {
                    const items = track.querySelectorAll('.logo-item');
                    const half  = items.length / 2;
                    if (items[0] && items[half]) {
                        const r1 = items[0].getBoundingClientRect();
                        const r2 = items[half].getBoundingClientRect();
                        seqWidth = Math.abs(r2.left - r1.left);
                    }
                }

                if (prevTs !== null && seqWidth > 0) {
                    const dt     = Math.min((ts - prevTs) / 1000, 0.05); // cap at 50ms
                    const target = isHovered ? SLOW : BASE;
                    // Exponential ease toward target velocity (React Bits algorithm)
                    vel += (target - vel) * (1 - Math.exp(-dt / TAU));
                    offset = ((offset + vel * dt) % seqWidth + seqWidth) % seqWidth;
                    track.style.transform = `translate3d(${-offset}px,0,0)`;
                }

                prevTs = ts;
                requestAnimationFrame(tick);
            };

            document.fonts.ready.then(() => requestAnimationFrame(tick));
        });
    });
}

/* ── 8. Hero Particle Monogram ─────────── */
function initHeroParticles() {
    if (!window.HeroParticles || typeof window.HeroParticles.initHeroParticleCanvas !== 'function') return;
    window.HeroParticles.initHeroParticleCanvas();
}

/* ── 9. Skill Universe ─────────────────── */
function initSkillUniverse() {
    const scope = document.querySelector('.section-stack');
    const universe = document.querySelector('.skill-universe');
    if (!scope || !universe) return;

    const planets = universe.querySelectorAll('.skill-planet');
    const name = scope.querySelector('.skill-detail-name');
    const domain = scope.querySelector('.skill-detail-domain');
    const use = scope.querySelector('.skill-detail-use');
    if (!planets.length || !name || !domain || !use) return;

    const setActive = planet => {
        scope.classList.add('has-active');
        planets.forEach(p => p.classList.toggle('active', p === planet));
        name.textContent = planet.dataset.skill || '';
        domain.textContent = planet.dataset.domain || '';
        use.textContent = planet.dataset.use || '';
    };

    const clearActive = () => {
        scope.classList.remove('has-active');
        planets.forEach(p => p.classList.remove('active'));
    };

    planets.forEach(planet => {
        planet.addEventListener('mouseenter', () => setActive(planet));
        planet.addEventListener('focus', () => setActive(planet));
        planet.addEventListener('click', e => {
            e.stopPropagation();
            setActive(planet);
        });
    });

    universe.addEventListener('mouseleave', clearActive);
    document.addEventListener('click', e => {
        if (!scope.contains(e.target)) clearActive();
    });
}

/* ── 10. Border Glow ───────────────────── */
function initBorderGlow() {
    const cards = document.querySelectorAll('.border-glow-card');
    if (!cards.length) return;

    const GLOWCOLOR = '43 65 70';
    const INTENSITY = 1.0;
    const COLORS    = ['#c9a84c', '#d4aa50', '#b89442'];
    const POSITIONS = ['80% 55%','69% 34%','8% 6%','41% 38%','86% 85%','82% 18%','51% 4%'];
    const GRAD_KEYS = ['--gradient-one','--gradient-two','--gradient-three','--gradient-four','--gradient-five','--gradient-six','--gradient-seven'];
    const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
    const OPA_KEYS  = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const OPA_VALS  = [100, 60, 50, 40, 30, 20, 10];

    function applyStaticVars(card) {
        const [h, s, l] = GLOWCOLOR.split(' ').map(Number);
        const base = `${h}deg ${s}% ${l}%`;
        OPA_VALS.forEach((op, i) => {
            card.style.setProperty(`--glow-color${OPA_KEYS[i]}`, `hsl(${base} / ${Math.min(op * INTENSITY, 100)}%)`);
        });
        GRAD_KEYS.forEach((key, i) => {
            const c = COLORS[Math.min(COLOR_MAP[i], COLORS.length - 1)];
            card.style.setProperty(key, `radial-gradient(at ${POSITIONS[i]}, ${c} 0px, transparent 50%)`);
        });
        card.style.setProperty('--gradient-base', `linear-gradient(${COLORS[0]} 0 100%)`);
    }

    cards.forEach(card => {
        applyStaticVars(card);

        card.addEventListener('pointermove', e => {
            const rect = card.getBoundingClientRect();
            const x  = e.clientX - rect.left;
            const y  = e.clientY - rect.top;
            const cx = rect.width  / 2;
            const cy = rect.height / 2;
            const dx = x - cx;
            const dy = y - cy;

            const kx   = dx !== 0 ? cx / Math.abs(dx) : Infinity;
            const ky   = dy !== 0 ? cy / Math.abs(dy) : Infinity;
            const prox = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1) * 100;

            let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            if (angle < 0) angle += 360;

            card.style.setProperty('--edge-proximity', prox.toFixed(3));
            card.style.setProperty('--cursor-angle',   `${angle.toFixed(3)}deg`);
        });

        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--edge-proximity', '0');
        });
    });
}

/* ── 11. Smooth Scroll ─────────────────── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const id = this.getAttribute('href');
            if (id === '#') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
            const el = document.querySelector(id);
            if (el) {
                window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
            }
        });
    });
}

/* ── 12. Token Monitor live widget ─────── */
function initTokenMonitorWidget() {
    const widget = document.querySelector('.tm-widget');
    if (!widget) return;
    const endpoint = widget.dataset.tmEndpoint;
    if (!endpoint) return;

    const POLL_MS = 30000;
    const ANIM_MS = 2200;
    const tokensEl  = widget.querySelector('[data-tm-tokens]');
    const costEl    = widget.querySelector('[data-tm-cost]');
    const updatedEl = widget.querySelector('[data-tm-updated]');
    const statusEl  = widget.querySelector('[data-tm-status]');
    const dotEl     = widget.querySelector('.tm-dot');

    const tokenFmt = new Intl.NumberFormat('en-US');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lastUpdatedAt = null;
    let pollTimer = null;
    let currentTokens = 0;
    let currentCost = 0;
    let tokenAnimId = null;
    let costAnimId = null;
    let hasFirstData = false;

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
    function formatTokens(n) { return tokenFmt.format(Math.max(0, Math.round(n))); }
    function formatCost(n) {
        const amount = Math.max(0, Number(n) || 0);
        return `$${amount.toFixed(amount >= 10 ? 2 : 4)}`;
    }

    function tween(el, from, to, formatter, cancelToken, duration) {
        if (!el) return null;
        if (cancelToken) cancelAnimationFrame(cancelToken);
        if (reduceMotion || from === to) {
            el.textContent = formatter(to);
            return null;
        }
        const start = performance.now();
        const delta = to - from;
        let id = 0;
        function frame(now) {
            const progress = Math.min(1, (now - start) / duration);
            el.textContent = formatter(from + delta * easeOutQuart(progress));
            if (progress < 1) id = requestAnimationFrame(frame);
        }
        id = requestAnimationFrame(frame);
        return id;
    }

    function flashUpdate() {
        widget.classList.remove('is-updated');
        // Force reflow so the animation can re-trigger
        void widget.offsetWidth;
        widget.classList.add('is-updated');
    }

    widget.addEventListener('animationend', (e) => {
        if (e.animationName === 'tm-flash') widget.classList.remove('is-updated');
    });

    function setStatus(state) {
        if (statusEl) {
            statusEl.textContent = state === 'error' ? 'OFFLINE' : 'LIVE';
            statusEl.classList.toggle('is-error', state === 'error');
        }
        if (dotEl) dotEl.classList.toggle('is-error', state === 'error');
    }

    function formatRelative(iso) {
        const t = Date.parse(iso);
        if (!Number.isFinite(t)) return '—';
        const diff = Math.max(0, (Date.now() - t) / 1000);
        if (diff < 5)     return 'just now';
        if (diff < 60)    return `${Math.round(diff)}s ago`;
        if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
        return `${Math.round(diff / 86400)}d ago`;
    }

    function paintUpdated() {
        if (updatedEl && lastUpdatedAt) updatedEl.textContent = formatRelative(lastUpdatedAt);
    }

    async function fetchStats() {
        try {
            const res = await fetch(endpoint, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const allTime = data?.periods?.allTime || {};
            const nextTokens = Number(allTime.totalTokens || 0);
            const nextCost   = Number(allTime.costUsd || 0);
            const tokensChanged = nextTokens !== currentTokens;
            const costChanged   = nextCost !== currentCost;
            tokenAnimId = tween(tokensEl, currentTokens, nextTokens, formatTokens, tokenAnimId, ANIM_MS);
            costAnimId  = tween(costEl,   currentCost,   nextCost,   formatCost,   costAnimId,   ANIM_MS);
            currentTokens = nextTokens;
            currentCost = nextCost;
            lastUpdatedAt = data?.updatedAt || new Date().toISOString();
            paintUpdated();
            setStatus('ok');
            if (hasFirstData && (tokensChanged || costChanged)) flashUpdate();
            hasFirstData = true;
        } catch (_) {
            setStatus('error');
        }
    }

    function startPolling() {
        if (pollTimer) return;
        pollTimer = setInterval(fetchStats, POLL_MS);
    }

    function stopPolling() {
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    fetchStats();
    startPolling();
    setInterval(paintUpdated, 5000);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPolling();
        } else {
            fetchStats();
            startPolling();
        }
    });
}
