// 数据清理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action = 'preview' } = event  // preview 或 delete
  const results = {
    action,
    species: { found: 0, deleted: 0, items: [] },
    careTips: { found: 0, deleted: 0 },
    categories: { found: 0, deleted: 0 },
    subcategories: { found: 0, deleted: 0 }
  }

  try {
    // 1. 查找无图片的物种
    console.log('查找无图片的物种...')
    const noImageSpecies = await db.collection('fish_species')
      .where(_.or([
        { imageUrl: _.exists(false) },
        { imageUrl: '' },
        { imageUrl: null }
      ]))
      .get()

    results.species.found = noImageSpecies.data.length
    results.species.items = noImageSpecies.data.map(s => ({
      _id: s._id,
      name: s.name,
      subcategoryId: s.subcategoryId
    }))

    console.log('找到无图片物种:', results.species.found)

    if (action === 'delete' && noImageSpecies.data.length > 0) {
      // 删除无图片物种
      for (const species of noImageSpecies.data) {
        try {
          await db.collection('fish_species').doc(species._id).remove()
          results.species.deleted++
          console.log('已删除物种:', species.name)

          // 删除关联的养护建议
          const tips = await db.collection('fish_care_tips')
            .where({ speciesId: species._id })
            .get()

          for (const tip of tips.data) {
            await db.collection('fish_care_tips').doc(tip._id).remove()
            results.careTips.deleted++
          }
        } catch (err) {
          console.error('删除失败:', species.name, err.message)
        }
      }
    }

    // 2. 清理孤立的子分类（没有物种关联的）
    if (action === 'delete') {
      console.log('检查孤立子分类...')
      const allSubcats = await db.collection('fish_subcategories').get()

      for (const subcat of allSubcats.data) {
        const speciesCount = await db.collection('fish_species')
          .where({ subcategoryId: subcat._id })
          .count()

        if (speciesCount.total === 0) {
          results.subcategories.found++
          await db.collection('fish_subcategories').doc(subcat._id).remove()
          results.subcategories.deleted++
          console.log('已删除孤立子分类:', subcat.name)
        }
      }
    }

    // 3. 清理孤立的分类（没有子分类关联的）
    if (action === 'delete') {
      console.log('检查孤立分类...')
      const allCats = await db.collection('fish_categories').get()

      for (const cat of allCats.data) {
        const subcatCount = await db.collection('fish_subcategories')
          .where({ categoryId: cat._id })
          .count()

        if (subcatCount.total === 0) {
          results.categories.found++
          await db.collection('fish_categories').doc(cat._id).remove()
          results.categories.deleted++
          console.log('已删除孤立分类:', cat.name)
        }
      }
    }

    return {
      code: 0,
      message: action === 'preview' ? '预览完成' : '清理完成',
      data: results
    }

  } catch (err) {
    console.error('清理失败:', err)
    return {
      code: 2001,
      message: '清理失败',
      error: err.message
    }
  }
}
