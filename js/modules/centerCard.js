class CenterCard {
    constructor({ stage, root, surface, config, onStatusChange }) {
        this.stage = stage;
        this.root = root;
        this.surface = surface;
        this.config = config;
        this.onStatusChange = onStatusChange;

        this.profileAvatar = document.getElementById("profileAvatar");
        this.avatarFallback = document.getElementById("avatarFallback");
        this.profileLabel = document.getElementById("profileLabel");
        this.profileName = document.getElementById("profileName");
        this.profileBadge = document.getElementById("profileBadge");
        this.profileTagline = document.getElementById("profileTagline");
        this.profileBio = document.getElementById("profileBio");
        this.profileSocialLinks = document.getElementById("profileSocialLinks");
        this.cardWordmark = document.getElementById("cardWordmark");
        this.modeChip = document.getElementById("cardModeChip");
        this.resizeHandles = Array.from(this.root.querySelectorAll("[data-resize]"));

        this.state = {
            x: 0,
            y: 0,
            width: this.config.card.defaultWidth,
            height: this.config.card.defaultHeight,
            audioLevel: 0
        };

        this.pointerAction = null;
        this.messageTimeout = null;

        this.handleWindowResize = this.handleWindowResize.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleSurfaceMove = this.handleSurfaceMove.bind(this);
        this.resetTilt = this.resetTilt.bind(this);
    }

    init() {
        this.renderProfile();
        this.attachEvents();
        this.resetCard(false);
    }

    renderProfile() {
        const { profile } = this.config;

        this.profileLabel.textContent = profile.label;
        this.profileName.textContent = profile.name;
        this.profileTagline.textContent = profile.tagline;
        this.profileBio.textContent = profile.bio;
        this.cardWordmark.textContent = this.config.shell.wordmark;
        this.avatarFallback.textContent = profile.initials;

        if (profile.verified) {
            this.profileBadge.hidden = false;
        }

        this.profileSocialLinks.replaceChildren(
            ...profile.socialLinks.map((link) => {
                const anchor = document.createElement("a");
                anchor.className = "profile-social-link";
                anchor.href = link.href || "#";
                anchor.target = "_blank";
                anchor.rel = "noreferrer noopener";
                anchor.dataset.noDrag = "";
                anchor.setAttribute("aria-label", link.label);
                anchor.innerHTML = this.getSocialIcon(link.id);

                if (!link.href || link.href === "#") {
                    anchor.addEventListener("click", (event) => event.preventDefault());
                }

                return anchor;
            })
        );

        this.profileAvatar.src = profile.avatar;
        this.profileAvatar.addEventListener("error", () => {
            this.profileAvatar.hidden = true;
        });
        this.profileAvatar.addEventListener("load", () => {
            this.profileAvatar.hidden = false;
        });
    }

    attachEvents() {
        this.surface.addEventListener("pointerdown", (event) => this.startDrag(event));
        this.surface.addEventListener("pointermove", this.handleSurfaceMove);
        this.surface.addEventListener("pointerleave", this.resetTilt);

        this.resizeHandles.forEach((handle) => {
            handle.addEventListener("pointerdown", (event) => this.startResize(event, handle.dataset.resize));
        });
        window.addEventListener("resize", this.handleWindowResize);
    }

    startDrag(event) {
        if (event.button !== 0 || event.target.closest("[data-no-drag]")) {
            return;
        }

        event.preventDefault();
        this.pointerAction = {
            type: "drag",
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.state.x,
            originY: this.state.y
        };

        this.root.classList.add("is-dragging");
        this.setMode("dragging");
        this.addPointerListeners();
    }

    startResize(event, direction) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        this.pointerAction = {
            type: "resize",
            direction,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.state.x,
            originY: this.state.y,
            originWidth: this.state.width,
            originHeight: this.state.height
        };

        this.root.classList.add("is-resizing");
        this.setMode("resizing");
        this.addPointerListeners();
    }

    addPointerListeners() {
        window.addEventListener("pointermove", this.handlePointerMove);
        window.addEventListener("pointerup", this.handlePointerUp);
    }

    removePointerListeners() {
        window.removeEventListener("pointermove", this.handlePointerMove);
        window.removeEventListener("pointerup", this.handlePointerUp);
    }

    handlePointerMove(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        if (this.pointerAction.type === "drag") {
            const deltaX = event.clientX - this.pointerAction.startX;
            const deltaY = event.clientY - this.pointerAction.startY;

            this.state.x = this.pointerAction.originX + deltaX;
            this.state.y = this.pointerAction.originY + deltaY;
            this.clampPosition();
            this.applyLayout();
            return;
        }

        const deltaX = event.clientX - this.pointerAction.startX;
        const deltaY = event.clientY - this.pointerAction.startY;
        const direction = this.pointerAction.direction;

        if (direction.includes("e")) {
            this.state.width = this.pointerAction.originWidth + deltaX;
        }

        if (direction.includes("s")) {
            this.state.height = this.pointerAction.originHeight + deltaY;
        }

        this.clampSize();
        this.clampPosition();
        this.applyLayout();
    }

    handlePointerUp(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        const wasDragging = this.pointerAction.type === "drag";
        const wasResizing = this.pointerAction.type === "resize";

        this.pointerAction = null;
        this.root.classList.remove("is-dragging", "is-resizing");
        this.removePointerListeners();

        if (wasDragging) {
            this.setMode("drag ready");
            this.setStatus("Card position updated.");
        }

        if (wasResizing) {
            this.setMode("drag ready");
            this.setStatus("Card size updated.");
        }
    }

    handleSurfaceMove(event) {
        if (this.pointerAction) {
            return;
        }

        const rect = this.surface.getBoundingClientRect();
        const ratioX = (event.clientX - rect.left) / rect.width - 0.5;
        const ratioY = (event.clientY - rect.top) / rect.height - 0.5;
        const tilt = this.config.card.tiltDegrees;
        const tiltX = ratioY * -tilt;
        const tiltY = ratioX * tilt;

        this.surface.classList.add("is-hovered");
        this.surface.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        this.surface.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        this.surface.style.setProperty("--pointer-x", `${((ratioX + 0.5) * 100).toFixed(2)}%`);
        this.surface.style.setProperty("--pointer-y", `${((ratioY + 0.5) * 100).toFixed(2)}%`);
    }

    resetTilt() {
        if (this.pointerAction) {
            return;
        }

        this.surface.classList.remove("is-hovered");
        this.surface.style.setProperty("--tilt-x", "0deg");
        this.surface.style.setProperty("--tilt-y", "0deg");
        this.surface.style.setProperty("--pointer-x", "50%");
        this.surface.style.setProperty("--pointer-y", "50%");
    }

    resetCard(announce = true) {
        const stageRect = this.getStageRect();
        const limits = this.getSizeLimits(stageRect);
        const fitWidth = Math.min(this.config.card.defaultWidth, limits.maxWidth);
        const fitHeight = Math.min(this.config.card.defaultHeight, limits.maxHeight);

        this.state.width = this.clamp(fitWidth, limits.minWidth, limits.maxWidth);
        this.state.height = this.clamp(fitHeight, limits.minHeight, limits.maxHeight);
        this.clampSize();

        this.state.x = Math.max(this.config.card.stagePadding, (stageRect.width - this.state.width) / 2);
        this.state.y = Math.max(this.config.card.stagePadding, (stageRect.height - this.state.height) / 2);
        this.applyLayout();
        this.resetTilt();

        if (announce) {
            this.setMode("re-centered");
            this.setStatus("Card reset to the center.");
        }
    }

    applyLayout() {
        this.root.style.setProperty("--card-width", `${this.state.width}px`);
        this.root.style.setProperty("--card-height", `${this.state.height}px`);
        this.root.style.left = `${this.state.x}px`;
        this.root.style.top = `${this.state.y}px`;
    }

    clampSize() {
        const stageRect = this.getStageRect();
        const limits = this.getSizeLimits(stageRect);

        this.state.width = this.clamp(this.state.width, limits.minWidth, limits.maxWidth);
        this.state.height = this.clamp(this.state.height, limits.minHeight, limits.maxHeight);
    }

    clampPosition() {
        const stageRect = this.getStageRect();
        const min = this.config.card.stagePadding;
        const maxX = Math.max(min, stageRect.width - this.state.width - min);
        const maxY = Math.max(min, stageRect.height - this.state.height - min);

        this.state.x = this.clamp(this.state.x, min, maxX);
        this.state.y = this.clamp(this.state.y, min, maxY);
    }

    handleWindowResize() {
        this.clampSize();
        this.clampPosition();
        this.applyLayout();
    }

    setAudioLevel(level) {
        this.state.audioLevel = this.clamp(level, 0, 1);
        this.surface.style.setProperty("--audio-level", this.state.audioLevel.toFixed(3));
    }

    setAudioReactiveState(payload = {}) {
        const overall = this.clamp(Number(payload.overall) || 0, 0, 1);
        const bass = this.clamp(Number(payload.bass) || 0, 0, 1);
        const pulse = this.clamp(Number(payload.pulse) || 0, 0, 1);
        const intensity = this.clamp(Number(payload.intensity) || 0, 0, 1);
        const level = this.clamp((overall * 0.44 + bass * 0.38 + pulse * 0.18) * intensity, 0, 1);

        this.setAudioLevel(level);
        this.surface.style.setProperty("--audio-pulse", (pulse * intensity).toFixed(3));
    }

    setMode(label) {
        this.modeChip.textContent = label;
        window.clearTimeout(this.messageTimeout);
        this.messageTimeout = window.setTimeout(() => {
            if (!this.pointerAction) {
                this.modeChip.textContent = "drag ready";
            }
        }, 1500);
    }

    setStatus(message) {
        if (typeof this.onStatusChange === "function") {
            this.onStatusChange(message);
        }
    }

    getStageRect() {
        return {
            width: this.stage.clientWidth,
            height: this.stage.clientHeight
        };
    }

    getSizeLimits(stageRect) {
        const availableWidth = Math.max(220, stageRect.width - this.config.card.stagePadding * 2);
        const availableHeight = Math.max(320, stageRect.height - this.config.card.stagePadding * 2);
        const maxWidth = Math.min(this.config.card.maxWidth, availableWidth);
        const maxHeight = Math.min(this.config.card.maxHeight, availableHeight);

        return {
            minWidth: Math.min(this.config.card.minWidth, maxWidth),
            minHeight: Math.min(this.config.card.minHeight, maxHeight),
            maxWidth,
            maxHeight
        };
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    getSocialIcon(id) {
        const icons = {
            facebook: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.5 21v-7.2h2.43l.37-2.8H13.5V9.22c0-.81.23-1.36 1.39-1.36h1.48V5.34c-.26-.03-1.12-.1-2.14-.1-2.11 0-3.55 1.29-3.55 3.66V11H8.3v2.8h2.38V21h2.82Z"/>
                </svg>
            `,
            tiktok: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.8 3c.22 1.84 1.28 3.2 3.06 3.9v2.36c-1.02.1-2.05-.23-3.06-.84v5.35c0 3.2-2.58 5.23-5.72 5.23-3.29 0-5.58-2.44-5.58-5.4 0-3.23 2.46-5.52 5.98-5.4v2.5c-1.93-.24-3.34.95-3.34 2.9 0 1.76 1.34 2.83 2.92 2.83 1.69 0 2.92-1.1 2.92-2.66V3h2.82Z"/>
                </svg>
            `,
            github: `
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.31 6.84 9.66.5.1.68-.22.68-.5 0-.24-.01-1.05-.02-1.9-2.78.62-3.37-1.21-3.37-1.21-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .08 1.53 1.05 1.53 1.05.9 1.56 2.35 1.11 2.92.84.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.09 0-1.13.39-2.06 1.03-2.79-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.06A9.3 9.3 0 0 1 12 6.95c.85 0 1.72.12 2.52.36 1.9-1.33 2.74-1.06 2.74-1.06.56 1.42.21 2.47.1 2.73.64.73 1.03 1.66 1.03 2.79 0 3.96-2.35 4.82-4.59 5.08.36.32.68.95.68 1.92 0 1.39-.01 2.51-.01 2.85 0 .28.18.61.69.5A10.2 10.2 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"/>
                </svg>
            `
        };

        return icons[id] || icons.github;
    }
}

export default CenterCard;
