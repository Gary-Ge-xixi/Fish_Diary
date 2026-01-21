// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, forbidden, dbError } = require('./shared/auth')
const { validatePagination } = require('./shared/validators')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return unauthorized()
  }

  const { action, params = {} } = event

  switch (action) {
    case 'getTankStats':
      return await getTankStatistics(openid, params)
    case 'getOverallStats':
      return await getOverallStatistics(openid)
    case 'getDeathList':
      return await getDeathList(openid, params)
    default:
      return paramError('未知的 action')
  }
}

// 获取单个鱼缸的统计数据
async function getTankStatistics(openid, params) {
  const { tankId } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  // 验证所有权
  const tankRes = await db.collection('tanks').doc(tankId).get()
  if (!tankRes.data || tankRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    // 获取存活的鱼
    const aliveFishRes = await db.collection('fish')
      .where({
        tankId: tankId,
        status: 'alive'
      })
      .get()

    // 获取死亡的鱼
    const deadFishRes = await db.collection('fish')
      .where({
        tankId: tankId,
        status: 'dead'
      })
      .get()

    // 统计计算
    const aliveFish = aliveFishRes.data
    const deadFish = deadFishRes.data

    // 存活统计
    const aliveCount = aliveFish.reduce((sum, f) => sum + (f.quantity || 0), 0)
    const aliveSpeciesCount = new Set(aliveFish.map(f => f.speciesId || f.customName)).size
    const aliveTotalPrice = aliveFish.reduce((sum, f) => sum + (f.quantity || 0) * (f.purchasePrice || 0), 0)

    // 死亡统计
    const deadCount = deadFish.reduce((sum, f) => sum + (f.quantity || 0), 0)
    const deadTotalPrice = deadFish.reduce((sum, f) => sum + (f.quantity || 0) * (f.purchasePrice || 0), 0)

    // 存活率
    const totalCount = aliveCount + deadCount
    const survivalRate = totalCount > 0 ? ((aliveCount / totalCount) * 100).toFixed(1) : 100

    // 设备统计
    const equipmentRes = await db.collection('equipment')
      .where({
        tankId: tankId,
        status: 'in_use'
      })
      .get()

    const equipmentCount = equipmentRes.data.length
    const equipmentTotalPrice = equipmentRes.data.reduce((sum, e) => sum + (e.price || 0), 0)

    // 总投入 = 鱼缸价格 + 存活鱼价值 + 死亡鱼损失 + 设备价值
    const tankPrice = tankRes.data.price || 0
    const totalInvestment = tankPrice + aliveTotalPrice + deadTotalPrice + equipmentTotalPrice

    return success({
      tankId: tankId,
      tankName: tankRes.data.name,
      tankPrice: tankPrice,
      // 鱼类统计
      fish: {
        aliveCount: aliveCount,
        aliveSpeciesCount: aliveSpeciesCount,
        aliveTotalPrice: aliveTotalPrice,
        deadCount: deadCount,
        deadTotalPrice: deadTotalPrice,
        survivalRate: parseFloat(survivalRate)
      },
      // 设备统计
      equipment: {
        count: equipmentCount,
        totalPrice: equipmentTotalPrice
      },
      // 总投入
      totalInvestment: totalInvestment
    })
  } catch (err) {
    console.error('getTankStatistics error:', err)
    return dbError()
  }
}

