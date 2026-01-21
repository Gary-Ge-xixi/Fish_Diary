# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**Fish Diary (养鱼日记)** - 微信小程序项目，使用 **Skyline** 渲染引擎 + **Glass-easel** 组件框架 + 微信云开发。

- 开发工具：微信开发者工具
- AppID: `wx15fdbb386a82eab3`
- 无 npm 依赖，无需构建命令
- 云开发环境：需在 `app.js` 中配置 `env` 参数

## 确认策略

**需要确认：**
- 删除文件或目录
- 进入计划模式 (EnterPlanMode)
- Git push 到远程仓库
- 修改 git 配置
- 执行破坏性的 git 操作（force push, hard reset 等）
- 删除或修改数据库数据
- 修改系统配置文件

**无需确认，直接执行：**
- 创建、编辑、读取文件
- 运行测试、构建命令
- Git commit（本地提交）
- 代码搜索、文件搜索
- 安装依赖包
- 代码重构和优化
- Bug 修复、添加新功能
- 所有其他日常开发操作

## 目录结构

```
├── pages/              # 页面
├── components/         # 通用组件
│   └── navigation-bar/ # 自定义导航栏（全局使用）
├── utils/              # 工具函数
│   ├── api.js          # 云函数 API 统一封装
│   └── util.js         # 通用工具函数
├── cloudfunctions/     # 云函数（后端逻辑）
├── database/           # 数据库结构定义
├── assets/             # 静态资源
├── app.js              # 应用入口（云开发初始化）
├── app.json            # 全局配置
└── app.wxss            # 全局样式
```

## 核心约束

### 环境限制
- **严禁**使用 DOM API (`window`, `document`)
- **严禁**使用 `axios` / `fetch`（使用 `wx.request`）
- **严禁**使用 `<div>`, `<span>`（使用 `<view>`, `<text>`, `<image>`）

### 命名规范
- 文件/目录：**kebab-case**（如 `user-profile`, `nav-bar`）
  - ✅ `pages/user-detail/index.js`
  - ❌ `pages/UserDetail/index.js`
- 组件类名：PascalCase（如 `class NavigationBar`）

### 样式规范
- 长度单位：必须使用 `rpx`（1rpx = 0.5px @ iPhone 6）
- 命名：BEM 命名法（`.block__element--modifier`）
- 布局：优先使用 Flex 或 Grid，避免 `position: absolute/fixed`

### Skyline 特有注意事项
- 已启用自定义导航 (`"navigationStyle": "custom"`)，所有页面需引入 `<navigation-bar>` 组件
- `display: flex` 是默认行为，需显式声明布局意图
- 对 `position: absolute/fixed` 支持与 Webview 有差异

### Skyline 布局常见问题与解决方案

#### 问题 1：自定义组件不占据空间
**现象**：自定义组件（如 `navigation-bar`）在页面中不占据预期高度，导致后续内容上移覆盖。
**原因**：自定义组件创建"虚拟节点"，在 Skyline 模式下默认没有正确的布局属性。
**解决方案**：用 view 包裹组件并设置固定高度：
```wxml
<view class="nav-bar-container">
  <navigation-bar ...></navigation-bar>
</view>
```
```css
.nav-bar-container {
  width: 100%;
  height: 91px;  /* 状态栏 + 标题栏高度 */
}
```

#### 问题 2：scroll-view 内横向滚动容器高度塌陷
**现象**：横向滚动列表的内容被下方元素遮挡。
**原因**：Skyline 模式下，未设置明确高度的容器可能高度塌陷为 0。
**解决方案**：必须为横向滚动容器设置明确高度：
```css
.horizontal-scroll-container {
  width: 100%;
  height: 140rpx;  /* 根据内容计算 */
}
```

#### 问题 3：CSS Grid 布局不生效
**现象**：`grid-template-columns` 等属性不生效，元素纵向排列。
**原因**：Skyline 对 CSS Grid 支持有限。
**解决方案**：改用 Flex 布局实现网格效果：
```css
/* 2x2 网格 */
.grid-container {
  display: flex;
  flex-wrap: wrap;
}
.grid-item {
  width: 50%;
}
```

#### 问题 4：page 使用 flex 布局导致子元素异常
**现象**：使用 `display: flex` 的 page 内，子元素高度计算异常。
**解决方案**：page 使用 block 布局，子元素用 calc 计算高度：
```css
page {
  display: block;
  height: 100%;
}
.page-scroll {
  height: calc(100vh - 91px);
}
```

