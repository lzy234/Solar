# 光伏板电压异常监测系统 — Agent 接入指南

| 项目 | 内容 |
|---|---|
| 版本 | v1.1 |
| 日期 | 2026-04-28 |
| 适用对象 | 负责对接 Agent 的开发者 |

---

## 一、启动方法

### 前置条件

| 依赖 | 版本要求 |
|---|---|
| Docker Desktop | 已启动并运行 Linux 引擎 |
| `.env` 文件 | 位于项目根目录，见下方说明 |

### 1. 配置 `.env`

在项目根目录（`光伏项目/`）创建 `.env` 文件，填入以下内容：

```env
# 锦浪云 API 密钥（必填）
GINLONG_API_URL=https://api.ginlong.com:13333
GINLONG_KEY_ID=你的KeyID
GINLONG_KEY_SECRET=你的KeySecret

# 需要监控的电站 ID，JSON 字符串数组格式（必须加引号）
# 电站 ID 可通过调用 /v1/api/userStationList 接口获取账号下所有可访问电站
GINLONG_STATION_IDS=["电站ID1","电站ID2","电站ID3"]

# 数据库（Docker 内部地址，保持默认即可）
DB_DSN=postgresql+asyncpg://pv:pv@localhost:5432/pv_monitor

# Redis（保持默认即可）
REDIS_URL=redis://localhost:6379/0
```

> **注意**：`GINLONG_STATION_IDS` 必须是合法 JSON 数组，每个 ID 要加双引号，例如 `["123","456"]`。
> 系统会自动遍历每个电站下的所有逆变器，无需手动填写逆变器 SN。

### 2. 首次启动（含镜像构建）

```bash
docker compose -f pv_monitor/docker-compose.yml up -d --build
```

### 3. 日常启动

```bash
docker compose -f pv_monitor/docker-compose.yml up -d
```

### 4. 查看运行状态

```bash
# 确认三个容器均为 running
docker compose -f pv_monitor/docker-compose.yml ps

# 实时查看应用日志
docker compose -f pv_monitor/docker-compose.yml logs -f pv_monitor
```

### 5. 停止服务

```bash
docker compose -f pv_monitor/docker-compose.yml down
```

### 6. 更新代码后重建

```bash
docker compose -f pv_monitor/docker-compose.yml up -d --build
```

---

## 二、系统对外暴露的接入点

系统启动后对外提供两种接入方式，Agent 按需选择。

| 接入方式 | 地址 | 适用场景 |
|---|---|---|
| Redis Pub/Sub | `localhost:6379`，频道 `pv:alerts` | 实时接收告警推送 |
| HTTP REST API | `http://localhost:8000` | 查询告警、逆变器状态、历史数据 |

---

## 三、方式一：订阅 Redis 实时告警

### 工作原理

每当检测到电压异常或异常恢复时，系统自动向 Redis 频道 `pv:alerts` 发布一条 JSON 消息。Agent 订阅该频道即可实时感知。

当前直流侧异常规则按同一 MPPT 下两路 PV 输入成组判断：`PV1/PV2`、`PV3/PV4`、……、`PV31/PV32`。同组两路 PV 电压偏差超过 5% 立即生成 `WARNING` 告警，超过 10% 立即生成 `CRITICAL` 告警，不再等待多个采集周期确认。

> 说明：锦浪云 API 同时提供 `uPv1~uPv32`（PV 直流电压）、`iPv1~iPv32`（PV 直流电流）、`pow1~pow32`（PV 直流功率）、`dcPac`（总直流输入功率）以及 MPPT 相关状态。工程运维上，PV 电压用于发现组串开路、接头松动、遮挡或组件异常；PV 电流/功率用于判断同电压下是否存在低发、遮挡、熔丝或支路断流；MPPT 电压适合做运行区间和跟踪状态复核，但不建议单独作为组串异常告警依据，应与 PV 电压、电流、功率一起看。

### 消息格式

