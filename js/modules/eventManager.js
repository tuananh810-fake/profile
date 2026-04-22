/**
 * =========================================
 * EVENT MANAGER MODULE
 * =========================================
 * Centralized event management
 */

class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to event
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }

    /**
     * Unsubscribe from event
     */
    off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;
        const callbacks = this.listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Emit event
     */
    emit(eventName, data) {
        if (!this.listeners.has(eventName)) return;
        this.listeners.get(eventName).forEach(callback => callback(data));
    }

    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
    }
}

export default EventManager;
