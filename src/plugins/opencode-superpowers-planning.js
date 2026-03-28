import { existsSync } from "node:fs";
import { join } from "node:path";
import { createProgressBar } from "../utils/progress-bar.js";

// 检查是否为项目目录的标记文件
export function hasProjectMarker(directory) {
  const markers = [
    ".git",
    "CLAUDE.md",
    "AGENTS.md",
    "opencode.json",
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
  ];
  return markers.some((marker) => existsSync(join(directory, marker)));
}

// 1:1 复刻 OpenCode TUI 的官方上下文计算逻辑
async function getContextPercentage(client, sessionID, knownLimit = null) {
  if (!client || !sessionID) return 0;

  try {
    const messagesRes = await client.session.messages({ sessionID });
    const messages = messagesRes.data || messagesRes;
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return 0;

    let lastAsst = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.tokens && m.tokens.output > 0) {
        lastAsst = m;
        break;
      }
    }
    if (!lastAsst) return 0;

    const t = lastAsst.tokens;
    const totalTokens =
      (t.input || 0) +
      (t.output || 0) +
      (t.reasoning || 0) +
      (t.cache?.read || 0) +
      (t.cache?.write || 0);

    let limit = knownLimit;
    if (!limit) {
      const provRes = await client.provider.list();
      const providers = provRes.data || provRes;
      const provider = providers.find((p) => p.id === lastAsst.providerID);
      if (provider && provider.models && provider.models[lastAsst.modelID]) {
        limit = provider.models[lastAsst.modelID].limit?.context;
      }
    }

    if (limit && limit > 0) {
      return Math.round((totalTokens / limit) * 100);
    }
  } catch (err) {}

  return 0;
}

// 调用我们开发的 spf CLI 进行双重校验
async function runSpfHook($, directory, percentage) {
  try {
    const result = await $`spf hook ${percentage} opencode`
      .cwd(directory)
      .quiet()
      .nothrow();
    return result.stdout.trim();
  } catch (err) {
    return null;
  }
}

// 触发系统级 UI 通知
async function notify($, title, message) {
  await $`osascript -e ${`display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`}`.nothrow();
}

// 接收 OpenCode 运行时注入的依赖 (包括底层 SDK client)
export const SuperpowersPlanningPlugin = async ({ directory, $, client }) => {
  return {
    event: async ({ event, session }) => {
      if (!hasProjectMarker(directory)) return;

      if (
        event.type === "session.created" ||
        event.type === "message.created"
      ) {
        const sessionID = session?.id || session?.sessionID;
        const percentage = await getContextPercentage(client, sessionID);

        const hookMessage = await runSpfHook($, directory, percentage);
        if (hookMessage) {
          if (hookMessage.includes("严禁切 Session")) {
            await notify(
              $,
              "Planning 锚点缺失",
              "恢复锚点不齐全，大模型正在后台静默为您创建规划文件！",
            );
          } else if (hookMessage.includes("系统状态通知")) {
            await notify(
              $,
              "Context 警告",
              `上下文已达 ${percentage}%，建议考虑执行 /new 或 /clear 切换 Session！`,
            );
          }
        }
      }
    },

    "experimental.chat.system.transform": async (input, output) => {
      if (!hasProjectMarker(directory)) return;

      const knownLimit = input.model?.limit?.context;
      const percentage = await getContextPercentage(
        client,
        input.sessionID,
        knownLimit,
      );

      const hookMessage = await runSpfHook($, directory, percentage);

      if (hookMessage) {
        let aiVisualInstruction = "";
        const progressBar = createProgressBar(percentage);

        if (hookMessage.includes("严禁切 Session")) {
          aiVisualInstruction = `Project anchors are missing! Whether this is a brand new project or an existing one, you MUST silently create the required planning files (docs/planning/current.md, docs/planning/history.md, docs/planning/decisions.md, and a spec) right now. If it is an existing project, briefly explore the codebase to infer the current goals and state, and populate the planning files with real content. DO NOT output a red warning to the user or ask them to do it. Just use your file-writing tools to initialize and update these files silently in the background, then proceed with the user's request.`;
        } else if (hookMessage.includes("即将触发压缩")) {
          aiVisualInstruction = `YOU MUST IMMEDIATELY STOP IMPLEMENTING CODE. Start your response with exactly "🔴 **[严重警告：上下文告急]** ${progressBar}" in bold red text. Urgently advise the user to run /new (or /clear) to switch sessions before memory is compressed. Explain that they can decide whether to clear it this exact second or wait a few more turns, but the risk of hallucination is extremely high.`;
        } else {
          aiVisualInstruction = `Start your response with exactly "🟡 **[温馨提示：建议清理上下文]** ${progressBar}" in bold text. Gently remind the user that context is at ${percentage}%, and it might be a good time to run /new (or /clear) soon to maintain optimal performance. They can choose to do it now or after a few more messages.`;
        }

        output.system.push(
          `Project workflow detected. IMPORTANT ALERT from superpowers-planning-with-files:\n${hookMessage}\n\n${aiVisualInstruction}`,
        );
      } else {
        output.system.push(
          "Project workflow detected. Automatically prefer superpowers-planning-with-files. Before continuing implementation, read docs/planning/current.md and docs/planning/decisions.md, then keep project truth updated through the main agent.",
        );
      }
    },
  };
};
