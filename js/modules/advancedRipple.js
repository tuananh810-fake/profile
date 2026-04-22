/**
 * =========================================
 * ADVANCED RIPPLE EFFECT MODULE
 * =========================================
 * Creates pressure-sensitive ripple effects based on click force
 * Ripples expand based on click intensity (simulated with animation)
 */

class AdvancedRippleManager {
    constructor() {
        this.container = document.querySelector('.background-container');
        this.ripples = [];
        this.rippleId = 0;
        
        // Ripple container (SVG for better performance)
        this.createRippleContainer();
        
        // Mouse event tracking
        this.lastClickTime = 0;
        this.clickCount = 0;
        this.clickThreshold = 300; // ms for multi-click detection
        
        this.init();
        
        console.log('✅ Advanced Ripple Manager initialized');
    }

    /**
     * Create SVG container for ripples
     */
    createRippleContainer() {
        this.rippleContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.rippleContainer.setAttribute('id', 'rippleContainer');
        this.rippleContainer.setAttribute('width', window.innerWidth);
        this.rippleContainer.setAttribute('height', window.innerHeight);
        this.rippleContainer.style.position = 'fixed';
        this.rippleContainer.style.top = '0';
        this.rippleContainer.style.left = '0';
        this.rippleContainer.style.pointerEvents = 'none';
        this.rippleContainer.style.zIndex = '3';
        
        document.body.appendChild(this.rippleContainer);
        
        // Resize on window resize
        window.addEventListener('resize', () => this.resizeRippleContainer());
    }

    /**
     * Resize ripple container on window resize
     */
    resizeRippleContainer() {
        this.rippleContainer.setAttribute('width', window.innerWidth);
        this.rippleContainer.setAttribute('height', window.innerHeight);
    }

    /**
     * Initialize event listeners
     */
    init() {
        document.addEventListener('mousedown', (e) => this.createRipple(e));
        window.addEventListener('resize', () => this.resizeRippleContainer());
        
        // Animation loop for ripples
        this.startAnimationLoop();
        
        // Mousemove to create ripples
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            this.createRipple({ clientX: x, clientY: y });
        });
    }

    /**
     * Create ripple at click position
     */
    createRipple(e) {
        // Don't create ripples on buttons or interactive elements
        if (this.isInteractiveElement(e.target)) return;
        
        const x = e.clientX;
        const y = e.clientY;
        
        // Calculate click intensity based on rapid clicks
        const now = Date.now();
        if (now - this.lastClickTime < this.clickThreshold) {
            this.clickCount++;
        } else {
            this.clickCount = 1;
        }
        this.lastClickTime = now;
        
        // Intensity: 1 to 3 (based on click count)
        const intensity = Math.min(3, this.clickCount);
        
        // Create ripple object
        const ripple = {
            id: this.rippleId++,
            x,
            y,
            startRadius: 5,
            maxRadius: 150 + intensity * 100, // Bigger for multiple clicks
            currentRadius: 5,
            startTime: now,
            duration: 600 + intensity * 200, // Longer for bigger ripples
            intensity,
            opacity: 1,
            circle: null,
            active: true
        };
        
        // Create SVG circle
        ripple.circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ripple.circle.setAttribute('cx', x);
        ripple.circle.setAttribute('cy', y);
        ripple.circle.setAttribute('r', ripple.startRadius);
        ripple.circle.setAttribute('fill', 'none');
        ripple.circle.setAttribute('stroke', `rgba(255, 255, 255, ${0.5 * intensity})`);
        ripple.circle.setAttribute('stroke-width', '2');
        ripple.circle.style.filter = `drop-shadow(0 0 ${5 * intensity}px rgba(255, 255, 255, 0.3))`;
        
        this.rippleContainer.appendChild(ripple.circle);
        this.ripples.push(ripple);
        
        console.log(`💧 Ripple created: intensity=${intensity}, maxRadius=${ripple.maxRadius}px`);
    }

    /**
     * Check if element is interactive (skip ripple)
     */
    isInteractiveElement(element) {
        const interactiveSelectors = ['button', 'a', 'input', 'textarea', '.control-btn', '.move-btn', '.lock-btn', '.flip-zone'];
        
        for (const selector of interactiveSelectors) {
            if (element.closest(selector)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Animation loop for ripples
     */
    startAnimationLoop() {
        const animate = () => {
            const now = Date.now();
            
            // Update each ripple
            for (let i = this.ripples.length - 1; i >= 0; i--) {
                const ripple = this.ripples[i];
                
                if (!ripple.active) continue;
                
                const elapsed = now - ripple.startTime;
                const progress = Math.min(1, elapsed / ripple.duration);
                
                // Calculate radius with easing (ease-out)
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                ripple.currentRadius = ripple.startRadius + (ripple.maxRadius - ripple.startRadius) * easeProgress;
                
                // Calculate opacity (fade out)
                ripple.opacity = Math.max(0, 1 - progress);
                
                // Update circle
                ripple.circle.setAttribute('r', ripple.currentRadius);
                ripple.circle.setAttribute('stroke', `rgba(255, 255, 255, ${ripple.opacity * 0.5 * ripple.intensity})`);
                ripple.circle.style.filter = `drop-shadow(0 0 ${5 * ripple.intensity * ripple.opacity}px rgba(255, 255, 255, ${0.3 * ripple.opacity}))`;
                
                // Remove when done
                if (progress >= 1) {
                    ripple.active = false;
                    ripple.circle.remove();
                    this.ripples.splice(i, 1);
                }
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Clear all ripples
     */
    clearRipples() {
        this.ripples.forEach(ripple => {
            if (ripple.circle) {
                ripple.circle.remove();
            }
        });
        this.ripples = [];
    }

    /**
     * Get ripple count
     */
    getRippleCount() {
        return this.ripples.filter(r => r.active).length;
    }
}

export default AdvancedRippleManager;
