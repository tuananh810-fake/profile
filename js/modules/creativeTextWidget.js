class CreativeTextWidget {
    constructor({ root, config, onStatusChange }) {
        this.root = root;
        this.config = config;
        this.onStatusChange = onStatusChange;
        this.stage = document.getElementById("shellStage");
        this.shell = document.getElementById("creativeWidgetShell");
        this.dragHandle = document.getElementById("creativeWidgetDragHandle");
        this.boxButton = document.getElementById("creativeWidgetBoxBtn");
        this.title = document.getElementById("creativeWidgetTitle");
        this.text = document.getElementById("creativeWidgetText");
        this.resizeHandles = Array.from(this.root.querySelectorAll("[data-creative-resize]"));

        this.storageKey = "profile.creativeWidget.state";
        this.fontPresets = this.config.creativeWidget?.fontPresets || [];
        this.chromeModes = ["boxed", "free"];
        this.textAlignPresets = ["left", "center", "right"];
        this.pointerAction = null;
        this.state = this.getDefaultState();

        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
        this.handleTitleInput = this.handleTitleInput.bind(this);
        this.handleTextInput = this.handleTextInput.bind(this);
    }

    init() {
        this.restoreState();
        this.attachEvents();
        this.root.classList.add("is-floating");
        this.clampSize();
        this.clampPosition();
        this.applyState();
        this.emitChange();
    }

    getDefaultState() {
        const widgetConfig = this.config.creativeWidget || {};
        const bounds = this.getBounds();
        const width = widgetConfig.defaultWidth ?? 280;
        const height = widgetConfig.defaultHeight ?? 240;

        return {
            x: Math.max(widgetConfig.safePadding ?? 12, (bounds.width - width) / 2),
            y: Math.max(widgetConfig.safePadding ?? 12, (bounds.height - height) / 2),
            width,
            height,
            title: widgetConfig.defaultTitle || "Northern Lights",
            body: widgetConfig.defaultBody || "Background\nvisual scene",
            textScale: widgetConfig.defaultTextScale ?? 1,
            fontPreset: widgetConfig.defaultFontPreset || this.fontPresets[0]?.id || "space",
            textAlign: widgetConfig.defaultTextAlign || "center",
            textColor: widgetConfig.defaultTextColor || "#f7fbff",
            accentColor: widgetConfig.defaultAccentColor || "#9feeff",
            chromeMode: widgetConfig.defaultChromeMode || "boxed",
            audioLevel: 0
        };
    }

    restoreState() {
        const defaults = this.getDefaultState();
        this.state = { ...defaults };

        try {
            const stored = JSON.parse(localStorage.getItem(this.storageKey) || "null");
            if (!stored || typeof stored !== "object") {
                return;
            }

            this.state.x = Number.isFinite(stored.x) ? stored.x : defaults.x;
            this.state.y = Number.isFinite(stored.y) ? stored.y : defaults.y;
            this.state.width = Number.isFinite(stored.width) ? stored.width : defaults.width;
            this.state.height = Number.isFinite(stored.height) ? stored.height : defaults.height;
            this.state.title = typeof stored.title === "string" && stored.title.trim() ? stored.title : defaults.title;
            this.state.body = typeof stored.body === "string" && stored.body.trim() ? stored.body : defaults.body;
            this.state.textScale = this.clampTextScale(stored.textScale ?? defaults.textScale);
            this.state.fontPreset = this.getFontPreset(stored.fontPreset)?.id || defaults.fontPreset;
            this.state.textAlign = this.clampTextAlign(stored.textAlign ?? defaults.textAlign);
            this.state.textColor = this.isValidColor(stored.textColor) ? stored.textColor : defaults.textColor;
            this.state.accentColor = this.isValidColor(stored.accentColor) ? stored.accentColor : defaults.accentColor;
            this.state.chromeMode = this.clampChromeMode(stored.chromeMode ?? defaults.chromeMode);
        } catch (error) {
            this.state = defaults;
        }
    }

    attachEvents() {
        this.dragHandle.addEventListener("pointerdown", (event) => this.startDrag(event));
        this.boxButton.addEventListener("click", () => this.toggleChromeMode());
        this.title.addEventListener("input", this.handleTitleInput);
        this.text.addEventListener("input", this.handleTextInput);
        this.title.addEventListener("blur", () => this.normalizeEditable(this.title, "title"));
        this.text.addEventListener("blur", () => this.normalizeEditable(this.text, "body"));
        this.resizeHandles.forEach((handle) => {
            handle.addEventListener("pointerdown", (event) => this.startResize(event, handle.dataset.creativeResize));
        });
        window.addEventListener("resize", this.handleWindowResize);
    }

    handleTitleInput() {
        this.state.title = this.readEditableText(this.title) || this.config.creativeWidget.defaultTitle;
        this.persistState();
        this.emitChange();
    }

    handleTextInput() {
        this.state.body = this.readEditableText(this.text) || this.config.creativeWidget.defaultBody;
        this.persistState();
        this.emitChange();
    }

    normalizeEditable(element, key) {
        const fallback = key === "title"
            ? this.config.creativeWidget.defaultTitle
            : this.config.creativeWidget.defaultBody;
        const value = this.readEditableText(element) || fallback;
        if (key === "title") {
            this.state.title = value;
        } else {
            this.state.body = value;
        }
        this.applyState();
        this.persistState();
        this.emitChange();
    }

    readEditableText(element) {
        return element.innerText.replace(/\n{3,}/g, "\n\n").trim();
    }

    startDrag(event) {
        if (event.button !== 0 || event.target.closest("[contenteditable='true'], button, input, textarea, select")) {
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
            pointerId: event.pointerId,
            direction,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.state.x,
            originY: this.state.y,
            originWidth: this.state.width,
            originHeight: this.state.height
        };

        this.root.classList.add("is-resizing");
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

        const dx = event.clientX - this.pointerAction.startX;
        const dy = event.clientY - this.pointerAction.startY;

        if (this.pointerAction.type === "drag") {
            this.state.x = this.pointerAction.originX + dx;
            this.state.y = this.pointerAction.originY + dy;
            this.clampPosition();
            this.applyState();
            return;
        }

        if (this.pointerAction.direction.includes("e")) {
            this.state.width = this.pointerAction.originWidth + dx;
        }

        if (this.pointerAction.direction.includes("s")) {
            this.state.height = this.pointerAction.originHeight + dy;
        }

        this.clampSize();
        this.clampPosition();
        this.applyState();
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
        this.persistState();
        this.emitChange();

        if (wasDragging) {
            this.setStatus("Creative widget position updated.");
        }

        if (wasResizing) {
            this.setStatus("Creative widget size updated.");
        }
    }

    handleWindowResize() {
        this.clampSize();
        this.clampPosition();
        this.applyState();
        this.persistState();
    }

    toggleChromeMode() {
        this.setChromeMode(this.state.chromeMode === "boxed" ? "free" : "boxed", true);
    }

    setChromeMode(mode, announce = false) {
        const nextMode = this.clampChromeMode(mode);
        if (nextMode === this.state.chromeMode) {
            return;
        }

        this.state.chromeMode = nextMode;
        this.applyState();
        this.persistState();
        this.emitChange();

        if (announce) {
            this.setStatus(nextMode === "boxed" ? "Creative widget frame enabled." : "Creative widget switched to transparent mode.");
        }
    }

    setTypography({
        fontPreset,
        textAlign,
        textScale,
        textColor,
        accentColor,
        chromeMode
    } = {}, persist = true) {
        if (fontPreset) {
            this.state.fontPreset = this.getFontPreset(fontPreset)?.id || this.state.fontPreset;
        }
        if (textAlign) {
            this.state.textAlign = this.clampTextAlign(textAlign);
        }
        if (Number.isFinite(textScale)) {
            this.state.textScale = this.clampTextScale(textScale);
        }
        if (this.isValidColor(textColor)) {
            this.state.textColor = textColor;
        }
        if (this.isValidColor(accentColor)) {
            this.state.accentColor = accentColor;
        }
        if (chromeMode) {
            this.state.chromeMode = this.clampChromeMode(chromeMode);
        }

        this.applyState();
        if (persist) {
            this.persistState();
        }
        this.emitChange();
    }

    setContent({ title, body } = {}, persist = true) {
        if (typeof title === "string") {
            this.state.title = title || this.config.creativeWidget.defaultTitle;
        }
        if (typeof body === "string") {
            this.state.body = body || this.config.creativeWidget.defaultBody;
        }

        this.applyState();
        if (persist) {
            this.persistState();
        }
        this.emitChange();
    }

    setAudioLevel(level) {
        const clamped = Math.min(Math.max(Number(level) || 0, 0), 1);
        this.state.audioLevel = clamped;
        this.root.style.setProperty("--creative-audio-level", clamped.toFixed(3));
    }

    setAudioReactiveState(payload = {}) {
        const overall = Math.min(Math.max(Number(payload.overall) || 0, 0), 1);
        const mid = Math.min(Math.max(Number(payload.mid) || 0, 0), 1);
        const high = Math.min(Math.max(Number(payload.high) || 0, 0), 1);
        const pulse = Math.min(Math.max(Number(payload.pulse) || 0, 0), 1);
        const intensity = Math.min(Math.max(Number(payload.intensity) || 0, 0), 1);
        const level = Math.min(1, (overall * 0.42 + mid * 0.34 + high * 0.12 + pulse * 0.12) * intensity);

        this.setAudioLevel(level);
        this.root.style.setProperty("--creative-audio-pulse", (pulse * intensity).toFixed(3));
    }

    applyState() {
        this.root.style.left = `${this.state.x}px`;
        this.root.style.top = `${this.state.y}px`;
        this.root.style.setProperty("--creative-width", `${this.state.width}px`);
        this.root.style.setProperty("--creative-height", `${this.state.height}px`);
        this.root.style.setProperty("--creative-text-scale", `${this.state.textScale}`);
        this.root.style.setProperty("--creative-text-color", this.state.textColor);
        this.root.style.setProperty("--creative-accent-color", this.state.accentColor);
        this.root.style.setProperty("--creative-font-family", this.getFontPreset(this.state.fontPreset)?.family || "\"Space Grotesk\", sans-serif");
        this.root.dataset.chromeMode = this.state.chromeMode;
        this.root.dataset.textAlign = this.state.textAlign;
        this.title.textContent = this.state.title;
        this.text.textContent = this.state.body;
        this.boxButton.textContent = this.state.chromeMode === "boxed" ? "Box" : "Transparent";
        this.boxButton.setAttribute("aria-pressed", this.state.chromeMode === "boxed" ? "true" : "false");
    }

    persistState() {
        const { audioLevel, ...persisted } = this.state;
        localStorage.setItem(this.storageKey, JSON.stringify(persisted));
    }

    emitChange() {
        this.root.dispatchEvent(
            new CustomEvent("profile:creativechange", {
                bubbles: true,
                detail: this.getState()
            })
        );
    }

    getState() {
        return { ...this.state };
    }

    getFontPresets() {
        return [...this.fontPresets];
    }

    getBounds() {
        return {
            width: this.stage?.clientWidth || window.innerWidth,
            height: this.stage?.clientHeight || window.innerHeight
        };
    }

    clampSize() {
        const widgetConfig = this.config.creativeWidget || {};
        const bounds = this.getBounds();
        const safePadding = widgetConfig.safePadding ?? 12;
        const minWidth = widgetConfig.minWidth ?? 220;
        const minHeight = widgetConfig.minHeight ?? 180;
        const maxWidth = Math.min(widgetConfig.maxWidth ?? 760, Math.max(bounds.width - safePadding * 2, minWidth));
        const maxHeight = Math.min(widgetConfig.maxHeight ?? 620, Math.max(bounds.height - safePadding * 2, minHeight));

        this.state.width = this.clamp(this.state.width, minWidth, maxWidth);
        this.state.height = this.clamp(this.state.height, minHeight, maxHeight);
    }

    clampPosition() {
        const widgetConfig = this.config.creativeWidget || {};
        const safePadding = widgetConfig.safePadding ?? 12;
        const bounds = this.getBounds();
        const maxX = Math.max(safePadding, bounds.width - this.state.width - safePadding);
        const maxY = Math.max(safePadding, bounds.height - this.state.height - safePadding);

        this.state.x = this.clamp(this.state.x, safePadding, maxX);
        this.state.y = this.clamp(this.state.y, safePadding, maxY);
    }

    getFontPreset(presetId) {
        return this.fontPresets.find((preset) => preset.id === presetId) || this.fontPresets[0] || null;
    }

    clampChromeMode(value) {
        return this.chromeModes.includes(value) ? value : "boxed";
    }

    clampTextAlign(value) {
        return this.textAlignPresets.includes(value) ? value : "center";
    }

    clampTextScale(value) {
        const widgetConfig = this.config.creativeWidget || {};
        const min = widgetConfig.minTextScale ?? 0.7;
        const max = widgetConfig.maxTextScale ?? 2.6;
        return Math.min(Math.max(Number(value) || min, min), max);
    }

    isValidColor(value) {
        return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    setStatus(message) {
        if (typeof this.onStatusChange === "function") {
            this.onStatusChange(message);
        }
    }
}

export default CreativeTextWidget;
