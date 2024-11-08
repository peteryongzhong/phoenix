import { getTemplateLanguageUtils } from "@phoenix/components/templateEditor/templateEditorUtils";
import { TemplateLanguage } from "@phoenix/components/templateEditor/types";
import {
  DEFAULT_CHAT_ROLE,
  DEFAULT_MODEL_PROVIDER,
} from "@phoenix/constants/generativeConstants";
import {
  ChatMessage,
  createPlaygroundInstance,
  generateMessageId,
  generateToolId,
  ModelConfig,
  OpenAITool,
  PlaygroundInstance,
} from "@phoenix/store";
import { assertUnreachable } from "@phoenix/typeUtils";
import { safelyParseJSON } from "@phoenix/utils/jsonUtils";

import { InvocationParameterInput } from "./__generated__/PlaygroundOutputSubscription.graphql";
import {
  ChatRoleMap,
  INPUT_MESSAGES_PARSING_ERROR,
  MODEL_CONFIG_PARSING_ERROR,
  MODEL_CONFIG_WITH_INVOCATION_PARAMETERS_PARSING_ERROR,
  modelProviderToModelPrefixMap,
  OUTPUT_MESSAGES_PARSING_ERROR,
  OUTPUT_VALUE_PARSING_ERROR,
  SPAN_ATTRIBUTES_PARSING_ERROR,
  TOOLS_PARSING_ERROR,
} from "./constants";
import { InvocationParameter } from "./InvocationParametersForm";
import {
  chatMessageRolesSchema,
  chatMessagesSchema,
  llmInputMessageSchema,
  llmOutputMessageSchema,
  LlmToolSchema,
  llmToolSchema,
  MessageSchema,
  modelConfigSchema,
  modelConfigWithInvocationParametersSchema,
  outputSchema,
} from "./schemas";
import { PlaygroundSpan } from "./spanPlaygroundPageLoader";

/**
 * Checks if a string is a valid chat message role
 */
export function isChatMessageRole(role: unknown): role is ChatMessageRole {
  return chatMessageRolesSchema.safeParse(role).success;
}

/**
 * Takes a string role and attempts to map the role to a valid ChatMessageRole.
 * If the role is not found, it will default to {@link DEFAULT_CHAT_ROLE}.
 * @param role the role to map
 * @returns ChatMessageRole
 *
 * NB: Only exported for testing
 */
export function getChatRole(role: string): ChatMessageRole {
  if (isChatMessageRole(role)) {
    return role;
  }

  for (const [chatRole, acceptedValues] of Object.entries(ChatRoleMap)) {
    if (acceptedValues.includes(role)) {
      return chatRole as ChatMessageRole;
    }
  }
  return DEFAULT_CHAT_ROLE;
}

/**
 * Takes tool calls on a message from span attributes and transforms them into tool calls for a message in the playground
 * @param toolCalls Tool calls from a spans message to tool calls from a chat message in the playground
 * @returns Tool calls for a message in the playground
 *
 * NB: Only exported for testing
 */
export function processAttributeToolCalls(
  toolCalls?: MessageSchema["message"]["tool_calls"]
): ChatMessage["toolCalls"] {
  if (toolCalls == null) {
    return;
  }
  return toolCalls
    .map(({ tool_call }) => {
      if (tool_call == null) {
        return null;
      }
      return {
        id: tool_call.id ?? "",
        function: {
          name: tool_call.function?.name ?? "",
          arguments: tool_call.function?.arguments ?? {},
        },
      };
    })
    .filter((toolCall): toolCall is NonNullable<typeof toolCall> => {
      return toolCall != null;
    });
}

/**
 * Takes a list of messages from span attributes and transforms them into a list of {@link ChatMessage|ChatMessages}
 * @param messages messages from attributes either input or output @see {@link https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md|Semantic Conventions}}
 * returns a list of {@link ChatMessage|ChatMessages}
 */
function processAttributeMessagesToChatMessage(
  messages: MessageSchema[]
): ChatMessage[] {
  return messages.map(({ message }) => {
    return {
      id: generateMessageId(),
      role: getChatRole(message.role),
      content: message.content,
      toolCalls: processAttributeToolCalls(message.tool_calls),
    };
  });
}

