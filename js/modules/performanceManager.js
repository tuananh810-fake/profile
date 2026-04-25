class PerformanceManager {
    constructor({ root, onStatusChange } = {}) {
        this.root = root;
        this.onStatusChange = onStatusChange;
        this.state = {
            cpuCores: navigator.hardwareConcurrency || 4,
            deviceMemory: Number(navigator.deviceMemory) || null,
            webgl: false,
            webgpu: false,
            renderer: "unknown",
            vendor: "unknown",
            tier: "medium",
            canvasDprCap: 1.6
        };
    }

    init() {
        this.detectWebGl();
        this.applyTier();
        this.applyRootState();
        window.profilePerformance = {
            getState: () => ({ ...this.state }),
            getCanvasDprCap: () => this.state.canvasDprCap
        };
        void this.detectWebGpu();
    }

    detectWebGl() {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2", {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance"
        }) || canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance"
        });

        if (!gl) {
            return;
        }

        this.state.webgl = true;

        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
            this.state.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || this.state.renderer;
            this.state.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || this.state.vendor;
        } else {
            this.state.renderer = gl.getParameter(gl.RENDERER) || this.state.renderer;
            this.state.vendor = gl.getParameter(gl.VENDOR) || this.state.vendor;
        }
    }

    async detectWebGpu() {
        if (!navigator.gpu?.requestAdapter) {
            return;
        }

        try {
            const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
            if (!adapter) {
                return;
            }
            this.state.webgpu = true;
            this.applyTier();
            this.applyRootState();
        } catch (error) {
            this.state.webgpu = false;
        }
    }

    applyTier() {
        const renderer = `${this.state.vendor} ${this.state.renderer}`.toLowerCase();
        const hasDiscreteGpu = /(nvidia|geforce|rtx|gtx|quadro|amd|radeon|rx\s?\d|arc)/i.test(renderer);
        const hasStrongCpu = this.state.cpuCores >= 8;
        const hasEnoughMemory = this.state.deviceMemory === null || this.state.deviceMemory >= 8;

        if ((this.state.webgl || this.state.webgpu) && hasDiscreteGpu && hasStrongCpu && hasEnoughMemory) {
            this.state.tier = "high";
            this.state.canvasDprCap = 2;
            return;
        }

        if ((this.state.webgl || this.state.webgpu) && this.state.cpuCores >= 4) {
            this.state.tier = "medium";
            this.state.canvasDprCap = 1.6;
            return;
        }

        this.state.tier = "low";
        this.state.canvasDprCap = 1.15;
    }

    applyRootState() {
        if (!this.root) {
            return;
        }

        this.root.classList.toggle("is-gpu-accelerated", this.state.webgl || this.state.webgpu);
        this.root.classList.toggle("is-performance-high", this.state.tier === "high");
        this.root.classList.toggle("is-performance-medium", this.state.tier === "medium");
        this.root.classList.toggle("is-performance-low", this.state.tier === "low");
        this.root.dataset.performanceTier = this.state.tier;
        this.root.dataset.gpuApi = this.state.webgpu ? "webgpu" : (this.state.webgl ? "webgl" : "none");
        this.root.style.setProperty("--profile-canvas-dpr-cap", String(this.state.canvasDprCap));
    }
}

export default PerformanceManager;
