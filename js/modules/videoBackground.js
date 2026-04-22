/**
 * =========================================
 * VIDEO BACKGROUND MODULE
 * =========================================
 * Handles video background and scene switching
 */

import { CONFIG } from '../config.js';

class VideoBackgroundManager {
    constructor() {
        this.bgVideo = document.getElementById('bgVideo');
        this.videoSource = document.getElementById('videoSource');
        this.sceneBtn = document.querySelector('.scene-btn');
        this.sceneMenu = document.getElementById('sceneMenu');
        this.sceneOptions = document.querySelectorAll('.scene-option');
        this.currentScene = 0;
        
        this.init();
    }

    /**
     * Initialize video background
     */
    init() {
        this.setupSceneSelector();
        this.loadScene(0);
        console.log('✅ Video Background Manager initialized');
    }

    /**
     * Setup scene selector menu
     */
    setupSceneSelector() {
        // Toggle menu
        if (this.sceneBtn) {
            this.sceneBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.sceneMenu.classList.toggle('active');
            });
        }

        // Close menu on document click
        document.addEventListener('click', () => {
            this.sceneMenu.classList.remove('active');
        });

        // Scene option listeners
        this.sceneOptions.forEach((option) => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const sceneIndex = parseInt(option.dataset.scene);
                this.loadScene(sceneIndex);
                this.sceneMenu.classList.remove('active');
            });
        });
    }

    /**
     * Load video scene
     */
    loadScene(index) {
        if (index < 0 || index >= CONFIG.scenes.length) return;

        const scene = CONFIG.scenes[index];
        this.currentScene = index;
        
        // Set video source
        this.videoSource.src = scene.file;
        this.bgVideo.load();
        this.bgVideo.play().catch(() => {
            console.warn('⚠️ Video autoplay blocked. User interaction required.');
            this.bgVideo.muted = true;
            this.bgVideo.play();
        });

        console.log('🎬 Scene loaded:', scene.name);
    }

    /**
     * Get current scene
     */
    getCurrentScene() {
        return CONFIG.scenes[this.currentScene];
    }

    /**
     * Get all scenes
     */
    getScenes() {
        return CONFIG.scenes;
    }
}

export default VideoBackgroundManager;