#### 问题 5：导航栏高度在不同设备上不一致
**现象**：iPhone 13 Pro Max 等设备上导航栏高度不正确。
**解决方案**：使用 API 动态计算：
```typescript
const windowInfo = wx.getWindowInfo()
const menuButton = wx.getMenuButtonBoundingClientRect()
const statusBarHeight = windowInfo.statusBarHeight
const titleBarHeight = menuButton.height + (menuButton.top - statusBarHeight) * 2
const navBarHeight = statusBarHeight + titleBarHeight
```

### SetData 优化
- 严禁在循环或滚动监听中频繁调用 `setData`
- 数据包大小限制在 256KB 以内
- 仅更新变化的数据：`this.setData({ 'list[0].text': 'new' })`

### WXML 规范
- 控制流使用 `<block wx:if="...">` 或 `<block wx:for="...">` 包装
- 图片资源建议使用 CDN 链接，本地图片仅限小图标

## 架构模式

### 云函数统一结构

云函数采用 action 分发模式，所有函数遵循相同结构：

```javascript
exports.main = async (event, context) => {
  const { action, params = {} } = event
  switch (action) {
    case 'create': return await create(openid, params)
    case 'list': return await list(openid, params)
    // ...
  }
}
```

**返回值规范**：
- 成功：`{ code: 0, message: 'success', data: {...} }`
- 参数错误：`{ code: 1001, message: '...' }`
- 未授权：`{ code: 1002, message: '未授权' }`
- 资源不存在：`{ code: 1003, message: '资源不存在' }`
- 权限不足：`{ code: 1004, message: '权限不足' }`
- 数据库错误：`{ code: 2001, message: '数据库操作失败' }`

### API 调用

前端统一通过 `utils/api.js` 调用云函数，已封装错误处理：

```javascript
const api = require('../../utils/api')
// 调用示例
const tanks = await api.tankList({ page: 1, pageSize: 20 })
```

### 数据库集合

- `users` - 用户表 (openid 唯一)
- `tanks` - 鱼缸表
- `fish` - 鱼类记录
- `fish_species` - 鱼种库（预设数据）
- `equipment` - 设备表
- `feeding_records` / `feeding_schedules` - 喂食记录/计划
- `water_change_records` / `water_change_schedules` - 换水记录/计划
- `water_quality_records` - 水质记录

所有用户数据通过 `userId` (openid) 关联，支持软删除 (`status: 'archived'`)。

## 提交检查清单

1. 检查是否存在以大写字母开头的文件名
2. 确认 `console.log` 已在生产环境代码中清理
3. 确认未引入不支持的 NPM 包（依赖 Node.js runtime 的包）

## 工作偏好

- 优先使用现有代码风格和架构
- 避免过度工程化，保持简单直接
- 直接执行操作，不要过度询问
- 遇到问题时主动提供解决方案
- 支持中文 commit message

## Skyline 布局问题调试 SOP

当遇到 Skyline 模式下的布局问题（元素位置异常、高度塌陷、多余空白等）时，按以下步骤排查：

### 第一步：精确定位问题

1. **获取具体数值** - 使用调试日志输出关键尺寸：
   ```typescript
   console.log('实际高度:', element.height)
   console.log('期望高度:', expectedHeight)
   console.log('差值:', element.height - expectedHeight)
   ```
2. **截图标注** - 标出问题区域的像素范围
3. **确认问题边界** - 是组件内部问题还是组件与容器的交互问题

### 第二步：检查已知约束

**先查阅本文档的「Skyline 布局常见问题」章节**，确认是否为已知问题：
- 自定义组件高度问题 → 使用 wrapper 方案
- scroll-view 高度塌陷 → 设置明确高度
- CSS Grid 不生效 → 改用 Flex
- page flex 布局异常 → 改用 block + calc

### 第三步：使用已验证方案

**优先使用简单、已验证的方案，避免探索性修复**：

| 问题类型 | 推荐方案 | 避免尝试 |
|---------|---------|---------|
| 自定义组件不占空间 | view wrapper + 固定高度 | :host 选择器、virtualHost |
| 元素高度异常 | 内联 style 设置高度 | 复杂 CSS 计算 |
| flex 布局异常 | 显式设置 flex-shrink: 0 | transform tricks |

**Wrapper 方案标准写法**：
```wxml
<view class="nav-wrapper" style="height: 91px; overflow: hidden; background: #fff;">
  <navigation-bar ...></navigation-bar>
</view>
```

### 第四步：单步验证

1. **每次只改一处** - 修改后立即在开发者工具验证
2. **检查 WXML 语法** - 编辑后确认无标签闭合错误
3. **强制重新编译** - 修改后点击「编译」按钮，避免缓存问题

### 常见低效行为（避免）

