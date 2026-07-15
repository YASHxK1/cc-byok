import { z } from "zod";

const jsonSchema = z.record(z.string(), z.unknown());
const openAiContentPart = z.object({ type: z.string(), text: z.string().optional() }).passthrough();
const openAiToolCall = z.object({ id: z.string(), type: z.literal("function"), function: z.object({ name: z.string(), arguments: z.string() }) });
const openAiMessage = z.object({
  role: z.enum(["system", "developer", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.array(openAiContentPart), z.null()]).optional(),
  name: z.string().optional(), tool_call_id: z.string().optional(), tool_calls: z.array(openAiToolCall).optional(),
}).passthrough();
const openAiFunctionTool = z.object({ type: z.literal("function"), function: z.object({ name: z.string(), description: z.string().optional(), parameters: z.unknown().optional() }) });

export const chatCompletionRequestSchema = z.object({
  model: z.string().default("codex-latest"), messages: z.array(openAiMessage).min(1), stream: z.boolean().default(false),
  tools: z.array(openAiFunctionTool).optional(), tool_choice: z.unknown().optional(),
}).passthrough();
export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema>;

const anthropicTextBlock = z.object({ type: z.literal("text"), text: z.string() });
const anthropicToolUseBlock = z.object({ type: z.literal("tool_use"), id: z.string().min(1), name: z.string().min(1), input: z.unknown() });
const anthropicToolResultBlock = z.object({
  type: z.literal("tool_result"), tool_use_id: z.string().min(1),
  content: z.union([z.string(), z.array(anthropicTextBlock)]).optional(), is_error: z.boolean().optional(),
});
const anthropicContentBlock = z.discriminatedUnion("type", [anthropicTextBlock, anthropicToolUseBlock, anthropicToolResultBlock]);
const anthropicMessage = z.object({ role: z.enum(["user", "assistant", "system"]), content: z.union([z.string(), z.array(anthropicContentBlock)]) });
const anthropicToolChoice = z.discriminatedUnion("type", [
  z.object({ type: z.literal("auto"), disable_parallel_tool_use: z.boolean().optional() }),
  z.object({ type: z.literal("any"), disable_parallel_tool_use: z.boolean().optional() }),
  z.object({ type: z.literal("tool"), name: z.string().min(1), disable_parallel_tool_use: z.boolean().optional() }),
]);

export const anthropicMessagesRequestSchema = z.object({
  model: z.string().min(1), max_tokens: z.number().int().positive(), messages: z.array(anthropicMessage).min(1),
  system: z.union([z.string(), z.array(anthropicTextBlock)]).optional(), stream: z.boolean().default(false),
  tools: z.array(z.object({ name: z.string().min(1), description: z.string().optional(), input_schema: jsonSchema })).optional(),
  tool_choice: anthropicToolChoice.optional(),
}).passthrough().superRefine((request, context) => {
  request.messages.forEach((message, messageIndex) => {
    if (typeof message.content === "string") return;
    message.content.forEach((block, blockIndex) => {
      if (message.role !== "assistant" && block.type === "tool_use") context.addIssue({ code: "custom", path: ["messages", messageIndex, "content", blockIndex], message: "tool_use blocks are only valid in assistant messages." });
      if (message.role !== "user" && block.type === "tool_result") context.addIssue({ code: "custom", path: ["messages", messageIndex, "content", blockIndex], message: "tool_result blocks are only valid in user messages." });
    });
  });
  if (request.tool_choice && !request.tools?.length) context.addIssue({ code: "custom", path: ["tool_choice"], message: "tool_choice requires at least one tool." });
  if (request.tool_choice?.type === "tool") {
    const selectedName = request.tool_choice.name;
    if (!request.tools?.some((tool) => tool.name === selectedName)) context.addIssue({ code: "custom", path: ["tool_choice", "name"], message: "tool_choice names a tool that was not provided." });
  }
});
export type AnthropicMessagesRequest = z.infer<typeof anthropicMessagesRequestSchema>;

