import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

import { assertUnreachable } from "@phoenix/typeUtils";

const jsonSchemaZodSchema = z
  .object({
    type: z.literal("object"),
    properties: z
      .record(
        z
          .object({
            type: z
              .enum([
                "string",
                "number",
                "boolean",
                "object",
                "array",
                "null",
                "integer",
              ])
              .describe("The type of the parameter"),
            description: z
              .string()
              .optional()
              .describe("A description of the parameter"),
            enum: z.array(z.string()).optional().describe("The allowed values"),
          })
          .passthrough()
      )
      .describe("A map of parameter names to their definitions"),
    required: z
      .array(z.string())
      .optional()
      .describe("The required parameters"),
    additionalProperties: z
      .boolean()
      .optional()
      .describe(
        "Whether or not additional properties are allowed in the schema"
      ),
  })
  .passthrough();

/**
 * The schema for an OpenAI tool definition
 * @see https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
 *
 * Note: The nested passThrough's are used to allow for extra keys in JSON schema, however, they do not actually
 * allow for extra keys when the zod schema is used for parsing. This is to allow more flexibility for users
 * to define their own tools according
 */
export const openAIToolDefinitionSchema = z
  .object({
    type: z.literal("function").describe("The type of the tool"),
    function: z
      .object({
        name: z.string().describe("The name of the function"),
        description: z
          .string()
          .optional()
          .describe("A description of the function"),
        parameters: jsonSchemaZodSchema
          .extend({
            strict: z
              .boolean()
              .optional()
              .describe(
                "Whether or not the arguments should exactly match the function definition, only supported for OpenAI models"
              ),
          })
          .describe("The parameters that the function accepts"),
      })
      .passthrough()
      .describe("The function definition"),
  })
  .passthrough();

/**
 * The type of a tool definition
 * @see https://platform.openai.com/docs/guides/structured-outputs/supported-schemas
 */
export type OpenAIToolDefinition = z.infer<typeof openAIToolDefinitionSchema>;

/**
 * The JSON schema for a tool definition
 */
export const openAIToolDefinitionJSONSchema = zodToJsonSchema(
  openAIToolDefinitionSchema,
  {
    removeAdditionalStrategy: "passthrough",
  }
);

/**
 * Anthropic tool format
 */
export const anthropicToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: jsonSchemaZodSchema,
});

export type AnthropicToolDefinition = z.infer<
  typeof anthropicToolDefinitionSchema
>;

/**
 * --------------------------------
 * Conversion Schemas
 * --------------------------------
 */

/**
 * Parse incoming object as an Anthropic tool call and immediately convert to OpenAI format
 */
export const anthropicToOpenAI = anthropicToolDefinitionSchema.transform(
  (anthropic): OpenAIToolDefinition => ({
    id: "",
    type: "function",
    function: {
      name: anthropic.name,
      description: anthropic.description,
      parameters: anthropic.input_schema,
    },
  })
);

/**
 * Parse incoming object as an OpenAI tool call and immediately convert to Anthropic format
 */
export const openAIToAnthropic = openAIToolDefinitionSchema.transform(
  (openai): AnthropicToolDefinition => ({
    name: openai.function.name,
    description: openai.function.description ?? openai.function.name,
    input_schema: openai.function.parameters,
  })
);

/**
 * --------------------------------
 * Conversion Helpers
 * --------------------------------
 */

/**
 * Union of all tool call formats
 *
 * This is useful for functions that need to accept any tool definition format
 */
export const anyToolDefinitionSchema = z.union([
  openAIToolDefinitionSchema,
  anthropicToolDefinitionSchema,
]);

export type AnyToolDefinition = z.infer<typeof anyToolDefinitionSchema>;

/**
 * Detect the provider of a tool call object
 */
export const detectProvider = (
  toolDefinition: unknown
): { provider: ModelProvider; validatedToolDefinition: AnyToolDefinition } => {
  let parsedToolDefinition: z.SafeParseReturnType<unknown, AnyToolDefinition>;

  parsedToolDefinition = openAIToolDefinitionSchema.safeParse(toolDefinition);
  if (parsedToolDefinition.success) {
    return {
      provider: "OPENAI",
      validatedToolDefinition: parsedToolDefinition.data,
    };
  }
  parsedToolDefinition =
    anthropicToolDefinitionSchema.safeParse(toolDefinition);
  if (parsedToolDefinition.success) {
    return {
      provider: "ANTHROPIC",
      validatedToolDefinition: parsedToolDefinition.data,
    };
  }
  throw new Error("Unknown tool call format");
};

/**
 * Convert from any tool call format to OpenAI format
 */
export const toOpenAIFormat = (
  toolDefinition: AnyToolDefinition
): OpenAIToolDefinition => {
  const { provider, validatedToolDefinition } = detectProvider(toolDefinition);
  switch (provider) {
    case "AZURE_OPENAI":
    case "OPENAI":
      return validatedToolDefinition as OpenAIToolDefinition;
    case "ANTHROPIC":
      return anthropicToOpenAI.parse(validatedToolDefinition);
    default:
      assertUnreachable(provider);
  }
};

/**
 * Convert from OpenAI tool call format to any other format
 */
export const fromOpenAIFormat = (
  toolDefinition: OpenAIToolDefinition,
  targetProvider: ModelProvider
): AnyToolDefinition => {
  switch (targetProvider) {
    case "AZURE_OPENAI":
    case "OPENAI":
      return toolDefinition;
    case "ANTHROPIC":
      return openAIToAnthropic.parse(toolDefinition);
    default:
      assertUnreachable(targetProvider);
  }
};
