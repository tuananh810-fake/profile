(() => {
  "use strict";

  document
    .querySelectorAll(".legacy-dashboard-dock, .legacy-dashboard-window, [data-legacy-dashboard-bridge]")
    .forEach((element) => element.remove());

  localStorage.removeItem("profile.dashboard.legacyBridge.v1");
})();
