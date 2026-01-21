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
  const unionid = wxContext.UNIONID

  try {
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    const now = db.serverDate()

    if (userRes.data.length === 0) {
      // 新用户，创建记录
      const newUser = {
        openid: openid,
        unionid: unionid || '',
        nickName: '',
        avatarUrl: '',
        settings: {
          feedReminder: true,
          waterChangeReminder: true
        },
        createdAt: now,
        updatedAt: now
      }

      const addRes = await db.collection('users').add({
        data: newUser
      })

      return {
        code: 0,
        message: 'success',
        data: {
          userId: addRes._id,
          openid: openid,
          isNewUser: true,
          ...newUser
        }
      }
    } else {
      // 已存在用户，更新最后登录时间
      const existingUser = userRes.data[0]

      await db.collection('users').doc(existingUser._id).update({
        data: {
          updatedAt: now
        }
      })

      return {
        code: 0,
        message: 'success',
        data: {
          userId: existingUser._id,
          openid: openid,
          isNewUser: false,
          ...existingUser
        }
      }
    }
  } catch (err) {
    console.error('user-login error:', err)
    return {
      code: 2001,
      message: '数据库操作失败'
    }
  }
}
