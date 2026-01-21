// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, forbidden, dbError, verifyTankOwnership } = require('./shared/auth')
const { validatePagination, validateDate } = require('./shared/validators')

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
    case 'create':
      return await createRecord(openid, params)
    case 'update':
      return await updateRecord(openid, params)
    case 'delete':
      return await deleteRecord(openid, params)
    case 'list':
      return await listRecords(openid, params)
    case 'getLatest':
      return await getLatestRecord(openid, params)
    case 'getTrend':
      return await getTrendData(openid, params)
    default:
      return paramError('未知的 action')
  }
}

// 创建水质记录
async function createRecord(openid, params) {
  const { tankId, recordDate, temperature, ph, ammonia, nitrite, nitrate, imageUrl, notes } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  // 验证鱼缸所有权
  const isOwner = await verifyTankOwnership(db, tankId, openid)
  if (!isOwner) {
    return forbidden()
  }

  // 验证日期
  const dateCheck = validateDate(recordDate)
  if (!dateCheck.valid) {
    return paramError(dateCheck.error)
  }

  const now = db.serverDate()

  const recordData = {
    tankId: tankId,
    userId: openid,
    recordDate: dateCheck.date || now,
    temperature: temperature !== undefined ? temperature : null,
    ph: ph !== undefined ? ph : null,
    ammonia: ammonia !== undefined ? ammonia : null,
    nitrite: nitrite !== undefined ? nitrite : null,
    nitrate: nitrate !== undefined ? nitrate : null,
    imageUrl: imageUrl || '',
    notes: notes || '',
    createdAt: now
  }

  try {
    const res = await db.collection('water_quality_records').add({ data: recordData })
    return success({ recordId: res._id, ...recordData })
  } catch (err) {
    console.error('createWaterQualityRecord error:', err)
    return dbError()
  }
}

// 更新水质记录
async function updateRecord(openid, params) {
  const { recordId, ...updateData } = params

  if (!recordId) {
    return paramError('缺少 recordId')
  }

  // 验证所有权
  const recordRes = await db.collection('water_quality_records').doc(recordId).get()
  if (!recordRes.data || recordRes.data.userId !== openid) {
    return forbidden()
  }

  // 处理日期
  if (updateData.recordDate) {
    const dateCheck = validateDate(updateData.recordDate)
    if (!dateCheck.valid) {
      return paramError(dateCheck.error)
    }
    updateData.recordDate = dateCheck.date
  }

  // 移除不允许直接更新的字段
  delete updateData.tankId
  delete updateData.userId

  try {
    await db.collection('water_quality_records').doc(recordId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateWaterQualityRecord error:', err)
    return dbError()
  }
}

// 删除水质记录
async function deleteRecord(openid, params) {
  const { recordId } = params

  if (!recordId) {
    return paramError('缺少 recordId')
  }

  // 验证所有权
  const recordRes = await db.collection('water_quality_records').doc(recordId).get()
  if (!recordRes.data || recordRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    await db.collection('water_quality_records').doc(recordId).remove()
    return success()
  } catch (err) {
    console.error('deleteWaterQualityRecord error:', err)
    return dbError()
  }
}

// 获取水质记录列表
async function listRecords(openid, params) {
  const { tankId, startDate, endDate } = params
  // 使用共享的分页验证
  const { page, pageSize, skip } = validatePagination(params)

  const whereCondition = { userId: openid }

  if (tankId) {
    whereCondition.tankId = tankId
  }

  // 日期范围筛选
  if (startDate || endDate) {
    if (startDate && endDate) {
      whereCondition.recordDate = _.and(
        _.gte(new Date(startDate)),
        _.lte(new Date(endDate))
      )
    } else if (startDate) {
      whereCondition.recordDate = _.gte(new Date(startDate))
    } else if (endDate) {
      whereCondition.recordDate = _.lte(new Date(endDate))
    }
  }

  try {
    const recordsRes = await db.collection('water_quality_records')
      .where(whereCondition)
      .orderBy('recordDate', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countRes = await db.collection('water_quality_records')
      .where(whereCondition)
      .count()

    return success({
      list: recordsRes.data,
      pagination: {
        page,
        pageSize,
        total: countRes.total,
        totalPages: Math.ceil(countRes.total / pageSize)
      }
    })
  } catch (err) {
    console.error('listWaterQualityRecords error:', err)
    return dbError()
  }
}

// 获取最新一条水质记录
async function getLatestRecord(openid, params) {
  const { tankId } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  try {
    const recordRes = await db.collection('water_quality_records')
      .where({
        tankId: tankId,
        userId: openid
      })
      .orderBy('recordDate', 'desc')
      .limit(1)
      .get()

    return success(recordRes.data[0] || null)
  } catch (err) {
    console.error('getLatestWaterQualityRecord error:', err)
    return dbError()
  }
}

// 获取水质趋势数据 (用于图表展示)
async function getTrendData(openid, params) {
  const { tankId, days = 30 } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  try {
    const recordsRes = await db.collection('water_quality_records')
      .where({
        tankId: tankId,
        userId: openid,
        recordDate: _.gte(startDate)
      })
      .orderBy('recordDate', 'asc')
      .limit(100)
      .get()

    // 格式化趋势数据
    const trendData = {
      dates: [],
      temperature: [],
      ph: [],
      ammonia: [],
      nitrite: [],
      nitrate: []
    }

    recordsRes.data.forEach(record => {
      const dateStr = new Date(record.recordDate).toISOString().split('T')[0]
      trendData.dates.push(dateStr)
      trendData.temperature.push(record.temperature)
      trendData.ph.push(record.ph)
      trendData.ammonia.push(record.ammonia)
      trendData.nitrite.push(record.nitrite)
      trendData.nitrate.push(record.nitrate)
    })

    return success(trendData)
  } catch (err) {
    console.error('getWaterQualityTrend error:', err)
    return dbError()
  }
}
