// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, notFound, dbError } = require('./shared/auth')
const { validatePagination } = require('./shared/validators')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

// 转义正则表达式特殊字符，防止 ReDoS 攻击
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 云函数入口函数（公开 API，不需要授权）
exports.main = async (event, context) => {
  const { action, params = {} } = event

  switch (action) {
    // 分类相关
    case 'listCategories':
      return await listCategories()
    case 'listSubcategories':
      return await listSubcategories(params)
    case 'getCategoriesTree':
      return await getCategoriesTree()

    // 鱼种相关
    case 'search':
      return await searchSpecies(params)
    case 'get':
      return await getSpecies(params)
    case 'list':
      return await listSpecies(params)
    case 'getPopular':
      return await getPopularSpecies(params)

    // 养殖经验相关
    case 'getCareTips':
      return await getCareTips(params)

    // 兼容旧接口
    case 'getCategories':
      return await getCategoriesTree()

    default:
      return paramError('未知的 action')
  }
}

// 获取大分类列表
async function listCategories() {
  try {
    const res = await db.collection('fish_categories')
      .orderBy('order', 'asc')
      .get()

    return success({ list: res.data })
  } catch (err) {
    console.error('listCategories error:', err)
    return dbError()
  }
}

// 获取子分类列表
async function listSubcategories(params) {
  const { categoryId } = params

  try {
    const whereCondition = {}
    if (categoryId) {
      whereCondition.categoryId = categoryId
    }

    const res = await db.collection('fish_subcategories')
      .where(whereCondition)
      .orderBy('order', 'asc')
      .get()

    return success({ list: res.data })
  } catch (err) {
    console.error('listSubcategories error:', err)
    return dbError()
  }
}

// 获取完整分类树（大分类 + 子分类）
async function getCategoriesTree() {
  try {
    // 获取所有大分类
    const categoriesRes = await db.collection('fish_categories')
      .orderBy('order', 'asc')
      .get()

    // 获取所有子分类
    const subcategoriesRes = await db.collection('fish_subcategories')
      .orderBy('order', 'asc')
      .get()

    // 组装树形结构
    const categories = categoriesRes.data.map(cat => ({
      ...cat,
      subcategories: subcategoriesRes.data.filter(sub => sub.categoryId === cat._id)
    }))

    // 难度等级
    const difficultyLevels = [
      { value: 'easy', label: '容易', description: '适合新手' },
      { value: 'medium', label: '中等', description: '需要一定经验' },
      { value: 'hard', label: '困难', description: '适合有经验的玩家' }
    ]

    // 性格类型
    const temperaments = [
      { value: 'peaceful', label: '温和' },
      { value: 'semi-aggressive', label: '半攻击性' },
      { value: 'aggressive', label: '攻击性' }
    ]

    // 食性类型
    const dietTypes = [
      { value: '杂食', label: '杂食' },
      { value: '肉食', label: '肉食' },
      { value: '素食', label: '素食' },
      { value: '藻食', label: '藻食' }
    ]

    return success({
      categories,
      difficultyLevels,
      temperaments,
      dietTypes
    })
  } catch (err) {
    console.error('getCategoriesTree error:', err)
    return dbError()
  }
}

