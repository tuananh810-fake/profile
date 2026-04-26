import FunctionRailWorkspace from "./functionRailWorkspace.js";

(() => {
    if (window.__functionRailBootstrapInstalled) return;
    window.__functionRailBootstrapInstalled = true;

    function install() {
        const app = window.profileApp;
        if (!app || app.__functionRailWorkspaceApplied) return Boolean(app && app.__functionRailWorkspaceApplied);

        document
            .querySelectorAll(".lifeat-workspace, .lifeat-workspace-stable, .safe-lifeat, .safe-workspace, .tool-workspace, .legacy-dashboard-dock, .legacy-dashboard-window, .dashboard-sidebar, .dashboard-window")
            .forEach((node) => node.remove());

        app.lifeAtWorkspace = new FunctionRailWorkspace({
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
        app.__functionRailWorkspaceApplied = true;
        return true;
    }

    const timer = window.setInterval(() => {
        if (install()) window.clearInterval(timer);
    }, 100);
    window.addEventListener("load", install, { once: true });
})();
