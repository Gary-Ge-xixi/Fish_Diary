// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, notFound, forbidden, dbError, verifyTankOwnership } = require('./shared/auth')
const { validatePagination, validateDate, validatePositiveInt, validateNonNegative } = require('./shared/validators')

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
      return await createFish(openid, params)
    case 'update':
      return await updateFish(openid, params)
    case 'delete':
      return await deleteFish(openid, params)
    case 'get':
      return await getFish(openid, params)
    case 'list':
      return await listFish(openid, params)
    case 'transfer':
      return await transferFish(openid, params)
    case 'markDead':
      return await markFishDead(openid, params)
    default:
      return paramError('未知的 action')
  }
}

// 创建鱼记录
async function createFish(openid, params) {
  const { tankId, speciesId, customName, quantity, purchasePrice, purchaseDate } = params

  if (!tankId) {
    return paramError('缺少 tankId')
  }

  // 验证数值范围
  const quantityCheck = validatePositiveInt(quantity, '数量')
  if (!quantityCheck.valid) {
    return paramError(quantityCheck.error)
  }

  const priceCheck = validateNonNegative(purchasePrice, '价格')
  if (!priceCheck.valid) {
    return paramError(priceCheck.error)
  }

  // 验证日期有效性
  const dateCheck = validateDate(purchaseDate)
  if (!dateCheck.valid) {
    return paramError(dateCheck.error)
  }

  // 验证鱼缸所有权
  const isOwner = await verifyTankOwnership(db, tankId, openid)
  if (!isOwner) {
    return forbidden()
  }

  const now = db.serverDate()

  const fishData = {
    tankId: tankId,
    userId: openid,
    speciesId: speciesId || '',
    customName: customName || '',
    quantity: quantity || 1,
    purchasePrice: purchasePrice || 0,
    purchaseDate: dateCheck.date || now,
    status: 'alive',
    deathDate: null,
    deathReason: '',
    transferHistory: [],
    createdAt: now,
    updatedAt: now
  }

  try {
    const res = await db.collection('fish').add({ data: fishData })
    return success({ fishId: res._id, ...fishData })
  } catch (err) {
    console.error('createFish error:', err)
    return dbError()
  }
}

