// 修复物种-子分类关联的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action = 'diagnose' } = event  // diagnose 或 fix
  const results = {
    action,
    subcategories: [],
    orphanSpecies: [],
    created: [],
    fixed: 0,
    failed: 0
  }

  try {
    // 1. 获取所有子分类
    const subcategories = await db.collection('fish_subcategories').get()
    results.subcategories = subcategories.data.map(s => ({ _id: s._id, name: s.name, categoryId: s.categoryId }))

    const subcatIdSet = new Set(subcategories.data.map(s => s._id))
    const subcatNameMap = new Map()
    subcategories.data.forEach(s => subcatNameMap.set(s.name, s))

    console.log('现有子分类:', results.subcategories.length)

    // 2. 获取所有分类
    const categories = await db.collection('fish_categories').get()
    const catNameMap = new Map()
    categories.data.forEach(c => catNameMap.set(c.name, c))

    // 3. 获取所有物种，检查孤立的
    const species = await db.collection('fish_species').limit(200).get()

    for (const sp of species.data) {
      if (!subcatIdSet.has(sp.subcategoryId)) {
        results.orphanSpecies.push({
          _id: sp._id,
          name: sp.name,
          subcategoryId: sp.subcategoryId
        })
      }
    }

    console.log('孤立物种:', results.orphanSpecies.length)

    if (action === 'fix' && results.orphanSpecies.length > 0) {
      // 4. 创建缺失的子分类
      // 金鱼 -> 冷水/国粹
      if (!subcatNameMap.has('金鱼')) {
        const coldwater = catNameMap.get('冷水/国粹')
        if (coldwater) {
          const newSubcat = {
            _id: 'subcat_金鱼_0',
            categoryId: coldwater._id,
            name: '金鱼',
            slug: '金鱼',
            description: '',
            order: 1,
            createdAt: new Date()
          }
          await db.collection('fish_subcategories').add({ data: newSubcat })
          results.created.push('金鱼')
          subcatNameMap.set('金鱼', newSubcat)
          console.log('已创建子分类: 金鱼')
        }
      }

      // 常见 -> 海水
      if (!subcatNameMap.has('常见')) {
        const seawater = catNameMap.get('海水')
        if (seawater) {
          const newSubcat = {
            _id: 'subcat_常见_17',
            categoryId: seawater._id,
            name: '常见',
            slug: '常见',
            description: '',
            order: 1,
            createdAt: new Date()
          }
          await db.collection('fish_subcategories').add({ data: newSubcat })
          results.created.push('常见')
          subcatNameMap.set('常见', newSubcat)
          console.log('已创建子分类: 常见')
        }
      }

      // 5. 更新孤立物种的关联
      for (const sp of results.orphanSpecies) {
        let targetSubcat = null

        // 金鱼类
        if (['草金鱼', '兰寿', '泰狮', '琉金', '蝶尾', '珍珠鳞', '水泡眼', '丹顶红帽', '黑兰寿', '土佐金'].includes(sp.name)) {
          targetSubcat = subcatNameMap.get('金鱼')
        }
        // 海水常见类
        else if (['公子小丑', '黑小丑', '透红小丑', '蓝魔', '三点白', '雷达', '医生虾'].includes(sp.name)) {
          targetSubcat = subcatNameMap.get('常见')
        }

        if (targetSubcat) {
          try {
            await db.collection('fish_species').doc(sp._id).update({
              data: { subcategoryId: targetSubcat._id }
            })
            results.fixed++
            console.log('已修复:', sp.name, '->', targetSubcat._id)
          } catch (err) {
            results.failed++
            console.error('修复失败:', sp.name, err.message)
          }
        }
      }
    }

    return {
      code: 0,
      message: action === 'diagnose' ? '诊断完成' : '修复完成',
      data: results
    }

  } catch (err) {
    console.error('执行失败:', err)
    return {
      code: 2001,
      message: '执行失败',
      error: err.message
    }
  }
}
