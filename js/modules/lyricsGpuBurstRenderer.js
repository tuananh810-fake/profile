import "./dashboardLegacyBridge.js";
import "./dashboardUiEnhancer.js";

class LyricsGpuBurstRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas?.getContext?.("2d", { alpha: true }) || null;
        this.rafId = null;
        this.particles = [];
        this.lastWidth = 0;
        this.lastHeight = 0;
    }

    resize() {
        if (!this.canvas) {
            return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));

        if (width === this.lastWidth && height === this.lastHeight) {
            return;
        }

        this.lastWidth = width;
        this.lastHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    addBurst({ x = 0, y = 0, color = "#ffffff", count = 16, strength = 1 } = {}) {
        if (!this.ctx) {
            return;
        }

        this.resize();

        const safeCount = Math.min(Math.max(Number(count) || 0, 0), 80);
        const safeStrength = Math.min(Math.max(Number(strength) || 1, 0.2), 2.5);
        const now = performance.now();

        for (let index = 0; index < safeCount; index += 1) {
            const angle = (Math.PI * 2 * index) / Math.max(safeCount, 1);
            const velocity = (0.8 + Math.random() * 1.8) * safeStrength;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                radius: 1.2 + Math.random() * 2.8,
                color,
                createdAt: now,
                lifeMs: 420 + Math.random() * 360
            });
        }

        this.start();
    }

    start() {
        if (this.rafId || !this.ctx) {
            return;
        }

        const tick = () => {
            this.rafId = null;
            this.render();

            if (this.particles.length > 0) {
                this.rafId = requestAnimationFrame(tick);
            }
        };

        this.rafId = requestAnimationFrame(tick);
    }

    render() {
        if (!this.ctx || !this.canvas) {
            return;
        }

        this.resize();

        const now = performance.now();
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles = this.particles.filter((particle) => {
            const age = now - particle.createdAt;
            const progress = age / particle.lifeMs;

            if (progress >= 1) {
                return false;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.025;

            ctx.globalAlpha = Math.max(0, 1 - progress);
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius * Math.max(0.2, 1 - progress * 0.5), 0, Math.PI * 2);
            ctx.fill();
            return true;
        });

        ctx.globalAlpha = 1;
    }

    clear() {
        this.particles = [];
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    dispose() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.clear();
    }
}

globalThis.LyricsGpuBurstRenderer = LyricsGpuBurstRenderer;

export default LyricsGpuBurstRenderer;
