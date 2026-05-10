# mobile-app 告警功能 MVP 前端实现计划

## 基本信息

- 日期：2026-05-10
- 分类：docs
- 模块：mobile-app
- 相关文件：
  `codingLog/docs/mobile-app/2026-05-10-alert-feature-mvp-analysis.md`
  `codingLog/docs/mobile-app/2026-05-10-mobile-app-backend-integration-analysis.md`
  `docs/光伏监测系统接入Agent指南.md`
  `mobile-app/package.json`
  `mobile-app/src/main.tsx`
  `mobile-app/src/app/App.tsx`

## 问题现象

- 当前 `mobile-app` 是 React 18 + Vite 的单页演示原型，入口只有 `src/main.tsx`，业务逻辑几乎全部堆在 `src/app/App.tsx`。
- 告警列表、告警详情、AI 对话、首页发电看板都由本地 seed 数据驱动，页面状态通过本地 `useState` 直接切换，没有真实接口层。
- 告警状态当前使用 `pending / processing / resolved` 三态，但后端文档中的核心状态是 `OPEN / RECOVERED / CLOSED`，两边模型并不一致。
- 告警详情页里大量展示内容没有后端来源，例如 AI 置信度、原因分析、推荐动作、历史工单命中、预计损失、推送状态、推荐追问。

## 根因分析

- 现有前端缺少最基础的接入设施：请求封装、环境变量、接口类型、字段适配、统一错误处理。
- 当前 `App.tsx` 同时承担了页面容器、手势切页、弹层、seed 数据、告警状态流转、AI 对话生成等职责，直接在这个文件里插入接口调用会继续放大维护成本。
- 依赖清单中没有 `axios`、`react-query`、`swr` 一类数据层库，但已有 `sonner` 可用于提示，因此最稳妥的方案是先基于浏览器原生 `fetch` 搭一个轻量接入层。
- 后端可直接支撑的是“告警查询 + 详情 + ack + close + trend + station status”，并不能直接支撑当前 demo 的完整高保真效果，因此前端必须主动收缩展示范围。

## 实现目标

### MVP 要交付的能力

- 首页中的告警卡片改为真实接口数据。
- 告警详情弹层改为真实接口数据。
- 详情页趋势图改为 `GET /api/inverters/{sn}/trend` 数据。
- 告警支持 `ack` 与 `close`。
- 页面具备加载态、空态、错误态、手动刷新。
- 支持进入页面自动拉取，必要时加 30 到 60 秒轮询。

### 明确不纳入本次计划的能力

- Redis 直连浏览器的实时订阅。
- AI 对话真实化。
- 历史工单命中、AI 原因分析、推荐动作自动生成。
- 首页发电总览和发电趋势真实化。
- “处理中”这类强依赖前后端统一状态模型的中间态闭环。

## 当前前端现状梳理

### 技术栈和可复用基础

- 框架是 React 18 + Vite，适合继续走函数组件 + hooks 的轻量改造路线。
- 项目已有 `recharts`，趋势图不需要换图表库。
- 项目已有 `sonner`，可以直接承担接口成功/失败提示。
- 项目没有现成路由和数据管理框架，不建议这次顺手引入大体量基础设施。

### 当前代码结构问题

- `App.tsx` 顶部直接定义 `AlertItem`、`alertsSeedData`、`initialMessages` 等类型与演示数据，说明业务数据层和展示层没有边界。
- `handleAlertStatus` 只做本地 `setAlerts`，没有任何异步提交、回滚或错误处理逻辑。
- `selectedAlert.trend`、`selectedAlert.metrics`、`selectedAlert.causes`、`selectedAlert.tickets` 等字段都假设详情数据是一次性完整返回，但后端文档并不是这种结构。
- 首页与详情页对同一批告警数据存在重复消费，但当前没有统一的 adapter 和派生字段，后续联调很容易在多个位置重复写转换逻辑。

### 必须收缩的 UI 区域

