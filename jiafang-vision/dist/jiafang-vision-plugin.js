import { defineTool } from '@deepseek-ai/dsh-tools';
import { readFileSync } from 'node:fs';
export const name = 'jiafang-vision';
export const inject = ['tools'];
const QWEN_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const TASKS_PATH = process.env.JIAFANG_TASKS_JSON || 'D:/AI_Agent/DeepseekHarness/jiafang-solution/tasks.json';
function loadTasks() {
    try {
        return JSON.parse(readFileSync(TASKS_PATH, 'utf-8'));
    }
    catch (e) {
        throw new Error(`读取 tasks.json 失败：${e.message}`);
    }
}
function buildPrompt(task) {
    const fieldLines = Object.entries(task.fields || {})
        .map(([key, f]) => `- ${key}：${f.label}（${f.type}）`)
        .join('\n');
    return [
        `你是单据信息抽取助手。从「${task.label}」的图片中抽取字段，只输出一个 JSON 对象，不要输出任何其他内容。`,
        '字段：',
        fieldLines,
        '找不到的字段值用 null。',
    ].join('\n');
}
function parseLlmJson(text) {
    let s = text.trim();
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence)
        s = fence[1];
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start)
        throw new Error('Qwen 没有返回 JSON 对象');
    return JSON.parse(s.slice(start, end + 1));
}
async function callQwen(messages, model) {
    const resp = await fetch(QWEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages }),
    });
    const data = await resp.json();
    if (!data.choices || data.choices.length === 0) {
        throw new Error(`Qwen 调用失败：${JSON.stringify(data)}`);
    }
    return data.choices[0].message.content;
}
export function apply(ctx) {
    ctx.tools.register(defineTool({
        name: 'extract_image',
        description: '从单据图片里抽取字段（识图）。doc_type 在 tasks.json 里定义，字段也由 tasks.json 决定。',
        parameters: {
            doc_type: { type: 'string', required: true, description: '单据类型 id，如 purchase_receipt' },
            image_path: { type: 'string', description: '图片绝对路径' },
        },
        output: {
            schema: { type: 'object', additionalProperties: true },
            render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
        },
        async execute(args) {
            const task = loadTasks()[args.doc_type];
            if (!task)
                throw new Error(`未知 doc_type：${args.doc_type}（tasks.json 里没有）`);
            if (task.kind === 'query')
                throw new Error(`doc_type=${args.doc_type} 是查询类型，请用 nl2sql`);
            if (!args.image_path)
                throw new Error('需要 image_path');
            const imageBase64 = readFileSync(args.image_path).toString('base64');
            if (imageBase64.length > 8_000_000)
                throw new Error('图片太大（超过约 6MB），请先缩小');
            const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
            const content = await callQwen([{
                    role: 'user',
                    content: [
                        { type: 'text', text: buildPrompt(task) },
                        { type: 'image_url', image_url: { url: dataUrl } },
                    ],
                }], 'qwen-vl-plus');
            return parseLlmJson(content);
        },
    }));
}
