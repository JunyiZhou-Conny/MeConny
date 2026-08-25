/* ========================================
   Hero particle monogram
   ======================================== */

(function attachHeroParticles(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.HeroParticles = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function heroParticlesFactory() {
    function mulberry32(seed) {
        let t = seed >>> 0;
        return function random() {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    function isAccentPixel(r, g, b) {
        return r > 190 && g > 150 && b < 175;
    }

    function sampleParticleTargetsFromMask(options) {
        const {
            data,
            width,
            height,
            count,
            seed = 1,
            jitter = 0.35,
            alphaThreshold = 12,
            step = 1,
        } = options || {};

        if (!data || !width || !height || !count) return [];

        const pixels = [];
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const index = (y * width + x) * 4;
                const alpha = data[index + 3];
                if (alpha < alphaThreshold) continue;
                pixels.push({
                    x,
                    y,
                    accent: isAccentPixel(data[index], data[index + 1], data[index + 2]),
                    alpha: alpha / 255,
                });
            }
        }

        if (!pixels.length) return [];

        const random = mulberry32(seed);
        const targets = [];
        for (let i = 0; i < count; i++) {
            const pixel = pixels[Math.floor(random() * pixels.length)];
            const depth = 0.18 + random() * 0.82;
            targets.push({
                x: pixel.x + (random() - 0.5) * jitter,
                y: pixel.y + (random() - 0.5) * jitter,
                accent: pixel.accent,
                alpha: pixel.alpha,
                depth,
                seed: random() * Math.PI * 2,
            });
        }

        return targets;
    }

    function resolveHeroParticleCount({ width, reduceMotion }) {
        if (reduceMotion) return 760;
        if (width < 481) return 0;
        if (width < 800) return 1700;
        if (width < 1200) return 2800;
        return 3600;
    }

    function smoothstep(edge0, edge1, value) {
        const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
        return x * x * (3 - 2 * x);
    }

    function computePointerDisplacement({ x, y, pointerX, pointerY, radius, strength, swirlStrength = 0 }) {
        if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) return { x: 0, y: 0, alpha: 0 };

        const dx = x - pointerX;
        const dy = y - pointerY;
        const dist = Math.hypot(dx, dy);
        if (!dist || dist >= radius) return { x: 0, y: 0, alpha: 0 };

        const falloff = 1 - smoothstep(0, radius, dist);
        const force = falloff * strength;
        const swirl = falloff * swirlStrength;
        const nx = dx / dist;
        const ny = dy / dist;
        return {
            x: nx * force - ny * swirl,
            y: ny * force + nx * swirl,
            alpha: falloff,
        };
    }

    function getMonogramMaskLayout(size) {
        return {
            rotation: -0.012,
            scaleX: 1,
            scaleY: 1,
            fontScale: 0.56,
            strokeScale: 0.024,
        };
    }

    function createDepthFieldTargets(options) {
        const {
            width,
            height,
            count,
            seed = 1,
        } = options || {};

        if (!width || !height || !count) return [];

        const random = mulberry32(seed);
        const targets = [];
        for (let i = 0; i < count; i++) {
            const radiusFactor = Math.sqrt(random());
            const angle = random() * Math.PI * 2;
            const xRadius = width * (0.22 + random() * 0.12);
            const yRadius = height * (0.18 + random() * 0.08);
            const x = width * 0.5 + Math.cos(angle) * xRadius * radiusFactor;
            const y = height * 0.5 + Math.sin(angle) * yRadius * radiusFactor;

            targets.push({
                x,
                y,
                accent: false,
                alpha: 0.08 + random() * 0.16,
                depth: 0.12 + random() * 0.65,
                seed: random() * Math.PI * 2,
                field: true,
            });
        }

        return targets;
    }

    function drawMonogramMask(width, height) {
        const mask = document.createElement('canvas');
        mask.width = Math.max(1, Math.round(width));
        mask.height = Math.max(1, Math.round(height));

        const ctx = mask.getContext('2d', { willReadFrequently: true });
        const cx = width / 2;
        const cy = height / 2;
        const size = Math.min(width, height);

        ctx.clearRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const layout = getMonogramMaskLayout(size);

        ctx.save();
        ctx.translate(cx + size * 0.01, cy + size * 0.015);
        ctx.rotate(layout.rotation);
        ctx.scale(layout.scaleX, layout.scaleY);
        ctx.font = `800 ${Math.round(size * layout.fontScale)}px Outfit, Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(8, size * layout.strokeScale);
        ctx.strokeStyle = 'rgba(202, 210, 222, 0.54)';
        ctx.strokeText('CZ', 0, 0);
        ctx.fillStyle = 'rgba(198, 207, 220, 0.18)';
        ctx.fillText('CZ', 0, 0);
        ctx.restore();

        return ctx.getImageData(0, 0, mask.width, mask.height);
    }

    function initHeroParticleCanvas() {
        if (typeof document === 'undefined') return null;

        const host = document.querySelector('[data-hero-particles]');
        const canvas = host ? host.querySelector('canvas') : null;
        if (!host || !canvas) return null;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return null;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pointer = { active: false, hasPosition: false, x: 0, y: 0, targetX: 0, targetY: 0, alpha: 0 };
        let particles = [];
        let dust = [];
        let frameId = 0;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let startedAt = performance.now();

        function createDust(random, count) {
            return Array.from({ length: count }, () => ({
                x: random() * width,
                y: random() * height,
                r: 0.35 + random() * 0.85,
                phase: random() * Math.PI * 2,
                speed: 0.45 + random() * 0.8,
                alpha: 0.05 + random() * 0.18,
            }));
        }

        function resetParticles() {
            const rect = host.getBoundingClientRect();
            width = Math.max(1, Math.round(rect.width));
            height = Math.max(1, Math.round(rect.height));
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = resolveHeroParticleCount({ width: window.innerWidth, reduceMotion });
            if (!count) {
                host.classList.remove('is-particle-ready');
                particles = [];
                return;
            }

            const mask = drawMonogramMask(width, height);
            const fieldCount = Math.round(count * (reduceMotion ? 0.08 : 0.14));
            const monogramCount = Math.max(1, count - fieldCount);
            const targets = sampleParticleTargetsFromMask({
                data: mask.data,
                width: mask.width,
                height: mask.height,
                count: monogramCount,
                seed: width * 13 + height * 17,
                jitter: 0.45,
                step: 1,
            }).concat(createDepthFieldTargets({
                width,
                height,
                count: fieldCount,
                seed: width * 7 + height * 29,
            }));
            const random = mulberry32(width * 31 + height * 19);
            const cx = width / 2;
            const cy = height / 2;

            particles = targets.map(target => {
                const angle = random() * Math.PI * 2;
                const radius = Math.min(width, height) * (0.2 + random() * 0.52);
                return {
                    ...target,
                    targetX: target.x,
                    targetY: target.y,
                    x: cx + Math.cos(angle) * radius,
                    y: cy + Math.sin(angle) * radius,
                    size: 0.32 + random() * (target.field ? 0.34 : 0.5) + target.depth * 0.22,
                    drift: (target.field ? 0.26 : 0.35) + random() * 1.05,
                    settle: (target.field ? 0.018 : 0.028) + random() * 0.045,
                    hueShift: random(),
                };
            });
            dust = createDust(random, reduceMotion ? 24 : 68);
            startedAt = performance.now();
            host.classList.add('is-particle-ready');
        }

        function paint(time) {
            const t = (time - startedAt) / 1000;
            const cx = width / 2;
            const cy = height / 2;
            pointer.x += (pointer.targetX - pointer.x) * 0.16;
            pointer.y += (pointer.targetY - pointer.y) * 0.16;
            pointer.alpha += ((pointer.active ? 1 : 0) - pointer.alpha) * 0.08;

            const rotate = reduceMotion ? 0 : Math.sin(t * 0.12) * 0.035;
            const cos = Math.cos(rotate);
            const sin = Math.sin(rotate);
            const pulse = reduceMotion ? 0 : Math.sin(t * 0.65) * 0.025;

            ctx.clearRect(0, 0, width, height);

            ctx.globalCompositeOperation = 'lighter';

            dust.forEach(star => {
                const alpha = star.alpha * (0.58 + Math.sin(t * star.speed + star.phase) * 0.28);
                ctx.fillStyle = `rgba(168, 178, 194, ${Math.max(0, alpha)})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fill();
            });

            particles.forEach(particle => {
                const dx = particle.targetX - cx;
                const dy = particle.targetY - cy;
                const rx = dx * cos - dy * sin;
                const ry = dx * sin + dy * cos;
                const floatX = Math.sin(t * particle.drift + particle.seed) * (particle.field ? 1.8 : 1.4 + particle.depth * 2.2);
                const floatY = Math.cos(t * (particle.drift * 0.72) + particle.seed) * (particle.field ? 1.4 : 1.1 + particle.depth * 1.9);
                const pointerPush = computePointerDisplacement({
                    x: cx + rx,
                    y: cy + ry,
                    pointerX: pointer.x,
                    pointerY: pointer.y,
                    radius: Math.min(width, height) * 0.38,
                    strength: (32 + particle.depth * 28) * pointer.alpha,
                    swirlStrength: (5 + particle.depth * 8) * pointer.alpha,
                });
                const targetX = cx + rx + floatX + pointerPush.x;
                const targetY = cy + ry + floatY + pointerPush.y;

                particle.x += (targetX - particle.x) * particle.settle;
                particle.y += (targetY - particle.y) * particle.settle;

                const alphaBase = particle.field ? 0.02 : 0.05;
                const alpha = Math.min(particle.field ? 0.25 : 0.58, (particle.alpha * 0.22 + particle.depth * 0.17 + alphaBase) + pulse + pointerPush.alpha * 0.055);
                const radius = Math.max(0.18, particle.size * ((particle.field ? 0.42 : 0.6) + particle.depth * 0.32 + pointerPush.alpha * 0.22));
                if (particle.hueShift > 0.9) {
                    ctx.fillStyle = `rgba(122, 146, 184, ${alpha * 0.46})`;
                } else {
                    ctx.fillStyle = `rgba(178, 188, 204, ${alpha})`;
                }
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalCompositeOperation = 'source-over';

            if (!reduceMotion) frameId = requestAnimationFrame(paint);
        }

        function start() {
            cancelAnimationFrame(frameId);
            resetParticles();
            if (!particles.length) return;
            paint(performance.now());
        }

        function onPointerMove(event) {
            const rect = host.getBoundingClientRect();
            pointer.targetX = event.clientX - rect.left;
            pointer.targetY = event.clientY - rect.top;
            if (!pointer.hasPosition) {
                pointer.x = pointer.targetX;
                pointer.y = pointer.targetY;
                pointer.hasPosition = true;
            }
            pointer.active = pointer.targetX >= -140 && pointer.targetX <= rect.width + 140 && pointer.targetY >= -140 && pointer.targetY <= rect.height + 140;
        }

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        function onPointerLeave() {
            pointer.active = false;
        }

        window.addEventListener('pointerleave', onPointerLeave);

        const resizeObserver = new ResizeObserver(start);
        resizeObserver.observe(host);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(frameId);
            } else {
                start();
            }
        });

        document.fonts.ready.then(start);

        return {
            destroy() {
                cancelAnimationFrame(frameId);
                resizeObserver.disconnect();
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerleave', onPointerLeave);
            },
        };
    }

    return {
        initHeroParticleCanvas,
        computePointerDisplacement,
        createDepthFieldTargets,
        getMonogramMaskLayout,
        resolveHeroParticleCount,
        sampleParticleTargetsFromMask,
    };
});
