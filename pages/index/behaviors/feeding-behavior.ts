/**
 * 喂养记录 Behavior
 * 负责喂养记录的加载、添加等功能
 */
import { feedingRecordList, feedingRecordCreate } from '../../../utils/api'
import { FeedingForm } from '../../../utils/types'
import { getTodayString, getCurrentTimeString, safeDate } from '../helpers/formatters'
import { getApp } from '../../../app'
import { FOOD_TYPE_OPTIONS } from '../helpers/constants'
import { logger } from '../../../utils/logger'
import { uploadImage } from '../../../utils/upload'

interface FeedingBehaviorData {
  feedingDate: string
  feedingList: FeedingRecord[]
  feedingPage: number
  hasMoreFeeding: boolean
  feedingLoading: boolean
  showFeedingPopup: boolean
  feedingForm: FeedingForm
  foodTypeOptions: typeof FOOD_TYPE_OPTIONS
  isToday: boolean
}

export const feedingBehavior = Behavior({
  data: {
    feedingDate: getTodayString(),
    feedingList: [] as FeedingRecord[],
    feedingPage: 1,
    hasMoreFeeding: true,
    feedingLoading: false,
    showFeedingPopup: false,
    feedingForm: {
      time: '00:00',
      foodType: 'pellet',
      foodName: '',
      customFood: '',
      imageUrl: ''
    } as FeedingForm,
    foodTypeOptions: FOOD_TYPE_OPTIONS,
    isToday: true
  } as FeedingBehaviorData,

  methods: {
    // 喂养日期变更
    onFeedingDateChange(e: WechatMiniprogram.PickerChange) {
      const date = e.detail.value as string
      const today = getTodayString()

      // 禁止选择未来日期
      if (date > today) {
        wx.showToast({ title: '不能选择未来日期', icon: 'none' })
        return
      }

      this.setData({
        feedingDate: date,
        feedingList: [],
        feedingPage: 1,
        hasMoreFeeding: true,
        isToday: date === today
      }, () => {
        this.loadFeedingRecords()
      })
    },

    // 加载喂养记录
    async loadFeedingRecords() {
      if (!this.data.hasMoreFeeding) return

      // 第一页显示加载状态
      if (this.data.feedingPage === 1) {
        this.setData({ feedingLoading: true })
      }

      try {
        const { feedingDate, feedingPage, foodTypeOptions } = this.data

        // 计算当天的起止时间
        const startDate = `${feedingDate} 00:00:00`
        const endDate = `${feedingDate} 23:59:59`

        const res = await feedingRecordList({
          page: feedingPage,
          pageSize: 10,
          startDate,
          endDate
        })

        const list = res.list.map(item => {
          // 解析喂食时间（feedTime 是时间戳或日期字符串）
          const feedDate = safeDate(item.feedTime)
          const y = feedDate.getFullYear()
          const m = String(feedDate.getMonth() + 1).padStart(2, '0')
          const d = String(feedDate.getDate()).padStart(2, '0')
          const hour = feedDate.getHours().toString().padStart(2, '0')
          const minute = feedDate.getMinutes().toString().padStart(2, '0')

          // 查找食物类型名称
          const typeOption = foodTypeOptions.find((opt) => opt.key === item.foodType)
          const foodTypeName = typeOption ? typeOption.label : '未知'

          return Object.assign({}, item, {
            date: `${y}-${m}-${d}`,  // 与换水/水质保持一致
            time: `${hour}:${minute}`,
            sortTime: feedDate.getTime(),  // 用于排序
            foodTypeName: foodTypeName
          }) as FeedingRecord
        })

        // 前端强制按时间倒序排序
        list.sort((a, b) => {
          const timeA = a.feedTime ? safeDate(a.feedTime).getTime() : 0
          const timeB = b.feedTime ? safeDate(b.feedTime).getTime() : 0
          return timeB - timeA
        })

        this.setData({
          feedingList: feedingPage === 1 ? list : this.data.feedingList.concat(list),
          hasMoreFeeding: list.length === 10,
          feedingLoading: false,
          feedingPage: feedingPage + 1
        })

      } catch (err) {
        logger.error('loadFeedingRecords error:', err)
        this.setData({ feedingLoading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    },

    // 滚动加载更多
    onFeedingScrollToLower() {
      if (this.data.hasMoreFeeding && !this.data.feedingLoading) {
        this.loadFeedingRecords()
      }
    },

    // 打开添加喂养记录弹窗
    onAddFeeding() {
      // 隐藏 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: true })
        })
      }
      this.setData({
        showFeedingPopup: true,
        feedingForm: {
          time: getCurrentTimeString(),
          foodType: 'pellet',
          customFood: '',
          foodName: '',
          imageUrl: ''
        }
      })
    },

    // 关闭喂养记录弹窗
    onCloseFeedingPopup() {
      this.setData({ showFeedingPopup: false })
      // 恢复显示 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: false })
        })
      }
    },

    // 喂养时间变更
    onFeedingTimeChange(e: WechatMiniprogram.PickerChange) {
      this.setData({
        'feedingForm.time': e.detail.value
      })
    },

    // 选择食物类型
    onSelectFoodType(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type
      this.setData({
        'feedingForm.foodType': type
      })
    },

    // 食物名称输入
    onFoodNameInput(e: WechatMiniprogram.Input) {
      this.setData({
        'feedingForm.foodName': e.detail.value
      })
    },

    // 自定义食物输入
    onCustomFoodInput(e: WechatMiniprogram.Input) {
      this.setData({
        'feedingForm.customFood': e.detail.value
      })
    },

    // 选择喂养图片
    async onChooseFeedingImage() {
      // 设置标记，防止 onHide 关闭弹窗
      (this as any)._isChoosingImage = true
      try {
        const res = await wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera']
        })
        this.setData({
          'feedingForm.imageUrl': res.tempFiles[0].tempFilePath
        })
      } catch {
        // 用户取消选择
      } finally {
        (this as any)._isChoosingImage = false
      }
    },

    // 保存喂养记录
    async onSaveFeeding() {
      const { feedingForm, feedingDate, currentTank } = this.data

      // 校验
      if (feedingForm.foodType === 'other' && !feedingForm.customFood.trim()) {
        wx.showToast({ title: '请输入食物名称', icon: 'none' })
        return
      }

      this.setData({ saving: true })

      try {
        const dateTimeStr = `${feedingDate} ${feedingForm.time}:00`

        // 构造 foodName
        const foodName = feedingForm.foodType === 'other' ? feedingForm.customFood : feedingForm.foodName

        // 上传图片
        let fileID = ''
        if (feedingForm.imageUrl) {
          fileID = await uploadImage(feedingForm.imageUrl, 'feeding', currentTank._id)
        }

        if (!currentTank) throw new Error('未选择鱼缸')

        await feedingRecordCreate({
          tankId: currentTank._id,
          feedTime: safeDate(dateTimeStr).getTime(),
          foodType: feedingForm.foodType,
          foodName: foodName,
          amount: '适量',
          imageUrl: fileID
        })

        wx.showToast({ title: '记录成功', icon: 'success' })
        this.onCloseFeedingPopup()
        // 由 index.ts 的 onSaveRecord/loadCombinedRecordsSilent 统一加载数据
        // 注意：不再调用 loadFeedingRecords()，避免与 loadCombinedRecordsSilent 竞争
        getApp().markDirty('feeding')

      } catch (err) {
        logger.error('saveFeedingRecord error:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    },

    // 订阅喂养提醒
    onSubscribeFeeding() {
      (this as any).requestSubscribe('tmpl_feeding_123')
    }
  }
})
