import {
  Box,
  Card,
  Container,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconFile, IconDownload } from "@tabler/icons-react";
import Header from "@/app/components/Header";
import { listFilesAtPrefix } from "@/lib/s3";
import { humanSize } from "@/lib/files";
import styles from "./Trash.module.css";

const TRASH_PREFIX = "Analysis/Trash/";

function parseTrashKey(key: string): {
  displayName: string;
  originalKey: string;
} {
  if (!key.startsWith(TRASH_PREFIX)) {
    return { displayName: key, originalKey: key };
  }
  const rest = key.slice(TRASH_PREFIX.length);
  const m = rest.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_(.+)$/);
  if (m) {
    const originalKey = m[1];
    const displayName = originalKey.split("/").pop() ?? originalKey;
    return { displayName, originalKey };
  }
  return { displayName: rest, originalKey: rest };
}

function formatDate(d?: Date): string {
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TrashPage() {
  const files = await listFilesAtPrefix(TRASH_PREFIX);

  return (
    <Box mih="100vh">
      <Header crumbs={[{ label: "Trash" }]} />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Box>
            <Title order={2} fw={600}>
              Trash
            </Title>
            <Text c="dimmed" size="sm">
              {files.length} {files.length === 1 ? "file" : "files"} · files
              moved here are kept indefinitely; download is available, removal
              is not.
            </Text>
          </Box>

          {files.length === 0 ? (
            <Card withBorder padding="xl">
              <Text c="dimmed" ta="center">
                Trash is empty.
              </Text>
            </Card>
          ) : (
            <Card withBorder padding={0}>
              <div className={`${styles.row} ${styles.headerRow}`}>
                <span></span>
                <span>File</span>
                <span>Original location</span>
                <span>Size</span>
                <span>Deleted</span>
                <span></span>
              </div>
              {files.map((f) => {
                const { displayName, originalKey } = parseTrashKey(f.key);
                return (
                  <div key={f.key} className={styles.row}>
                    <IconFile size={18} color="#888" />
                    <Text
                      size="sm"
                      style={{ fontFamily: "monospace" }}
                      truncate
                    >
                      {displayName}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {originalKey}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {humanSize(f.size)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(f.lastModified)}
                    </Text>
                    <a
                      href={`/api/download?key=${encodeURIComponent(f.key)}`}
                      className={styles.downloadBtn}
                      title="Download"
                    >
                      <IconDownload size={18} />
                    </a>
                  </div>
                );
              })}
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
