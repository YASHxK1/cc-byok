import { z } from "zod";
export declare const chatCompletionRequestSchema: z.ZodObject<{
    model: z.ZodDefault<z.ZodString>;
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            system: "system";
            developer: "developer";
            user: "user";
            assistant: "assistant";
            tool: "tool";
        }>;
        content: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            text: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>>, z.ZodNull]>>;
        name: z.ZodOptional<z.ZodString>;
        tool_call_id: z.ZodOptional<z.ZodString>;
        tool_calls: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodLiteral<"function">;
            function: z.ZodObject<{
                name: z.ZodString;
                arguments: z.ZodString;
            }, z.core.$strip>;
        }, z.core.$strip>>>;
    }, z.core.$loose>>;
    stream: z.ZodDefault<z.ZodBoolean>;
    tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"function">;
        function: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            parameters: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>;
    }, z.core.$strip>>>;
    tool_choice: z.ZodOptional<z.ZodUnknown>;
}, z.core.$loose>;
export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema>;
export declare const anthropicMessagesRequestSchema: z.ZodObject<{
    model: z.ZodString;
    max_tokens: z.ZodNumber;
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            system: "system";
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"text">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"tool_use">;
            id: z.ZodString;
            name: z.ZodString;
            input: z.ZodUnknown;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"tool_result">;
            tool_use_id: z.ZodString;
            content: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodObject<{
                type: z.ZodLiteral<"text">;
                text: z.ZodString;
            }, z.core.$strip>>]>>;
            is_error: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>], "type">>]>;
    }, z.core.$strip>>;
    system: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"text">;
        text: z.ZodString;
    }, z.core.$strip>>]>>;
    stream: z.ZodDefault<z.ZodBoolean>;
    tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        input_schema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>>>;
    tool_choice: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"auto">;
        disable_parallel_tool_use: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"any">;
        disable_parallel_tool_use: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"tool">;
        name: z.ZodString;
        disable_parallel_tool_use: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>], "type">>;
}, z.core.$loose>;
export type AnthropicMessagesRequest = z.infer<typeof anthropicMessagesRequestSchema>;
export interface GatewayTool {
    name: string;
    description: string;
    inputSchema: unknown;
}
export interface GatewayToolResult {
    callId: string;
    content: string;
    success: boolean;
}
export interface GatewayMessage {
    role: "system" | "developer" | "user" | "assistant";
    text: string;
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: unknown;
    }>;
}
export interface GatewayCompletionRequest {
    model: string;
    system?: string;
    messages: GatewayMessage[];
    tools: GatewayTool[];
    toolChoice: "auto" | "none" | "required" | {
        name: string;
    };
    toolResults: GatewayToolResult[];
}
export declare function fromOpenAi(request: ChatCompletionRequest): GatewayCompletionRequest;
export declare function fromAnthropic(request: AnthropicMessagesRequest): GatewayCompletionRequest;
