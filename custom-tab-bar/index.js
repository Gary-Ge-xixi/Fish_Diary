Component({
  data: {
    selected: 0,
    hidden: false, // 控制 TabBar 显示/隐藏，用于弹窗覆盖
    color: "#71717a",
    selectedColor: "#18181b",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        icon: "home",
      },
      {
        pagePath: "/pages/wiki/wiki",
        text: "百科",
        icon: "book",
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        icon: "user",
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
    }
  }
})
