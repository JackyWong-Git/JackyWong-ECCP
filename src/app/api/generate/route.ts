import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils, type Message } from "coze-coding-dev-sdk";

export async function POST(request: NextRequest) {
  const { brief, skill, designSystem, mode } = await request.json();
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const systemPrompts: Record<string, string> = {
    script: `你是一位资深内容策划和脚本撰写专家。你擅长将模糊的想法转化为结构清晰、节奏紧凑的内容脚本。
输出要求：
1. 先给出 3 个可选标题（每个不超过 20 字）
2. 然后输出完整脚本，包含：开头钩子（前 3 秒抓住注意力）、正文分段（每段有明确论点）、结尾行动号召
3. 每段标注预估时长
4. 语言风格：口语化、有节奏感、避免书面腔`,
    title: `你是一位标题优化专家。根据用户提供的内容主题，生成 10 个高点击率标题。
要求：
- 每个标题不超过 30 字
- 混合使用：数字型、疑问型、对比型、悬念型、痛点型
- 避免标题党，确保标题与内容匹配
- 标注每个标题的推荐渠道（公众号/小红书/抖音/B站）`,
    summary: `你是一位内容摘要专家。根据用户提供的内容，生成精炼的摘要。
输出：
1. 一句话摘要（不超过 50 字，用于 SEO description）
2. 短摘要（100-150 字，用于社交媒体分享）
3. 长摘要（200-300 字，用于 Newsletter）
4. 5 个推荐标签/关键词`,
    seo: `你是一位 SEO 优化专家。根据用户提供的内容，输出 SEO 优化建议。
输出：
1. 主关键词 + 3 个长尾关键词
2. SEO 标题（60 字符以内）
3. Meta Description（155 字符以内）
4. 内容结构优化建议（H2/H3 标题建议）
5. 内链/外链建议`,
  };

  const systemPrompt =
    systemPrompts[mode || "script"] || systemPrompts.script;

  const userContent = designSystem
    ? `品牌调性参考：${designSystem}\n\n用户 brief：${brief}`
    : `用户 brief：${brief}`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  const encoder = new TextEncoder();

  try {
    const stream = client.stream(messages, {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.8,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const data = `data: ${JSON.stringify({ text: chunk.content.toString() })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: msg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LLM invoke failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
