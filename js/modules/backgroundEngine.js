import LiquidGlassRenderer from "./liquidGlassRenderer.js";

class BackgroundEngine {
    constructor({
        root,
        video,
        image,
        fluidCanvas,
        canvas,
        strokeLayer,
        modeMount,
        videoMount,
        imageMount,
        effectMount,
        config,
        onStatusChange
    }) {
        this.root = root;
        this.video = video;
        this.image = image;
        this.fluidCanvas = fluidCanvas;
        this.canvas = canvas;
        this.strokeLayer = strokeLayer;
        this.modeMount = modeMount;
        this.videoMount = videoMount;
        this.imageMount = imageMount;
        this.effectMount = effectMount;
        this.config = config;
        this.onStatusChange = onStatusChange;
        this.ctx = this.canvas.getContext("2d", {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        }) || this.canvas.getContext("2d");

        this.modeButtons = [];
        this.effectButtons = [];
        this.videoLabel = null;
        this.videoPrevButton = null;
        this.videoNextButton = null;
        this.imageLabel = null;
        this.imagePrevButton = null;
        this.imageNextButton = null;
        this.ambientStrokeLayer = null;
        this.interactiveStrokeLayer = null;
        this.liquidGlassRenderer = null;
        this.motionOverlayActive = false;

        this.customVideoResource = null;
        this.customImageResource = null;
        this.activeVideoSource = "";
        this.activeImageSource = "";
        this.lastInteractiveStampAt = 0;

        this.state = {
            mode: this.readStoredMode(),
            videoIndex: this.readStoredIndex(
                "profile.background.videoScene",
                this.config.background.video.defaultScene,
                this.config.background.video.scenes.length
            ),
            videoOverlayStrength: this.readStoredVideoOverlayStrength(),
            imageIndex: this.readStoredIndex(
                "profile.background.imageScene",
                this.config.background.image.defaultScene,
                this.config.background.image.scenes.length
            ),
            effectPreset: this.readStoredEffectPreset(),
            classicTheme: this.readStoredClassicTheme(),
            effectStyle: this.readStoredEffectStyle()
        };
        this.state.classicPalette = this.readStoredClassicPalette(this.state.classicTheme);
        this.state.liquidPalette = this.readStoredLiquidPalette();
        this.state.northernLightsPalette = this.readStoredNorthernLightsPalette();

        this.strokePlacements = [
            { x: 18, y: 18, rotate: -8, size: 14.5, opacity: 0.72, drift: 18, delay: 0.1 },
            { x: 74, y: 16, rotate: 10, size: 13.2, opacity: 0.7, drift: 20, delay: 0.8 },
            { x: 20, y: 68, rotate: -12, size: 15.6, opacity: 0.78, drift: 22, delay: 1.2 },
            { x: 72, y: 70, rotate: 9, size: 13.8, opacity: 0.72, drift: 19, delay: 0.45 },
            { x: 46, y: 42, rotate: -6, size: 11.2, opacity: 0.58, drift: 17, delay: 1.5 },
            { x: 84, y: 46, rotate: 18, size: 9.8, opacity: 0.48, drift: 16, delay: 0.25 }
        ];

        this.effectsState = {
            particles: [],
            snowflakes: [],
            trails: [],
            bursts: [],
            shockwaves: [],
            pointer: { x: null, y: null, lastX: null, lastY: null },
            rafId: null,
            width: 0,
            height: 0
        };

        this.handleResize = this.handleResize.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerLeave = this.handlePointerLeave.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.animateEffects = this.animateEffects.bind(this);
    }

    init() {
        this.renderControls();
        this.setupMedia();
        this.setupEffects();
        this.applyVideoScene(this.state.videoIndex, false);
        this.applyImageScene(this.state.imageIndex, false);
        this.applyVideoOverlayStrength(this.state.videoOverlayStrength, false);
        this.setEffectPreset(this.state.effectPreset, false);
        this.renderEffectStrokes();
        this.setMode(this.state.mode, false);

        window.addEventListener("resize", this.handleResize);
        window.addEventListener("pointermove", this.handlePointerMove);
        window.addEventListener("pointerleave", this.handlePointerLeave);
        window.addEventListener("pointerdown", this.handlePointerDown);
        this.root.addEventListener("pointerleave", this.handlePointerLeave);

        this.emitChange();
    }

    renderControls() {
        this.modeMount.replaceChildren(this.buildModeGroup());

        const videoSceneGroup = this.buildSceneGroup({
            onPrev: () => this.stepVideoScene(-1),
            onNext: () => this.stepVideoScene(1)
        });
        this.videoPrevButton = videoSceneGroup.prevButton;
        this.videoLabel = videoSceneGroup.label;
        this.videoNextButton = videoSceneGroup.nextButton;
        this.videoMount.replaceChildren(videoSceneGroup.group);

        const imageSceneGroup = this.buildSceneGroup({
            onPrev: () => this.stepImageScene(-1),
            onNext: () => this.stepImageScene(1)
        });
        this.imagePrevButton = imageSceneGroup.prevButton;
        this.imageLabel = imageSceneGroup.label;
        this.imageNextButton = imageSceneGroup.nextButton;
        this.imageMount.replaceChildren(imageSceneGroup.group);

        this.effectMount.replaceChildren(this.buildEffectGroup());
    }

    buildModeGroup() {
        const group = document.createElement("div");
        group.className = "background-control-group";

        this.modeButtons = this.config.background.modes.map((mode) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "background-switch-btn";
            button.textContent = mode.label;
            button.dataset.mode = mode.id;
            button.addEventListener("click", () => this.setMode(mode.id, true));
            group.append(button);
            return button;
        });

