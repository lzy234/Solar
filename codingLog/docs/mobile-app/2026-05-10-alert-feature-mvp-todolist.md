# mobile-app 告警功能 MVP TodoList

## 用途

本清单基于 `codingLog/docs/mobile-app/2026-05-10-alert-feature-mvp-implementation-plan.md` 拆解，用于跨多轮对话持续推进、更新完成状态、记录阻塞项与下一步动作。

建议每轮对话只更新以下 4 个区域：

1. `当前状态`
2. `最近更新记录`
3. 对应任务项的勾选状态
4. `阻塞与待确认`

## 状态约定

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[!]` 阻塞

## 当前状态

- 当前阶段：`Phase 5`
- 总体状态：`进行中`
- 当前目标：`补齐刷新策略、异常路径与残留清理，完成可演示 MVP 收尾`
- 下一步：`开始整理 Phase 5 的页面刷新 / 轮询策略与回归项`
- 最后更新：`2026-05-10`

## 最近更新记录

| 日期 | 更新人 | 变更内容 | 结果 |
| --- | --- | --- | --- |
| 2026-05-10 | Codex | 完成 Phase 4：详情页底部新增“确认接手 / 关闭告警”真实动作，接入 `ack/close` 接口、提交中禁用态、成功/失败 toast 与列表/详情刷新闭环 | 已完成 |
| 2026-05-10 | Codex | 修复 Phase 3 回归：`App.tsx` 中 `Sparkles`、`AlertTriangle`、`CheckCircle`、`ArrowRight`、`X` 仍被引用但未从 `lucide-react` 导入，导致详情改造后页面运行时报 `ReferenceError` | 已修复 |
| 2026-05-10 | Codex | 新增 `useAlertDetail`、`AlertDetailSheet`、`AlertStateView`，告警详情与趋势图切到 `GET /api/alerts/{id}` 和 `GET /api/inverters/{sn}/trend`，并收口无真实来源模块 | 已完成 |
| 2026-05-10 | Codex | 新增 `useAlertsList` 与 `AlertListSection`，首页告警列表切到 `GET /api/alerts?status=OPEN`，补齐 loading/empty/error/retry 与真实 KPI | 已完成 |
| 2026-05-10 | Codex | 根据实现计划初始化多轮维护用 TodoList | 已创建 |
| 2026-05-10 | Codex | 基于预发真实接口补齐 detail/trend 样例、ack/close 约束与 adapter 映射文档，完成 Phase 0 | 已完成 |
| 2026-05-10 | Codex | 新增 `http.ts`、`alerts.ts`、`types.ts`、`adapters.ts`、`.env.example` 与 `vite-env.d.ts`，完成 Phase 1 基础接入层 | 已完成 |

## 阻塞与待确认

- [已确认] `GET /api/alerts/{id}` 的真实 JSON 样例已沉淀到 [2026-05-10-alert-feature-phase0-api-confirmation.md](D:/Project/Solar/codingLog/docs/mobile-app/2026-05-10-alert-feature-phase0-api-confirmation.md:1) 与 [光伏监测系统接入Agent指南.md](D:/Project/Solar/docs/光伏监测系统接入Agent指南.md:283)。
- [已确认] `GET /api/inverters/{sn}/trend` 的真实 JSON 样例已沉淀到 [2026-05-10-alert-feature-phase0-api-confirmation.md](D:/Project/Solar/codingLog/docs/mobile-app/2026-05-10-alert-feature-phase0-api-confirmation.md:1) 与 [光伏监测系统接入Agent指南.md](D:/Project/Solar/docs/光伏监测系统接入Agent指南.md:418)。
- [已确认] `ack` 后列表和详情均可使用 `acked_at` 作为“已接手”回写字段；不再设计持久 `processing` 状态。
- [已确认] `close` 请求体必传，但 `operator_note` 按 OpenAPI schema 推断可空且非必填；第一版可先不做备注输入框。
- [ ] 需确认是否保留“同步到 AI 对话”按钮作为纯演示入口；当前仍保留为演示入口，不影响 Phase 4 闭环。

## 任务清单

### Phase 0：接口样例确认

阶段目标：补齐接口样例和字段映射前置条件，避免前端边写边猜。

- [x] 与后端确认 `GET /api/alerts/{id}` 的完整返回字段。
- [x] 与后端确认 `GET /api/inverters/{sn}/trend` 的点位结构、时间字段、数值字段。
- [x] 与后端确认 `ack` 后列表或详情中是否会体现“已接手”痕迹。
- [x] 与产品或后端确认 `close` 是否允许第一版不填备注。
- [x] 输出字段样例文档：[2026-05-10-alert-feature-phase0-api-confirmation.md](D:/Project/Solar/codingLog/docs/mobile-app/2026-05-10-alert-feature-phase0-api-confirmation.md:1)
- [x] 输出 adapter 映射表：[2026-05-10-alert-feature-phase0-api-confirmation.md](D:/Project/Solar/codingLog/docs/mobile-app/2026-05-10-alert-feature-phase0-api-confirmation.md:1)

完成标准：

- [x] 已拿到 detail 与 trend 的真实样例。
- [x] 已明确 `ack` 和 `close` 的联调约束。
- [x] 已有可执行的字段映射依据。

### Phase 1：基础接入层

阶段目标：建立最小可复用接口层与数据适配层。

- [x] 新增 `VITE_API_BASE_URL` 配置。
- [x] 新增 `mobile-app/src/app/services/http.ts`。
- [x] 在 `http.ts` 中完成 `baseURL`、JSON 解析、统一错误处理封装。
- [x] 在 `http.ts` 中支持 `AbortController`。
- [x] 新增 `mobile-app/src/app/services/alerts.ts`。
- [x] 在 `alerts.ts` 中实现 `getAlerts(params)`。
- [x] 在 `alerts.ts` 中实现 `getAlertDetail(alertId)`。
- [x] 在 `alerts.ts` 中实现 `ackAlert(alertId)`。
- [x] 在 `alerts.ts` 中实现 `closeAlert(alertId, operatorNote?)`。
- [x] 在 `alerts.ts` 中实现 `getInverterTrend(sn, params)`。
- [x] 视实际需要实现 `getStationStatus(stationId)`。
- [x] 新增 `mobile-app/src/app/modules/alerts/types.ts`。
- [x] 新增 `mobile-app/src/app/modules/alerts/adapters.ts`。
- [x] 定义后端原始类型：`ApiAlertListItem`、`ApiAlertDetail`、`ApiTrendPoint`、`ApiStationStatus`。
- [x] 定义前端展示类型：`AlertListItemView`、`AlertDetailView`、`AlertTrendPointView`、`AlertActionState`。
- [x] 完成严重级别、状态、时间、设备标识等字段映射。

完成标准：

- [x] 请求层已可复用。
- [x] 告警相关接口函数齐备。
- [x] 页面不直接消费后端原始字段。

### Phase 2：列表接入

阶段目标：把首页告警区域从 seed 数据切到真实接口。

- [x] 用 `GET /api/alerts?status=OPEN` 替换 `alertsSeedData`。
- [x] 新增 `useAlertsList` hook。
- [x] `useAlertsList` 支持首次加载。
- [x] `useAlertsList` 支持手动刷新。
- [x] `useAlertsList` 支持错误态管理。
- [x] `useAlertsList` 支持 `ack/close` 的记录级 loading 状态。
- [x] 拆出 `mobile-app/src/app/components/alerts/AlertListSection.tsx`。
- [x] 增加列表 `loading` 状态。
- [x] 增加列表 `empty` 状态。
- [x] 增加列表 `error` 状态。
- [x] 增加列表 `retry` 操作。
- [x] 调整顶部统计口径，只保留真实告警相关 KPI。
- [x] 移除或停止引用 mock 看板数字。

完成标准：

- [x] 首页告警列表不再依赖本地 seed。
- [x] 列表支持刷新和失败重试。
- [x] 页面统计口径与真实接口一致。

### Phase 3：详情与趋势接入

阶段目标：把详情弹层和趋势图切到真实接口，并收缩无后端来源的展示。

- [x] 新增 `useAlertDetail` hook。
- [x] `useAlertDetail` 支持按 `selectedAlertId` 拉取详情。
- [x] `useAlertDetail` 支持根据 `inverter_sn`、`string_index` 拉取趋势。
- [x] `useAlertDetail` 支持切换告警时取消旧请求。
- [x] `useAlertDetail` 合并详情与趋势加载状态。
- [x] 拆出 `mobile-app/src/app/components/alerts/AlertDetailSheet.tsx`。
- [x] 拆出 `mobile-app/src/app/components/alerts/AlertStateView.tsx`。
- [x] 详情弹层不再依赖列表中携带的完整 mock 对象。
- [x] 顶部大卡仅保留真实可用字段。
- [x] 趋势图改为消费 `GET /api/inverters/{sn}/trend` 数据。
- [x] 隐藏 `AI 诊断与建议动作` 模块。
- [x] 隐藏 `历史工单命中` 模块。
- [x] 隐藏 `推荐追问` 模块。
- [x] 移除无真实来源的 `AI 置信度`、`损失评估`、`Push Status` 承诺型展示。

完成标准：

- [x] 任一告警详情都来自真实接口。
- [x] 趋势图不再使用 mock 数据。
- [x] 无后端来源模块已收口或隐藏。

### Phase 4：ack / close 动作接入

阶段目标：打通告警操作闭环。

- [x] 将 `标记处理中` 改为 `确认接手`。
- [x] 将 `确认接手` 接到 `POST /api/alerts/{id}/ack`。
- [x] 将 `标记已解决` 改为 `关闭告警`。
- [x] 将 `关闭告警` 接到 `POST /api/alerts/{id}/close`。
- [x] 视最终约定决定是否补 `operatorNote` 输入框。
- [x] 为 `ack` 增加提交中状态。
- [x] 为 `ack` 增加成功提示。
- [x] 为 `ack` 增加失败提示。
- [x] 为 `close` 增加提交中状态。
- [x] 为 `close` 增加成功提示。
- [x] 为 `close` 增加失败提示。
- [x] `ack` 成功后至少刷新详情，必要时局部刷新列表。
- [x] `close` 成功后刷新列表与详情。
- [x] 避免连续点击导致重复提交。

完成标准：

- `ack` 与 `close` 已实际调用后端。
- UI 对操作结果有明确反馈。
- 列表与详情状态更新一致。

### Phase 5：轮询、回归与收尾

阶段目标：补齐刷新策略、异常路径与残留清理，形成可演示 MVP。

- [ ] 页面首次进入自动拉取列表。
- [ ] 用户打开详情时自动拉取详情与趋势。
- [ ] `ack/close` 后主动刷新相关数据。
- [ ] 增加页面级刷新策略。
- [ ] 增加可选轮询，间隔控制在 30 到 60 秒。
- [ ] 仅在告警主视图激活时轮询。
- [ ] 页面隐藏到后台时暂停轮询。
- [ ] 页面恢复可见时补一次刷新。
- [ ] 弹层打开时避免频繁重刷详情。
- [ ] 回归空列表降级逻辑。
- [ ] 回归超时、报错、非 `success` 返回逻辑。
- [ ] 回归告警切换时旧请求串数据问题。
- [ ] 清理残留 mock 文案。
- [ ] 清理不再真实可用的误导性卡片或按钮文案。

完成标准：

- 页面具备 loading、empty、error、retry。
- 刷新与轮询策略稳定。
- MVP 可演示、可联调、可回归。

## 非目标约束

以下内容本轮不作为完成标准，不应反向阻塞 MVP 主链路：

- [ ] Redis 直连浏览器实时订阅
- [ ] AI 对话真实化
- [ ] 历史工单命中真实化
- [ ] AI 原因分析与推荐动作自动生成
- [ ] 首页发电总览与发电趋势真实化
- [ ] `processing` 中间态闭环

说明：这里保留为“非目标清单”，用于后续对齐范围，不表示这些项需要在本轮完成。

## 验收勾选

- [x] 首页告警列表不再依赖 `alertsSeedData`。
- [x] 打开任一告警详情时，详情内容来自真实接口。
- [x] 趋势图来自 `GET /api/inverters/{sn}/trend`。
- [x] `ack` 能实际调用后端并给出 UI 反馈。
- [x] `close` 能实际调用后端并给出 UI 反馈。
- [x] 页面具备 `loading`、`empty`、`error`、`retry`。
- [x] 详情页不再承诺后端未提供的 AI/工单/损失评估等真实能力。

## 建议更新模板

后续每轮对话可直接按以下格式追加：

```md
## 最近更新记录

| 日期 | 更新人 | 变更内容 | 结果 |
| --- | --- | --- | --- |
| 2026-05-11 | Codex | 完成 Phase 1 的 http.ts、alerts.ts、types.ts、adapters.ts | 进行中 |

## 当前状态

- 当前阶段：`Phase 1`
- 总体状态：`进行中`
- 当前目标：`完成基础接入层`
- 下一步：`开始接入首页告警列表`
- 最后更新：`2026-05-11`
```
