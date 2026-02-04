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

    // 设置自定义 tabBar 选中状态（Skyline 模式下 getTabBar 是异步的）
    if (typeof this.getTabBar === 'function') {
      this.getTabBar((tabBar: any) => {
        tabBar.setData({ selected: 2 })
      })
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
  }
})