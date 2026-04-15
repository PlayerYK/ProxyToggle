# 构建和打包指南

本项目使用 Node.js 脚本进行构建和打包。

## 前置要求

确保已安装 Node.js (推荐 v14 或更高版本)。

## 安装依赖

首次使用前，需要安装依赖：

```bash
npm install
```

## 构建命令

### 基础构建（patch 版本升级）

```bash
npm run build
# 或
npm run build:patch
```

版本号从 `1.2.0` 升级到 `1.2.1`

### Minor 版本升级

```bash
npm run build:minor
```

版本号从 `1.2.0` 升级到 `1.3.0`

### Major 版本升级

```bash
npm run build:major
```

版本号从 `1.2.0` 升级到 `2.0.0`

### 构建流程

1. 根据指定类型升级版本号
2. 更新 `extension/manifest.json` 中的版本号
3. 更新 `package.json` 中的版本号
4. 清理旧的 `dist/` 目录
5. 复制 `extension/` 目录下的所有文件到 `dist/`

## 打包命令

### 单独打包（需要先构建）

```bash
npm run package
```

### 一键构建+打包

```bash
npm run release
```

等同于：

```bash
npm run build:patch && npm run package
```

### 打包流程

1. 检查 `dist/` 目录是否存在
2. 读取 `dist/manifest.json` 中的版本号
3. 创建 `releases/` 目录（如果不存在）
4. 生成 `proxy-toggle-vX.X.X.zip` 文件
5. 输出到 `releases/` 目录

## 清理命令

删除所有构建产物：

```bash
npm run clean
```

这会删除 `dist/` 和 `releases/` 目录。

## 完整工作流示例

### 发布 Patch 版本

```bash
npm run release
```

### 发布 Minor 版本

```bash
npm run build:minor
npm run package
```

### 发布 Major 版本

```bash
npm run build:major
npm run package
```

## 目录结构

```
.
├── extension/          # 源代码
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   └── contentScript.js
├── scripts/            # 构建脚本
│   ├── build.js       # 编译脚本
│   ├── package.js     # 打包脚本
│   └── clean.js       # 清理脚本
├── dist/              # 构建输出（自动生成）
├── releases/          # 打包输出（自动生成）
│   └── proxy-toggle-vX.X.X.zip
├── package.json
└── BUILD.md
```

## 注意事项

1. **版本号管理**：构建时会自动更新版本号，无需手动修改
2. **Git 提交**：构建后记得提交 `manifest.json` 和 `package.json` 的版本更新
3. **图标文件**：如果有图标文件（`img/` 目录），确保它们在 `extension/` 目录下
4. **dist/ 和 releases/**：这些目录已加入 `.gitignore`，不会被提交到 Git

## 发布到 Chrome Web Store

1. 运行构建和打包：
   ```bash
   npm run release
   ```

2. 在 `releases/` 目录找到生成的 zip 文件

3. 登录 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

4. 上传 zip 文件并发布更新

## 故障排除

### 错误：dist 目录不存在

运行 `npm run package` 前需要先运行 `npm run build`，或者直接使用 `npm run release`。

### 错误：找不到 archiver 模块

运行 `npm install` 安装依赖。

### 构建后版本号没有变化

检查是否有权限修改 `extension/manifest.json` 文件。
