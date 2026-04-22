/**
 * =========================================
 * PROFILE MODULE
 * =========================================
 * Handles profile information and interactions
 */

import { CONFIG } from '../config.js';

class ProfileManager {
    constructor() {
        this.profileFront = document.querySelector('.flip-card-front');
        this.followBtn = document.getElementById('followBtn');
        this.isFollowing = false;
        
        this.init();
    }

    /**
     * Initialize profile
     */
    init() {
        this.setupProfile();
        this.setupFollowButton();
        console.log('✅ Profile Manager initialized');
    }

    /**
     * Setup profile information from config
     */
    setupProfile() {
        const profile = CONFIG.profile;

        // Update DOM with profile info
        const profileName = document.querySelector('.profile-name');
        const profileTitle = document.querySelector('.profile-title');
        const profileAvatar = document.querySelector('.profile-avatar');

        if (profileName) profileName.textContent = profile.name;
        if (profileTitle) profileTitle.textContent = profile.title;
        if (profileAvatar) profileAvatar.src = profile.avatar;

        // Update stats
        const statsElements = document.querySelectorAll('.stat-value');
        const statsArray = Object.values(profile.stats);
        statsElements.forEach((el, index) => {
            if (statsArray[index] !== undefined) {
                el.textContent = statsArray[index];
            }
        });
    }

    /**
     * Setup follow button
     */
    setupFollowButton() {
        if (!this.followBtn) return;

        this.followBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFollow();
        });
    }

    /**
     * Toggle follow state
     */
    toggleFollow() {
        this.isFollowing = !this.isFollowing;

        if (this.isFollowing) {
            this.followBtn.textContent = 'Following ✓';
            this.followBtn.classList.add('following');
            console.log('👥 Followed');
        } else {
            this.followBtn.textContent = 'Follow +';
            this.followBtn.classList.remove('following');
            console.log('👥 Unfollowed');
        }
    }

    /**
     * Get profile data
     */
    getProfile() {
        return CONFIG.profile;
    }

    /**
     * Update profile name
     */
    setName(name) {
        CONFIG.profile.name = name;
        const profileName = document.querySelector('.profile-name');
        if (profileName) profileName.textContent = name;
    }

    /**
     * Get follow state
     */
    isFollowingUser() {
        return this.isFollowing;
    }
}

export default ProfileManager;
