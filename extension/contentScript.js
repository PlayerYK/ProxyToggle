function handleResourceError(url) {
  chrome.runtime.sendMessage({
    type: "resourceFailed",
    domain: url.hostname,
  });
}

// 使用 error 事件监听器捕获资源加载失败（更可靠的方法）
window.addEventListener(
  "error",
  (event) => {
    if (event.target instanceof HTMLElement) {
      const element = event.target;
      // 只处理实际的资源加载失败
      if (element.tagName === "IMG" || element.tagName === "SCRIPT" || 
          element.tagName === "LINK" || element.tagName === "IFRAME") {
        const url = element.src || element.href;
        if (url && url.startsWith("http")) {
          try {
            handleResourceError(new URL(url));
          } catch (e) {
            // 忽略无效的 URL
          }
        }
      }
    }
  },
  true
);

// 使用 PerformanceObserver 作为补充检测（仅检测有明确错误的资源）
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    // 检查资源是否真的失败：transferSize 为 0 且 duration 很短通常表示失败
    if (entry.entryType === "resource" && 
        entry.transferSize === 0 && 
        entry.duration < 50 &&
        entry.name.startsWith("http")) {
      try {
        const url = new URL(entry.name);
        // 排除可能的误报（如已缓存的资源、data URI 等）
        if (!url.hostname.includes("chrome-extension")) {
          handleResourceError(url);
        }
      } catch (e) {
        // 忽略无效的 URL
      }
    }
  });
});

try {
  observer.observe({ entryTypes: ["resource"] });
} catch (e) {
  // 某些浏览器可能不支持
}
