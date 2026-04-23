class CoreShell {
    constructor({ root, config }) {
        this.root = root;
        this.config = config;
        this.eyebrow = document.getElementById("shellEyebrow");
        this.copyRoot = document.getElementById("shellCopy");
        this.copyPanel = document.getElementById("shellCopyPanel");
        this.copyDragHandle = document.getElementById("shellCopyDragHandle");
        this.copyResizeHandle = document.getElementById("shellCopyResize");
        this.title = document.getElementById("shellTitle");
        this.lead = document.getElementById("shellLead");
        this.badges = document.getElementById("shellBadges");
        this.status = document.getElementById("shellStatus");
        this.resetButton = document.getElementById("resetCardButton");
        this.wordmarkTop = document.getElementById("shellWordmarkTop");
        this.wordmarkBottom = document.getElementById("shellWordmarkBottom");
        this.stage = document.getElementById("shellStage");

        this.copyGeometryStorageKey = "profile.copyPanel.geometry";
        this.copyContentStorageKey = "profile.copyPanel.content";
        this.copyState = {
            x: 0,
            y: 0,
            width: this.config.shell.copyPanel?.defaultWidth ?? 430
        };
        this.pointerAction = null;

        this.handleViewportResize = this.handleViewportResize.bind(this);
        this.handleCopyPointerMove = this.handleCopyPointerMove.bind(this);
        this.handleCopyPointerUp = this.handleCopyPointerUp.bind(this);
        this.handleTitleInput = this.handleTitleInput.bind(this);
        this.handleLeadInput = this.handleLeadInput.bind(this);
    }

    init() {
        this.render();
        this.restoreCopyContent();
        this.attachCopyEditing();
        this.initFloatingCopy();
        this.handleViewportResize();
        window.addEventListener("resize", this.handleViewportResize);
    }

    render() {
        const { shell } = this.config;

        this.eyebrow.textContent = shell.eyebrow;
        this.title.textContent = shell.title;
        this.lead.textContent = shell.lead;
        this.status.textContent = shell.status;
        this.wordmarkTop.textContent = shell.wordmark;
        this.wordmarkBottom.textContent = shell.wordmark;
        this.wordmarkTop.hidden = !shell.wordmark;
        this.wordmarkBottom.hidden = !shell.wordmark;

        this.badges.replaceChildren(
            ...shell.badges.map((label) => {
                const chip = document.createElement("span");
                chip.className = "shell-badge";
                chip.textContent = label;
                return chip;
            })
        );
    }

    restoreCopyContent() {
        try {
            const stored = JSON.parse(localStorage.getItem(this.copyContentStorageKey) || "null");
            if (!stored || typeof stored !== "object") {
                return;
            }

            if (typeof stored.title === "string" && stored.title.trim()) {
                this.title.textContent = stored.title.trim();
            }

            if (typeof stored.lead === "string" && stored.lead.trim()) {
                this.lead.textContent = stored.lead.trim();
            }
        } catch (error) {
            // Ignore invalid localStorage content and keep config defaults.
        }
    }

    attachCopyEditing() {
        this.title.addEventListener("input", this.handleTitleInput);
        this.title.addEventListener("blur", () => this.normalizeEditableField(this.title, this.config.shell.title));
        this.lead.addEventListener("input", this.handleLeadInput);
        this.lead.addEventListener("blur", () => this.normalizeEditableField(this.lead, this.config.shell.lead));
        this.copyDragHandle.addEventListener("pointerdown", (event) => this.startCopyDrag(event));
        this.copyResizeHandle.addEventListener("pointerdown", (event) => this.startCopyResize(event));
    }

    handleTitleInput() {
        this.persistCopyContent();
        this.emitCopyChange();
    }

    handleLeadInput() {
        this.persistCopyContent();
        this.emitCopyChange();
    }

    normalizeEditableField(field, fallback) {
        const value = field.textContent?.replace(/\s+/g, " ").trim();
        field.textContent = value || fallback;
        this.persistCopyContent();
        this.emitCopyChange();
    }

    initFloatingCopy() {
        if (!this.stage || !this.copyRoot || !this.copyPanel) {
            return;
        }

        const stageRect = this.stage.getBoundingClientRect();
        const rootRect = this.copyRoot.getBoundingClientRect();
        const copyConfig = this.config.shell.copyPanel || {};
        const defaults = {
            x: Number.isFinite(copyConfig.defaultX) ? copyConfig.defaultX : Math.max(0, rootRect.left - stageRect.left),
            y: Number.isFinite(copyConfig.defaultY) ? copyConfig.defaultY : Math.max(0, rootRect.top - stageRect.top),
            width: copyConfig.defaultWidth ?? rootRect.width
        };

        this.copyState = { ...defaults };

        try {
            const stored = JSON.parse(localStorage.getItem(this.copyGeometryStorageKey) || "null");
            if (stored && typeof stored === "object") {
                this.copyState.x = Number.isFinite(stored.x) ? stored.x : defaults.x;
                this.copyState.y = Number.isFinite(stored.y) ? stored.y : defaults.y;
                this.copyState.width = Number.isFinite(stored.width) ? stored.width : defaults.width;
            }
        } catch (error) {
            // Ignore invalid geometry payloads.
        }

        this.copyRoot.classList.add("is-floating");
        this.clampCopySize();
        this.clampCopyPosition();
        this.applyCopyLayout();
        this.emitCopyChange();
    }

    startCopyDrag(event) {
        if (event.button !== 0 || event.target.closest("[contenteditable='true'], button, input, textarea, select")) {
            return;
        }

        event.preventDefault();
        this.pointerAction = {
            type: "drag",
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.copyState.x,
            originY: this.copyState.y
        };

        this.copyRoot.classList.add("is-dragging");
        this.addCopyPointerListeners();
    }

    startCopyResize(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.pointerAction = {
            type: "resize",
            pointerId: event.pointerId,
            startX: event.clientX,
            originWidth: this.copyState.width
        };

        this.copyRoot.classList.add("is-resizing");
        this.addCopyPointerListeners();
    }

    addCopyPointerListeners() {
        window.addEventListener("pointermove", this.handleCopyPointerMove);
        window.addEventListener("pointerup", this.handleCopyPointerUp);
    }

    removeCopyPointerListeners() {
        window.removeEventListener("pointermove", this.handleCopyPointerMove);
        window.removeEventListener("pointerup", this.handleCopyPointerUp);
    }

    handleCopyPointerMove(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        if (this.pointerAction.type === "drag") {
            this.copyState.x = this.pointerAction.originX + (event.clientX - this.pointerAction.startX);
            this.copyState.y = this.pointerAction.originY + (event.clientY - this.pointerAction.startY);
            this.clampCopyPosition();
            this.applyCopyLayout();
            return;
        }

        this.copyState.width = this.pointerAction.originWidth + (event.clientX - this.pointerAction.startX);
        this.clampCopySize();
        this.clampCopyPosition();
        this.applyCopyLayout();
    }

    handleCopyPointerUp(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        const wasDragging = this.pointerAction.type === "drag";
        const wasResizing = this.pointerAction.type === "resize";
        this.pointerAction = null;
        this.copyRoot.classList.remove("is-dragging", "is-resizing");
        this.removeCopyPointerListeners();
        this.persistCopyGeometry();
        this.emitCopyChange();

        if (wasDragging) {
            this.setStatus("Intro panel position updated.");
        }

        if (wasResizing) {
            this.setStatus("Intro panel width updated.");
        }
    }

    handleViewportResize() {
        document.documentElement.style.setProperty("--viewport-height", `${window.innerHeight}px`);
        this.root.classList.toggle(
            "is-compact-height",
            window.innerWidth > 1100 && window.innerHeight < 940
        );

        if (this.copyRoot?.classList.contains("is-floating")) {
            this.clampCopySize();
            this.clampCopyPosition();
            this.applyCopyLayout();
            this.persistCopyGeometry();
        }
    }

    clampCopySize() {
        const copyConfig = this.config.shell.copyPanel || {};
        const bounds = this.getCopyBounds();
        const safePadding = copyConfig.safePadding ?? 12;
        const minWidth = copyConfig.minWidth ?? 280;
        const maxWidth = Math.min(copyConfig.maxWidth ?? 620, Math.max(bounds.width - safePadding * 2, minWidth));
        this.copyState.width = this.clamp(this.copyState.width, minWidth, maxWidth);
    }

    clampCopyPosition() {
        const copyConfig = this.config.shell.copyPanel || {};
        const safePadding = copyConfig.safePadding ?? 12;
        const bounds = this.getCopyBounds();
        const panelHeight = this.copyPanel.offsetHeight || 320;
        const maxX = Math.max(safePadding, bounds.width - this.copyState.width - safePadding);
        const maxY = Math.max(safePadding, bounds.height - panelHeight - safePadding);

        this.copyState.x = this.clamp(this.copyState.x, safePadding, maxX);
        this.copyState.y = this.clamp(this.copyState.y, safePadding, maxY);
    }

    applyCopyLayout() {
        this.copyRoot.style.left = `${this.copyState.x}px`;
        this.copyRoot.style.top = `${this.copyState.y}px`;
        this.copyRoot.style.setProperty("--copy-panel-width", `${this.copyState.width}px`);
    }

    persistCopyGeometry() {
        localStorage.setItem(this.copyGeometryStorageKey, JSON.stringify(this.copyState));
    }

    persistCopyContent() {
        const payload = {
            title: this.title.textContent?.trim() || this.config.shell.title,
            lead: this.lead.textContent?.trim() || this.config.shell.lead
        };
        localStorage.setItem(this.copyContentStorageKey, JSON.stringify(payload));
    }

    emitCopyChange() {
        this.root.dispatchEvent(
            new CustomEvent("profile:copychange", {
                bubbles: true,
                detail: this.getCopyState()
            })
        );
    }

    getCopyBounds() {
        return {
            width: this.stage?.clientWidth || window.innerWidth,
            height: this.stage?.clientHeight || window.innerHeight
        };
    }

    getCopyState() {
        return {
            ...this.copyState,
            title: this.title.textContent?.trim() || this.config.shell.title,
            lead: this.lead.textContent?.trim() || this.config.shell.lead
        };
    }

    setCopyContent(nextContent = {}, persist = true) {
        if (typeof nextContent.title === "string") {
            this.title.textContent = nextContent.title || this.config.shell.title;
        }

        if (typeof nextContent.lead === "string") {
            this.lead.textContent = nextContent.lead || this.config.shell.lead;
        }

        if (persist) {
            this.persistCopyContent();
        }

        this.emitCopyChange();
    }

    bindReset(handler) {
        this.resetButton?.addEventListener("click", handler);
    }

    setAudioReactiveState(payload = {}) {
        const overall = this.clamp(Number(payload.overall) || 0, 0, 1);
        const bass = this.clamp(Number(payload.bass) || 0, 0, 1);
        const pulse = this.clamp(Number(payload.pulse) || 0, 0, 1);
        const intensity = this.clamp(Number(payload.intensity) || 0, 0, 1);
        const panelLevel = this.clamp((overall * 0.56 + bass * 0.28 + pulse * 0.16) * intensity, 0, 1);

        this.copyRoot?.style.setProperty("--copy-audio-level", panelLevel.toFixed(3));
        this.copyRoot?.style.setProperty("--copy-audio-pulse", (pulse * intensity).toFixed(3));
    }

    setStatus(message) {
        this.status.textContent = message;
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

export default CoreShell;
