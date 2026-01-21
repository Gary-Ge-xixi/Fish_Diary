/**
 * 图片上传脚本
 * 将本地图片上传到微信云开发存储
 *
 * 使用方法:
 * 1. 配置环境变量或创建 scripts/.env 文件
 * 2. node scripts/upload-images.js
 *
 * 环境变量:
 * - TCB_ENV_ID: 云开发环境 ID
 * - TCB_SECRET_ID: 云 API 密钥 ID
 * - TCB_SECRET_KEY: 云 API 密钥
 *
 * 注意: 如果没有配置密钥，脚本会生成一个手动上传指南
 */

const fs = require('fs')
const path = require('path')

// 配置
const ENV_ID = process.env.TCB_ENV_ID || 'cloudbase-9gnb2cyn0387e399'
const SECRET_ID = process.env.TCB_SECRET_ID || ''
const SECRET_KEY = process.env.TCB_SECRET_KEY || ''

const DATA_PATH = path.join(__dirname, '..', 'database', 'fish_import_data.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'database', 'image_mapping.json')
const CLOUD_PATH_PREFIX = 'fish-species'

/**
 * 使用 SDK 上传图片
 */
async function uploadWithSDK() {
  let tcb
  try {
    tcb = require('@cloudbase/node-sdk')
  } catch (e) {
    console.log('未安装 @cloudbase/node-sdk，尝试使用 tcb-admin-node...')
    try {
      tcb = require('tcb-admin-node')
    } catch (e2) {
      console.error('请先安装云开发 SDK: npm install @cloudbase/node-sdk')
      process.exit(1)
    }
  }

  // 初始化云开发
  const app = tcb.init({
    env: ENV_ID,
    secretId: SECRET_ID,
    secretKey: SECRET_KEY
  })

  // 读取数据
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const imageMapping = {}

  console.log(`开始上传 ${data.species.length} 张图片到云存储...`)
  console.log(`云存储路径: ${CLOUD_PATH_PREFIX}/`)

  let success = 0
  let failed = 0

  for (const species of data.species) {
    const localPath = species.localImagePath
    if (!localPath || !fs.existsSync(localPath)) {
      console.log(`跳过: ${species.name} - 无图片`)
      continue
    }

    const filename = path.basename(localPath)
    const cloudPath = `${CLOUD_PATH_PREFIX}/${filename}`

    try {
      // 上传文件
      const result = await app.uploadFile({
        cloudPath: cloudPath,
        fileContent: fs.createReadStream(localPath)
      })

      imageMapping[filename] = result.fileID
      success++
      console.log(`[${success}/${data.species.length}] 上传成功: ${filename}`)
    } catch (err) {
      console.error(`上传失败: ${filename} - ${err.message}`)
      failed++
    }
  }

  // 保存映射文件
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(imageMapping, null, 2), 'utf8')

  console.log('\n========== 上传完成 ==========')
  console.log(`成功: ${success}`)
  console.log(`失败: ${failed}`)
  console.log(`映射文件: ${OUTPUT_PATH}`)

  return imageMapping
}

/**
 * 生成手动上传指南 (当没有配置 SDK 密钥时)
 */
function generateManualGuide() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

  console.log('========== 手动上传指南 ==========')
  console.log('')
  console.log('由于没有配置云开发密钥，请按以下步骤手动上传图片:')
  console.log('')
  console.log('方法一: 使用微信开发者工具')
  console.log('1. 打开微信开发者工具')
  console.log('2. 点击「云开发」按钮')
  console.log('3. 进入「存储」页面')
  console.log(`4. 创建文件夹: ${CLOUD_PATH_PREFIX}`)
  console.log('5. 上传以下图片文件到该文件夹:')
  console.log('')

  // 收集所有需要上传的图片
  const images = []
  data.species.forEach(species => {
    if (species.localImagePath && fs.existsSync(species.localImagePath)) {
      images.push({
        localPath: species.localImagePath,
        filename: path.basename(species.localImagePath)
      })
    }
  })

  console.log(`图片目录: /Users/wanshuiwanqigaozhishang/Downloads/MINIAPP/images/`)
  console.log(`需要上传: ${images.length} 张图片`)
  console.log('')

  // 生成预填充的映射文件 (假设手动上传后的 fileID 格式)
  const imageMapping = {}
  images.forEach(img => {
    // 微信云开发的 fileID 格式
    imageMapping[img.filename] = `cloud://${ENV_ID}.xxxx/${CLOUD_PATH_PREFIX}/${img.filename}`
  })

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(imageMapping, null, 2), 'utf8')

  console.log('方法二: 使用云开发控制台批量上传')
  console.log('1. 访问 https://console.cloud.tencent.com/')
  console.log(`2. 选择环境: ${ENV_ID}`)
  console.log('3. 进入「云存储」')
  console.log('4. 批量上传 images/ 目录下的所有图片')
  console.log('')
  console.log('方法三: 配置密钥后运行此脚本自动上传')
  console.log('1. 在云开发控制台获取 API 密钥')
  console.log('2. 创建 scripts/.env 文件:')
  console.log('   TCB_ENV_ID=cloudbase-9gnb2cyn0387e399')
  console.log('   TCB_SECRET_ID=your_secret_id')
  console.log('   TCB_SECRET_KEY=your_secret_key')
  console.log('3. npm install @cloudbase/node-sdk')
  console.log('4. 重新运行此脚本')
  console.log('')
  console.log(`已生成预填充映射文件: ${OUTPUT_PATH}`)
  console.log('手动上传后，请更新该文件中的 fileID')

  return imageMapping
}

/**
 * 使用微信云函数上传 (通过云函数代理上传)
 */
async function generateCloudFunctionUploader() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

  // 收集所有图片信息
  const images = []
  data.species.forEach((species, index) => {
    if (species.localImagePath && fs.existsSync(species.localImagePath)) {
      const filename = path.basename(species.localImagePath)
      images.push({
        index,
        name: species.name,
        filename,
        localPath: species.localImagePath,
        cloudPath: `${CLOUD_PATH_PREFIX}/${filename}`
      })
    }
  })

  // 生成上传清单
  const uploadManifest = {
    envId: ENV_ID,
    cloudPathPrefix: CLOUD_PATH_PREFIX,
    totalImages: images.length,
    images: images.map(img => ({
      filename: img.filename,
      cloudPath: img.cloudPath
    }))
  }

  const manifestPath = path.join(__dirname, '..', 'database', 'upload_manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(uploadManifest, null, 2), 'utf8')

  console.log(`已生成上传清单: ${manifestPath}`)
  console.log(`共 ${images.length} 张图片待上传`)

  return images
}

/**
 * 主函数
 */
async function main() {
  console.log('图片上传脚本')
  console.log(`环境 ID: ${ENV_ID}`)
  console.log('')

  // 检查数据文件
  if (!fs.existsSync(DATA_PATH)) {
    console.error('错误: 数据文件不存在，请先运行 parse-excel.js')
    process.exit(1)
  }

  // 加载环境变量 (如果有 .env 文件)
  const envPath = path.join(__dirname, '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  }

  // 检查是否配置了密钥
  if (SECRET_ID && SECRET_KEY) {
    console.log('检测到云开发密钥配置，尝试自动上传...')
    await uploadWithSDK()
  } else {
    console.log('未配置云开发密钥，生成手动上传指南...')
    generateManualGuide()
    await generateCloudFunctionUploader()
  }
}

main().catch(err => {
  console.error('执行失败:', err)
  process.exit(1)
})
