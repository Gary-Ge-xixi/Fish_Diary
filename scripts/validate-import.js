/**
 * 数据导入验证脚本
 * 生成验证云函数代码，用于检查导入数据的完整性
 *
 * 使用方法:
 * 1. node scripts/validate-import.js
 * 2. 部署生成的云函数 cloudfunctions/fish-validate/index.js
 * 3. 调用云函数执行验证
 */

const fs = require('fs')
const path = require('path')

// 配置
const DATA_PATH = path.join(__dirname, '..', 'database', 'fish_import_data.json')
const CLOUD_FUNCTION_DIR = path.join(__dirname, '..', 'cloudfunctions', 'fish-validate')
const CLOUD_FUNCTION_PATH = path.join(CLOUD_FUNCTION_DIR, 'index.js')

/**
 * 主函数
 */
function main() {
  console.log('数据导入验证脚本')
  console.log('')

  // 检查数据文件
  if (!fs.existsSync(DATA_PATH)) {
    console.error('错误: 数据文件不存在，请先运行 parse-excel.js')
    process.exit(1)
  }

  // 读取数据
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const expectedCounts = {
    categories: data.categories.length,
    subcategories: data.subcategories.length,
    species: data.species.length
  }

  console.log('预期数据:')
  console.log(`  - 分类: ${expectedCounts.categories}`)
  console.log(`  - 子分类: ${expectedCounts.subcategories}`)
  console.log(`  - 物种: ${expectedCounts.species}`)

  // 创建云函数目录
  if (!fs.existsSync(CLOUD_FUNCTION_DIR)) {
    fs.mkdirSync(CLOUD_FUNCTION_DIR, { recursive: true })
  }

  // 生成云函数代码
  const cloudFunctionCode = `// 数据导入验证云函数
// 自动生成于 ${new Date().toISOString()}

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 预期数据量
const expectedCounts = ${JSON.stringify(expectedCounts, null, 2)}

/**
 * 获取集合统计
 */
async function getCollectionStats(collectionName) {
  try {
    const countRes = await db.collection(collectionName).count()
    return { name: collectionName, count: countRes.total, status: 'ok' }
  } catch (err) {
    return { name: collectionName, count: 0, status: 'error', error: err.message }
  }
}

/**
 * 检查关联完整性
 */
async function checkRelations() {
  const issues = []

  // 检查子分类是否都有有效的分类 ID
  try {
    const subcategories = await db.collection('fish_subcategories').get()
    const categories = await db.collection('fish_categories').get()
    const categoryIds = new Set(categories.data.map(c => c._id))

    for (const subcat of subcategories.data) {
      if (!categoryIds.has(subcat.categoryId)) {
        issues.push({
          type: 'orphan_subcategory',
          message: '子分类 ' + subcat.name + ' 的 categoryId (' + subcat.categoryId + ') 无效'
        })
      }
    }
  } catch (err) {
    issues.push({ type: 'check_error', message: '检查子分类关联失败: ' + err.message })
  }

  // 检查物种是否都有有效的子分类 ID
  try {
    const species = await db.collection('fish_species').limit(1000).get()
    const subcategories = await db.collection('fish_subcategories').get()
    const subcategoryIds = new Set(subcategories.data.map(s => s._id))

    for (const sp of species.data) {
      if (!subcategoryIds.has(sp.subcategoryId)) {
        issues.push({
          type: 'orphan_species',
          message: '物种 ' + sp.name + ' 的 subcategoryId (' + sp.subcategoryId + ') 无效'
        })
      }
    }
  } catch (err) {
    issues.push({ type: 'check_error', message: '检查物种关联失败: ' + err.message })
  }

  return issues
}

/**
 * 检查图片 URL
 */
async function checkImages() {
  const results = { withImage: 0, withoutImage: 0, samples: [] }

  try {
    const species = await db.collection('fish_species').limit(1000).get()

    for (const sp of species.data) {
      if (sp.imageUrl && sp.imageUrl.startsWith('cloud://')) {
        results.withImage++
      } else {
        results.withoutImage++
        if (results.samples.length < 5) {
          results.samples.push(sp.name)
        }
      }
    }
  } catch (err) {
    results.error = err.message
  }

  return results
}

/**
 * 获取示例数据
 */
async function getSampleData() {
  const samples = {}

  try {
    // 获取示例分类
    const cats = await db.collection('fish_categories').limit(3).get()
    samples.categories = cats.data.map(c => ({ name: c.name, slug: c.slug }))

    // 获取示例子分类
    const subcats = await db.collection('fish_subcategories').limit(3).get()
    samples.subcategories = subcats.data.map(s => ({ name: s.name, categoryId: s.categoryId }))

    // 获取示例物种
    const species = await db.collection('fish_species').limit(3).get()
    samples.species = species.data.map(sp => ({
      name: sp.name,
      englishName: sp.englishName,
      origin: sp.origin,
      difficulty: sp.difficulty,
      hasImage: !!sp.imageUrl
    }))

  } catch (err) {
    samples.error = err.message
  }

  return samples
}

// 云函数入口
exports.main = async (event, context) => {
  console.log('开始验证数据导入...')

  const report = {
    timestamp: new Date().toISOString(),
    expectedCounts,
    actualCounts: {},
    countComparison: {},
    relationIssues: [],
    imageStats: {},
    samples: {},
    overall: 'pending'
  }

  // 1. 统计各集合记录数
  console.log('统计集合记录数...')
  const collections = ['fish_categories', 'fish_subcategories', 'fish_species', 'fish_care_tips']
  for (const coll of collections) {
    const stats = await getCollectionStats(coll)
    report.actualCounts[coll] = stats.count
  }

  // 2. 比较预期和实际数量
  report.countComparison = {
    categories: {
      expected: expectedCounts.categories,
      actual: report.actualCounts.fish_categories,
      match: report.actualCounts.fish_categories >= expectedCounts.categories
    },
    subcategories: {
      expected: expectedCounts.subcategories,
      actual: report.actualCounts.fish_subcategories,
      match: report.actualCounts.fish_subcategories >= expectedCounts.subcategories
    },
    species: {
      expected: expectedCounts.species,
      actual: report.actualCounts.fish_species,
      match: report.actualCounts.fish_species >= expectedCounts.species
    }
  }

  // 3. 检查关联完整性
  console.log('检查关联完整性...')
  report.relationIssues = await checkRelations()

  // 4. 检查图片
  console.log('检查图片...')
  report.imageStats = await checkImages()

  // 5. 获取示例数据
  console.log('获取示例数据...')
  report.samples = await getSampleData()

  // 6. 综合评估
  const allCountsMatch = Object.values(report.countComparison).every(c => c.match)
  const noRelationIssues = report.relationIssues.length === 0

  if (allCountsMatch && noRelationIssues) {
    report.overall = 'success'
    report.message = '数据导入验证通过'
  } else if (allCountsMatch) {
    report.overall = 'warning'
    report.message = '数据量正确，但存在关联问题'
  } else {
    report.overall = 'failed'
    report.message = '数据导入不完整'
  }

  console.log('验证完成:', report.overall)

  return {
    code: 0,
    message: report.message,
    data: report
  }
}
`

  // 写入云函数文件
  fs.writeFileSync(CLOUD_FUNCTION_PATH, cloudFunctionCode, 'utf8')

  // 生成 package.json
  const packageJson = {
    name: 'fish-validate',
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
  console.log('1. 部署 cloudfunctions/fish-validate')
  console.log('2. 调用云函数验证:')
  console.log('   wx.cloud.callFunction({ name: "fish-validate" })')
  console.log('')
  console.log('验证内容:')
  console.log('  - 各集合记录数量')
  console.log('  - 关联完整性 (分类-子分类-物种)')
  console.log('  - 图片 URL 统计')
  console.log('  - 示例数据展示')
}

main()
