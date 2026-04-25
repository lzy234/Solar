# Coding Log

`codingLog` 用来沉淀项目内已经发生过的修复、改动决策和执行约定，目标是让后续查阅、续写和复盘都足够快。

## 目录结构

```text
codingLog/
├─ README.md
├─ TEMPLATE.md
├─ AI-WORKFLOW.md
├─ feature/
│  └─ mobile-app/
└─ bugfix/
   └─ mobile-app/
```

## 分类规则

- `bugfix/`：缺陷修复记录。
- 后续可按需要新增一级分类，例如 `feature/`、`refactor/`、`ops/`、`docs/`。
- 每个一级分类下按模块拆分目录，例如 `mobile-app/`、`backend/`、`shared/`。

## 文件命名规则

- 格式：`YYYY-MM-DD-主题.md`
- 主题使用英文短语或拼音短语，避免空格。
- 一个文件只记录一件明确的事情，避免把多个不相关改动混在一起。

## 建议写法

每篇记录尽量包含以下部分：

- `问题现象`
- `根因分析`
- `修复方案`
- `影响范围`
- `验证结果`
- `后续注意事项`

## 当前索引

### Feature / Mobile App

- [2026-04-25-mobile-app-alert-chat-demo-upgrade.md](D:/Project/Solar/codingLog/feature/mobile-app/2026-04-25-mobile-app-alert-chat-demo-upgrade.md:1)
- [2026-04-25-mobile-app-presentation-copy-cleanup.md](D:/Project/Solar/codingLog/feature/mobile-app/2026-04-25-mobile-app-presentation-copy-cleanup.md:1)

### Bugfix / Mobile App

- [2026-04-25-mobile-app-swipe-gesture-fix.md](D:/Project/Solar/codingLog/bugfix/mobile-app/2026-04-25-mobile-app-swipe-gesture-fix.md:1)
- [2026-04-25-mobile-app-drag-follow-polish.md](D:/Project/Solar/codingLog/bugfix/mobile-app/2026-04-25-mobile-app-drag-follow-polish.md:1)
- [2026-04-25-mobile-app-default-start-page-fix.md](D:/Project/Solar/codingLog/bugfix/mobile-app/2026-04-25-mobile-app-default-start-page-fix.md:1)
- [2026-04-25-mobile-app-bottom-floating-metrics-removal.md](D:/Project/Solar/codingLog/bugfix/mobile-app/2026-04-25-mobile-app-bottom-floating-metrics-removal.md:1)

## 维护要求

- 新增记录前，先看 `AI-WORKFLOW.md`。
- 新增记录时，优先复用已有分类，不要随意平铺在 `codingLog` 根目录。
- 新增文件后，同步补一条到本索引。
