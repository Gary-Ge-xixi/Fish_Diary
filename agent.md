# 微信小程序开发规范 (Agent Rules)

## 0. 核心原则 (Critical Directives)
- **环境限制**: 这是一个微信小程序项目，**严禁**使用 DOM API (如 `window`, `document`)。
- **排版单位**: 必须使用 `rpx` 作为主要长度单位 (1rpx = 0.5px @ iPhone 6)。
- **渲染引擎**: ⚠️ 本项目使用 **Skyline** 渲染引擎 + **Glass-easel** 组件框架。
  - 避免复杂的 CSS 选择器。
  - 布局尽量使用 Flex 或 Grid，减少深层嵌套。

## 1. 命名与文件规范 (Naming & Structure)
- **文件/目录命名**: 必须使用 **kebab-case** (例如 `user-profile`, `nav-bar`)。
  - ✅ `pages/user-detail/index.js`
  - ❌ `pages/UserDetail/index.js`
- **组件命名**: 引用时使用 kebab-case，类名使用 PascalCase (如 `class NavigationBar`)。
- **目录结构**:
  ```text
  ├── pages/            # 页面 (Pages)
  ├── components/       # 通用组件 (Components)
  ├── utils/            # 工具函数 (Utilities) - 纯逻辑，无 UI
  ├── assets/           # 静态资源 (Images, Styles)
  └── app.json          # 全局配置
  ```

## 2. 代码编写规范 (Coding Standards)

### WXML (视图层)
- 使用 `<view>`, `<text>`, `<image>` 等原生组件，**禁用** `<div>`, `<span>`。
- 控制流使用 `<block wx:if="...">` 或 `<block wx:for="...">` 包装，避免增加渲染层级。
- 图片资源建议使用 CDN 链接，本地图片仅限小图标。

### WXSS (样式层)
- 遵循 BEM 命名法 (建议): `.block__element--modifier` 或简化的 `.page-section-title`。
- 颜色值推荐使用 CSS 变量（如果在 `root` 定义了主题）。

### JS/TS (逻辑层)
- **SetData 优化**:
  - 严禁在循环或滚动监听中频繁调用 `setData`。
  - 数据包大小限制在 256KB 以内。
  - 仅更新变化的数据 (例如 `this.setData({ 'list[0].text': 'new' })`)。
- **API 调用**:
  - 使用 `wx.request`，**禁用** `axios` / `fetch` (除非已封装 adapter)。
  - 使用 `wx.getStorage`, `wx.setStorage` 进行本地存储。

## 3. Skyline 特有注意事项
- **导航栏**: 已启用自定义导航 (`"navigationStyle": "custom"`). 所有页面需引入 `<navigation-bar>` 组件。
- **布局**: Skyline 对 `position: absolute/fixed` 的支持与 Webview 有差异，优先使用 Flex 布局解决定位问题。
- **样式**: `display: flex` 是默认行为（在某些配置下），确保显式声明布局意图。

## 4. 提交检查清单 (Pre-commit Checklist)
1. 检查是否存在以大写字母开头的文件名。
2. 确认 `console.log` 已在生产环境代码中清理。
3. 确认未引入不支持的 NPM 包 (依赖 Node.js runtime 的包)。