// 获取用户全部鱼缸的总体统计
async function getOverallStatistics(openid) {
  try {
    // 获取所有活跃鱼缸
    const tanksRes = await db.collection('tanks')
      .where({
        userId: openid,
        status: 'active'
      })
      .get()

    const tankIds = tanksRes.data.map(t => t._id)
    const tanksCount = tanksRes.data.length
    const tanksTotalPrice = tanksRes.data.reduce((sum, t) => sum + (t.price || 0), 0)

    if (tankIds.length === 0) {
      return success({
        tanksCount: 0,
        tanksTotalPrice: 0,
        fish: {
          aliveCount: 0,
          aliveSpeciesCount: 0,
          aliveTotalPrice: 0,
          deadCount: 0,
          deadTotalPrice: 0,
          survivalRate: 100
        },
        equipment: {
          count: 0,
          totalPrice: 0
        },
        totalInvestment: 0
      })
    }

    // 获取所有存活的鱼
    const aliveFishRes = await db.collection('fish')
      .where({
        userId: openid,
        tankId: _.in(tankIds),
        status: 'alive'
      })
      .get()

    // 获取所有死亡的鱼
    const deadFishRes = await db.collection('fish')
      .where({
        userId: openid,
        tankId: _.in(tankIds),
        status: 'dead'
      })
      .get()

    const aliveFish = aliveFishRes.data
    const deadFish = deadFishRes.data

    // 存活统计
    const aliveCount = aliveFish.reduce((sum, f) => sum + (f.quantity || 0), 0)
    const aliveSpeciesSet = new Set(aliveFish.map(f => f.speciesId || f.customName))
    const aliveSpeciesCount = aliveSpeciesSet.size
    const aliveTotalPrice = aliveFish.reduce((sum, f) => sum + (f.quantity || 0) * (f.purchasePrice || 0), 0)

    // 死亡统计
    const deadCount = deadFish.reduce((sum, f) => sum + (f.quantity || 0), 0)
    const deadTotalPrice = deadFish.reduce((sum, f) => sum + (f.quantity || 0) * (f.purchasePrice || 0), 0)

    // 存活率
    const totalCount = aliveCount + deadCount
    const survivalRate = totalCount > 0 ? ((aliveCount / totalCount) * 100).toFixed(1) : 100

    // 设备统计
    const equipmentRes = await db.collection('equipment')
      .where({
        userId: openid,
        tankId: _.in(tankIds),
        status: 'in_use'
      })
      .get()

    const equipmentCount = equipmentRes.data.length
    const equipmentTotalPrice = equipmentRes.data.reduce((sum, e) => sum + (e.price || 0), 0)

    // 总投入
    const totalInvestment = tanksTotalPrice + aliveTotalPrice + deadTotalPrice + equipmentTotalPrice

    return success({
      tanksCount: tanksCount,
      tanksTotalPrice: tanksTotalPrice,
      fish: {
        aliveCount: aliveCount,
        aliveSpeciesCount: aliveSpeciesCount,
        aliveTotalPrice: aliveTotalPrice,
        deadCount: deadCount,
        deadTotalPrice: deadTotalPrice,
        survivalRate: parseFloat(survivalRate)
      },
      equipment: {
        count: equipmentCount,
        totalPrice: equipmentTotalPrice
      },
      totalInvestment: totalInvestment
    })
  } catch (err) {
    console.error('getOverallStatistics error:', err)
    return dbError()
  }
}

// 获取死亡鱼列表
async function getDeathList(openid, params) {
  const { tankId } = params
  // 使用共享的分页验证
  const { page, pageSize, skip } = validatePagination(params)

  const whereCondition = {
    userId: openid,
    status: 'dead'
  }

  if (tankId) {
    whereCondition.tankId = tankId
  }

  try {
    const deadFishRes = await db.collection('fish')
      .where(whereCondition)
      .orderBy('deathDate', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取鱼种信息
    const speciesIds = [...new Set(deadFishRes.data.map(f => f.speciesId).filter(Boolean))]
    let speciesMap = {}

    if (speciesIds.length > 0) {
      const speciesRes = await db.collection('fish_species')
        .where({ _id: _.in(speciesIds) })
        .get()
      speciesMap = speciesRes.data.reduce((acc, s) => {
        acc[s._id] = s
        return acc
      }, {})
    }

    // 获取鱼缸信息
    const tankIds = [...new Set(deadFishRes.data.map(f => f.tankId))]
    let tankMap = {}

    if (tankIds.length > 0) {
      const tanksRes = await db.collection('tanks')
        .where({ _id: _.in(tankIds) })
        .get()
      tankMap = tanksRes.data.reduce((acc, t) => {
        acc[t._id] = t
        return acc
      }, {})
    }

    const deadFishWithInfo = deadFishRes.data.map(fish => ({
      ...fish,
      speciesInfo: fish.speciesId ? speciesMap[fish.speciesId] : null,
      tankInfo: tankMap[fish.tankId] || null,
      loss: (fish.quantity || 0) * (fish.purchasePrice || 0)
    }))

    // 获取总数
    const countRes = await db.collection('fish')
      .where(whereCondition)
      .count()

    return success({
      list: deadFishWithInfo,
      pagination: {
        page,
        pageSize,
        total: countRes.total,
        totalPages: Math.ceil(countRes.total / pageSize)
      }
    })
  } catch (err) {
    console.error('getDeathList error:', err)
    return dbError()
  }
}
