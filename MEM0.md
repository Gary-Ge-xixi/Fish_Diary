# Fish Diary 代码简化计划 (PLAN)

> 生成时间: 2026-01-09
> code-simplifier 评分: 8.2/10
> 目标评分: 8.8/10

## 项目概况

| 指标 | 数值 |
|-----|------|
| 前端 TypeScript 代码 | 4,273 行 |
| 云函数 JavaScript 代码 | 8,622 行 |
| 首页模块（index + behaviors + helpers） | 1,906 行 |
| 云函数数量 | 21 个 |
| 页面数量 | 4 个 |

---

## 1. 当前代码质量评分

| 维度 | 评分 | 说明 |
|-----|------|------|
| **架构设计** | 8.5/10 | Behaviors 模块化设计良好，云函数 action 分发清晰 |
| **类型安全** | 7.5/10 | 全局类型定义完整，但存在 1 处 `any` 类型（app.ts:7） |
| **代码复用** | 8.0/10 | shared 模块已提取，但存在少量重复定义 |
| **可维护性** | 8.0/10 | 模块职责清晰，但部分常量重复定义 |
| **错误处理** | 8.5/10 | 统一错误码，错误信息已脱敏 |
| **安全性** | 9.0/10 | 分页验证、权限校验完备 |
| **性能** | 8.0/10 | 批量查询优化，但前端 console 语句较多 |

**综合评分: 8.2/10**

---

## 2. 问题清单

### P0 - 阻塞性问题（无）

项目已完成前期 P0 修复，当前无阻塞性问题。

---

### P1 - 重要问题

| # | 问题 | 影响范围 | 状态 |
|---|------|---------|------|
| P1-1 | 常量重复定义 | index.ts, feeding-behavior.ts | [x] |
| P1-2 | 前端 console 语句过多 (~50处) | 全局 | [x] |
| P1-3 | app.ts 中的 any 类型 | app.ts:7 | [x] |
| P1-4 | 云函数 shared 模块同步风险 | 21个云函数 | [ ] |

---

### P2 - 一般问题

| # | 问题 | 影响范围 | 状态 |
|---|------|---------|------|
| P2-1 | Wiki 页面辅助函数应提取 | wiki.ts | [x] 已创建 utils/formatters.ts |
| P2-2 | 类型定义文件组织可优化 | types.ts | [ ] |
| P2-3 | Behavior 之间存在隐式依赖 | behaviors/ | [ ] |

---

### P3 - 优化建议

| # | 问题 | 影响范围 | 状态 |
|---|------|---------|------|
| P3-1 | 图片上传逻辑可提取 | 3个behavior | [x] 已创建 utils/upload.ts |
| P3-2 | 表单验证逻辑可统一 | validators.ts | [ ] |
| P3-3 | Tab 切换逻辑可简化 | index.ts | [x] |

---

## 3. 执行计划

### Stage 1: 常量和类型清理 (P1)

**目标**: 消除常量重复定义，修复 any 类型

**文件列表**:
1. `pages/index/index.ts` - 删除 TABS 定义，从 constants 导入
2. `pages/index/behaviors/feeding-behavior.ts` - 删除 FOOD_TYPE_OPTIONS
3. `app.ts` - 修复 any 类型
4. `utils/types.ts` - 检查并删除未使用类型

**改动**:
```typescript
// index.ts: 删除第 16-22 行，改为：
import { TABS } from './helpers/constants'

// feeding-behavior.ts: 删除第 11-16 行，改为：
import { FOOD_TYPE_OPTIONS } from '../helpers/constants'

// app.ts: 修复 any 类型
export function getApp(): IAppOption & WechatMiniprogram.IAnyObject {
  return (globalThis as { getApp: () => IAppOption }).getApp()
}
```

---

### Stage 2: 日志系统优化 (P1)

**目标**: 创建统一日志工具，替换散落的 console 调用

**新建文件**:
- `utils/logger.ts`

