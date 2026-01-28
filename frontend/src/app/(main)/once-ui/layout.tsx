"use client";

import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";

import {
  LayoutProvider,
  ThemeProvider,
  ToastProvider,
} from "@once-ui-system/core";

export default function OnceUILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </LayoutProvider>
  );
}