- 告警详情页中的 `AI 诊断与建议动作`、`历史工单命中`、`推荐追问` 默认应隐藏或替换为静态占位。
- 顶部 “AI 置信度”“损失评估”“Push Status” 没有稳定后端来源，MVP 内不应继续作为真实数据承诺。
- 底部 `标记处理中` 按钮要改成 `确认接手` 或 `ack`，不能继续假装存在稳定的 `processing` 状态。
- `同步到 AI 对话` 按钮如果保留，只能作为演示入口，不应影响本次告警联调闭环。

## 实现原则

1. 不做重型重构，但要把告警相关逻辑从 `App.tsx` 中抽离到独立模块。
2. 不引入新的数据框架，优先使用 `fetch + hooks + adapter`，把依赖变更控制到最小。
3. 先做“可查、可看、可 ack、可 close”，再考虑体验增强。
4. 所有前端展示状态都以后端真实字段为主，前端临时态只用于请求过程反馈，不用于替代业务状态。
5. 没有后端数据来源的卡片宁可先隐藏，也不要继续使用高完成度假数据冒充已联调页面。

## 详细实现方案

### 一、目录拆分方案

建议最少拆出以下目录，不要求一次性组件化到底，但必须把接口和适配逻辑从 `App.tsx` 拆走：

```text
mobile-app/src/app/
├─ App.tsx
├─ services/
│  ├─ http.ts
│  └─ alerts.ts
├─ modules/
│  └─ alerts/
│     ├─ types.ts
│     ├─ adapters.ts
│     ├─ hooks.ts
│     └─ constants.ts
└─ components/
   └─ alerts/
      ├─ AlertListSection.tsx
      ├─ AlertDetailSheet.tsx
      └─ AlertStateView.tsx
```

拆分原则：

- `App.tsx` 继续保留切屏、弹层开关、总体布局。
- `services/http.ts` 只负责请求、异常、`baseURL`。
- `services/alerts.ts` 只负责接口函数。
- `modules/alerts/adapters.ts` 负责后端字段到前端展示模型的转换。
- 告警列表与详情弹层至少拆成独立组件，避免继续在 `App.tsx` 内混排 2000 多行 JSX。

### 二、接口基础层设计

新增环境变量：

- `VITE_API_BASE_URL`

`http.ts` 建议能力：

- 统一拼接 `baseURL`。
- 统一 JSON 解析。
- 统一处理 `{ success, data, message }` 返回格式。
- 非 2xx 或 `success !== true` 时抛出标准错误对象。
- 支持 `AbortController`，避免用户切换告警详情时旧请求回填。

建议接口函数：

- `getAlerts(params)`
- `getAlertDetail(alertId)`
- `ackAlert(alertId)`
- `closeAlert(alertId, operatorNote?)`
- `getInverterTrend(sn, params)`
- `getStationStatus(stationId)`

### 三、类型与 adapter 设计

建议把“后端原始类型”和“页面展示类型”分开，不要直接拿接口字段在页面里渲染。

后端原始类型至少包括：

- `ApiAlertListItem`
- `ApiAlertDetail`
- `ApiTrendPoint`
- `ApiStationStatus`

前端展示类型建议包括：

- `AlertListItemView`
- `AlertDetailView`
- `AlertTrendPointView`
- `AlertActionState`

关键映射规则：

- `severity: WARNING | CRITICAL` -> 页面标签 `warning | critical`
- `status: OPEN | RECOVERED | CLOSED` -> 页面文案 `待处理 | 已恢复 | 已关闭`
- `detected_at` -> `timeLabel`、`dateTimeLabel`
- `station_name` -> 列表卡片副标题
- `inverter_sn + string_index` -> 设备标识文案
- 趋势接口返回值 -> `recharts` 可直接消费的数组

必须明确的展示收口：

- 当前前端的 `info` 级别去掉。
- 当前前端的 `processing` 业务状态去掉。
- `ack` 不当作稳定业务状态，只作为“已接手”动作反馈。
- 如果详情接口没有返回用于卡片展示的丰富字段，页面就只展示真实基础信息、时间线和趋势图。

