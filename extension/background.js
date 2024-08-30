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