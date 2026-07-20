import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils, type Message } from "coze-coding-dev-sdk";

const CHANNEL_RULES: Record<string, { name: string; prompt: string }> = {
  wechat: {
    name: "微信公众号",
    prompt: `适配为微信公众号文章。要求：
- 标题：不超过 30 字，吸引点击
- 正文：1500-3000 字，段落短小（每段 3-5 行），适合手机阅读
- 小标题用 **加粗** 标记
- 开头 3 句话必须有钩子
- 结尾加引导关注/转发的 CTA
- 封面比例 2.35:1（横版）
- 输出 JSON 格式：{"title":"","content":"","coverRatio":"2.35:1","wordCount":0}`,
  },
  xiaohongshu: {
    name: "小红书",
    prompt: `适配为小红书笔记。要求：
- 标题：不超过 20 字，必须带 emoji
- 正文：300-800 字，每段开头用 emoji 标记
- 语气亲切、口语化，像闺蜜分享
- 结尾加 5-10 个话题标签（#xxx#）
- 封面比例 3:4（竖版）
- 输出 JSON 格式：{"title":"","content":"","tags":[],"coverRatio":"3:4","wordCount":0}`,
  },
  bilibili: {
    name: "B站",
    prompt: `适配为 B站视频脚本。要求：
- 标题：不超过 25 字，可带【】标记分区
- 正文：按时间戳分段，格式为 [00:00] 内容
- 总时长 5-15 分钟
- 开头 30 秒必须有"三连"引导
- 语气轻松、有梗、可适当玩梗
- 封面比例 16:9
- 输出 JSON 格式：{"title":"","content":"","timestamps":[],"coverRatio":"16:9","duration":""}`,
  },
  douyin: {
    name: "抖音",
    prompt: `适配为抖音短视频脚本。要求：
- 标题：不超过 15 字，带 #话题标签
- 正文：150-300 字，总时长 30-60 秒
- 每 5 秒一个信息点/钩子，节奏极快
- 开头 3 秒必须有强钩子（提问/反转/冲突）
- 结尾引导点赞/关注
- 封面比例 9:16（竖版）
- 输出 JSON 格式：{"title":"","content":"","hashtags":[],"coverRatio":"9:16","duration":""}`,
  },
  newsletter: {
    name: "Newsletter",
    prompt: `适配为 Newsletter 邮件。要求：
- Subject Line：不超过 50 字符，制造好奇心
- Preview Text：不超过 100 字符
- 正文：800-1500 字，结构清晰
- 段落间留白充足
- 语气专业但不枯燥
- 结尾加 CTA 按钮文案
- 输出 JSON 格式：{"subject":"","preview":"","content":"","cta":""}`,
  },
  internal: {
    name: "内刊",
    prompt: `适配为内部刊物文章。要求：
- 标题：正式、准确，不超过 25 字
- 正文：1000-2000 字，结构严谨
- 包含：摘要、关键词、正文、结论
- 语气正式、客观、数据驱动
- A4 排版格式
- 输出 JSON 格式：{"title":"","abstract":"","keywords":[],"content":"","format":"A4"}`,
  },
};

export async function POST(request: NextRequest) {
  const { content, targetChannel, allChannels } = await request.json();
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const channels = allChannels
    ? Object.keys(CHANNEL_RULES)
    : [targetChannel].filter(Boolean);

  if (channels.length === 0) {
    return new Response(JSON.stringify({ error: "No channel specified" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const buildMessages = (channelKey: string): Message[] | null => {
    const rule = CHANNEL_RULES[channelKey];
    if (!rule) return null;

    return [
      {
        role: "system" as const,
        content: `你是内容多渠道适配专家。请将以下原始内容适配为"${rule.name}"渠道的版本。\n\n${rule.prompt}\n\n严格输出 JSON，不要输出其他内容。`,
      },
      { role: "user" as const, content: `原始内容：\n${content}` },
    ];
  };

  if (channels.length === 1) {
    const messages = buildMessages(channels[0]);
    if (!messages) {
      return new Response(JSON.stringify({ error: "Unknown channel" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const stream = client.stream(messages, {
        model: "doubao-seed-2-0-lite-260215",
        temperature: 0.7,
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ channel: channels[0], channelName: CHANNEL_RULES[channels[0]].name, status: "start" })}\n\n`
              )
            );
            for await (const chunk of stream) {
              if (chunk.content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ channel: channels[0], text: chunk.content.toString() })}\n\n`
                  )
                );
              }
            }
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ channel: channels[0], status: "done" })}\n\n`
              )
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Stream error";
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
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

  // Multi-channel: invoke all in parallel, collect results
  try {
    const results: Record<string, string> = {};

    await Promise.all(
      channels.map(async (ch) => {
        const messages = buildMessages(ch);
        if (!messages) return;
        try {
          const response = await client.invoke(messages, {
            model: "doubao-seed-2-0-lite-260215",
            temperature: 0.7,
          });
          results[ch] = response.content;
        } catch {
          results[ch] = JSON.stringify({ error: "Generation failed" });
        }
      })
    );

    const readable = new ReadableStream({
      async start(controller) {
        for (const [ch, text] of Object.entries(results)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ channel: ch, channelName: CHANNEL_RULES[ch]?.name || ch, text, status: "done" })}\n\n`
            )
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
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
