/**
 * 设备管理 Behavior
 * 负责设备列表、添加等功能
 */
import { equipmentList, equipmentCreate } from '../../../utils/api'
import { EquipmentForm } from '../../../utils/types'
import { getTodayString } from '../helpers/formatters'
import { getApp } from '../../../app'
import { logger } from '../../../utils/logger'

// 设备类型
const EQUIPMENT_TYPES = [
  { key: 'heater', label: '加热棒' },
  { key: 'pump', label: '氧气泵/水泵' },
  { key: 'light', label: '灯具' },
  { key: 'filter', label: '过滤设备' },
  { key: 'material', label: '滤材' },
  { key: 'uv', label: '杀菌灯' },
  { key: 'other', label: '其他' }
]

interface EquipmentBehaviorData {
  equipmentList: Equipment[]
  showEquipmentPopup: boolean
  equipmentForm: EquipmentForm & { typeLabel: string }
  equipmentTypes: typeof EQUIPMENT_TYPES
  equipmentLoading: boolean
}

export const equipmentBehavior = Behavior({
  data: {
    equipmentList: [] as Equipment[],
    showEquipmentPopup: false,
    equipmentForm: {
      type: 'heater',
      typeLabel: '加热棒',
      name: '',
      brand: '',
      model: '',
      price: '',
      purchaseDate: getTodayString()
    } as EquipmentForm & { typeLabel: string },
    equipmentTypes: EQUIPMENT_TYPES,
    equipmentLoading: false
  } as EquipmentBehaviorData,

  methods: {
    // 加载设备列表
    async loadEquipment() {
      this.setData({ equipmentLoading: true })

      try {
        if (!this.data.currentTank) return

        const res = await equipmentList({
          tankId: this.data.currentTank._id
        })

        // 映射类型名称
        const list = res.list.map(item => {
          const typeObj = this.data.equipmentTypes.find(t => t.key === item.type)
          return Object.assign({}, item, {
            typeName: typeObj ? typeObj.label : '未知设备'
          })
        }) as Equipment[]

        this.setData({
          equipmentList: list,
          equipmentLoading: false
        })

      } catch (err) {
        logger.error('loadEquipment error:', err)
        this.setData({ equipmentLoading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    },

    // 打开添加设备弹窗
    onAddEquipment() {
      // 隐藏 TabBar
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ hidden: true })
      }
      this.setData({
        showEquipmentPopup: true,
        equipmentForm: {
          type: 'heater',
          typeLabel: '加热棒',
          name: '',
          brand: '',
          model: '',
          price: '',
          purchaseDate: getTodayString()
        }
      })
    },

    // 关闭设备弹窗
    onCloseEquipmentPopup() {
      this.setData({ showEquipmentPopup: false })
      // 恢复显示 TabBar
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ hidden: false })
      }
    },

    // 设备类型变更
    onEquipmentTypeChange(e: WechatMiniprogram.PickerChange) {
      const idx = parseInt(e.detail.value as string)
      const type = this.data.equipmentTypes[idx]
      this.setData({
        'equipmentForm.type': type.key,
        'equipmentForm.typeLabel': type.label
      })
    },

    // 设备表单输入
    onEquipmentInput(e: WechatMiniprogram.Input) {
      const field = e.currentTarget.dataset.field
      this.setData({
        [`equipmentForm.${field}`]: e.detail.value
      })
    },

    // 保存设备
    async onSaveEquipment() {
      const { equipmentForm, currentTank } = this.data

      if (!equipmentForm.name.trim()) {
        wx.showToast({ title: '请输入设备名称', icon: 'none' })
        return
      }

      this.setData({ saving: true })

      try {
        if (!currentTank) throw new Error('未选择鱼缸')

        await equipmentCreate({
          tankId: currentTank._id,
          type: equipmentForm.type,
          name: equipmentForm.name,
          brand: equipmentForm.brand,
          model: equipmentForm.model,
          price: parseFloat(equipmentForm.price) || 0,
          purchaseDate: new Date(equipmentForm.purchaseDate).getTime(),
          status: 'active'
        })

        wx.showToast({ title: '保存成功', icon: 'success' })
        this.onCloseEquipmentPopup()
        this.loadEquipment()
        getApp().markDirty(['equipment', 'tankStats'])

      } catch (err) {
        logger.error('saveEquipment error:', err)
        wx.showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    }
  }
})