```json
{
  "alert_id": 10001,
  "severity": "WARNING",
  "status": "OPEN",
  "station_id": "1299184320439443378",
  "station_name": "湖州永达奥迪320.24kW光伏项目",
  "inverter_sn": "120B40198150131",
  "string_index": 3,
  "voltage": 356.4,
  "reference_voltage": 389.2,
  "deviation_pct": 8.4,
  "threshold_pct": 5.0,
  "duration_minutes": 0,
  "detected_at": "2026-04-28T10:15:00+08:00",
  "description": "逆变器 120B40198150131 第 3/4 路直流接口组内电压分别约为 356.4V 和 389.2V，偏差达 8.4%，当前检测值已超过 5% 阈值，请安排人工检查。"
}
```

| 字段 | 说明 |
|---|---|
| `severity` | `WARNING`（组内偏差 >5%）或 `CRITICAL`（组内偏差 >10%） |
| `status` | `OPEN`（新告警）或 `RECOVERED`（已恢复） |
| `string_index` | 异常组起始直流接口编号，例如 `3` 表示 `PV3/PV4` 这一组 |
| `deviation_pct` | 当前组内两路 PV 电压的偏差百分比 |
| `duration_minutes` | 已连续超阈值的分钟数；单次发现即告警时为 `0` |
| `description` | 可直接发给人工的中文描述 |

### Python 接入示例

```python
import asyncio
import json
import redis.asyncio as aioredis

async def listen_alerts():
    redis = aioredis.from_url("redis://localhost:6379/0", decode_responses=True)
    pubsub = redis.pubsub()
    await pubsub.subscribe("pv:alerts")

    async for message in pubsub.listen():
        if message["type"] != "message":
            continue

        event = json.loads(message["data"])

        if event["status"] == "OPEN":
            # 发送告警通知（企业微信 / 飞书 / 钉钉）
            await notify(event["description"], severity=event["severity"])

            # 确认已收到
            await ack_alert(event["alert_id"])

        elif event["status"] == "RECOVERED":
            await notify(f"告警已恢复：{event['description']}", severity="INFO")

asyncio.run(listen_alerts())
```

---

## 四、方式二：HTTP REST API 查询

交互式文档（可直接在浏览器里测试所有接口）：

```
http://localhost:8000/docs
```

### 接口清单

#### 告警相关

**查询告警列表**

```
GET /api/alerts
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `station_id` | string | 按电站过滤 |
| `status` | string | `OPEN` / `RECOVERED` / `CLOSED` |
| `severity` | string | `WARNING` / `CRITICAL` |
| `start` | datetime | 检测时间起始（ISO 8601） |
| `end` | datetime | 检测时间截止 |
| `limit` | int | 每页条数，默认 100 |
| `offset` | int | 分页偏移 |

示例：
```bash
curl "http://localhost:8000/api/alerts?status=OPEN&severity=CRITICAL"
```

---

**查询单条告警详情**

```
GET /api/alerts/{alert_id}
```

示例：
```bash
curl "http://localhost:8000/api/alerts/10001"
```

---

**确认告警（ack）**

Agent 收到推送后调用，避免重复处理。

```
POST /api/alerts/{alert_id}/ack
```

示例：
```bash
curl -X POST "http://localhost:8000/api/alerts/10001/ack"
```

---

**关闭告警**

人工处理完成后由 Agent 代为关闭，可附带处理备注。

```
POST /api/alerts/{alert_id}/close
Content-Type: application/json

{ "operator_note": "已更换第3路组串连接头，电压恢复正常" }
```

示例：
```bash
curl -X POST "http://localhost:8000/api/alerts/10001/close" \
  -H "Content-Type: application/json" \
  -d '{"operator_note": "已更换连接头"}'