// 搜索鱼种
async function searchSpecies(params) {
  const { keyword, subcategoryId, categoryId, difficulty, temperament, origin, diet } = params
  // 使用共享的分页验证
  const { page, pageSize, skip } = validatePagination(params)

  if (!keyword || keyword.length < 1) {
    return paramError('搜索关键词太短')
  }

  try {
    const whereCondition = {
      isVerified: true
    }

    // 关键词搜索 (中文名、英文名、学名)
    const escapedKeyword = escapeRegExp(keyword)

    // 优先使用 categoryId 直接筛选（新数据结构支持）
    if (categoryId && !subcategoryId) {
      whereCondition.categoryId = categoryId
    }

    if (subcategoryId) {
      whereCondition.subcategoryId = subcategoryId
    }

    if (difficulty) {
      whereCondition.difficulty = difficulty
    }

    if (temperament) {
      whereCondition.temperament = temperament
    }

    // 新增：产地筛选
    if (origin) {
      whereCondition.origin = db.RegExp({
        regexp: escapeRegExp(origin),
        options: 'i'
      })
    }

    // 新增：食性筛选
    if (diet) {
      whereCondition.diet = diet
    }

    // 先按中文名搜索
    whereCondition.name = db.RegExp({
      regexp: escapedKeyword,
      options: 'i'
    })

    let speciesRes = await db.collection('fish_species')
      .where(whereCondition)
      .orderBy('name', 'asc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 如果中文名搜索结果少，补充英文名搜索
    if (speciesRes.data.length < pageSize) {
      const englishWhereCondition = {
        ...whereCondition,
        name: undefined,
        englishName: db.RegExp({
          regexp: escapedKeyword,
          options: 'i'
        })
      }
      delete englishWhereCondition.name

      const englishRes = await db.collection('fish_species')
        .where(englishWhereCondition)
        .orderBy('englishName', 'asc')
        .skip(skip)
        .limit(pageSize - speciesRes.data.length)
        .get()

      // 合并结果并去重
      const existingIds = new Set(speciesRes.data.map(s => s._id))
      const uniqueEnglish = englishRes.data.filter(s => !existingIds.has(s._id))
      speciesRes.data = [...speciesRes.data, ...uniqueEnglish]
    }

    // 关联子分类信息
    const species = await enrichSpeciesWithSubcategory(speciesRes.data)

    return success({
      list: species,
      pagination: {
        page,
        pageSize
      }
    })
  } catch (err) {
    console.error('searchSpecies error:', err)
    return dbError()
  }
}

// 获取单个鱼种详情
async function getSpecies(params) {
  const { speciesId, includeCareTips = false } = params

  if (!speciesId) {
    return paramError('缺少 speciesId')
  }

  try {
    const speciesRes = await db.collection('fish_species').doc(speciesId).get()

    if (!speciesRes.data) {
      return notFound()
    }

    // 关联子分类和大分类信息
    const species = await enrichSpeciesWithSubcategory([speciesRes.data])
    const result = species[0]

    // 是否包含养殖经验
    if (includeCareTips) {
      const tipsRes = await db.collection('fish_care_tips')
        .where({ speciesId })
        .orderBy('importance', 'desc')
        .get()
      result.careTips = tipsRes.data
    }

    return success(result)
  } catch (err) {
    console.error('getSpecies error:', err)
    return dbError()
  }
}

// 获取鱼种列表
async function listSpecies(params) {
  const { subcategoryId, categoryId, difficulty, temperament, origin, diet } = params
  // 使用共享的分页验证
  const { page, pageSize, skip } = validatePagination(params)

  try {
    const whereCondition = {
      isVerified: true
    }

    // 优先使用 categoryId 直接筛选（新数据结构支持）
    if (categoryId && !subcategoryId) {
      whereCondition.categoryId = categoryId
    }

    if (subcategoryId) {
      whereCondition.subcategoryId = subcategoryId
    }

    if (difficulty) {
      whereCondition.difficulty = difficulty
    }

    if (temperament) {
      whereCondition.temperament = temperament
    }

    // 新增：产地筛选
    if (origin) {
      whereCondition.origin = db.RegExp({
        regexp: escapeRegExp(origin),
        options: 'i'
      })
    }

    // 新增：食性筛选
    if (diet) {
      whereCondition.diet = diet
    }

    const speciesRes = await db.collection('fish_species')
      .where(whereCondition)
      .orderBy('name', 'asc')
      .skip(skip)
      .limit(pageSize)
      .get()

    const countRes = await db.collection('fish_species')
      .where(whereCondition)
      .count()

    // 关联子分类信息
    const species = await enrichSpeciesWithSubcategory(speciesRes.data)

    return success({
      list: species,
      pagination: {
        page,
        pageSize,
        total: countRes.total,
        totalPages: Math.ceil(countRes.total / pageSize)
      }
    })
  } catch (err) {
    console.error('listSpecies error:', err)
    return dbError()
  }
}

// 获取热门鱼种
async function getPopularSpecies(params) {
  const { limit = 10 } = params

  try {
    // 获取被用户添加最多的鱼种
    const aggregateRes = await db.collection('fish')
      .aggregate()
      .match({
        speciesId: _.neq('')
      })
      .group({
        _id: '$speciesId',
        count: $.sum(1)
      })
      .sort({
        count: -1
      })
      .limit(limit)
      .end()

    const speciesIds = aggregateRes.list.map(item => item._id)

    if (speciesIds.length === 0) {
      // 如果没有使用数据，返回预设的热门鱼种（简单易养的）
      const defaultRes = await db.collection('fish_species')
        .where({
          isVerified: true,
          difficulty: 'easy'
        })
        .orderBy('name', 'asc')
        .limit(limit)
        .get()

      const species = await enrichSpeciesWithSubcategory(defaultRes.data)

      return success({ list: species })
    }

    // 获取鱼种详情
    const speciesRes = await db.collection('fish_species')
      .where({
        _id: _.in(speciesIds)
      })
      .get()

    // 按热度排序
    const speciesMap = speciesRes.data.reduce((acc, s) => {
      acc[s._id] = s
      return acc
    }, {})

    const sortedSpecies = speciesIds
      .map(id => speciesMap[id])
      .filter(Boolean)

    // 关联子分类信息
    const species = await enrichSpeciesWithSubcategory(sortedSpecies)

    return success({ list: species })
  } catch (err) {
    console.error('getPopularSpecies error:', err)
    return dbError()
  }
}

// 获取养殖经验
async function getCareTips(params) {
  const { speciesId, tipType } = params

  if (!speciesId) {
    return paramError('缺少 speciesId')
  }

  try {
    const whereCondition = { speciesId }

    if (tipType) {
      whereCondition.tipType = tipType
    }

    const res = await db.collection('fish_care_tips')
      .where(whereCondition)
      .orderBy('importance', 'desc')
      .get()

    return success({ list: res.data })
  } catch (err) {
    console.error('getCareTips error:', err)
    return dbError()
  }
}

// 辅助函数：为鱼种关联子分类和大分类信息
async function enrichSpeciesWithSubcategory(speciesList) {
  if (!speciesList || speciesList.length === 0) {
    return []
  }

  // 获取所有相关的子分类ID
  const subcategoryIds = [...new Set(speciesList.map(s => s.subcategoryId).filter(Boolean))]

  if (subcategoryIds.length === 0) {
    return speciesList
  }

  // 获取子分类信息
  const subcategoriesRes = await db.collection('fish_subcategories')
    .where({ _id: _.in(subcategoryIds) })
    .get()

  // 获取相关大分类信息
  const categoryIds = [...new Set(subcategoriesRes.data.map(s => s.categoryId).filter(Boolean))]
  const categoriesRes = await db.collection('fish_categories')
    .where({ _id: _.in(categoryIds) })
    .get()

  // 构建映射
  const subcategoryMap = subcategoriesRes.data.reduce((acc, sub) => {
    acc[sub._id] = sub
    return acc
  }, {})

  const categoryMap = categoriesRes.data.reduce((acc, cat) => {
    acc[cat._id] = cat
    return acc
  }, {})

  // 关联信息
  return speciesList.map(species => {
    const subcategory = subcategoryMap[species.subcategoryId]
    const category = subcategory ? categoryMap[subcategory.categoryId] : null

    return {
      ...species,
      subcategory: subcategory ? {
        _id: subcategory._id,
        name: subcategory.name,
        slug: subcategory.slug
      } : null,
      category: category ? {
        _id: category._id,
        name: category.name,
        slug: category.slug
      } : null
    }
  })
}
