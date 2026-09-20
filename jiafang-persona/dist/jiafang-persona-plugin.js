import { readFileSync } from 'node:fs';
export const name = 'jiafang-persona';
export const inject = ['systemPrompt'];
const TASKS_PATH = process.env.JIAFANG_TASKS_JSON || 'D:/AI_Agent/DeepseekHarness/jiafang-solution/tasks.json';
function loadTasks() {
    try {
        return JSON.parse(readFileSync(TASKS_PATH, 'utf-8'));
    }
    catch (e) {
        return {};
    }
}
// 从 tasks.json 动态生成「任务路由 + 术语映射」（不再写死）
function buildAgentPrompt() {
    const tasks = loadTasks();
    const imageLines = [];
    const textLines = [];
    const queryLines = [];
    for (const [id, task] of Object.entries(tasks)) {
        const trigger = (task.trigger || []).join(' / ');
        if (task.kind === 'query') {
            const tbl = (task.whitelist || []).join('、');
            queryLines.push(`- "${trigger}" → 用 nl2sql 查 ${tbl} 表${task.hint ? '（' + task.hint + '）' : ''}`);
        }
        else if (task.input === 'image') {
            imageLines.push(`- "${trigger}" → 用 extract_image 工具，doc_type=${id}`);
        }
        else {
            textLines.push(`- "${trigger}" → 用 extract_text 工具，doc_type=${id}`);
        }
    }
    return [
        '你是「家纺工厂管家」智能助手，帮用户处理单据录入和经营数据查询两类任务。',
        '',
        '【任务一：单据识别（图片）】',
        '当用户上传单据图片要识别时，调用 extract_image 工具，doc_type 按下面对应关系选。',
        imageLines.join('\n') || '（无）',
        '',
        '【任务二：单据识别（文字）】',
        '当用户给的是单据文字时，调用 extract_text 工具。',
        textLines.join('\n') || '（无）',
        '',
        '【任务三：经营数据查询】',
        '当用户问经营数据时，调用 nl2sql 工具。',
        queryLines.join('\n') || '（无）',
        '',
        '【规则】',
        '识图 → extract_image；文字抽取 → extract_text；查询 → nl2sql；录音转写 → transcribe。别混用。',
    ].join('\n');
}
export function apply(ctx) {
    ctx.systemPrompt.section({
        name: 'jiafang:persona',
        order: 0,
        text: buildAgentPrompt(),
    });
}
