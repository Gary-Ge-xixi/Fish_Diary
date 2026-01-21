// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, forbidden, dbError, verifyTankOwnership } = require('./shared/auth')
const { validatePagination, validateDate, validateEnum } = require('./shared/validators')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 食物类型枚举
const FOOD_TYPES = {
  live: '活食',
  pellet: '颗粒饲料',
  flake: '薄片饲料',
  frozen: '冷冻食品',
  other: '其他'
}

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
    case 'getFoodTypes':
      return success(FOOD_TYPES)
    default:
      return paramError('未知的 action')
  }
}

// 创建喂食记录
async function createRecord(openid, params) {
  const { tankId, feedTime, foodType, foodName, amount, imageUrl, images, notes } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  // 验证食物类型
  const foodTypeCheck = validateEnum(foodType, FOOD_TYPES, '食物类型')
  if (!foodTypeCheck.valid) {
    return paramError(foodTypeCheck.error)
  }

  // 验证鱼缸所有权
  const isOwner = await verifyTankOwnership(db, tankId, openid)
  if (!isOwner) {
    return forbidden()
  }

  // 验证日期
  const dateCheck = validateDate(feedTime)
  if (!dateCheck.valid) {
    return paramError(dateCheck.error)
  }

  const now = db.serverDate()

  const recordData = {
    tankId: tankId,
    userId: openid,
    feedTime: dateCheck.date || now,
    foodType: foodType || 'pellet',
    foodTypeName: FOOD_TYPES[foodType] || FOOD_TYPES.pellet,
    foodName: foodName || '',
    amount: amount || '',
    images: images || (imageUrl ? [imageUrl] : []),
    notes: notes || '',
    createdAt: now
  }

  try {
    const res = await db.collection('feeding_records').add({ data: recordData })
    return success({ recordId: res._id, ...recordData })
  } catch (err) {
    console.error('createFeedingRecord error:', err)
    return dbError()
  }
}

// 更新喂食记录
async function updateRecord(openid, params) {
  const { recordId, ...updateData } = params

  if (!recordId) {
    return paramError('缺少 recordId')
  }

  // 验证所有权
  const recordRes = await db.collection('feeding_records').doc(recordId).get()
  if (!recordRes.data || recordRes.data.userId !== openid) {
    return forbidden()
  }

  // 处理日期
  if (updateData.feedTime) {
    const dateCheck = validateDate(updateData.feedTime)
    if (!dateCheck.valid) {
      return paramError(dateCheck.error)
    }
    updateData.feedTime = dateCheck.date
  }

  // 如果更新了食物类型，同步更新类型名称
  if (updateData.foodType && FOOD_TYPES[updateData.foodType]) {
    updateData.foodTypeName = FOOD_TYPES[updateData.foodType]
  }

  // 移除不允许直接更新的字段
  delete updateData.tankId
  delete updateData.userId

  try {
    await db.collection('feeding_records').doc(recordId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateFeedingRecord error:', err)
    return dbError()
  }
}

// 删除喂食记录
async function deleteRecord(openid, params) {
  const { recordId } = params

  if (!recordId) {
    return paramError('缺少 recordId')
  }

  // 验证所有权
  const recordRes = await db.collection('feeding_records').doc(recordId).get()
  if (!recordRes.data || recordRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    await db.collection('feeding_records').doc(recordId).remove()
    return success()
  } catch (err) {
    console.error('deleteFeedingRecord error:', err)
    return dbError()
  }
}

// 获取喂食记录列表
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
      whereCondition.feedTime = _.and(
        _.gte(new Date(startDate)),
        _.lte(new Date(endDate))
      )
    } else if (startDate) {
      whereCondition.feedTime = _.gte(new Date(startDate))
    } else if (endDate) {
      whereCondition.feedTime = _.lte(new Date(endDate))
    }
  }

  try {
    const recordsRes = await db.collection('feeding_records')
      .where(whereCondition)
      .orderBy('feedTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countRes = await db.collection('feeding_records')
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
    console.error('listFeedingRecords error:', err)
    return dbError()
  }
}
