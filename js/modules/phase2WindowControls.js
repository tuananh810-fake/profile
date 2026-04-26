(() => {
  const INSTALL_FLAG = "__phase2DashboardWindowControlsInstalled";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const WINDOW_SELECTOR = [
    ".dashboard-window",
    ".floating-window",
    ".dashboard-floating-window",
    "[data-window-id]",
    "[data-dashboard-window]"
  ].join(",");

  const TAB_SELECTOR = [
    ".dashboard-sidebar button",
    ".dashboard-dock button",
    ".dashboard-nav button",
    ".dashboard-tab-button",
    "[data-window-tab]",
    "[data-panel-tab]",
    "[data-dashboard-tab]"
  ].join(",");

  const HEADER_SELECTOR = [
    ".dashboard-window-header",
    ".floating-window-header",
    ".window-header",
    "[data-window-header]"
  ].join(",");

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9à-ỹ\s_-]/gi, "");
  }

  function getText(el) {
    return normalize(el?.innerText || el?.textContent || "");
  }

  function getTabId(tab) {
    if (!tab) return "";

    return normalize(
      tab.dataset.windowTab ||
      tab.dataset.panelTab ||
      tab.dataset.dashboardTab ||
      tab.dataset.windowId ||
      tab.dataset.panelId ||
      tab.dataset.id ||
      tab.getAttribute("aria-controls") ||
      tab.getAttribute("data-target") ||
      tab.id ||
      getText(tab)
    );
  }

  function getWindowId(win) {
    if (!win) return "";

    const title = win.querySelector(
      ".dashboard-window-title, .floating-window-title, .window-title, [data-window-title]"
    );

    return normalize(
      win.dataset.windowId ||
      win.dataset.panelId ||
      win.dataset.dashboardWindow ||
      win.id ||
      title?.textContent ||
      ""
    );
  }

  function allWindows() {
    return Array.from(document.querySelectorAll(WINDOW_SELECTOR));
  }

  function allTabs() {
    return Array.from(document.querySelectorAll(TAB_SELECTOR));
  }

  function findWindowByTab(tab) {
    const id = getTabId(tab);
    if (!id) return null;

    const directId = tab.getAttribute("aria-controls");
    if (directId) {
      const direct = document.getElementById(directId);
      if (direct) return direct;
    }

    const wins = allWindows();

    let match = wins.find((win) => getWindowId(win) === id);
    if (match) return match;

    match = wins.find((win) => {
      const winId = getWindowId(win);
      return winId && (winId.includes(id) || id.includes(winId));
    });
    if (match) return match;

    const tabText = getText(tab);
    if (!tabText) return null;

    return wins.find((win) => {
      const title = getText(
        win.querySelector(
          ".dashboard-window-title, .floating-window-title, .window-title, [data-window-title]"
        )
      );

      return title && (title.includes(tabText) || tabText.includes(title));
    }) || null;
  }

  function markTabActive(tab, active) {
    if (!tab) return;
    tab.classList.toggle("is-active", Boolean(active));
    tab.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function showWindow(win) {
    if (!win) return;

    win.hidden = false;
    win.style.display = "";
    win.classList.add("is-open", "is-active");
    win.removeAttribute("aria-hidden");

    const currentZ = Number(document.documentElement.dataset.dashboardZ || 120);
    const nextZ = currentZ + 1;
    document.documentElement.dataset.dashboardZ = String(nextZ);
    win.style.zIndex = String(nextZ);
  }

  function closeWindow(win) {
    if (!win) return;

    const closeButton = win.querySelector(
      "[data-window-close], .dashboard-window-close, .floating-window-close, .window-close, [aria-label*='close' i], [title*='close' i]"
    );

    if (closeButton && closeButton !== document.activeElement) {
      closeButton.click();
      return;
    }

    win.classList.remove("is-open", "is-active");
    win.hidden = true;
    win.style.display = "none";
    win.setAttribute("aria-hidden", "true");
  }

  function bindTab(tab) {
    if (!tab || tab.dataset.phase2TabBound === "1") return;
    tab.dataset.phase2TabBound = "1";

    tab.addEventListener("click", () => {
      const win = findWindowByTab(tab);
      if (win) {
        showWindow(win);
        markTabActive(tab, true);
      }
    });

    tab.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const win = findWindowByTab(tab);
      if (win) {
        closeWindow(win);
        markTabActive(tab, false);
      }
    });
  }

  function ensureResizeHandle(win) {
    if (!win || win.dataset.phase2ResizeReady === "1") return;
    win.dataset.phase2ResizeReady = "1";

    let handle = win.querySelector(".dashboard-resize-handle, .resize-handle, [data-resize-handle]");

    if (!handle) {
      handle = document.createElement("button");
      handle.type = "button";
      handle.className = "dashboard-resize-handle";
      handle.setAttribute("data-resize-handle", "se");
      handle.setAttribute("aria-label", "Resize window");
      win.appendChild(handle);
    }

    handle.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = win.offsetWidth;
      const startHeight = win.offsetHeight;

      const minWidth = Number(win.dataset.minWidth || 320);
      const minHeight = Number(win.dataset.minHeight || 220);

      function onMove(moveEvent) {
        const nextWidth = Math.max(minWidth, startWidth + moveEvent.clientX - startX);
        const nextHeight = Math.max(minHeight, startHeight + moveEvent.clientY - startY);

        win.style.width = `${nextWidth}px`;
        win.style.height = `${nextHeight}px`;
      }

      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  }

  function bindBringToFront(win) {
    if (!win || win.dataset.phase2FocusBound === "1") return;
    win.dataset.phase2FocusBound = "1";

    win.addEventListener("mousedown", () => {
      const currentZ = Number(document.documentElement.dataset.dashboardZ || 120);
      const nextZ = currentZ + 1;
      document.documentElement.dataset.dashboardZ = String(nextZ);
      win.style.zIndex = String(nextZ);
    });
  }

  function bindFallbackDrag(win) {
    if (!win || win.dataset.phase2DragBound === "1") return;

    const header = win.querySelector(HEADER_SELECTOR);
    if (!header) return;

    win.dataset.phase2DragBound = "1";

    header.addEventListener("mousedown", (event) => {
      const ignored = event.target.closest(
        "button, input, textarea, select, a, .dashboard-resize-handle, .resize-handle, [data-resize-handle]"
      );

      if (ignored) return;

      event.preventDefault();

      const rect = win.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;

      win.style.position = "absolute";

      function onMove(moveEvent) {
        const nextLeft = startLeft + moveEvent.clientX - startX;
        const nextTop = startTop + moveEvent.clientY - startY;

        win.style.left = `${Math.max(0, nextLeft)}px`;
        win.style.top = `${Math.max(0, nextTop)}px`;
      }

      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  }

  function installStyle() {
    if (document.getElementById("phase2-dashboard-window-controls-style")) return;

    const style = document.createElement("style");
    style.id = "phase2-dashboard-window-controls-style";
    style.textContent = `
      .dashboard-sidebar button,
      .dashboard-dock button,
      .dashboard-nav button,
      .dashboard-tab-button,
      [data-window-tab],
      [data-panel-tab],
      [data-dashboard-tab] {
        min-width: 52px !important;
        min-height: 52px !important;
        padding: 10px 12px !important;
        border-radius: 16px !important;
        font-size: 14px !important;
        line-height: 1.2 !important;
        cursor: pointer !important;
        user-select: none !important;
      }

      .dashboard-window,
      .floating-window,
      .dashboard-floating-window,
      [data-window-id],
      [data-dashboard-window] {
        min-width: 320px !important;
        min-height: 220px !important;
        resize: none !important;
      }

      .dashboard-window-header,
      .floating-window-header,
      .window-header,
      [data-window-header] {
        min-height: 52px !important;
        padding: 12px 16px !important;
        cursor: move !important;
        user-select: none !important;
      }

      .dashboard-resize-handle,
      .resize-handle,
      [data-resize-handle] {
        position: absolute !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 34px !important;
        height: 34px !important;
        border: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        cursor: nwse-resize !important;
        z-index: 40 !important;
        pointer-events: auto !important;
      }

      .dashboard-resize-handle::after,
      .resize-handle::after,
      [data-resize-handle]::after {
        content: "";
        position: absolute;
        right: 9px;
        bottom: 9px;
        width: 12px;
        height: 12px;
        border-right: 2px solid rgba(190, 225, 255, 0.95);
        border-bottom: 2px solid rgba(190, 225, 255, 0.95);
        border-radius: 2px;
        filter: drop-shadow(0 0 6px rgba(100, 200, 255, 0.55));
      }
    `;

    document.head.appendChild(style);
  }

  function scan() {
    installStyle();

    allTabs().forEach(bindTab);

    allWindows().forEach((win) => {
      ensureResizeHandle(win);
      bindBringToFront(win);
      bindFallbackDrag(win);
    });
  }

  function scheduleScan() {
    clearTimeout(window.__phase2WindowControlScanTimer);
    window.__phase2WindowControlScanTimer = setTimeout(scan, 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan, { once: true });
  } else {
    scan();
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener("resize", scheduleScan);
})();
