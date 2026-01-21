/**
 * 数据库导入脚本
 * 生成可部署的云函数代码，用于将解析的数据导入数据库
 *
 * 使用方法:
 * 1. node scripts/import-to-database.js
 * 2. 部署生成的云函数 cloudfunctions/fish-import/index.js
 * 3. 在小程序中调用该云函数执行导入
 */

const fs = require('fs')
const path = require('path')

// 配置
const DATA_PATH = path.join(__dirname, '..', 'database', 'fish_import_data.json')
const IMAGE_MAPPING_PATH = path.join(__dirname, '..', 'database', 'image_mapping.json')
const CLOUD_FUNCTION_DIR = path.join(__dirname, '..', 'cloudfunctions', 'fish-import')
const CLOUD_FUNCTION_PATH = path.join(CLOUD_FUNCTION_DIR, 'index.js')

/**
 * 生成唯一 ID
 */
function generateId(prefix, name) {
  const slug = name
    .toLowerCase()
    .replace(/[\/\s]+/g, '_')
    .replace(/[^a-z0-9\u4e00-\u9fa5_]/g, '')
    .substring(0, 30)
  return `${prefix}_${slug}_${Date.now().toString(36)}`
}

/**
 * 主函数
 */
function main() {
  console.log('数据库导入脚本')
  console.log('')

  // 检查数据文件
  if (!fs.existsSync(DATA_PATH)) {
    console.error('错误: 数据文件不存在，请先运行 parse-excel.js')
    process.exit(1)
  }

  // 读取数据
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  console.log(`分类数: ${data.categories.length}`)
  console.log(`子分类数: ${data.subcategories.length}`)
  console.log(`物种数: ${data.species.length}`)

  // 读取图片映射 (如果存在)
  let imageMapping = {}
  if (fs.existsSync(IMAGE_MAPPING_PATH)) {
    imageMapping = JSON.parse(fs.readFileSync(IMAGE_MAPPING_PATH, 'utf8'))
    console.log(`图片映射: ${Object.keys(imageMapping).length} 条`)
  } else {
    console.log('警告: 图片映射文件不存在，imageUrl 将为空')
  }

  // 生成分类 ID 映射
  const categoryIdMap = {}
  data.categories.forEach((cat, index) => {
    const id = `cat_${cat.slug}_${index}`
    categoryIdMap[cat.name] = id
  })

  // 生成子分类 ID 映射
  const subcategoryIdMap = {}
  data.subcategories.forEach((subcat, index) => {
    const categoryId = categoryIdMap[subcat.categoryName]
    const id = `subcat_${subcat.slug}_${index}`
    subcategoryIdMap[`${subcat.categoryName}/${subcat.name}`] = { id, categoryId }
  })

  // 构建分类数据
  const categoriesData = data.categories.map((cat, index) => ({
    _id: categoryIdMap[cat.name],
    name: cat.name,
    slug: cat.slug,
    description: '',
    order: index + 1,
    createdAt: new Date().toISOString()
  }))

  // 构建子分类数据
  const subcategoriesData = data.subcategories.map((subcat, index) => {
    const info = subcategoryIdMap[`${subcat.categoryName}/${subcat.name}`]
    return {
      _id: info.id,
      categoryId: info.categoryId,
      name: subcat.name,
      slug: subcat.slug,
      description: '',
      order: index + 1,
      createdAt: new Date().toISOString()
    }
  })

  // 构建物种数据和养护建议
  const speciesData = []
  const careTipsData = []

  data.species.forEach((sp, index) => {
    const subcatKey = `${sp.categoryName}/${sp.subcategoryName}`
    const subcatInfo = subcategoryIdMap[subcatKey]

    if (!subcatInfo) {
      console.log(`警告: 找不到子分类 "${subcatKey}" for ${sp.name}`)
      return
    }

    // 获取图片 URL
    let imageUrl = ''
    if (sp.localImagePath) {
      const filename = path.basename(sp.localImagePath)
      imageUrl = imageMapping[filename] || ''
    }

    const speciesId = `species_${index}_${sp.name.substring(0, 10)}`

    // 物种数据
    speciesData.push({
      _id: speciesId,
      subcategoryId: subcatInfo.id,
      name: sp.name,
      englishName: sp.englishName || '',
      scientificName: sp.scientificName || '',
      origin: sp.origin || '',
      description: sp.description || '',
      priceMin: null,
      priceMax: null,
      characteristics: '',
      bodyLengthMin: null,
      bodyLengthMax: null,
      tempMin: sp.tempMin,
      tempMax: sp.tempMax,
      phMin: sp.phMin,
      phMax: sp.phMax,
      difficulty: sp.difficulty || 'medium',
      temperament: 'peaceful',
      lifespan: '',
      imageUrl: imageUrl,
      source: 'excel_import',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // 养护建议 (如果有)
    if (sp.careTip) {
      careTipsData.push({
        _id: `tip_${index}_general`,
        speciesId: speciesId,
        tipType: 'general',
        content: sp.careTip,
        importance: 4,
        createdAt: new Date().toISOString()
      })
    }
  })

  console.log('')
  console.log(`生成数据:`)
  console.log(`  - 分类: ${categoriesData.length}`)
  console.log(`  - 子分类: ${subcategoriesData.length}`)
  console.log(`  - 物种: ${speciesData.length}`)
  console.log(`  - 养护建议: ${careTipsData.length}`)

  // 创建云函数目录
  if (!fs.existsSync(CLOUD_FUNCTION_DIR)) {
    fs.mkdirSync(CLOUD_FUNCTION_DIR, { recursive: true })
  }

  // 生成云函数代码
  const cloudFunctionCode = `// 鱼种数据导入云函数
// 自动生成于 ${new Date().toISOString()}
// 使用方法: 部署此云函数后调用执行导入

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 导入数据
const importData = {
  categories: ${JSON.stringify(categoriesData, null, 2)},
  subcategories: ${JSON.stringify(subcategoriesData, null, 2)},
  species: ${JSON.stringify(speciesData, null, 2)},
  careTips: ${JSON.stringify(careTipsData, null, 2)}
}

/**
 * 批量导入数据到集合
 */
async function importCollection(collectionName, data, options = {}) {
  const { upsert = true, keyField = '_id' } = options
  const results = { inserted: 0, updated: 0, failed: 0, errors: [] }

  for (const item of data) {
    try {
      if (upsert) {
        // 尝试更新或插入
        const existing = await db.collection(collectionName)
          .where({ [keyField]: item[keyField] })
          .get()

        if (existing.data.length > 0) {
          // 更新 - 排除 _id 字段
          const updateData = { ...item, updatedAt: new Date() }
          delete updateData._id
          await db.collection(collectionName)
            .doc(existing.data[0]._id)
            .update({ data: updateData })
          results.updated++
        } else {
          // 插入
          await db.collection(collectionName).add({ data: item })
          results.inserted++
        }
      } else {
        await db.collection(collectionName).add({ data: item })
        results.inserted++
      }
    } catch (err) {
      results.failed++
      results.errors.push({ item: item[keyField] || item.name, error: err.message })
    }
  }

  return results
}

// 云函数入口
exports.main = async (event, context) => {
  const { action = 'import', target = 'all', offset = 0, limit = 30 } = event
  const results = {}

  console.log('开始导入鱼种数据...')
  console.log('分类数:', importData.categories.length)
  console.log('子分类数:', importData.subcategories.length)
  console.log('物种数:', importData.species.length)
  console.log('养护建议数:', importData.careTips.length)

  try {
    // 导入分类
    if (target === 'all' || target === 'categories') {
      console.log('导入分类...')
      results.categories = await importCollection('fish_categories', importData.categories, {
        upsert: true,
        keyField: 'name'
      })
      console.log('分类导入结果:', results.categories)
    }

    // 导入子分类
    if (target === 'all' || target === 'subcategories') {
      console.log('导入子分类...')
      results.subcategories = await importCollection('fish_subcategories', importData.subcategories, {
        upsert: true,
        keyField: 'name'
      })
      console.log('子分类导入结果:', results.subcategories)
    }

    // 导入物种 (支持分批: offset, limit)
    if (target === 'all' || target === 'species') {
      const speciesBatch = importData.species.slice(offset, offset + limit)
      console.log('导入物种... offset=' + offset + ', limit=' + limit + ', batch=' + speciesBatch.length + '/' + importData.species.length)
      results.species = await importCollection('fish_species', speciesBatch, {
        upsert: true,
        keyField: 'name'
      })
      results.species.total = importData.species.length
      results.species.offset = offset
      results.species.limit = limit
      results.species.hasMore = (offset + limit) < importData.species.length
      console.log('物种导入结果:', results.species)
    }

    // 导入养护建议 (支持分批: offset, limit)
    if (target === 'all' || target === 'careTips') {
      const tipsBatch = importData.careTips.slice(offset, offset + limit)
      console.log('导入养护建议... offset=' + offset + ', limit=' + limit + ', batch=' + tipsBatch.length + '/' + importData.careTips.length)
      results.careTips = await importCollection('fish_care_tips', tipsBatch, {
        upsert: true,
        keyField: '_id'
      })
      results.careTips.total = importData.careTips.length
      results.careTips.offset = offset
      results.careTips.limit = limit
      results.careTips.hasMore = (offset + limit) < importData.careTips.length
      console.log('养护建议导入结果:', results.careTips)
    }

    return {
      code: 0,
      message: 'success',
      data: results
    }

  } catch (err) {
    console.error('导入失败:', err)
    return {
      code: 2001,
      message: '导入失败',
      error: err.message
    }
  }
}
`

  // 写入云函数文件
  fs.writeFileSync(CLOUD_FUNCTION_PATH, cloudFunctionCode, 'utf8')

  // 生成 package.json
  const packageJson = {
    name: 'fish-import',
    version: '1.0.0',
    main: 'index.js',
    dependencies: {
      'wx-server-sdk': 'latest'
    }
  }
  fs.writeFileSync(
    path.join(CLOUD_FUNCTION_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  )

  console.log('')
  console.log('========== 生成完成 ==========')
  console.log(`云函数代码: ${CLOUD_FUNCTION_PATH}`)
  console.log('')
  console.log('下一步操作:')
  console.log('1. 在微信开发者工具中上传并部署 cloudfunctions/fish-import')
  console.log('2. 调用云函数执行导入:')
  console.log('   wx.cloud.callFunction({ name: "fish-import" })')
  console.log('')
  console.log('可选参数:')
  console.log('   { target: "categories" }   // 仅导入分类')
  console.log('   { target: "subcategories" } // 仅导入子分类')
  console.log('   { target: "species" }       // 仅导入物种')
  console.log('   { target: "careTips" }      // 仅导入养护建议')
  console.log('   { target: "all" }           // 导入全部 (默认)')
}

main()
