/**
 * Fish Diary 首页
 * 使用 Behaviors 模块化管理各个功能区
 */
import { getApp } from '../../app'

// 引入各功能模块 Behaviors
import { tankBehavior } from './behaviors/tank-behavior'
import { feedingBehavior } from './behaviors/feeding-behavior'
import { fishBehavior } from './behaviors/fish-behavior'
import { equipmentBehavior } from './behaviors/equipment-behavior'
import { waterChangeBehavior } from './behaviors/water-change-behavior'
import { waterQualityBehavior } from './behaviors/water-quality-behavior'
import { getTodayString } from './helpers/formatters'

// 从 constants 导入 TABS
import { TABS } from './helpers/constants'
import { logger } from '../../utils/logger'

// Tab 配置映射
interface TabConfig {
  listKey: string
  dirtyKey: DirtyFlagKey
  resetData?: Record<string, unknown>
}

const TAB_CONFIG: Record<string, TabConfig> = {
  records: {
    listKey: 'recordList',
    dirtyKey: 'feeding', // 记录 Tab 包含喂养、换水、水质
    resetData: { recordList: [] }
  },
  fish: {
    listKey: 'fishList',
    dirtyKey: 'fish'
  },
  equipment: {
    listKey: 'equipmentList',
    dirtyKey: 'equipment'
  }
}

// Tab 加载方法映射
const TAB_LOADERS: Record<string, string> = {
  records: 'loadCombinedRecords',
  fish: 'loadFishList',
  equipment: 'loadEquipment'
}

interface IndexData {
  activeTab: string
  tabs: typeof TABS
  saving: boolean
  loading: boolean
  recordList: any[]
  showRecordPopup: boolean
  recordType: 'feeding' | 'water-change' | 'water-quality'
  // 记录列表日期筛选
  today: string
  recordFilterDate: string

  // From Behaviors
  feedingDate: string
  feedingList: any[]
  waterChangeList: any[]
  fishList: any[]
  equipmentList: any[]
  waterQualityList: any[]
  tanks: any[]
  currentTank: any
  feedingForm: any
  waterChangeForm: any
  waterQualityForm: any
  currentTankIndex: number
}

