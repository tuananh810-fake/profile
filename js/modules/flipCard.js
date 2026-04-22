/**
 * =========================================
 * FLIP CARD MODULE
 * =========================================
 * Handles flip card animation and zone detection
 */

import { CONFIG } from '../config.js';

class FlipCardManager {
    constructor() {
        this.flipCard = document.getElementById('flipCard');
        this.cardWrapper = document.getElementById('cardWrapper');
        this.isFlipped = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Flip zones
        this.flipZones = {
            front: {
                left: document.getElementById('flipZoneLeft'),
                right: document.getElementById('flipZoneRight')
            },
            back: {
                left: document.getElementById('flipZoneBackLeft'),
                right: document.getElementById('flipZoneBackRight')
            }
        };
        
        this.init();
    }

    /**
     * Initialize flip card
     */
    init() {
        this.setupFlipZones();
        this.setupDrag();
        console.log('✅ Flip Card Manager initialized');
    }

    /**
     * Setup flip zone event listeners
     */
    setupFlipZones() {
        // Front side flip zones
        if (this.flipZones.front.left) {
            this.flipZones.front.left.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        if (this.flipZones.front.right) {
            this.flipZones.front.right.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        // Back side flip zones
        if (this.flipZones.back.left) {
            this.flipZones.back.left.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        if (this.flipZones.back.right) {
            this.flipZones.back.right.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
    }

    /**
     * Setup drag functionality
     */
    setupDrag() {
        this.cardWrapper.addEventListener('mousedown', (e) => this.startDrag(e));
    }

    /**
     * Check if mouse is in flip zone
     */
    isMouseInFlipZone(e) {
        const rect = this.flipCard.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const zoneWidth = rect.width * CONFIG.flipCard.flipZoneWidth;
        return relX < zoneWidth || relX > rect.width - zoneWidth;
    }

    /**
     * Start dragging (only if NOT in flip zone)
     */
    startDrag(e) {
        if (this.isMouseInFlipZone(e)) return;
        
        this.isDragging = true;
        this.cardWrapper.classList.add('dragging');

        const rect = this.cardWrapper.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
    }

    /**
     * Drag the card
     */
    drag(e) {
        if (!this.isDragging) return;

        const cardX = e.clientX - this.dragOffset.x;
        const cardY = e.clientY - this.dragOffset.y;

        this.cardWrapper.style.left = cardX + 'px';
        this.cardWrapper.style.top = cardY + 'px';
        this.cardWrapper.style.transform = 'translate(0, 0)';
    }

    /**
     * Stop dragging
     */
    stopDrag() {
        this.isDragging = false;
        this.cardWrapper.classList.remove('dragging');
        document.removeEventListener('mousemove', (e) => this.drag(e));
        document.removeEventListener('mouseup', () => this.stopDrag());
    }

    /**
     * Toggle flip animation
     */
    toggle() {
        this.isFlipped = !this.isFlipped;
        this.flipCard.classList.toggle('flipped');
        console.log('💿 Card flipped:', this.isFlipped ? 'Music' : 'Profile');
    }

    /**
     * Get flip state
     */
    getState() {
        return {
            isFlipped: this.isFlipped,
            isDragging: this.isDragging
        };
    }
}

export default FlipCardManager;
