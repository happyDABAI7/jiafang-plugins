# jiafang-persona

家纺管家角色 + 路由提示词。读 `tasks.json`，按 trigger / input / kind 生成「识图→extract_image、文字→extract_text、查询→nl2sql」的路由。

## 依赖

- 业务清单 `tasks.json`（通过环境变量 `JIAFANG_TASKS_JSON` 指定）
