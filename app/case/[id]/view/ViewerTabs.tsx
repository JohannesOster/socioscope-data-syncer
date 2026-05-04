"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Card,
  Box,
  Group,
  Text,
  UnstyledButton,
  Tooltip,
  Badge,
  Stack,
} from "@mantine/core";
import { IconFileText, IconCode, IconHighlight } from "@tabler/icons-react";

export type Turn = {
  speaker: string;
  text: string;
  start?: number;
  end?: number;
};

export type ViewerSpan = {
  turn: number;
  start: number;
  end: number;
  quote: string;
  label?: string;
  notes?: string;
};

export type ViewerLayer = {
  key: string;
  fileName: string;
  username: string;
  layer?: string;
  description?: string;
  spans: ViewerSpan[];
  swatch: string;
  bg: string;
};

const SPEAKER_COLORS = [
  "#5B8C5A",
  "#5A7C8C",
  "#8C5A7C",
  "#C4A35A",
  "#7C8C5A",
  "#5A5A8C",
];

function colorFor(speaker: string): string {
  let h = 0;
  for (let i = 0; i < speaker.length; i++) {
    h = speaker.charCodeAt(i) + ((h << 5) - h);
  }
  return SPEAKER_COLORS[Math.abs(h) % SPEAKER_COLORS.length];
}

type RenderSpan = ViewerSpan & {
  layerKey: string;
  username: string;
  layerName?: string;
  swatch: string;
  bg: string;
};

function spanRow(s: RenderSpan): ReactNode {
  return (
    <Box>
      <Group gap={6} wrap="nowrap" align="center" mb={2}>
        <Box
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: s.swatch,
            flexShrink: 0,
          }}
        />
        <Text size="xs" fw={600}>
          {s.username}
        </Text>
        {s.layerName && (
          <Text size="xs" c="dimmed">
            : {s.layerName}
          </Text>
        )}
        {s.label && (
          <Badge size="xs" variant="light" color="gray">
            {s.label}
          </Badge>
        )}
      </Group>
      {s.notes && (
        <Text size="sm" style={{ whiteSpace: "normal", lineHeight: 1.4 }}>
          {s.notes}
        </Text>
      )}
    </Box>
  );
}

function tooltipForSegment(spans: RenderSpan[]): ReactNode {
  if (spans.length === 1) return <Box maw={320}>{spanRow(spans[0])}</Box>;
  return (
    <Stack gap={8} maw={320}>
      <Text size="xs" c="dimmed">
        {spans.length} overlapping highlights
      </Text>
      {spans.map((s, i) => (
        <Box
          key={i}
          pt={i === 0 ? 0 : 6}
          style={{ borderTop: i === 0 ? undefined : "1px solid #eee" }}
        >
          {spanRow(s)}
        </Box>
      ))}
    </Stack>
  );
}

// Sweep-line renderer: split the turn text at every span boundary, then for
// each sub-segment render nested <span>s for each active span. Translucent
// backgrounds compose in the browser so overlaps darken naturally and the
// hover tooltip can list all layers touching that segment.
function renderTurnText(text: string, spans: RenderSpan[]): ReactNode {
  if (spans.length === 0 || text.length === 0) return text;

  const clipped = spans.filter((s) => s.start < text.length && s.end > 0);
  if (clipped.length === 0) return text;

  const boundarySet = new Set<number>([0, text.length]);
  for (const s of clipped) {
    boundarySet.add(Math.max(0, s.start));
    boundarySet.add(Math.min(text.length, s.end));
  }
  const boundaries = Array.from(boundarySet).sort((a, b) => a - b);

  const out: ReactNode[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    if (segEnd <= segStart) continue;
    const segText = text.slice(segStart, segEnd);

    const active = clipped
      .filter((s) => s.start <= segStart && s.end >= segEnd)
      // Stable order for consistent stacking and tooltip listing
      .sort((a, b) => a.layerKey.localeCompare(b.layerKey));

    if (active.length === 0) {
      out.push(<span key={`p${segStart}`}>{segText}</span>);
      continue;
    }

    // Nested spans → translucent backgrounds blend per char.
    let inner: ReactNode = segText;
    for (let j = active.length - 1; j >= 0; j--) {
      inner = (
        <span key={j} style={{ background: active[j].bg }}>
          {inner}
        </span>
      );
    }

    out.push(
      <Tooltip
        key={`s${segStart}`}
        label={tooltipForSegment(active)}
        multiline
        w={320}
        withinPortal
        position="top"
        openDelay={120}
        closeDelay={60}
        events={{ hover: true, focus: true, touch: true }}
        bg="white"
        c="dark"
        styles={{
          tooltip: {
            border: "1px solid #e0e5df",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            padding: "8px 10px",
          },
        }}
      >
        <span style={{ cursor: "help", borderRadius: 2 }}>{inner}</span>
      </Tooltip>,
    );
  }
  return out;
}

