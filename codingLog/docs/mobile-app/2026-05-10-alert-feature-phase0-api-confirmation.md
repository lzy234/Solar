# mobile-app 告警功能 MVP Phase 0 接口样例确认

## 目的

沉淀告警 MVP 在开工前必须确认的真实接口样例、联调约束和前端字段映射，避免后续在 `detail`、`trend`、`ack`、`close` 接入时继续猜字段。

确认时间：`2026-05-10`

确认来源：

- 预发 Swagger：`https://solar-system-mon.preview.aliyun-zeabur.cn/docs#/inverters/get_trend_api_inverters__sn__trend_get`
- 预发真实接口返回：
  - `GET /api/alerts/19`
  - `GET /api/inverters/2815030259150047/trend?string_index=1`
- 本地接入说明：[docs/光伏监测系统接入Agent指南.md](D:/Project/Solar/docs/光伏监测系统接入Agent指南.md:283)

## 结论摘要

1. `GET /api/alerts/{id}` 已确认真实返回不止有基础告警字段，还包含 `station_name`、`description`、`raw_context`、`acked_at`、`recovered_at`、`closed_at`、`operator_note`。
2. `GET /api/inverters/{sn}/trend` 的 `data` 是点位数组，每个点至少包含 `time`、`voltage`、`reference_voltage`、`deviation_pct`。
3. `ack` 不提供独立的“处理中”业务状态；当前更可靠的回写痕迹是 `acked_at`。前端不要把 `ack` 设计成持久 `processing` 状态。
4. `close` 的 request body 在 OpenAPI 中是必传的，但 `operator_note` 字段本身是可空且非必填。这里是基于 schema 的推断，不是一次真实 `close` 写操作验证。

## 真实样例

### 1. 告警详情

请求：

```http
GET /api/alerts/19
```

真实返回节选：

```json
{
  "success": true,
  "data": {
    "id": 19,
    "station_id": 1299184320438983069,
    "station_name": "嘉定信业693.915kW光伏项目",
    "inverter_sn": "2806405258160062",
    "string_index": 1,
    "severity": "CRITICAL",
    "status": "RECOVERED",
    "voltage": 745.8,
    "reference_voltage": 834.0,
    "deviation_pct": 10.58,
    "threshold_pct": 10.0,
    "started_at": "2026-05-05T23:10:01.446581+00:00",
    "detected_at": "2026-05-05T23:10:01.446581+00:00",
    "acked_at": null,
    "recovered_at": "2026-05-06T00:23:24.800800+00:00",
    "closed_at": null,
    "dedup_key": "2806405258160062:1:CRITICAL",
    "description": "逆变器 2806405258160062 第 1/2 路直流接口组内电压分别约为 745.8V 和 834.0V，偏差达 10.6%，当前检测值已超过 10.0% 阈值，请安排人工检查。",
    "raw_context": "{\"pac\": 1.03, \"upv\": {\"1\": 745.8, \"2\": 834.0}, ...}",
    "operator_note": null
  }
}
```

### 2. 组串趋势

请求：

```http
GET /api/inverters/2815030259150047/trend?string_index=1
```

真实返回节选：

```json
{
  "success": true,
  "data": [
    {
      "time": "2026-05-10T07:04:21.784000+00:00",
      "voltage": 696.8,
      "reference_voltage": 696.8,
      "deviation_pct": 0.0
    },
    {
      "time": "2026-05-10T07:19:21.707000+00:00",
      "voltage": 702.5,
      "reference_voltage": 702.5,
      "deviation_pct": 0.0
    },
    {
      "time": "2026-05-10T07:34:21.908000+00:00",
      "voltage": 693.3,
      "reference_voltage": 693.3,
      "deviation_pct": 0.0
    }
  ]
}
```

补充约束：

- `string_index` 必填，范围 `1..32`
- `start` / `end` 可选，不传时默认最近 24 小时
- 当前样例看起来不是固定 5 分钟粒度，前端不要写死步长

### 3. ack 返回

文档样例：

```json
{
  "success": true,
  "data": {
    "alert_id": 19,
    "acked": true,
    "acked_at": "2026-05-10T07:xx:xx+00:00"
  }
}
```

联调结论：