// 更新鱼记录
async function updateFish(openid, params) {
  const { fishId, ...updateData } = params

  if (!fishId) {
    return paramError('缺少 fishId')
  }

  // 验证数值范围
  const quantityCheck = validatePositiveInt(updateData.quantity, '数量')
  if (!quantityCheck.valid) {
    return paramError(quantityCheck.error)
  }

  const priceCheck = validateNonNegative(updateData.purchasePrice, '价格')
  if (!priceCheck.valid) {
    return paramError(priceCheck.error)
  }

  // 验证所有权
  const fishRes = await db.collection('fish').doc(fishId).get()
  if (!fishRes.data || fishRes.data.userId !== openid) {
    return forbidden()
  }

  // 处理日期并验证
  const dateCheck = validateDate(updateData.purchaseDate)
  if (!dateCheck.valid) {
    return paramError(dateCheck.error)
  }
  if (dateCheck.date) {
    updateData.purchaseDate = dateCheck.date
  }

  updateData.updatedAt = db.serverDate()

  // 移除不允许直接更新的字段
  delete updateData.tankId
  delete updateData.userId
  delete updateData.transferHistory
  delete updateData.status

  try {
    await db.collection('fish').doc(fishId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateFish error:', err)
    return dbError()
  }
}

// 删除鱼记录
async function deleteFish(openid, params) {
  const { fishId } = params

  if (!fishId) {
    return paramError('缺少 fishId')
  }

  // 验证所有权
  const fishRes = await db.collection('fish').doc(fishId).get()
  if (!fishRes.data || fishRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    await db.collection('fish').doc(fishId).remove()
    return success()
  } catch (err) {
    console.error('deleteFish error:', err)
    return dbError()
  }
}

// 获取单条鱼记录
async function getFish(openid, params) {
  const { fishId } = params

  if (!fishId) {
    return paramError('缺少 fishId')
  }

  try {
    const fishRes = await db.collection('fish').doc(fishId).get()

    if (!fishRes.data || fishRes.data.userId !== openid) {
      return notFound()
    }

    // 获取鱼种信息
    let speciesInfo = null
    if (fishRes.data.speciesId) {
      const speciesRes = await db.collection('fish_species').doc(fishRes.data.speciesId).get()
      speciesInfo = speciesRes.data || null
    }

    return success({
      ...fishRes.data,
      speciesInfo: speciesInfo
    })
  } catch (err) {
    console.error('getFish error:', err)
    return dbError()
  }
}

// 获取鱼列表
async function listFish(openid, params) {
  const { tankId, status } = params
  // 使用共享的分页验证
  const { page, pageSize, skip } = validatePagination(params)

  const whereCondition = { userId: openid }

  if (tankId) {
    whereCondition.tankId = tankId
  }

  if (status) {
    whereCondition.status = status
  }

  try {
    const fishRes = await db.collection('fish')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取鱼种信息
    const speciesIds = [...new Set(fishRes.data.map(f => f.speciesId).filter(Boolean))]
    let speciesMap = {}

    if (speciesIds.length > 0) {
      const speciesRes = await db.collection('fish_species')
        .where({
          _id: _.in(speciesIds)
        })
        .get()
      speciesMap = speciesRes.data.reduce((acc, s) => {
        acc[s._id] = s
        return acc
      }, {})
    }

    const fishWithSpecies = fishRes.data.map(fish => ({
      ...fish,
      speciesInfo: fish.speciesId ? speciesMap[fish.speciesId] : null
    }))

    // 获取总数
    const countRes = await db.collection('fish')
      .where(whereCondition)
      .count()

    return success({
      list: fishWithSpecies,
      pagination: {
        page,
        pageSize,
        total: countRes.total,
        totalPages: Math.ceil(countRes.total / pageSize)
      }
    })
  } catch (err) {
    console.error('listFish error:', err)
    return dbError()
  }
}

// 转移鱼到另一个鱼缸
async function transferFish(openid, params) {
  const { fishId, toTankId, quantity } = params

  if (!fishId || !toTankId) {
    return paramError('缺少 fishId 或 toTankId')
  }

  // 验证鱼的所有权
  const fishRes = await db.collection('fish').doc(fishId).get()
  if (!fishRes.data || fishRes.data.userId !== openid) {
    return forbidden()
  }

  // 验证目标鱼缸的所有权
  const isTargetOwner = await verifyTankOwnership(db, toTankId, openid)
  if (!isTargetOwner) {
    return forbidden('目标鱼缸不属于你')
  }

  const fish = fishRes.data
  const fromTankId = fish.tankId
  const transferQuantity = quantity || fish.quantity
  const now = db.serverDate()

  try {
    if (transferQuantity >= fish.quantity) {
      // 全部转移
      await db.collection('fish').doc(fishId).update({
        data: {
          tankId: toTankId,
          transferHistory: _.push({
            fromTankId: fromTankId,
            toTankId: toTankId,
            quantity: fish.quantity,
            date: now
          }),
          updatedAt: now
        }
      })
    } else {
      // 部分转移: 使用事务确保原子性（减少原记录数量 + 创建新记录）
      const transaction = await db.startTransaction()
      try {
        // 1. 减少原记录数量
        await transaction.collection('fish').doc(fishId).update({
          data: {
            quantity: fish.quantity - transferQuantity,
            updatedAt: now
          }
        })

        // 2. 创建新的鱼记录
        const newFishData = {
          ...fish,
          _id: undefined,
          tankId: toTankId,
          quantity: transferQuantity,
          transferHistory: [{
            fromTankId: fromTankId,
            toTankId: toTankId,
            quantity: transferQuantity,
            date: now
          }],
          createdAt: now,
          updatedAt: now
        }
        delete newFishData._id

        await transaction.collection('fish').add({ data: newFishData })

        // 提交事务
        await transaction.commit()
      } catch (transactionErr) {
        // 回滚事务
        await transaction.rollback()
        console.error('transferFish transaction error:', transactionErr)
        return dbError()
      }
    }

    return success()
  } catch (err) {
    console.error('transferFish error:', err)
    return dbError()
  }
}

// 标记鱼死亡
async function markFishDead(openid, params) {
  const { fishId, deathDate, deathReason, quantity } = params

  if (!fishId) {
    return paramError('缺少 fishId')
  }

  // 验证所有权
  const fishRes = await db.collection('fish').doc(fishId).get()
  if (!fishRes.data || fishRes.data.userId !== openid) {
    return forbidden()
  }

  const fish = fishRes.data
  const deadQuantity = quantity || fish.quantity
  const now = db.serverDate()

  // 验证死亡日期
  const dateCheck = validateDate(deathDate)
  if (!dateCheck.valid) {
    return paramError(dateCheck.error)
  }

  try {
    if (deadQuantity >= fish.quantity) {
      // 全部死亡
      await db.collection('fish').doc(fishId).update({
        data: {
          status: 'dead',
          deathDate: dateCheck.date || now,
          deathReason: deathReason || '',
          updatedAt: now
        }
      })
    } else {
      // 部分死亡: 使用事务确保原子性（减少原记录数量 + 创建死亡记录）
      const transaction = await db.startTransaction()
      try {
        // 1. 减少原记录数量
        await transaction.collection('fish').doc(fishId).update({
          data: {
            quantity: fish.quantity - deadQuantity,
            updatedAt: now
          }
        })

        // 2. 创建死亡记录
        const deadFishData = {
          ...fish,
          _id: undefined,
          quantity: deadQuantity,
          status: 'dead',
          deathDate: dateCheck.date || now,
          deathReason: deathReason || '',
          createdAt: now,
          updatedAt: now
        }
        delete deadFishData._id

        await transaction.collection('fish').add({ data: deadFishData })

        // 提交事务
        await transaction.commit()
      } catch (transactionErr) {
        // 回滚事务
        await transaction.rollback()
        console.error('markFishDead transaction error:', transactionErr)
        return dbError()
      }
    }

    return success()
  } catch (err) {
    console.error('markFishDead error:', err)
    return dbError()
  }
}
