import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { readFileSync } from 'node:fs'

export const name = 'jiafang-nl2sql'
export const inject = ['tools']

const QWEN_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const TASKS_PATH = process.env.JIAFANG_TASKS_JSON || 'D:/AI_Agent/DeepseekHarness/jiafang-solution/tasks.json'

type TaskDef = { label: string; kind?: string; trigger?: string[]; whitelist?: string[]; hint?: string }

function loadTasks(): Record<string, TaskDef> {
  try {
    return JSON.parse(readFileSync(TASKS_PATH, 'utf-8'))
  } catch (e) {
    throw new Error(`读取 tasks.json 失败：${(e as Error).message}`)
  }
}

// 从 tasks.json 里 kind=query 的条目，动态生成「表白名单 + 术语映射」
function buildQueryConfig() {
  const tasks = loadTasks()
  const tables: Record<string, string[]> = {}
  const mapping: string[] = []
  for (const task of Object.values(tasks)) {
    if (task.kind !== 'query') continue
    for (const table of (task.whitelist || [])) {
      if (!(table in tables)) tables[table] = []
    }
    const trigger = (task.trigger || []).join(' / ')
    const tbl = (task.whitelist || []).join('、')
    mapping.push(`- "${trigger}" → 查 ${tbl} 表${task.hint ? '（' + task.hint + '）' : ''}`)
  }
  return { tables, mapping }
}

function buildSqlPrompt(tables: Record<string, string[]>, mapping: string[]): string {
  return [
    '你是 SQL 生成助手。把用户的自然语言问题转成一条 SQL 查询。',
    '规则：',
    '- 只能生成 SELECT 查询（只读），禁止 INSERT/UPDATE/DELETE/DROP 等任何写操作',
    `- 只能用这些表：${Object.keys(tables).join('、')}`,
    '- 只输出 SQL 语句本身，不要任何解释、不要 markdown、不要末尾分号',
    '',
    '业务术语映射（必须按此理解，不要照字面猜）：',
    ...mapping,
  ].join('\n')
}

function checkWhitelist(sql: string, tables: Record<string, string[]>) {
  const hits = sql.match(/(?:from|join)\s+([a-z_]+)/gi) ?? []
  for (const h of hits) {
    const table = h.split(/\s+/)[1].toLowerCase()
    if (!(table in tables)) throw new Error(`表 ${table} 不在白名单内，拒绝执行`)
  }
}

const FORBIDDEN = ['insert', 'update', 'delete', 'drop', 'truncate', 'alter', 'create']
function checkReadonly(sql: string) {
  const lower = sql.toLowerCase()
  for (const kw of FORBIDDEN) {
    if (lower.includes(kw)) throw new Error(`检测到写操作关键字 ${kw}，拒绝执行`)
  }
}

function ensureLimit(sql: string) {
  const stripped = sql.trim().replace(/;+\s*$/, '')
  return /limit\s+\d+/i.test(stripped) ? stripped : stripped + ' LIMIT 100'
}

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'nl2sql',
    description: '把自然语言问题转成 SQL 并查询（只读、白名单限制；白名单来自 tasks.json 的 query 条目）。当前返回假数据。',
    parameters: {
      question: { type: 'string', required: true, description: '要查询的自然语言问题' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args: any) {
      const { tables, mapping } = buildQueryConfig()
      const sqlPrompt = buildSqlPrompt(tables, mapping)

      const resp = await fetch(QWEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            { role: 'system', content: sqlPrompt },
            { role: 'user', content: args.question },
          ],
        }),
      })
      const data = await resp.json() as any
      if (!data.choices || data.choices.length === 0) {
        throw new Error(`Qwen 调用失败：${JSON.stringify(data)}`)
      }
      const sql = data.choices[0].message.content.trim()

      checkWhitelist(sql, tables)
      checkReadonly(sql)
      const safeSql = ensureLimit(sql)

      return `生成的 SQL：${safeSql}\n（假）查询结果：2 条记录`
    },
  }))
}
