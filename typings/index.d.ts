/// <reference path="../node_modules/miniprogram-api-typings/index.d.ts" />

// 平台信息类型
type Platform = 'ios' | 'android' | 'windows' | 'mac' | 'devtools' | 'harmonyos' | 'unknown'

interface PlatformInfo {
  platform: Platform
  isHarmonyOS: boolean
  isIOS: boolean
  isAndroid: boolean
  isDesktop: boolean
  isDevTools: boolean
  brand: string
  model: string
  system: string
}

// 数据刷新脏标记类型
interface DataDirtyFlags {
  fish: boolean        // 鱼类数据
  feeding: boolean     // 喂食记录
  waterChange: boolean // 换水记录
  equipment: boolean   // 设备
  waterQuality: boolean // 水质
  tankStats: boolean   // 统计数据
  tanks: boolean       // 鱼缸列表
}

type DirtyFlagKey = keyof DataDirtyFlags

// 全局 App 实例类型
interface IAppOption {
  globalData: {
    userInfo: WechatMiniprogram.UserInfo | null
    openid: string | null
    platformInfo: PlatformInfo | null
    dirtyFlags: DataDirtyFlags
  }
  // 脏标记辅助方法
  markDirty: (type: DirtyFlagKey | DirtyFlagKey[]) => void
  clearDirty: (type: DirtyFlagKey) => void
  isDirty: (type: DirtyFlagKey) => boolean
}

// API 响应基础类型
interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

// 分页参数
interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页响应
interface PaginationData<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ==================== 鱼缸相关类型 ====================

interface TankSize {
  length: number
  width: number
  height: number
}

interface Tank {
  _id: string
  userId: string
  name: string
  coverUrl: string
  size: TankSize
  volume: number
  price: number
  setupDate: string  // JSON 序列化后为字符串
  description: string
  status: 'active' | 'archived'
  createdAt: string  // JSON 序列化后为字符串
  updatedAt: string  // JSON 序列化后为字符串
  stats?: {
    fishCount: number
    speciesCount?: number
  }
}

interface TankCreateParams {
  name: string
  size?: TankSize
  price?: number
  setupDate?: string
  description?: string
  coverUrl?: string
}

interface TankUpdateParams {
  tankId: string
  name?: string
  size?: TankSize
  price?: number
  setupDate?: string
  description?: string
  coverUrl?: string
}

interface TankListParams extends PaginationParams {
  status?: 'active' | 'archived'
}

// ==================== 鱼类相关类型 ====================

interface Fish {
  _id: string
  userId: string
  tankId: string
  speciesId: string
  customName: string
  quantity: number
  purchasePrice: number
  purchaseDate: string  // JSON 序列化后为字符串
  status: 'alive' | 'dead' | 'transferred'
  deathDate?: string  // JSON 序列化后为字符串
  deathReason?: string
  createdAt: string  // JSON 序列化后为字符串
  updatedAt: string  // JSON 序列化后为字符串
  // 关联信息（API 返回时包含）
  subcategory?: FishSubcategory
  category?: FishCategory
}

interface FishCreateParams {
  tankId: string
  speciesId: string
  customName?: string
  quantity: number
  purchasePrice?: number
  purchaseDate?: string
}

interface FishUpdateParams {
  fishId: string
  customName?: string
  quantity?: number
  purchasePrice?: number
  purchaseDate?: string
}

interface FishListParams extends PaginationParams {
  tankId?: string
  status?: 'alive' | 'dead' | 'transferred'
}

interface FishTransferParams {
  fishId: string
  toTankId: string
  quantity?: number
}

interface FishMarkDeadParams {
  fishId: string
  deathDate?: string
  deathReason?: string
  quantity?: number
}

// ==================== 设备相关类型 ====================

type EquipmentType = 'filter' | 'heater' | 'light' | 'pump' | 'co2' | 'other'

interface Equipment {
  _id: string
  userId: string
  tankId: string
  type: EquipmentType
  brand: string
  model: string
  price: number
  purchaseDate: string  // JSON 序列化后为字符串
  installDate: string  // JSON 序列化后为字符串
  specs: Record<string, unknown>
  notes: string
  status: 'active' | 'inactive' | 'broken'
  createdAt: string  // JSON 序列化后为字符串
  updatedAt: string  // JSON 序列化后为字符串
}

interface EquipmentCreateParams {
  tankId: string
  type: EquipmentType
  brand?: string
  model?: string
  price?: number
  purchaseDate?: string
  installDate?: string
  specs?: Record<string, unknown>
  notes?: string
}

interface EquipmentUpdateParams {
  equipmentId: string
  type?: EquipmentType
  brand?: string
  model?: string
  price?: number
  purchaseDate?: string
  installDate?: string
  specs?: Record<string, unknown>
  notes?: string
  status?: 'active' | 'inactive' | 'broken'
}

