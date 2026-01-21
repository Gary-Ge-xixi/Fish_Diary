// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, forbidden, dbError, verifyTankOwnership } = require('./shared/auth')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 频率枚举
const FREQUENCY_OPTIONS = {
  daily: { label: '每天', intervalHours: 24 },
  twice_daily: { label: '每天两次', intervalHours: 12 },
  every_other_day: { label: '隔天', intervalHours: 48 },
  custom: { label: '自定义', intervalHours: null }
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
    case 'getFrequencyOptions':
      return success(FREQUENCY_OPTIONS)
    default:
      return paramError('未知的 action')
  }
}

// 计算下次触发时间
function calculateNextTrigger(times, frequency) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 解析时间点
  const timeParts = times.map(t => {
    const [hour, minute] = t.split(':').map(Number)
    return { hour, minute }
  }).sort((a, b) => a.hour * 60 + a.minute - b.hour * 60 - b.minute)

  // 找到今天还没过的最近时间点
  for (const time of timeParts) {
    const triggerTime = new Date(today)
    triggerTime.setHours(time.hour, time.minute, 0, 0)
    if (triggerTime > now) {
      return triggerTime
    }
  }

  // 如果今天的时间都过了，用明天的第一个时间点
  const nextDay = new Date(today)
  nextDay.setDate(nextDay.getDate() + 1)
  nextDay.setHours(timeParts[0].hour, timeParts[0].minute, 0, 0)

  return nextDay
}

// 创建喂食计划
async function createSchedule(openid, params) {
  const { tankId, frequency, times, foodType } = params

  if (!tankId || !frequency || !times || !times.length) {
    return paramError('缺少必要参数')
  }

  // 验证鱼缸所有权
  const isOwner = await verifyTankOwnership(db, tankId, openid)
  if (!isOwner) {
    return forbidden()
  }

  // 检查是否已存在该鱼缸的计划
  const existingRes = await db.collection('feeding_schedules')
    .where({ tankId: tankId, userId: openid })
    .count()

  if (existingRes.total > 0) {
    return paramError('该鱼缸已存在喂食计划，请编辑现有计划')
  }

  const now = db.serverDate()
  const nextTrigger = calculateNextTrigger(times, frequency)

  const scheduleData = {
    tankId: tankId,
    userId: openid,
    enabled: true,
    frequency: frequency,
    frequencyLabel: FREQUENCY_OPTIONS[frequency]?.label || frequency,
    times: times,
    foodType: foodType || 'pellet',
    lastTriggered: null,
    nextTrigger: nextTrigger,
    createdAt: now,
    updatedAt: now
  }

  try {
    const res = await db.collection('feeding_schedules').add({ data: scheduleData })
    return success({ scheduleId: res._id, ...scheduleData })
  } catch (err) {
    console.error('createFeedingSchedule error:', err)
    return dbError()
  }
}

// 更新喂食计划
async function updateSchedule(openid, params) {
  const { scheduleId, ...updateData } = params

  if (!scheduleId) {
    return paramError('缺少 scheduleId')
  }

  // 验证所有权
  const scheduleRes = await db.collection('feeding_schedules').doc(scheduleId).get()
  if (!scheduleRes.data || scheduleRes.data.userId !== openid) {
    return forbidden()
  }

  // 如果更新了频率或时间，重新计算下次触发时间
  if (updateData.times || updateData.frequency) {
    const times = updateData.times || scheduleRes.data.times
    const frequency = updateData.frequency || scheduleRes.data.frequency
    updateData.nextTrigger = calculateNextTrigger(times, frequency)

    if (updateData.frequency && FREQUENCY_OPTIONS[updateData.frequency]) {
      updateData.frequencyLabel = FREQUENCY_OPTIONS[updateData.frequency].label
    }
  }

  updateData.updatedAt = db.serverDate()

  // 移除不允许直接更新的字段
  delete updateData.tankId
  delete updateData.userId

  try {
    await db.collection('feeding_schedules').doc(scheduleId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateFeedingSchedule error:', err)
    return dbError()
  }
}

// 删除喂食计划
async function deleteSchedule(openid, params) {
  const { scheduleId } = params

  if (!scheduleId) {
    return paramError('缺少 scheduleId')
  }

  // 验证所有权
  const scheduleRes = await db.collection('feeding_schedules').doc(scheduleId).get()
  if (!scheduleRes.data || scheduleRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    await db.collection('feeding_schedules').doc(scheduleId).remove()
    return success()
  } catch (err) {
    console.error('deleteFeedingSchedule error:', err)
    return dbError()
  }
}

// 获取单个喂食计划
async function getSchedule(openid, params) {
  const { scheduleId, tankId } = params

  try {
    let scheduleData = null

    if (scheduleId) {
      const res = await db.collection('feeding_schedules').doc(scheduleId).get()
      if (res.data && res.data.userId === openid) {
        scheduleData = res.data
      }
    } else if (tankId) {
      const res = await db.collection('feeding_schedules')
        .where({ tankId: tankId, userId: openid })
        .limit(1)
        .get()
      scheduleData = res.data[0] || null
    }

    return success(scheduleData)
  } catch (err) {
    console.error('getFeedingSchedule error:', err)
    return dbError()
  }
}

// 获取喂食计划列表
async function listSchedules(openid, params) {
  const { enabled } = params

  const whereCondition = { userId: openid }

  if (enabled !== undefined) {
    whereCondition.enabled = enabled
  }

  try {
    const schedulesRes = await db.collection('feeding_schedules')
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
    console.error('listFeedingSchedules error:', err)
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
  const scheduleRes = await db.collection('feeding_schedules').doc(scheduleId).get()
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
      scheduleRes.data.times,
      scheduleRes.data.frequency
    )
  }

  try {
    await db.collection('feeding_schedules').doc(scheduleId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('toggleFeedingSchedule error:', err)
    return dbError()
  }
}
