/**
 * =========================================
 * AUDIO REACTIVE MANAGER
 * =========================================
 * Uses Web Audio API to analyze frequency data
 * Makes card pulse/scale with audio bass
 */

class AudioReactiveManager {
    constructor() {
        this.audio = document.getElementById('localAudio');
        this.card = document.getElementById('flipCard');
        this.volumeSlider = document.getElementById('globalVolumeSlider');
        
        // Web Audio API
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isInitialized = false;
        
        // State
        this.isPlaying = false;
        this.bassValue = 0;
        this.animationId = null;
        
        // Configuration
        this.minScale = 1.0;
        this.maxScale = 1.08;
        this.smoothing = 0.8;
        
        this.init();
        
        console.log('✅ Audio Reactive Manager initialized');
    }

    /**
     * Initialize Web Audio API
     */
    init() {
        // Volume slider
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.audio.volume = volume;
            });
        }

        // Audio controls
        this.audio.addEventListener('play', () => {
            this.onAudioPlay();
        });

        this.audio.addEventListener('pause', () => {
            this.onAudioPause();
        });

        this.audio.addEventListener('ended', () => {
            this.onAudioEnded();
        });
    }

    /**
     * Initialize Web Audio API on first play
     */
    onAudioPlay() {
        this.isPlaying = true;

        // Create context on first play (user interaction required)
        if (!this.isInitialized) {
            this.initWebAudio();
        }

        // Start analysis loop
        this.startAnalysis();
        console.log('▶️ Audio playing - Starting analysis');
    }

    /**
     * Init Web Audio API
     */
    initWebAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = this.smoothing;
            
            // Connect audio element to analyser
            const source = this.audioContext.createMediaElementAudioSource(this.audio);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Create data array for frequency data
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.isInitialized = true;
            console.log('🎵 Web Audio API initialized');
        } catch (err) {
            console.error('❌ Web Audio API error:', err);
        }
    }

    /**
     * Start frequency analysis loop
     */
    startAnalysis() {
        const analyze = () => {
            if (!this.isPlaying || !this.analyser) return;

            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);

            // Extract bass (first 1/3 of spectrum)
            const bassEnd = Math.floor(this.dataArray.length / 3);
            let bassSum = 0;
            
            for (let i = 0; i < bassEnd; i++) {
                bassSum += this.dataArray[i];
            }
            
            const bassAverage = bassSum / bassEnd / 255; // Normalize to 0-1
            this.bassValue = bassAverage;

            // Update card scale
            this.updateCardScale();

            this.animationId = requestAnimationFrame(analyze);
        };

        analyze();
    }

    /**
     * Update card scale based on bass
     */
    updateCardScale() {
        // Map bass value to scale
        const scale = this.minScale + (this.bassValue * (this.maxScale - this.minScale));
        
        // Apply transform
        this.card.style.transform = `scale(${scale.toFixed(4)})`;
    }

    /**
     * Pause audio
     */
    onAudioPause() {
        this.isPlaying = false;
        
        // Cancel animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Reset scale
        this.card.style.transform = 'scale(1)';
        
        console.log('⏸️ Audio paused');
    }

    /**
     * Audio ended
     */
    onAudioEnded() {
        this.onAudioPause();
        console.log('⏹️ Audio ended - Card reset to normal size');
    }

    /**
     * Get current bass value
     */
    getBassValue() {
        return this.bassValue;
    }

    /**
     * Get audio playing state
     */
    isAudioPlaying() {
        return this.isPlaying;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        console.log('🗑️ Audio Reactive Manager destroyed');
    }
}

export default AudioReactiveManager;