- `ack` 完成后，可依赖 `acked_at` 做“已接手”痕迹展示
- 不要把 `ack` 映射成稳定的后端状态值，因为列表和详情主状态仍是 `OPEN` / `RECOVERED` / `CLOSED`

### 4. close 请求约束

OpenAPI schema：

```json
{
  "required": true,
  "content": {
    "application/json": {
      "schema": {
        "type": "object",
        "properties": {
          "operator_note": {
            "anyOf": [
              { "type": "string" },
              { "type": "null" }
            ]
          }
        }
      }
    }
  }
}
```

联调结论：

- 请求体本身必传
- `operator_note` 字段按 schema 推断可不填
- 第一版建议请求统一传 JSON body，优先使用 `{}` 或 `{"operator_note": null}`
- 如果后端后续加了运行时必填校验，再补输入框，不要先在前端假设必填

## 前端 adapter 映射表

| 后端字段 | 出现位置 | 前端用途 | 映射建议 |
| --- | --- | --- | --- |
| `id` | list/detail | 告警主键 | 直接映射为 `alertId` |
| `station_id` | list/detail | 备用标识 | 保留原值，必要时用于二次查询 |
| `station_name` | list/detail | 电站名称 | 直接展示；没有时降级显示 `station_id` |
| `inverter_sn` | list/detail | 设备标识 | 详情、趋势接口入参直接使用 |
| `string_index` | list/detail | 组串编号 | 详情副标题、趋势接口入参 |
| `severity` | list/detail | 严重级别 | `CRITICAL -> critical`，`WARNING -> warning` |
| `status` | list/detail | 主状态 | 只映射真实后端状态，不再虚构 `processing` |
| `acked_at` | list/detail | 已接手痕迹 | 非空时展示“已接手”标记或时间，不改主状态 |
| `recovered_at` | list/detail | 已恢复时间 | 非空时可展示“已恢复待关闭” |
| `closed_at` | list/detail | 已关闭时间 | 非空时视为关闭完成 |
| `voltage` | list/detail | 当前异常值 | 用作主数值 |
| `reference_voltage` | list/detail/trend | 对比基线值 | 列表摘要、趋势对比线 |
| `deviation_pct` | list/detail/trend | 偏差百分比 | 展示为核心异常指标 |
| `threshold_pct` | list/detail | 阈值 | 文案说明或 tooltip |
| `started_at` | list/detail | 异常开始时间 | 优先作为详情时间主字段 |
| `detected_at` | list/detail | 检测时间 | 列表时间兜底字段 |
| `description` | list/detail | 异常描述 | 可直接作为详情正文，不再前端拼长文案 |
| `operator_note` | detail | 关闭备注 | 仅在详情已有值时展示 |
| `raw_context` | detail | 原始上下文 | 第一版不直接展示，只保留后续扩展空间 |
| `time` | trend | 趋势横轴 | 转本地时间后展示 |
| `voltage` | trend | 趋势主线 | 映射为当前组串曲线 |
| `reference_voltage` | trend | 趋势对比线 | 映射为参考/基线曲线 |
| `deviation_pct` | trend | tooltip 补充信息 | 非必显字段 |

## 状态映射建议

| 后端状态/字段 | 前端展示建议 |
| --- | --- |
| `status === "OPEN"` 且 `acked_at == null` | `待处理` |
| `status === "OPEN"` 且 `acked_at != null` | 主状态仍显示 `待处理`，另加 `已接手` 痕迹 |
| `status === "RECOVERED"` | `已恢复` 或 `待关闭` |
| `status === "CLOSED"` 或 `closed_at != null` | `已关闭` |

## 对后续开发的直接影响

1. 详情页顶部卡片可以只依赖真实字段：`severity`、`status`、`station_name`、`inverter_sn`、`string_index`、`voltage`、`reference_voltage`、`deviation_pct`、`description`。
2. 趋势图必须重做为双线结构：`voltage` 对 `reference_voltage`，不要继续消费本地 `current/peer` mock。
3. 当前 demo 里的 `AI 置信度`、`损失评估`、`Push Status`、`历史工单命中`、`推荐追问` 都不在本次接口样例里，Phase 3 接入时应默认收口。
4. `ack` 成功后的 UI 反馈优先级：toast > 局部刷新详情/列表 > 显示 `acked_at`；不要引入虚假的稳定 `processing` 状态。
