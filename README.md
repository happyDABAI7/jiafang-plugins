# jiafang-plugins

家纺工厂管家（JiaFang）的 DSH 插件集，monorepo：5 个独立能力，一个仓库。

| 包名 | 注册的工具 | 职责 |
|---|---|---|
| `jiafang-vision` | `extract_image` | 识图：单据图片 → 字段（Qwen-VL） |
| `jiafang-extract` | `extract_text` | 文字抽取：文字 → 字段（Qwen） |
| `jiafang-nl2sql` | `nl2sql` | 查询：自然语言 → SQL（白名单 / 只读 / 限行三道闸） |
| `jiafang-asr` | `transcribe` | 转写：录音 → 文字（Qwen-ASR） |
| `jiafang-persona` | —（注入 systemPrompt） | 家纺角色 + 任务路由 |

每个子目录是一个独立的 DSH bundle（`src/` + `dist/` + `cordis.patch.yml` + `package.json`）。

## 构建

```bash
npx tsc -p jiafang-vision/tsconfig.json
npx tsc -p jiafang-extract/tsconfig.json
npx tsc -p jiafang-nl2sql/tsconfig.json
npx tsc -p jiafang-asr/tsconfig.json
npx tsc -p jiafang-persona/tsconfig.json
```

## 打包（生成 release/*.tgz）

```bash
node scripts/pack-all.mjs
```

## 安装到 profile

```bash
dsh plugin --profile <name> add file:./jiafang-vision
# 其余同理，再把包名加进该 profile 的 dsh.profile.bundles
```

> `tasks.json` 不属于任何插件，由项目自带；插件通过环境变量 `JIAFANG_TASKS_JSON` 读它。
