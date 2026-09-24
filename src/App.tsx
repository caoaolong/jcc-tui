import React, { useCallback, useMemo, useState } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import { BRICKS, brickKey, neighborCandidates, type Direction } from "./brick.js";
import { BrickMap } from "./BrickMap.js";
import { ModalOverlay } from "./ModalOverlay.js";
import { UnitPicker, groupPriceTabs, unitsForPrice } from "./UnitPicker.js";
import { ActiveTraitsPanel } from "./ActiveTraitsPanel.js";
import { computeActiveTraits } from "./activeTraits.js";
import { PoolSettings } from "./PoolSettings.js";
import { poolGrandTotal, summarizePool } from "./pool/calc.js";
import { loadPoolConfig, savePoolConfig, setCopies } from "./pool/store.js";
import { COSTS, createDefaultPoolConfig, type Cost, type PoolConfig } from "./pool/types.js";
import type { LabelMap } from "./buffer.js";
import type { UnitsFile } from "./units/types.js";
import type { TraitsFile } from "./traits/types.js";

const byCoord = new Map(BRICKS.map((b) => [brickKey(b.col, b.row), b]));

type Props = {
  unitsFile: UnitsFile;
  traitsFile: TraitsFile;
};

type Screen = "board" | "picker" | "settings";

export function App({ unitsFile, traitsFile }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [focusIndex, setFocusIndex] = useState(0);
  const [labels, setLabels] = useState<LabelMap>({});
  const [screen, setScreen] = useState<Screen>("board");
  const [priceTab, setPriceTab] = useState(0);
  const [listIndex, setListIndex] = useState(0);
  const [poolConfig, setPoolConfig] = useState<PoolConfig>(() => loadPoolConfig());
  const [settingsFocus, setSettingsFocus] = useState(0);

  const focused = BRICKS[focusIndex]!;
  const priceTabs = useMemo(() => groupPriceTabs(unitsFile.units), [unitsFile.units]);
  const currentPrice = priceTabs[priceTab] ?? priceTabs[0] ?? 1;
  const currentList = useMemo(
    () => unitsForPrice(unitsFile.units, currentPrice),
    [unitsFile.units, currentPrice],
  );

  const traitRows = useMemo(
    () => computeActiveTraits(labels, unitsFile.units, traitsFile.traits),
    [labels, unitsFile.units, traitsFile.traits],
  );

  const poolSummaries = useMemo(
    () => summarizePool(unitsFile.units, poolConfig),
    [unitsFile.units, poolConfig],
  );
  const poolTotal = useMemo(() => poolGrandTotal(poolSummaries), [poolSummaries]);

  const moveFocus = useCallback((direction: Direction) => {
    setFocusIndex((i) => {
      const cur = BRICKS[i]!;
      for (const next of neighborCandidates(cur, direction)) {
        const target = byCoord.get(brickKey(next.col, next.row));
        if (!target) continue;
        const idx = BRICKS.findIndex((b) => b.id === target.id);
        if (idx >= 0) return idx;
      }
      return i;
    });
  }, []);

  const openPicker = useCallback(() => {
    setPriceTab(0);
    setListIndex(0);
    setScreen("picker");
  }, []);

  const closeSettings = useCallback(() => {
    savePoolConfig(poolConfig);
    setScreen("board");
  }, [poolConfig]);

  const adjustCopies = useCallback((delta: number) => {
    setPoolConfig((cfg) => {
      const cost = COSTS[settingsFocus] as Cost;
      return setCopies(cfg, cost, cfg.copiesByCost[cost] + delta);
    });
  }, [settingsFocus]);

  const confirmPick = useCallback(() => {
    const unit = currentList[listIndex];
    if (!unit) return;
    setLabels((prev) => ({ ...prev, [focused.id]: unit.name }));
    setScreen("board");
  }, [currentList, listIndex, focused.id]);

  useInput((input, key) => {
    if (screen === "settings") {
      if (key.escape || key.return) {
        closeSettings();
        return;
      }
      if (key.upArrow) {
        setSettingsFocus((i) => (i + COSTS.length - 1) % COSTS.length);
        return;
      }
      if (key.downArrow) {
        setSettingsFocus((i) => (i + 1) % COSTS.length);
        return;
      }
      if (key.leftArrow || input === "-") {
        adjustCopies(-1);
        return;
      }
      if (key.rightArrow || input === "+" || input === "=") {
        adjustCopies(1);
        return;
      }
      if (input === "r" || input === "R") {
        setPoolConfig(createDefaultPoolConfig());
        return;
      }
      return;
    }

    if (screen === "picker") {
      if (key.escape) {
        setScreen("board");
        return;
      }
      if (key.leftArrow) {
        setPriceTab((t) => {
          const next = (t + priceTabs.length - 1) % Math.max(priceTabs.length, 1);
          setListIndex(0);
          return next;
        });
        return;
      }
      if (key.rightArrow) {
        setPriceTab((t) => {
          const next = (t + 1) % Math.max(priceTabs.length, 1);
          setListIndex(0);
          return next;
        });
        return;
      }
      if (key.upArrow) {
        setListIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setListIndex((i) => Math.min(Math.max(currentList.length - 1, 0), i + 1));
        return;
      }
      if (key.return) {
        confirmPick();
        return;
      }
      return;
    }

    if (input === "q") {
      exit();
      return;
    }
    if (key.escape) {
      exit();
      return;
    }
    if (input === "s" || input === "S") {
      setSettingsFocus(0);
      setScreen("settings");
      return;
    }
    if (input === " ") {
      openPicker();
      return;
    }
    if (key.leftArrow) moveFocus("left");
    if (key.rightArrow) moveFocus("right");
    if (key.upArrow) moveFocus("up");
    if (key.downArrow) moveFocus("down");
    if (key.tab) {
      setFocusIndex((i) => (i + (key.shift ? BRICKS.length - 1 : 1)) % BRICKS.length);
    }
  });

  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;

  if (screen === "picker") {
    return (
      <ModalOverlay>
        <UnitPicker
          units={unitsFile.units}
          cellLabel={focused.id}
          priceTab={priceTab}
          listIndex={listIndex}
          priceTabs={priceTabs}
        />
      </ModalOverlay>
    );
  }

  if (screen === "settings") {
    return (
      <ModalOverlay>
        <PoolSettings
          config={poolConfig}
          summaries={poolSummaries}
          focusIndex={settingsFocus}
          grandTotal={poolTotal}
        />
      </ModalOverlay>
    );
  }

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text bold>jcc-tui — 交错矩形（砖墙）</Text>
        <Text dimColor>
          棋子 {unitsFile.count} · 羁绊 {traitsFile.count} · 牌库 {poolTotal} 张 · 空格选棋 · s 设置 · q 退出
        </Text>
        <Text>
          当前焦点：
          <Text color={focused.focusColor} bold>
            {focused.id}
          </Text>
          {labels[focused.id] ? (
            <Text>
              {" → "}
              <Text color="green">{labels[focused.id]}</Text>
            </Text>
          ) : null}
        </Text>

        <Box marginTop={1} flexDirection="row" gap={2}>
          <BrickMap focusedId={focused.id} labels={labels} />
          <ActiveTraitsPanel rows={traitRows} />
        </Box>
      </Box>
    </Box>
  );
}
