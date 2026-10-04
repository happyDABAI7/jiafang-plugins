# jiafang-plugins

A set of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins for textile-factory management (家纺工厂管家). A monorepo of 5 independent bundles: document field extraction (image/text), voice work-report transcription, and whitelisted natural-language-to-SQL query.

## Features

- **Image recognition** `jiafang-vision`: document image → fields (Qwen-VL, one step)
- **Text extraction** `jiafang-extract`: document text → fields (Qwen)
- **Query** `jiafang-nl2sql`: natural language → read-only SQL (table whitelist / read-only / row-limit three gates)
- **Transcription** `jiafang-asr`: audio → text (Qwen-ASR)
- **Persona & routing** `jiafang-persona`: textile-factory role + task routing (injects systemPrompt)

## Plugins

| Package | Tool | Responsibility |
|---|---|---|
| `jiafang-vision` | `extract_image` | Image: document image → fields (Qwen-VL) |
| `jiafang-extract` | `extract_text` | Text extraction: document text → fields (Qwen) |
| `jiafang-nl2sql` | `nl2sql` | Query: natural language → SQL (three gates) |
| `jiafang-asr` | `transcribe` | Transcription: audio → text (Qwen-ASR) |
| `jiafang-persona` | — (injects systemPrompt) | Role + task routing |

Each subdirectory is an independent DSH bundle (`src/` + `dist/` + `cordis.patch.yml` + `package.json`).

## Install

```bash
dsh plugin --profile <name> add file:./jiafang-vision
# repeat for the others, then add the package names to that profile's dsh.profile.bundles
```

## Build

```bash
npx tsc -p jiafang-vision/tsconfig.json
# same for the other four
```

## Pack

```bash
node scripts/pack-all.mjs   # produces release/*.tgz
```

> `tasks.json` belongs to the project, not to any plugin; plugins read it through the `JIAFANG_TASKS_JSON` environment variable.

> 中文说明见 [README.zh-CN.md](./README.zh-CN.md)。