interface EquipmentListParams extends PaginationParams {
  tankId?: string
  type?: EquipmentType
  status?: 'active' | 'inactive' | 'broken'
}

// ==================== 喂食记录类型 ====================

interface FeedingRecord {
  _id: string
  userId: string
  tankId: string
  feedTime: string  // JSON 序列化后为字符串
  foodType: string
  foodName: string
  amount: string
  imageUrl?: string
  notes?: string
  createdAt: string  // JSON 序列化后为字符串
  updatedAt?: string  // JSON 序列化后为字符串
}

interface FeedingRecordCreateParams {
  tankId: string
  feedTime?: string | number
  foodType: string
  foodName?: string
  amount?: string
  imageUrl?: string
  notes?: string
}

interface FeedingRecordUpdateParams {
  recordId: string
  feedTime?: string | number
  foodType?: string
  foodName?: string
  amount?: string
  imageUrl?: string
  notes?: string
}

interface FeedingRecordListParams extends PaginationParams {
  tankId?: string
  startDate?: string
  endDate?: string
}

// ==================== 换水记录类型 ====================

interface WaterChangeRecord {
  _id: string
  userId: string
  tankId: string
  changeDate: string  // JSON 序列化后为字符串
  percentage: number
  notes?: string
  createdAt: string  // JSON 序列化后为字符串
  updatedAt?: string  // JSON 序列化后为字符串
}

interface WaterChangeRecordCreateParams {
  tankId: string
  changeDate?: string
  percentage: number
  notes?: string
}

interface WaterChangeRecordUpdateParams {
  recordId: string
  changeDate?: string
  percentage?: number
  notes?: string
}

interface WaterChangeRecordListParams extends PaginationParams {
  tankId?: string
  startDate?: string
  endDate?: string
}

// ==================== 水质记录类型 ====================

interface WaterQualityRecord {
  _id: string
  userId: string
  tankId: string
  recordDate: string  // JSON 序列化后为字符串
  temperature?: number
  ph?: number
  ammonia?: number
  nitrite?: number
  nitrate?: number
  imageUrl?: string
  notes?: string
  createdAt: string  // JSON 序列化后为字符串
  updatedAt?: string  // JSON 序列化后为字符串
}

interface WaterQualityRecordCreateParams {
  tankId: string
  recordDate?: string
  temperature?: number
  ph?: number
  ammonia?: number
  nitrite?: number
  nitrate?: number
  imageUrl?: string
  notes?: string
}

interface WaterQualityRecordUpdateParams {
  recordId: string
  recordDate?: string
  temperature?: number
  ph?: number
  ammonia?: number
  nitrite?: number
  nitrate?: number
  imageUrl?: string
  notes?: string
}

interface WaterQualityRecordListParams extends PaginationParams {
  tankId?: string
  startDate?: string
  endDate?: string
}

interface WaterQualityTrendParams {
  tankId: string
  days?: number
}

// ==================== 喂食计划类型 ====================

interface FeedingSchedule {
  _id: string
  userId: string
  tankId: string
  frequency: 'daily' | 'twice_daily' | 'every_other_day' | 'weekly'
  times: string[]
  foodType: string
  enabled: boolean
  nextTrigger: string  // JSON 序列化后为字符串
  createdAt: string  // JSON 序列化后为字符串
  updatedAt: string  // JSON 序列化后为字符串
}

interface FeedingScheduleCreateParams {
  tankId: string
  frequency: 'daily' | 'twice_daily' | 'every_other_day' | 'weekly'
  times: string[]
  foodType?: string
}

interface FeedingScheduleUpdateParams {
  scheduleId: string
  frequency?: 'daily' | 'twice_daily' | 'every_other_day' | 'weekly'
  times?: string[]
  foodType?: string
}

interface FeedingScheduleGetParams {
  scheduleId?: string
  tankId?: string
}

interface FeedingScheduleListParams {
  enabled?: boolean
}

interface FeedingScheduleToggleParams {
  scheduleId: string
  enabled: boolean
}

// ==================== 换水计划类型 ====================

interface WaterChangeSchedule {
  _id: string
  userId: string
  tankId: string
  intervalDays: number
  percentage: number
  enabled: boolean
  nextTrigger: string  // JSON 序列化后为字符串
  createdAt: string  // JSON 序列化后为字符串
  updatedAt: string  // JSON 序列化后为字符串
}

interface WaterChangeScheduleCreateParams {
  tankId: string
  intervalDays: number
  percentage?: number
}

interface WaterChangeScheduleUpdateParams {
  scheduleId: string
  intervalDays?: number
  percentage?: number
}

interface WaterChangeScheduleGetParams {
  scheduleId?: string
  tankId?: string
}

interface WaterChangeScheduleListParams {
  enabled?: boolean
}

