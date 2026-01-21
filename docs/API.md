# Fish Diary API 接口文档

## 通用说明

### 调用方式
```typescript
import { tankList } from '../../utils/api'
const result = await tankList({ page: 1, pageSize: 20 })
```

### 响应格式
```typescript
{
  code: number      // 0 成功，其他为错误码
  message: string   // 结果描述
  data?: T          // 响应数据
}
```

### 错误码
| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 未授权 |
| 1003 | 资源不存在 |
| 1004 | 权限不足 |
| 2001 | 数据库操作失败 |
| 2002 | COS 操作失败 |

### 分页参数
```typescript
interface PaginationParams {
  page?: number     // 页码，默认 1
  pageSize?: number // 每页数量，默认 20
}
```

### 分页响应
```typescript
interface PaginationData<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

---

## 1. 用户模块 `user-login`

### 1.1 用户登录
自动创建或更新用户信息。

**调用**: `userLogin()`

**响应**:
```typescript
{
  userId: string
  openid: string
  isNewUser: boolean
  nickName: string
  avatarUrl: string
  settings: {
    feedReminder: boolean
    waterChangeReminder: boolean
  }
  createdAt: Date
  updatedAt: Date
}
```

---

## 2. 鱼缸管理 `tank-manage`

### 2.1 创建鱼缸
**调用**: `tankCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 鱼缸名称 |
| size | { length, width, height } | - | 尺寸 (cm) |
| price | number | - | 价格 |
| setupDate | string | - | 开缸日期 |
| description | string | - | 描述 |
| coverUrl | string | - | 封面图 |

**响应**: `Tank` 对象

### 2.2 更新鱼缸
**调用**: `tankUpdate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 鱼缸 ID |
| name | string | - | 名称 |
| size | object | - | 尺寸 |
| price | number | - | 价格 |
| setupDate | string | - | 开缸日期 |
| description | string | - | 描述 |
| coverUrl | string | - | 封面图 |

### 2.3 删除鱼缸
**调用**: `tankDelete(tankId)`

软删除，状态变为 `archived`。

### 2.4 获取鱼缸详情
**调用**: `tankGet(tankId)`

**响应**:
```typescript
{
  _id: string
  name: string
  coverUrl: string
  size: { length, width, height }
  volume: number        // 自动计算，单位升
  price: number
  setupDate: Date
  description: string
  status: 'active' | 'archived'
  stats: {
    fishCount: number
    speciesCount: number
  }
  createdAt: Date
  updatedAt: Date
}
```

### 2.5 获取鱼缸列表
**调用**: `tankList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |
| status | string | - | 状态筛选: `active` / `archived` |

**响应**: `PaginationData<Tank>`

---

## 3. 鱼类管理 `fish-manage`

### 3.1 添加鱼
**调用**: `fishCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 所属鱼缸 |
| speciesId | string | - | 关联鱼种库 |
| customName | string | - | 自定义名称 |
| quantity | number | - | 数量，默认 1 |
| purchasePrice | number | - | 单价 |
| purchaseDate | string | - | 购买日期 |

### 3.2 更新鱼
**调用**: `fishUpdate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fishId | string | ✅ | 鱼 ID |
| customName | string | - | 自定义名称 |
| quantity | number | - | 数量 |
| purchasePrice | number | - | 单价 |
| purchaseDate | string | - | 购买日期 |

> 不可更新: `tankId`, `status`, `transferHistory`

### 3.3 删除鱼
**调用**: `fishDelete(fishId)`

物理删除。

### 3.4 获取鱼详情
**调用**: `fishGet(fishId)`

**响应**:
```typescript
{
  _id: string
  tankId: string
  speciesId: string
  customName: string
  quantity: number
  purchasePrice: number
  purchaseDate: Date
  status: 'alive' | 'dead' | 'transferred'
  deathDate?: Date
  deathReason?: string
  transferHistory: Array<{
    fromTankId: string
    toTankId: string
    quantity: number
    date: Date
  }>
  speciesInfo: FishSpecies | null  // 关联的鱼种信息
  createdAt: Date
  updatedAt: Date
}
```

