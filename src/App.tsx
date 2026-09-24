import React, { useCallback, useMemo, useState } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import { BRICKS, brickKey, neighborCandidates, type Direction } from "./brick.js";
import { BrickMap } from "./BrickMap.js";
import { ModalOverlay } from "./ModalOverlay.js";
import { UnitPicker, groupPriceTabs, unitsForPrice } from "./UnitPicker.js";
import { ActiveTraitsPanel } from "./ActiveTraitsPanel.js";
import { computeActiveTraits } from "./activeTraits.js";
import { PoolSettings, type SettingsSection } from "./PoolSettings.js";
import { MatchSettings } from "./MatchSettings.js";
import { ShopBar } from "./ShopBar.js";
import { BenchBar } from "./BenchBar.js";
import { poolGrandTotal, summarizePool } from "./pool/calc.js";
import { rollShop, type ShopSlot } from "./pool/shop.js";
import { loadPoolConfig, savePoolConfig, setCopies, setShopOdds } from "./pool/store.js";
import {
  COSTS,
  PLAYER_LEVELS,
  createDefaultPoolConfig,
  type Cost,
  type PlayerLevel,
  type PoolConfig,
} from "./pool/types.js";
import {
  BENCH_SIZE,
  buyToBench,
  createEmptyBench,
  deployBenchToBoard,
  sellFromBench,
  type BenchSlots,
  type BoardMap,
} from "./board.js";
import { HomeScreen, HOME_MENU_COUNT, homeMenuId } from "./HomeScreen.js";
import { parseBenchSellIndex } from "./benchSellKey.js";
import type { UnitsFile } from "./units/types.js";
import type { TraitsFile } from "./traits/types.js";

const byCoord = new Map(BRICKS.map((b) => [brickKey(b.col, b.row), b]));
const SHOP_SLOTS = 5;

type Props = {
  unitsFile: UnitsFile;
  traitsFile: TraitsFile;
};

type Screen = "home" | "board" | "picker" | "settings" | "match";
type FocusZone = "board" | "shop" | "bench";
type SettingsReturn = "home" | "board";