/**
 * Attempts to parse the input messages from the span attributes.
 * @param parsedAttributes the JSON parsed span attributes
 * @returns an object containing the parsed {@link ChatMessage|ChatMessages} and any parsing errors
 *
 * NB: Only exported for testing
 */
export function getTemplateMessagesFromAttributes(parsedAttributes: unknown) {
  const inputMessages = llmInputMessageSchema.safeParse(parsedAttributes);
  if (!inputMessages.success) {
    return {
      messageParsingErrors: [INPUT_MESSAGES_PARSING_ERROR],
      messages: null,
    };
  }

  return {
    messageParsingErrors: [],
    messages: processAttributeMessagesToChatMessage(
      inputMessages.data.llm.input_messages
    ),
  };
}

/**
 * Attempts to get llm.output_messages then output.value from the span attributes.
 * @param parsedAttributes the JSON parsed span attributes
 * @returns an object containing the parsed output and any parsing errors
 *
 * NB: Only exported for testing
 */
export function getOutputFromAttributes(parsedAttributes: unknown) {
  const outputParsingErrors: string[] = [];
  const outputMessages = llmOutputMessageSchema.safeParse(parsedAttributes);
  if (outputMessages.success) {
    return {
      output: processAttributeMessagesToChatMessage(
        outputMessages.data.llm.output_messages
      ),
      outputParsingErrors,
    };
  }

  outputParsingErrors.push(OUTPUT_MESSAGES_PARSING_ERROR);

  const parsedOutput = outputSchema.safeParse(parsedAttributes);
  if (parsedOutput.success) {
    return {
      output: parsedOutput.data.output.value,
      outputParsingErrors,
    };
  }

  outputParsingErrors.push(OUTPUT_VALUE_PARSING_ERROR);

  return {
    output: undefined,
    outputParsingErrors,
  };
}

/**
 * Attempts to infer the provider of the model from the model name.
 * @param modelName the model name to get the provider from
 * @returns the provider of the model defaulting to {@link DEFAULT_MODEL_PROVIDER} if the provider cannot be inferred
 *
 * NB: Only exported for testing
 */
export function getModelProviderFromModelName(
  modelName: string
): ModelProvider {
  for (const provider of Object.keys(modelProviderToModelPrefixMap)) {
    const prefixes = modelProviderToModelPrefixMap[provider as ModelProvider];
    if (prefixes.some((prefix) => modelName.includes(prefix))) {
      return provider as ModelProvider;
    }
  }
  return DEFAULT_MODEL_PROVIDER;
}

/**
 * Attempts to get the llm.model_name, inferred provider, and invocation parameters from the span attributes.
 * @param parsedAttributes the JSON parsed span attributes
 * @returns the model config if it exists or parsing errors if it does not
 *
 * NB: Only exported for testing
 */
export function getBaseModelConfigFromAttributes(parsedAttributes: unknown): {
  modelConfig: ModelConfig | null;
  parsingErrors: string[];
} {
  const { success, data } = modelConfigSchema.safeParse(parsedAttributes);
  if (success) {
    return {
      modelConfig: {
        modelName: data.llm.model_name,
        provider: getModelProviderFromModelName(data.llm.model_name),
        invocationParameters: [],
      },
      parsingErrors: [],
    };
  }
  return { modelConfig: null, parsingErrors: [MODEL_CONFIG_PARSING_ERROR] };
}

/**
 * Attempts to get llm.invocation_parameters from the span attributes.
 * Invocation parameters are then massaged into the InvocationParameterInput type.
 * @param parsedAttributes the JSON parsed span attributes
 * @param modelSupportedInvocationParameters the model supported invocation parameters
 * @returns the invocation parameters from the span attributes
 *
 * NB: Only exported for testing
 */
