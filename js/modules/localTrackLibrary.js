class LocalTrackLibrary {
    constructor({
        dbName = "profile-local-track-library",
        storeName = "tracks",
        backgroundStoreName = "backgroundAssets"
    } = {}) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.backgroundStoreName = backgroundStoreName;
        this.dbPromise = null;
    }

    async open() {
        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, 2);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: "id"
                    });
                    store.createIndex("updatedAt", "updatedAt");
                }
                if (!db.objectStoreNames.contains(this.backgroundStoreName)) {
                    db.createObjectStore(this.backgroundStoreName, {
                        keyPath: "kind"
                    });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB could not be opened."));
        });

        return this.dbPromise;
    }

    async getAll() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const rows = Array.isArray(request.result) ? request.result : [];
                rows.sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
                resolve(rows);
            };
            request.onerror = () => reject(request.error || new Error("Could not read saved tracks."));
        });
    }

    async get(id) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error("Could not read the saved track."));
        });
    }

    async put(record) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(record);

            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error || new Error("Could not save the track."));
        });
    }

    async delete(id) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error || new Error("Could not delete the track."));
        });
    }

    async getBackgroundAsset(kind) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.backgroundStoreName, "readonly");
            const store = transaction.objectStore(this.backgroundStoreName);
            const request = store.get(kind);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error("Could not read the background asset."));
        });
    }

    async putBackgroundAsset(record) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.backgroundStoreName, "readwrite");
            const store = transaction.objectStore(this.backgroundStoreName);
            const request = store.put(record);

            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error || new Error("Could not save the background asset."));
        });
    }

    async deleteBackgroundAsset(kind) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.backgroundStoreName, "readwrite");
            const store = transaction.objectStore(this.backgroundStoreName);
            const request = store.delete(kind);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error || new Error("Could not delete the background asset."));
        });
    }
}

export default LocalTrackLibrary;
