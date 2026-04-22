export const APP_CONFIG = {
    shell: {
        eyebrow: "module stack 01-05",
        title: "Neon artist shell",
        lead: "More than just a profile—an interactive playground. Built on a bold neon-dark aesthetic, this canvas lets you drag, resize, and shape your own space. Complete with a dynamic tri-mode background engine and a fully integrated music dock with live lyrics sync.",
        status: "Core shell, center card, background engine, music player, and an adjustable lyrics overlay with focus mode are ready.",
        wordmark: "never\nstill",
        badges: ["drag ready", "resizable card", "3 background modes", "lyrics focus mode"],
        copyPanel: {
            defaultWidth: 430,
            minWidth: 280,
            maxWidth: 620,
            safePadding: 12,
            defaultX: 0,
            defaultY: 0
        }
    },
    background: {
        defaultMode: "video",
        modes: [
            { id: "video", label: "Video" },
            { id: "image", label: "Image" },
            { id: "effects", label: "Effects" }
        ],
        video: {
            defaultScene: 0,
            defaultOverlayStrength: 42,
            scenes: [
                { id: "snow", label: "Snow Drift", file: "./snow.mp4" },
                { id: "water", label: "Water Glow", file: "./video3.mp4" },
                { id: "dream", label: "Dream Loop", file: "./video8.mp4" }
            ]
        },
        image: {
            defaultScene: 0,
            scenes: [
                { id: "portrait", label: "Portrait Still", file: "./avatar.jpg" }
            ]
        },
        effects: {
            defaultPreset: "classic",
            particleCount: 58,
            speed: 0.34,
            maxRadius: 2.9,
            linkDistance: 164,
            pointerInfluence: 172,
            stroke: {
                defaultShape: "orbit",
                defaultWidth: 10,
                minWidth: 4,
                maxWidth: 28,
                defaultScale: 1,
                minScale: 0.6,
                maxScale: 1.8,
                defaultSpeed: 1,
                minSpeed: 0.5,
                maxSpeed: 2.4,
                defaultDensity: 4,
                minDensity: 1,
                maxDensity: 6,
                shapes: [
                    {
                        id: "wave",
                        label: "Wave",
                        path: "M22 118 C42 72 62 164 84 118 C106 72 126 164 148 118 C166 84 184 82 198 118"
                    },
                    {
                        id: "orbit",
                        label: "Orbit",
                        path: "M52 110 C52 76 78 50 110 50 C142 50 168 76 168 110 C168 144 142 170 110 170 C78 170 52 144 52 110"
                    },
                    {
                        id: "loop",
                        label: "Loop",
                        path: "M82 42 L82 126 C82 154 100 178 126 178 C148 178 166 162 166 140 C166 118 148 102 126 102 C114 102 104 106 96 114"
                    },
                    {
                        id: "swoop",
                        label: "Swoop",
                        path: "M30 126 C64 86 106 84 132 110 C150 128 172 132 192 116 C176 152 138 166 104 154 C80 146 58 126 30 126"
                    }
                ]
            },
            trail: {
                spawnDistance: 10,
                maxPoints: 120,
                life: 34,
                width: 2.5,
                glowBoost: 10
            },
            burst: {
                count: 28,
                speedMin: 2.2,
                speedMax: 6.4,
                friction: 0.955,
                life: 42,
                radiusMin: 1.2,
                radiusMax: 3.4
            },
            ring: {
                life: 34,
                startRadius: 10,
                endRadius: 132,
                lineWidth: 4
            },
            liquidGlass: {
                trailSpawnDistance: 28,
                rippleBaseSize: 120,
                rippleScaleBoost: 32,
                stampLifeMs: 920,
                fluid: {
                    accentA: "#6fe8d8",
                    accentB: "#8eb6ff",
                    accentC: "#c8b0ff",
                    glare: "#f3f7ff",
                    baseTop: "#182236",
                    baseBottom: "#1d1b31"
                }
            },
            northernLights: {
                palette: {
                    veilA: "#64ffd6",
                    veilB: "#74c9ff",
                    veilC: "#ca87ff",
                    skyTop: "#081220",
                    skyBottom: "#140f2f",
                    stars: "#eef6ff"
                }
            },
            aurora: {
                snowCount: 132,
                fallSpeedMin: 0.22,
                fallSpeedMax: 0.84,
                driftAmplitudeMin: 0.08,
                driftAmplitudeMax: 0.34,
                swaySpeedMin: 0.45,
                swaySpeedMax: 1.25,
                sizeMin: 0.55,
                sizeMax: 2.2,
                alphaMin: 0.24,
                alphaMax: 0.88,
                twinkleSpeedMin: 0.7,
                twinkleSpeedMax: 2.15,
                windMin: -0.03,
                windMax: 0.03,
                pointerInfluence: 124
            },
            defaultClassicTheme: "ember",
            classicThemes: [
                {
                    id: "ember",
                    label: "Ember",
                    palette: {
                        glowA: "#ffbc96",
                        glowB: "#ff6fad",
                        glowC: "#ff7a60",
                        baseTop: "#110810",
                        baseBottom: "#170a10"
                    }
                },
                {
                    id: "violet",
                    label: "Violet",
                    palette: {
                        glowA: "#ae81ff",
                        glowB: "#ff7ed5",
                        glowC: "#6850ff",
                        baseTop: "#090918",
                        baseBottom: "#120a24"
                    }
                },
                {
                    id: "aurora",
                    label: "Aurora",
                    palette: {
                        glowA: "#7a8aff",
                        glowB: "#7afae9",
                        glowC: "#f48dff",
                        baseTop: "#281070",
                        baseBottom: "#104aa4"
                    }
                },
                {
                    id: "mono",
                    label: "Silver",
                    palette: {
                        glowA: "#efefef",
                        glowB: "#d1d1d1",
                        glowC: "#b0b0b0",
                        baseTop: "#0a0a0c",
                        baseBottom: "#131316"
                    }
                }
            ],
            presets: [
                {
                    id: "classic",
                    label: "Neon Classic",
                    layerClass: "classic"
                },
                {
                    id: "liquid",
                    label: "Liquid Glass",
                    layerClass: "liquid",
                    colors: {
                        particle: "181, 233, 255",
                        link: "164, 185, 255",
                        trail: "121, 255, 229",
                        trailCore: "255, 255, 255",
                        burst: "255, 193, 238",
                        burstCore: "255, 255, 255",
                        pointerGlow: "178, 255, 244",
                        ring: "134, 215, 255",
                        ringCore: "255, 255, 255",
                        sparkle: "242, 250, 255"
                    }
                },
                {
                    id: "northern-lights",
                    label: "Northern Lights",
                    layerClass: "northern-lights"
                }
            ]
        }
    },
    motion: {
        defaultEnabled: true,
        stroke: {
            defaultShape: "orbit",
            defaultWidth: 10,
            minWidth: 4,
            maxWidth: 28,
            defaultScale: 1,
            minScale: 0.6,
            maxScale: 1.9,
            defaultSpeed: 1,
            minSpeed: 0.5,
            maxSpeed: 2.4,
            defaultDensity: 4,
            minDensity: 1,
            maxDensity: 6,
            defaultColorA: "#77fff0",
            defaultColorB: "#71a9ff",
            defaultColorC: "#ff92ea",
            spawnDistance: 18,
            maxStamps: 64,
            maxRipples: 14,
            rippleLife: 0.88,
            idleStopDelayMs: 160,
            maxPixelRatio: 1.15,
            renderStampCap: 30,
            maxStepCount: 4,
            shapes: [
                {
                    id: "wave",
                    label: "Wave",
                    path: "M22 118 C42 72 62 164 84 118 C106 72 126 164 148 118 C166 84 184 82 198 118"
                },
                {
                    id: "orbit",
                    label: "Orbit",
                    path: "M52 110 C52 76 78 50 110 50 C142 50 168 76 168 110 C168 144 142 170 110 170 C78 170 52 144 52 110"
                },
                {
                    id: "loop",
                    label: "Loop",
                    path: "M82 42 L82 126 C82 154 100 178 126 178 C148 178 166 162 166 140 C166 118 148 102 126 102 C114 102 104 106 96 114"
                },
                {
                    id: "swoop",
                    label: "Swoop",
                    path: "M30 126 C64 86 106 84 132 110 C150 128 172 132 192 116 C176 152 138 166 104 154 C80 146 58 126 30 126"
                }
            ]
        }
    },
    musicDock: {
        minWidth: 320,
        minHeight: 320,
        maxWidth: 520,
        maxHeight: 760,
        safePadding: 12
    },
    clockWidget: {
        minWidth: 300,
        minHeight: 270,
        maxWidth: 460,
        maxHeight: 640,
        safePadding: 12
    },
    clock: {
        locale: "en-US",
        title: "Focus clock",
        timezoneLabel: "Local time",
        defaultMode: "pomodoro",
        modes: [
            { id: "pomodoro", label: "Pomodoro", durationMinutes: 25 },
            { id: "short", label: "Short Break", durationMinutes: 5 },
            { id: "long", label: "Long Break", durationMinutes: 15 }
        ]
    },
    profile: {
        label: "visual profile card",
        name: "Tuan Anh",
        tagline: "Mood-first interface designer | Building visual stories with motion and sound.",
        bio: "Swap in your own avatar later, then keep layering background scenes, playlist modules, and synced lyrics on top of this shell.",
        avatar: "./avatar.jpg",
        initials: "TA",
        verified: true,
        socialLinks: [
            { id: "facebook", label: "Facebook", href: "https://www.facebook.com/share/1P98dbzTBW/?mibextid=wwXIfr" },
            { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@tunanhnguyns1" },
            { id: "github", label: "GitHub", href: "https://github.com/tuananh810-fake" }
        ]
    },
    music: {
        defaultTrack: 0,
        defaultVolume: 72,
        fftSmoothing: 0.86,
        analysisBins: 18,
        playlist: [
            {
                id: "du-co-cach-xa",
                title: "Dù Có Cách Xa",
                artist: "Đinh Mạnh Ninh",
                note: "Track local with synced lyrics. Resize, reposition, or switch to focus mode while the song is playing.",
                file: "./du-co-cach-xa.mp3",
                artwork: "./avatar.jpg",
                lyrics: "./du-co-cach-xa.lrc"
            },
            {
                id: "local-track-01",
                title: "Local Track 01",
                artist: "Your neon playlist",
                note: "Original local track kept as a secondary item in the queue.",
                file: "./audio.mp3",
                artwork: "./avatar.jpg",
                lyrics: null
            }
        ]
    },
    audioReactive: {
        enabled: true,
        defaultIntensity: 0.62,
        minIntensity: 0,
        maxIntensity: 1,
        pulseDecay: 0.88,
        overallWeight: 0.42,
        bassWeight: 0.34,
        midWeight: 0.16,
        highWeight: 0.08
    },
    lyrics: {
        emptyTitle: "No synced lyrics yet.",
        emptyMessage: "Add a local .lrc file and link it in config.js under music.playlist[].lyrics.",
        emptyMeta: "Example: lyrics: \"./du-co-cach-xa.lrc\"",
        introMeta: "Synced line playback is ready. The overlay will follow audio.currentTime once a .lrc file is linked.",
        offsetMs: 0,
        display: {
            defaultTextScale: 1,
            defaultKineticMode: false,
            defaultKineticMaxWordsPerLine: 5,
            minKineticMaxWordsPerLine: 3,
            maxKineticMaxWordsPerLine: 8,
            defaultKineticMaxCharsPerLine: 20,
            minKineticMaxCharsPerLine: 10,
            maxKineticMaxCharsPerLine: 36,
            minTextScale: 0.6,
            maxTextScale: 3.4,
            scaleStep: 0.04,
            defaultChromeMode: "boxed",
            defaultTextAlign: "center",
            defaultPureMode: false,
            defaultOffsetX: 0,
            defaultOffsetY: 0,
            defaultWidth: 740,
            defaultHeight: 260,
            defaultBoxHaze: 58,
            minBoxHaze: 0,
            maxBoxHaze: 100,
            minWidth: 320,
            maxWidth: 2800,
            minHeight: 220,
            maxHeight: 1800,
            viewportPadding: 16,
            fontPresets: [
                {
                    id: "neo",
                    label: "Neo Mix",
                    family: "\"Space Grotesk\", \"Outfit\", sans-serif"
                },
                {
                    id: "vietnam",
                    label: "Be Vietnam",
                    family: "\"Be Vietnam Pro\", \"Outfit\", sans-serif"
                },
                {
                    id: "sora",
                    label: "Sora",
                    family: "\"Sora\", \"Outfit\", sans-serif"
                },
                {
                    id: "arial",
                    label: "Arial",
                    family: "Arial, Helvetica, sans-serif"
                },
                {
                    id: "times",
                    label: "Times New Roman",
                    family: "\"Times New Roman\", Times, serif"
                },
                {
                    id: "georgia",
                    label: "Georgia",
                    family: "Georgia, serif"
                },
                {
                    id: "serif",
                    label: "Spectral",
                    family: "\"Spectral\", Georgia, serif"
                },
                {
                    id: "caveat",
                    label: "Caveat",
                    family: "\"Caveat\", cursive"
                }
            ],
            defaultFontPreset: "neo"
        }
    },
    creativeWidget: {
        defaultTitle: "Northern Lights",
        defaultBody: "Background\nvisual scene",
        defaultTextScale: 1,
        minTextScale: 0.7,
        maxTextScale: 2.6,
        defaultFontPreset: "space",
        defaultTextAlign: "center",
        defaultTextColor: "#f7fbff",
        defaultAccentColor: "#9feeff",
        defaultChromeMode: "boxed",
        minWidth: 220,
        maxWidth: 760,
        minHeight: 180,
        maxHeight: 620,
        defaultWidth: 280,
        defaultHeight: 240,
        safePadding: 12,
        audioMotionStrength: 0.06,
        fontPresets: [
            {
                id: "space",
                label: "Space Grotesk",
                family: "\"Space Grotesk\", \"Outfit\", sans-serif"
            },
            {
                id: "outfit",
                label: "Outfit",
                family: "\"Outfit\", sans-serif"
            },
            {
                id: "vietnam",
                label: "Be Vietnam",
                family: "\"Be Vietnam Pro\", sans-serif"
            },
            {
                id: "arial",
                label: "Arial",
                family: "Arial, Helvetica, sans-serif"
            },
            {
                id: "times",
                label: "Times New Roman",
                family: "\"Times New Roman\", Times, serif"
            },
            {
                id: "serif",
                label: "Spectral",
                family: "\"Spectral\", Georgia, serif"
            }
        ]
    },
    card: {
        defaultWidth: 406,
        defaultHeight: 620,
        minWidth: 320,
        minHeight: 470,
        maxWidth: 520,
        maxHeight: 760,
        stagePadding: 12,
        tiltDegrees: 9
    }
};

export default APP_CONFIG;
