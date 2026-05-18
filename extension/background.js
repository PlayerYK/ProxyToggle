let proxyEnabled = false;
let initPromise = initializeProxyState();

const TOGGLE_COMMAND = "toggle-proxy";
const NOTIFICATION_PERMISSION = "notifications";
const NOTIFICATION_PROMPT_KEY = "shortcutNotificationPromptedV2";
const PROXY_NOTIFICATION_ID = "proxy-toggle-state";
const PROXY_BADGE_TIMEOUT_MS = 1500;

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

function storageSet(values) {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, resolve);
  });
}

function setProxyMode(mode) {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.set(
      {
        value: { mode },
        scope: "regular",
      },
      function () {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      }
    );
  });
}

function getProxyConfig() {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.get({}, function (config) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(config);
    });
  });
}

async function initializeProxyState() {
  const result = await storageGet(["proxyEnabled"]);

  if (result.proxyEnabled !== undefined) {
    proxyEnabled = Boolean(result.proxyEnabled);
    try {
      await applyProxyState(proxyEnabled);
    } catch (error) {
      await updateActionState();
    }
    return;
  }

  try {
    const config = await getProxyConfig();
    proxyEnabled = config.value && config.value.mode === "system";
  } catch (error) {
    proxyEnabled = false;
  }

  await updateActionState();
  await storageSet({ proxyEnabled });
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeProxyState();
  }

  return initPromise;
}

async function updateActionState() {
  chrome.action.setIcon({
    path: proxyEnabled ? "img/on/128.png" : "img/off/128.png",
  });
  chrome.action.setTitle({
    title: proxyEnabled ? "Proxy is ON" : "Proxy is OFF",
  });
}

async function applyProxyState(enabled) {
  const nextProxyEnabled = Boolean(enabled);
  await setProxyMode(nextProxyEnabled ? "system" : "direct");
  proxyEnabled = nextProxyEnabled;
  await updateActionState();
  await storageSet({ proxyEnabled });
  return { enabled: proxyEnabled };
}

async function toggleProxyState(source) {
  await ensureInitialized();
  const state = await applyProxyState(!proxyEnabled);

  if (source === "command") {
    handleShortcutFeedback(state.enabled).catch(function () {});
  }

  return state;
}

async function getActionUserSettings() {
  if (!chrome.action.getUserSettings) {
    return { isOnToolbar: false };
  }

  try {
    return await chrome.action.getUserSettings();
  } catch (error) {
    return { isOnToolbar: false };
  }
}

function hasNotificationPermission() {
  return new Promise((resolve) => {
    chrome.permissions.contains(
      { permissions: [NOTIFICATION_PERMISSION] },
      function (granted) {
        resolve(Boolean(granted));
      }
    );
  });
}

function requestNotificationPermission() {
  return new Promise((resolve) => {
    chrome.permissions.request(
      { permissions: [NOTIFICATION_PERMISSION] },
      function (granted) {
        if (chrome.runtime.lastError) {
          resolve({ granted: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve({ granted: Boolean(granted), error: "" });
      }
    );
  });
}

function showProxyNotification(enabled) {
  if (!chrome.notifications) {
    return;
  }

  const iconPath = enabled ? "img/on/128.png" : "img/off/128.png";
  const message = enabled
    ? "System proxy is enabled."
    : "Direct connection is enabled.";
  chrome.notifications.create(
    PROXY_NOTIFICATION_ID,
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL(iconPath),
      title: "Proxy Toggle",
      message,
      priority: 2,
    },
    function () {
      if (chrome.runtime.lastError) {
        return;
      }
    }
  );
}

async function maybeShowShortcutNotification(enabled) {
  let granted = await hasNotificationPermission();

  if (!granted) {
    const result = await storageGet([NOTIFICATION_PROMPT_KEY]);

    if (result[NOTIFICATION_PROMPT_KEY]) {
      return;
    }

    const permissionResult = await requestNotificationPermission();
    granted = permissionResult.granted;

    if (!permissionResult.error) {
      await storageSet({ [NOTIFICATION_PROMPT_KEY]: true });
    }
  }

  if (granted) {
    showProxyNotification(enabled);
  }
}

function showProxyBadge(enabled) {
  const text = enabled ? "ON" : "OFF";
  const color = enabled ? "#4CAF50" : "#666666";

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tabId = tabs[0] && tabs[0].id;
    const badgeOptions = tabId ? { text, tabId } : { text };

    chrome.action.setBadgeText(badgeOptions);
    chrome.action.setBadgeBackgroundColor({
      color,
      ...(tabId ? { tabId } : {}),
    });

    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({
        color: "#FFFFFF",
        ...(tabId ? { tabId } : {}),
      });
    }

    setTimeout(function () {
      if (tabId) {
        updateBadgeForTab(tabId);
        return;
      }
      chrome.action.setBadgeText({ text: "" });
    }, PROXY_BADGE_TIMEOUT_MS);
  });
}

