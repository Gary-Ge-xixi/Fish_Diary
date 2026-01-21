// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, notFound, forbidden, dbError } = require('./shared/auth')
const { validatePagination, validateDate, validateNonNegative } = require('./shared/validators')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return unauthorized()
  }

  const { action, params = {} } = event

  switch (action) {
    case 'create':
      return await createTank(openid, params)
    case 'update':
      return await updateTank(openid, params)
    case 'delete':
      return await deleteTank(openid, params)
    case 'get':
      return await getTank(openid, params)
    case 'list':
      return await listTanks(openid, params)
    default:
      return paramError('未知的 action')
  }
}

// 创建鱼缸
async function createTank(openid, params) {
  const { name, size, price, setupDate, description, coverUrl } = params

  if (!name) {
    return paramError('缺少鱼缸名称')
  }

  // 验证价格
  const priceCheck = validateNonNegative(price, '价格')
  if (!priceCheck.valid) {
    return paramError(priceCheck.error)
  }

  // 验证日期
  const dateCheck = validateDate(setupDate)
  if (!dateCheck.valid) {
    return paramError(dateCheck.error)
  }

  const now = db.serverDate()

  // 计算容积 (升)
  const volume = size ? (size.length * size.width * size.height) / 1000 : 0

  const tankData = {
    userId: openid,
    name: name,
    coverUrl: coverUrl || '',
    size: size || { length: 0, width: 0, height: 0 },
    volume: volume,
    price: price || 0,
    setupDate: dateCheck.date || now,
    description: description || '',
    status: 'active',
    createdAt: now,
    updatedAt: now
  }

  try {
    const res = await db.collection('tanks').add({ data: tankData })
    return success({ tankId: res._id, ...tankData })
  } catch (err) {
    console.error('createTank error:', err)
    return dbError()
  }
}

// 更新鱼缸
async function updateTank(openid, params) {
  const { tankId, ...updateData } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  // 验证所有权
  const tankRes = await db.collection('tanks').doc(tankId).get()
  if (!tankRes.data || tankRes.data.userId !== openid) {
    return forbidden()
  }

  // 如果更新了尺寸，重新计算容积
  if (updateData.size) {
    const { length, width, height } = updateData.size
    updateData.volume = (length * width * height) / 1000
  }

  // 处理日期
  if (updateData.setupDate) {
    const dateCheck = validateDate(updateData.setupDate)
    if (!dateCheck.valid) {
      return paramError(dateCheck.error)
    }
    updateData.setupDate = dateCheck.date
  }

  // 验证价格
  if (updateData.price !== undefined) {
    const priceCheck = validateNonNegative(updateData.price, '价格')
    if (!priceCheck.valid) {
      return paramError(priceCheck.error)
    }
  }

  updateData.updatedAt = db.serverDate()

  try {
    await db.collection('tanks').doc(tankId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateTank error:', err)
    return dbError()
  }
}

// 删除鱼缸 (软删除)
async function deleteTank(openid, params) {
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
    await db.collection('tanks').doc(tankId).update({
      data: {
        status: 'archived',
        updatedAt: db.serverDate()
      }
    })
    return success()
  } catch (err) {
    console.error('deleteTank error:', err)
    return dbError()
  }
}

// 获取单个鱼缸详情
async function getTank(openid, params) {
  const { tankId } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  try {
    const tankRes = await db.collection('tanks').doc(tankId).get()

    if (!tankRes.data || tankRes.data.userId !== openid) {
      return notFound()
    }

    // 获取鱼缸的统计数据
    const fishStats = await db.collection('fish')
      .aggregate()
      .match({
        tankId: tankId,
        status: 'alive'
      })
      .group({
        _id: null,
        totalCount: $.sum('$quantity'),
        speciesCount: $.addToSet('$speciesId')
      })
      .end()

    const stats = fishStats.list[0] || { totalCount: 0, speciesCount: [] }

    return success({
      ...tankRes.data,
      stats: {
        fishCount: stats.totalCount || 0,
        speciesCount: stats.speciesCount ? stats.speciesCount.length : 0
      }
    })
  } catch (err) {
    console.error('getTank error:', err)
    return dbError()
  }
}

// 获取鱼缸列表
async function listTanks(openid, params) {
  const { status = 'active' } = params
  // 使用共享的分页验证
  const { page, pageSize, skip } = validatePagination(params)

  try {
    const query = db.collection('tanks')
      .where({
        userId: openid,
        status: status
      })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)

    const tanksRes = await query.get()

    // 使用聚合查询一次性获取所有鱼缸的鱼数量统计
    const tankIds = tanksRes.data.map(t => t._id)
    let statsMap = {}

    if (tankIds.length > 0) {
      try {
        const fishStatsRes = await db.collection('fish')
          .aggregate()
          .match({
            tankId: _.in(tankIds),
            status: 'alive'
          })
          .group({
            _id: '$tankId',
            count: $.sum(1)
          })
          .end()

        statsMap = fishStatsRes.list.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {})
      } catch (err) {
        console.error('获取鱼数统计失败:', err)
        // 降级处理：统计数据为0
      }
    }

    const tanksWithStats = tanksRes.data.map(tank => ({
      ...tank,
      stats: {
        fishCount: statsMap[tank._id] || 0
      }
    }))

    // 获取总数
    const countRes = await db.collection('tanks')
      .where({
        userId: openid,
        status: status
      })
      .count()

    return success({
      list: tanksWithStats,
      pagination: {
        page,
        pageSize,
        total: countRes.total,
        totalPages: Math.ceil(countRes.total / pageSize)
      }
    })
  } catch (err) {
    console.error('listTanks error:', err)
    return dbError()
  }
}