**内容**:
```typescript
const isDev = __wxConfig.envVersion === 'develop'

export const logger = {
  debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => isDev && console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args)
}
```

**替换范围**:
- navigation-bar.ts: 18 处
- responsive.ts: 5 处
- platform.ts: 4 处
- 各 behavior 模块: ~15 处
- 各页面: ~8 处

---

### Stage 3: 代码复用提取 (P2)

**目标**: 提取重复的工具函数

**改动**:

1. **新建 `utils/upload.ts`** - 图片上传函数
```typescript
export async function uploadImage(filePath: string, folder: string): Promise<string> {
  const cloudPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath })
  return res.fileID
}
```

2. **新建 `utils/formatters.ts`** - 从 wiki.ts 提取格式化函数
```typescript
export function formatTemperature(temp?: { min: number; max: number }): string
export function formatPh(ph?: { min: number; max: number }): string
export function formatSize(size?: { min: number; max: number }): string
export function getDifficultyLabel(difficulty?: string): string
export function getTemperamentLabel(temperament?: string): string
```

---

### Stage 4: Tab 切换逻辑简化 (P3)

**目标**: 使用映射对象替代 if 链

**文件**: `pages/index/index.ts`

**改动**:
```typescript
// 替换第 129-166 行的 if 链
const TAB_CONFIG: Record<string, {
  list: string;
  load: () => void;
  dirty: DirtyFlagKey;
  resetData?: Record<string, unknown>;
}> = {
  feeding: {
    list: 'feedingList',
    load: () => this.loadFeedingRecords(),
    dirty: 'feeding',
    resetData: { feedingList: [], feedingPage: 1, hasMoreFeeding: true }
  },
  fish: { list: 'fishList', load: () => this.loadFishList(), dirty: 'fish' },
  'water-change': { list: 'waterChangeList', load: () => this.loadWaterChangeRecords(), dirty: 'waterChange' },
  equipment: { list: 'equipmentList', load: () => this.loadEquipment(), dirty: 'equipment' },
  'water-quality': { list: 'waterQualityList', load: () => this.loadWaterQuality(), dirty: 'waterQuality' }
}

onTabChange(e: WechatMiniprogram.TouchEvent) {
  const key = e.currentTarget.dataset.key as string
  this.setData({ activeTab: key })
  const app = getApp()
  const config = TAB_CONFIG[key]
  if (config && (this.data[config.list].length === 0 || app.isDirty(config.dirty))) {
    if (config.resetData) this.setData(config.resetData)
    config.load()
    app.clearDirty(config.dirty)
  }
}
```

---

## 4. 预期改进效果

| 改进项 | 改进前 | 改进后 | 收益 |
|-------|-------|-------|-----|
| 常量重复定义 | 4 处 | 0 处 | 避免不一致风险 |
| any 类型 | 1 处 | 0 处 | 类型安全 100% |
| console 语句 | ~50 处 | ~10 处（关键错误） | 生产环境更干净 |
| 图片上传重复代码 | 3 处 | 1 处共享函数 | 减少 ~30 行 |
| Tab 切换逻辑 | if 链 38 行 | 映射对象 15 行 | 更易维护 |

**预期综合评分**: 8.2/10 -> **8.8/10**

---

## 5. 执行优先级

```
Stage 1 (P1): 常量和类型清理     [x] 完成
    ↓
Stage 2 (P1): 日志系统优化       [x] 完成
    ↓
Stage 3 (P2): 代码复用提取       [x] 完成
    ↓
Stage 4 (P3): Tab 切换逻辑简化   [x] 完成
```

---

## 6. 不建议改动的部分

以下代码结构已经良好，不建议改动:

1. **Behaviors 模块化架构** - 职责分离清晰
2. **云函数 action 分发模式** - 统一规范
3. **shared 模块结构** - auth/logger/validators 分工明确
4. **typings/index.d.ts 全局类型** - 完整且组织良好
5. **错误码体系** - 统一规范
