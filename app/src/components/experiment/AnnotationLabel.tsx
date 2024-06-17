import React, { useMemo } from "react";
import { interpolateSinebow } from "d3-scale-chromatic";
import { css } from "@emotion/react";

import {
  Flex,
  Label,
  Text,
  Tooltip,
  TooltipTrigger,
  TriggerWrap,
  View,
} from "@arizeai/components";

import { formatFloat } from "@phoenix/utils/numberFormatUtils";

interface Annotation {
  name: string;
  label?: string | null;
  score?: number | null;
  explanation?: string | null;
}

const textCSS = css`
  display: flex;
  align-items: center;
  .ac-text {
    display: inline-block;
    max-width: 9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
export function AnnotationLabel({ annotation }: { annotation: Annotation }) {
  const labelValue =
    (typeof annotation.score == "number" && formatFloat(annotation.score)) ||
    annotation.label ||
    "n/a";
  const color = useMemo(() => {
    // Derive a color from the label first character
    const charCode = annotation.name.charCodeAt(0);
    return interpolateSinebow((charCode % 26) / 26);
  }, [annotation.name]);
  return (
    <TooltipTrigger delay={0} offset={3}>
      <TriggerWrap>
        <Label color="grey-900" shape="badge">
          <Flex direction="row" gap="size-50" alignItems="center">
            <span
              css={css`
                background-color: ${color};
                display: inline-block;
                width: 0.6rem;
                height: 0.6rem;
                border-radius: 2px;
              `}
            />
            <div css={textCSS}>
              <Text weight="heavy" textSize="small" color="inherit">
                {annotation.name}
              </Text>
            </div>
            <div
              css={css(
                textCSS,
                css`
                  margin-left: var(--ac-global-dimension-100);
                `
              )}
            >
              <Text textSize="small">{labelValue}</Text>
            </div>
          </Flex>
        </Label>
      </TriggerWrap>
      <Tooltip>
        <Flex direction="row" gap="size-100">
          <Text weight="heavy" textSize="small" color="inherit">
            {annotation.name}
          </Text>
          <Text textSize="small" color="inherit">
            {labelValue}
          </Text>
        </Flex>
        {annotation.explanation ? (
          <View paddingTop="size-50">
            <Text textSize="small" color="inherit">
              {annotation.explanation}
            </Text>
          </View>
        ) : null}
      </Tooltip>
    </TooltipTrigger>
  );
}