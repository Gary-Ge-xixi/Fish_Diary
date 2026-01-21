/**
 * 云函数 API 调用工具类
 * Fish Diary - 养鱼日记小程序
 */
import { logger } from './logger'

// 云函数返回结果类型
interface CloudFunctionResult<T = unknown> {
  result: ApiResponse<T>
}

/**
 * 调用云函数的通用方法
 */
const callFunction = async <T = unknown>(name: string, data: Record<string, unknown> = {}): Promise<T> => {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data
    }) as CloudFunctionResult<T>

    if (res.result.code !== 0) {
      logger.error(`[API] ${name} error:`, res.result)
      throw new Error(res.result.message || '请求失败')
    }

    return res.result.data as T
  } catch (err) {
    logger.error(`[API] ${name} failed:`, err)
    throw err
  }
}

// ==================== 用户相关 ====================

interface UserInfo {
  openid: string
  nickName?: string
  avatarUrl?: string
  settings?: Record<string, unknown>
}

interface UserUpdateParams {
  nickName?: string
  avatarUrl?: string
  settings?: Record<string, unknown>
}

export const userLogin = (): Promise<UserInfo> =>
  callFunction<UserInfo>('user-login')

export const userUpdate = (params: UserUpdateParams): Promise<void> =>
  callFunction('user-update', params)

// ==================== 鱼缸管理 ====================

export const tankCreate = (params: TankCreateParams): Promise<Tank> =>
  callFunction<Tank>('tank-manage', { action: 'create', params })

export const tankUpdate = (params: TankUpdateParams): Promise<void> =>
  callFunction('tank-manage', { action: 'update', params })

export const tankDelete = (tankId: string): Promise<void> =>
  callFunction('tank-manage', { action: 'delete', params: { tankId } })

export const tankGet = (tankId: string): Promise<Tank> =>
  callFunction<Tank>('tank-manage', { action: 'get', params: { tankId } })

export const tankList = (params: TankListParams = {}): Promise<PaginationData<Tank>> =>
  callFunction<PaginationData<Tank>>('tank-manage', { action: 'list', params })

// ==================== 鱼类管理 ====================

export const fishCreate = (params: FishCreateParams): Promise<Fish> =>
  callFunction<Fish>('fish-manage', { action: 'create', params })

export const fishUpdate = (params: FishUpdateParams): Promise<void> =>
  callFunction('fish-manage', { action: 'update', params })

export const fishDelete = (fishId: string): Promise<void> =>
  callFunction('fish-manage', { action: 'delete', params: { fishId } })

export const fishGet = (fishId: string): Promise<Fish> =>
  callFunction<Fish>('fish-manage', { action: 'get', params: { fishId } })

export const fishList = (params: FishListParams = {}): Promise<PaginationData<Fish>> =>
  callFunction<PaginationData<Fish>>('fish-manage', { action: 'list', params })

export const fishTransfer = (params: FishTransferParams): Promise<void> =>
  callFunction('fish-manage', { action: 'transfer', params })

export const fishMarkDead = (params: FishMarkDeadParams): Promise<void> =>
  callFunction('fish-manage', { action: 'markDead', params })

// ==================== 设备管理 ====================

export const equipmentCreate = (params: EquipmentCreateParams): Promise<Equipment> =>
  callFunction<Equipment>('equipment-manage', { action: 'create', params })

export const equipmentUpdate = (params: EquipmentUpdateParams): Promise<void> =>
  callFunction('equipment-manage', { action: 'update', params })

export const equipmentDelete = (equipmentId: string): Promise<void> =>
  callFunction('equipment-manage', { action: 'delete', params: { equipmentId } })

export const equipmentGet = (equipmentId: string): Promise<Equipment> =>
  callFunction<Equipment>('equipment-manage', { action: 'get', params: { equipmentId } })

export const equipmentList = (params: EquipmentListParams = {}): Promise<PaginationData<Equipment>> =>
  callFunction<PaginationData<Equipment>>('equipment-manage', { action: 'list', params })

export const equipmentGetTypes = (): Promise<EquipmentType[]> =>
  callFunction<EquipmentType[]>('equipment-manage', { action: 'getTypes', params: {} })

