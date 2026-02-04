/**
 * 水质记录 Behavior
 * 负责水质记录的加载、添加、图表绘制等功能
 */
import { waterQualityRecordList, waterQualityRecordCreate } from '../../../utils/api'
import { WaterQualityForm } from '../../../utils/types'
import { getTodayString, formatTimestamp } from '../helpers/formatters'
import { getApp } from '../../../app'
import { logger } from '../../../utils/logger'
import { uploadImage } from '../../../utils/upload'

interface WaterQualityBehaviorData {
  waterQualityList: WaterQualityRecord[]
  showWaterQualityPopup: boolean
  waterQualityForm: WaterQualityForm
  waterQualityLoading: boolean
  chartType: 'ph' | 'temp' | 'no2'
}

export const waterQualityBehavior = Behavior({
  data: {
    waterQualityList: [] as WaterQualityRecord[],
    showWaterQualityPopup: false,
    waterQualityForm: {
      time: new Date().toTimeString().substring(0, 5),
      ph: '',
      temperature: '',
      ammonia: '',
      nitrite: '',
      nitrate: '',
      imageUrl: ''
    } as WaterQualityForm,
    waterQualityLoading: false,
    chartType: 'ph' as 'ph' | 'temp' | 'no2'
  } as WaterQualityBehaviorData,

  methods: {
    // 加载水质记录
    async loadWaterQuality() {
      this.setData({ waterQualityLoading: true })

      try {
        if (!this.data.currentTank) return

        const res = await waterQualityRecordList({
          tankId: this.data.currentTank._id
        })

        const list = res.list.map(item => ({
          _id: item._id,
          date: formatTimestamp(item.recordTime),
          time: new Date(item.recordTime).toTimeString().slice(0, 5),
          sortTime: new Date(item.recordTime).getTime(),
          ph: item.ph,
          temperature: item.temperature,
          ammonia: item.ammonia,
          nitrite: item.nitrite,
          nitrate: item.nitrate,
          imageUrl: item.images && item.images.length > 0 ? item.images[0] : ''
        })) as WaterQualityRecord[]

        this.setData({
          waterQualityList: list,
          waterQualityLoading: false
        }, () => {
          this.drawChart()
        })

      } catch (err) {
        logger.error('loadWaterQuality error:', err)
        this.setData({ waterQualityLoading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    },

    // 打开添加水质记录弹窗
    onAddWaterQuality() {
      // 隐藏 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: true })
        })
      }
      this.setData({
        showWaterQualityPopup: true,
        waterQualityForm: {
          time: new Date().toTimeString().substring(0, 5),
          ph: '',
          temperature: '',
          ammonia: '',
          nitrite: '',
          nitrate: '',
          imageUrl: ''
        }
      })
    },

    // 关闭水质记录弹窗
    onCloseWaterQualityPopup() {
      this.setData({ showWaterQualityPopup: false })
      // 恢复显示 TabBar（Skyline 模式下异步）
      if (typeof this.getTabBar === 'function') {
        this.getTabBar((tabBar: any) => {
          tabBar.setData({ hidden: false })
        })
      }
    },

    // 水质日期变更
    onWaterQualityDateChange(e: WechatMiniprogram.PickerChange) {
      this.setData({
        'waterQualityForm.date': e.detail.value
      })
    },

    // 水质表单输入
    onWaterQualityInput(e: WechatMiniprogram.Input) {
      const field = e.currentTarget.dataset.field
      this.setData({
        [`waterQualityForm.${field}`]: e.detail.value
      })
    },

    // 选择水质图片
    async onChooseQualityImage() {
      // 设置标记，防止 onHide 关闭弹窗
      (this as any)._isChoosingImage = true
      try {
        const res = await wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera']
        })
        this.setData({
          'waterQualityForm.imageUrl': res.tempFiles[0].tempFilePath
        })
      } catch {
        // 用户取消选择
      } finally {
        (this as any)._isChoosingImage = false
      }
    },

    // 保存水质记录
    async onSaveWaterQuality() {
      const { waterQualityForm, currentTank } = this.data
      this.setData({ saving: true })

      try {
        // 上传图片
        let fileID = ''
        if (waterQualityForm.imageUrl) {
          fileID = await uploadImage(waterQualityForm.imageUrl, 'quality', currentTank._id)
        }

        if (!currentTank) throw new Error('未选择鱼缸')

        // 使用今天日期 + 选择的时间（API 期望字符串格式）
        const today = getTodayString()
        const recordDate = `${today} ${waterQualityForm.time}:00`

        await waterQualityRecordCreate({
          tankId: currentTank._id,
          recordDate: recordDate,
          ph: parseFloat(waterQualityForm.ph) || undefined,
          temperature: parseFloat(waterQualityForm.temperature) || undefined,
          ammonia: parseFloat(waterQualityForm.ammonia) || undefined,
          nitrite: parseFloat(waterQualityForm.nitrite) || undefined,
          nitrate: parseFloat(waterQualityForm.nitrate) || undefined,
          imageUrl: fileID || undefined
        })

        wx.showToast({ title: '记录成功', icon: 'success' })
        this.onCloseWaterQualityPopup()
        // 重新加载水质记录（水质没有分页，无需重置）
        this.loadWaterQuality()
        getApp().markDirty('waterQuality')

      } catch (err) {
        logger.error('saveWaterQuality error:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    },

    // ========== 图表相关 ==========

    // 切换图表类型
    onChartTypeChange(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type as 'ph' | 'temp' | 'no2'
      this.setData({ chartType: type })
      this.drawChart()
    },

    // 绘制图表
    drawChart() {
      const { waterQualityList, chartType } = this.data
      // 取最近 7 条数据，按时间正序（旧 -> 新）
      const data = [...waterQualityList].reverse().slice(-7)

      if (data.length < 2) return // 数据太少不画

      const query = wx.createSelectorQuery()
      query.select('#trendChart')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)

          const width = res[0].width
          const height = res[0].height

          // 清空
          ctx.clearRect(0, 0, width, height)

          // 数据准备
          const values = data.map(d => {
            if (chartType === 'ph') return d.ph || 0
            if (chartType === 'temp') return d.temperature || 0
            return 0
          })

          const min = Math.min(...values)
          const max = Math.max(...values)
          const range = (max - min) === 0 ? 1 : (max - min)
          const padding = 20
          const chartH = height - padding * 2
          const xStep = (width - padding * 2) / (values.length - 1)

          // 绘制折线
          ctx.beginPath()
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          values.forEach((val, i) => {
            const x = padding + i * xStep
            const normalized = (val - min) / range
            const y = height - padding - (normalized * chartH)

            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          })
          ctx.stroke()

          // 绘制数据点和文字
          values.forEach((val, i) => {
            const x = padding + i * xStep
            const normalized = (val - min) / range
            const y = height - padding - (normalized * chartH)

            // 点
            ctx.beginPath()
            ctx.fillStyle = '#ffffff'
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 2
            ctx.arc(x, y, 3, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            // 文字
            ctx.fillStyle = '#6b7280'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(val.toString(), x, y - 8)

            // 日期
            ctx.fillText(data[i].date.slice(5), x, height - 5)
          })
        })
    }
  }
})
