const defaultAvatar = ''

Page({
  data: {
    userInfo: {
        avatarUrl: defaultAvatar,
        nickName: '鱼友'
    },
    hasUserInfo: false
  },

  onLoad() {
      const ui = wx.getStorageSync('user_info')
      if (ui) {
          this.setData({ userInfo: ui, hasUserInfo: true })
      }
  },

  onShow() {
    // 设置状态栏颜色：白色背景 + 黑色文字
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff',
      animation: { duration: 0, timingFunc: 'linear' }
    })

    // 设置自定义 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  onChooseAvatar(e: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    const { avatarUrl } = e.detail
    this.setData({
      'userInfo.avatarUrl': avatarUrl,
      hasUserInfo: true
    })
    wx.setStorageSync('user_info', this.data.userInfo)
  },

  onInputChange(e: WechatMiniprogram.Input) {
    const nickName = e.detail.value
    this.setData({
      'userInfo.nickName': nickName
    })
    wx.setStorageSync('user_info', this.data.userInfo)
  },

  // 分享给鱼友（open-type="share" 需要此方法）
  onShareAppMessage() {
    return {
      title: 'Fish Diary - 养鱼日记',
      path: '/pages/index/index',
      imageUrl: '' // 可添加分享图片
    }
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '这将清除所有本地缓存数据（不影响云端数据），确定继续吗？',
      confirmText: '确定清除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({
            title: '缓存已清除',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.reLaunch({ url: '/pages/index/index' })
              }, 1500)
            }
          })
        }
      }
    })
  }
})