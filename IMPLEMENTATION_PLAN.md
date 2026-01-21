# Fish Diary 代码改进计划

## 项目状态
- **代码审查评分**: 8.5/10 (改进后)
- **审查日期**: 2026-01-08
- **项目路径**: `/Users/wanshuiwanqigaozhishang/Downloads/MINIAPP`
- **云开发环境**: `cloudbase-9gnb2cyn0387e399` (已部署)

---

## Stage 0: 前后端链条修复 (P0 - 最高优先级) ✅
**Goal**: 修复前后端数据不通的严重问题
**Status**: Complete

### 已完成
- ✅ 创建 `user-update` 云函数 (`cloudfunctions/user-update/index.js`)
- ✅ `getLastRecord` action 已存在于 `water-change-record` 云函数
- ✅ 修复 `water-quality-record` 参数名 (`recordTime` → `recordDate`)
- ✅ 修复 `water-quality-record` images 字段 (`images[]` → `imageUrl`)
- ✅ 整合类型定义 - 删除 `utils/types.ts` 中重复的数据模型类型
- ✅ 修复 `pages/index/index.ts` 和 `pages/tank-detail/tank-detail.ts` 的类型导入

---

## Stage 1: 安全和稳定性修复 (P0) ✅
**Goal**: 修复安全和稳定性问题
**Status**: Complete

### 已完成
- ✅ 分页参数验证 - 8个云函数添加 pageSize 上限 (100)
  - tank-manage, fish-manage, equipment-manage
  - feeding-record, water-change-record, water-quality-record
  - tank-statistics, fish-species-query
- ✅ 错误信息脱敏 - 移除所有 `error: err.message` 返回
- ✅ 环境配置外置 - `CLOUD_ENV_ID` 提取到 `utils/config.ts`

---

## Stage 2: 代码清理 (P1) ✅
**Goal**: 清理遗留代码和调试信息
**Status**: Complete

### 已完成
- ✅ 删除 `pages/index/index.ts` 中所有 DEV_MODE 分支和 mock 数据
  - 移除 mockTanks, mockStats 定义
  - 移除 loadTanks, loadTankStats, loadEquipment, saveEquipment 等函数中的 DEV_MODE 分支
  - 移除 DEV_MODE, MOCK_DELAY 导入
- ✅ 删除 `pages/tank-detail/tank-detail.ts` 中的 DEV_MODE 分支
- ✅ 删除调试 console.log ("取消选择图片") - 3处
  - onChooseQualityImage, onChooseTankImage, onChooseFeedingImage
- ✅ 修复 FormErrors 重复定义 - 删除第二个定义
- ✅ 修复 feedingForm 初始化 - 添加 `imageUrl: ''`

---

## Stage 3: 代码复用优化 (P1) ✅
**Goal**: 提取共享代码，减少重复
**Status**: Complete

### 已完成
- ✅ 创建共享验证模块 `cloudfunctions/shared/validators.js`
  - validatePagination, validateDate, validatePositiveInt
  - validateNonNegative, validateRequired, validateEnum
- ✅ 创建共享权限模块 `cloudfunctions/shared/auth.js`
  - ErrorCodes, success, paramError, unauthorized, notFound, forbidden, dbError
  - verifyOwnership, verifyTankOwnership
- ✅ 创建结构化日志模块 `cloudfunctions/shared/logger.js`
  - createLogger, withLogging
- ✅ 创建同步脚本 `cloudfunctions/sync-shared.js`
  - 将 shared 模块复制到各云函数目录

---

## Stage 4: 性能优化 (P1) ✅
**Goal**: 解决 N+1 查询问题
**Status**: Complete

### 已完成
- ✅ 分析 fish-species-query - 已使用批量查询优化，无 N+1 问题
- ✅ 分析 fish-manage - listFish 已使用批量获取 species 信息

---

## Stage 5: 功能完善 (P2) ✅
**Goal**: 完成未实现的功能
**Status**: Complete

### 已完成
- ✅ **5.1 tank-detail 编辑功能**
  - 添加编辑弹窗 (showEditPopup, editForm)
  - 实现 onEditTank, onCloseEditPopup, onEditFormInput, onSaveEdit
  - 更新 tank-detail.wxml 和 tank-detail.wxss

- ✅ **5.2 wiki 页面改用云端数据**
  - 移除本地 fish-data 依赖
  - 改为调用 fishSpeciesGetCategories 和 fishSpeciesList API
  - 支持分类筛选、搜索、分页加载
  - 更新数据结构适配云端格式

- ✅ **5.3 mine 页面 safe-area**
  - 添加 `<view class="safe-area-bottom"></view>`

---

## Stage 6: 前端重构 (P2) ✅
**Goal**: 拆分过长文件
**Status**: Complete (渐进式)

### 已完成
- ✅ 创建辅助模块目录 `pages/index/helpers/`
- ✅ 提取常量到 `helpers/constants.ts`
  - TANK_SIZE_OPTIONS, FOOD_TYPE_OPTIONS, TABS
  - EQUIPMENT_TYPES, FILTER_TYPES