❌ **随机尝试 CSS 属性** - 不理解原因就尝试 `border-bottom: 1rpx solid transparent`、`transform: translateZ(0)` 等 hack
❌ **同时修改多处** - 无法确定哪个修改生效
❌ **尝试高级特性** - 如 `:host`、`virtualHost` 等，在简单方案有效时不必要
❌ **忽略编辑错误** - 字符串替换可能产生重复标签，需立即验证

### 调试检查清单

- [ ] 问题是否在「Skyline 布局常见问题」中有记录？
- [ ] 是否涉及自定义组件？→ 优先考虑 wrapper 方案
- [ ] 修改后是否检查了 WXML 语法？
- [ ] 是否点击了「编译」按钮强制刷新？

---

## 弹窗覆盖 TabBar 问题 SOP

### 问题描述

**现象**：页面弹窗（popup/modal）无法覆盖底部自定义 TabBar，TabBar 始终显示在弹窗上方。

**根本原因**：Skyline + Glass-easel 模式下，**自定义 TabBar 组件与页面内容在不同的渲染层**，CSS z-index 无法跨层竞争。

### ❌ Badcase（错误方案）

以下方案在 Skyline 模式下**均无效**，不要尝试：

#### 错误方案 1：调整 z-index
```css
/* 无效！z-index 无法跨渲染层 */
.popup-mask {
  position: fixed;
  z-index: 1000;  /* 即使设置很高也无效 */
}

/* custom-tab-bar/index.wxss */
.tab-bar {
  z-index: 500;  /* TabBar 的 z-index 更低但仍在上层 */
}
```
**失败原因**：TabBar 在独立渲染层，与页面内容的 z-index 不在同一堆叠上下文。

#### 错误方案 2：将弹窗移到 page-container 外部
```wxml
<view class="page-container">
  <!-- 页面内容 -->
</view>

<!-- 尝试将弹窗放在 page-container 外部 -->
<view class="popup-mask" style="position: fixed; z-index: 9999;">
  ...
</view>
```
**失败原因**：无论弹窗在 WXML 中的位置如何，都无法与 TabBar 的渲染层竞争。

#### 错误方案 3：使用 CSS transform hack
```css
/* 无效！这类 hack 在 Skyline 不起作用 */
.popup-mask {
  transform: translateZ(9999px);
}
```
**失败原因**：Skyline 渲染引擎对这类 CSS hack 不敏感。

### ✅ Goodcase（正确方案）

**核心思路**：既然无法让弹窗覆盖 TabBar，就在弹窗显示时**隐藏 TabBar**。

#### 步骤 1：修改 custom-tab-bar 组件支持隐藏

```javascript
// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    hidden: false,  // 添加隐藏控制属性
    // ...其他属性
  }
})
```

```wxml
<!-- custom-tab-bar/index.wxml -->
<view class="tab-bar" wx:if="{{!hidden}}">
  <!-- TabBar 内容 -->
</view>
```

#### 步骤 2：在页面中控制 TabBar 显示/隐藏

```typescript
// pages/xxx/xxx.ts
Page({
  // 打开弹窗时隐藏 TabBar
  onOpenPopup() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: true })
    }
    this.setData({ showPopup: true })
  },

  // 关闭弹窗时恢复 TabBar
  onClosePopup() {
    this.setData({ showPopup: false })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: false })
    }
  }
})
```

#### 步骤 3：在 Behavior 中使用（如果使用了 Behavior 模式）

```typescript
// behaviors/xxx-behavior.ts
export const xxxBehavior = Behavior({
  methods: {
    onAddXxx() {
      // 隐藏 TabBar
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ hidden: true })
      }
      this.setData({ showXxxPopup: true })
    },

    onCloseXxxPopup() {
      this.setData({ showXxxPopup: false })
      // 恢复显示 TabBar
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ hidden: false })
      }
    }
  }
})
```

### 关键要点

1. **使用 `wx:if` 而非 CSS display:none**：确保 TabBar 完全从渲染树移除
2. **防御性检查 getTabBar**：使用 `typeof this.getTabBar === 'function' && this.getTabBar()` 避免报错
3. **成对操作**：每个打开弹窗的方法都要有对应的关闭方法来恢复 TabBar
4. **所有弹窗统一处理**：项目中所有弹窗都需要添加此逻辑，包括：
   - 添加记录弹窗
   - 编辑弹窗
   - 详情弹窗
   - 确认对话框等

### 检查清单

- [ ] custom-tab-bar 是否添加了 `hidden` 属性？
- [ ] custom-tab-bar 的 WXML 是否使用 `wx:if="{{!hidden}}"` 条件渲染？
- [ ] 所有弹窗的打开方法是否调用了 `getTabBar().setData({ hidden: true })`？
- [ ] 所有弹窗的关闭方法是否调用了 `getTabBar().setData({ hidden: false })`？
- [ ] 是否在真机上验证了弹窗覆盖效果？