// ==================== 喂食记录 ====================

export const feedingRecordCreate = (params: FeedingRecordCreateParams): Promise<FeedingRecord> =>
  callFunction<FeedingRecord>('feeding-record', { action: 'create', params })

export const feedingRecordUpdate = (params: FeedingRecordUpdateParams): Promise<void> =>
  callFunction('feeding-record', { action: 'update', params })

export const feedingRecordDelete = (recordId: string): Promise<void> =>
  callFunction('feeding-record', { action: 'delete', params: { recordId } })

export const feedingRecordList = (params: FeedingRecordListParams = {}): Promise<PaginationData<FeedingRecord>> =>
  callFunction<PaginationData<FeedingRecord>>('feeding-record', { action: 'list', params })

// ==================== 换水记录 ====================

export const waterChangeRecordCreate = (params: WaterChangeRecordCreateParams): Promise<WaterChangeRecord> =>
  callFunction<WaterChangeRecord>('water-change-record', { action: 'create', params })

export const waterChangeRecordUpdate = (params: WaterChangeRecordUpdateParams): Promise<void> =>
  callFunction('water-change-record', { action: 'update', params })

export const waterChangeRecordDelete = (recordId: string): Promise<void> =>
  callFunction('water-change-record', { action: 'delete', params: { recordId } })

export const waterChangeRecordList = (params: WaterChangeRecordListParams = {}): Promise<PaginationData<WaterChangeRecord>> =>
  callFunction<PaginationData<WaterChangeRecord>>('water-change-record', { action: 'list', params })

export const waterChangeRecordGetLast = (tankId: string): Promise<WaterChangeRecord | null> =>
  callFunction<WaterChangeRecord | null>('water-change-record', { action: 'getLastRecord', params: { tankId } })

// ==================== 水质记录 ====================

export const waterQualityRecordCreate = (params: WaterQualityRecordCreateParams): Promise<WaterQualityRecord> =>
  callFunction<WaterQualityRecord>('water-quality-record', { action: 'create', params })

export const waterQualityRecordUpdate = (params: WaterQualityRecordUpdateParams): Promise<void> =>
  callFunction('water-quality-record', { action: 'update', params })

export const waterQualityRecordDelete = (recordId: string): Promise<void> =>
  callFunction('water-quality-record', { action: 'delete', params: { recordId } })

export const waterQualityRecordList = (params: WaterQualityRecordListParams = {}): Promise<PaginationData<WaterQualityRecord>> =>
  callFunction<PaginationData<WaterQualityRecord>>('water-quality-record', { action: 'list', params })

export const waterQualityRecordGetLatest = (tankId: string): Promise<WaterQualityRecord | null> =>
  callFunction<WaterQualityRecord | null>('water-quality-record', { action: 'getLatest', params: { tankId } })

interface WaterQualityTrend {
  dates: string[]
  temperature: (number | null)[]
  ph: (number | null)[]
  ammonia: (number | null)[]
  nitrite: (number | null)[]
  nitrate: (number | null)[]
}

export const waterQualityRecordGetTrend = (params: WaterQualityTrendParams): Promise<WaterQualityTrend> =>
  callFunction<WaterQualityTrend>('water-quality-record', { action: 'getTrend', params })

// ==================== 喂食计划 ====================

export const feedingScheduleCreate = (params: FeedingScheduleCreateParams): Promise<FeedingSchedule> =>
  callFunction<FeedingSchedule>('feeding-schedule', { action: 'create', params })

export const feedingScheduleUpdate = (params: FeedingScheduleUpdateParams): Promise<void> =>
  callFunction('feeding-schedule', { action: 'update', params })

export const feedingScheduleDelete = (scheduleId: string): Promise<void> =>
  callFunction('feeding-schedule', { action: 'delete', params: { scheduleId } })

export const feedingScheduleGet = (params: FeedingScheduleGetParams): Promise<FeedingSchedule | null> =>
  callFunction<FeedingSchedule | null>('feeding-schedule', { action: 'get', params })

