let proxyEnabled = false;

chrome.action.onClicked.addListener(function(tab) {
  proxyEnabled = !proxyEnabled;
  updateProxy();
});

function updateProxy() {
  if (proxyEnabled) {
    // Enable system proxy
    chrome.proxy.settings.set(
      {
        value: {mode: "system"},
        scope: "regular"
      },
      function() {}
    );
    chrome.action.setIcon({path: "img/on/128.png"});
    chrome.action.setTitle({ title: "Proxy is ON" });
  } else {
    // Disable proxy (direct connection)
    chrome.proxy.settings.set(
      {
        value: {mode: "direct"},
        scope: "regular"
      },
      function() {}
    );
    chrome.action.setIcon({path: "img/off/128.png"});
    chrome.action.setTitle({ title: "Proxy is OFF" });
  }
  
  // Save the current state
  chrome.storage.local.set({proxyEnabled: proxyEnabled}, function() {
    console.log('Proxy state saved');
  });
}

// Load the saved state when the extension starts
chrome.storage.local.get(['proxyEnabled'], function(result) {
  if (result.proxyEnabled !== undefined) {
    proxyEnabled = result.proxyEnabled;
    updateProxy();
  }
});

// Add the following code at the end of the file
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    chrome.proxy.settings.get({}, function(config) {
      if (config.value.mode === "system") {
        proxyEnabled = true;
        chrome.action.setIcon({path: "img/on/128.png"});
      } else {
        proxyEnabled = false;
        chrome.action.setIcon({path: "img/off/128.png"});
      }
      // Save initial state
      chrome.storage.local.set({proxyEnabled: proxyEnabled}, function() {
        console.log('Initial proxy state saved');
      });
    });
  }
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "resourceFailed") {
    const tabId = sender.tab.id;
    if (!failedDomainsByTab[tabId]) {
      failedDomainsByTab[tabId] = new Set();
    }
    failedDomainsByTab[tabId].add(message.domain);
    updateBadgeForTab(tabId);
    sendResponse({ received: true });
  }
});

function updateBadgeForTab(tabId) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].id === tabId) {
      const count = failedDomainsByTab[tabId]
        ? failedDomainsByTab[tabId].size
        : 0;
      chrome.action.setBadgeText({
        text: count > 0 ? count.toString() : "",
        tabId: tabId,
      });
      chrome.action.setBadgeBackgroundColor({ color: "#333333", tabId: tabId }); // 改为深色背景
      chrome.action.setBadgeTextColor({ color: "#FFFFFF", tabId: tabId }); // 设置白色文字
    }
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