```

---

#### 逆变器相关

**查询某台逆变器最新各路电压**

人工追问"现在是什么情况"时调用。

```
GET /api/inverters/{sn}/latest
```

示例：
```bash
curl "http://localhost:8000/api/inverters/120B40198150131/latest"
```

---

**查询某路接口电压历史曲线**

人工追问"这个问题持续多久了"时调用。

```
GET /api/inverters/{sn}/trend?string_index=3&start=2026-04-28T00:00:00Z
```

| 参数 | 说明 |
|---|---|
| `string_index` | 直流接口编号（必填） |
| `start` / `end` | 时间范围，默认最近 24 小时 |

---

#### 电站相关

**查询电站整体状态**

```
GET /api/stations/{station_id}/status
```

返回示例：
```json
{
  "success": true,
  "data": {
    "station_id": "1299184320439443378",
    "online_device_count": 3,
    "open_alert_count": 2,
    "latest_alerts": [...]
  }
}
```

---

## 五、典型 Agent 对话场景

| 用户说 | Agent 动作 |
|---|---|
| （无操作，后台监听）| 订阅 Redis，收到 `OPEN` 事件后主动推送给用户 |
| "现在有什么告警？" | `GET /api/alerts?status=OPEN` |
| "第3路现在电压多少？" | `GET /api/inverters/{sn}/latest` |
| "这个问题从什么时候开始的？" | `GET /api/inverters/{sn}/trend?string_index=3` |
| "已经处理好了" | `POST /api/alerts/{id}/close` + `operator_note` |
| "电站整体情况怎么样？" | `GET /api/stations/{station_id}/status`（station_id 为19位数字ID） |

---

## 六、统一返回格式

所有 HTTP 接口返回格式一致：

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "detail": "错误描述" }
```

HTTP 状态码：`200` 成功，`404` 资源不存在，`422` 参数格式错误，`500` 服务内部错误。

---

## 七、运行状态验证

### API 连通性

```bash
# 健康检查
curl http://localhost:8000/health

# 查看所有告警
curl "http://localhost:8000/api/alerts" | python -m json.tool

# 查看某电站状态（station_id 为19位数字 ID）
curl "http://localhost:8000/api/stations/1299184320439443378/status" | python -m json.tool

# FastAPI 交互式文档（浏览器打开，所有接口可直接测试）
# http://localhost:8000/docs
```

### 数据库存储情况

```bash
# 查原始读数（按逆变器汇总）
docker compose -f pv_monitor/docker-compose.yml exec timescaledb \
  psql -U pv -d pv_monitor -c \
  "SELECT inverter_sn, count(*), max(time) as latest FROM raw_inverter_readings GROUP BY inverter_sn ORDER BY latest DESC;"

# 查最近 20 条组串电压读数
docker compose -f pv_monitor/docker-compose.yml exec timescaledb \
  psql -U pv -d pv_monitor -c \
  "SELECT inverter_sn, string_index, voltage, deviation_pct, time FROM inverter_string_readings ORDER BY time DESC LIMIT 20;"

# 查最近告警记录
docker compose -f pv_monitor/docker-compose.yml exec timescaledb \
  psql -U pv -d pv_monitor -c \
  "SELECT id, inverter_sn, string_index, severity, status, detected_at FROM alerts ORDER BY detected_at DESC LIMIT 10;"

# 确认逆变器元数据已同步
docker compose -f pv_monitor/docker-compose.yml exec timescaledb \
  psql -U pv -d pv_monitor -c \
  "SELECT inverter_sn, station_name, capacity FROM inverters ORDER BY station_name;"
```

### 日志与事件

```bash
# 实时跟踪应用日志
docker compose -f pv_monitor/docker-compose.yml logs -f pv_monitor

# 只看最近 100 行
docker compose -f pv_monitor/docker-compose.yml logs pv_monitor --tail 100

# 实时监听 Redis 告警事件
docker compose -f pv_monitor/docker-compose.yml exec redis \
  redis-cli subscribe pv:alerts
```

正常运行时，每 5 分钟会在日志中看到：
```
{"event": "pipeline_start", ...}
{"event": "inverters_synced", "inverter_count": N, ...}
{"event": "readings_collected", "count": N, ...}
{"event": "pipeline_done", ...}
```

---

*文档结束*
