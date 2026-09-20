# jiafang-extract

文字抽取：单据文字 → 字段。doc_type 和字段定义在 `tasks.json` 里（通过环境变量 `JIAFANG_TASKS_JSON` 指定）。

## 工具

- `extract_text`

## 依赖

- 环境变量 `DASHSCOPE_API_KEY`（Qwen 文本）
- 业务清单 `tasks.json`
