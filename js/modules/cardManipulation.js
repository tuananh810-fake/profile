/**
 * =========================================
 * CARD MANIPULATION MODULE - REWRITTEN
 * =========================================
 * Handles: Direct drag-to-move (transform), locking, video blur
 * Native CSS resize (resize: both)
 */

class CardManipulationManager {
    constructor() {
        this.cardWrapper = document.querySelector('.card-wrapper');
        this.lockBtn = document.getElementById('lockBtn');
        
        this.isLocked = false;
        this.isDragging = false;
        this.translateX = 0;
        this.translateY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        this.init();
        console.log('✅ Card Manipulation Manager initialized');
    }

    init() {
        // Lock button
        this.lockBtn.addEventListener('click', () => this.toggleLock());
        this.lockBtn.addEventListener('mousedown', (e) => e.stopPropagation());

        // Drag
        this.cardWrapper.addEventListener('mousedown', (e) => {
            if (!this.isLocked) {
                this.startDrag(e);
            }
        });

        // Shift+Scroll for blur (only blur, never zoom/scale card)
        document.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    }

    /**
     * Toggle lock state
     */
    toggleLock() {
        this.isLocked = !this.isLocked;
        
        if (this.isLocked) {
            // LOCKED
            this.lockBtn.innerHTML = '<i class="fas fa-lock"></i>';
            this.lockBtn.style.background = '#1DB954';
            this.cardWrapper.style.cursor = 'not-allowed';
            console.log('🔒 Card LOCKED');
        } else {
            // UNLOCKED
            this.lockBtn.innerHTML = '<i class="fas fa-lock-open"></i>';
            this.lockBtn.style.background = '#FF6B6B';
            this.cardWrapper.style.cursor = 'grab';
            console.log('🔓 Card UNLOCKED');
        }
    }

    /**
     * Start smooth drag with transform + RAF
     */
    startDrag(e) {
        if (e.button !== 0 || this.isLocked) return;
        
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        
        this.cardWrapper.style.cursor = 'grabbing';
        
        const onMouseMove = (event) => {
            if (!this.isDragging) return;
            
            const deltaX = event.clientX - this.dragStartX;
            const deltaY = event.clientY - this.dragStartY;
            
            requestAnimationFrame(() => {
                this.translateX += deltaX;
                this.translateY += deltaY;
                this.cardWrapper.style.transform = `translate(${this.translateX}px, ${this.translateY}px)`;
                
                this.dragStartX = event.clientX;
                this.dragStartY = event.clientY;
            });
        };

        const onMouseUp = () => {
            this.isDragging = false;
            this.cardWrapper.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Shift+Scroll ONLY for background blur
     * NEVER zoom or scale card, only adjust blur
     */
    handleWheel(e) {
        if (!e.shiftKey) return;
        
        e.preventDefault();
        
        const video = document.getElementById('bgVideo');
        if (!video) return;
        
        const delta = e.deltaY > 0 ? 0.5 : -0.5;
        const currentBlur = parseFloat(video.style.filter?.match(/\d+(\.\d+)?/)?.[0] || '0');
        const newBlur = Math.max(0, Math.min(15, currentBlur + delta));
        
        video.style.filter = `blur(${newBlur}px)`;
        console.log(`📺 Blur: ${newBlur}px`);
    }
}

export default CardManipulationManager;
