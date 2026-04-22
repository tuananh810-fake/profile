const MAX_BLOBS = 16;
const MAX_RIPPLES = 8;

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
    vUv = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

#define MAX_BLOBS 16
#define MAX_RIPPLES 8

varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uBlobs[MAX_BLOBS];
uniform vec4 uRipples[MAX_RIPPLES];
uniform vec3 uAccentA;
uniform vec3 uAccentB;
uniform vec3 uAccentC;
uniform vec3 uGlare;
uniform vec4 uPointer;

float fieldOnly(vec2 uv) {
    float field = 0.0;
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    for (int i = 0; i < MAX_BLOBS; i += 1) {
        vec4 blob = uBlobs[i];

        if (blob.z <= 0.0001 || blob.w <= 0.0001) {
            continue;
        }

        vec2 delta = uv - blob.xy;
        delta.x *= aspect;
        float dist2 = dot(delta, delta) + 0.00008;
        field += blob.w * (blob.z * blob.z) / dist2;
    }

    return field;
}

void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    float field = fieldOnly(uv);
    float pixel = 1.8 / min(uResolution.x, uResolution.y);
    float fieldX = fieldOnly(uv + vec2(pixel, 0.0)) - fieldOnly(uv - vec2(pixel, 0.0));
    float fieldY = fieldOnly(uv + vec2(0.0, pixel)) - fieldOnly(uv - vec2(0.0, pixel));

    vec3 normal = normalize(vec3(fieldX * 0.88, fieldY * 0.88, 0.66));
    float glowBand = smoothstep(0.82, 1.22, field);
    float shell = smoothstep(1.08, 1.64, field);
    float innerMask = smoothstep(1.48, 2.22, field);
    float core = smoothstep(2.08, 2.92, field);
    float rim = max(shell - innerMask, 0.0);
    float fresnel = pow(1.0 - clamp(normal.z, 0.0, 1.0), 2.2);

    vec3 tint = vec3(0.0);
    float tintWeight = 0.0;

    for (int i = 0; i < MAX_BLOBS; i += 1) {
        vec4 blob = uBlobs[i];

        if (blob.z <= 0.0001 || blob.w <= 0.0001) {
            continue;
        }

        vec2 delta = uv - blob.xy;
        delta.x *= aspect;
        float dist2 = dot(delta, delta) + 0.00012;
        float contribution = blob.w * (blob.z * blob.z) / dist2;
        float laneA = 0.5 + 0.5 * sin(uTime * (0.3 + float(i) * 0.011) + float(i) * 1.73 + blob.x * 6.0 - blob.y * 5.2);
        float laneB = 0.5 + 0.5 * sin(float(i) * 2.37 + uTime * 0.22 + blob.y * 4.2);
        vec3 blobColor = mix(mix(uAccentA, uAccentB, laneA), uAccentC, laneB * 0.68);

        tint += blobColor * contribution;
        tintWeight += contribution;
    }

    tint = tintWeight > 0.0 ? tint / tintWeight : mix(uAccentA, uAccentB, 0.5);

    float meshA = 0.5 + 0.5 * sin((uv.x * 6.2 - uv.y * 4.1) + uTime * 0.24);
    float meshB = 0.5 + 0.5 * sin((uv.x * 4.6 + uv.y * 5.9) - uTime * 0.2);
    float meshC = 0.5 + 0.5 * sin((uv.y * 7.1 - uv.x * 3.7) + uTime * 0.16);

    vec3 meshColor = mix(uAccentA, uAccentB, meshA);
    meshColor = mix(meshColor, uAccentC, meshB * 0.62);
    meshColor = mix(meshColor, uGlare, meshC * 0.12);

    vec3 lightDir = normalize(vec3(-0.58, -0.38, 0.92));
    float diffuse = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
    float edgeSpec = pow(max(dot(normalize(vec3(0.72, -0.3, 0.72)), normal), 0.0), 12.0);

    float rippleGlow = 0.0;

    for (int i = 0; i < MAX_RIPPLES; i += 1) {
        vec4 ripple = uRipples[i];

        if (ripple.w <= 0.0001) {
            continue;
        }

        vec2 delta = uv - ripple.xy;
        delta.x *= aspect;
        float dist = length(delta);
        float ring = exp(-pow((dist - ripple.z) * 120.0, 2.0));
        rippleGlow += ring * ripple.w;
    }

    vec3 shadowTone = mix(meshColor * 0.38, tint * 0.54, 0.48);
    vec3 midTone = mix(meshColor * 0.88, tint, 0.64);
    vec3 fluidColor = mix(shadowTone, midTone, innerMask);
    fluidColor += tint * (0.05 + glowBand * 0.08);
    fluidColor += mix(uAccentB, uAccentC, meshB) * rim * (0.24 + fresnel * 0.18);
    fluidColor += uGlare * (0.04 + diffuse * 0.06 + spec * 0.24 + edgeSpec * 0.16 + fresnel * 0.08);
    fluidColor += mix(uAccentA, uAccentB, meshA) * rippleGlow * 0.18;
    fluidColor = mix(fluidColor, uGlare, core * 0.08);

    float alpha = clamp(shell * 0.68 + rim * 0.18 + core * 0.06 + rippleGlow * 0.08, 0.0, 0.86);

    if (alpha < 0.01) {
        discard;
    }

    gl_FragColor = vec4(fluidColor, alpha);
}
`;

class LiquidGlassRenderer {
    constructor({ canvas, config = {} }) {
        this.canvas = canvas;
        this.config = config;
        this.gl = null;
        this.program = null;
        this.positionBuffer = null;
        this.locations = null;
        this.width = 0;
        this.height = 0;
        this.pixelRatio = 1;
        this.ready = false;
        this.active = false;
        this.rafId = null;
        this.lastFrameTime = 0;
        this.time = 0;
        this.ambientBlobs = [];
        this.splatBlobs = [];
        this.ripples = [];
        this.style = {
            shape: "orbit",
            width: 10,
            scale: 1,
            speed: 1,
            density: 4,
            lowPower: false
        };
        this.palette = {
            accentA: this.colorToVec3("#7effef"),
            accentB: this.colorToVec3("#8cb8ff"),
            accentC: this.colorToVec3("#f4abff"),
            glare: this.colorToVec3("#ffffff")
        };
        this.pointer = {
            x: 0.5,
            y: 0.5,
            pressure: 0,
            active: false,
            lastSpawnX: null,
            lastSpawnY: null
        };

        this.frame = this.frame.bind(this);
    }

    isReady() {
        return this.ready;
    }

    ensureContext() {
        if (this.ready || !this.canvas) {
            return this.ready;
        }

        const gl = this.canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
            depth: false,
            stencil: false,
            powerPreference: "high-performance"
        });

        if (!gl) {
            return false;
        }

        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

        if (!vertexShader || !fragmentShader) {
            return false;
        }

        const program = this.createProgram(gl, vertexShader, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!program) {
            return false;
        }

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]), gl.STATIC_DRAW);

        this.gl = gl;
        this.program = program;
        this.positionBuffer = positionBuffer;
        this.locations = {
            position: gl.getAttribLocation(program, "aPosition"),
            resolution: gl.getUniformLocation(program, "uResolution"),
            time: gl.getUniformLocation(program, "uTime"),
            blobs: gl.getUniformLocation(program, "uBlobs[0]"),
            ripples: gl.getUniformLocation(program, "uRipples[0]"),
            accentA: gl.getUniformLocation(program, "uAccentA"),
            accentB: gl.getUniformLocation(program, "uAccentB"),
            accentC: gl.getUniformLocation(program, "uAccentC"),
            glare: gl.getUniformLocation(program, "uGlare"),
            pointer: gl.getUniformLocation(program, "uPointer")
        };

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        this.ready = true;
        return true;
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("LiquidGlass shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("LiquidGlass program link error:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    setStyle(style = {}) {
        const previousLowPower = this.style.lowPower;
        this.style = {
            ...this.style,
            ...style
        };

        if (previousLowPower !== this.style.lowPower && this.width && this.height) {
            this.resize(this.width, this.height);
        }

        this.seedAmbientBlobs();
    }

    setPalette(palette = {}) {
        this.palette = {
            accentA: this.colorToVec3(palette.accentA || "#7effef"),
            accentB: this.colorToVec3(palette.accentB || "#8cb8ff"),
            accentC: this.colorToVec3(palette.accentC || "#f4abff"),
            glare: this.colorToVec3(palette.glare || "#ffffff")
        };
    }

    resize(width = this.canvas?.clientWidth || 0, height = this.canvas?.clientHeight || 0) {
        if (!this.canvas) {
            return;
        }

        this.width = Math.max(1, Math.round(width));
        this.height = Math.max(1, Math.round(height));
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.style.lowPower ? 1.1 : 1.8);
        this.canvas.width = Math.max(1, Math.round(this.width * this.pixelRatio));
        this.canvas.height = Math.max(1, Math.round(this.height * this.pixelRatio));

        if (this.ready) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        this.seedAmbientBlobs();
    }

    setActive(active) {
        this.active = Boolean(active);

        if (!this.active) {
            this.stop();
            return;
        }

        if (!this.ensureContext()) {
            return;
        }

        if (!this.width || !this.height) {
            this.resize();
        }

        if (this.ambientBlobs.length === 0) {
            this.seedAmbientBlobs();
        }

        this.start();
    }

    start() {
        if (this.rafId || !this.ready) {
            return;
        }

        this.lastFrameTime = performance.now();
        this.rafId = window.requestAnimationFrame(this.frame);
    }

    stop() {
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.pointer.active = false;
        this.pointer.lastSpawnX = null;
        this.pointer.lastSpawnY = null;
        this.clear();
    }

    clear() {
        if (!this.ready) {
            return;
        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    frame(now) {
        if (!this.active || !this.ready) {
            this.rafId = null;
            return;
        }

        const frameInterval = this.style.lowPower ? (1000 / 48) : (1000 / 60);
        if (now - this.lastFrameTime < frameInterval) {
            this.rafId = window.requestAnimationFrame(this.frame);
            return;
        }

        const delta = Math.min(0.032, (now - this.lastFrameTime) / 1000 || 0.016);
        this.lastFrameTime = now;
        this.time += delta;
        this.update(delta);
        this.render();
        this.rafId = window.requestAnimationFrame(this.frame);
    }

    update(delta) {
        const speedScale = Math.max(0.55, this.style.speed || 1);
        const pointerInfluence = 0.19 + (this.style.scale || 1) * 0.04;

        for (const blob of this.ambientBlobs) {
            blob.x += blob.vx * delta * speedScale;
            blob.y += blob.vy * delta * speedScale;
            blob.vx += Math.sin(this.time * blob.wobbleSpeed + blob.phase) * 0.0007 * delta * 60;
            blob.vy += Math.cos(this.time * blob.wobbleSpeed * 0.88 + blob.phase) * 0.0005 * delta * 60;

            if (this.pointer.active) {
                const dx = blob.x - this.pointer.x;
                const dy = blob.y - this.pointer.y;
                const distance = Math.hypot(dx, dy) || 0.0001;

                if (distance < pointerInfluence) {
                    const force = (pointerInfluence - distance) / pointerInfluence;
                    blob.vx += (dx / distance) * force * 0.0016 * speedScale * delta * 60;
                    blob.vy += (dy / distance) * force * 0.0012 * speedScale * delta * 60;
                }
            }

            blob.vx *= 0.992;
            blob.vy *= 0.992;

            const margin = blob.baseRadius * 0.65 + 0.04;
            if (blob.x < margin || blob.x > 1 - margin) {
                blob.vx *= -1;
                blob.x = this.clamp(blob.x, margin, 1 - margin);
            }

            if (blob.y < margin || blob.y > 1 - margin) {
                blob.vy *= -1;
                blob.y = this.clamp(blob.y, margin, 1 - margin);
            }

            blob.radius = blob.baseRadius * (1 + Math.sin(this.time * blob.wobbleSpeed * 1.12 + blob.phase) * 0.08);
        }

        this.splatBlobs = this.splatBlobs
            .map((blob) => {
                const nextLife = blob.life - delta / blob.duration;
                return {
                    ...blob,
                    x: blob.x + blob.vx * delta,
                    y: blob.y + blob.vy * delta,
                    vx: blob.vx * 0.982,
                    vy: blob.vy * 0.982,
                    life: nextLife,
                    radius: blob.radius * (1 + delta * 0.28),
                    energy: blob.energy * (0.994 - delta * 0.08)
                };
            })
            .filter((blob) => blob.life > 0.02);

        this.ripples = this.ripples
            .map((ripple) => ({
                ...ripple,
                radius: ripple.radius + delta * ripple.speed,
                life: ripple.life - delta / ripple.duration
            }))
            .filter((ripple) => ripple.life > 0.02);
    }

    render() {
        if (!this.ready) {
            return;
        }

        const gl = this.gl;
        const blobs = this.collectBlobUniformData();
        const ripples = this.collectRippleUniformData();

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.locations.time, this.time);
        gl.uniform4fv(this.locations.blobs, blobs);
        gl.uniform4fv(this.locations.ripples, ripples);
        gl.uniform3fv(this.locations.accentA, new Float32Array(this.palette.accentA));
        gl.uniform3fv(this.locations.accentB, new Float32Array(this.palette.accentB));
        gl.uniform3fv(this.locations.accentC, new Float32Array(this.palette.accentC));
        gl.uniform3fv(this.locations.glare, new Float32Array(this.palette.glare));
        gl.uniform4f(
            this.locations.pointer,
            this.pointer.x,
            this.pointer.y,
            0,
            0
        );
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    collectBlobUniformData() {
        const data = new Float32Array(MAX_BLOBS * 4);
        const ambient = this.ambientBlobs.slice(0, Math.min(this.ambientBlobs.length, MAX_BLOBS - 6));
        const splats = this.splatBlobs.slice(0, Math.max(0, MAX_BLOBS - ambient.length));
        const blobs = [...ambient, ...splats];

        blobs.forEach((blob, index) => {
            const offset = index * 4;
            data[offset] = blob.x;
            data[offset + 1] = blob.y;
            data[offset + 2] = blob.radius;
            data[offset + 3] = blob.energy * (blob.life ?? 1);
        });

        return data;
    }

    collectRippleUniformData() {
        const data = new Float32Array(MAX_RIPPLES * 4);

        this.ripples.slice(0, MAX_RIPPLES).forEach((ripple, index) => {
            const offset = index * 4;
            data[offset] = ripple.x;
            data[offset + 1] = ripple.y;
            data[offset + 2] = ripple.radius;
            data[offset + 3] = ripple.life;
        });

        return data;
    }

    handlePointerMove(point, { allowInteractive = true, pressure = 0, deltaX = 0, deltaY = 0 } = {}) {
        if (!this.width || !this.height) {
            return;
        }

        const uv = this.toUv(point);
        this.pointer.x = uv.x;
        this.pointer.y = uv.y;
        this.pointer.pressure = pressure || 0;
        this.pointer.active = true;

        if (!allowInteractive) {
            return;
        }

        const minDistance = Math.max(
            10,
            (this.config.trailSpawnDistance ?? 28) * (0.9 + (2 - Math.min(2, this.style.speed || 1)) * 0.12)
        );

        if (this.pointer.lastSpawnX === null || this.pointer.lastSpawnY === null) {
            this.pointer.lastSpawnX = point.x;
            this.pointer.lastSpawnY = point.y;
            this.spawnPatternCluster(point, { x: deltaX, y: deltaY }, 0.68 + pressure * 0.16, false);
            return;
        }

        const stepX = point.x - this.pointer.lastSpawnX;
        const stepY = point.y - this.pointer.lastSpawnY;
        const distance = Math.hypot(stepX, stepY);

        if (distance < minDistance) {
            return;
        }

        const steps = Math.min(8, Math.ceil(distance / minDistance));

        for (let step = 1; step <= steps; step += 1) {
            const ratio = step / steps;
            this.spawnPatternCluster(
                {
                    x: this.pointer.lastSpawnX + stepX * ratio,
                    y: this.pointer.lastSpawnY + stepY * ratio
                },
                { x: deltaX, y: deltaY },
                0.62 + pressure * 0.14,
                false
            );
        }

        this.pointer.lastSpawnX = point.x;
        this.pointer.lastSpawnY = point.y;
    }

    handlePointerDown(point, { pressure = 0 } = {}) {
        if (!this.width || !this.height) {
            return;
        }

        this.spawnPatternCluster(point, { x: 0, y: 0 }, 1 + pressure * 0.35, true);
        this.spawnRipple(point, 1 + pressure * 0.3);
        this.pointer.lastSpawnX = point.x;
        this.pointer.lastSpawnY = point.y;
        this.pointer.pressure = pressure;
    }

    handlePointerLeave() {
        this.pointer.active = false;
        this.pointer.pressure = 0;
        this.pointer.lastSpawnX = null;
        this.pointer.lastSpawnY = null;
    }

    spawnRipple(point, strength = 1) {
        const uv = this.toUv(point);
        const radius = (32 + this.style.width * 2.4) / Math.max(1, Math.min(this.width, this.height));

        this.ripples.unshift({
            x: uv.x,
            y: uv.y,
            radius,
            speed: (0.14 + (this.style.scale || 1) * 0.06) * strength,
            duration: 0.9,
            life: 1
        });
        this.ripples = this.ripples.slice(0, MAX_RIPPLES);
    }

    spawnPatternCluster(point, velocity, intensity = 1, burst = false) {
        const uv = this.toUv(point);
        const vector = this.normalizeVelocity(velocity);
        const normal = { x: -vector.y, y: vector.x };
        const spread = (18 + this.style.width * 1.8) * (0.85 + this.style.scale * 0.35) * (burst ? 1.35 : 1);
        const baseRadius = (44 + this.style.width * 2.6) * (0.8 + this.style.scale * 0.34) * (burst ? 1.28 : 1);
        const baseEnergy = burst ? 1.3 : 0.88;
        const offsets = this.getShapeOffsets(vector, intensity, burst);

        offsets.forEach((offset, index) => {
            const offsetPxX = (vector.x * offset.along + normal.x * offset.cross) * spread;
            const offsetPxY = (vector.y * offset.along + normal.y * offset.cross) * spread;
            const x = this.clamp(uv.x + offsetPxX / Math.max(1, this.width), 0.02, 0.98);
            const y = this.clamp(uv.y + offsetPxY / Math.max(1, this.height), 0.02, 0.98);
            const radius = (baseRadius * offset.radius * intensity) / Math.max(1, Math.min(this.width, this.height));
            const speedFactor = 0.0009 * Math.max(0.9, this.style.speed || 1);

            this.splatBlobs.unshift({
                x,
                y,
                vx: vector.x * spread * speedFactor * offset.velocity + normal.x * speedFactor * spread * offset.cross * 0.35,
                vy: vector.y * spread * speedFactor * offset.velocity + normal.y * speedFactor * spread * offset.cross * 0.35,
                radius,
                energy: baseEnergy * offset.energy,
                duration: burst ? 1.4 : 1.05,
                life: 1
            });

            if (burst && index % 2 === 0) {
                this.splatBlobs.unshift({
                    x,
                    y,
                    vx: normal.x * spread * 0.0018 * (Math.random() > 0.5 ? 1 : -1),
                    vy: normal.y * spread * 0.0018 * (Math.random() > 0.5 ? 1 : -1),
                    radius: radius * 0.68,
                    energy: baseEnergy * offset.energy * 0.74,
                    duration: 1.1,
                    life: 1
                });
            }
        });

        this.splatBlobs = this.splatBlobs.slice(0, MAX_BLOBS);
    }

    getShapeOffsets(vector, intensity, burst) {
        const amplitude = burst ? 1.18 : 1;

        switch (this.style.shape) {
            case "wave":
                return [
                    { along: -0.62, cross: -0.18 * amplitude, radius: 0.86, energy: 0.92, velocity: 0.72 },
                    { along: -0.18, cross: 0.22 * amplitude, radius: 1.02, energy: 1, velocity: 0.92 },
                    { along: 0.24, cross: -0.14 * amplitude, radius: 0.94, energy: 0.96, velocity: 1.08 },
                    { along: 0.68, cross: 0.2 * amplitude, radius: 0.82, energy: 0.82, velocity: 1.1 }
                ];
            case "loop":
                return [
                    { along: -0.28, cross: -0.12 * amplitude, radius: 0.9, energy: 0.9, velocity: 0.9 },
                    { along: 0.16, cross: 0.28 * amplitude, radius: 1.02, energy: 1.04, velocity: 0.98 },
                    { along: 0.42, cross: -0.06 * amplitude, radius: 0.74, energy: 0.8, velocity: 0.82 },
                    { along: -0.08, cross: -0.34 * amplitude, radius: 0.7, energy: 0.72, velocity: 0.78 }
                ];
            case "swoop":
                return [
                    { along: -0.56, cross: -0.08 * amplitude, radius: 0.76, energy: 0.84, velocity: 0.84 },
                    { along: -0.16, cross: 0.22 * amplitude, radius: 0.92, energy: 0.96, velocity: 1.02 },
                    { along: 0.28, cross: 0.14 * amplitude, radius: 1.08, energy: 1.08, velocity: 1.12 },
                    { along: 0.74, cross: -0.18 * amplitude, radius: 0.82, energy: 0.88, velocity: 1.16 }
                ];
            case "orbit":
            default:
                return [
                    { along: -0.16, cross: -0.26 * amplitude, radius: 0.86, energy: 0.88, velocity: 0.76 },
                    { along: 0.18, cross: 0.26 * amplitude, radius: 1.04, energy: 1.02, velocity: 1.02 },
                    { along: 0.42, cross: -0.08 * amplitude, radius: 0.78, energy: 0.82, velocity: 0.92 },
                    { along: -0.44, cross: 0.08 * amplitude, radius: 0.7, energy: 0.72, velocity: 0.7 }
                ];
        }
    }

    seedAmbientBlobs() {
        if (!this.width || !this.height) {
            return;
        }

        const count = this.style.lowPower
            ? Math.min(7, Math.max(3, 2 + Math.round(this.style.density || 4) - 1))
            : Math.min(9, 3 + Math.round(this.style.density || 4));

        this.ambientBlobs = Array.from({ length: count }, (_, index) => {
            const baseRadiusPx = this.randomBetween(82, 156) * (0.7 + (this.style.scale || 1) * 0.32);
            const baseRadius = baseRadiusPx / Math.max(1, Math.min(this.width, this.height));

            return {
                x: this.randomBetween(0.08, 0.92),
                y: this.randomBetween(0.08, 0.92),
                vx: this.randomBetween(-0.024, 0.024),
                vy: this.randomBetween(-0.02, 0.02),
                baseRadius,
                radius: baseRadius,
                energy: this.randomBetween(0.76, 1.02),
                phase: this.randomBetween(0, Math.PI * 2),
                wobbleSpeed: this.randomBetween(0.3, 0.64) * Math.max(0.8, this.style.speed || 1),
                id: index
            };
        });
    }

    toUv(point) {
        return {
            x: this.clamp(point.x / Math.max(1, this.width), 0, 1),
            y: this.clamp(point.y / Math.max(1, this.height), 0, 1)
        };
    }

    normalizeVelocity(velocity = {}) {
        const x = Number.isFinite(velocity.x) ? velocity.x : 0;
        const y = Number.isFinite(velocity.y) ? velocity.y : 0;
        const length = Math.hypot(x, y);

        if (!length) {
            return { x: 1, y: 0 };
        }

        return {
            x: x / length,
            y: y / length
        };
    }

    colorToVec3(color) {
        const hex = String(color || "").trim();
        const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
        const expanded = normalized.length === 3
            ? normalized.split("").map((char) => char + char).join("")
            : normalized;

        if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
            return [1, 1, 1];
        }

        return [
            parseInt(expanded.slice(0, 2), 16) / 255,
            parseInt(expanded.slice(2, 4), 16) / 255,
            parseInt(expanded.slice(4, 6), 16) / 255
        ];
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }
}

export default LiquidGlassRenderer;
