#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 解析版本号
function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

// 版本号升级
function bumpVersion(version, type = 'patch') {
  const { major, minor, patch } = parseVersion(version);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 主函数
function build() {
  const bumpType = process.argv[2] || 'patch';
  
  log('\n🚀 开始构建扩展程序...', 'bright');
  log(`📦 版本升级类型: ${bumpType}`, 'cyan');

  // 读取 manifest.json
  const manifestPath = path.join(__dirname, '../extension/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const oldVersion = manifest.version;
  const newVersion = bumpVersion(oldVersion, bumpType);
  
  log(`\n📌 当前版本: ${oldVersion}`, 'yellow');
  log(`📌 新版本: ${newVersion}`, 'green');

  // 更新 manifest.json 的版本号
  manifest.version = newVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  log('✅ manifest.json 版本已更新', 'green');

  // 更新 package.json 的版本号
  const packagePath = path.join(__dirname, '../package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    log('✅ package.json 版本已更新', 'green');
  }

  // 清理 dist 目录
  const distPath = path.join(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    log('🧹 清理旧的 dist 目录', 'yellow');
  }

  // 创建 dist 目录
  fs.mkdirSync(distPath, { recursive: true });

  // 复制 extension 目录到 dist
  const extensionPath = path.join(__dirname, '../extension');
  log('\n📂 复制文件到 dist 目录...', 'cyan');
  copyDir(extensionPath, distPath);
  log('✅ 文件复制完成', 'green');

  // 显示复制的文件列表
  const files = fs.readdirSync(distPath);
  log('\n📄 已复制的文件:', 'blue');
  files.forEach(file => {
    log(`   - ${file}`, 'reset');
  });

  log(`\n✨ 构建完成！版本: ${newVersion}`, 'bright');
  log(`📦 构建目录: dist/`, 'cyan');
  log('', 'reset');
}

// 运行构建
try {
  build();
} catch (error) {
  log(`\n❌ 构建失败: ${error.message}`, 'red');
  process.exit(1);
}