interface WaterChangeScheduleToggleParams {
  scheduleId: string
  enabled: boolean
}

// ==================== 统计类型 ====================

interface TankStats {
  tankId: string
  tankName: string
  tankPrice: number
  fish: {
    aliveCount: number
    aliveSpeciesCount: number
    aliveTotalPrice: number
    deadCount: number
    deadTotalPrice: number
    survivalRate: number
  }
  equipment: {
    count: number
    totalPrice: number
  }
  totalInvestment: number
}

interface OverallStats {
  tanksCount: number
  tanksTotalPrice: number
  fish: {
    aliveCount: number
    aliveSpeciesCount: number
    aliveTotalPrice: number
    deadCount: number
    deadTotalPrice: number
    survivalRate: number
  }
  equipment: {
    count: number
    totalPrice: number
  }
  totalInvestment: number
}

interface DeathListParams extends PaginationParams {
  tankId?: string
}

// ==================== 鱼种库类型 ====================

// 难度等级
type Difficulty = 'easy' | 'medium' | 'hard'

// 性格类型
type Temperament = 'peaceful' | 'semi-aggressive' | 'aggressive'

// 养殖经验类型
type CareTipType = 'feeding' | 'water_quality' | 'tank_setup' | 'disease' | 'breeding' | 'compatibility' | 'other'

// 大分类
interface FishCategory {
  _id: string
  name: string
  slug: string
  description?: string
  order: number
  createdAt?: string
  subcategories?: FishSubcategory[]  // 树形结构时包含
}

// 子分类
interface FishSubcategory {
  _id: string
  categoryId: string
  name: string
  slug: string
  description?: string
  order: number
  createdAt?: string
}

// 食性类型
type Diet = '杂食' | '肉食' | '素食' | '藻食'

// 鱼种
interface FishSpecies {
  _id: string
  subcategoryId: string
  categoryId?: string  // 大分类ID（新数据结构支持）
  name: string
  englishName?: string
  scientificName?: string
  origin?: string  // 产地
  description?: string
  characteristics?: string
  bodyLengthMin?: number
  bodyLengthMax?: number
  tempMin?: number
  tempMax?: number
  phMin?: number
  phMax?: number
  difficulty: Difficulty
  temperament?: Temperament
  lifespan?: string
  diet?: Diet  // 食性
  compatibility?: string  // 混养兼容性
  careTip?: string  // 简短饲养技巧
  environment?: string  // 环境要求
  husbandryFeatures?: string  // 饲养特点
  notes?: string  // 注意事项
  imageUrl?: string
  localImagePath?: string  // 本地图片路径（迁移用）
  isVerified: boolean
  source?: 'preset' | 'user'
  createdAt?: string
  updatedAt?: string
  // 关联信息（API 返回时包含）
  subcategory?: {
    _id: string
    name: string
    slug: string
  }
  category?: {
    _id: string
    name: string
    slug: string
  }
  careTips?: FishCareTip[]
}

// 养殖经验
interface FishCareTip {
  _id: string
  speciesId: string
  tipType: CareTipType
  content: string
  importance: number
  createdAt?: string
}

// 难度等级选项
interface DifficultyLevel {
  value: Difficulty
  label: string
  description: string
}

// 性格类型选项
interface TemperamentOption {
  value: Temperament
  label: string
}

// 食性类型选项
interface DietOption {
  value: Diet
  label: string
}

// 分类树响应
interface CategoriesTreeData {
  categories: FishCategory[]
  difficultyLevels: DifficultyLevel[]
  temperaments: TemperamentOption[]
  dietTypes: DietOption[]  // 食性选项
}

// 搜索参数
interface SpeciesSearchParams extends PaginationParams {
  keyword: string
  subcategoryId?: string
  categoryId?: string
  difficulty?: Difficulty
  temperament?: Temperament
  origin?: string  // 产地筛选
  diet?: Diet  // 食性筛选
}

// 列表参数
interface SpeciesListParams extends PaginationParams {
  subcategoryId?: string
  categoryId?: string
  difficulty?: Difficulty
  temperament?: Temperament
  origin?: string  // 产地筛选
  diet?: Diet  // 食性筛选
}

// 详情参数
interface SpeciesGetParams {
  speciesId: string
  includeCareTips?: boolean
}

// 热门参数
interface SpeciesPopularParams {
  limit?: number
}

// 子分类列表参数
interface SubcategoryListParams {
  categoryId?: string
}

// 养殖经验参数
interface CareTipsParams {
  speciesId: string
  tipType?: CareTipType
}

// ==================== 上传类型 ====================

interface UploadTokenParams {
  type?: 'tank' | 'fish' | 'record'
  tankId?: string
}

interface UploadToken {
  credentials: {
    tmpSecretId: string
    tmpSecretKey: string
    sessionToken: string
  }
  expiredTime: number
  bucket: string
  region: string
  key: string
}
