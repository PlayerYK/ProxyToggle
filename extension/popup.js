document.addEventListener("DOMContentLoaded", function () {
  var toggleProxy = document.getElementById("toggleProxy");
  var proxyStatus = document.getElementById("proxyStatus");
  var shortcutStatus = document.getElementById("shortcutStatus");
  var shortcutButton = document.getElementById("openShortcutSettings");
  var notificationStatus = document.getElementById("notificationStatus");
  var notificationButton = document.getElementById("toggleNotifications");
  var resourceList = document.getElementById("resourceList");
  var copyButton = document.getElementById("copyResources");
  var clearButton = document.getElementById("clearResources");

  loadProxyState();
  loadShortcutState();
  loadNotificationState();
  loadFailedResources();

  toggleProxy.addEventListener("change", function () {
    var isEnabled = this.checked;
    toggleProxy.disabled = true;

    chrome.runtime.sendMessage(
      { action: "setProxyEnabled", enabled: isEnabled },
      function (response) {
        toggleProxy.disabled = false;

        if (chrome.runtime.lastError || (response && response.error)) {
          toggleProxy.checked = !isEnabled;
          updateProxyStatus(!isEnabled);
          return;
        }

        updateProxyStatus(response.enabled);
      }
    );
  });

  shortcutButton.addEventListener("click", function () {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  notificationButton.addEventListener("click", function () {
    chrome.permissions.contains(
      { permissions: ["notifications"] },
      function (granted) {
        if (granted) {
          chrome.permissions.remove(
            { permissions: ["notifications"] },
            function () {
              chrome.storage.local.set({ shortcutNotificationPromptedV2: true });
              loadNotificationState();
            }
          );
          return;
        }

        chrome.permissions.request(
          { permissions: ["notifications"] },
          function (wasGranted) {
            var permissionError = chrome.runtime.lastError;
            chrome.storage.local.set({ shortcutNotificationPromptedV2: true });
            loadNotificationState();

            if (wasGranted && !permissionError) {
              chrome.runtime.sendMessage({
                action: "showProxyNotificationPreview",
              });
            }

            if (!wasGranted || permissionError) {
              notificationButton.textContent = "Enable";
            }
          }
        );
      }
    );
  });

  // copy resource list
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      const resources = Array.from(resourceList.children)
        .map((li) => li.textContent)
        .filter((text) => text !== "No failed resources")
        .join("\n");
      navigator.clipboard.writeText(resources).then(function () {
        copyButton.textContent = "Copied!";
        setTimeout(function () {
          copyButton.textContent = "Copy List";
        }, 2000);
      });
    });
  }

  // clear resource list
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.runtime.sendMessage(
          { action: "clearFailedResources", tabId: tabs[0].id },
          function (response) {
            updateResourceList([]);
            clearButton.textContent = "Cleared!";
            setTimeout(function () {
              clearButton.textContent = "Clear List";
            }, 2000);
          }
        );
      });
    });
  }

  function loadProxyState() {
    chrome.runtime.sendMessage({ action: "getProxyState" }, function (response) {
      if (chrome.runtime.lastError || !response) {
        updateProxyStatus(false);
        toggleProxy.checked = false;
        return;
      }

      toggleProxy.checked = response.enabled;
      updateProxyStatus(response.enabled);
    });
  }

  function loadShortcutState() {
    chrome.commands.getAll(function (commands) {
      var toggleCommand = commands.find(function (command) {
        return command.name === "toggle-proxy";
      });
      var shortcut = toggleCommand && toggleCommand.shortcut;

      shortcutStatus.textContent = shortcut || "Not set";
      shortcutButton.textContent = shortcut ? "Change" : "Set Shortcut";
    });
  }

  function loadNotificationState() {
    chrome.permissions.contains(
      { permissions: ["notifications"] },
      function (granted) {
        notificationStatus.textContent = granted ? "Enabled" : "Disabled";
        notificationStatus.style.color = granted ? "#4CAF50" : "#666";
        notificationButton.textContent = granted ? "Disable" : "Enable";
      }
    );
  }

  function loadFailedResources() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.runtime.sendMessage(
        { action: "getFailedResources", tabId: tabs[0].id },
        function (response) {
          if (response && response.failedResources.length > 0) {
            updateResourceList(response.failedResources);
          } else {
            updateResourceList([]);
          }
        }
      );
    });
  }

  function updateProxyStatus(isEnabled) {
    proxyStatus.textContent = isEnabled
      ? "System Proxy Enabled"
      : "System Proxy Disabled";
    proxyStatus.style.color = isEnabled ? "#4CAF50" : "#666";
  }
});

function updateResourceList(resources) {
  const resourceList = document.getElementById("resourceList");
  const copyButton = document.getElementById("copyResources");
  const clearButton = document.getElementById("clearResources");

  resourceList.innerHTML = "";

  if (resources.length > 0) {
    resources.forEach((resource) => {
      const li = document.createElement("li");
      li.textContent = resource;
      resourceList.appendChild(li);
    });
    copyButton.style.display = "inline-block";
    clearButton.style.display = "inline-block";
  } else {
    const li = document.createElement("li");
    li.textContent = "No failed resources";
    li.style.color = "#999";
    resourceList.appendChild(li);
    copyButton.style.display = "none";
    clearButton.style.display = "none";
  }
}
