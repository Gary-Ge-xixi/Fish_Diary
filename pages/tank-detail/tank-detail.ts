import { TankItem, FishListItem } from '../../utils/types'
import { tankGet, tankUpdate, tankDelete, statisticsGetTank, statisticsGetDeathList } from '../../utils/api'
import { getApp } from '../../app'
import { logger } from '../../utils/logger'
import { TANK_SIZE_OPTIONS } from '../index/helpers/constants'

// 根据尺寸匹配预设选项
function matchSizeOption(size?: { length: number; width: number; height: number }) {
  if (!size) return null
  return TANK_SIZE_OPTIONS.find(opt =>
    opt.size.length === size.length &&
    opt.size.width === size.width &&
    opt.size.height === size.height
  ) || null
}

Page({
  data: {
    tankId: '',
    tank: null as TankItem | null,
    stats: null as TankStats | null,
    deathList: [] as FishListItem[],
    loading: true,
    // 编辑弹窗
    showEditPopup: false,
    editForm: {
      name: '',
      price: ''
    },
    // 尺寸展示（只读）
    sizeDisplay: {
      label: '',
      desc: ''
    },
    saving: false
  },

  onLoad(options: { id: string }) {
    if (options.id) {
      this.setData({ tankId: options.id })
      this.loadData(options.id)
    }
  },

  onShow() {
    // 设置状态栏颜色：白色背景 + 黑色文字
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff',
      animation: { duration: 0, timingFunc: 'linear' }
    })
  },

  async loadData(id: string) {
    this.setData({ loading: true })

    try {
      const tank = await tankGet(id)
      const stats = await statisticsGetTank(id)
      const deathRes = await statisticsGetDeathList({ tankId: id, page: 1, pageSize: 20 })

      this.setData({
          tank,
          stats,
          deathList: deathRes.list,
          loading: false
      })

    } catch (err) {
        logger.error(err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ loading: false })
    }
  },

  onEditTank() {
    const { tank } = this.data
    if (!tank) return

    // 匹配尺寸选项
    const matchedOption = matchSizeOption(tank.size)
    let sizeDisplay = { label: '', desc: '' }

    if (matchedOption) {
      sizeDisplay = {
        label: matchedOption.label,
        desc: matchedOption.desc
      }
    } else if (tank.size) {
      sizeDisplay = {
        label: '自定义尺寸',
        desc: `${tank.size.length}×${tank.size.width}×${tank.size.height}cm`
      }
    } else {
      sizeDisplay = {
        label: '未设置',
        desc: ''
      }
    }

    this.setData({
      showEditPopup: true,
      editForm: {
        name: tank.name || '',
        price: String(tank.price || '')
      },
      sizeDisplay
    })
  },

  onCloseEditPopup() {
    this.setData({ showEditPopup: false })
  },

  onEditFormInput(e: WechatMiniprogram.Input) {
    const field = e.currentTarget.dataset.field as string
    this.setData({
      [`editForm.${field}`]: e.detail.value
    })
  },

  async onSaveEdit() {
    const { tankId, editForm, tank } = this.data

    // 验证名称
    if (!editForm.name.trim()) {
      wx.showToast({ title: '请输入鱼缸名称', icon: 'none' })
      return
    }

    // 验证价格
    const price = parseFloat(editForm.price)
    if (editForm.price && (isNaN(price) || price < 0)) {
      wx.showToast({ title: '价格格式不正确', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      await tankUpdate({
        tankId,
        name: editForm.name.trim(),
        price: price || 0,
        // 保持原有尺寸不变
        size: tank?.size
      })

      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ showEditPopup: false, saving: false })

      // 标记数据为脏，返回首页时会刷新
      getApp().markDirty(['tanks', 'tankStats'])

      // 重新加载数据
      this.loadData(tankId)
    } catch (err) {
      logger.error(err)
      wx.showToast({ title: '保存失败', icon: 'none' })
      this.setData({ saving: false })
    }
  },

  // 点击封面更换照片
  async onChangeCover() {
    // 设置标记，防止 onHide 关闭弹窗
    (this as any)._isChoosingImage = true
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })

      if (!res.tempFiles.length) return

      const tempFilePath = res.tempFiles[0].tempFilePath

      wx.showLoading({ title: '上传中...' })

      // 生成云存储路径
      const cloudPath = `tanks/${this.data.tankId}/cover_${Date.now()}.jpg`

      // 上传到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      })

      // 更新数据库
      await tankUpdate({
        tankId: this.data.tankId,
        coverUrl: uploadRes.fileID
      })

      wx.hideLoading()
      wx.showToast({ title: '封面已更新', icon: 'success' })

      // 标记数据为脏
      getApp().markDirty(['tanks'])

      // 重新加载数据
      this.loadData(this.data.tankId)
    } catch (err) {
      wx.hideLoading()
      logger.error('更换封面失败:', err)
      wx.showToast({ title: '更换失败', icon: 'none' })
    } finally {
      (this as any)._isChoosingImage = false
    }
  },

  // 删除鱼缸
  async onDeleteTank() {
    const { tank, tankId, stats } = this.data
    if (!tank) return

    // 构建确认信息
    const fishCount = stats?.fish?.totalCount || 0
    const confirmContent = fishCount > 0
      ? `确定要删除「${tank.name}」吗？\n\n该鱼缸下的 ${fishCount} 条鱼记录也将一并删除，此操作不可恢复。`
      : `确定要删除「${tank.name}」吗？\n\n此操作不可恢复。`

    const res = await wx.showModal({
      title: '删除鱼缸',
      content: confirmContent,
      confirmText: '删除',
      confirmColor: '#ef4444'
    })

    if (!res.confirm) return

    this.setData({ saving: true })

    try {
      await tankDelete(tankId)

      // 先关闭弹窗，避免 page-container 冲突
      this.setData({ showEditPopup: false })

      wx.showToast({ title: '已删除', icon: 'success' })

      // 标记数据为脏
      getApp().markDirty(['tanks', 'tankStats', 'fish'])

      // 延迟返回首页（tabBar 页面需要用 switchTab）
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      logger.error('删除鱼缸失败:', err)
      wx.showToast({ title: '删除失败', icon: 'none' })
      this.setData({ saving: false })
    }
  },

  onHide() {
    // 选择图片时不关闭弹窗（wx.chooseMedia 会触发 onHide）
    if ((this as any)._isChoosingImage) return

    // 页面隐藏时关闭弹窗，避免 page-container "Only one instance" 错误
    if (this.data.showEditPopup) {
      this.setData({ showEditPopup: false })
    }
  }
})