async function handleShortcutFeedback(enabled) {
  const userSettings = await getActionUserSettings();

  if (userSettings.isOnToolbar) {
    showProxyBadge(enabled);
  }

  await maybeShowShortcutNotification(enabled);
}

chrome.commands.onCommand.addListener(function (command) {
  if (command !== TOGGLE_COMMAND) {
    return;
  }

  toggleProxyState("command").catch(function () {});
});

chrome.runtime.onInstalled.addListener(function () {
  initPromise = initializeProxyState();
});

// 使用对象来存储每个 tab 的失败域名
let failedDomainsByTab = {};

function handleFailedRequest(details) {
  const url = new URL(details.url);
  const tabId = details.tabId;

  if (tabId === -1) return; // 忽略不属于特定标签页的请求

  if (!failedDomainsByTab[tabId]) {
    failedDomainsByTab[tabId] = new Set();
  }
  failedDomainsByTab[tabId].add(url.hostname);
  updateBadgeForTab(tabId);
}

chrome.webRequest.onErrorOccurred.addListener(handleFailedRequest, {
  urls: ["<all_urls>"],
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getProxyState") {
    ensureInitialized()
      .then(function () {
        sendResponse({ enabled: proxyEnabled });
      })
      .catch(function (error) {
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (request.action === "setProxyEnabled") {
    ensureInitialized()
      .then(function () {
        return applyProxyState(request.enabled);
      })
      .then(sendResponse)
      .catch(function (error) {
        sendResponse({ error: error.message, enabled: proxyEnabled });
      });
    return true;
  }

  if (request.action === "toggleProxy") {
    toggleProxyState(request.source)
      .then(sendResponse)
      .catch(function (error) {
        sendResponse({ error: error.message, enabled: proxyEnabled });
      });
    return true;
  }

  if (request.action === "showProxyNotificationPreview") {
    ensureInitialized()
      .then(function () {
        return hasNotificationPermission();
      })
      .then(function (granted) {
        if (granted) {
          showProxyNotification(proxyEnabled);
        }
        sendResponse({ success: granted });
      })
      .catch(function (error) {
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (request.action === "getFailedResources") {
    const failedResources = Array.from(failedDomainsByTab[request.tabId] || []);
    sendResponse({ failedResources: failedResources });
  } else if (request.action === "clearFailedResources") {
    clearFailedDomainsForTab(request.tabId);
    sendResponse({ success: true });
  }
});

function updateBadgeForTab(tabId) {
  chrome.tabs.get(tabId, function (tab) {
    if (chrome.runtime.lastError) {
      return;
    }
    // 标签页存在，继续处理
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].id === tabId) {
        const count = failedDomainsByTab[tabId]
          ? failedDomainsByTab[tabId].size
          : 0;
        chrome.action.setBadgeText({
          text: count > 0 ? count.toString() : "",
          tabId: tabId,
        });
        chrome.action.setBadgeBackgroundColor({
          color: "#333333",
          tabId: tabId,
        }); // 改为深色背景
        chrome.action.setBadgeTextColor({ color: "#FFFFFF", tabId: tabId }); // 设置白色文字
      }
    });
  });
}

// 当标签页更新时更新 badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateBadgeForTab(tabId);
  }
});

// 当切换标签页时更新 badge
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateBadgeForTab(activeInfo.tabId);
});

// 清除特定标签页的失败域名列表
function clearFailedDomainsForTab(tabId) {
  if (failedDomainsByTab[tabId]) {
    delete failedDomainsByTab[tabId];
  }
  updateBadgeForTab(tabId);
}

// 当标签页被移除时，清除相应的失败域名列表
chrome.tabs.onRemoved.addListener((tabId) => {
  clearFailedDomainsForTab(tabId);
});

// 当新标签页创建时，确保它没有失败域名记录
chrome.tabs.onCreated.addListener((tab) => {
  clearFailedDomainsForTab(tab.id);
});
