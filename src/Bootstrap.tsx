import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { App } from "./App.js";
import { ensureProjectFont } from "./font.js";
import { ensureTraits } from "./traits/ensure.js";
import type { TraitsFile } from "./traits/types.js";
import { ensureUnits } from "./units/ensure.js";
import type { UnitsFile } from "./units/types.js";

type Phase = "loading" | "ready" | "error";

export function Bootstrap() {
  const { exit } = useApp();
  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState("检查本地数据…");
  const [fontNote, setFontNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unitsFile, setUnitsFile] = useState<UnitsFile | null>(null);
  const [traitsFile, setTraitsFile] = useState<TraitsFile | null>(null);

  useInput((input, key) => {
    if (phase === "error" && (input === "q" || key.escape)) exit();
  });

  useEffect(() => {
    let cancelled = false;
    const font = ensureProjectFont();
    if (!cancelled) setFontNote(font.message);

    (async () => {
      const units = await ensureUnits((msg) => {
        if (!cancelled) setStatus(msg);
      });
      if (cancelled) return;
      setUnitsFile(units);

      const traits = await ensureTraits((msg) => {
        if (!cancelled) setStatus(msg);
      });
      if (cancelled) return;
      setTraitsFile(traits);
      setPhase("ready");
    })().catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : String(err));
      setPhase("error");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text bold>jcc-tui</Text>
        <Text color="cyan">{status}</Text>
        {fontNote ? <Text dimColor>{fontNote}</Text> : null}
        <Text dimColor>首次启动将自动爬取 units.json / traits.json…</Text>
      </Box>
    );
  }

  if (phase === "error" || !unitsFile || !traitsFile) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text bold color="red">
          本地数据加载失败
        </Text>
        <Text>{error ?? "未知错误"}</Text>
        <Text dimColor>按 q / Esc 退出后重试</Text>
      </Box>
    );
  }

  return <App unitsFile={unitsFile} traitsFile={traitsFile} />;
}