### 四、页面状态与 hooks 设计

建议最少拆两个 hooks：

- `useAlertsList`
- `useAlertDetail`

`useAlertsList` 负责：

- 首次加载列表
- 手动刷新
- 可选轮询
- 当前列表错误态
- 当前操作中的 `ack/close` loading 状态

`useAlertDetail` 负责：

- 根据选中告警拉取详情
- 根据详情中的 `inverter_sn`、`string_index` 再拉趋势
- 切换告警时取消上一个详情请求
- 合并详情加载态和趋势加载态

状态设计建议：

- 列表和详情分开维护，避免单个请求失败拖垮整个页面。
- 对 `ack`、`close` 做单条记录级别 loading，避免整个详情页按钮全部锁死。
- `close` 成功后刷新详情与列表；`ack` 成功后至少刷新详情，必要时局部更新列表。

### 五、页面改造清单

#### 1. 首页告警区域

- 用 `GET /api/alerts?status=OPEN` 替换 `alertsSeedData`。
- 只保留真正与告警相关的 KPI，例如活跃告警数、最高等级告警数。
- 对当前“关键告警卡片”增加三种状态：
  - loading：骨架屏
  - empty：暂无告警
  - error：加载失败，可重试

#### 2. 告警详情弹层

- 进入弹层后按 `selectedAlertId` 拉详情，不再依赖列表 seed 中的完整对象。
- 页面头部统计改为基于真实列表计算的 `OPEN / RECOVERED / CLOSED` 数量。
- 顶部大卡只保留：
  - 告警标题
  - 严重级别
  - 电站/设备信息
  - 检测时间
  - 当前状态
  - 基础描述
- 趋势图数据改由 trend 接口返回。
- 原本无后端来源的卡片先全部隐藏。

#### 3. 告警动作区

- `标记处理中` 改为 `确认接手`，调用 `POST /api/alerts/{id}/ack`。
- `标记已解决` 改为 `关闭告警`，调用 `POST /api/alerts/{id}/close`。
- `close` 如需备注，可先做简单输入框；如果想压缩工期，可以第一版不填备注，后续再补。
- 每个动作需要具备提交中、成功提示、失败提示。

#### 4. AI 对话区与跨页联动

- 本次不做 AI 真接入，因此 `syncAlertToCopilot` 不再作为主流程依赖。
- 如果产品坚持保留按钮，则标注为“演示模式”，并避免引用不再存在的高级字段。
- 不再要求告警联调必须同步修复 AI 问答逻辑。

### 六、刷新与轮询策略

建议按以下顺序实现：

1. 页面首次进入拉一次列表。
2. 用户打开详情时拉详情和趋势。
3. 用户执行 `ack`/`close` 后主动刷新相关数据。
4. 最后再补可选轮询，间隔 30 到 60 秒。

轮询注意点：

- 只在告警主视图激活时轮询。
- 弹层打开时可以继续轮询列表，但不要频繁重刷详情。
- 如果页面隐藏到后台，暂停轮询，恢复可见时补一次刷新。

## 分阶段实施计划

### Phase 0：接口样例确认

- 与后端确认 `GET /api/alerts/{id}` 的完整返回字段。
- 与后端确认 `GET /api/inverters/{sn}/trend` 的实际点位格式。
- 确认 `ack` 后列表或详情里是否会体现已接手痕迹；如果不会，前端只给操作提示，不设计持久“处理中”态。

交付物：

- 字段样例文档
- 前端 adapter 映射表

预估：0.5 人天

### Phase 1：基础接入层

- 新增 `VITE_API_BASE_URL`
- 新增 `http.ts`
- 新增 `alerts.ts`
- 新增 `types.ts` 与 `adapters.ts`

交付物：

- 可复用请求层
- 告警相关接口函数
- 后端字段到前端字段的统一转换逻辑

预估：0.5 ~ 1 人天

