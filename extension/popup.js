document.addEventListener("DOMContentLoaded", function () {
  var toggleProxy = document.getElementById("toggleProxy");
  var proxyStatus = document.getElementById("proxyStatus");
  var resourceList = document.getElementById("resourceList");
  var copyButton = document.getElementById("copyResources");
  var clearButton = document.getElementById("clearResources");

  // init proxy status
  chrome.storage.local.get("proxyEnabled", function (data) {
    toggleProxy.checked = data.proxyEnabled;
    updateProxyStatus(data.proxyEnabled);
  });

  toggleProxy.addEventListener("change", function () {
    var isEnabled = this.checked;
    chrome.storage.local.set({ proxyEnabled: isEnabled }, function () {
      updateProxyStatus(isEnabled);
      updateProxy(isEnabled);
    });
  });

  function updateProxyStatus(isEnabled) {
    proxyStatus.textContent = isEnabled
      ? "System Proxy Enabled"
      : "System Proxy Disabled";
    proxyStatus.style.color = isEnabled ? "#4CAF50" : "#666";
  }

  function updateProxy(isEnabled) {
    if (isEnabled) {
      // Enable system proxy
      chrome.proxy.settings.set(
        {
          value: { mode: "system" },
          scope: "regular",
        },
        function () {}
      );
      chrome.action.setIcon({ path: "img/on/128.png" });
      chrome.action.setTitle({ title: "Proxy is ON" });
    } else {
      // Disable proxy (direct connection)
      chrome.proxy.settings.set(
        {
          value: { mode: "direct" },
          scope: "regular",
        },
        function () {}
      );
      chrome.action.setIcon({ path: "img/off/128.png" });
      chrome.action.setTitle({ title: "Proxy is OFF" });
    }
  }

  // get failed resources
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