### 3.5 获取鱼列表
**调用**: `fishList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | - | 按鱼缸筛选 |
| status | string | - | 状态: `alive` / `dead` / `transferred` |
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |

### 3.6 转移鱼
**调用**: `fishTransfer(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fishId | string | ✅ | 鱼 ID |
| toTankId | string | ✅ | 目标鱼缸 |
| quantity | number | - | 转移数量，默认全部 |

> 部分转移会创建新记录。

### 3.7 标记死亡
**调用**: `fishMarkDead(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fishId | string | ✅ | 鱼 ID |
| deathDate | string | - | 死亡日期 |
| deathReason | string | - | 死因 |
| quantity | number | - | 死亡数量，默认全部 |

> 部分死亡会创建新的死亡记录。

---

## 4. 设备管理 `equipment-manage`

### 4.1 添加设备
**调用**: `equipmentCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 所属鱼缸 |
| type | string | ✅ | 设备类型 |
| brand | string | - | 品牌 |
| model | string | - | 型号 |
| price | number | - | 价格 |
| purchaseDate | string | - | 购买日期 |
| installDate | string | - | 安装日期 |
| specs | object | - | 规格参数 |
| notes | string | - | 备注 |

**设备类型**:
| type | 名称 |
|------|------|
| heater | 加热棒 |
| air_pump | 氧气泵 |
| light | 灯具 |
| filter | 过滤设备 |
| filter_media | 滤材 |
| uv_lamp | 杀菌灯 |
| water_pump | 水泵 |

**过滤类型** (specs.filterType):
| filterType | 名称 |
|------------|------|
| sump | 底滤 |
| hang_on | 背挂 |
| canister | 过滤筒 |
| trickle | 周转箱/滴流 |

### 4.2 更新设备
**调用**: `equipmentUpdate(params)`

### 4.3 删除设备
**调用**: `equipmentDelete(equipmentId)`

### 4.4 获取设备详情
**调用**: `equipmentGet(equipmentId)`

### 4.5 获取设备列表
**调用**: `equipmentList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | - | 按鱼缸筛选 |
| type | string | - | 按类型筛选 |
| status | string | - | 状态: `in_use` / `inactive` / `broken` |
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |

**响应** 额外包含:
```typescript
{
  list: Equipment[]
  typeStats: {
    [type: string]: {
      count: number
      totalPrice: number
    }
  }
  pagination: {...}
}
```

### 4.6 获取设备类型枚举
**调用**: `equipmentGetTypes()`

---

## 5. 喂食记录 `feeding-record`

### 5.1 添加喂食记录
**调用**: `feedingRecordCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 鱼缸 ID |
| feedTime | string | - | 喂食时间，默认当前 |
| foodType | string | - | 食物类型，默认 `pellet` |
| foodName | string | - | 食物名称 |
| amount | string | - | 用量 |
| imageUrl | string | - | 图片 |
| notes | string | - | 备注 |

**食物类型**:
| foodType | 名称 |
|----------|------|
| live | 活食 |
| pellet | 颗粒饲料 |
| flake | 薄片饲料 |
| frozen | 冷冻食品 |
| other | 其他 |

### 5.2 更新喂食记录
**调用**: `feedingRecordUpdate(params)`

### 5.3 删除喂食记录
**调用**: `feedingRecordDelete(recordId)`

### 5.4 获取喂食记录列表
**调用**: `feedingRecordList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | - | 鱼缸筛选 |
| startDate | string | - | 开始日期 |
| endDate | string | - | 结束日期 |
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |

---

## 6. 换水记录 `water-change-record`

### 6.1 添加换水记录
**调用**: `waterChangeRecordCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 鱼缸 ID |
| changeDate | string | - | 换水日期 |
| percentage | number | ✅ | 换水比例 (0-100) |
| notes | string | - | 备注 |

### 6.2 更新换水记录
**调用**: `waterChangeRecordUpdate(params)`

### 6.3 删除换水记录
**调用**: `waterChangeRecordDelete(recordId)`

### 6.4 获取换水记录列表
**调用**: `waterChangeRecordList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | - | 鱼缸筛选 |
| startDate | string | - | 开始日期 |
| endDate | string | - | 结束日期 |
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |

### 6.5 获取最近一次换水记录
**调用**: `waterChangeRecordGetLast(tankId)`

---

## 7. 水质记录 `water-quality-record`

### 7.1 添加水质记录
**调用**: `waterQualityRecordCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 鱼缸 ID |
| recordDate | string | - | 记录日期 |
| temperature | number | - | 温度 (°C) |
| ph | number | - | pH 值 |
| ammonia | number | - | 氨氮 (mg/L) |
| nitrite | number | - | 亚硝酸盐 (mg/L) |
| nitrate | number | - | 硝酸盐 (mg/L) |
| imageUrl | string | - | 测试图片 |
| notes | string | - | 备注 |

### 7.2 更新水质记录
**调用**: `waterQualityRecordUpdate(params)`

### 7.3 删除水质记录
**调用**: `waterQualityRecordDelete(recordId)`

### 7.4 获取水质记录列表
**调用**: `waterQualityRecordList(params)`

### 7.5 获取最新水质记录
**调用**: `waterQualityRecordGetLatest(tankId)`

### 7.6 获取水质趋势
**调用**: `waterQualityRecordGetTrend(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 鱼缸 ID |
| days | number | - | 天数，默认 30 |

**响应**:
```typescript
{
  dates: string[]           // 日期数组
  temperature: number[]     // 温度趋势
  ph: number[]             // pH 趋势
  ammonia: number[]        // 氨氮趋势
  nitrite: number[]        // 亚硝酸盐趋势
  nitrate: number[]        // 硝酸盐趋势
}
```

---

## 8. 喂食计划 `feeding-schedule`

### 8.1 创建喂食计划
**调用**: `feedingScheduleCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 鱼缸 ID |
| frequency | string | ✅ | 频率 |
| times | string[] | ✅ | 喂食时间点，如 `['08:00', '18:00']` |
| foodType | string | - | 食物类型 |

**频率选项**:
| frequency | 说明 |
|-----------|------|
| daily | 每天 |
| twice_daily | 每天两次 |
| every_other_day | 隔天 |
| custom | 自定义 |

> 每个鱼缸只能有一个喂食计划。

### 8.2 更新喂食计划
**调用**: `feedingScheduleUpdate(params)`

### 8.3 删除喂食计划
**调用**: `feedingScheduleDelete(scheduleId)`

### 8.4 获取喂食计划
**调用**: `feedingScheduleGet(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleId | string | - | 计划 ID |
| tankId | string | - | 鱼缸 ID |

> 二选一传入。

### 8.5 获取喂食计划列表
**调用**: `feedingScheduleList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enabled | boolean | - | 是否启用 |

**响应** 包含关联的 `tankInfo`。

### 8.6 切换计划开关
**调用**: `feedingScheduleToggle(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleId | string | ✅ | 计划 ID |
| enabled | boolean | ✅ | 开关状态 |

---

## 9. 换水计划 `water-change-schedule`

### 9.1 创建换水计划
**调用**: `waterChangeScheduleCreate(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | ✅ | 鱼缸 ID |
| intervalDays | number | ✅ | 间隔天数 (1-90) |
| percentage | number | - | 换水比例，默认 30% |

> 每个鱼缸只能有一个换水计划。

### 9.2 更新换水计划
**调用**: `waterChangeScheduleUpdate(params)`

### 9.3 删除换水计划
**调用**: `waterChangeScheduleDelete(scheduleId)`

### 9.4 获取换水计划
**调用**: `waterChangeScheduleGet(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scheduleId | string | - | 计划 ID |
| tankId | string | - | 鱼缸 ID |

**响应** 额外包含 `lastRecord` (最近一次换水记录)。

### 9.5 获取换水计划列表
**调用**: `waterChangeScheduleList(params)`

### 9.6 切换计划开关
**调用**: `waterChangeScheduleToggle(params)`

---

## 10. 统计分析 `tank-statistics`

### 10.1 获取鱼缸统计
**调用**: `statisticsGetTank(tankId)`

**响应**:
```typescript
{
  tankId: string
  tankName: string
  tankPrice: number
  fish: {
    aliveCount: number        // 存活数量
    aliveSpeciesCount: number // 存活种类数
    aliveTotalPrice: number   // 存活鱼总价值
    deadCount: number         // 死亡数量
    deadTotalPrice: number    // 死亡鱼总损失
    survivalRate: number      // 存活率 (%)
  }
  equipment: {
    count: number            // 设备数量
    totalPrice: number       // 设备总价值
  }
  totalInvestment: number    // 总投入
}
```

### 10.2 获取总体统计
**调用**: `statisticsGetOverall()`

**响应**:
```typescript
{
  tanksCount: number         // 鱼缸数量
  tanksTotalPrice: number    // 鱼缸总价值
  fish: {...}                // 同上
  equipment: {...}           // 同上
  totalInvestment: number    // 总投入
}
```

### 10.3 获取死亡列表
**调用**: `statisticsGetDeathList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tankId | string | - | 鱼缸筛选 |
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |

**响应** 每条记录包含:
- `speciesInfo`: 鱼种信息
- `tankInfo`: 鱼缸信息
- `loss`: 损失金额

---

## 11. 鱼种库 `fish-species-query`

> 公开接口，不需要用户授权。

### 11.1 搜索鱼种
**调用**: `speciesSearch(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | ✅ | 关键词 (中文名/英文名) |
| category | string | - | 分类筛选 |
| careLevel | string | - | 难度筛选 |
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |

### 11.2 获取鱼种详情
**调用**: `speciesGet(speciesId)`

**响应**:
```typescript
{
  _id: string
  name: string              // 中文名
  englishName: string       // 英文名
  scientificName: string    // 学名
  category: string          // 分类
  careLevel: string         // 难度: easy/medium/hard
  temperament: string       // 性格: peaceful/semi-aggressive/aggressive
  temperatureRange: { min, max }  // 适宜温度
  phRange: { min, max }     // 适宜 pH
  maxSize: number           // 最大体长 (cm)
  lifespan: number          // 寿命 (年)
  description: string       // 描述
  imageUrl: string          // 图片
  isVerified: boolean       // 是否已审核
}
```

### 11.3 获取鱼种列表
**调用**: `speciesList(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | - | 分类筛选 |
| careLevel | string | - | 难度筛选 |
| page | number | - | 页码 |
| pageSize | number | - | 每页数量 |

### 11.4 获取分类枚举
**调用**: `speciesGetCategories()`

**响应**:
```typescript
{
  categories: [
    { value: 'freshwater', label: '淡水鱼', icon: 'freshwater' },
    { value: 'saltwater', label: '海水鱼', icon: 'saltwater' },
    { value: 'tropical', label: '热带鱼', icon: 'tropical' },
    { value: 'coldwater', label: '冷水鱼', icon: 'coldwater' },
    { value: 'cichlid', label: '慈鲷', icon: 'cichlid' },
    { value: 'catfish', label: '鲶鱼', icon: 'catfish' },
    { value: 'livebearer', label: '卵胎生', icon: 'livebearer' },
    { value: 'labyrinth', label: '迷鳃鱼', icon: 'labyrinth' }
  ],
  careLevels: [
    { value: 'easy', label: '容易', description: '适合新手' },
    { value: 'medium', label: '中等', description: '需要一定经验' },
    { value: 'hard', label: '困难', description: '适合有经验的玩家' }
  ],
  temperaments: [
    { value: 'peaceful', label: '温和' },
    { value: 'semi-aggressive', label: '半攻击性' },
    { value: 'aggressive', label: '攻击性' }
  ]
}
```

### 11.5 获取热门鱼种
**调用**: `speciesGetPopular(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | - | 数量限制，默认 10 |

---

## 12. 图片上传 `upload-token`

### 12.1 获取上传凭证
**调用**: `uploadToken(params)`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | - | 上传类型 |
| tankId | string | - | 鱼缸 ID (部分类型需要) |

**上传类型**:
| type | 路径 | 说明 |
|------|------|------|
| avatar | users/{openid}/avatar/ | 头像 |
| tank-cover | users/{openid}/tanks/{tankId}/cover/ | 鱼缸封面 |
| feeding | users/{openid}/tanks/{tankId}/feeding/ | 喂食记录图片 |
| water-quality | users/{openid}/tanks/{tankId}/water-quality/ | 水质测试图片 |
| general | users/{openid}/general/ | 通用 (默认) |

**响应**:
```typescript
{
  credentials: {
    tmpSecretId: string
    tmpSecretKey: string
    sessionToken: string
  }
  startTime: number
  expiredTime: number       // 30 分钟有效
  bucket: string
  region: string
  allowPrefix: string       // 允许上传的路径
}
```

**前端上传示例**:
```typescript
const token = await uploadToken({ type: 'tank-cover', tankId: 'xxx' })

// 使用 COS SDK 上传
const cos = new COS({
  getAuthorization: (options, callback) => {
    callback({
      TmpSecretId: token.credentials.tmpSecretId,
      TmpSecretKey: token.credentials.tmpSecretKey,
      SecurityToken: token.credentials.sessionToken,
      ExpiredTime: token.expiredTime
    })
  }
})

cos.uploadFile({
  Bucket: token.bucket,
  Region: token.region,
  Key: token.allowPrefix + 'filename.jpg',
  Body: file
})
```