- ✅ 提取格式化函数到 `helpers/formatters.ts`
  - getTodayString, getCurrentTimeString, formatDateFriendly
  - formatTimestamp, formatDateTime, formatPrice, formatPercent
- ✅ 提取验证函数到 `helpers/validators.ts`
  - validateTankForm, validateFishForm, validateFeedingForm
  - validateWaterChangeForm, validateEquipmentForm, validateWaterQualityForm

**注意**: 完全拆分 Page 对象需要使用 Behaviors，会是较大的重构。当前采用渐进式方案，保持 Page 结构不变。

---

## Stage 7: 日志与监控 (P2) ✅
**Goal**: 改进日志记录
**Status**: Complete

### 已完成
- ✅ 创建 `cloudfunctions/shared/logger.js`
  - LogLevel 常量
  - createLogger 工厂函数
  - withLogging 高阶函数

---

## 已完成的部署工作 ✅

### 云函数部署 (15个)
- user-login, user-update
- fish-manage, tank-manage, tank-statistics
- fish-species-query, equipment-manage
- feeding-record, feeding-schedule
- water-change-record, water-change-schedule
- water-quality-record
- reminder-trigger, upload-token, db-init

### 共享模块同步
运行 `node cloudfunctions/sync-shared.js` 将共享模块复制到各云函数

### 数据库初始化
- 14 个集合已创建
- 预设数据已导入 (fish_categories, fish_subcategories, fish_species, fish_care_tips)

---

## 快速参考

### 错误码规范
| Code | 含义 |
|------|-----|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 未授权 |
| 1003 | 资源不存在 |
| 1004 | 权限不足 |
| 2001 | 数据库错误 |

### 关键文件路径
- 云函数: `/cloudfunctions/*/index.js`
- 共享模块: `/cloudfunctions/shared/`
- 前端页面: `/pages/*/`
- 前端辅助: `/pages/index/helpers/`
- API 封装: `/utils/api.ts`
- 类型定义: `/typings/index.d.ts` (全局类型)
- 表单类型: `/utils/types.ts` (前端表单类型)
- 配置文件: `/utils/config.ts`

---

## 改进总结

| 阶段 | 优先级 | 状态 | 主要改进 |
|------|--------|------|---------|
| Stage 0 | P0 | ✅ | 前后端数据链路修复 |
| Stage 1 | P0 | ✅ | 安全性和稳定性 |
| Stage 2 | P1 | ✅ | 代码清理 |
| Stage 3 | P1 | ✅ | 共享模块提取 |
| Stage 4 | P1 | ✅ | 性能优化评估 |
| Stage 5 | P2 | ✅ | 功能完善 |
| Stage 6 | P2 | ✅ | 前端辅助模块 |
| Stage 7 | P2 | ✅ | 结构化日志 |
| Stage 8 | P2 | ✅ | Wiki 数据导入工具 |

**代码质量评分提升**: 7.5/10 → 8.5/10

---

## Stage 8: Wiki 数据导入工具 (P2) ✅
**Goal**: 将 Excel 鱼种数据导入云数据库
**Status**: Complete

### 已完成
- ✅ 创建 `scripts/parse-excel.js` - Excel 解析脚本
  - 解析 Fish_Database_120.xlsx (115 条鱼种)
  - 提取 10 个分类、19 个子分类
  - 输出 `database/fish_import_data.json`
- ✅ 创建 `scripts/upload-images.js` - 图片上传脚本
  - 生成手动上传指南
  - 输出 `database/image_mapping.json` (映射模板)
  - 输出 `database/upload_manifest.json` (上传清单)
- ✅ 创建 `scripts/import-to-database.js` - 数据库导入脚本
  - 生成 `cloudfunctions/fish-import/` 云函数
  - 支持 upsert 模式 (按名称去重)
- ✅ 创建 `scripts/validate-import.js` - 验证脚本
  - 生成 `cloudfunctions/fish-validate/` 云函数
  - 检查数据完整性和关联性
- ✅ 更新 `typings/index.d.ts` 添加 origin 字段

### 数据字段映射

| Excel 列 | 数据库字段 | 目标集合 |
|---------|-----------|---------|
| 分类 | categoryId | fish_categories |
| 子分类 | subcategoryId | fish_subcategories |
| 中文名 | name | fish_species |
| 英文名 | englishName | fish_species |
| 学名 | scientificName | fish_species |
| 产地 | origin | fish_species |
| 基本介绍 | description | fish_species |
| 饲养建议 | content | fish_care_tips |
| 难度 | difficulty | fish_species |
| 温度(C) | tempMin/tempMax | fish_species |
| PH | phMin/phMax | fish_species |
| 图片路径 | imageUrl | fish_species |

### 执行顺序

```bash
1. node scripts/parse-excel.js        # 解析 Excel
2. node scripts/upload-images.js      # 生成上传指南
3. 手动上传图片到云存储 fish-species/
4. 更新 database/image_mapping.json 中的 fileID
5. node scripts/import-to-database.js # 生成导入云函数
6. 部署 cloudfunctions/fish-import    # 在开发者工具中部署
7. 调用云函数执行导入
8. 部署 cloudfunctions/fish-validate  # 部署验证云函数
9. 调用验证云函数检查结果
```
