#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建 zip 包
async function createZip(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最大压缩级别
    });

    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      log(`✅ 打包完成！文件大小: ${size} MB`, 'green');
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// 主函数
async function packageExtension() {
  log('\n📦 开始打包扩展程序...', 'bright');

  // 检查 dist 目录是否存在
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    log('❌ dist 目录不存在，请先运行 npm run build', 'red');
    process.exit(1);
  }

  // 读取版本号
  const manifestPath = path.join(distPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log('❌ dist/manifest.json 不存在', 'red');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;
  
  log(`📌 版本号: ${version}`, 'cyan');

  // 创建 releases 目录
  const releasesPath = path.join(__dirname, '../releases');
  if (!fs.existsSync(releasesPath)) {
    fs.mkdirSync(releasesPath, { recursive: true });
    log('📁 创建 releases 目录', 'yellow');
  }

  // 生成 zip 文件名
  const zipFileName = `proxy-toggle-v${version}.zip`;
  const zipFilePath = path.join(releasesPath, zipFileName);

  // 如果文件已存在，删除旧文件
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
    log(`🧹 删除旧的 ${zipFileName}`, 'yellow');
  }

  // 打包
  log(`\n📦 正在打包: ${zipFileName}...`, 'cyan');
  await createZip(distPath, zipFilePath);

  log(`\n✨ 打包成功！`, 'bright');
  log(`📦 输出文件: releases/${zipFileName}`, 'green');
  log('', 'reset');
}

// 运行打包
packageExtension().catch((error) => {
  log(`\n❌ 打包失败: ${error.message}`, 'red');
  process.exit(1);
});