export function getModelInvocationParametersFromAttributes(
  parsedAttributes: unknown,
  modelSupportedInvocationParameters: InvocationParameter[] = []
): {
  invocationParameters: InvocationParameterInput[];
  parsingErrors: string[];
} {
  const { success, data } =
    modelConfigWithInvocationParametersSchema.safeParse(parsedAttributes);
  const parsingErrors: string[] = [];

  if (!success) {
    parsingErrors.push(MODEL_CONFIG_WITH_INVOCATION_PARAMETERS_PARSING_ERROR);
  }

  const invocationParameters =
    transformInvocationParametersFromAttributesToInvocationParameterInputs(
      data?.llm.invocation_parameters ?? {},
      modelSupportedInvocationParameters
    );

  return {
    invocationParameters,
    parsingErrors,
  };
}

/**
 * Processes the tools from the span attributes into OpenAI tools to be used in the playground
 * @param tools tools from the span attributes
 * @returns playground OpenAI tools
 */
function processAttributeTools(tools: LlmToolSchema): OpenAITool[] {
  return (tools?.llm?.tools ?? [])
    .map((tool) => {
      if (tool?.tool == null) {
        return null;
      }
      return {
        id: generateToolId(),
        definition: tool.tool.json_schema,
      };
    })
    .filter((tool): tool is NonNullable<typeof tool> => tool != null);
}

/**
 * Attempts to get llm.tools from the span attributes.
 * @param parsedAttributes the JSON parsed span attributes
 * @returns the tools from the span attributes
 *
 * NB: Only exported for testing
 */
export function getToolsFromAttributes(
  parsedAttributes: unknown
):
  | { tools: OpenAITool[]; parsingErrors: never[] }
  | { tools: null; parsingErrors: string[] } {
  const { data, success } = llmToolSchema.safeParse(parsedAttributes);

  if (!success) {
    return { tools: null, parsingErrors: [TOOLS_PARSING_ERROR] };
  }
  // If there are no tools or llm attributes, we don't want to return parsing errors, it just means the span didn't have tools
  if (data?.llm?.tools == null) {
    return { tools: null, parsingErrors: [] };
  }
  return { tools: processAttributeTools(data), parsingErrors: [] };
}

/**
 * Takes a  {@link PlaygroundSpan|Span} and attempts to transform it's attributes into various fields on a {@link PlaygroundInstance}.
 * @param span the {@link PlaygroundSpan|Span} to transform into a playground instance
 * @returns a {@link PlaygroundInstance} with certain fields pre-populated from the span attributes
 */
export function transformSpanAttributesToPlaygroundInstance(
  span: PlaygroundSpan
): {
  playgroundInstance: PlaygroundInstance;
  /**
   * Errors that occurred during parsing of initial playground data.
   * For example, when coming from a span to the playground, the span may
   * not have the correct attributes, or the attributes may be of the wrong shape.
   * This field is used to store any issues encountered when parsing to display in the playground.
   */
  parsingErrors: string[];
} {
  const basePlaygroundInstance = createPlaygroundInstance();
  const { json: parsedAttributes, parseError } = safelyParseJSON(
    span.attributes
  );
  if (parseError) {
    return {
      playgroundInstance: {
        ...basePlaygroundInstance,
        spanId: span?.id ?? null,
      },
      parsingErrors: [SPAN_ATTRIBUTES_PARSING_ERROR],
    };
  }

  const { messages, messageParsingErrors } =
    getTemplateMessagesFromAttributes(parsedAttributes);
  const { output, outputParsingErrors } =
    getOutputFromAttributes(parsedAttributes);
  const parsedModelConfigResults =
    getBaseModelConfigFromAttributes(parsedAttributes);
  let { modelConfig } = parsedModelConfigResults;
  const { parsingErrors: modelConfigParsingErrors } = parsedModelConfigResults;
  const {
    invocationParameters,
    parsingErrors: invocationParametersParsingErrors,
  } = getModelInvocationParametersFromAttributes(
    parsedAttributes,
    // TODO(apowell): Parse invocation parameters from span attributes into InvocationParametersInput type
    // See https://github.com/Arize-ai/phoenix/issues/5234
    // See https://github.com/Arize-ai/phoenix/issues/5235
    []
  );

  // Merge invocation parameters into model config, if model config is present
  modelConfig =
    modelConfig != null
      ? {
          ...modelConfig,
          invocationParameters,
        }
      : null;

  const { tools, parsingErrors: toolsParsingErrors } =
    getToolsFromAttributes(parsedAttributes);

  // TODO(parker): add support for prompt template variables
  // https://github.com/Arize-ai/phoenix/issues/4886
  return {
    playgroundInstance: {
      ...basePlaygroundInstance,
      model: modelConfig ?? basePlaygroundInstance.model,
      template:
        messages != null
          ? {
              __type: "chat",
              messages,
            }
          : basePlaygroundInstance.template,
      output,
      spanId: span.id,
      tools: tools ?? basePlaygroundInstance.tools,
    },
    parsingErrors: [
      ...messageParsingErrors,
      ...outputParsingErrors,
      ...modelConfigParsingErrors,
      ...toolsParsingErrors,
      ...invocationParametersParsingErrors,
    ],
  };
}

