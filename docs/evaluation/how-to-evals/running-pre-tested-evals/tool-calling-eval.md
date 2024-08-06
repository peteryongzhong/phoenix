# Tool Calling Eval

This Tool Call aka Function Call eval can be used to determine how well a model selects a tool to use, extracts the right parameters from the user query, and generates the tool call code.

{% embed url="https://colab.research.google.com/github/Arize-ai/phoenix/blob/b107d9bc848efd38f030a8c72954e89616c43723/tutorials/evals/evaluate_tool_calling.ipynb" %}

{% embed url="https://www.youtube.com/watch?v=Rsu-UZ1ZVZU" %}
Demo
{% endembed %}

**Eval Prompt:**

```python
TOOL_CALLING_PROMPT_TEMPLATE = """
You are an evaluation assistant evaluating questions and tool calls to
determine whether the tool called would answer the question. The tool
calls have been generated by a separate agent, and chosen from the list of
tools provided below. It is your job to decide whether that agent chose
the right tool to call.

    [BEGIN DATA]
    ************
    [Question]: {question}
    ************
    [Tool Called]: {tool_call}
    [END DATA]

Your response must be single word, either "correct" or "incorrect",
and should not contain any text or characters aside from that word.
"incorrect" means that the chosen tool would not answer the question,
the tool includes information that is not presented in the question,
or that the tool signature includes parameter values that don't match
the formats specified in the tool signatures below.

"correct" means the correct tool call was chosen, the correct parameters
were extracted from the question, the tool call generated is runnable and correct,
and that no outside information not present in the question was used
in the generated question.

    [Tool Definitions]: {tool_definitions}
"""
```

**Example Code:**

```python
from phoenix.evals import (
    TOOL_CALLING_PROMPT_RAILS_MAP,
    TOOL_CALLING_PROMPT_TEMPLATE,
    OpenAIModel,
    llm_classify,
)

# the rails object will be used to snap responses to "correct" 
# or "incorrect"
rails = list(TOOL_CALLING_PROMPT_RAILS_MAP.values())
model = OpenAIModel(
    model_name="gpt-4",
    temperature=0.0,
)

# Loop through the specified dataframe and run each row 
# through the specified model and prompt. llm_classify
# will run requests concurrently to improve performance.
tool_call_evaluations = llm_classify(
    dataframe=df,
    template=TOOL_CALLING_PROMPT_TEMPLATE.template.replace("{tool_definitions}", json_tools),
    model=model,
    rails=rails,
    provide_explanation=True
)
```

Parameters:

* `df` - a dataframe of cases to evaluate. The dataframe must have these columns to match the default template:
  * `question` - the query made to the model. If you've [exported spans from Phoenix](https://app.gitbook.com/o/ZmsT56faZH0gUFkMMqBk/s/gtQcEYlwzTfZSAnHREvw/) to evaluate, this will the `llm.input_messages` column in your exported data.
  * `tool_call` - information on the tool called and parameters included. If you've [exported spans from Phoenix](../../../tracing/how-to-tracing/extract-data-from-spans.md) to evaluate, this will be the `llm.function_call` column in your exported data.