type Props = {
  turns: Turn[];
  rawCsv: string;
  layers: ViewerLayer[];
};

export default function ViewerTabs({ turns, rawCsv, layers }: Props) {
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(layers.map((l) => l.key)),
  );

  function toggle(key: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Pre-bucket spans per turn for the active layers.
  const spansByTurn = useMemo(() => {
    const map = new Map<number, RenderSpan[]>();
    for (const layer of layers) {
      if (!enabled.has(layer.key)) continue;
      for (const s of layer.spans) {
        const list = map.get(s.turn) ?? [];
        list.push({
          ...s,
          layerKey: layer.key,
          username: layer.username,
          layerName: layer.layer,
          swatch: layer.swatch,
          bg: layer.bg,
        });
        map.set(s.turn, list);
      }
    }
    return map;
  }, [layers, enabled]);

  return (
    <Tabs defaultValue="formatted" keepMounted>
      <TabsList>
        <TabsTab value="formatted" leftSection={<IconFileText size={14} />}>
          Formatted
        </TabsTab>
        <TabsTab value="raw" leftSection={<IconCode size={14} />}>
          Raw CSV
        </TabsTab>
      </TabsList>

      <TabsPanel value="formatted" pt="md">
        {layers.length > 0 && (
          <Group gap={6} mb="sm" wrap="wrap" align="center">
            <IconHighlight size={14} color="#888" />
            <Text size="xs" c="dimmed">
              Layers:
            </Text>
            {layers.map((l) => {
              const on = enabled.has(l.key);
              return (
                <Tooltip
                  key={l.key}
                  withinPortal
                  position="top"
                  multiline
                  w={320}
                  openDelay={200}
                  label={
                    <Stack gap={4}>
                      <Text size="xs" fw={600}>
                        {l.layer ?? "Untitled layer"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        by {l.username} · {l.spans.length} span
                        {l.spans.length === 1 ? "" : "s"} · {l.fileName}
                      </Text>
                      {l.description && (
                        <Text
                          size="sm"
                          style={{ whiteSpace: "normal", lineHeight: 1.4 }}
                        >
                          {l.description}
                        </Text>
                      )}
                    </Stack>
                  }
                  bg="white"
                  c="dark"
                  styles={{
                    tooltip: {
                      border: "1px solid #e0e5df",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                      padding: "8px 10px",
                    },
                  }}
                >
                  <UnstyledButton
                    onClick={() => toggle(l.key)}
                    px={8}
                    py={4}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 999,
                      border: `1px solid ${on ? l.swatch : "#dee2e6"}`,
                      background: on ? l.bg : "transparent",
                      fontSize: 12,
                      color: on ? "#1a1a1a" : "#888",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: l.swatch,
                      }}
                    />
                    <span>
                      {l.username}
                      {l.layer ? `: ${l.layer}` : ""} ({l.spans.length})
                    </span>
                  </UnstyledButton>
                </Tooltip>
              );
            })}
          </Group>
        )}

        {turns.length === 0 ? (
          <Card withBorder padding="xl">
            <span style={{ color: "#888" }}>No turns parsed.</span>
          </Card>
        ) : (
          <Card withBorder padding="lg">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {turns.map((t, i) => {
                const turnSpans = spansByTurn.get(i) ?? [];
                return (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      lineHeight: 1.7,
                      fontSize: 14,
                    }}
                  >
                    <span
                      style={{ color: "#888", fontSize: 12, marginRight: 6 }}
                    >
                      [{i + 1}]
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: colorFor(t.speaker),
                        marginRight: 6,
                      }}
                    >
                      {t.speaker}:
                    </span>
                    <span>{renderTurnText(t.text, turnSpans)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </TabsPanel>

      <TabsPanel value="raw" pt="md">
        <Card withBorder padding={0}>
          <pre
            style={{
              margin: 0,
              padding: 16,
              fontSize: 12,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
              whiteSpace: "pre",
              overflowX: "auto",
              maxHeight: "70vh",
              background: "#fafbf9",
            }}
          >
            {rawCsv}
          </pre>
        </Card>
      </TabsPanel>
    </Tabs>
  );
}
