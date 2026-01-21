// 云函数入口文件
const cloud = require('wx-server-sdk')

// 引入共享模块
const { success, paramError, unauthorized, notFound, forbidden, dbError, verifyTankOwnership } = require('./shared/auth')
const { validatePagination, validateDate, validateNonNegative, validateEnum } = require('./shared/validators')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 设备类型枚举
const EQUIPMENT_TYPES = {
  heater: '加热棒',
  air_pump: '氧气泵',
  light: '灯具',
  filter: '过滤设备',
  filter_media: '滤材',
  uv_lamp: '杀菌灯',
  water_pump: '水泵'
}

// 过滤类型枚举
const FILTER_TYPES = {
  sump: '底滤',
  hang_on: '背挂',
  canister: '过滤筒',
  trickle: '周转箱/滴流'
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
      return await createEquipment(openid, params)
    case 'update':
      return await updateEquipment(openid, params)
    case 'delete':
      return await deleteEquipment(openid, params)
    case 'get':
      return await getEquipment(openid, params)
    case 'list':
      return await listEquipment(openid, params)
    case 'getTypes':
      return success({ equipmentTypes: EQUIPMENT_TYPES, filterTypes: FILTER_TYPES })
    default:
      return paramError('未知的 action')
  }
}

// 创建设备
async function createEquipment(openid, params) {
  const { tankId, type, brand, model, price, purchaseDate, installDate, specs, notes } = params

  if (!tankId || !type) {
    return paramError('缺少 tankId 或 type')
  }

  // 验证设备类型
  const typeCheck = validateEnum(type, EQUIPMENT_TYPES, '设备类型')
  if (!typeCheck.valid) {
    return paramError(typeCheck.error)
  }

  // 验证价格
  const priceCheck = validateNonNegative(price, '价格')
  if (!priceCheck.valid) {
    return paramError(priceCheck.error)
  }

  // 验证鱼缸所有权
  const isOwner = await verifyTankOwnership(db, tankId, openid)
  if (!isOwner) {
    return forbidden()
  }

  // 验证日期
  const purchaseDateCheck = validateDate(purchaseDate)
  if (!purchaseDateCheck.valid) {
    return paramError(purchaseDateCheck.error)
  }

  const installDateCheck = validateDate(installDate)
  if (!installDateCheck.valid) {
    return paramError(installDateCheck.error)
  }

  const now = db.serverDate()

  const equipmentData = {
    tankId: tankId,
    userId: openid,
    type: type,
    typeName: EQUIPMENT_TYPES[type],
    brand: brand || '',
    model: model || '',
    price: price || 0,
    purchaseDate: purchaseDateCheck.date || null,
    installDate: installDateCheck.date || now,
    specs: specs || {},
    status: 'in_use',
    notes: notes || '',
    createdAt: now,
    updatedAt: now
  }

  // 如果是过滤设备，添加过滤类型名称
  if (type === 'filter' && specs && specs.filterType) {
    equipmentData.specs.filterTypeName = FILTER_TYPES[specs.filterType] || specs.filterType
  }

  try {
    const res = await db.collection('equipment').add({ data: equipmentData })
    return success({ equipmentId: res._id, ...equipmentData })
  } catch (err) {
    console.error('createEquipment error:', err)
    return dbError()
  }
}

// 更新设备
async function updateEquipment(openid, params) {
  const { equipmentId, ...updateData } = params

  if (!equipmentId) {
    return paramError('缺少 equipmentId')
  }

  // 验证所有权
  const equipmentRes = await db.collection('equipment').doc(equipmentId).get()
  if (!equipmentRes.data || equipmentRes.data.userId !== openid) {
    return forbidden()
  }

  // 处理日期
  if (updateData.purchaseDate) {
    const dateCheck = validateDate(updateData.purchaseDate)
    if (!dateCheck.valid) {
      return paramError(dateCheck.error)
    }
    updateData.purchaseDate = dateCheck.date
  }
  if (updateData.installDate) {
    const dateCheck = validateDate(updateData.installDate)
    if (!dateCheck.valid) {
      return paramError(dateCheck.error)
    }
    updateData.installDate = dateCheck.date
  }

  // 如果更新了类型，同步更新类型名称
  if (updateData.type && EQUIPMENT_TYPES[updateData.type]) {
    updateData.typeName = EQUIPMENT_TYPES[updateData.type]
  }

  // 如果更新了过滤类型
  if (updateData.specs && updateData.specs.filterType) {
    updateData.specs.filterTypeName = FILTER_TYPES[updateData.specs.filterType] || updateData.specs.filterType
  }

  updateData.updatedAt = db.serverDate()

  // 移除不允许直接更新的字段
  delete updateData.tankId
  delete updateData.userId

  try {
    await db.collection('equipment').doc(equipmentId).update({ data: updateData })
    return success()
  } catch (err) {
    console.error('updateEquipment error:', err)
    return dbError()
  }
}

// 删除设备
async function deleteEquipment(openid, params) {
  const { equipmentId } = params

  if (!equipmentId) {
    return paramError('缺少 equipmentId')
  }

  // 验证所有权
  const equipmentRes = await db.collection('equipment').doc(equipmentId).get()
  if (!equipmentRes.data || equipmentRes.data.userId !== openid) {
    return forbidden()
  }

  try {
    await db.collection('equipment').doc(equipmentId).remove()
    return success()
  } catch (err) {
    console.error('deleteEquipment error:', err)
    return dbError()
  }
}

// 获取单个设备
async function getEquipment(openid, params) {
  const { equipmentId } = params

  if (!equipmentId) {
    return paramError('缺少 equipmentId')
  }

  try {
    const equipmentRes = await db.collection('equipment').doc(equipmentId).get()

    if (!equipmentRes.data || equipmentRes.data.userId !== openid) {
      return notFound()
    }

    return success(equipmentRes.data)
  } catch (err) {
    console.error('getEquipment error:', err)
    return dbError()
  }
}

// 获取设备列表
async function listEquipment(openid, params) {
  const { tankId, type, status } = params
  // 使用共享的分页验证
  const { page, pageSize, skip } = validatePagination(params)

  const whereCondition = { userId: openid }

  if (tankId) {
    whereCondition.tankId = tankId
  }

  if (type) {
    whereCondition.type = type
  }

  if (status) {
    whereCondition.status = status
  }

  try {
    const equipmentRes = await db.collection('equipment')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 获取总数
    const countRes = await db.collection('equipment')
      .where(whereCondition)
      .count()

    // 按类型分组统计
    const typeStats = {}
    equipmentRes.data.forEach(eq => {
      if (!typeStats[eq.type]) {
        typeStats[eq.type] = { count: 0, totalPrice: 0 }
      }
      typeStats[eq.type].count++
      typeStats[eq.type].totalPrice += eq.price || 0
    })

    return success({
      list: equipmentRes.data,
      typeStats: typeStats,
      pagination: {
        page,
        pageSize,
        total: countRes.total,
        totalPages: Math.ceil(countRes.total / pageSize)
      }
    })
  } catch (err) {
    console.error('listEquipment error:', err)
    return dbError()
  }
}