export interface GatewayTool { name: string; description: string; inputSchema: unknown }
export interface GatewayToolResult { callId: string; content: string; success: boolean }
export interface GatewayMessage { role: "system" | "developer" | "user" | "assistant"; text: string; toolCalls?: Array<{ id: string; name: string; arguments: unknown }> }
export interface GatewayCompletionRequest {
  model: string; system?: string; messages: GatewayMessage[]; tools: GatewayTool[];
  toolChoice: "auto" | "none" | "required" | { name: string }; toolResults: GatewayToolResult[];
}

export function fromOpenAi(request: ChatCompletionRequest): GatewayCompletionRequest {
  const toolResults: GatewayToolResult[] = [];
  const messages: GatewayMessage[] = [];
  for (const message of request.messages) {
    if (message.role === "tool") {
      if (message.tool_call_id) toolResults.push({ callId: message.tool_call_id, content: openAiMessageText(message.content), success: true });
      continue;
    }
    messages.push({
      role: message.role, text: openAiMessageText(message.content),
      toolCalls: message.tool_calls?.map((call) => ({ id: call.id, name: call.function.name, arguments: parseJson(call.function.arguments) })),
    });
  }
  let toolChoice: GatewayCompletionRequest["toolChoice"] = "auto";
  if (request.tool_choice === "none") toolChoice = "none";
  else if (request.tool_choice === "required") toolChoice = "required";
  else if (typeof request.tool_choice === "object" && request.tool_choice && "function" in request.tool_choice) {
    const name = (request.tool_choice as { function?: { name?: string } }).function?.name;
    if (name) toolChoice = { name };
  }
  return {
    model: request.model, messages, toolResults, toolChoice,
    tools: request.tools?.map((tool) => ({ name: tool.function.name, description: tool.function.description ?? "", inputSchema: tool.function.parameters ?? { type: "object" } })) ?? [],
  };
}

export function fromAnthropic(request: AnthropicMessagesRequest): GatewayCompletionRequest {
  const messages: GatewayMessage[] = [];
  const toolResults: GatewayToolResult[] = [];
  const systemParts: string[] = [];
  if (typeof request.system === "string") systemParts.push(request.system);
  else if (request.system) systemParts.push(request.system.map((part) => part.text).join("\n"));
  for (const message of request.messages) {
    if (message.role === "system") {
      systemParts.push(typeof message.content === "string" ? message.content : message.content.filter((block): block is z.infer<typeof anthropicTextBlock> => block.type === "text").map((block) => block.text).join("\n"));
      continue;
    }
    if (typeof message.content === "string") { messages.push({ role: message.role, text: message.content }); continue; }
    const text = message.content.filter((block): block is z.infer<typeof anthropicTextBlock> => block.type === "text").map((block) => block.text).join("\n");
    const toolCalls = message.content.filter((block): block is z.infer<typeof anthropicToolUseBlock> => block.type === "tool_use").map((block) => ({ id: block.id, name: block.name, arguments: block.input }));
    for (const result of message.content.filter((block): block is z.infer<typeof anthropicToolResultBlock> => block.type === "tool_result")) {
      toolResults.push({ callId: result.tool_use_id, content: typeof result.content === "string" ? result.content : result.content?.map((part) => part.text).join("") ?? "", success: !result.is_error });
    }
    if (text || toolCalls.length) messages.push({ role: message.role, text, toolCalls: toolCalls.length ? toolCalls : undefined });
  }
  const choice = request.tool_choice;
  const toolChoice: GatewayCompletionRequest["toolChoice"] = !choice || choice.type === "auto" ? "auto" : choice.type === "any" ? "required" : { name: choice.name };
  return {
    model: request.model,
    system: systemParts.filter(Boolean).join("\n\n") || undefined,
    messages, toolResults, toolChoice,
    tools: request.tools?.map((tool) => ({ name: tool.name, description: tool.description ?? "", inputSchema: tool.input_schema })) ?? [],
  };
}

function openAiMessageText(content: z.infer<typeof openAiMessage>["content"]): string {
  if (typeof content === "string") return content;
  return content?.map((part) => part.text ?? "").join("") ?? "";
}
function parseJson(value: string): unknown { try { return JSON.parse(value); } catch { return value; } }
