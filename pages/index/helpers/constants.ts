/**
 * 首页常量定义
 */

// 鱼缸尺寸选项
export const TANK_SIZE_OPTIONS = [
  { key: 'small', label: '一尺缸 (30cm)', desc: '30×30×30cm，约24L', size: { length: 30, width: 30, height: 30 } },
  { key: 'medium', label: '二尺缸 (60cm)', desc: '60×30×36cm，约58L', size: { length: 60, width: 30, height: 36 } },
  { key: 'large', label: '三尺缸 (90cm)', desc: '90×45×60cm，约215L', size: { length: 90, width: 45, height: 60 } },
  { key: 'xlarge', label: '四尺缸 (120cm)', desc: '120×45×60cm，约290L', size: { length: 120, width: 45, height: 60 } }
]

// 食物类型选项
export const FOOD_TYPE_OPTIONS = [
  { key: 'live', label: '红虫/活食' },
  { key: 'frozen', label: '丰年虾/冷冻' },
  { key: 'pellet', label: '饲料' },
  { key: 'other', label: '其他' }
]

// Tab 配置（水质已合并到"记录"中）
export const TABS = [
  { key: 'records', name: '记录' },
  { key: 'fish', name: '鱼类' },
  { key: 'equipment', name: '设备' }
]

// 设备类型
export const EQUIPMENT_TYPES = [
  { key: 'heater', label: '加热棒' },
  { key: 'pump', label: '氧气泵/水泵' },
  { key: 'light', label: '灯具' },
  { key: 'filter', label: '过滤设备' },
  { key: 'material', label: '滤材' },
  { key: 'uv', label: '杀菌灯' },
  { key: 'other', label: '其他' }
]

// 过滤类型
export const FILTER_TYPES = [
  { key: 'sump', label: '底滤' },
  { key: 'hang_on', label: '背挂' },
  { key: 'canister', label: '过滤筒' },
  { key: 'trickle', label: '周转箱/滴流' }
]

// 类型定义
export interface TankSizeOption {
  key: string
  label: string
  desc: string
  size: { length: number; width: number; height: number }
}

export interface FoodTypeOption {
  key: string
  label: string
}

export interface TabItem {
  key: string
  name: string
}
