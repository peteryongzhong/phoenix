import React from "react";
import { css } from "@emotion/react";

import { Card, Form, TextField } from "@arizeai/components";

import { useViewer } from "@phoenix/contexts/ViewerContext";

import { LogoutButton } from "./LogoutButton";

const profilePageCSS = css`
  overflow-y: auto;
`;

const profilePageInnerCSS = css`
  padding: var(--ac-global-dimension-size-400);
  max-width: 800px;
  min-width: 500px;
  box-sizing: border-box;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
`;

export function ProfilePage() {
  const { viewer } = useViewer();
  if (!viewer) {
    return null;
  }
  return (
    <main css={profilePageCSS}>
      <div css={profilePageInnerCSS}>
        <Card title="Profile" extra={<LogoutButton />} variant="compact">
          <Form>
            <TextField label="email" value={viewer.email} isReadOnly />
            <TextField
              label="username"
              value={viewer.username || ""}
              isReadOnly
            />
            <TextField label="role" value={viewer.role.name || ""} isReadOnly />
          </Form>
        </Card>
      </div>
    </main>
  );
}