export function App({ unitsFile, traitsFile }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [focusIndex, setFocusIndex] = useState(0);
  const [board, setBoard] = useState<BoardMap>({});
  const [bench, setBench] = useState<BenchSlots>(() => createEmptyBench());
  const [screen, setScreen] = useState<Screen>("home");
  const [homeFocus, setHomeFocus] = useState(0);
  const [settingsReturn, setSettingsReturn] = useState<SettingsReturn>("home");
  const [priceTab, setPriceTab] = useState(0);
  const [listIndex, setListIndex] = useState(0);
  const [poolConfig, setPoolConfig] = useState<PoolConfig>(() => loadPoolConfig());
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("copies");
  const [settingsFocus, setSettingsFocus] = useState(0);
  const [playerLevel, setPlayerLevel] = useState<PlayerLevel>(8);
  const [shopSlots, setShopSlots] = useState<ShopSlot[]>(() =>
    rollShop(unitsFile.units, loadPoolConfig(), 8, SHOP_SLOTS),
  );
  const [focusZone, setFocusZone] = useState<FocusZone>("board");
  const [shopFocus, setShopFocus] = useState(0);
  const [benchFocus, setBenchFocus] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const focused = BRICKS[focusIndex]!;
  const priceTabs = useMemo(() => groupPriceTabs(unitsFile.units), [unitsFile.units]);
  const currentPrice = priceTabs[priceTab] ?? priceTabs[0] ?? 1;
  const currentList = useMemo(
    () => unitsForPrice(unitsFile.units, currentPrice),
    [unitsFile.units, currentPrice],
  );

  const traitRows = useMemo(
    () => computeActiveTraits(board, bench, unitsFile.units, traitsFile.traits),
    [board, bench, unitsFile.units, traitsFile.traits],
  );

  const priceByName = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const u of unitsFile.units) map.set(u.name, u.price);
    return map;
  }, [unitsFile.units]);

  const poolSummaries = useMemo(
    () => summarizePool(unitsFile.units, poolConfig),
    [unitsFile.units, poolConfig],
  );
  const poolTotal = useMemo(() => poolGrandTotal(poolSummaries), [poolSummaries]);

  const refreshShop = useCallback(
    (level: PlayerLevel = playerLevel, cfg: PoolConfig = poolConfig) => {
      setShopSlots(rollShop(unitsFile.units, cfg, level, SHOP_SLOTS));
    },
    [playerLevel, poolConfig, unitsFile.units],
  );

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
    refreshShop(playerLevel, poolConfig);
    setScreen(settingsReturn);
  }, [poolConfig, playerLevel, refreshShop, settingsReturn]);

  const openSettings = useCallback((from: SettingsReturn) => {
    setSettingsReturn(from);
    setSettingsSection("copies");
    setSettingsFocus(0);
    setScreen("settings");
  }, []);

  const openMatchSettings = useCallback(() => {
    setScreen("match");
  }, []);

  const closeMatchSettings = useCallback(() => {
    refreshShop(playerLevel);
    setScreen("board");
  }, [playerLevel, refreshShop]);

  const bumpPlayerLevel = useCallback((delta: -1 | 1) => {
    setPlayerLevel((lv) => {
      const idx = PLAYER_LEVELS.indexOf(lv);
      const next = PLAYER_LEVELS[Math.min(PLAYER_LEVELS.length - 1, Math.max(0, idx + delta))]!;
      return next;
    });
  }, []);

  const activateHomeItem = useCallback(() => {
    const id = homeMenuId(homeFocus);
    if (id === "board") {
      setScreen("board");
      return;
    }
    if (id === "settings") {
      openSettings("home");
      return;
    }
    exit();
  }, [homeFocus, openSettings, exit]);

  const confirmPick = useCallback(() => {
    const unit = currentList[listIndex];
    if (!unit) return;
    const result = buyToBench(board, bench, unit.name);
    if (!result.ok) {
      setStatusMsg("备战席已满");
      setScreen("board");
      return;
    }
    setBoard(result.board);
    setBench(result.bench);
    setStatusMsg(`备战席 + ${unit.name}`);
    setScreen("board");
  }, [currentList, listIndex, board, bench]);

  const buyFromShop = useCallback(
    (slotIndex: number = shopFocus) => {
      const slot = shopSlots[slotIndex];
      if (!slot?.unit) {
        setStatusMsg(`商店栏 ${slotIndex + 1} 为空`);
        return;
      }
      const name = slot.unit.name;
      const result = buyToBench(board, bench, name);
      if (!result.ok) {
        setStatusMsg("备战席已满（9/9）");
        return;
      }
      setBoard(result.board);
      setBench(result.bench);
      setShopSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { unit: null, cost: null };
        return next;
      });
      setShopFocus(slotIndex);
      setStatusMsg(`购买 ${name} → 备战席（含场上自动合成）`);
    },
    [shopSlots, shopFocus, board, bench],
  );

  const deployFromBench = useCallback(() => {
    const result = deployBenchToBoard(board, bench, benchFocus, focused.id);
    if (!result.ok) {
      setStatusMsg("该备战席栏位为空");
      return;
    }
    setBoard(result.board);
    setBench(result.bench);
    setStatusMsg(`上场 → ${focused.id}`);
  }, [board, bench, benchFocus, focused.id]);

  const sellBenchSlot = useCallback(
    (index: number) => {
      const result = sellFromBench(bench, index);
      if (!result.ok || !result.piece) {
        setStatusMsg(`备战席 ${index + 1} 为空`);
        return;
      }
      setBench(result.bench);
      setBenchFocus(index);
      setStatusMsg(`出售 ${result.piece.name}（${result.piece.stars}★）← 备战 ${index + 1}`);
    },
    [bench],
  );

  useInput((input, key) => {
    if (screen === "home") {
      if (input === "q" || key.escape) {
        exit();
        return;
      }
      if (key.upArrow) {
        setHomeFocus((i) => (i + HOME_MENU_COUNT - 1) % HOME_MENU_COUNT);
        return;
      }
      if (key.downArrow) {
        setHomeFocus((i) => (i + 1) % HOME_MENU_COUNT);
        return;
      }
      if (input === "1") {
        setScreen("board");
        return;
      }
      if (input === "2") {
        openSettings("home");
        return;
      }
      if (key.return) {
        activateHomeItem();
        return;
      }
      return;
    }

    if (screen === "settings") {
      if (key.escape || key.return) {
        closeSettings();
        return;
      }
      if (key.tab) {
        setSettingsSection((s) => (s === "copies" ? "odds" : "copies"));
        setSettingsFocus(0);
        return;
      }
      if (input === "r" || input === "R") {
        setPoolConfig(createDefaultPoolConfig());
        return;
      }

      if (settingsSection === "copies") {
        if (key.upArrow) {
          setSettingsFocus((i) => (i + COSTS.length - 1) % COSTS.length);
          return;
        }
        if (key.downArrow) {
          setSettingsFocus((i) => (i + 1) % COSTS.length);
          return;
        }
        if (key.leftArrow || input === "-") {
          setPoolConfig((cfg) =>
            setCopies(cfg, COSTS[settingsFocus] as Cost, cfg.copiesByCost[COSTS[settingsFocus] as Cost] - 1),
          );
          return;
        }
        if (key.rightArrow || input === "+" || input === "=") {
          setPoolConfig((cfg) =>
            setCopies(cfg, COSTS[settingsFocus] as Cost, cfg.copiesByCost[COSTS[settingsFocus] as Cost] + 1),
          );
          return;
        }
        return;
      }

      const gridCols = COSTS.length;
      const gridRows = PLAYER_LEVELS.length;
      const max = gridCols * gridRows;
      if (key.upArrow) {
        setSettingsFocus((i) => (i - gridCols + max) % max);
        return;
      }
      if (key.downArrow) {
        setSettingsFocus((i) => (i + gridCols) % max);
        return;
      }
      if (key.leftArrow) {
        setSettingsFocus((i) => {
          const li = Math.floor(i / gridCols);
          const ci = i % gridCols;
          return li * gridCols + ((ci + gridCols - 1) % gridCols);
        });
        return;
      }
      if (key.rightArrow) {
        setSettingsFocus((i) => {
          const li = Math.floor(i / gridCols);
          const ci = i % gridCols;
          return li * gridCols + ((ci + 1) % gridCols);
        });
        return;
      }
      if (input === "-" || input === "+" || input === "=") {
        const li = Math.floor(settingsFocus / gridCols);
        const ci = settingsFocus % gridCols;
        const level = PLAYER_LEVELS[li]!;
        const cost = COSTS[ci]!;
        const delta = input === "-" ? -1 : 1;
        setPoolConfig((cfg) => setShopOdds(cfg, level, cost, cfg.shopOddsByLevel[level][cost] + delta));
        return;
      }
      return;
    }

    if (screen === "match") {
      if (key.escape || key.return) {
        closeMatchSettings();
        return;
      }
      if (key.upArrow || key.rightArrow || input === "]") {
        bumpPlayerLevel(1);
        return;
      }
      if (key.downArrow || key.leftArrow || input === "[") {
        bumpPlayerLevel(-1);
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
      setScreen("home");
      return;
    }
    if (input === "h" || input === "H") {
      setScreen("home");
      return;
    }
    if (input === "s" || input === "S") {
      openMatchSettings();
      return;
    }
    if (input === "d" || input === "D") {
      refreshShop();
      setStatusMsg("商店已刷新");
      return;
    }
    if (input === "[") {
      bumpPlayerLevel(-1);
      return;
    }
    if (input === "]") {
      bumpPlayerLevel(1);
      return;
    }
    // Ctrl/Alt + 1–9：出售备战席对应栏（含终端 CSI 序列）
    {
      const sellIndex = parseBenchSellIndex(input, key);
      if (sellIndex !== null) {
        sellBenchSlot(sellIndex);
        return;
      }
    }
    // 主键盘 / 小键盘数字 1–5：直接购买对应商店栏到备战席（满 3 含场上自动合成）
    if (!key.ctrl && !key.meta && input >= "1" && input <= "5") {
      buyFromShop(Number(input) - 1);
      return;
    }
    if (input === " ") {
      if (focusZone === "shop" || focusZone === "bench") return;
      openPicker();
      return;
    }
    if (key.return) {
      if (focusZone === "shop") {
        buyFromShop(shopFocus);
        return;
      }
      if (focusZone === "bench") {
        deployFromBench();
        return;
      }
    }
    if (key.tab) {
      setFocusZone((z) => {
        if (z === "board") return "bench";
        if (z === "bench") return "shop";
        return "board";
      });
      return;
    }

    if (focusZone === "shop") {
      if (key.leftArrow) {
        setShopFocus((i) => (i + SHOP_SLOTS - 1) % SHOP_SLOTS);
        return;
      }
      if (key.rightArrow) {
        setShopFocus((i) => (i + 1) % SHOP_SLOTS);
        return;
      }
      if (key.upArrow) {
        setFocusZone("board");
        return;
      }
      if (key.downArrow) return;
      return;
    }

    if (focusZone === "bench") {
      if (key.upArrow) {
        setBenchFocus((i) => (i + BENCH_SIZE - 1) % BENCH_SIZE);
        return;
      }
      if (key.downArrow) {
        setBenchFocus((i) => (i + 1) % BENCH_SIZE);
        return;
      }
      if (key.rightArrow) {
        setFocusZone("board");
        return;
      }
      return;
    }

    if (key.downArrow) {
      const brick = BRICKS[focusIndex]!;
      if (brick.row >= 3) {
        setFocusZone("shop");
        return;
      }
    }
    if (key.leftArrow) {
      // 最左列可进备战席
      const brick = BRICKS[focusIndex]!;
      if (brick.col === 0 && (brick.row % 2 === 0 || brick.col === 0)) {
        // even rows col0 is leftmost; odd rows leftmost is also often col 0 after offset
        setFocusZone("bench");
        return;
      }
    }

    if (key.leftArrow) moveFocus("left");
    if (key.rightArrow) moveFocus("right");
    if (key.upArrow) moveFocus("up");
    if (key.downArrow) moveFocus("down");
  });

  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;
  const benchCount = bench.filter(Boolean).length;

  if (screen === "home") {
    return (
      <HomeScreen
        focusIndex={homeFocus}
        unitsCount={unitsFile.units.length}
        traitsCount={traitsFile.traits.length}
      />
    );
  }

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
          section={settingsSection}
          focusIndex={settingsFocus}
          grandTotal={poolTotal}
        />
      </ModalOverlay>
    );
  }

  if (screen === "match") {
    return (
      <ModalOverlay>
        <MatchSettings level={playerLevel} odds={poolConfig.shopOddsByLevel[playerLevel]} />
      </ModalOverlay>
    );
  }

  return (
    <Box flexDirection="column" width={cols} height={rows}>
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Text bold>jcc-tui — 交错矩形（砖墙）</Text>
        <Text dimColor>
          等级 {playerLevel} · 备战 {benchCount}/{BENCH_SIZE} · D 刷新 · 1-5 购买 · Ctrl+1-9 出售 · S
          局内 · H/Esc 首页 · q 退出
        </Text>
        <Text>
          当前焦点：
          <Text color={focused.focusColor} bold>
            {focused.id}
          </Text>
          {board[focused.id] ? (
            <Text>
              {" → "}
              <Text color="green">{board[focused.id]!.name}</Text>
              <Text dimColor> {board[focused.id]!.stars}★</Text>
            </Text>
          ) : null}
          {focusZone === "shop" ? <Text dimColor> ｜ 商店栏 {shopFocus + 1}</Text> : null}
          {focusZone === "bench" ? <Text dimColor> ｜ 备战席 {benchFocus + 1}</Text> : null}
        </Text>
        {statusMsg ? <Text color="yellow">{statusMsg}</Text> : null}

        <Box marginTop={1} flexDirection="row" gap={2}>
          <BenchBar
            slots={bench}
            focusSlot={focusZone === "bench" ? benchFocus : null}
            priceByName={priceByName}
          />
          <Box flexDirection="column">
            <BrickMap
              focusedId={focusZone === "board" ? focused.id : null}
              board={board}
              priceByName={priceByName}
            />
            <ShopBar
              slots={shopSlots}
              level={playerLevel}
              focusSlot={focusZone === "shop" ? shopFocus : null}
            />
          </Box>
          <ActiveTraitsPanel rows={traitRows} />
        </Box>
      </Box>
    </Box>
  );
}