### Phase 2：列表接入

- 首页告警卡片改成真实列表数据
- 补 loading、empty、error、retry
- 调整顶部统计口径，避免继续引用 mock 看板数字

交付物：

- 可联调的告警首页
- 基于接口数据的列表刷新能力

预估：0.5 ~ 1 人天

### Phase 3：详情与趋势接入

- 详情弹层改成详情接口驱动
- 趋势图改成趋势接口驱动
- 下线无后端来源的详情模块

交付物：

- 可打开、可查看、可重试的告警详情页
- 与后端真实字段对齐的趋势图

预估：1 人天

### Phase 4：ack / close 动作接入

- 接入 `ack`
- 接入 `close`
- 补按钮 loading、错误提示、成功刷新

交付物：

- 告警操作闭环
- 操作后列表和详情一致更新

预估：0.5 ~ 1 人天

### Phase 5：轮询、回归与收尾

- 加页面级刷新策略
- 加可选轮询
- 完成异常路径回归
- 清理残留 mock 文案

交付物：

- 可演示、可联调的 MVP 版本
- 回归清单

预估：0.5 ~ 1 人天

## 验收标准

- 首页告警列表不再依赖 `alertsSeedData`。
- 打开任一告警详情时，详情内容来自真实接口，不依赖列表携带的完整 mock 对象。
- 趋势图来自 `GET /api/inverters/{sn}/trend`。
- `ack` 和 `close` 都能实际调用后端，并在 UI 中给出明确反馈。
- 页面具备 loading、empty、error、retry。
- 详情页中没有继续承诺后端并未提供的 AI/工单/损失评估等真实能力。

## 联调与测试清单

- 列表默认查询是否正确带 `status=OPEN`。
- 严重级别标签是否正确映射。
- 时间格式是否统一为本地时区可读格式。
- 切换不同告警时，详情与趋势是否存在旧请求串数据。
- `ack` 连续点击是否会重复提交。
- `close` 成功后列表数量和详情状态是否同步更新。
- 后端返回空列表时，首页和详情入口是否正常降级。
- 后端报错、超时、非 `success` 返回时，页面是否有明确错误提示。
- 页面从后台恢复时，是否能自动刷新到最新告警状态。

## 风险与依赖

- 最大风险不是前端实现，而是详情与趋势字段样例不完整，导致 adapter 反复返工。
- 如果后端 `ack` 没有任何可见回写字段，产品侧要接受“操作成功但状态不变”的短期表现，或者由后端补字段。
- 当前 `App.tsx` 还承载复杂手势和弹层逻辑，拆分时要避免触碰非告警范围，防止把演示交互一起改坏。
- 如果产品要求保留当前所有高保真告警详情卡片，本计划需要升级为“后端补接口 + 前端保留富展示”的下一阶段方案，工期会明显上浮。

## 影响范围

- 主要影响 `mobile-app/src/app/App.tsx` 的告警列表、详情弹层、按钮动作和统计口径。
- 会新增告警相关的 `services`、`modules`、`components` 子目录。
- `AI 对话页` 与 `发电详情页` 本次原则上不做真实化，只做与告警接入解耦。

## 验证结果

- 已核对前端入口结构，确认当前没有现成接口层、数据层和状态同步机制。
- 已核对后端接口清单，确认告警 MVP 主链路可由 `alerts / detail / ack / close / trend / station status` 覆盖。
- 已确认当前 demo 中多项详情卡片没有后端来源，必须在计划中主动降级，而不是继续按完整效果估算。

## 后续注意事项

- 真正开工前，先让后端给出 `alerts detail` 和 `trend` 的真实 JSON 样例，避免前端边写边猜。
- 如果计划文档获批，建议下一步直接补一版更细的任务拆解清单，细到具体文件、函数和联调顺序。
- 如果后续要做浏览器实时告警，单独立项评估 SSE / WebSocket，不要在这次 MVP 中把 Redis 直连浏览器当成既定前提。
