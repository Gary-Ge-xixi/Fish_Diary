/**
 * 同步 shared 模块到各云函数目录
 *
 * 使用方法:
 *   npm run sync        - 同步 shared 模块到所有云函数
 *   npm run sync:check  - 检查是否需要同步（用于 CI/pre-commit）
 *
 * 由于微信云函数独立部署，每个云函数目录需要包含 shared 模块副本
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const SHARED_DIR = path.join(__dirname, 'shared')
const CLOUD_FUNCTIONS = [
  'tank-manage',
  'fish-manage',
  'equipment-manage',
  'feeding-record',
  'feeding-schedule',
  'water-change-record',
  'water-change-schedule',
  'water-quality-record',
  'tank-statistics',
  'fish-species-query',
  'user-login',
  'user-update',
  'reminder-trigger'
]

// 计算文件内容 hash
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath)
  return crypto.createHash('md5').update(content).digest('hex')
}

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// 检查目录是否同步
function checkDirSync(src, dest) {
  if (!fs.existsSync(dest)) return false

  const srcEntries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of srcEntries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      if (!checkDirSync(srcPath, destPath)) return false
    } else {
      const srcHash = getFileHash(srcPath)
      const destHash = getFileHash(destPath)
      if (srcHash !== destHash) return false
    }
  }
  return true
}

// 检查模式
const isCheckMode = process.argv.includes('--check')

if (isCheckMode) {
  console.log('检查 shared 模块同步状态...\n')
  let needsSync = false

  for (const fn of CLOUD_FUNCTIONS) {
    const fnDir = path.join(__dirname, fn)
    if (!fs.existsSync(fnDir)) continue

    const destShared = path.join(fnDir, 'shared')
    const isSynced = checkDirSync(SHARED_DIR, destShared)

    if (!isSynced) {
      console.log(`❌ ${fn}/shared 需要同步`)
      needsSync = true
    }
  }

  if (needsSync) {
    console.log('\n运行 npm run sync 来同步 shared 模块')
    process.exit(1)
  } else {
    console.log('✅ 所有云函数的 shared 模块已同步')
    process.exit(0)
  }
} else {
  // 同步模式
  console.log('开始同步 shared 模块...\n')

  let synced = 0
  let skipped = 0

  for (const fn of CLOUD_FUNCTIONS) {
    const fnDir = path.join(__dirname, fn)
    if (!fs.existsSync(fnDir)) {
      console.log(`⚠️  跳过 ${fn} (目录不存在)`)
      skipped++
      continue
    }

    const destShared = path.join(fnDir, 'shared')
    copyDir(SHARED_DIR, destShared)
    console.log(`✅ ${fn}/shared`)
    synced++
  }

  console.log(`\n同步完成! 已同步 ${synced} 个，跳过 ${skipped} 个`)
  console.log('\n云函数中引用方式:')
  console.log("const { validatePagination } = require('./shared/validators')")
  console.log("const { success, paramError, dbError } = require('./shared/auth')")
  console.log("const { createLogger } = require('./shared/logger')")
}
