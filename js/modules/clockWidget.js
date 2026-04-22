class ClockWidget {
    constructor({ root, config, onStatusChange }) {
        this.root = root;
        this.config = config;
        this.onStatusChange = onStatusChange;

        this.stage = document.getElementById("shellStage");
        this.dragHandle = document.getElementById("clockDragHandle");
        this.dateLabel = document.getElementById("clockDateLabel");
        this.liveTimeLabel = document.getElementById("clockLiveTime");
        this.noteLabel = document.getElementById("clockNote");
        this.stateLabel = document.getElementById("clockState");
        this.timerDisplay = document.getElementById("clockTimerDisplay");
        this.startButton = document.getElementById("clockStartBtn");
        this.resetButton = document.getElementById("clockResetBtn");
        this.modeButtons = Array.from(this.root.querySelectorAll("[data-clock-mode]"));
        this.modeDots = Array.from(this.root.querySelectorAll("[data-clock-dot]"));
        this.resizeHandles = Array.from(this.root.querySelectorAll("[data-clock-resize]"));

        this.geometryStorageKey = "profile.clockWidget.geometry";
        this.modeStorageKey = "profile.clockWidget.mode";
        this.pointerAction = null;
        this.timeTicker = null;
        this.timerTicker = null;
        this.lastTimerTimestamp = 0;

        this.panelState = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        this.state = {
            modeId: this.readStoredMode(),
            remainingSeconds: 0,
            isRunning: false
        };

        this.handlePanelPointerMove = this.handlePanelPointerMove.bind(this);
        this.handlePanelPointerUp = this.handlePanelPointerUp.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    init() {
        this.syncModeState(this.state.modeId, false, false);
        this.attachEvents();
        this.initFloatingPanel();
        this.updateClockText();
        this.startClockTicker();
        this.setStatus("Clock module ready.");
    }

    attachEvents() {
        this.dragHandle.addEventListener("pointerdown", (event) => this.startPanelDrag(event));
        this.resizeHandles.forEach((handle) => {
            handle.addEventListener("pointerdown", (event) => this.startPanelResize(event, handle.dataset.clockResize));
        });

        this.modeButtons.forEach((button) => {
            button.addEventListener("click", () => this.syncModeState(button.dataset.clockMode, true, true));
        });

        this.startButton.addEventListener("click", () => this.toggleTimer());
        this.resetButton.addEventListener("click", () => this.resetTimer(true));
        window.addEventListener("resize", this.handleWindowResize);
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    initFloatingPanel() {
        if (!this.stage) {
            return;
        }

        const stageRect = this.stage.getBoundingClientRect();
        const rootRect = this.root.getBoundingClientRect();
        const defaults = {
            x: Math.max(0, rootRect.left - stageRect.left),
            y: Math.max(0, rootRect.top - stageRect.top),
            width: rootRect.width,
            height: rootRect.height
        };

        this.panelState = { ...defaults };

        try {
            const stored = JSON.parse(localStorage.getItem(this.geometryStorageKey) || "null");
            if (stored && typeof stored === "object") {
                this.panelState.x = Number.isFinite(stored.x) ? stored.x : defaults.x;
                this.panelState.y = Number.isFinite(stored.y) ? stored.y : defaults.y;
                this.panelState.width = Number.isFinite(stored.width) ? stored.width : defaults.width;
                this.panelState.height = Number.isFinite(stored.height) ? stored.height : defaults.height;
            }
        } catch (error) {
            // Ignore invalid stored geometry.
        }

        this.root.classList.add("is-floating");
        this.clampPanelSize();
        this.clampPanelPosition();
        this.applyPanelLayout();
    }

    startClockTicker() {
        this.stopClockTicker();
        this.timeTicker = window.setInterval(() => this.updateClockText(), 1000);
    }

    stopClockTicker() {
        if (this.timeTicker) {
            window.clearInterval(this.timeTicker);
            this.timeTicker = null;
        }
    }

    toggleTimer() {
        if (this.state.isRunning) {
            this.pauseTimer(true);
            return;
        }

        if (this.state.remainingSeconds <= 0) {
            this.resetTimer(false);
        }

        this.startTimer(true);
    }

    startTimer(announce = false) {
        if (this.state.isRunning) {
            return;
        }

        this.state.isRunning = true;
        this.lastTimerTimestamp = Date.now();
        this.root.classList.add("is-running");
        this.stateLabel.textContent = "running";
        this.startButton.textContent = "Pause";
        this.stopTimerTicker();
        this.timerTicker = window.setInterval(() => this.tickTimer(), 250);

        if (announce) {
            this.setStatus(`${this.getActiveMode().label} started.`);
        }
    }

    pauseTimer(announce = false) {
        if (!this.state.isRunning) {
            return;
        }

        this.state.isRunning = false;
        this.root.classList.remove("is-running");
        this.stateLabel.textContent = "paused";
        this.startButton.textContent = "Start";
        this.stopTimerTicker();

        if (announce) {
            this.setStatus(`${this.getActiveMode().label} paused.`);
        }
    }

    stopTimerTicker() {
        if (this.timerTicker) {
            window.clearInterval(this.timerTicker);
            this.timerTicker = null;
        }
    }

    tickTimer() {
        if (!this.state.isRunning) {
            return;
        }

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - this.lastTimerTimestamp) / 1000);
        if (elapsedSeconds <= 0) {
            return;
        }

        this.lastTimerTimestamp += elapsedSeconds * 1000;
        this.state.remainingSeconds = Math.max(0, this.state.remainingSeconds - elapsedSeconds);
        this.updateTimerUi();

        if (this.state.remainingSeconds <= 0) {
            this.pauseTimer(false);
            this.stateLabel.textContent = "done";
            this.setStatus(`${this.getActiveMode().label} complete.`);
        }
    }

    resetTimer(announce = false) {
        this.pauseTimer(false);
        this.state.remainingSeconds = this.getActiveMode().durationMinutes * 60;
        this.stateLabel.textContent = "ready";
        this.updateTimerUi();

        if (announce) {
            this.setStatus(`${this.getActiveMode().label} reset.`);
        }
    }

    syncModeState(modeId, announce = false, resetTimer = true) {
        const mode = this.getMode(modeId);
        if (!mode) {
            return;
        }

        this.state.modeId = mode.id;
        localStorage.setItem(this.modeStorageKey, mode.id);

        this.modeButtons.forEach((button) => {
            const isActive = button.dataset.clockMode === mode.id;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        this.modeDots.forEach((dot) => {
            dot.classList.toggle("is-active", dot.dataset.clockDot === mode.id);
        });

        if (resetTimer) {
            this.resetTimer(false);
        } else {
            this.state.remainingSeconds = mode.durationMinutes * 60;
            this.updateTimerUi();
        }

        this.noteLabel.textContent = `${this.config.clock?.timezoneLabel || "Local time"} • ${this.getTimezoneLabel()} • ${mode.durationMinutes} min`;

        if (announce) {
            this.setStatus(`Clock mode switched to ${mode.label}.`);
        }
    }

    updateClockText() {
        const locale = this.config.clock?.locale || navigator.language || "en-US";
        const now = new Date();
        const dateFormatter = new Intl.DateTimeFormat(locale, {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
        const timeFormatter = new Intl.DateTimeFormat(locale, {
            hour: "numeric",
            minute: "2-digit"
        });

        this.dateLabel.textContent = dateFormatter.format(now).toUpperCase();
        this.liveTimeLabel.textContent = timeFormatter.format(now).toUpperCase();
        this.noteLabel.textContent = `${this.config.clock?.timezoneLabel || "Local time"} • ${this.getTimezoneLabel()} • ${this.getActiveMode().durationMinutes} min`;
    }

    updateTimerUi() {
        this.timerDisplay.textContent = this.formatDuration(this.state.remainingSeconds);

        if (!this.state.isRunning && this.state.remainingSeconds > 0 && this.stateLabel.textContent !== "done") {
            this.stateLabel.textContent = "ready";
        }

        if (this.state.remainingSeconds <= 0 && !this.state.isRunning) {
            this.startButton.textContent = "Restart";
            return;
        }

        this.startButton.textContent = this.state.isRunning ? "Pause" : "Start";
    }

    getTimezoneLabel() {
        const offsetMinutes = -new Date().getTimezoneOffset();
        const sign = offsetMinutes >= 0 ? "+" : "-";
        const absoluteMinutes = Math.abs(offsetMinutes);
        const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
        const minutes = String(absoluteMinutes % 60).padStart(2, "0");

        if (minutes === "00") {
            return `UTC${sign}${Number(hours)}`;
        }

        return `UTC${sign}${hours}:${minutes}`;
    }

    getModes() {
        return this.config.clock?.modes || [];
    }

    getMode(modeId) {
        return this.getModes().find((mode) => mode.id === modeId) || this.getModes()[0] || null;
    }

    getActiveMode() {
        return this.getMode(this.state.modeId);
    }

    readStoredMode() {
        const stored = localStorage.getItem(this.modeStorageKey);
        const isValid = this.getModes().some((mode) => mode.id === stored);
        return isValid ? stored : (this.config.clock?.defaultMode || this.getModes()[0]?.id || "pomodoro");
    }

    formatDuration(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    startPanelDrag(event) {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        this.pointerAction = {
            type: "drag",
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: this.panelState.x,
            originY: this.panelState.y
        };

        this.root.classList.add("is-dragging");
        this.addPanelPointerListeners();
    }

    startPanelResize(event, direction) {
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
            originX: this.panelState.x,
            originY: this.panelState.y,
            originWidth: this.panelState.width,
            originHeight: this.panelState.height
        };

        this.root.classList.add("is-resizing");
        this.addPanelPointerListeners();
    }

    addPanelPointerListeners() {
        window.addEventListener("pointermove", this.handlePanelPointerMove);
        window.addEventListener("pointerup", this.handlePanelPointerUp);
    }

    removePanelPointerListeners() {
        window.removeEventListener("pointermove", this.handlePanelPointerMove);
        window.removeEventListener("pointerup", this.handlePanelPointerUp);
    }

    handlePanelPointerMove(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        const deltaX = event.clientX - this.pointerAction.startX;
        const deltaY = event.clientY - this.pointerAction.startY;

        if (this.pointerAction.type === "drag") {
            this.panelState.x = this.pointerAction.originX + deltaX;
            this.panelState.y = this.pointerAction.originY + deltaY;
            this.clampPanelPosition();
            this.applyPanelLayout();
            return;
        }

        if (this.pointerAction.direction.includes("e")) {
            this.panelState.width = this.pointerAction.originWidth + deltaX;
        }

        if (this.pointerAction.direction.includes("s")) {
            this.panelState.height = this.pointerAction.originHeight + deltaY;
        }

        this.clampPanelSize();
        this.clampPanelPosition();
        this.applyPanelLayout();
    }

    handlePanelPointerUp(event) {
        if (!this.pointerAction || event.pointerId !== this.pointerAction.pointerId) {
            return;
        }

        const wasDragging = this.pointerAction.type === "drag";
        const wasResizing = this.pointerAction.type === "resize";

        this.pointerAction = null;
        this.root.classList.remove("is-dragging", "is-resizing");
        this.removePanelPointerListeners();
        this.persistPanelState();

        if (wasDragging) {
            this.setStatus("Clock module position updated.");
        }

        if (wasResizing) {
            this.setStatus("Clock module size updated.");
        }
    }

    handleWindowResize() {
        if (!this.root.classList.contains("is-floating")) {
            return;
        }

        this.clampPanelSize();
        this.clampPanelPosition();
        this.applyPanelLayout();
        this.persistPanelState();
    }

    handleVisibilityChange() {
        if (document.visibilityState === "visible") {
            this.updateClockText();
            if (this.state.isRunning) {
                this.lastTimerTimestamp = Date.now();
            }
        }
    }

    clampPanelSize() {
        const bounds = this.getPanelBounds();
        const panelConfig = this.config.clockWidget || {};
        const safePadding = panelConfig.safePadding ?? 12;
        const minWidth = panelConfig.minWidth ?? 300;
        const minHeight = panelConfig.minHeight ?? 270;
        const maxWidth = Math.min(panelConfig.maxWidth ?? 460, Math.max(bounds.width - safePadding * 2, minWidth));
        const maxHeight = Math.min(panelConfig.maxHeight ?? 640, Math.max(bounds.height - safePadding * 2, minHeight));

        this.panelState.width = this.clamp(this.panelState.width || maxWidth, minWidth, maxWidth);
        this.panelState.height = this.clamp(this.panelState.height || maxHeight, minHeight, maxHeight);
    }

    clampPanelPosition() {
        const bounds = this.getPanelBounds();
        const safePadding = this.config.clockWidget?.safePadding ?? 12;
        const maxX = Math.max(safePadding, bounds.width - this.panelState.width - safePadding);
        const maxY = Math.max(safePadding, bounds.height - this.panelState.height - safePadding);

        this.panelState.x = this.clamp(this.panelState.x, safePadding, maxX);
        this.panelState.y = this.clamp(this.panelState.y, safePadding, maxY);
    }

    applyPanelLayout() {
        this.root.style.left = `${this.panelState.x}px`;
        this.root.style.top = `${this.panelState.y}px`;
        this.root.style.setProperty("--clock-widget-width", `${this.panelState.width}px`);
        this.root.style.setProperty("--clock-widget-height", `${this.panelState.height}px`);
    }

    persistPanelState() {
        localStorage.setItem(this.geometryStorageKey, JSON.stringify(this.panelState));
    }

    getPanelBounds() {
        return {
            width: this.stage?.clientWidth || window.innerWidth,
            height: this.stage?.clientHeight || window.innerHeight
        };
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    setAudioReactiveState(payload = {}) {
        const overall = this.clamp(Number(payload.overall) || 0, 0, 1);
        const bass = this.clamp(Number(payload.bass) || 0, 0, 1);
        const pulse = this.clamp(Number(payload.pulse) || 0, 0, 1);
        const intensity = this.clamp(Number(payload.intensity) || 0, 0, 1);
        const level = this.clamp((overall * 0.42 + bass * 0.38 + pulse * 0.2) * intensity, 0, 1);

        this.root.style.setProperty("--clock-audio-level", level.toFixed(3));
        this.root.style.setProperty("--clock-audio-pulse", (pulse * intensity).toFixed(3));
    }

    setStatus(message) {
        if (typeof this.onStatusChange === "function") {
            this.onStatusChange(message);
        }
    }
}

export default ClockWidget;
