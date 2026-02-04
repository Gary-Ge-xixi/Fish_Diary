/**
 * 换水记录 Behavior
 * 负责换水记录的加载、添加等功能
 */
import { waterChangeRecordList, waterChangeRecordCreate } from '../../../utils/api'
import { WaterChangeForm } from '../../../utils/types'
import { getTodayString, extractDateTimeFromServer } from '../helpers/formatters'
import { getApp } from '../../../app'
import { logger } from '../../../utils/logger'

interface WaterChangeBehaviorData {
  waterChangeList: WaterChangeRecord[]
  showWaterChangePopup: boolean
  waterChangeForm: WaterChangeForm
  waterChangeLoading: boolean
  waterChangePage: number
  hasMoreWaterChange: boolean
}

export const waterChangeBehavior = Behavior({
  data: {
    waterChangeList: [] as WaterChangeRecord[],
    showWaterChangePopup: false,
    waterChangeForm: {
      time: new Date().toTimeString().substring(0, 5),
      percent: 20
    } as WaterChangeForm,
    waterChangeLoading: false,
    waterChangePage: 1,
    hasMoreWaterChange: true
  } as WaterChangeBehaviorData,

  methods: {
    // 加载换水记录
    async loadWaterChangeRecords() {
      if (!this.data.hasMoreWaterChange) return

      this.setData({ waterChangeLoading: true })

      try {
        // 判空时重置 loading 状态
        if (!this.data.currentTank) {
          this.setData({ waterChangeLoading: false })
          return
        }

        const { waterChangePage } = this.data

        const res = await waterChangeRecordList({
          tankId: this.data.currentTank._id,
          page: waterChangePage,
          pageSize: 20
        })

        const list = res.list.map(item => {
          const dateTime = item.changeDate || item.createdAt
          const { dateStr, timeStr, sortTime } = extractDateTimeFromServer(dateTime)
          return {
            _id: item._id,
            percent: item.percentage,
            date: dateStr,
            time: timeStr,
            sortTime
          }
        }) as any as WaterChangeRecord[]

        this.setData({
          waterChangeList: waterChangePage === 1 ? list : this.data.waterChangeList.concat(list),
          waterChangeLoading: false,
          hasMoreWaterChange: list.length === 20,
          waterChangePage: waterChangePage + 1
        })

      } catch (err) {
        logger.error('loadWaterChangeRecords error:', err)
        this.setData({ waterChangeLoading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    },

    // 打开添加换水记录弹窗
    onAddWaterChange() {
      // 隐藏 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: true })
        })
      }
      this.setData({
        showWaterChangePopup: true,
        waterChangeForm: {
          time: new Date().toTimeString().substring(0, 5),
          percent: 20
        }
      })
    },

    // 关闭换水记录弹窗
    onCloseWaterChangePopup() {
      this.setData({ showWaterChangePopup: false })
      // 恢复显示 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: false })
        })
      }
    },

    // 换水日期变更
    onWaterChangeDateChange(e: WechatMiniprogram.PickerChange) {
      this.setData({
        'waterChangeForm.date': e.detail.value
      })
    },

    // 换水比例变更
    onWaterChangePercentChange(e: WechatMiniprogram.SliderChange) {
      this.setData({
        'waterChangeForm.percent': e.detail.value
      })
    },

    // 保存换水记录
    async onSaveWaterChange() {
      const { waterChangeForm, currentTank } = this.data
      this.setData({ saving: true })

      try {
        if (!currentTank) throw new Error('未选择鱼缸')

        // 使用今天日期 + 选择的时间（发送字符串给服务器）
        const today = getTodayString()
        const changeDate = `${today} ${waterChangeForm.time}:00`

        await waterChangeRecordCreate({
          tankId: currentTank._id,
          percentage: waterChangeForm.percent,
          changeDate: changeDate
        })

        wx.showToast({ title: '记录成功', icon: 'success' })
        getApp().markDirty('waterChange')

      } catch (err) {
        logger.error('saveWaterChange error:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
        throw err
      } finally {
        this.setData({ saving: false })
      }
    },

    // 订阅换水提醒
    onSubscribeWaterChange() {
      (this as any).requestSubscribe('tmpl_water_456')
    }
  }
})
