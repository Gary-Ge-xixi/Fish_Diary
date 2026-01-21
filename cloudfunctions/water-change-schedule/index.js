// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, forbidden, dbError, verifyTankOwnership } = require('./shared/auth')

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
      return await createSchedule(openid, params)
    case 'update':
      return await updateSchedule(openid, params)
    case 'delete':
      return await deleteSchedule(openid, params)
    case 'get':
      return await getSchedule(openid, params)
    case 'list':
      return await listSchedules(openid, params)
    case 'toggle':
      return await toggleSchedule(openid, params)
    default:
      return paramError('未知的 action')
  }
}

// 计算下次触发时间
function calculateNextTrigger(intervalDays, lastTriggered = null) {
  const now = new Date()
  let nextTrigger

  if (lastTriggered) {
    // 从上次触发时间计算
    nextTrigger = new Date(lastTriggered)
    nextTrigger.setDate(nextTrigger.getDate() + intervalDays)
    // 如果计算出的时间已经过了，从今天开始
    if (nextTrigger <= now) {
      nextTrigger = new Date(now)
      nextTrigger.setDate(nextTrigger.getDate() + intervalDays)
    }
  } else {
    // 从今天开始计算
    nextTrigger = new Date(now)
    nextTrigger.setDate(nextTrigger.getDate() + intervalDays)
  }

  // 设置为当天早上 9 点
  nextTrigger.setHours(9, 0, 0, 0)

  return nextTrigger
}

// 创建换水计划
async function createSchedule(openid, params) {
  const { tankId, intervalDays, percentage } = params

  if (!tankId || !intervalDays) {
    return paramError('缺少必要参数')
  }

  if (intervalDays < 1 || intervalDays > 90) {
    return paramError('换水间隔应在 1-90 天之间')
  }

  // 验证鱼缸所有权
  const isOwner = await verifyTankOwnership(db, tankId, openid)
  if (!isOwner) {
    return forbidden()
  }

  // 检查是否已存在该鱼缸的计划
  const existingRes = await db.collection('water_change_schedules')
    .where({ tankId: tankId, userId: openid })
    .count()

  if (existingRes.total > 0) {
    return paramError('该鱼缸已存在换水计划，请编辑现有计划')
  }

  const now = db.serverDate()
  const nextTrigger = calculateNextTrigger(intervalDays)

  const scheduleData = {
    tankId: tankId,
    userId: openid,
    enabled: true,
    intervalDays: intervalDays,
    percentage: percentage || 30,
    lastTriggered: null,
    nextTrigger: nextTrigger,
    createdAt: now,
    updatedAt: now
  }

  try {
    const res = await db.collection('water_change_schedules').add({ data: scheduleData })
    return success({ scheduleId: res._id, ...scheduleData })
  } catch (err) {
    console.error('createWaterChangeSchedule error:', err)
    return dbError()
  }
}

// 更新换水计划
async function updateSchedule(openid, params) {
  const { scheduleId, ...updateData } = params

  if (!scheduleId) {
    return paramError('缺少 scheduleId')
  }

  // 验证所有权
  const scheduleRes = await db.collection('water_change_schedules').doc(scheduleId).get()
  if (!scheduleRes.data || scheduleRes.data.userId !== openid) {
    return forbidden()
  }

  // 验证间隔天数
  if (updateData.intervalDays && (updateData.intervalDays < 1 || updateData.intervalDays > 90)) {
    return paramError('换水间隔应在 1-90 天之间')
  }

  // 如果更新了间隔天数，重新计算下次触发时间
  if (updateData.intervalDays) {
    updateData.nextTrigger = calculateNextTrigger(
      updateData.intervalDays,
      scheduleRes.data.lastTriggered
    )
  }

  updateData.updatedAt = db.serverDate()

  // 移除不允许直接更新的字段
  delete updateData.tankId
  delete updateData.userId

  try {
    await db.collection('water_change_schedules').doc(scheduleId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateWaterChangeSchedule error:', err)
    return dbError()
  }
}

// 删除换水计划
async function deleteSchedule(openid, params) {
  const { scheduleId } = params

  if (!scheduleId) {
    return paramError('缺少 scheduleId')
  }

  // 验证所有权
  const scheduleRes = await db.collection('water_change_schedules').doc(scheduleId).get()
  if (!scheduleRes.data || scheduleRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    await db.collection('water_change_schedules').doc(scheduleId).remove()
    return success()
  } catch (err) {
    console.error('deleteWaterChangeSchedule error:', err)
    return dbError()
  }
}

// 获取单个换水计划
async function getSchedule(openid, params) {
  const { scheduleId, tankId } = params

  try {
    let scheduleData = null

    if (scheduleId) {
      const res = await db.collection('water_change_schedules').doc(scheduleId).get()
      if (res.data && res.data.userId === openid) {
        scheduleData = res.data
      }
    } else if (tankId) {
      const res = await db.collection('water_change_schedules')
        .where({ tankId: tankId, userId: openid })
        .limit(1)
        .get()
      scheduleData = res.data[0] || null
    }

    // 获取最近一次换水记录
    if (scheduleData) {
      const lastRecordRes = await db.collection('water_change_records')
        .where({ tankId: scheduleData.tankId, userId: openid })
        .orderBy('changeDate', 'desc')
        .limit(1)
        .get()
      scheduleData.lastRecord = lastRecordRes.data[0] || null
    }

    return success(scheduleData)
  } catch (err) {
    console.error('getWaterChangeSchedule error:', err)
    return dbError()
  }
}

// 获取换水计划列表
async function listSchedules(openid, params) {
  const { enabled } = params

  const whereCondition = { userId: openid }

  if (enabled !== undefined) {
    whereCondition.enabled = enabled
  }

  try {
    const schedulesRes = await db.collection('water_change_schedules')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .get()

    // 获取关联的鱼缸信息
    const tankIds = [...new Set(schedulesRes.data.map(s => s.tankId))]
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

    const schedulesWithTank = schedulesRes.data.map(schedule => ({
      ...schedule,
      tankInfo: tankMap[schedule.tankId] || null
    }))

    return success({ list: schedulesWithTank })
  } catch (err) {
    console.error('listWaterChangeSchedules error:', err)
    return dbError()
  }
}

// 切换计划开关
async function toggleSchedule(openid, params) {
  const { scheduleId, enabled } = params

  if (!scheduleId || enabled === undefined) {
    return paramError('参数错误')
  }

  // 验证所有权
  const scheduleRes = await db.collection('water_change_schedules').doc(scheduleId).get()
  if (!scheduleRes.data || scheduleRes.data.userId !== openid) {
    return forbidden()
  }

  const updateData = {
    enabled: enabled,
    updatedAt: db.serverDate()
  }

  // 如果启用，重新计算下次触发时间
  if (enabled) {
    updateData.nextTrigger = calculateNextTrigger(
      scheduleRes.data.intervalDays,
      scheduleRes.data.lastTriggered
    )
  }

  try {
    await db.collection('water_change_schedules').doc(scheduleId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('toggleWaterChangeSchedule error:', err)
    return dbError()
  }
}
