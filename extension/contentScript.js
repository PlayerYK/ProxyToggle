function handleResourceError(url) {
  console.log("Failed domain:", url.hostname);
  chrome.runtime.sendMessage(
    {
      type: "resourceFailed",
      domain: url.hostname,
    },
    (response) => {
      console.log("Message sent, response:", response);
    }
  );
}

// 使用 PerformanceObserver 来捕获资源加载失败
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === "resource" && !entry.responseStatus) {
      console.log("Resource failed to load:", entry);
      handleResourceError(new URL(entry.name));
    }
  });
});
observer.observe({ entryTypes: ["resource"] });

// 回溯检查已经发生的资源加载失败
performance.getEntriesByType("resource").forEach((entry) => {
  if (!entry.responseStatus) {
    console.log("Previously failed resource:", entry);
    handleResourceError(new URL(entry.name));
  }
});

window.addEventListener(
  "error",
  (event) => {
    if (event.target instanceof HTMLElement) {
      const url = new URL(
        event.target.src || event.target.href || window.location.href
      );
      handleResourceError(url);
    }
  },
  true
);

window.addEventListener(
  "unhandledrejection",
  (event) => {
    console.log("Unhandled rejection:", event.reason);
    handleResourceError(new URL(window.location.href));
  },
  true
);

console.log("Content script loaded and all listeners added");
