// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, forbidden, dbError, verifyTankOwnership } = require('./shared/auth')
const { validatePagination, validateDate, validateNonNegative } = require('./shared/validators')

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
    case 'getLastRecord':
      return await getLastRecord(openid, params)
    default:
      return paramError('未知的 action')
  }
}

// 创建换水记录
async function createRecord(openid, params) {
  const { tankId, changeDate, percentage, notes } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  if (percentage === undefined || percentage < 0 || percentage > 100) {
    return paramError('换水比例必须在 0-100 之间')
  }

  // 验证鱼缸所有权
  const isOwner = await verifyTankOwnership(db, tankId, openid)
  if (!isOwner) {
    return forbidden()
  }

  // 验证日期
  const dateCheck = validateDate(changeDate)
  if (!dateCheck.valid) {
    return paramError(dateCheck.error)
  }

  const now = db.serverDate()

  const recordData = {
    tankId: tankId,
    userId: openid,
    changeDate: dateCheck.date || now,
    percentage: percentage,
    notes: notes || '',
    createdAt: now
  }

  try {
    const res = await db.collection('water_change_records').add({ data: recordData })
    return success({ recordId: res._id, ...recordData })
  } catch (err) {
    console.error('createWaterChangeRecord error:', err)
    return dbError()
  }
}

// 更新换水记录
async function updateRecord(openid, params) {
  const { recordId, ...updateData } = params

  if (!recordId) {
    return paramError('缺少 recordId')
  }

  // 验证所有权
  const recordRes = await db.collection('water_change_records').doc(recordId).get()
  if (!recordRes.data || recordRes.data.userId !== openid) {
    return forbidden()
  }

  // 处理日期
  if (updateData.changeDate) {
    const dateCheck = validateDate(updateData.changeDate)
    if (!dateCheck.valid) {
      return paramError(dateCheck.error)
    }
    updateData.changeDate = dateCheck.date
  }

  // 验证换水比例
  if (updateData.percentage !== undefined && (updateData.percentage < 0 || updateData.percentage > 100)) {
    return paramError('换水比例必须在 0-100 之间')
  }

  // 移除不允许直接更新的字段
  delete updateData.tankId
  delete updateData.userId

  try {
    await db.collection('water_change_records').doc(recordId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateWaterChangeRecord error:', err)
    return dbError()
  }
}

// 删除换水记录
async function deleteRecord(openid, params) {
  const { recordId } = params

  if (!recordId) {
    return paramError('缺少 recordId')
  }

  // 验证所有权
  const recordRes = await db.collection('water_change_records').doc(recordId).get()
  if (!recordRes.data || recordRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    await db.collection('water_change_records').doc(recordId).remove()
    return success()
  } catch (err) {
    console.error('deleteWaterChangeRecord error:', err)
    return dbError()
  }
}

// 获取换水记录列表
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
      whereCondition.changeDate = _.and(
        _.gte(new Date(startDate)),
        _.lte(new Date(endDate))
      )
    } else if (startDate) {
      whereCondition.changeDate = _.gte(new Date(startDate))
    } else if (endDate) {
      whereCondition.changeDate = _.lte(new Date(endDate))
    }
  }

  try {
    const recordsRes = await db.collection('water_change_records')
      .where(whereCondition)
      .orderBy('changeDate', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countRes = await db.collection('water_change_records')
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
    console.error('listWaterChangeRecords error:', err)
    return dbError()
  }
}

// 获取最近一次换水记录
async function getLastRecord(openid, params) {
  const { tankId } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  try {
    const recordRes = await db.collection('water_change_records')
      .where({
        tankId: tankId,
        userId: openid
      })
      .orderBy('changeDate', 'desc')
      .limit(1)
      .get()

    return success(recordRes.data[0] || null)
  } catch (err) {
    console.error('getLastWaterChangeRecord error:', err)
    return dbError()
  }
}
