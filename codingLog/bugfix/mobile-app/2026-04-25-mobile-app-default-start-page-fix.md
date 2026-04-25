# Mobile App Default Start Page Fix

## 基本信息

- 日期：2026-04-25
- 分类：bugfix
- 模块：mobile-app
- 相关文件：`mobile-app/src/app/App.tsx`

## 问题现象

- 移动端首开页面时，会出现一次自动滑向 AI 对话页的动画。
- 首屏虽然一开始停在 Dashboard，但约 100ms 后聊天输入区会被推进可视区域，视觉上表现为“自动切到对话页”。
- 该异常会继续干扰后续手势切页，导致状态判断和可见页面不一致。

## 根因分析

- 根因不在 `200vw` 双屏布局本身，也不在浏览器原生 `scrollX` 恢复。
- `App.tsx` 在 `messages` 变化后始终调用 `messagesEndRef.scrollIntoView({ behavior: 'smooth' })`。
- 由于消息锚点位于右侧离屏的 AI 对话页，首次渲染时这次 `scrollIntoView` 会尝试把离屏节点带进视口。
- Playwright 移动端采样结果显示：
  - 初始时聊天输入框 `left ≈ 406`，位于屏幕右侧不可见区域。
  - 首开约 100ms 后聊天输入框 `left ≈ 36`，已经进入可视区域。
  - 同时 `window.scrollX`、`document.documentElement.scrollLeft` 始终为 `0`。
- 这说明问题是离屏聊天页被滚动对齐逻辑拉进了视口，而不是文档本身发生了横向滚动恢复。

## 修复方案

- 移除对离屏消息锚点的 `scrollIntoView` 依赖。
- 新增聊天滚动容器 ref，改为只对聊天页自己的纵向滚动容器执行 `scrollTo({ top: scrollHeight })`。
- 将消息自动滚底限制为 `currentView === 1` 时才触发，避免 Dashboard 首屏阶段去操作右侧离屏聊天区。
- 为横向分页容器补充 `initial={false}`，阻止分页容器在首帧执行不必要的初始化动画。

## Playwright 验证

- 使用 Playwright + Chromium 移动端视口复现并采样首开状态。
- 修复前：
  - 聊天输入框会在首开约 100ms 后从屏幕右侧进入可视区。
  - 页面视觉上出现自动滑向对话页的动画。
- 修复后：
  - 聊天输入框在 0ms、100ms、300ms、800ms、1600ms 采样点都保持在屏幕右侧离屏位置，`left ≈ 406`。
  - `window.scrollX` 持续为 `0`，分页容器保持在 Dashboard 起始位置。
- 结论：默认起始页异常已修复。

## 影响范围

- 影响 `mobile-app` 首页默认落点和首开动画行为。
- 不影响 Dashboard 与 AI 对话页的既有分页结构。
- 聊天页消息自动滚底仍保留，但只会在进入聊天页后触发。
