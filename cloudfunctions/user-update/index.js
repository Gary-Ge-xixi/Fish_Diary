// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { nickName, avatarUrl, settings } = event

  // 至少需要一个更新字段
  if (nickName === undefined && avatarUrl === undefined && settings === undefined) {
    return {
      code: 1001,
      message: '请提供要更新的字段'
    }
  }

  try {
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    if (userRes.data.length === 0) {
      return {
        code: 1003,
        message: '用户不存在'
      }
    }

    const existingUser = userRes.data[0]
    const updateData = {
      updatedAt: db.serverDate()
    }

    // 只更新提供的字段
    if (nickName !== undefined) {
      updateData.nickName = nickName
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl
    }
    if (settings !== undefined) {
      // 合并 settings，而不是完全替换
      updateData.settings = {
        ...existingUser.settings,
        ...settings
      }
    }

    await db.collection('users').doc(existingUser._id).update({
      data: updateData
    })

    // 获取更新后的用户数据
    const updatedUserRes = await db.collection('users').doc(existingUser._id).get()

    return {
      code: 0,
      message: 'success',
      data: updatedUserRes.data
    }
  } catch (err) {
    console.error('user-update error:', err)
    return {
      code: 2001,
      message: '数据库操作失败'
    }
  }
}
