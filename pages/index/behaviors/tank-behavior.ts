/**
 * 鱼缸管理 Behavior
 * 负责鱼缸列表加载、添加、选择等功能
 */
import { tankList, tankCreate, statisticsGetTank } from '../../../utils/api'
import { TankItem, TankForm } from '../../../utils/types'
import { TANK_SIZE_OPTIONS, TankSizeOption } from '../helpers/constants'
import { getApp } from '../../../app'
import { logger } from '../../../utils/logger'
import { uploadImage } from '../../../utils/upload'

interface TankBehaviorData {
  loading: boolean
  tanks: TankItem[]
  currentTankIndex: number
  currentTank: TankItem | null
  tankStats: TankStats | null
  showAddTankPopup: boolean
  tankSizeOptions: TankSizeOption[]
  tankForm: TankForm
  errors: {
    coverUrl: boolean
    name: boolean
    sizeKey: boolean
  }
  saving: boolean
}

export const tankBehavior = Behavior({
  data: {
    loading: true,
    tanks: [] as TankItem[],
    currentTankIndex: 0,
    currentTank: null as TankItem | null,
    tankStats: null as TankStats | null,
    showAddTankPopup: false,
    tankSizeOptions: TANK_SIZE_OPTIONS,
    tankForm: {
      coverUrl: '',
      name: '',
      sizeKey: '',
      price: ''
    } as TankForm,
    errors: {
      coverUrl: false,
      name: false,
      sizeKey: false
    },
    saving: false
  } as TankBehaviorData,

  methods: {
    // 加载鱼缸列表
    async loadTanks() {
      this.setData({ loading: true })

      try {
        const result = await tankList({ page: 1, pageSize: 10 })
        const tanks = result.list || []

        this.setData({
          tanks,
          loading: false,
          currentTankIndex: 0,
          currentTank: tanks.length > 0 ? tanks[0] : null
        })

        if (tanks.length > 0) {
          await this.loadTankStats(tanks[0]._id)
        }
      } catch (err) {
        logger.error('loadTanks error:', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },

    // 加载鱼缸统计数据
    async loadTankStats(tankId: string) {
      try {
        const stats = await statisticsGetTank(tankId)
        this.setData({ tankStats: stats })
      } catch (err) {
        logger.error('loadTankStats error:', err)
      }
    },

    // 选择鱼缸
    onTankSelect(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index as number
      const tank = this.data.tanks[index]

      if (index === this.data.currentTankIndex) return

      this.setData({
        currentTankIndex: index,
        currentTank: tank,
        tankStats: null,
        fishList: [] // 清空鱼类列表，等待重新加载
      })

      this.loadTankStats(tank._id)

      // 如果当前 Tab 是鱼类，重新加载列表
      if (this.data.activeTab === 'fish') {
        this.loadFishList()
      }
    },

    // 打开添加鱼缸弹窗
    onAddTank() {
      // 隐藏 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: true })
        })
      }
      this.setData({
        showAddTankPopup: true,
        tankForm: { coverUrl: '', name: '', sizeKey: '', price: '' },
        errors: { coverUrl: false, name: false, sizeKey: false }
      })
    },

    // 关闭添加鱼缸弹窗
    onCloseAddTank() {
      this.setData({ showAddTankPopup: false })
      // 恢复显示 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: false })
        })
      }
    },

    // 选择鱼缸图片
    async onChooseTankImage() {
      // 设置标记，防止 onHide 关闭弹窗
      (this as any)._isChoosingImage = true
      try {
        const res = await wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera']
        })
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          'tankForm.coverUrl': tempFilePath,
          'errors.coverUrl': false
        })
      } catch {
        // 用户取消选择
      } finally {
        // 清除标记
        (this as any)._isChoosingImage = false
      }
    },

    // 鱼缸名称输入
    onTankNameInput(e: WechatMiniprogram.Input) {
      this.setData({
        'tankForm.name': e.detail.value,
        'errors.name': false
      })
    },

    // 鱼缸价格输入
    onTankPriceInput(e: WechatMiniprogram.Input) {
      this.setData({
        'tankForm.price': e.detail.value
      })
    },

    // 选择鱼缸尺寸
    onSelectTankSize(e: WechatMiniprogram.TouchEvent) {
      const key = e.currentTarget.dataset.key as string
      this.setData({
        'tankForm.sizeKey': key,
        'errors.sizeKey': false
      })
    },

    // 保存鱼缸
    async onSaveTank() {
      const { tankForm, tankSizeOptions } = this.data

      // 校验必填项
      const errors = {
        coverUrl: !tankForm.coverUrl,
        name: !tankForm.name.trim(),
        sizeKey: !tankForm.sizeKey
      }

      if (errors.coverUrl || errors.name || errors.sizeKey) {
        this.setData({ errors })
        return
      }

      this.setData({ saving: true })

      try {
        // 获取尺寸数据
        const sizeOption = tankSizeOptions.find(s => s.key === tankForm.sizeKey)
        if (!sizeOption) {
          throw new Error('无效的尺寸选项')
        }

        const price = parseFloat(tankForm.price) || 0

        // 上传图片并创建鱼缸
        const fileID = await uploadImage(tankForm.coverUrl, 'tanks')

        await tankCreate({
          name: tankForm.name.trim(),
          size: sizeOption.size,
          coverUrl: fileID,
          price: price
        })

        wx.showToast({ title: '添加成功', icon: 'success' })

        // 关闭弹窗并刷新列表
        this.setData({ showAddTankPopup: false })
        this.loadTanks()
        getApp().markDirty('tanks')

      } catch (err) {
        logger.error('保存鱼缸失败:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    },

    // 跳转鱼缸详情
    onTankDetail() {
      if (!this.data.currentTank) return
      wx.navigateTo({
        url: `/pages/tank-detail/tank-detail?id=${this.data.currentTank._id}`
      })
    }
  }
})
