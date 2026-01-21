// 云函数入口文件 - 定时触发器
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 订阅消息模板 ID - TODO: 替换为实际申请的模板 ID
const TEMPLATE_IDS = {
  feeding: 'YOUR_FEEDING_TEMPLATE_ID',      // 喂食提醒模板
  waterChange: 'YOUR_WATER_CHANGE_TEMPLATE_ID'  // 换水提醒模板
}

// 云函数入口函数 - 由定时触发器调用
exports.main = async (event, context) => {
  console.log('reminder-trigger started at:', new Date().toISOString())

  const results = {
    feedingReminders: 0,
    waterChangeReminders: 0,
    errors: []
  }

  try {
    // 处理喂食提醒
    const feedingResult = await processFeedingReminders()
    results.feedingReminders = feedingResult.sent
    if (feedingResult.errors.length > 0) {
      results.errors.push(...feedingResult.errors)
    }

    // 处理换水提醒
    const waterChangeResult = await processWaterChangeReminders()
    results.waterChangeReminders = waterChangeResult.sent
    if (waterChangeResult.errors.length > 0) {
      results.errors.push(...waterChangeResult.errors)
    }

    console.log('reminder-trigger completed:', results)
    return { code: 0, message: 'success', data: results }
  } catch (err) {
    console.error('reminder-trigger error:', err)
    return { code: 2001, message: '执行失败' }
  }
}

// 处理喂食提醒
async function processFeedingReminders() {
  const now = new Date()
  const result = { sent: 0, errors: [] }

  // 查询所有已启用且到期的喂食计划
  const schedulesRes = await db.collection('feeding_schedules')
    .where({
      enabled: true,
      nextTrigger: _.lte(now)
    })
    .limit(100)
    .get()

  for (const schedule of schedulesRes.data) {
    try {
      // 获取鱼缸信息
      const tankRes = await db.collection('tanks').doc(schedule.tankId).get()
      const tankName = tankRes.data?.name || '未知鱼缸'

      // 检查用户订阅状态
      const subscriptionRes = await db.collection('subscriptions')
        .where({
          userId: schedule.userId,
          templateId: TEMPLATE_IDS.feeding,
          status: 'accept'
        })
        .get()

      if (subscriptionRes.data.length > 0) {
        // 发送订阅消息
        await sendFeedingReminder(schedule, tankName)
        result.sent++

        // 更新订阅次数
        const subscription = subscriptionRes.data[0]
        if (subscription.count > 0) {
          await db.collection('subscriptions').doc(subscription._id).update({
            data: {
              count: _.inc(-1),
              updatedAt: db.serverDate()
            }
          })
        }
      }

      // 计算并更新下次触发时间
      const nextTrigger = calculateNextFeedingTrigger(schedule.times, schedule.frequency)
      await db.collection('feeding_schedules').doc(schedule._id).update({
        data: {
          lastTriggered: db.serverDate(),
          nextTrigger: nextTrigger,
          updatedAt: db.serverDate()
        }
      })
    } catch (err) {
      console.error('processFeedingReminder error:', err)
      result.errors.push({
        type: 'feeding',
        scheduleId: schedule._id,
        error: err.message
      })
    }
  }

  return result
}

// 处理换水提醒
async function processWaterChangeReminders() {
  const now = new Date()
  const result = { sent: 0, errors: [] }

  // 查询所有已启用且到期的换水计划
  const schedulesRes = await db.collection('water_change_schedules')
    .where({
      enabled: true,
      nextTrigger: _.lte(now)
    })
    .limit(100)
    .get()

  for (const schedule of schedulesRes.data) {
    try {
      // 获取鱼缸信息
      const tankRes = await db.collection('tanks').doc(schedule.tankId).get()
      const tankName = tankRes.data?.name || '未知鱼缸'

      // 获取上次换水记录
      const lastRecordRes = await db.collection('water_change_records')
        .where({
          tankId: schedule.tankId,
          userId: schedule.userId
        })
        .orderBy('changeDate', 'desc')
        .limit(1)
        .get()
      const lastChangeDate = lastRecordRes.data[0]?.changeDate || null

      // 检查用户订阅状态
      const subscriptionRes = await db.collection('subscriptions')
        .where({
          userId: schedule.userId,
          templateId: TEMPLATE_IDS.waterChange,
          status: 'accept'
        })
        .get()

      if (subscriptionRes.data.length > 0) {
        // 发送订阅消息
        await sendWaterChangeReminder(schedule, tankName, lastChangeDate)
        result.sent++

        // 更新订阅次数
        const subscription = subscriptionRes.data[0]
        if (subscription.count > 0) {
          await db.collection('subscriptions').doc(subscription._id).update({
            data: {
              count: _.inc(-1),
              updatedAt: db.serverDate()
            }
          })
        }
      }

      // 计算并更新下次触发时间
      const nextTrigger = calculateNextWaterChangeTrigger(schedule.intervalDays)
      await db.collection('water_change_schedules').doc(schedule._id).update({
        data: {
          lastTriggered: db.serverDate(),
          nextTrigger: nextTrigger,
          updatedAt: db.serverDate()
        }
      })
    } catch (err) {
      console.error('processWaterChangeReminder error:', err)
      result.errors.push({
        type: 'waterChange',
        scheduleId: schedule._id,
        error: err.message
      })
    }
  }

  return result
}

// 发送喂食提醒订阅消息
async function sendFeedingReminder(schedule, tankName) {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: schedule.userId,
      templateId: TEMPLATE_IDS.feeding,
      page: `/pages/tank-detail/index?id=${schedule.tankId}`,
      data: {
        thing1: { value: tankName },           // 鱼缸名称
        time2: { value: timeStr },             // 提醒时间
        thing3: { value: '该喂鱼啦！' }        // 备注
      }
    })
    console.log('Feeding reminder sent to:', schedule.userId, 'tank:', tankName)
  } catch (err) {
    console.error('sendFeedingReminder error:', err)
    throw err
  }
}

// 发送换水提醒订阅消息
async function sendWaterChangeReminder(schedule, tankName, lastChangeDate) {
  const lastChangeDateStr = lastChangeDate
    ? new Date(lastChangeDate).toLocaleDateString('zh-CN')
    : '无记录'

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: schedule.userId,
      templateId: TEMPLATE_IDS.waterChange,
      page: `/pages/tank-detail/index?id=${schedule.tankId}`,
      data: {
        thing1: { value: tankName },                          // 鱼缸名称
        number2: { value: `${schedule.percentage}%` },        // 建议换水比例
        time3: { value: lastChangeDateStr }                   // 上次换水时间
      }
    })
    console.log('Water change reminder sent to:', schedule.userId, 'tank:', tankName)
  } catch (err) {
    console.error('sendWaterChangeReminder error:', err)
    throw err
  }
}

// 计算下次喂食触发时间
function calculateNextFeedingTrigger(times, frequency) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

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

  // 今天的时间都过了，用明天的第一个时间点
  const nextDay = new Date(today)
  nextDay.setDate(nextDay.getDate() + 1)
  nextDay.setHours(timeParts[0].hour, timeParts[0].minute, 0, 0)

  return nextDay
}

// 计算下次换水触发时间
function calculateNextWaterChangeTrigger(intervalDays) {
  const now = new Date()
  const nextTrigger = new Date(now)
  nextTrigger.setDate(nextTrigger.getDate() + intervalDays)
  nextTrigger.setHours(9, 0, 0, 0)
  return nextTrigger
}
