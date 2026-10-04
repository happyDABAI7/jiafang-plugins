# jiafang-plugins

A set of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins for textile-factory management (家纺工厂管家). A monorepo of 5 independent bundles: document field extraction (image/text), voice work-report transcription, and whitelisted natural-language-to-SQL query.

家纺工厂管家（JiaFang）的 DeepSeek Harness 插件集：5 个独立能力，一个仓库。

## Features

- **识图** `jiafang-vision`：单据图片 → 字段（Qwen-VL，一步到位）
- **文字抽取** `jiafang-extract`：单据文字 → 字段（Qwen）
- **查询** `jiafang-nl2sql`：自然语言 → 只读 SQL（白名单 / 只读 / 限行三道闸）
- **转写** `jiafang-asr`：录音 → 文字（Qwen-ASR）
- **角色路由** `jiafang-persona`：家纺角色 + 任务路由（注入 systemPrompt）

## Plugins

| 包名 | 注册的工具 | 职责 |
|---|---|---|
| `jiafang-vision` | `extract_image` | 识图：单据图片 → 字段（Qwen-VL） |
| `jiafang-extract` | `extract_text` | 文字抽取：文字 → 字段（Qwen） |
| `jiafang-nl2sql` | `nl2sql` | 查询：自然语言 → SQL（三道闸） |
| `jiafang-asr` | `transcribe` | 转写：录音 → 文字（Qwen-ASR） |
| `jiafang-persona` | —（注入 systemPrompt） | 家纺角色 + 任务路由 |

每个子目录是一个独立的 DSH bundle（`src/` + `dist/` + `cordis.patch.yml` + `package.json`）。

## Install

```bash
dsh plugin --profile <name> add file:./jiafang-vision
# 其余同理，再把包名加进该 profile 的 dsh.profile.bundles
```

## Build

```bash
npx tsc -p jiafang-vision/tsconfig.json
# 其余 4 个同理
```

## Pack

```bash
node scripts/pack-all.mjs   # 生成 release/*.tgz
```

> `tasks.json` 不属于任何插件，由项目自带；插件通过环境变量 `JIAFANG_TASKS_JSON` 读它。
