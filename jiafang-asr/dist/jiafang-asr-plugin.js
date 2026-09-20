import { defineTool } from '@deepseek-ai/dsh-tools';
import { readFileSync } from 'node:fs';
export const name = 'jiafang-asr';
export const inject = ['tools'];
const QWEN_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
export function apply(ctx) {
    ctx.tools.register(defineTool({
        name: 'transcribe',
        description: '把录音转成文字（调用 Qwen-ASR）。',
        parameters: {
            audio_path: { type: 'string', required: true, description: '音频文件的绝对路径' },
        },
        output: {
            schema: { type: 'string' },
            render: (_args, value) => [{ type: 'text', text: value }],
        },
        async execute(args) {
            const audioBase64 = readFileSync(args.audio_path).toString('base64');
            if (audioBase64.length > 10_000_000) {
                throw new Error('音频太大（base64 超 10MB），请缩短或压缩');
            }
            const dataUri = `data:audio/mpeg;base64,${audioBase64}`;
            const resp = await fetch(QWEN_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen3-asr-flash',
                    messages: [
                        { role: 'user', content: [{ type: 'input_audio', input_audio: { data: dataUri } }] },
                    ],
                }),
            });
            const data = await resp.json();
            if (!data.choices || data.choices.length === 0) {
                throw new Error(`Qwen-ASR 调用失败：${JSON.stringify(data)}`);
            }
            return data.choices[0].message.content;
        },
    }));
}
