# Mobile App Swipe Gesture Fix

## 基本信息

- 日期：2026-04-25
- 分类：bugfix
- 模块：mobile-app
- 相关文件：`mobile-app/src/app/App.tsx`

## 问题现象

- 在移动端设备模拟下，`mobile-app` 页面左右滑动无法切换 Dashboard 和 AI 对话页。
- 桌面端鼠标拖拽切页正常，问题只出现在触摸手势链路。

## 根因分析

- 页面切换依赖外层 `motion.div` 的横向拖拽。
- 移动端实际接收触摸事件的是内部多个 `overflow-y-auto` 的滚动容器。
- 浏览器会优先把手势分配给这些纵向滚动层，导致父级拿不到稳定的横向拖拽事件。

## 修复方案

- 在 `mobile-app/src/app/App.tsx` 增加 `touchstart`、`touchmove`、`touchend` 兜底逻辑，自行判断横向滑动并切页。
- 把 `touchAction: 'pan-y'` 下放到实际滚动容器，减少纵向滚动和横向切页的冲突。
- 对 `input`、`button` 等交互元素做忽略处理，避免输入和点击时误触发切页。

## 影响范围

- 影响 `mobile-app` 的 Dashboard 和 AI 对话页之间的移动端手势切换。
- 不影响桌面端拖拽切页行为。

## 验证结果

- 桌面端原有拖拽切页行为保留。
- 移动端模拟下，左右滑动可重新触发页面切换，同时仍可纵向滚动页面内容。

## 后续注意事项

- 以后如果继续修改手势逻辑，优先检查滚动容器与拖拽容器的事件竞争关系。