/**
 * Checks if something is a valid {@link ChatMessage}
 */
export const isChatMessages = (
  messages: unknown
): messages is ChatMessage[] => {
  return chatMessagesSchema.safeParse(messages).success;
};

export const extractVariablesFromInstances = ({
  instances,
  templateLanguage,
}: {
  instances: PlaygroundInstance[];
  templateLanguage: TemplateLanguage;
}) => {
  const variables = new Set<string>();
  const utils = getTemplateLanguageUtils(templateLanguage);
  instances.forEach((instance) => {
    const instanceType = instance.template.__type;
    // this double nested loop should be okay since we don't expect more than 4 instances
    // and a handful of messages per instance
    switch (instanceType) {
      case "chat": {
        // for each chat message in the instance
        instance.template.messages.forEach((message) => {
          // extract variables from the message content
          const extractedVariables =
            message.content == null
              ? []
              : utils.extractVariables(message.content);
          extractedVariables.forEach((variable) => {
            variables.add(variable);
          });
        });
        break;
      }
      case "text_completion": {
        const extractedVariables = utils.extractVariables(
          instance.template.prompt
        );
        extractedVariables.forEach((variable) => {
          variables.add(variable);
        });
        break;
      }
      default: {
        assertUnreachable(instanceType);
      }
    }
  });

  return Array.from(variables);
};

/**
 * Filter out parameters that are not supported by a model's invocation parameter schema definitions.
 */
export const constrainInvocationParameterInputsToDefinition = (
  invocationParameterInputs: InvocationParameterInput[],
  definitions: InvocationParameter[]
) => {
  return invocationParameterInputs
    .filter((ip) =>
      // An input should be kept if it matches an invocation name in the definitions
      // or if it has a canonical name that matches a canonical name in the definitions.
      definitions.some(
        (mp) =>
          mp.invocationName === ip.invocationName ||
          // loosey null comparison to catch undefined and null
          (mp.canonicalName != null &&
            ip.canonicalName != null &&
            mp.canonicalName === ip.canonicalName)
      )
    )
    .map((ip) => ({
      // Transform the invocationName to match the new name from the incoming
      // modelSupportedInvocationParameters.
      ...ip,
      invocationName:
        definitions.find((mp) => mp.canonicalName === ip.canonicalName)
          ?.invocationName ?? ip.invocationName,
    }));
};

/**
 * Transform invocation parameters from span attributes into InvocationParameterInput type.
 */
export const transformInvocationParametersFromAttributesToInvocationParameterInputs =
  (
    invocationParameters: Record<string, string | number | boolean | string[]>,
    modelSupportedInvocationParameters: InvocationParameter[]
  ): InvocationParameterInput[] => {
    return Object.entries(invocationParameters)
      .map(([key, value]) => {
        const invocationParameter = modelSupportedInvocationParameters.find(
          (mp) =>
            (mp.canonicalName && mp.canonicalName === key) ||
            (mp.invocationName && mp.invocationName === key)
        );
        if (
          invocationParameter == null ||
          invocationParameter.invocationInputField == null ||
          invocationParameter.invocationName == null
        ) {
          return null;
        }
        return {
          canonicalName: invocationParameter.canonicalName,
          invocationName: invocationParameter.invocationName,
          [invocationParameter.invocationInputField]: value,
        };
      })
      .filter((ip): ip is NonNullable<typeof ip> => ip != null);
  };
