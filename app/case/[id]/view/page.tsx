import Papa from "papaparse";
import { Box, Card, Container, Stack, Text, Title, Group } from "@mantine/core";
import Header from "@/app/components/Header";
import { getObjectText } from "@/lib/s3";
import { parseFileName, humanLabel } from "@/lib/files";
import { loadLayersForFile } from "@/lib/layer-loader";
import { colorForKey } from "@/lib/structured";
import ViewerTabs, { type Turn, type ViewerLayer } from "./ViewerTabs";

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

function pickField(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    const v = row[c] ?? row[c.toUpperCase()];
    if (v && v.trim()) return v;
  }
  return "";
}

function parseTurns(csv: string): Turn[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  return (result.data ?? [])
    .map((row): Turn => {
      const speaker = pickField(row, ["SPEAKER", "speaker"]).trim();
      const text = pickField(row, [
        "USER REVISION",
        "TRANSLATION",
        "TRANSCRIPTION",
      ]).trim();
      const startStr = pickField(row, ["START", "start"]);
      const endStr = pickField(row, ["END", "end"]);
      const start = startStr ? Number(startStr) : undefined;
      const end = endStr ? Number(endStr) : undefined;
      return { speaker, text, start, end };
    })
    .filter((t) => t.speaker || t.text);
}

export default async function ViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ file?: string }>;
}) {
  const { id } = await params;
  const { file } = await searchParams;
  const caseId = decodeURIComponent(id);

  if (!file) {
    return (
      <Box mih="100vh">
        <Header crumbs={[{ label: caseId, href: `/case/${id}` }]} />
        <Container size="lg" py="xl">
          <Card withBorder padding="xl">
            <Text c="dimmed">No file specified.</Text>
          </Card>
        </Container>
      </Box>
    );
  }

  const meta = parseFileName(file);
  let rawCsv = "";
  let turns: Turn[] = [];
  let errorMessage: string | null = null;

  const [csvResult, layers] = await Promise.all([
    getObjectText(file)
      .then((text) => ({ ok: true as const, text }))
      .catch((err: unknown) => ({
        ok: false as const,
        error: err instanceof Error ? err.message : "Failed to load file",
      })),
    loadLayersForFile(caseId, meta.fileName).catch(() => []),
  ]);

  if (csvResult.ok) {
    rawCsv = csvResult.text;
    turns = parseTurns(rawCsv);
  } else {
    errorMessage = csvResult.error;
  }

  const layerViews: ViewerLayer[] = layers.map((l) => {
    const c = colorForKey(l.key);
    return {
      key: l.key,
      fileName: l.fileName,
      username: l.username,
      layer: l.layer,
      description: l.description,
      spans: l.spans,
      swatch: c.swatch,
      bg: c.bg,
    };
  });

  const speakers = Array.from(new Set(turns.map((t) => t.speaker))).filter(
    Boolean,
  );

  return (
    <Box mih="100vh">
      <Header
        crumbs={[
          { label: caseId, href: `/case/${id}` },
          { label: meta.fileName },
        ]}
      />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Box>
            <Title order={2} fw={600}>
              {humanLabel(meta)}
            </Title>
            <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
              {meta.fileName}
            </Text>
            {speakers.length > 0 && (
              <Group gap="xs" mt="sm">
                {speakers.map((s) => (
                  <Group key={s} gap={4}>
                    <Box
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: colorFor(s),
                      }}
                    />
                    <Text size="xs" c="dimmed">
                      {s}
                    </Text>
                  </Group>
                ))}
                <Text size="xs" c="dimmed">
                  · {turns.length} turns
                </Text>
              </Group>
            )}
          </Box>

          {errorMessage ? (
            <Card withBorder padding="md" style={{ borderColor: "#f88" }}>
              <Text c="red" size="sm">
                Error: {errorMessage}
              </Text>
            </Card>
          ) : (
            <ViewerTabs turns={turns} rawCsv={rawCsv} layers={layerViews} />
          )}
        </Stack>
      </Container>
    </Box>
  );
}
