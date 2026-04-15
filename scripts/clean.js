#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function clean() {
  log('\n🧹 清理构建文件...', 'yellow');

  const distPath = path.join(__dirname, '../dist');
  const releasesPath = path.join(__dirname, '../releases');

  let cleaned = false;

  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    log('✅ 已删除 dist/ 目录', 'green');
    cleaned = true;
  }

  if (fs.existsSync(releasesPath)) {
    fs.rmSync(releasesPath, { recursive: true, force: true });
    log('✅ 已删除 releases/ 目录', 'green');
    cleaned = true;
  }

  if (!cleaned) {
    log('✨ 没有需要清理的文件', 'green');
  }

  log('', 'reset');
}

clean();
