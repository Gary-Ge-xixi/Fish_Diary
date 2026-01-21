/**
 * Excel 数据解析脚本
 * 将 Fish_Database_120.xlsx 解析为 JSON 格式
 *
 * 使用方法: node scripts/parse-excel.js
 */

const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

// 配置
const EXCEL_PATH = path.join(__dirname, '..', 'Fish_Database_120.xlsx')
const OUTPUT_PATH = path.join(__dirname, '..', 'database', 'fish_import_data.json')

// 难度映射
const DIFFICULTY_MAP = {
  'Easy': 'easy',
  'easy': 'easy',
  '简单': 'easy',
  'Medium': 'medium',
  'medium': 'medium',
  '中等': 'medium',
  'Hard': 'hard',
  'hard': 'hard',
  '困难': 'hard'
}

/**
 * 生成 slug (URL 友好的标识符)
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[\/\s]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 解析范围值 (如 "24-28" -> { min: 24, max: 28 })
 */
function parseRange(value) {
  if (!value || value === '' || value === '-') {
    return { min: null, max: null }
  }

  const str = String(value).trim()

  // 处理单一值
  if (!str.includes('-') && !str.includes('~')) {
    const num = parseFloat(str)
    if (!isNaN(num)) {
      return { min: num, max: num }
    }
    return { min: null, max: null }
  }

  // 处理范围值
  const parts = str.split(/[-~]/).map(s => s.trim())
  if (parts.length >= 2) {
    const min = parseFloat(parts[0])
    const max = parseFloat(parts[1])
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max }
    }
  }

  return { min: null, max: null }
}

/**
 * 清理文本
 */
function cleanText(value) {
  if (!value) return ''
  return String(value).trim()
}

/**
 * 主解析函数
 */
function parseExcel() {
  console.log('读取 Excel 文件:', EXCEL_PATH)

  // 检查文件是否存在
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('错误: Excel 文件不存在:', EXCEL_PATH)
    process.exit(1)
  }

  // 读取 Excel
  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // 转换为 JSON
  const rawData = XLSX.utils.sheet_to_json(worksheet)
  console.log(`解析到 ${rawData.length} 行数据`)

  // 打印列名以便调试
  if (rawData.length > 0) {
    console.log('Excel 列名:', Object.keys(rawData[0]))
  }

  // 用于去重的 Set
  const categorySet = new Set()
  const subcategoryMap = new Map() // categoryName -> Set<subcategoryName>

  // 解析后的物种数据
  const species = []

  // 统计信息
  const stats = {
    total: rawData.length,
    valid: 0,
    skipped: 0,
    errors: []
  }

  rawData.forEach((row, index) => {
    const rowNum = index + 2 // Excel 行号从 2 开始 (1 是表头)

    try {
      // 获取原始字段值
      const categoryName = cleanText(row['分类'])
      const subcategoryName = cleanText(row['子分类'])
      const name = cleanText(row['中文名'])
      const englishName = cleanText(row['英文名'])
      const scientificName = cleanText(row['学名'])
      const origin = cleanText(row['产地'])
      const description = cleanText(row['基本介绍'])
      const careTip = cleanText(row['饲养建议'])
      const difficultyRaw = cleanText(row['难度'])
      const tempRaw = row['温度(C)'] || row['温度'] || row['温度（C）']
      const phRaw = row['PH'] || row['pH'] || row['ph']
      const imagePath = cleanText(row['图片路径'])

      // 验证必填字段
      if (!name) {
        stats.errors.push(`行 ${rowNum}: 缺少中文名`)
        stats.skipped++
        return
      }

      if (!categoryName) {
        stats.errors.push(`行 ${rowNum} (${name}): 缺少分类`)
        stats.skipped++
        return
      }

      // 收集分类
      categorySet.add(categoryName)

      // 收集子分类
      if (subcategoryName) {
        if (!subcategoryMap.has(categoryName)) {
          subcategoryMap.set(categoryName, new Set())
        }
        subcategoryMap.get(categoryName).add(subcategoryName)
      }

      // 解析难度
      const difficulty = DIFFICULTY_MAP[difficultyRaw] || 'medium'

      // 解析温度和 pH 范围
      const tempRange = parseRange(tempRaw)
      const phRange = parseRange(phRaw)

      // 构建物种数据
      species.push({
        categoryName,
        subcategoryName: subcategoryName || categoryName, // 如果没有子分类，使用分类名
        name,
        englishName,
        scientificName,
        origin,
        description,
        careTip,
        difficulty,
        tempMin: tempRange.min,
        tempMax: tempRange.max,
        phMin: phRange.min,
        phMax: phRange.max,
        localImagePath: imagePath
      })

      stats.valid++

    } catch (err) {
      stats.errors.push(`行 ${rowNum}: 解析错误 - ${err.message}`)
      stats.skipped++
    }
  })

  // 构建分类列表
  const categories = Array.from(categorySet).map((name, index) => ({
    name,
    slug: generateSlug(name),
    order: index + 1
  }))

  // 构建子分类列表
  const subcategories = []
  subcategoryMap.forEach((subcatSet, categoryName) => {
    subcatSet.forEach(subcatName => {
      subcategories.push({
        categoryName,
        name: subcatName,
        slug: generateSlug(subcatName)
      })
    })
  })

  // 输出结果
  const result = {
    meta: {
      generatedAt: new Date().toISOString(),
      sourceFile: 'Fish_Database_120.xlsx',
      stats: {
        totalRows: stats.total,
        validSpecies: stats.valid,
        skipped: stats.skipped,
        categories: categories.length,
        subcategories: subcategories.length
      }
    },
    categories,
    subcategories,
    species
  }

  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 写入 JSON 文件
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf8')

  // 打印统计信息
  console.log('\n========== 解析完成 ==========')
  console.log(`总行数: ${stats.total}`)
  console.log(`有效物种: ${stats.valid}`)
  console.log(`跳过: ${stats.skipped}`)
  console.log(`分类数: ${categories.length}`)
  console.log(`子分类数: ${subcategories.length}`)
  console.log(`输出文件: ${OUTPUT_PATH}`)

  if (stats.errors.length > 0) {
    console.log('\n========== 错误信息 ==========')
    stats.errors.forEach(err => console.log(err))
  }

  // 打印分类概览
  console.log('\n========== 分类概览 ==========')
  categories.forEach(cat => {
    const subcats = subcategories.filter(s => s.categoryName === cat.name)
    const speciesCount = species.filter(s => s.categoryName === cat.name).length
    console.log(`${cat.name} (${speciesCount} 种): ${subcats.map(s => s.name).join(', ')}`)
  })

  return result
}

// 运行
parseExcel()
