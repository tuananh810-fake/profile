import LifeAtWorkspaceSafe from "./lifeatWorkspaceSafe.js";
import installLyricSyncRescue from "./lyricSyncRescue.js";

(() => {
    if (window.__lifeatSafeBootstrapInstalled) return;
    window.__lifeatSafeBootstrapInstalled = true;

    function removeOldUi() {
        document.querySelectorAll(".lifeat-workspace, .lifeat-workspace-stable, .legacy-dashboard-dock, .legacy-dashboard-window, .dashboard-sidebar, .dashboard-window").forEach((node) => node.remove());
    }

    function install() {
        const app = window.profileApp;
        if (!app || app.__lifeatSafeBootstrapApplied) return Boolean(app && app.__lifeatSafeBootstrapApplied);
        removeOldUi();
        app.lifeAtWorkspace = new LifeAtWorkspaceSafe({
            appShell: app.appShell,
            shell: app.shell,
            centerCard: app.centerCard,
            lyricsEngine: app.lyricsEngine,
            musicPlayer: app.musicPlayer,
            clockWidget: app.clockWidget,
            creativeWidget: app.creativeWidget,
            customizerPanel: app.customizerPanel,
            backgroundEngine: app.backgroundEngine,
            config: app.config
        });
        app.lifeAtWorkspace.init();
        app.lyricSyncRescue = installLyricSyncRescue({
            audio: document.getElementById("musicAudio"),
            musicPlayer: app.musicPlayer,
            root: document.getElementById("lyricsOverlay")
        });
        app.__lifeatSafeBootstrapApplied = true;
        return true;
    }

    const timer = window.setInterval(() => {
        if (install()) window.clearInterval(timer);
    }, 100);
    window.addEventListener("load", install, { once: true });
})();
