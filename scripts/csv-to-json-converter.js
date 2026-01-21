/**
 * CSV to JSON Converter for Fish Species Data
 * 将 Fish_Database_Enhanced_v2.csv 转换为 fish_species_preset.json
 */

const fs = require('fs')
const path = require('path')

// 分类映射表（CSV categoryName + subcategoryName -> 数据库 ID）
const categoryMapping = {
  '冷水/国粹': 'cat_coldwater',
  '迷鳃/斗鱼': 'cat_labyrinth',
  '灯科/加拉辛': 'cat_characin',
  '鲤科/小型': 'cat_cyprinid',
  '孔雀/卵胎生': 'cat_livebearer',
  '南美慈鲷': 'cat_sa_cichlid',
  '三湖慈鲷': 'cat_african_cichlid',
  '鼠鱼/异型': 'cat_catfish',
  '工具鱼': 'cat_utility',
  '大型/古代': 'cat_monster',
  '海水': 'cat_saltwater'
}

const subcategoryMapping = {
  '金鱼': 'subcat_goldfish',
  '锦鲤/原生': 'subcat_koi_native',
  '原生斗鱼': 'subcat_native_betta',
  '常见': null, // 需要根据 categoryName 判断
  '雷龙': 'subcat_snakehead',
  '南美小型': 'subcat_sa_small',
  '其他加拉辛': 'subcat_other_characin',
  '热门小型': 'subcat_popular_small',
  '亚洲小型': 'subcat_asian_small',
  '胎生鱼': 'subcat_livebearer_common',
  '孔雀品系': 'subcat_guppy',
  '短鲷': 'subcat_dwarf_cichlid',
  '神仙/七彩': 'subcat_angel_discus',
  '大型': 'subcat_sa_large',
  '孔雀': 'subcat_peacock',
  '马鲷': 'subcat_mbuna',
  '坦鲷': 'subcat_tanganyika',
  '鼠鱼': 'subcat_corydoras',
  '异型': 'subcat_pleco',
  '除藻': 'subcat_algae_eater',
  '观赏虾': 'subcat_shrimp',
  '螺类': 'subcat_snail',
  '霸主': 'subcat_apex',
  '怪兽': 'subcat_oddball',
  '神仙/倒吊': 'subcat_marine_angel'
}

// 处理"常见"子分类（需要根据大分类判断）
function getSubcategoryId(categoryName, subcategoryName) {
  if (subcategoryName === '常见') {
    if (categoryName === '迷鳃/斗鱼') return 'subcat_common_labyrinth'
    if (categoryName === '海水') return 'subcat_marine_common'
  }
  return subcategoryMapping[subcategoryName] || null
}

// compatibility -> temperament 映射
function mapTemperament(compatibility) {
  if (!compatibility) return 'peaceful'
  const lower = compatibility.toLowerCase()
  if (lower.includes('攻击') || lower.includes('单养') || lower.includes('雄性单养')) {
    return 'aggressive'
  }
  if (lower.includes('同类') && !lower.includes('温和')) {
    return 'semi-aggressive'
  }
  return 'peaceful'
}

// 解析 size 字符串为 min/max
function parseSize(sizeStr) {
  if (!sizeStr) return { min: 0, max: 0 }
  const match = sizeStr.match(/(\d+)-(\d+)/)
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) }
  }
  const single = sizeStr.match(/(\d+)/)
  if (single) {
    const val = parseInt(single[1])
    return { min: val, max: val }
  }
  return { min: 0, max: 0 }
}

// 生成 ID（基于拼音或名称）
function generateId(name, index) {
  return `species_${String(index).padStart(3, '0')}`
}

// 解析 CSV 行（处理逗号在引号内的情况）
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// 主转换函数
function convertCSVtoJSON() {
  const csvPath = path.join(__dirname, '../database/Fish_Database_Enhanced_v2.csv')
  const outputPath = path.join(__dirname, '../database/fish_species_preset.json')

  // 读取 CSV 文件
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').filter(line => line.trim())

  // 解析表头
  const headers = parseCSVLine(lines[0].replace(/^\uFEFF/, '')) // 去除 BOM
  console.log('Headers:', headers)

  const species = []
  const timestamp = new Date().toISOString()

  // 解析数据行
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < headers.length) continue

    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    // 获取分类 ID
    const categoryId = categoryMapping[row.categoryName] || 'cat_coldwater'
    const subcategoryId = getSubcategoryId(row.categoryName, row.subcategoryName)

    // 解析体型
    const size = parseSize(row.size)

    // 构建鱼种对象
    const fishSpecies = {
      _id: generateId(row.name, i),
      name: row.name,
      englishName: row.englishName || '',
      scientificName: row.scientificName || '',
      categoryId: categoryId,
      subcategoryId: subcategoryId || 'subcat_goldfish',
      origin: row.origin || '',
      difficulty: row.difficulty || 'medium',
      tempMin: parseFloat(row.tempMin) || 20,
      tempMax: parseFloat(row.tempMax) || 28,
      phMin: parseFloat(row.phMin) || 6.5,
      phMax: parseFloat(row.phMax) || 7.5,
      bodyLengthMin: size.min,
      bodyLengthMax: size.max,
      lifespan: row.lifespan || '',
      diet: row.diet || '杂食',
      compatibility: row.compatibility || '',
      temperament: mapTemperament(row.compatibility),
      description: row.description || '',
      careTip: row.careTip || '',
      environment: row.environment || '',
      husbandryFeatures: row.husbandry_features || '',
      notes: row.notes || '',
      imageUrl: '', // 暂时为空，后续上传图片后填充
      localImagePath: row.localImagePath || '', // 保留本地路径供上传使用
      source: 'preset',
      isVerified: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    species.push(fishSpecies)
  }

  // 写入 JSON 文件
  fs.writeFileSync(outputPath, JSON.stringify(species, null, 2), 'utf-8')
  console.log(`Converted ${species.length} fish species to JSON`)
  console.log(`Output: ${outputPath}`)

  // 统计分类分布
  const categoryStats = {}
  species.forEach(s => {
    categoryStats[s.categoryId] = (categoryStats[s.categoryId] || 0) + 1
  })
  console.log('\nCategory distribution:')
  Object.entries(categoryStats).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })
}

// 执行转换
convertCSVtoJSON()
