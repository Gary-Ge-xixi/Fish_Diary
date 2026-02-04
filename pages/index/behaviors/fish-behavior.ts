/**
 * 鱼类管理 Behavior
 * 负责鱼类列表、添加、编辑、转移、死亡记录等功能
 */
import {
  fishList as apiFishList,
  fishCreate,
  fishTransfer,
  fishMarkDead,
  fishDelete,
  getCategoriesTree
} from '../../../utils/api'
import { FishListItem, FishForm, EditFishForm } from '../../../utils/types'
import { formatTimestamp } from '../helpers/formatters'
import { getApp } from '../../../app'
import { logger } from '../../../utils/logger'

interface FishBehaviorData {
  showFishPopup: boolean
  fishForm: FishForm
  fishList: FishListItem[]
  fishCategories: FishCategory[]
  fishCategoryRange: Array<FishCategory[] | FishSubcategory[]>
  fishCategoryIndex: number[]
  showFishEditPopup: boolean
  editFishForm: EditFishForm
  targetTankIndex: number
}

export const fishBehavior = Behavior({
  data: {
    showFishPopup: false,
    fishForm: {
      speciesId: '',
      speciesName: '',
      price: '',
      count: '1'
    } as FishForm,
    fishList: [] as FishListItem[],
    fishCategories: [] as FishCategory[],
    fishCategoryRange: [[], []] as Array<FishCategory[] | FishSubcategory[]>,
    fishCategoryIndex: [0, 0],
    showFishEditPopup: false,
    editFishForm: {
      _id: '',
      name: '',
      baseQuantity: 0,
      deadCount: '',
      currentAlive: 0,
      tankId: '',
      tankName: ''
    } as EditFishForm,
    targetTankIndex: 0
  } as FishBehaviorData,

  methods: {
    // 加载鱼类列表
    async loadFishList() {
      try {
        const result = await apiFishList({
          tankId: this.data.currentTank?._id,
          status: 'alive'
        })

        const list = result.list.map(item => Object.assign({}, item, {
          purchaseDateDisplay: formatTimestamp(item.purchaseDate, '/'),
          totalPriceDisplay: (item.purchasePrice * item.quantity).toFixed(0)
        })) as FishListItem[]

        this.setData({ fishList: list })
      } catch (err) {
        logger.error('loadFishList error:', err)
        wx.showToast({ title: '加载鱼类失败', icon: 'none' })
      }
    },

    // 加载鱼类分类
    async loadFishCategories() {
      // 如果已经加载过，不再重复加载
      if (this.data.fishCategories.length > 0) return

      try {
        const result = await getCategoriesTree()
        this.initCategoryPicker(result.categories || [])
      } catch (err) {
        logger.error('loadFishCategories error:', err)
        wx.showToast({ title: '加载分类失败', icon: 'none' })
      }
    },

    // 初始化分类选择器数据
    initCategoryPicker(categories: FishCategory[]) {
      // 过滤掉没有子分类的一级分类
      const validTree = categories.filter(item => item.subcategories && item.subcategories.length > 0)

      if (validTree.length === 0) return

      // 读取上次选择的缓存
      const lastSelection = wx.getStorageSync('last_fish_selection') || { pIndex: 0, cIndex: 0 }

      // 确保索引有效
      let pIndex = lastSelection.pIndex
      let cIndex = lastSelection.cIndex

      if (pIndex >= validTree.length) pIndex = 0
      if (cIndex >= (validTree[pIndex].subcategories || []).length) cIndex = 0

      // 设置初始数据
      const col0 = validTree
      const col1 = validTree[pIndex].subcategories || []

      this.setData({
        fishCategories: validTree,
        fishCategoryRange: [col0, col1],
        fishCategoryIndex: [pIndex, cIndex]
      })

      // 如果有有效的子分类，初始化选中值
      if (col1.length > 0) {
        this.setData({
          'fishForm.speciesId': col1[cIndex]._id,
          'fishForm.speciesName': col1[cIndex].name
        })
      }
    },

    // 打开添加鱼类弹窗
    onAddFish() {
      // 隐藏 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: true })
        })
      }
      this.setData({
        showFishPopup: true,
        fishForm: {
          speciesId: '',
          speciesName: '',
          price: '',
          count: '1'
        }
      })
      this.loadFishCategories()
    },

    // 关闭添加鱼类弹窗
    onCloseFishPopup() {
      this.setData({ showFishPopup: false })
      // 恢复显示 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: false })
        })
      }
    },

    // 分类选择变更
    onFishCategoryChange(e: WechatMiniprogram.PickerChange) {
      const value = e.detail.value as number[]
      const pIndex = value[0]
      const cIndex = value[1]

      const parent = this.data.fishCategories[pIndex]
      const child = (parent.subcategories || [])[cIndex]

      if (child) {
        this.setData({
          fishCategoryIndex: value,
          'fishForm.speciesId': child._id,
          'fishForm.speciesName': child.name
        })
      }

      // 保存选择到本地缓存
      wx.setStorageSync('last_fish_selection', { pIndex, cIndex })
    },

    // 分类列变更（联动）
    onFishCategoryColumnChange(e: WechatMiniprogram.PickerColumnChange) {
      const { column, value } = e.detail
      if (column === 0) {
        const parent = this.data.fishCategories[value]
        const children = parent.subcategories || []

        this.setData({
          'fishCategoryRange[1]': children,
          'fishCategoryIndex[0]': value,
          'fishCategoryIndex[1]': 0
        })
      }
    },

    // 价格输入
    onFishPriceInput(e: WechatMiniprogram.Input) {
      this.setData({
        'fishForm.price': e.detail.value
      })
    },

    // 数量输入
    onFishCountInput(e: WechatMiniprogram.Input) {
      let value = parseInt(e.detail.value)
      if (isNaN(value)) value = 0
      if (value > 999) value = 999

      this.setData({
        'fishForm.count': value.toString()
      })
    },

    // 保存鱼类
    async onSaveFish() {
      const { fishForm, currentTank } = this.data

      if (!fishForm.speciesId) {
        wx.showToast({ title: '请选择鱼类', icon: 'none' })
        return
      }
      if (!fishForm.price) {
        wx.showToast({ title: '请输入价格', icon: 'none' })
        return
      }
      if (!fishForm.count || parseInt(fishForm.count) <= 0) {
        wx.showToast({ title: '请输入有效数量', icon: 'none' })
        return
      }

      this.setData({ saving: true })

      try {
        if (!currentTank) throw new Error('未选择鱼缸')

        await fishCreate({
          tankId: currentTank._id,
          speciesId: fishForm.speciesId,
          customName: fishForm.speciesName,
          quantity: parseInt(fishForm.count),
          purchasePrice: parseFloat(fishForm.price),
          purchaseDate: new Date().toISOString()
        })

        wx.showToast({ title: '添加成功', icon: 'success' })
        this.onCloseFishPopup()
        this.loadFishList()
        getApp().markDirty(['fish', 'tankStats'])

      } catch (err) {
        logger.error('saveFish error:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    },

    // ========== 编辑鱼类相关 ==========

    // 点击鱼类列表项
    onFishClick(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id
      const fish = this.data.fishList.find((f) => f._id === id)
      if (!fish) return

      // 隐藏 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: true })
        })
      }

      const fishTankIndex = this.data.tanks.findIndex(t => t._id === fish.tankId)
      const targetIndex = fishTankIndex >= 0 ? fishTankIndex : 0

      this.setData({
        showFishEditPopup: true,
        targetTankIndex: targetIndex,
        editFishForm: {
          _id: fish._id,
          name: fish.customName,
          baseQuantity: fish.quantity,
          deadCount: '',
          currentAlive: fish.quantity,
          tankId: fish.tankId,
          tankName: this.data.currentTank?.name || ''
        }
      })
    },

    // 关闭编辑鱼类弹窗
    onCloseFishEditPopup() {
      this.setData({ showFishEditPopup: false })
      // 恢复显示 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: false })
        })
      }
    },

    // 转移鱼缸选择
    onTransferTankChange(e: WechatMiniprogram.PickerChange) {
      const index = parseInt(e.detail.value as string)
      this.setData({ targetTankIndex: index })
    },

    // 死亡数量输入
    onFishDeadInput(e: WechatMiniprogram.Input) {
      const inputValue = e.detail.value.trim()
      const { baseQuantity } = this.data.editFishForm

      // 允许空值
      if (inputValue === '') {
        this.setData({ 'editFishForm.deadCount': '' })
        return
      }

      const val = parseInt(inputValue, 10)

      if (isNaN(val) || val < 0) {
        wx.showToast({ title: '请输入有效数字', icon: 'none' })
        return
      }

      if (val > baseQuantity) {
        wx.showToast({ title: '不能超过当前数量', icon: 'none' })
        return
      }

      this.setData({
        'editFishForm.deadCount': val.toString()
      })
    },

    // 保存编辑鱼类
    async onSaveEditFish() {
      const { editFishForm, tanks, targetTankIndex } = this.data
      const deadCount = parseInt(editFishForm.deadCount) || 0
      const targetTank = tanks[targetTankIndex]

      const isTransfer = targetTank && targetTank._id !== editFishForm.tankId
      if (deadCount <= 0 && !isTransfer) {
        this.onCloseFishEditPopup()
        return
      }

      this.setData({ saving: true })

      try {
        let msg = ''

        // 处理转移
        if (isTransfer) {
          await fishTransfer({
            fishId: editFishForm._id,
            toTankId: targetTank._id,
            quantity: deadCount > 0 ? editFishForm.baseQuantity - deadCount : undefined
          })
          msg = `已转移至${targetTank.name}`
        }

        // 处理死亡记录
        if (deadCount > 0 && !isTransfer) {
          await fishMarkDead({
            fishId: editFishForm._id,
            quantity: deadCount
          })
          msg = '更新成功'
        }

        wx.showToast({ title: msg || '操作成功', icon: 'success' })
        this.onCloseFishEditPopup()
        this.loadFishList()
        getApp().markDirty(['fish', 'tankStats'])
      } catch (err) {
        logger.error(err)
        wx.showToast({ title: '操作失败', icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    },

    // 删除鱼类
    async onDeleteFish() {
      const { editFishForm } = this.data

      const res = await wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        confirmColor: '#000000',
        cancelColor: '#999999'
      })

      if (res.confirm) {
        try {
          await fishDelete(editFishForm._id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.onCloseFishEditPopup()
          this.loadFishList()
          getApp().markDirty(['fish', 'tankStats'])
        } catch (err) {
          logger.error('deleteFish error:', err)
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  }
})
