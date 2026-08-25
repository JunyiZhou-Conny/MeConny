/* ========================================
   Vercel-style tetractys of glowing orbs
   ========================================
   The live vercel.com hero is a custom layered
   piece (SVG + CSS + GLSL / WebGPU). This is a
   canvas stand-in: ten orbs in a 1-2-3-4
   triangle, bloom, idle breath, pointer light.
   ======================================== */

(function attachOrbTriangle(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.OrbTriangle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function orbTriangleFactory() {
    function buildTetractys(cx, cy, spacing) {
        const rise = spacing * Math.sqrt(3) / 2;
        const orbs = [];
        for (let row = 0; row < 4; row += 1) {
            const count = row + 1;
            const y = cy - rise * 1.5 + row * rise;
            for (let col = 0; col < count; col += 1) {
                const x = cx + (col - (count - 1) / 2) * spacing;
                orbs.push({
                    restX: x,
                    restY: y,
                    x,
                    y,
                    phase: (row * 1.7 + col * 0.9) % (Math.PI * 2),
                    pulse: 0.55 + ((row + col) % 5) * 0.08,
                });
            }
        }
        return orbs;
    }

    function drawOrb(ctx, x, y, radius, intensity) {
        const glow = radius * (6.8 + intensity * 3.4);
        const halo = ctx.createRadialGradient(x, y, 0, x, y, glow);
        halo.addColorStop(0, `rgba(255,255,255,${0.42 + intensity * 0.28})`);
        halo.addColorStop(0.18, `rgba(236,242,255,${0.16 + intensity * 0.12})`);
        halo.addColorStop(0.45, `rgba(186,204,255,${0.05 + intensity * 0.04})`);
        halo.addColorStop(1, "rgba(186,204,255,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, glow, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${0.88 + intensity * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, radius * (0.72 + intensity * 0.12), 0, Math.PI * 2);
        ctx.fill();
    }

    function initOrbTriangle() {
        if (typeof document === "undefined") return null;

        const host = document.querySelector("[data-orb-triangle]");
        const canvas = host ? host.querySelector("canvas") : null;
        if (!host || !canvas) return null;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return null;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
        let width = 0;
        let height = 0;
        let dpr = 1;
        let orbs = [];
        let spacing = 72;
        let frameId = 0;
        const startedAt = performance.now();

        function resize() {
            const rect = host.getBoundingClientRect();
            width = Math.max(1, Math.round(rect.width));
            height = Math.max(1, Math.round(rect.height));
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            spacing = Math.min(width, height) * (width < 720 ? 0.118 : 0.092);
            orbs = buildTetractys(width * 0.72, height * 0.38, spacing);
            host.classList.add("is-orb-ready");
        }

        function paint(now) {
            const t = (now - startedAt) / 1000;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

            pointer.x += (pointer.tx - pointer.x) * 0.12;
            pointer.y += (pointer.ty - pointer.y) * 0.12;

            const haze = ctx.createRadialGradient(
                width * 0.72,
                height * 0.4,
                0,
                width * 0.72,
                height * 0.4,
                Math.min(width, height) * 0.48,
            );
            haze.addColorStop(0, "rgba(255,255,255,0.055)");
            haze.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = haze;
            ctx.fillRect(0, 0, width, height);

            orbs.forEach((orb, index) => {
                const breath = reduceMotion ? 0 : Math.sin(t * orb.pulse + orb.phase) * 3.2;
                const dx = pointer.x - orb.restX;
                const dy = pointer.y - orb.restY;
                const dist = Math.hypot(dx, dy);
                const reach = spacing * 3.4;
                const influence = pointer.inside ? Math.max(0, 1 - dist / reach) : 0;
                const pull = influence * influence * 14;
                const targetX = orb.restX + (pointer.inside ? (dx / (dist || 1)) * pull : 0);
                const targetY = orb.restY + breath + (pointer.inside ? (dy / (dist || 1)) * pull * 0.55 : 0);
                orb.x += (targetX - orb.x) * (reduceMotion ? 1 : 0.14);
                orb.y += (targetY - orb.y) * (reduceMotion ? 1 : 0.14);
                const intensity = 0.22 + influence * 0.78 + (reduceMotion ? 0 : 0.08 * Math.sin(t * 1.1 + index));
                drawOrb(ctx, orb.x, orb.y, spacing * 0.16, intensity);
            });

            if (!reduceMotion) {
                frameId = window.requestAnimationFrame(paint);
            }
        }

        function onPointerMove(event) {
            const rect = host.getBoundingClientRect();
            pointer.tx = event.clientX - rect.left;
            pointer.ty = event.clientY - rect.top;
            pointer.inside = true;
        }

        function onPointerLeave() {
            pointer.inside = false;
        }

        resize();
        paint(performance.now());
        window.addEventListener("resize", resize, { passive: true });
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerleave", onPointerLeave, { passive: true });

        return {
            destroy() {
                window.cancelAnimationFrame(frameId);
                window.removeEventListener("resize", resize);
                window.removeEventListener("pointermove", onPointerMove);
                window.removeEventListener("pointerleave", onPointerLeave);
            },
        };
    }

    return { init: initOrbTriangle };
});