export const feedingScheduleList = (params: FeedingScheduleListParams = {}): Promise<FeedingSchedule[]> =>
  callFunction<FeedingSchedule[]>('feeding-schedule', { action: 'list', params })

export const feedingScheduleToggle = (params: FeedingScheduleToggleParams): Promise<void> =>
  callFunction('feeding-schedule', { action: 'toggle', params })

// ==================== 换水计划 ====================

export const waterChangeScheduleCreate = (params: WaterChangeScheduleCreateParams): Promise<WaterChangeSchedule> =>
  callFunction<WaterChangeSchedule>('water-change-schedule', { action: 'create', params })

export const waterChangeScheduleUpdate = (params: WaterChangeScheduleUpdateParams): Promise<void> =>
  callFunction('water-change-schedule', { action: 'update', params })

export const waterChangeScheduleDelete = (scheduleId: string): Promise<void> =>
  callFunction('water-change-schedule', { action: 'delete', params: { scheduleId } })

export const waterChangeScheduleGet = (params: WaterChangeScheduleGetParams): Promise<WaterChangeSchedule | null> =>
  callFunction<WaterChangeSchedule | null>('water-change-schedule', { action: 'get', params })

export const waterChangeScheduleList = (params: WaterChangeScheduleListParams = {}): Promise<WaterChangeSchedule[]> =>
  callFunction<WaterChangeSchedule[]>('water-change-schedule', { action: 'list', params })

export const waterChangeScheduleToggle = (params: WaterChangeScheduleToggleParams): Promise<void> =>
  callFunction('water-change-schedule', { action: 'toggle', params })

// ==================== 统计分析 ====================

export const statisticsGetTank = (tankId: string): Promise<TankStats> =>
  callFunction<TankStats>('tank-statistics', { action: 'getTankStats', params: { tankId } })

export const statisticsGetOverall = (): Promise<OverallStats> =>
  callFunction<OverallStats>('tank-statistics', { action: 'getOverallStats', params: {} })

export const statisticsGetDeathList = (params: DeathListParams = {}): Promise<PaginationData<Fish>> =>
  callFunction<PaginationData<Fish>>('tank-statistics', { action: 'getDeathList', params })

// ==================== 鱼种库 ====================

// 分类相关
export const categoryList = (): Promise<{ list: FishCategory[] }> =>
  callFunction<{ list: FishCategory[] }>('fish-species-query', { action: 'listCategories', params: {} })

export const subcategoryList = (params: SubcategoryListParams = {}): Promise<{ list: FishSubcategory[] }> =>
  callFunction<{ list: FishSubcategory[] }>('fish-species-query', { action: 'listSubcategories', params })

export const getCategoriesTree = (): Promise<CategoriesTreeData> =>
  callFunction<CategoriesTreeData>('fish-species-query', { action: 'getCategoriesTree', params: {} })

// 兼容旧接口
export const speciesGetCategories = (): Promise<CategoriesTreeData> =>
  callFunction<CategoriesTreeData>('fish-species-query', { action: 'getCategories', params: {} })

// 鱼种相关
export const speciesSearch = (params: SpeciesSearchParams): Promise<PaginationData<FishSpecies>> =>
  callFunction<PaginationData<FishSpecies>>('fish-species-query', { action: 'search', params })

export const speciesGet = (params: SpeciesGetParams): Promise<FishSpecies> =>
  callFunction<FishSpecies>('fish-species-query', { action: 'get', params })

export const speciesList = (params: SpeciesListParams = {}): Promise<PaginationData<FishSpecies>> =>
  callFunction<PaginationData<FishSpecies>>('fish-species-query', { action: 'list', params })

export const speciesGetPopular = (params: SpeciesPopularParams = {}): Promise<{ list: FishSpecies[] }> =>
  callFunction<{ list: FishSpecies[] }>('fish-species-query', { action: 'getPopular', params })

// 养殖经验
export const careTipsList = (params: CareTipsParams): Promise<{ list: FishCareTip[] }> =>
  callFunction<{ list: FishCareTip[] }>('fish-species-query', { action: 'getCareTips', params })

// 图片上传已改用 utils/upload.ts 的云存储直传方案
