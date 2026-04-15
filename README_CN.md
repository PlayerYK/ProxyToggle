# Proxy Toggle 构建指南

## 🚀 快速开始

### 安装依赖（仅首次）

```bash
npm install
```

## 📦 构建命令

### 1. 编译（版本自动升级）

```bash
# Patch 版本升级（1.2.0 → 1.2.1）推荐用于 bug 修复
npm run build
# 或
npm run build:patch

# Minor 版本升级（1.2.0 → 1.3.0）用于新功能
npm run build:minor

# Major 版本升级（1.2.0 → 2.0.0）用于重大更新
npm run build:major
```

**编译流程：**

1. ✅ 自动升级版本号
2. ✅ 更新 `extension/manifest.json`
3. ✅ 更新 `package.json`
4. ✅ 清理旧的 `dist/` 目录
5. ✅ 复制所有文件到 `dist/`

### 2. 打包成 ZIP

```bash
npm run package
```

**打包流程：**

1. ✅ 检查 `dist/` 目录
2. ✅ 读取版本号
3. ✅ 创建 `releases/` 目录
4. ✅ 生成 `proxy-toggle-vX.X.X.zip`

### 3. 一键发布（推荐）

```bash
npm run release
```

等同于：`npm run build:patch && npm run package`

### 4. 清理构建文件

```bash
npm run clean
```

删除 `dist/` 和 `releases/` 目录。

---

## 📁 目录结构

```
.
├── extension/              # 源代码
│   ├── manifest.json      # 扩展配置
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   └── contentScript.js
├── scripts/               # 构建脚本
│   ├── build.js          # 编译脚本
│   ├── package.js        # 打包脚本
│   └── clean.js          # 清理脚本
├── dist/                 # 构建输出（自动生成）
├── releases/             # ZIP 包输出（自动生成）
│   └── proxy-toggle-vX.X.X.zip
├── package.json
└── BUILD.md
```

---

## 🎯 实际使用示例

### 场景 1：修复了一个 bug，发布新版本

```bash
# 修复完 bug 后
npm run release

# 输出示例：
# 🚀 开始构建扩展程序...
# 📦 版本升级类型: patch
# 📌 当前版本: 1.2.0
# 📌 新版本: 1.2.1
# ✅ manifest.json 版本已更新
# ✅ package.json 版本已更新
# ...
# ✨ 构建完成！版本: 1.2.1
# 📦 开始打包扩展程序...
# ✅ 打包完成！文件大小: 0.12 MB
# 📦 输出文件: releases/proxy-toggle-v1.2.1.zip
```

### 场景 2：添加了新功能

```bash
# 开发完新功能后
npm run build:minor
npm run package

# 版本会从 1.2.0 升级到 1.3.0
```

### 场景 3：只想重新打包，不升级版本

```bash
# 先手动修改 extension/manifest.json 的版本号
# 然后
npm run build     # 这会再次升级版本
npm run package   # 只打包

# 或者直接在 dist/ 目录修改后打包
npm run package
```

---

## 🔧 高级用法

### 自定义打包内容

编辑 `scripts/build.js` 中的 `copyDir` 函数，可以排除某些文件：

```javascript
// 跳过某些文件
if (entry.name === '.DS_Store' || entry.name === 'README.md') {
  continue;
}
```

### 修改版本升级逻辑

编辑 `scripts/build.js` 中的 `bumpVersion` 函数。

---

## ⚠️ 注意事项

1. **版本号同步**：`manifest.json` 和 `package.json` 的版本号会自动同步
2. **Git 提交**：构建后记得提交版本号的变更
3. **不要手动修改版本号**：使用构建脚本自动管理
4. **dist/ 和 releases/ 已加入 .gitignore**：不会提交到 Git

---

## 📤 发布到 Chrome Web Store

1. 运行构建和打包：
  ```bash
   npm run release
  ```
2. 在 `releases/` 目录找到生成的 ZIP 文件
3. 登录 [Chrome 网上应用店开发者控制台](https://chrome.google.com/webstore/devconsole)
4. 选择你的扩展 → 上传新的 ZIP 包 → 提交审核

---

## 🐛 常见问题

### Q: 执行 `npm run package` 报错"dist 目录不存在"

A: 需要先运行 `npm run build`，或者直接使用 `npm run release`

### Q: 版本号没有变化

A: 检查 `extension/manifest.json` 文件权限，确保脚本可以修改它

### Q: ZIP 文件大小异常

A: 检查 `extension/` 目录是否有多余的大文件（如 node_modules）

### Q: 想要手动指定版本号

A: 可以直接修改 `extension/manifest.json`，然后运行：

```bash
# 复制到 dist（不升级版本）
cp -r extension/* dist/
npm run package
```

---

## 📚 相关文档

- [Chrome Extension Manifest V3 文档](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Web Store 发布指南](https://developer.chrome.com/docs/webstore/publish/)
- 详细构建说明：查看 `BUILD.md`

---

## 📝 更新日志

查看 `readme.md` 中的 Changelog 部分。