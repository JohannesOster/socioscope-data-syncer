import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Button,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconFileText,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconFileTypePdf,
  IconFile,
  IconDownload,
  IconChevronDown,
  IconArchive,
  IconFolderDown,
} from "@tabler/icons-react";
import Header from "@/app/components/Header";
import { listCaseFiles } from "@/lib/s3";
import {
  parseFileName,
  humanSize,
  humanLabel,
  type FileMeta,
} from "@/lib/files";
import styles from "./CaseFiles.module.css";

const ICONS: Record<
  FileMeta["type"],
  React.ComponentType<{ size?: number; color?: string }>
> = {
  transcription: IconFileText,
  video: IconVideo,
  audio: IconMusic,
  image: IconPhoto,
  pdf: IconFileTypePdf,
  other: IconFile,
};

const TYPE_COLORS: Record<FileMeta["type"], string> = {
  transcription: "green",
  video: "blue",
  audio: "violet",
  image: "yellow",
  pdf: "red",
  other: "gray",
};

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseId = decodeURIComponent(id);
  const files = await listCaseFiles(caseId);

  if (files.length === 0) notFound();

  const enriched = files.map((f) => ({ ...f, meta: parseFileName(f.key) }));
  const transcriptCount = enriched.filter(
    (f) => f.meta.type === "transcription",
  ).length;

  return (
    <Box mih="100vh">
      <Header crumbs={[{ label: caseId }]} />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end">
            <Box>
              <Title order={2} fw={600}>
                {caseId}
              </Title>
              <Text c="dimmed" size="sm">
                {files.length} files · {transcriptCount} transcript
                {transcriptCount === 1 ? "" : "s"}
              </Text>
            </Box>
            <Menu shadow="md" width={240} position="bottom-end">
              <MenuTarget>
                <Button
                  leftSection={<IconDownload size={16} />}
                  rightSection={<IconChevronDown size={14} />}
                  variant="light"
                >
                  Download
                </Button>
              </MenuTarget>
              <MenuDropdown>
                <MenuItem
                  component="a"
                  href={`/api/download-case?caseId=${encodeURIComponent(caseId)}&mode=transcripts`}
                  leftSection={<IconArchive size={16} />}
                  disabled={transcriptCount === 0}
                >
                  Transcripts only ({transcriptCount})
                </MenuItem>
                <MenuItem
                  component="a"
                  href={`/api/download-case?caseId=${encodeURIComponent(caseId)}&mode=all`}
                  leftSection={<IconFolderDown size={16} />}
                >
                  All files ({files.length})
                </MenuItem>
              </MenuDropdown>
            </Menu>
          </Group>

          <Card withBorder padding={0}>
            <div className={`${styles.row} ${styles.headerRow}`}>
              <span></span>
              <span>Type</span>
              <span>File</span>
              <span>Size</span>
              <span>Lang</span>
              <span></span>
            </div>
            {enriched.map((f) => {
              const Icon = ICONS[f.meta.type];
              const isViewable = f.meta.type === "transcription";
              const langLabel =
                f.meta.parts.langFrom && f.meta.parts.langTo &&
                f.meta.parts.langFrom !== f.meta.parts.langTo
                  ? `${f.meta.parts.langFrom} → ${f.meta.parts.langTo}`
                  : f.meta.parts.langFrom ?? "—";

              const cells = (
                <>
                  <Icon size={18} color="#5B8C5A" />
                  <Group gap={6} wrap="nowrap">
                    <Badge
                      size="xs"
                      variant="light"
                      color={TYPE_COLORS[f.meta.type]}
                    >
                      {f.meta.type}
                    </Badge>
                    <Text size="sm" truncate>
                      {humanLabel(f.meta)}
                    </Text>
                  </Group>
                  <Text
                    size="xs"
                    c="dimmed"
                    style={{ fontFamily: "monospace" }}
                    truncate
                  >
                    {f.meta.fileName}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {humanSize(f.size)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {langLabel}
                  </Text>
                </>
              );

              const downloadLink = (
                <a
                  href={`/api/download?key=${encodeURIComponent(f.key)}`}
                  className={styles.downloadBtn}
                  title="Download"
                >
                  <IconDownload size={18} />
                </a>
              );

              return (
                <div
                  key={f.key}
                  className={`${styles.row}${isViewable ? " " + styles.clickable : ""}`}
                >
                  {isViewable ? (
                    <Link
                      href={`/case/${encodeURIComponent(caseId)}/view?file=${encodeURIComponent(f.key)}`}
                      className={styles.rowMain}
                    >
                      {cells}
                    </Link>
                  ) : (
                    <div className={styles.rowMain}>{cells}</div>
                  )}
                  {downloadLink}
                </div>
              );
            })}
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