        return group;
    }

    buildSceneGroup({ onPrev, onNext }) {
        const group = document.createElement("div");
        group.className = "background-control-group";

        const prevButton = document.createElement("button");
        prevButton.type = "button";
        prevButton.className = "scene-nav-btn";
        prevButton.textContent = "Prev";
        prevButton.addEventListener("click", onPrev);

        const label = document.createElement("div");
        label.className = "scene-label";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.className = "scene-nav-btn";
        nextButton.textContent = "Next";
        nextButton.addEventListener("click", onNext);

        group.append(prevButton, label, nextButton);

        return {
            group,
            prevButton,
            label,
            nextButton
        };
    }

    buildEffectGroup() {
        const group = document.createElement("div");
        group.className = "background-control-group background-control-group--wrap";

        this.effectButtons = this.config.background.effects.presets.map((preset) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "background-switch-btn";
            button.textContent = preset.label;
            button.dataset.preset = preset.id;
            button.addEventListener("click", () => this.setEffectPreset(preset.id, true));
            group.append(button);
            return button;
        });

        return group;
    }

    setupMedia() {
        this.video.muted = true;
        this.video.loop = true;
        this.video.playsInline = true;
        this.video.preload = "metadata";

        this.image.decoding = "async";
        this.image.loading = "eager";
    }

    setupEffects() {
        this.ensureEffectLayers();
        this.ensureLiquidRenderer();
        this.handleResize();
        this.renderEffectStrokes();
        this.syncLiquidRenderer();
    }

    setMotionOverlayActive(active) {
        const nextValue = Boolean(active);
        if (nextValue === this.motionOverlayActive) {
            return;
        }

        this.motionOverlayActive = nextValue;
        this.root.classList.toggle("has-motion-stroke-overlay", nextValue);
        this.syncLiquidRenderer();
    }

    setMode(mode, announce = true) {
        const nextMode = this.getValidMode(mode);
        this.state.mode = nextMode.id;
        this.root.dataset.backgroundMode = nextMode.id;
        localStorage.setItem("profile.background.mode", nextMode.id);

        this.modeButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.mode === nextMode.id);
        });

        if (nextMode.id === "video") {
            this.playVideo();
        } else {
            this.video.pause();
        }

        if (nextMode.id === "effects") {
            this.resetPointerPath();
            this.startEffects();
        } else {
            this.stopEffects();
            this.resetInteractiveEffects();
            this.clearCanvas();
        }

        this.syncLiquidRenderer();

        this.emitChange();

        if (announce) {
            this.setStatus(`Background mode switched to ${nextMode.label}.`);
        }
    }

    setVideoScene(index, announce = true) {
        const scenes = this.config.background.video.scenes;
        if (scenes.length === 0) {
            return;
        }

        this.releaseCustomVideo(false);
        this.applyVideoScene(index, announce);
    }

    stepVideoScene(direction) {
        this.setVideoScene(this.state.videoIndex + direction, true);
    }

    applyVideoScene(index, announce = true) {
        const scenes = this.config.background.video.scenes;
        if (scenes.length === 0) {
            this.videoLabel.textContent = "No videos";
            return;
        }

        const nextIndex = this.normalizeIndex(index, scenes.length);
        const scene = scenes[nextIndex];

        this.state.videoIndex = nextIndex;
        this.videoLabel.textContent = scene.label;
        localStorage.setItem("profile.background.videoScene", String(nextIndex));
        this.applyVideoSource(scene.file);

        if (this.state.mode === "video") {
            this.playVideo();
        }

        this.emitChange();

        if (announce) {
            this.setStatus(`Video background switched to ${scene.label}.`);
        }
    }

    setCustomVideoFile(file, announce = true) {
        if (!file) {
            return;
        }

        this.releaseCustomVideo(false);
        const url = URL.createObjectURL(file);
        const label = this.deriveAssetLabel(file.name);

        this.customVideoResource = { url, label };
        this.videoLabel.textContent = label;
        this.applyVideoSource(url);
        this.setMode("video", false);
        this.playVideo();

        if (announce) {
            this.setStatus(`Custom video applied: ${label}.`);
        }
    }

    applyStoredCustomVideo(blob, label, announce = true) {
        if (!blob) {
            return;
        }

        this.releaseCustomVideo(false);
        const url = URL.createObjectURL(blob);
        const nextLabel = label || "Saved custom video";

        this.customVideoResource = { url, label: nextLabel };
        this.videoLabel.textContent = nextLabel;
        this.applyVideoSource(url);
        this.setMode("video", false);
        this.playVideo();

        if (announce) {
            this.setStatus(`Saved custom video loaded: ${nextLabel}.`);
        }
    }

    clearCustomVideo(announce = true) {
        const hadCustom = Boolean(this.customVideoResource);
        this.releaseCustomVideo(false);
        this.applyVideoScene(this.state.videoIndex, false);

        if (announce) {
            this.setStatus(hadCustom ? "Reverted to built-in video backgrounds." : "Built-in video background is already active.");
        }
    }

    setVideoOverlayStrength(value, announce = false) {
        const nextStrength = this.clampVideoOverlayStrength(value);
        if (nextStrength === this.state.videoOverlayStrength) {
            return;
        }

        this.state.videoOverlayStrength = nextStrength;
        localStorage.setItem("profile.background.videoOverlayStrength", String(nextStrength));
        this.applyVideoOverlayStrength(nextStrength, false);
        this.emitChange();

        if (announce) {
            this.setStatus(`Video cover ${Math.round(nextStrength)}%.`);
        }
    }

    setImageScene(index, announce = true) {
        const scenes = this.config.background.image.scenes;
        if (scenes.length === 0) {
            return;
        }

        this.releaseCustomImage(false);
        this.applyImageScene(index, announce);
    }

    stepImageScene(direction) {
        this.setImageScene(this.state.imageIndex + direction, true);
    }

    applyImageScene(index, announce = true) {
        const scenes = this.config.background.image.scenes;
        if (scenes.length === 0) {
            this.imageLabel.textContent = "No images";
            return;
        }

        const nextIndex = this.normalizeIndex(index, scenes.length);
        const scene = scenes[nextIndex];

        this.state.imageIndex = nextIndex;
        this.imageLabel.textContent = scene.label;
        localStorage.setItem("profile.background.imageScene", String(nextIndex));
        this.applyImageSource(scene.file, scene.label);
        this.emitChange();

        if (announce) {
            this.setStatus(`Image background switched to ${scene.label}.`);
        }
    }

    setCustomImageFile(file, announce = true) {
        if (!file) {
            return;
        }

        this.releaseCustomImage(false);
        const url = URL.createObjectURL(file);
        const label = this.deriveAssetLabel(file.name);

        this.customImageResource = { url, label };
        this.imageLabel.textContent = label;
        this.applyImageSource(url, label);
        this.setMode("image", false);

        if (announce) {
            this.setStatus(`Custom image applied: ${label}.`);
        }
    }

    applyStoredCustomImage(blob, label, announce = true) {
        if (!blob) {
            return;
        }

        this.releaseCustomImage(false);
        const url = URL.createObjectURL(blob);
        const nextLabel = label || "Saved custom image";

        this.customImageResource = { url, label: nextLabel };
        this.imageLabel.textContent = nextLabel;
        this.applyImageSource(url, nextLabel);
        this.setMode("image", false);

        if (announce) {
            this.setStatus(`Saved custom image loaded: ${nextLabel}.`);
        }
    }

    clearCustomImage(announce = true) {
        const hadCustom = Boolean(this.customImageResource);
        this.releaseCustomImage(false);
        this.applyImageScene(this.state.imageIndex, false);

        if (announce) {
            this.setStatus(hadCustom ? "Reverted to built-in image backgrounds." : "Built-in image background is already active.");
        }
    }

    setEffectPreset(presetId, announce = true) {
        const preset = this.getValidEffectPreset(presetId);
        this.state.effectPreset = preset.id;
        this.root.dataset.effectPreset = preset.id;
        localStorage.setItem("profile.background.effectPreset", preset.id);

        this.effectButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.preset === preset.id);
        });

        if (preset.id !== "liquid") {
            this.interactiveStrokeLayer?.replaceChildren();
            this.liquidGlassRenderer?.handlePointerLeave();
        }

        if (preset.id === "classic") {
            this.applyClassicThemeVisuals();
        } else if (preset.id === "liquid") {
            this.applyLiquidPaletteVisuals();
        } else if (preset.id === "northern-lights") {
            this.applyNorthernLightsPaletteVisuals();
        } else {
            this.root.dataset.effectTheme = preset.id;
        }

        if (this.isAuroraClassicTheme()) {
            this.seedAuroraSnow();
        } else {
            this.effectsState.snowflakes = [];
        }

        this.renderEffectStrokes();
        this.syncLiquidRenderer();
        this.emitChange();

        if (announce) {
            this.setStatus(`Effects preset switched to ${preset.label}.`);
        }
    }

    setClassicTheme(themeId, announce = true) {
        const theme = this.getClassicTheme(themeId);
        if (!theme) {
            return;
        }

        this.state.classicTheme = theme.id;
        this.state.classicPalette = { ...theme.palette };
        localStorage.setItem("profile.background.classicTheme", theme.id);
        this.persistClassicPalette();
        this.applyClassicThemeVisuals();
        this.renderEffectStrokes();
        this.emitChange();

        if (announce) {
            this.setStatus(`Neon Classic palette switched to ${theme.label}.`);
        }
    }

    setClassicColor(colorKey, colorValue, announce = false) {
        if (!this.isValidClassicPaletteKey(colorKey) || !this.isValidHexColor(colorValue)) {
            return;
        }

        this.state.classicPalette = {
            ...this.state.classicPalette,
            [colorKey]: colorValue
        };
        this.persistClassicPalette();
        this.applyClassicThemeVisuals();
        this.renderEffectStrokes();
        this.emitChange();

        if (announce) {
            this.setStatus("Neon Classic colors updated.");
        }
    }

    setLiquidColor(colorKey, colorValue, announce = false) {
        if (!this.isValidLiquidPaletteKey(colorKey) || !this.isValidHexColor(colorValue)) {
            return;
        }

        this.state.liquidPalette = {
            ...this.state.liquidPalette,
            [colorKey]: colorValue
        };
        this.persistLiquidPalette();
        this.applyLiquidPaletteVisuals();
        this.renderEffectStrokes();
        this.syncLiquidRenderer();
        this.emitChange();

        if (announce) {
            this.setStatus("Liquid Glass colors updated.");
        }
    }

    setNorthernLightsColor(colorKey, colorValue, announce = false) {
        if (!this.isValidNorthernLightsPaletteKey(colorKey) || !this.isValidHexColor(colorValue)) {
            return;
        }

        this.state.northernLightsPalette = {
            ...this.state.northernLightsPalette,
            [colorKey]: colorValue
        };
        this.persistNorthernLightsPalette();
        this.applyNorthernLightsPaletteVisuals();
        this.renderEffectStrokes();
        this.emitChange();

        if (announce) {
            this.setStatus("Northern Lights colors updated.");
        }
    }

    setEffectStrokeShape(shapeId, announce = true) {
        const shape = this.getStrokeShape(shapeId);
        if (!shape || shape.id === this.state.effectStyle.shape) {
            return;
        }

        this.state.effectStyle.shape = shape.id;
        this.persistEffectStyle();
        this.renderEffectStrokes();
        this.syncLiquidRenderer();
        this.emitChange();

        if (announce) {
            this.setStatus(`Stroke shape switched to ${shape.label}.`);
        }
    }

    setEffectStrokeWidth(value, announce = false) {
        const nextWidth = this.clampEffectStrokeWidth(value);
        if (nextWidth === this.state.effectStyle.width) {
            return;
        }

        this.state.effectStyle.width = nextWidth;
        this.persistEffectStyle();
        this.renderEffectStrokes();
        this.syncLiquidRenderer();
        this.emitChange();

        if (announce) {
            this.setStatus(`Stroke width ${Math.round(nextWidth)}px.`);
        }
    }

    setEffectStrokeScale(value, announce = false) {
        const nextScale = this.clampEffectStrokeScale(value);
        if (nextScale === this.state.effectStyle.scale) {
            return;
        }

        this.state.effectStyle.scale = nextScale;
        this.persistEffectStyle();
        this.renderEffectStrokes();
        this.syncLiquidRenderer();
        this.emitChange();

        if (announce) {
            this.setStatus(`Stroke size ${Math.round(nextScale * 100)}%.`);
        }
    }

    setEffectStrokeSpeed(value, announce = false) {
        const nextSpeed = this.clampEffectStrokeSpeed(value);
        if (nextSpeed === this.state.effectStyle.speed) {
            return;
        }

        this.state.effectStyle.speed = nextSpeed;
        this.persistEffectStyle();
        this.renderEffectStrokes();
        this.syncLiquidRenderer();
        this.emitChange();

        if (announce) {
            this.setStatus(`Stroke speed ${nextSpeed.toFixed(1)}x.`);
        }
    }

    setEffectStrokeDensity(value, announce = false) {
        const nextDensity = this.clampEffectStrokeDensity(value);
        if (nextDensity === this.state.effectStyle.density) {
            return;
        }

        this.state.effectStyle.density = nextDensity;
        this.persistEffectStyle();
        this.renderEffectStrokes();
        this.syncLiquidRenderer();
        this.emitChange();

        if (announce) {
            this.setStatus(`Stroke density ${nextDensity}.`);
        }
    }

    applyVideoSource(source) {
        if (!source || this.activeVideoSource === source) {
            return;
        }

        this.activeVideoSource = source;
        this.video.src = source;
        this.video.load();
    }

    applyImageSource(source, label) {
        if (source && this.activeImageSource !== source) {
            this.activeImageSource = source;
            this.image.src = source;
        }

        this.image.alt = label || "Background image";
    }

    applyVideoOverlayStrength(strength, announce = false) {
        const normalized = this.clampVideoOverlayStrength(strength) / 100;
        const brightness = 1 - normalized * 0.22;
        const saturate = 1 - normalized * 0.02;
        const contrast = 1 + normalized * 0.02;
        const coverOpacity = normalized * 0.82;
        const edgeOpacity = 0.1 + normalized * 0.56;

        this.root.style.setProperty("--video-brightness", brightness.toFixed(3));
        this.root.style.setProperty("--video-saturate", saturate.toFixed(3));
        this.root.style.setProperty("--video-contrast", contrast.toFixed(3));
        this.root.style.setProperty("--video-cover-opacity", coverOpacity.toFixed(3));
        this.root.style.setProperty("--video-cover-edge-opacity", edgeOpacity.toFixed(3));

        if (announce) {
            this.setStatus(`Video cover ${Math.round(this.clampVideoOverlayStrength(strength))}%.`);
        }
    }

    ensureLiquidRenderer() {
        if (this.liquidGlassRenderer || !this.fluidCanvas) {
            return;
        }

        this.liquidGlassRenderer = new LiquidGlassRenderer({
            canvas: this.fluidCanvas,
            config: this.config.background.effects.liquidGlass || {}
        });
        this.liquidGlassRenderer.setStyle(this.state.effectStyle);
        this.liquidGlassRenderer.setPalette(this.getLiquidGlassPalette());
    }

    syncLiquidRenderer() {
        if (!this.liquidGlassRenderer) {
            return;
        }

        const liquidStyle = this.motionOverlayActive
            ? {
                ...this.state.effectStyle,
                density: Math.max(1, this.state.effectStyle.density - 3),
                scale: Math.max(0.66, this.state.effectStyle.scale * 0.8),
                speed: Math.max(0.55, this.state.effectStyle.speed * 0.84),
                lowPower: true
            }
            : this.state.effectStyle;

        this.liquidGlassRenderer.setStyle(liquidStyle);
        this.liquidGlassRenderer.setPalette(this.getLiquidGlassPalette());

        if (this.effectsState.width && this.effectsState.height) {
            this.liquidGlassRenderer.resize(this.effectsState.width, this.effectsState.height);
        }

        this.liquidGlassRenderer.setActive(this.state.mode === "effects" && this.state.effectPreset === "liquid");

        if (this.state.effectPreset === "liquid" && this.liquidGlassRenderer.isReady()) {
            this.ambientStrokeLayer?.replaceChildren();
            this.interactiveStrokeLayer?.replaceChildren();
        }
    }

    ensureEffectLayers() {
        if (!this.strokeLayer) {
            return;
        }

        if (!this.ambientStrokeLayer) {
            this.ambientStrokeLayer = document.createElement("div");
            this.ambientStrokeLayer.className = "effects-stroke-ambient";
        }

        if (!this.interactiveStrokeLayer) {
            this.interactiveStrokeLayer = document.createElement("div");
            this.interactiveStrokeLayer.className = "effects-stroke-interactive";
        }

        if (!this.ambientStrokeLayer.parentElement || !this.interactiveStrokeLayer.parentElement) {
            this.strokeLayer.replaceChildren(this.ambientStrokeLayer, this.interactiveStrokeLayer);
        }
    }

    renderEffectStrokes() {
        this.ensureEffectLayers();
        if (!this.ambientStrokeLayer) {
            return;
        }

        const style = this.state.effectStyle;
        const preset = this.getActiveEffectPreset();

        if (preset.id === "liquid" && this.liquidGlassRenderer?.isReady()) {
            this.ambientStrokeLayer.replaceChildren();
            this.interactiveStrokeLayer?.replaceChildren();
            return;
        }

        const shape = this.getStrokeShape(style.shape);
        if (!shape) {
            this.ambientStrokeLayer.replaceChildren();
            return;
        }

        const motifs = this.strokePlacements
            .slice(0, style.density)
            .map((placement, index) => this.buildStrokeMotif({
                placement,
                index,
                shape,
                style,
                preset
            }));

        this.ambientStrokeLayer.replaceChildren(...motifs);
    }

    buildStrokeMotif({ placement, index, shape, style, preset }) {
        const motif = document.createElement("div");
        motif.className = "effects-stroke-motif";

        const size = placement.size * style.scale;
        const travelDuration = (7.5 + index * 0.9) / style.speed;
        const driftDuration = placement.drift / Math.max(0.55, style.speed * 0.82);
        const strokeWidth = style.width * (0.92 + index * 0.04);

        motif.style.left = `${placement.x}%`;
        motif.style.top = `${placement.y}%`;
        motif.style.setProperty("--stroke-motif-size", `${size}rem`);
        motif.style.setProperty("--stroke-motif-rotation", `${placement.rotate}deg`);
        motif.style.setProperty("--stroke-motif-opacity", String(placement.opacity));
        motif.style.setProperty("--stroke-width", `${strokeWidth}px`);
        motif.style.setProperty("--stroke-dash-duration", `${travelDuration.toFixed(2)}s`);
        motif.style.setProperty("--stroke-drift-duration", `${driftDuration.toFixed(2)}s`);
        motif.style.setProperty("--stroke-delay", `${placement.delay}s`);

        const gradientId = `stroke-gradient-${preset.id}-${shape.id}-${index}`;
        const echoGradientId = `stroke-echo-${preset.id}-${shape.id}-${index}`;
        const trackColor = `rgba(${preset.colors.sparkle}, 0.08)`;
        const shadowColor = `rgba(${preset.colors.link}, 0.12)`;
        const accentA = `rgba(${preset.colors.trailCore}, 0.98)`;
        const accentB = `rgba(${preset.colors.trail}, 0.92)`;
        const accentC = `rgba(${preset.colors.pointerGlow}, 0.86)`;

        motif.innerHTML = this.createStrokeSvgMarkup({
            shape,
            gradientId,
            echoGradientId,
            accentA,
            accentB,
            accentC,
            shadowColor,
            trackColor
        });

        return motif;
    }

    createStrokeSvgMarkup({ shape, gradientId, echoGradientId, accentA, accentB, accentC, shadowColor, trackColor }) {
        return `
            <svg class="effects-stroke-svg" viewBox="0 0 220 220" fill="none" aria-hidden="true">
                <defs>
                    <linearGradient id="${gradientId}" x1="24" y1="38" x2="192" y2="182" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="${accentA}"></stop>
                        <stop offset="48%" stop-color="${accentB}"></stop>
                        <stop offset="100%" stop-color="${accentC}"></stop>
                    </linearGradient>
                    <linearGradient id="${echoGradientId}" x1="28" y1="182" x2="194" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="${accentC}"></stop>
                        <stop offset="52%" stop-color="${accentB}"></stop>
                        <stop offset="100%" stop-color="${accentA}"></stop>
                    </linearGradient>
                </defs>
                <path class="effects-stroke-track-shadow" pathLength="100" d="${shape.path}" stroke="${shadowColor}"></path>
                <path class="effects-stroke-track" pathLength="100" d="${shape.path}" stroke="${trackColor}"></path>
                <path class="effects-stroke-glow" pathLength="100" d="${shape.path}" stroke="url(#${gradientId})"></path>
                <path class="effects-stroke-line" pathLength="100" d="${shape.path}" stroke="url(#${gradientId})"></path>
                <path class="effects-stroke-echo" pathLength="100" d="${shape.path}" stroke="url(#${echoGradientId})"></path>
            </svg>
        `;
    }

    async playVideo() {
        try {
            await this.video.play();
        } catch (error) {
            this.setStatus("Video background loaded, but autoplay is blocked until user interaction.");
        }
    }

    startEffects() {
        this.syncLiquidRenderer();

        if (this.effectsState.rafId) {
            return;
        }

        if (this.effectsState.particles.length === 0) {
            this.seedParticles();
        }

        this.effectsState.rafId = window.requestAnimationFrame(this.animateEffects);
    }

    stopEffects() {
        this.liquidGlassRenderer?.setActive(false);

        if (!this.effectsState.rafId) {
            return;
        }

        window.cancelAnimationFrame(this.effectsState.rafId);
        this.effectsState.rafId = null;
    }

    animateEffects() {
        const { width, height, particles, pointer } = this.effectsState;
        const effectConfig = this.config.background.effects;
        const preset = this.getActiveEffectPreset();
        const colors = preset.colors;
        const isAurora = this.isAuroraClassicTheme();
        const isNorthernLights = preset.id === "northern-lights";
        const isLiquid = preset.id === "liquid";

        if (isLiquid && this.liquidGlassRenderer?.isReady()) {
            this.ctx.clearRect(0, 0, width, height);
            this.effectsState.rafId = window.requestAnimationFrame(this.animateEffects);
            return;
        }

        this.ctx.clearRect(0, 0, width, height);
        this.ctx.save();
        this.ctx.globalCompositeOperation = "lighter";

        if (!isNorthernLights) {
            this.drawPointerGlow(pointer, colors.pointerGlow);
            this.updateTrails(colors);
            this.updateBursts(colors);
            this.updateShockwaves(colors);
        }

        for (let i = 0; i < particles.length; i += 1) {
            const particle = particles[i];

            const particleSpeed = isNorthernLights ? effectConfig.speed * 0.38 : effectConfig.speed;
            particle.x += particle.vx * particleSpeed;
            particle.y += particle.vy * particleSpeed;

            if (particle.x < -20 || particle.x > width + 20) {
                particle.vx *= -1;
            }

            if (particle.y < -20 || particle.y > height + 20) {
                particle.vy *= -1;
            }

            if (pointer.x !== null && pointer.y !== null) {
                const dx = particle.x - pointer.x;
                const dy = particle.y - pointer.y;
                const distance = Math.hypot(dx, dy);

                if (!isNorthernLights && distance < effectConfig.pointerInfluence && distance > 0) {
                    const force = (effectConfig.pointerInfluence - distance) / effectConfig.pointerInfluence;
                    particle.x += (dx / distance) * force * 0.85;
                    particle.y += (dy / distance) * force * 0.85;
                }
            }

            const radius = particle.radius * effectConfig.maxRadius;
            const particleGlow = this.ctx.createRadialGradient(
                particle.x,
                particle.y,
                0,
                particle.x,
                particle.y,
                radius * (isLiquid ? 7.5 : (isNorthernLights ? 3.8 : 5))
            );
            particleGlow.addColorStop(0, `rgba(${colors.particle}, ${particle.alpha * (isLiquid ? 1.05 : (isNorthernLights ? 0.82 : 1.4))})`);
            particleGlow.addColorStop(0.3, `rgba(${colors.particle}, ${particle.alpha * (isLiquid ? 0.26 : (isNorthernLights ? 0.18 : 0.48))})`);
            particleGlow.addColorStop(1, `rgba(${colors.particle}, 0)`);

            this.ctx.beginPath();
            this.ctx.fillStyle = particleGlow;
            this.ctx.arc(particle.x, particle.y, radius * (isNorthernLights ? 3.4 : 5), 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(${colors.sparkle}, ${Math.min(1, particle.alpha * 1.2)})`;
            this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            for (let j = i + 1; j < particles.length; j += 1) {
                const neighbor = particles[j];
                const dx = particle.x - neighbor.x;
                const dy = particle.y - neighbor.y;
                const distance = Math.hypot(dx, dy);

                if (!isNorthernLights && distance < effectConfig.linkDistance) {
                    const opacity = 1 - distance / effectConfig.linkDistance;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(${colors.link}, ${opacity * (isAurora ? 0.12 : (isLiquid ? 0.08 : 0.22))})`;
                    this.ctx.lineWidth = (isAurora ? 0.9 : (isLiquid ? 0.7 : 1.25)) + opacity * (isAurora ? 0.42 : (isLiquid ? 0.24 : 0.65));
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(neighbor.x, neighbor.y);
                    this.ctx.stroke();
                }
            }
        }

        if (isAurora) {
            this.updateAuroraSnow(colors);
        }

        this.ctx.restore();
        this.effectsState.rafId = window.requestAnimationFrame(this.animateEffects);
    }

    seedParticles() {
        const { width, height } = this.effectsState;
        const count = this.config.background.effects.particleCount;

        this.effectsState.particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.random() > 0.5 ? Math.random() + 0.1 : -(Math.random() + 0.1),
            vy: Math.random() > 0.5 ? Math.random() + 0.1 : -(Math.random() + 0.1),
            radius: Math.random() * 0.8 + 0.6,
            alpha: Math.random() * 0.35 + 0.2
        }));
    }

    seedAuroraSnow() {
        const auroraConfig = this.config.background.effects.aurora || {};
        const count = Math.max(0, Math.round(auroraConfig.snowCount ?? 132));

        this.effectsState.snowflakes = Array.from({ length: count }, () => this.createAuroraSnowflake(true));
    }

    createAuroraSnowflake(seedAcrossHeight = true) {
        const auroraConfig = this.config.background.effects.aurora || {};
        const { width, height } = this.effectsState;
        const safeWidth = Math.max(1, width);
        const safeHeight = Math.max(1, height);

        return {
            x: Math.random() * safeWidth,
            y: seedAcrossHeight
                ? Math.random() * safeHeight
                : -Math.random() * Math.max(24, safeHeight * 0.25),
            radius: this.randomBetween(auroraConfig.sizeMin ?? 0.55, auroraConfig.sizeMax ?? 2.2),
            fallSpeed: this.randomBetween(auroraConfig.fallSpeedMin ?? 0.22, auroraConfig.fallSpeedMax ?? 0.84),
            driftAmplitude: this.randomBetween(auroraConfig.driftAmplitudeMin ?? 0.08, auroraConfig.driftAmplitudeMax ?? 0.34),
            swaySpeed: this.randomBetween(auroraConfig.swaySpeedMin ?? 0.45, auroraConfig.swaySpeedMax ?? 1.25),
            twinkleSpeed: this.randomBetween(auroraConfig.twinkleSpeedMin ?? 0.7, auroraConfig.twinkleSpeedMax ?? 2.15),
            alpha: this.randomBetween(auroraConfig.alphaMin ?? 0.24, auroraConfig.alphaMax ?? 0.88),
            wind: this.randomBetween(auroraConfig.windMin ?? -0.03, auroraConfig.windMax ?? 0.03),
            phase: Math.random() * Math.PI * 2,
            driftOffset: 0
        };
    }

    resetAuroraSnowflake(flake, spawnFromTop = true) {
        Object.assign(flake, this.createAuroraSnowflake(!spawnFromTop));
    }

    handleResize() {
        const dprCap = window.profilePerformance?.getCanvasDprCap?.() || 1.6;
        const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
        const width = this.root.clientWidth || this.canvas.clientWidth || window.innerWidth;
        const height = this.root.clientHeight || this.canvas.clientHeight || window.innerHeight;

        this.effectsState.width = width;
        this.effectsState.height = height;
        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.seedParticles();
        if (this.isAuroraClassicTheme()) {
            this.seedAuroraSnow();
        } else {
            this.effectsState.snowflakes = [];
        }
        this.renderEffectStrokes();
        this.liquidGlassRenderer?.resize(width, height);
        this.syncLiquidRenderer();
    }

    handlePointerMove(event) {
        const point = this.getLocalPoint(event);
        if (!point) {
            this.handlePointerLeave();
            return;
        }

        this.effectsState.pointer.x = point.x;
        this.effectsState.pointer.y = point.y;

        if (this.state.mode !== "effects") {
            this.resetPointerPath();
            return;
        }

        const allowInteractive = !this.isUiTarget(event.target);
        const trailConfig = this.config.background.effects.trail;
        const { pointer } = this.effectsState;

        const deltaX = pointer.lastX === null ? 0 : point.x - pointer.lastX;
        const deltaY = pointer.lastY === null ? 0 : point.y - pointer.lastY;

        if (this.state.effectPreset === "liquid" && this.liquidGlassRenderer?.isReady()) {
            this.liquidGlassRenderer.handlePointerMove(point, {
                allowInteractive,
                pressure: event.pressure || 0,
                deltaX,
                deltaY
            });
            pointer.lastX = point.x;
            pointer.lastY = point.y;
            return;
        }

        if (pointer.lastX !== null && pointer.lastY !== null) {
            const distance = Math.hypot(deltaX, deltaY);

            if (distance >= trailConfig.spawnDistance && allowInteractive) {
                const steps = Math.min(6, Math.ceil(distance / trailConfig.spawnDistance));

                for (let step = 1; step <= steps; step += 1) {
                    const fromRatio = (step - 1) / steps;
                    const toRatio = step / steps;

                    this.spawnTrail(
                        pointer.lastX + deltaX * fromRatio,
                        pointer.lastY + deltaY * fromRatio,
                        pointer.lastX + deltaX * toRatio,
                        pointer.lastY + deltaY * toRatio
                    );
                }
            }
        }

        if (allowInteractive) {
            this.maybeSpawnLiquidStamp(point, event);
        }

        pointer.lastX = point.x;
        pointer.lastY = point.y;
    }

    handlePointerLeave() {
        this.effectsState.pointer.x = null;
        this.effectsState.pointer.y = null;
        this.resetPointerPath();
        this.liquidGlassRenderer?.handlePointerLeave();
    }

    handlePointerDown(event) {
        if (this.state.mode !== "effects" || this.isUiTarget(event.target)) {
            return;
        }

        const point = this.getLocalPoint(event);
        if (!point) {
            return;
        }

        this.effectsState.pointer.x = point.x;
        this.effectsState.pointer.y = point.y;
        this.effectsState.pointer.lastX = point.x;
        this.effectsState.pointer.lastY = point.y;

        if (this.state.effectPreset === "liquid" && this.liquidGlassRenderer?.isReady()) {
            this.liquidGlassRenderer.handlePointerDown(point, {
                pressure: event.pressure || 0
            });
            return;
        }

        this.spawnBurst(point.x, point.y);
        this.spawnLiquidRipple(point);
        this.spawnLiquidStamp(point, 1.08);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.effectsState.width, this.effectsState.height);
        this.liquidGlassRenderer?.clear();
    }

    getLocalPoint(event) {
        const anchor = this.canvas || this.root;
        const rect = anchor.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return null;
        }

        if (
            event.clientX < rect.left
            || event.clientX > rect.right
            || event.clientY < rect.top
            || event.clientY > rect.bottom
        ) {
            return null;
        }

        return {
            x: Math.min(Math.max(event.clientX - rect.left, 0), rect.width),
            y: Math.min(Math.max(event.clientY - rect.top, 0), rect.height)
        };
    }

    maybeSpawnLiquidStamp(point) {
        if (this.state.effectPreset !== "liquid" || !this.interactiveStrokeLayer) {
            return;
        }

        const liquidConfig = this.config.background.effects.liquidGlass || {};
        const distance = this.effectsState.pointer.lastX === null
            ? Infinity
            : Math.hypot(point.x - this.effectsState.pointer.lastX, point.y - this.effectsState.pointer.lastY);
        const now = performance.now();
        const minDistance = liquidConfig.trailSpawnDistance ?? 28;

        if (distance < minDistance || now - this.lastInteractiveStampAt < 42) {
            return;
        }

        this.lastInteractiveStampAt = now;
        this.spawnLiquidStamp(point, 0.74 + Math.min(0.3, distance / 160));
    }

    spawnLiquidStamp(point, scaleBoost = 1) {
        if (this.state.effectPreset !== "liquid" || !this.interactiveStrokeLayer) {
            return;
        }

        const style = this.state.effectStyle;
        const preset = this.getActiveEffectPreset();
        const shape = this.getStrokeShape(style.shape);
        if (!shape) {
            return;
        }

        const motif = document.createElement("div");
        motif.className = "effects-stroke-motif effects-stroke-motif--interactive";
        motif.style.left = `${point.x}px`;
        motif.style.top = `${point.y}px`;
        motif.style.setProperty("--stroke-motif-size", `${(7.6 + style.scale * 5.4).toFixed(2)}rem`);
        motif.style.setProperty("--stroke-motif-rotation", `${this.randomBetween(-22, 22).toFixed(2)}deg`);
        motif.style.setProperty("--stroke-motif-opacity", "1");
        motif.style.setProperty("--stroke-width", `${Math.max(2.8, style.width * 0.84)}px`);
        motif.style.setProperty("--stroke-live-scale", String(scaleBoost));
        motif.style.setProperty("--stroke-live-duration", `${this.config.background.effects.liquidGlass?.stampLifeMs ?? 920}ms`);

        const uid = `${Date.now()}-${Math.round(Math.random() * 9999)}`;
        motif.innerHTML = this.createStrokeSvgMarkup({
            shape,
            gradientId: `liquid-stroke-${uid}`,
            echoGradientId: `liquid-echo-${uid}`,
            accentA: `rgba(${preset.colors.trailCore}, 0.98)`,
            accentB: `rgba(${preset.colors.trail}, 0.94)`,
            accentC: `rgba(${preset.colors.pointerGlow}, 0.88)`,
            shadowColor: `rgba(${preset.colors.link}, 0.08)`,
            trackColor: `rgba(${preset.colors.sparkle}, 0.04)`
        });

        motif.addEventListener("animationend", () => motif.remove(), { once: true });
        this.interactiveStrokeLayer.append(motif);
    }

    spawnLiquidRipple(point) {
        if (this.state.effectPreset !== "liquid" || !this.interactiveStrokeLayer) {
            return;
        }

        const liquidConfig = this.config.background.effects.liquidGlass || {};
        const ripple = document.createElement("div");
        ripple.className = "effects-liquid-ripple";
        ripple.style.left = `${point.x}px`;
        ripple.style.top = `${point.y}px`;
        ripple.style.setProperty(
            "--liquid-ripple-size",
            `${(liquidConfig.rippleBaseSize ?? 120) + this.state.effectStyle.scale * (liquidConfig.rippleScaleBoost ?? 32)}px`
        );
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
        this.interactiveStrokeLayer.append(ripple);
    }

    spawnTrail(fromX, fromY, toX, toY) {
        const trailConfig = this.config.background.effects.trail;
        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        const length = Math.hypot(deltaX, deltaY);

        this.effectsState.trails.push({
            fromX,
            fromY,
            toX,
            toY,
            length,
            life: trailConfig.life,
            maxLife: trailConfig.life,
            width: trailConfig.width
        });

        if (this.effectsState.trails.length > trailConfig.maxPoints) {
            this.effectsState.trails.splice(0, this.effectsState.trails.length - trailConfig.maxPoints);
        }
    }

    spawnBurst(x, y) {
        const burstConfig = this.config.background.effects.burst;
        const ringConfig = this.config.background.effects.ring;

        this.effectsState.shockwaves.push({
            x,
            y,
            life: ringConfig.life,
            maxLife: ringConfig.life,
            radius: ringConfig.startRadius
        });

        for (let i = 0; i < burstConfig.count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = this.randomBetween(burstConfig.speedMin, burstConfig.speedMax);

            this.effectsState.bursts.push({
                x,
                y,
                previousX: x,
                previousY: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: this.randomBetween(burstConfig.radiusMin, burstConfig.radiusMax),
                life: burstConfig.life,
                maxLife: burstConfig.life
            });
        }
    }

    updateTrails(colors) {
        const trailConfig = this.config.background.effects.trail;

        for (let i = this.effectsState.trails.length - 1; i >= 0; i -= 1) {
            const trail = this.effectsState.trails[i];
            trail.life -= 1;

            if (trail.life <= 0) {
                this.effectsState.trails.splice(i, 1);
                continue;
            }

            const alpha = trail.life / trail.maxLife;
            const strength = Math.min(1.4, 0.7 + trail.length / 32);
            const glowGradient = this.ctx.createLinearGradient(trail.fromX, trail.fromY, trail.toX, trail.toY);
            glowGradient.addColorStop(0, `rgba(${colors.trail}, 0)`);
            glowGradient.addColorStop(0.4, `rgba(${colors.trail}, ${alpha * 0.24 * strength})`);
            glowGradient.addColorStop(1, `rgba(${colors.trail}, ${alpha * 0.58 * strength})`);

            this.ctx.beginPath();
            this.ctx.lineCap = "round";
            this.ctx.strokeStyle = glowGradient;
            this.ctx.lineWidth = trail.width + trailConfig.glowBoost * alpha * strength;
            this.ctx.moveTo(trail.fromX, trail.fromY);
            this.ctx.lineTo(trail.toX, trail.toY);
            this.ctx.stroke();

            const coreGradient = this.ctx.createLinearGradient(trail.fromX, trail.fromY, trail.toX, trail.toY);
            coreGradient.addColorStop(0, `rgba(${colors.trailCore}, ${alpha * 0.08})`);
            coreGradient.addColorStop(0.55, `rgba(${colors.sparkle}, ${alpha * 0.46})`);
            coreGradient.addColorStop(1, `rgba(${colors.trailCore}, ${alpha * 1.18})`);

            this.ctx.beginPath();
            this.ctx.strokeStyle = coreGradient;
            this.ctx.lineWidth = Math.max(1.25, trail.width * (1.1 + alpha * 0.55));
            this.ctx.moveTo(trail.fromX, trail.fromY);
            this.ctx.lineTo(trail.toX, trail.toY);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(${colors.sparkle}, ${alpha * 0.95})`;
            this.ctx.arc(trail.toX, trail.toY, Math.max(1.2, trail.width * (0.7 + alpha * 1.35)), 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateBursts(colors) {
        const burstConfig = this.config.background.effects.burst;

        for (let i = this.effectsState.bursts.length - 1; i >= 0; i -= 1) {
            const burst = this.effectsState.bursts[i];
            burst.life -= 1;

            if (burst.life <= 0) {
                this.effectsState.bursts.splice(i, 1);
                continue;
            }

            burst.previousX = burst.x;
            burst.previousY = burst.y;
            burst.x += burst.vx;
            burst.y += burst.vy;
            burst.vx *= burstConfig.friction;
            burst.vy *= burstConfig.friction;

            const alpha = burst.life / burst.maxLife;

            this.ctx.beginPath();
            this.ctx.lineCap = "round";
            this.ctx.strokeStyle = `rgba(${colors.burst}, ${alpha * 0.5})`;
            this.ctx.lineWidth = burst.radius * 4.8;
            this.ctx.moveTo(burst.previousX, burst.previousY);
            this.ctx.lineTo(burst.x, burst.y);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(${colors.burstCore}, ${alpha})`;
            this.ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(${colors.sparkle}, ${alpha * 0.34})`;
            this.ctx.arc(burst.x, burst.y, burst.radius * 4.8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateShockwaves(colors) {
        const ringConfig = this.config.background.effects.ring;

        for (let i = this.effectsState.shockwaves.length - 1; i >= 0; i -= 1) {
            const ring = this.effectsState.shockwaves[i];
            ring.life -= 1;

            if (ring.life <= 0) {
                this.effectsState.shockwaves.splice(i, 1);
                continue;
            }

            const alpha = ring.life / ring.maxLife;
            const progress = 1 - alpha;
            ring.radius = ringConfig.startRadius + (ringConfig.endRadius - ringConfig.startRadius) * progress;

            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${colors.ring}, ${alpha * 0.42})`;
            this.ctx.lineWidth = ringConfig.lineWidth + alpha * 4;
            this.ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${colors.ringCore}, ${alpha * 0.74})`;
            this.ctx.lineWidth = Math.max(1.2, ringConfig.lineWidth * 0.42);
            this.ctx.arc(ring.x, ring.y, ring.radius * (0.92 + progress * 0.16), 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    updateAuroraSnow(colors) {
        const auroraConfig = this.config.background.effects.aurora || {};
        const { snowflakes, width, height, pointer } = this.effectsState;
        if (snowflakes.length === 0) {
            this.seedAuroraSnow();
        }

        const time = performance.now() * 0.001;
        const pointerInfluence = auroraConfig.pointerInfluence ?? 124;

        for (let i = 0; i < this.effectsState.snowflakes.length; i += 1) {
            const flake = this.effectsState.snowflakes[i];
            const swayOffset = Math.sin(time * flake.swaySpeed + flake.phase) * flake.driftAmplitude;
            flake.x += swayOffset - flake.driftOffset + flake.wind;
            flake.driftOffset = swayOffset;
            flake.y += flake.fallSpeed;

            if (pointer.x !== null && pointer.y !== null) {
                const dx = flake.x - pointer.x;
                const dy = flake.y - pointer.y;
                const distance = Math.hypot(dx, dy);

                if (distance < pointerInfluence && distance > 0) {
                    const force = (pointerInfluence - distance) / pointerInfluence;
                    flake.x += (dx / distance) * force * 0.32;
                    flake.y += force * 0.08;
                }
            }

            if (flake.y > height + 18) {
                this.resetAuroraSnowflake(flake, true);
                continue;
            }

            if (flake.x < -18) {
                flake.x = width + 12;
            } else if (flake.x > width + 18) {
                flake.x = -12;
            }

            const twinkle = 0.7 + Math.sin(time * flake.twinkleSpeed + flake.phase) * 0.3;
            const alpha = flake.alpha * twinkle;
            const glowRadius = flake.radius * 4.8;
            const glow = this.ctx.createRadialGradient(
                flake.x,
                flake.y,
                0,
                flake.x,
                flake.y,
                glowRadius
            );
            glow.addColorStop(0, `rgba(${colors.trailCore}, ${alpha * 0.76})`);
            glow.addColorStop(0.36, `rgba(${colors.sparkle}, ${alpha * 0.32})`);
            glow.addColorStop(1, `rgba(${colors.sparkle}, 0)`);

            this.ctx.beginPath();
            this.ctx.fillStyle = glow;
            this.ctx.arc(flake.x, flake.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(${colors.trailCore}, ${Math.min(1, alpha * 1.08)})`;
            this.ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPointerGlow(pointer, color) {
        if (pointer.x === null || pointer.y === null || this.state.mode !== "effects") {
            return;
        }

        const isLiquid = this.state.effectPreset === "liquid";
        const isNorthernLights = this.state.effectPreset === "northern-lights";
        if (isLiquid || isNorthernLights) {
            return;
        }

        const radius = isNorthernLights ? 96 : (isLiquid ? 156 : 108);
        const gradient = this.ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);
        gradient.addColorStop(0, `rgba(${color}, ${isNorthernLights ? 0.24 : (isLiquid ? 0.24 : 0.42)})`);
        gradient.addColorStop(0.22, `rgba(${color}, ${isNorthernLights ? 0.12 : (isLiquid ? 0.14 : 0.22)})`);
        gradient.addColorStop(0.55, `rgba(${color}, ${isNorthernLights ? 0.04 : (isLiquid ? 0.06 : 0.1)})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);

        this.ctx.beginPath();
        this.ctx.fillStyle = gradient;
        this.ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (!isLiquid && !isNorthernLights) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${color}, 0.2)`;
            this.ctx.lineWidth = 2.4;
            this.ctx.moveTo(pointer.x - 28, pointer.y);
            this.ctx.lineTo(pointer.x + 28, pointer.y);
            this.ctx.moveTo(pointer.x, pointer.y - 28);
            this.ctx.lineTo(pointer.x, pointer.y + 28);
            this.ctx.stroke();
        }
    }

    resetPointerPath() {
        this.effectsState.pointer.lastX = null;
        this.effectsState.pointer.lastY = null;
    }

    resetInteractiveEffects() {
        this.effectsState.trails = [];
        this.effectsState.bursts = [];
        this.effectsState.shockwaves = [];
        this.resetPointerPath();
        this.lastInteractiveStampAt = 0;
        this.interactiveStrokeLayer?.replaceChildren();
        this.liquidGlassRenderer?.handlePointerLeave();
    }

    isUiTarget(target) {
        return Boolean(
            target?.closest?.(
                ".background-control-group, .hud-button, .card-handle, .profile-social-link, .lyrics-overlay, .music-dock, .focus-player, .shell-footer, .shell-hud, .customizer-panel, .shell-copy, .creative-widget, .clock-widget"
            )
        );
    }

    readStoredMode() {
        const stored = localStorage.getItem("profile.background.mode");
        const isValid = this.config.background.modes.some((mode) => mode.id === stored);
        return isValid ? stored : this.config.background.defaultMode;
    }

    readStoredVideoOverlayStrength() {
        const stored = Number(localStorage.getItem("profile.background.videoOverlayStrength"));
        if (!Number.isFinite(stored)) {
            return this.clampVideoOverlayStrength(this.config.background.video.defaultOverlayStrength ?? 42);
        }

        return this.clampVideoOverlayStrength(stored);
    }

    readStoredIndex(storageKey, fallback, length) {
        const stored = Number(localStorage.getItem(storageKey));
        if (!Number.isInteger(stored) || length <= 0) {
            return fallback;
        }

        return this.normalizeIndex(stored, length);
    }

    readStoredEffectPreset() {
        const stored = localStorage.getItem("profile.background.effectPreset");
        const normalized = this.normalizeLegacyEffectPreset(stored);
        const isValid = this.config.background.effects.presets.some((preset) => preset.id === normalized);
        return isValid ? normalized : this.config.background.effects.defaultPreset;
    }

    readStoredClassicTheme() {
        const storedTheme = localStorage.getItem("profile.background.classicTheme");
        const legacyTheme = this.normalizeLegacyClassicTheme(localStorage.getItem("profile.background.effectPreset"));
        const candidate = this.normalizeLegacyClassicTheme(storedTheme) || legacyTheme;
        return this.getClassicTheme(candidate)?.id
            || this.getClassicTheme(this.config.background.effects.defaultClassicTheme)?.id
            || this.getClassicThemes()[0]?.id
            || "ember";
    }

    readStoredClassicPalette(themeId) {
        const theme = this.getClassicTheme(themeId);
        const defaults = {
            ...(theme?.palette || {})
        };

        try {
            const stored = JSON.parse(localStorage.getItem("profile.background.classicPalette") || "null");
            if (!stored || typeof stored !== "object") {
                return defaults;
            }

            return {
                glowA: this.isValidHexColor(stored.glowA) ? stored.glowA : defaults.glowA,
                glowB: this.isValidHexColor(stored.glowB) ? stored.glowB : defaults.glowB,
                glowC: this.isValidHexColor(stored.glowC) ? stored.glowC : defaults.glowC,
                baseTop: this.isValidHexColor(stored.baseTop) ? stored.baseTop : defaults.baseTop,
                baseBottom: this.isValidHexColor(stored.baseBottom) ? stored.baseBottom : defaults.baseBottom
            };
        } catch (error) {
            return defaults;
        }
    }

    readStoredLiquidPalette() {
        const defaults = {
            ...(this.config.background.effects.liquidGlass?.fluid || {})
        };

        try {
            const stored = JSON.parse(localStorage.getItem("profile.background.liquidPalette") || "null");
            if (!stored || typeof stored !== "object") {
                return defaults;
            }

            return {
                accentA: this.isValidHexColor(stored.accentA) ? stored.accentA : defaults.accentA,
                accentB: this.isValidHexColor(stored.accentB) ? stored.accentB : defaults.accentB,
                accentC: this.isValidHexColor(stored.accentC) ? stored.accentC : defaults.accentC,
                glare: this.isValidHexColor(stored.glare) ? stored.glare : defaults.glare,
                baseTop: this.isValidHexColor(stored.baseTop) ? stored.baseTop : defaults.baseTop,
                baseBottom: this.isValidHexColor(stored.baseBottom) ? stored.baseBottom : defaults.baseBottom
            };
        } catch (error) {
            return defaults;
        }
    }

    readStoredNorthernLightsPalette() {
        const defaults = {
            ...(this.config.background.effects.northernLights?.palette || {})
        };

        try {
            const stored = JSON.parse(localStorage.getItem("profile.background.northernLightsPalette") || "null");
            if (!stored || typeof stored !== "object") {
                return defaults;
            }

            return {
                veilA: this.isValidHexColor(stored.veilA) ? stored.veilA : defaults.veilA,
                veilB: this.isValidHexColor(stored.veilB) ? stored.veilB : defaults.veilB,
                veilC: this.isValidHexColor(stored.veilC) ? stored.veilC : defaults.veilC,
                skyTop: this.isValidHexColor(stored.skyTop) ? stored.skyTop : defaults.skyTop,
                skyBottom: this.isValidHexColor(stored.skyBottom) ? stored.skyBottom : defaults.skyBottom,
                stars: this.isValidHexColor(stored.stars) ? stored.stars : defaults.stars
            };
        } catch (error) {
            return defaults;
        }
    }

    readStoredEffectStyle() {
        const strokeConfig = this.config.background.effects.stroke || {};
        const defaults = {
            shape: strokeConfig.defaultShape || strokeConfig.shapes?.[0]?.id || "orbit",
            width: this.clampEffectStrokeWidth(strokeConfig.defaultWidth ?? 10),
            scale: this.clampEffectStrokeScale(strokeConfig.defaultScale ?? 1),
            speed: this.clampEffectStrokeSpeed(strokeConfig.defaultSpeed ?? 1),
            density: this.clampEffectStrokeDensity(strokeConfig.defaultDensity ?? 4)
        };

        try {
            const stored = JSON.parse(localStorage.getItem("profile.background.effectStyle") || "null");
            if (!stored || typeof stored !== "object") {
                return defaults;
            }

            return {
                shape: this.getStrokeShape(stored.shape)?.id || defaults.shape,
                width: this.clampEffectStrokeWidth(stored.width ?? defaults.width),
                scale: this.clampEffectStrokeScale(stored.scale ?? defaults.scale),
                speed: this.clampEffectStrokeSpeed(stored.speed ?? defaults.speed),
                density: this.clampEffectStrokeDensity(stored.density ?? defaults.density)
            };
        } catch (error) {
            return defaults;
        }
    }

    persistEffectStyle() {
        localStorage.setItem("profile.background.effectStyle", JSON.stringify(this.state.effectStyle));
    }

    persistClassicPalette() {
        localStorage.setItem("profile.background.classicPalette", JSON.stringify(this.state.classicPalette));
    }

    persistLiquidPalette() {
        localStorage.setItem("profile.background.liquidPalette", JSON.stringify(this.state.liquidPalette));
    }

    persistNorthernLightsPalette() {
        localStorage.setItem("profile.background.northernLightsPalette", JSON.stringify(this.state.northernLightsPalette));
    }

    releaseCustomVideo(reapply = false) {
        if (this.customVideoResource?.url) {
            URL.revokeObjectURL(this.customVideoResource.url);
        }

        this.customVideoResource = null;

        if (reapply) {
            this.applyVideoScene(this.state.videoIndex, false);
        }
    }

    releaseCustomImage(reapply = false) {
        if (this.customImageResource?.url) {
            URL.revokeObjectURL(this.customImageResource.url);
        }

        this.customImageResource = null;

        if (reapply) {
            this.applyImageScene(this.state.imageIndex, false);
        }
    }

    getValidMode(modeId) {
        return this.config.background.modes.find((mode) => mode.id === modeId)
            || this.config.background.modes.find((mode) => mode.id === this.config.background.defaultMode)
            || this.config.background.modes[0];
    }

    getValidEffectPreset(presetId) {
        return this.config.background.effects.presets.find((preset) => preset.id === presetId)
            || this.config.background.effects.presets.find((preset) => preset.id === this.config.background.effects.defaultPreset)
            || this.config.background.effects.presets[0];
    }

    getClassicThemes() {
        return this.config.background.effects.classicThemes || [];
    }

    getClassicTheme(themeId) {
        return this.getClassicThemes().find((theme) => theme.id === themeId)
            || this.getClassicThemes().find((theme) => theme.id === this.config.background.effects.defaultClassicTheme)
            || this.getClassicThemes()[0]
            || null;
    }

    getStrokeShapes() {
        return this.config.background.effects.stroke?.shapes || [];
    }

    getStrokeShape(shapeId) {
        return this.getStrokeShapes().find((shape) => shape.id === shapeId)
            || this.getStrokeShapes()[0]
            || null;
    }

    getActiveEffectPreset() {
        const preset = this.getValidEffectPreset(this.state.effectPreset);
        if (preset.id === "liquid") {
            return {
                ...preset,
                colors: this.createLiquidEffectColors()
            };
        }

        if (preset.id === "northern-lights") {
            return {
                ...preset,
                colors: this.createNorthernLightsEffectColors()
            };
        }

        if (preset.id !== "classic") {
            return preset;
        }

        return {
            ...preset,
            theme: this.getClassicTheme(this.state.classicTheme),
            colors: this.createClassicEffectColors()
        };
    }

    getEffectStyle() {
        return {
            ...this.state.effectStyle
        };
    }

    getVideoOverlayStrength() {
        return this.state.videoOverlayStrength;
    }

    getLiquidGlassPalette() {
        const fluid = this.state.liquidPalette || this.config.background.effects.liquidGlass?.fluid || {};

        return {
            accentA: fluid.accentA || "#6fe8d8",
            accentB: fluid.accentB || "#8eb6ff",
            accentC: fluid.accentC || "#c8b0ff",
            glare: fluid.glare || "#f3f7ff",
            baseTop: fluid.baseTop || "#182236",
            baseBottom: fluid.baseBottom || "#1d1b31"
        };
    }

    getNorthernLightsPalette() {
        const palette = this.state.northernLightsPalette || this.config.background.effects.northernLights?.palette || {};

        return {
            veilA: palette.veilA || "#64ffd6",
            veilB: palette.veilB || "#74c9ff",
            veilC: palette.veilC || "#ca87ff",
            skyTop: palette.skyTop || "#081220",
            skyBottom: palette.skyBottom || "#140f2f",
            stars: palette.stars || "#eef6ff"
        };
    }

    createLiquidEffectColors() {
        const palette = this.state.liquidPalette || this.config.background.effects.liquidGlass?.fluid || {};
        return {
            particle: this.hexToRgbString(palette.accentA, "111, 232, 216"),
            link: this.hexToRgbString(palette.accentB, "142, 182, 255"),
            trail: this.hexToRgbString(palette.accentA, "111, 232, 216"),
            trailCore: this.hexToRgbString(palette.glare, "243, 247, 255"),
            burst: this.hexToRgbString(palette.accentC, "200, 176, 255"),
            burstCore: this.hexToRgbString(palette.glare, "243, 247, 255"),
            pointerGlow: this.hexToRgbString(palette.accentB, "142, 182, 255"),
            ring: this.hexToRgbString(palette.accentC, "200, 176, 255"),
            ringCore: this.hexToRgbString(palette.glare, "243, 247, 255"),
            sparkle: this.hexToRgbString(palette.glare, "243, 247, 255")
        };
    }

    createClassicEffectColors() {
        const palette = this.state.classicPalette || this.getClassicTheme(this.state.classicTheme)?.palette || {};
        return {
            particle: this.hexToRgbString(palette.glowA, "255, 188, 150"),
            link: this.hexToRgbString(palette.glowB, "255, 111, 173"),
            trail: this.hexToRgbString(palette.glowB, "255, 111, 173"),
            trailCore: "255, 255, 255",
            burst: this.hexToRgbString(palette.glowC, "255, 122, 96"),
            burstCore: "255, 248, 245",
            pointerGlow: this.hexToRgbString(palette.glowA, "255, 188, 150"),
            ring: this.hexToRgbString(palette.glowB, "255, 111, 173"),
            ringCore: "255, 250, 245",
            sparkle: this.hexToRgbString(palette.glowC, "255, 122, 96")
        };
    }

    createNorthernLightsEffectColors() {
        const palette = this.getNorthernLightsPalette();
        return {
            particle: this.hexToRgbString(palette.stars, "238, 246, 255"),
            link: this.hexToRgbString(palette.veilB, "116, 201, 255"),
            trail: this.hexToRgbString(palette.veilA, "100, 255, 214"),
            trailCore: this.hexToRgbString(palette.stars, "238, 246, 255"),
            burst: this.hexToRgbString(palette.veilC, "202, 135, 255"),
            burstCore: this.hexToRgbString(palette.stars, "238, 246, 255"),
            pointerGlow: this.hexToRgbString(palette.veilA, "100, 255, 214"),
            ring: this.hexToRgbString(palette.veilB, "116, 201, 255"),
            ringCore: this.hexToRgbString(palette.stars, "238, 246, 255"),
            sparkle: this.hexToRgbString(palette.stars, "238, 246, 255")
        };
    }

    applyClassicThemeVisuals() {
        const theme = this.getClassicTheme(this.state.classicTheme);
        const palette = this.state.classicPalette || theme?.palette;
        if (!theme || !palette) {
            return;
        }

        this.root.dataset.effectTheme = theme.id;
        this.root.style.setProperty("--classic-glow-a-rgb", this.hexToRgbString(palette.glowA, "255, 188, 150"));
        this.root.style.setProperty("--classic-glow-b-rgb", this.hexToRgbString(palette.glowB, "255, 111, 173"));
        this.root.style.setProperty("--classic-glow-c-rgb", this.hexToRgbString(palette.glowC, "255, 122, 96"));
        this.root.style.setProperty("--classic-base-top-rgb", this.hexToRgbString(palette.baseTop, "17, 8, 16"));
        this.root.style.setProperty("--classic-base-bottom-rgb", this.hexToRgbString(palette.baseBottom, "23, 10, 16"));
    }

    applyLiquidPaletteVisuals() {
        const palette = this.state.liquidPalette || this.config.background.effects.liquidGlass?.fluid || {};
        this.root.style.setProperty("--liquid-accent-a-rgb", this.hexToRgbString(palette.accentA, "111, 232, 216"));
        this.root.style.setProperty("--liquid-accent-b-rgb", this.hexToRgbString(palette.accentB, "142, 182, 255"));
        this.root.style.setProperty("--liquid-accent-c-rgb", this.hexToRgbString(palette.accentC, "200, 176, 255"));
        this.root.style.setProperty("--liquid-glare-rgb", this.hexToRgbString(palette.glare, "243, 247, 255"));
        this.root.style.setProperty("--liquid-base-top-rgb", this.hexToRgbString(palette.baseTop, "24, 34, 54"));
        this.root.style.setProperty("--liquid-base-bottom-rgb", this.hexToRgbString(palette.baseBottom, "29, 27, 49"));
    }

    applyNorthernLightsPaletteVisuals() {
        const palette = this.getNorthernLightsPalette();
        this.root.style.setProperty("--northern-veil-a-rgb", this.hexToRgbString(palette.veilA, "100, 255, 214"));
        this.root.style.setProperty("--northern-veil-b-rgb", this.hexToRgbString(palette.veilB, "116, 201, 255"));
        this.root.style.setProperty("--northern-veil-c-rgb", this.hexToRgbString(palette.veilC, "202, 135, 255"));
        this.root.style.setProperty("--northern-sky-top-rgb", this.hexToRgbString(palette.skyTop, "8, 18, 32"));
        this.root.style.setProperty("--northern-sky-bottom-rgb", this.hexToRgbString(palette.skyBottom, "20, 15, 47"));
        this.root.style.setProperty("--northern-stars-rgb", this.hexToRgbString(palette.stars, "238, 246, 255"));
    }

    isAuroraClassicTheme() {
        return this.state.effectPreset === "classic" && this.state.classicTheme === "aurora";
    }

    normalizeLegacyEffectPreset(presetId) {
        if (["ember", "violet", "aurora", "mono"].includes(presetId)) {
            return "classic";
        }

        return presetId;
    }

    normalizeLegacyClassicTheme(themeId) {
        if (["ember", "violet", "aurora", "mono"].includes(themeId)) {
            return themeId;
        }

        return null;
    }

    isValidClassicPaletteKey(key) {
        return ["glowA", "glowB", "glowC", "baseTop", "baseBottom"].includes(key);
    }

    isValidLiquidPaletteKey(key) {
        return ["accentA", "accentB", "accentC", "glare", "baseTop", "baseBottom"].includes(key);
    }

    isValidNorthernLightsPaletteKey(key) {
        return ["veilA", "veilB", "veilC", "skyTop", "skyBottom", "stars"].includes(key);
    }

    isValidHexColor(value) {
        return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
    }

    hexToRgbString(hex, fallback = "255, 255, 255") {
        if (!this.isValidHexColor(hex)) {
            return fallback;
        }

        const normalized = hex.replace("#", "");
        const red = Number.parseInt(normalized.slice(0, 2), 16);
        const green = Number.parseInt(normalized.slice(2, 4), 16);
        const blue = Number.parseInt(normalized.slice(4, 6), 16);
        return `${red}, ${green}, ${blue}`;
    }

    clampEffectStrokeWidth(value) {
        const strokeConfig = this.config.background.effects.stroke || {};
        const min = strokeConfig.minWidth ?? 4;
        const max = strokeConfig.maxWidth ?? 28;
        return Math.min(Math.max(Number(value) || min, min), max);
    }

    clampVideoOverlayStrength(value) {
        return Math.min(Math.max(Number(value) || 0, 0), 100);
    }

    clampEffectStrokeScale(value) {
        const strokeConfig = this.config.background.effects.stroke || {};
        const min = strokeConfig.minScale ?? 0.6;
        const max = strokeConfig.maxScale ?? 1.8;
        return Math.min(Math.max(Number(value) || min, min), max);
    }

    clampEffectStrokeSpeed(value) {
        const strokeConfig = this.config.background.effects.stroke || {};
        const min = strokeConfig.minSpeed ?? 0.5;
        const max = strokeConfig.maxSpeed ?? 2.4;
        return Math.min(Math.max(Number(value) || min, min), max);
    }

    clampEffectStrokeDensity(value) {
        const strokeConfig = this.config.background.effects.stroke || {};
        const min = strokeConfig.minDensity ?? 1;
        const max = strokeConfig.maxDensity ?? 6;
        return Math.min(Math.max(Math.round(Number(value) || min), min), max);
    }

    deriveAssetLabel(fileName) {
        return fileName
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim() || "Custom background";
    }

    normalizeIndex(index, length) {
        return ((index % length) + length) % length;
    }

    emitChange() {
        this.root.dispatchEvent(
            new CustomEvent("profile:backgroundchange", {
                bubbles: true,
                detail: this.getState()
            })
        );
    }

    setStatus(message) {
        if (typeof this.onStatusChange === "function") {
            this.onStatusChange(message);
        }
    }

    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    getState() {
        const currentVideoScene = this.customVideoResource
            ? {
                id: "custom-video",
                label: this.customVideoResource.label,
                file: this.customVideoResource.url,
                isCustom: true
            }
            : this.config.background.video.scenes[this.state.videoIndex] || null;
        const currentImageScene = this.customImageResource
            ? {
                id: "custom-image",
                label: this.customImageResource.label,
                file: this.customImageResource.url,
                isCustom: true
            }
            : this.config.background.image.scenes[this.state.imageIndex] || null;
        const currentEffectPreset = this.getActiveEffectPreset();

        return {
            mode: this.state.mode,
            videoIndex: this.state.videoIndex,
            videoOverlayStrength: this.state.videoOverlayStrength,
            imageIndex: this.state.imageIndex,
            effectPreset: currentEffectPreset.id,
            effectTheme: this.state.classicTheme,
            videoScene: currentVideoScene,
            imageScene: currentImageScene,
            effect: currentEffectPreset,
            effectStyle: this.getEffectStyle(),
            effectShapes: this.getStrokeShapes(),
            effectThemes: this.getClassicThemes(),
            classicPalette: {
                ...this.state.classicPalette
            },
            liquidPalette: {
                ...this.state.liquidPalette
            },
            northernLightsPalette: {
                ...this.state.northernLightsPalette
            },
            hasCustomVideo: Boolean(this.customVideoResource),
            hasCustomImage: Boolean(this.customImageResource)
        };
    }
}

export default BackgroundEngine;