Page({
  behaviors: [
    tankBehavior,
    feedingBehavior,
    fishBehavior,
    equipmentBehavior,
    waterChangeBehavior,
    waterQualityBehavior
  ],

  data: {
    activeTab: 'records',
    tabs: TABS,
    saving: false,
    loading: false,
    recordList: [],
    showRecordPopup: false,
    recordType: 'feeding',
    today: '',
    recordFilterDate: '',

    // Initial values
    feedingDate: '',
    feedingList: [],
    waterChangeList: [],
    fishList: [],
    equipmentList: [],
    waterQualityList: [],
    tanks: [],
    currentTank: null,
    feedingForm: {},
    waterChangeForm: {},
    waterQualityForm: {},
    currentTankIndex: 0,
    tankStatsLastLoad: 0
  } as IndexData,

  // ... (previous methods)

  // 阻止事件冒泡（弹窗内部点击不关闭弹窗）
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡
  },

  // 控制 TabBar 显示/隐藏（用于弹窗覆盖，Skyline 模式下异步）
  hideTabBar() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar((tabBar: any) => {
        tabBar.setData({ hidden: true })
      })
    }
  },

  showTabBar() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar((tabBar: any) => {
        tabBar.setData({ hidden: false })
      })
    }
  },

  // 记录相关方法
  onAddRecord() {
    this.hideTabBar() // 隐藏 TabBar
    const now = new Date().toTimeString().substring(0, 5)

    this.setData({
      showRecordPopup: true,
      recordType: 'feeding',
      // Reset feeding form defaults
      feedingForm: {
        time: now,
        foodType: 'live',
        foodTypeLabel: '红虫/活食',
        amount: '',
        foodName: ''
      },
      // Reset water change form defaults
      waterChangeForm: {
        time: now,
        percent: 20
      },
      // Reset water quality form defaults
      waterQualityForm: {
        time: now,
        ph: '',
        temperature: '',
        ammonia: '',
        nitrite: '',
        nitrate: '',
        imageUrl: ''
      }
    })
  },

  onRecordTypeChange(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type as 'feeding' | 'water-change' | 'water-quality'
    this.setData({ recordType: type })
  },

  onCloseRecordPopup() {
    this.setData({ showRecordPopup: false })
    this.showTabBar() // 恢复显示 TabBar
  },

  async onSaveRecord() {
    const { recordType } = this.data

    try {
      if (recordType === 'feeding') {
        await (this as any).onSaveFeeding()
      } else if (recordType === 'water-change') {
        await (this as any).onSaveWaterChange()
      } else if (recordType === 'water-quality') {
        await (this as any).onSaveWaterQuality()
      }

      // 先关闭弹窗，提供即时反馈
      this.onCloseRecordPopup()

      // 静默刷新列表（不显示 loading）
      this.loadCombinedRecordsSilent()
    } catch (err) {
      // 错误处理已在各 behavior 中完成
      logger.error('onSaveRecord error:', err)
    }
  },



  // 换水时间选择
  onWaterChangeTimeChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ 'waterChangeForm.time': e.detail.value })
  },

  // 换水比例实时变化（拖动中）
  onWaterChangePercentChanging(e: WechatMiniprogram.SliderChanging) {
    this.setData({ 'waterChangeForm.percent': e.detail.value })
  },

  // 水质时间选择
  onWaterQualityTimeChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ 'waterQualityForm.time': e.detail.value })
  },

  // 喂养时间选择（统一记录弹窗用）
  onFeedingTimeSelect(e: WechatMiniprogram.PickerChange) {
    this.setData({ 'feedingForm.time': e.detail.value })
  },

  // 食物类型选择（统一记录弹窗用）
  onFoodTypeChange(e: WechatMiniprogram.PickerChange) {
    const index = e.detail.value as unknown as number
    const options = (this.data as any).foodTypeOptions
    if (options && options[index]) {
      this.setData({
        'feedingForm.foodType': options[index].key,
        'feedingForm.foodTypeLabel': options[index].label
      })
    }
  },

  // 喂养表单输入（统一记录弹窗用）
  onFeedingInput(e: WechatMiniprogram.Input) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`feedingForm.${field}`]: e.detail.value
    })
  },

  onLoad() {
    // 初始化日期
    const today = new Date().toISOString().split('T')[0]
    this.setData({
      feedingDate: today,
      today: today,
      recordFilterDate: today // 默认显示今日记录
    });
    (this as any).loadTanks()
  },

  onHide() {
    // 选择图片时不关闭弹窗（wx.chooseMedia 会触发 onHide）
    if ((this as any)._isChoosingImage) return

    // 页面隐藏时关闭所有弹窗，避免 page-container "Only one instance" 错误
    if (this.data.showAddTankPopup) {
      this.setData({ showAddTankPopup: false })
    }
  },

  onUnload() {
    // 页面卸载时的清理工作
    // 重置加载状态，避免内存中残留的状态影响下次加载
    this.setData({
      loading: false,
      saving: false,
      feedingLoading: false,
      equipmentLoading: false,
      waterChangeLoading: false,
      waterQualityLoading: false
    })
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
        tabBar.setData({ selected: 0 })
      })
    }

    const app = getApp()
    const now = Date.now()
    const STATS_CACHE_TIME = 30000 // 30秒内不重复加载统计数据

    // 刷新统计数据（带节流：30秒内不重复加载，除非数据变更）
    if (this.data.tanks.length > 0 && this.data.currentTankIndex < this.data.tanks.length) {
      const shouldReload = now - this.data.tankStatsLastLoad > STATS_CACHE_TIME
      if (shouldReload || app.isDirty('tankStats')) {
        (this as any).loadTankStats(this.data.tanks[this.data.currentTankIndex]._id)
          .then(() => this.setData({ tankStatsLastLoad: Date.now() }))
          .catch((err: Error) => {
            logger.error('加载统计数据失败:', err)
          })
        app.clearDirty('tankStats')
      }
    }

    // 检查鱼缸列表脏标记
    if (app.isDirty('tanks')) {
      (this as any).loadTanks()
      app.clearDirty('tanks')
    }

    // 根据当前 Tab 刷新对应的脏数据
    const { activeTab } = this.data
    const config = TAB_CONFIG[activeTab]
    if (config && app.isDirty(config.dirtyKey)) {
      if (config.resetData) {
        this.setData(config.resetData)
      }
      const loaderName = TAB_LOADERS[activeTab]
      if (loaderName && typeof (this as any)[loaderName] === 'function') {
        (this as any)[loaderName]()
      }
      app.clearDirty(config.dirtyKey)
    }
  },

  onPullDownRefresh() {
    (this as any).loadTanks()
      .then(() => {
        wx.stopPullDownRefresh()
      })
      .catch(() => {
        wx.stopPullDownRefresh()
      })
  },

  // Tab 切换
  onTabChange(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string
    this.setData({ activeTab: key })
    const app = getApp()

    // 首次加载或脏数据刷新
    const config = TAB_CONFIG[key]
    if (!config) return

    const list = (this.data as any)[config.listKey]
    if (list.length === 0 || app.isDirty(config.dirtyKey)) {
      if (config.resetData) {
        this.setData(config.resetData)
      }
      const loaderName = TAB_LOADERS[key]
      if (loaderName && typeof (this as any)[loaderName] === 'function') {
        (this as any)[loaderName]()
      }
      app.clearDirty(config.dirtyKey)
    }
  },

  // 通用订阅消息方法
  requestSubscribe(tmplId: string) {
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success(res) {
        if (res[tmplId] === 'accept') {
          wx.showToast({ title: '订阅成功', icon: 'success' })
        } else {
          wx.showToast({ title: '已取消', icon: 'none' })
        }
      },
      fail(err) {
        logger.error(err)
        wx.showToast({ title: '订阅失败', icon: 'none' })
      }
    })
  },

  // 合并并排序记录列表
  buildCombinedRecords(): any[] {
    const { feedingList, waterChangeList, waterQualityList, recordFilterDate } = this.data as any

    const records = [
      ...feedingList.map((item: any) => {
        const feedDate = item.feedTime ? new Date(item.feedTime) : new Date()
        return {
          ...item,
          type: 'feeding',
          date: feedDate.toISOString().split('T')[0],
          sortTime: item.feedTime || Date.now()
        }
      }),
      ...waterChangeList.map((item: any) => ({
        ...item,
        type: 'water-change',
        sortTime: item.sortTime || new Date(item.date).getTime()
      })),
      ...waterQualityList.map((item: any) => ({
        ...item,
        type: 'water-quality',
        date: item.date,
        sortTime: item.sortTime || new Date(`${item.date} ${item.time || '00:00'}`).getTime()
      }))
    ]

    records.sort((a, b) => b.sortTime - a.sortTime)

    return recordFilterDate
      ? records.filter((item: any) => item.date === recordFilterDate)
      : records
  },

  // 加载合并记录（喂养 + 换水 + 水质）
  async loadCombinedRecords() {
    this.setData({ loading: true })
    try {
      await Promise.all([
        (this as any).loadFeedingRecords(),
        (this as any).loadWaterChangeRecords(),
        (this as any).loadWaterQuality()
      ])
      this.setData({ recordList: this.buildCombinedRecords(), loading: false })
    } catch (err) {
      logger.error('合并记录加载失败', err)
      this.setData({ loading: false })
    }
  },

  // 记录日期筛选变更
  onRecordFilterDateChange(e: WechatMiniprogram.PickerChange) {
    const date = e.detail.value as string
    this.setData({
      recordFilterDate: date,
      feedingDate: date,
      recordList: [],
      feedingList: [],
      feedingPage: 1,
      hasMoreFeeding: true
    }, () => {
      this.loadCombinedRecords()
    })
  },

  // 清除日期筛选 (返回今日)
  onClearRecordFilter() {
    this.onRecordFilterDateChange({
      detail: { value: getTodayString() }
    } as WechatMiniprogram.PickerChange)
  },

  // 静默刷新记录列表（保存后无感更新）
  async loadCombinedRecordsSilent() {
    try {
      // 重置分页状态，确保从第一页重新加载
      this.setData({
        feedingPage: 1,
        hasMoreFeeding: true,
        waterChangePage: 1,
        hasMoreWaterChange: true
      })
      await Promise.all([
        (this as any).loadFeedingRecords(),
        (this as any).loadWaterChangeRecords(),
        (this as any).loadWaterQuality()
      ])
      this.setData({ recordList: this.buildCombinedRecords() })
    } catch (err) {
      logger.error('静默刷新记录失败', err)
    }
  },

  onReachBottom() {
    const { activeTab } = this.data
    if (activeTab === 'records') {
      this.loadCombinedRecords()
    }
  },

  // 跳转 Wiki 页面
  onOpenWiki() {
    wx.navigateTo({
      url: '/pages/wiki/wiki'
    })
  }
})
