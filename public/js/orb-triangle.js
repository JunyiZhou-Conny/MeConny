/* ========================================
   WebGL tetractys — Vercel-style orbs
   ========================================
   Fragment-shader bloom, not canvas 2D fills.
   Ten orbs in a 1-2-3-4 triangle. Pointer is a
   light. Falls back to 2D if WebGL is missing.
   ======================================== */

(function attachOrbTriangle(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.OrbTriangle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function orbTriangleFactory() {
    const VERT = `
attribute vec2 a_pos;
void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

    const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_pointerOn;
uniform vec2 u_orbs[10];
uniform float u_gain[10];

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float glow(vec2 p, vec2 c, float gain) {
    vec2 d = p - c;
    float r2 = dot(d, d);
    float core = smoothstep(9.0, 0.0, sqrt(r2)) * 1.35;
    float bloom = 18.0 / (r2 + 42.0);
    float haze = 140.0 / (r2 + 2200.0);
    return (core + bloom + haze) * gain;
}

float segment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    vec2 p = gl_FragCoord.xy;
    float field = 0.0;
    field += glow(p, u_orbs[0], u_gain[0]);
    field += glow(p, u_orbs[1], u_gain[1]);
    field += glow(p, u_orbs[2], u_gain[2]);
    field += glow(p, u_orbs[3], u_gain[3]);
    field += glow(p, u_orbs[4], u_gain[4]);
    field += glow(p, u_orbs[5], u_gain[5]);
    field += glow(p, u_orbs[6], u_gain[6]);
    field += glow(p, u_orbs[7], u_gain[7]);
    field += glow(p, u_orbs[8], u_gain[8]);
    field += glow(p, u_orbs[9], u_gain[9]);

    float edge = min(
        segment(p, u_orbs[0], u_orbs[6]),
        min(segment(p, u_orbs[6], u_orbs[9]), segment(p, u_orbs[9], u_orbs[0]))
    );
    field += 0.55 / (edge * edge * 0.08 + 18.0);

    vec2 mid = (u_orbs[0] + u_orbs[6] + u_orbs[9]) / 3.0;
    float veil = exp(-dot(p - mid, p - mid) / (min(u_res.x, u_res.y) * 95.0));
    field += veil * 0.07;

    if (u_pointerOn > 0.5) {
        vec2 pd = p - u_pointer;
        field += 0.22 / (dot(pd, pd) * 0.012 + 16.0);
    }

    field *= 0.92 + 0.08 * sin(u_time * 0.7);

    vec3 tint = vec3(0.90, 0.94, 1.0);
    vec3 col = tint * field;
    col = col / (1.0 + col);
    col = pow(col, vec3(0.82));
    col += (hash(p + u_time) - 0.5) * 0.02;

    float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.15, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
}
`;

    function compile(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(info || "shader compile failed");
        }
        return shader;
    }

    function buildTetractys(cx, cy, spacing) {
        const rise = spacing * Math.sqrt(3) / 2;
        const orbs = [];
        for (let row = 0; row < 4; row += 1) {
            const count = row + 1;
            const y = cy - rise * 1.5 + row * rise;
            for (let col = 0; col < count; col += 1) {
                orbs.push({
                    restX: cx + (col - (count - 1) / 2) * spacing,
                    restY: y,
                    x: 0,
                    y: 0,
                    phase: (row * 1.7 + col * 0.9) % (Math.PI * 2),
                    pulse: 0.5 + ((row + col) % 5) * 0.09,
                    gain: 1,
                });
            }
        }
        return orbs;
    }

    function createProgram(gl) {
        const program = gl.createProgram();
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program) || "program link failed");
        }
        return program;
    }

    function initWebGL(host, canvas, reduceMotion) {
        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
        });
        if (!gl) return null;

        const program = createProgram(gl);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);

        const aPos = gl.getAttribLocation(program, "a_pos");
        const uRes = gl.getUniformLocation(program, "u_res");
        const uTime = gl.getUniformLocation(program, "u_time");
        const uPointer = gl.getUniformLocation(program, "u_pointer");
        const uPointerOn = gl.getUniformLocation(program, "u_pointerOn");
        const uOrbs = gl.getUniformLocation(program, "u_orbs[0]");
        const uGain = gl.getUniformLocation(program, "u_gain[0]");

        const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
        const orbXY = new Float32Array(20);
        const orbGain = new Float32Array(10);
        let width = 0;
        let height = 0;
        let dpr = 1;
        let spacing = 72;
        let orbs = [];
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
            gl.viewport(0, 0, canvas.width, canvas.height);
            spacing = Math.min(width, height) * (width < 720 ? 0.145 : 0.118);
            orbs = buildTetractys(width * 0.68, height * 0.4, spacing);
            host.classList.add("is-orb-ready");
            window.cancelAnimationFrame(frameId);
            paint(performance.now());
        }

        function paint(now) {
            const t = (now - startedAt) / 1000;
            pointer.x += (pointer.tx - pointer.x) * 0.12;
            pointer.y += (pointer.ty - pointer.y) * 0.12;

            orbs.forEach((orb, index) => {
                const breath = reduceMotion ? 0 : Math.sin(t * orb.pulse + orb.phase) * spacing * 0.035;
                const dx = pointer.x - orb.restX;
                const dy = pointer.y - orb.restY;
                const dist = Math.hypot(dx, dy) || 1;
                const influence = pointer.inside ? Math.max(0, 1 - dist / (spacing * 3.6)) : 0;
                const pull = influence * influence * spacing * 0.22;
                orb.x += (orb.restX + (dx / dist) * pull - orb.x) * (reduceMotion ? 1 : 0.16);
                orb.y += (orb.restY + breath + (dy / dist) * pull * 0.5 - orb.y) * (reduceMotion ? 1 : 0.16);
                orb.gain = 0.72 + influence * 0.9 + (reduceMotion ? 0 : 0.08 * Math.sin(t * 1.05 + index));
                orbXY[index * 2] = orb.x * dpr;
                orbXY[index * 2 + 1] = (height - orb.y) * dpr;
                orbGain[index] = orb.gain;
            });

            gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, t);
            gl.uniform2f(uPointer, pointer.x * dpr, (height - pointer.y) * dpr);
            gl.uniform1f(uPointerOn, pointer.inside ? 1 : 0);
            gl.uniform2fv(uOrbs, orbXY);
            gl.uniform1fv(uGain, orbGain);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

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

    function initOrbTriangle() {
        if (typeof document === "undefined") return null;
        const host = document.querySelector("[data-orb-triangle]");
        const canvas = host ? host.querySelector("canvas") : null;
        if (!host || !canvas) return null;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        try {
            const webgl = initWebGL(host, canvas, reduceMotion);
            if (webgl) return webgl;
        } catch (error) {
            console.warn("Orb triangle WebGL failed, using 2D.", error);
        }

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return null;
        const rect = host.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        canvas.width = width;
        canvas.height = height;
        const spacing = Math.min(width, height) * 0.12;
        const orbs = buildTetractys(width * 0.68, height * 0.4, spacing);
        orbs.forEach((orb) => {
            const glow = ctx.createRadialGradient(orb.restX, orb.restY, 0, orb.restX, orb.restY, spacing * 1.15);
            glow.addColorStop(0, "rgba(255,255,255,0.85)");
            glow.addColorStop(0.2, "rgba(230,238,255,0.2)");
            glow.addColorStop(1, "rgba(230,238,255,0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(orb.restX, orb.restY, spacing * 1.15, 0, Math.PI * 2);
            ctx.fill();
        });
        host.classList.add("is-orb-ready");
        return { destroy() {} };
    }

    return { init: initOrbTriangle };
});
