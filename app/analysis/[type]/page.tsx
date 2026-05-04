import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Box,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconFile, IconDownload } from "@tabler/icons-react";
import Header from "@/app/components/Header";
import { listFilesAtPrefix } from "@/lib/s3";
import { humanSize } from "@/lib/files";
import {
  loadStructuredMetadata,
  type StructuredMeta,
} from "@/lib/layer-loader";
import UploadButton from "./UploadButton";
import DeleteButton from "./DeleteButton";
import styles from "./AnalysisFiles.module.css";

const TYPES = ["structured", "unstructured"] as const;
type AnalysisType = (typeof TYPES)[number];

function isAnalysisType(s: string): s is AnalysisType {
  return (TYPES as readonly string[]).includes(s);
}

function fileNameOf(key: string): string {
  return key.split("/").pop() ?? key;
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

function viewerHrefFor(meta: StructuredMeta): string | null {
  if (!meta.valid || !meta.caseId || !meta.sourceFile) return null;
  const fileKey = `${meta.caseId}/${meta.sourceFile}`;
  return `/case/${encodeURIComponent(meta.caseId)}/view?file=${encodeURIComponent(fileKey)}`;
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isAnalysisType(type)) notFound();

  const typeLabel = type[0].toUpperCase() + type.slice(1);
  const prefix = `Analysis/${typeLabel}/`;
  const isStructured = type === "structured";

  const [files, structuredMeta] = await Promise.all([
    listFilesAtPrefix(prefix),
    isStructured ? loadStructuredMetadata() : Promise.resolve(new Map()),
  ]);

  const description = isStructured
    ? " · JSON span files ({ caseId, sourceFile, spans })"
    : " · word docs, excel, anything";

  return (
    <Box mih="100vh">
      <Header
        crumbs={[
          { label: "Analysis", href: "/analysis" },
          { label: typeLabel },
        ]}
      />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end">
            <Box>
              <Title order={2} fw={600}>
                Analysis / {typeLabel}
              </Title>
              <Text c="dimmed" size="sm">
                {files.length} {files.length === 1 ? "file" : "files"}
                {description}
                {isStructured && " · click a row to open the source transcript"}
              </Text>
            </Box>
            <UploadButton mode={type} />
          </Group>

          {files.length === 0 ? (
            <Card withBorder padding="xl">
              <Text c="dimmed" ta="center">
                No files yet. Click “Upload file” to add some.
              </Text>
            </Card>
          ) : (
            <Card withBorder padding={0}>
              <div className={`${styles.row} ${styles.headerRow}`}>
                <span></span>
                <span>File</span>
                <span>Size</span>
                <span>Uploaded</span>
                <span></span>
                <span></span>
              </div>
              {files.map((f) => {
                const name = fileNameOf(f.key);
                const meta = isStructured
                  ? (structuredMeta.get(f.key) as StructuredMeta | undefined)
                  : undefined;
                const href = meta ? viewerHrefFor(meta) : null;

                const main = (
                  <>
                    <IconFile size={18} color="#5B8C5A" />
                    <Box style={{ minWidth: 0 }}>
                      <Text
                        size="sm"
                        style={{ fontFamily: "monospace" }}
                        truncate
                      >
                        {name}
                      </Text>
                      {meta && meta.valid && (
                        <div className={styles.subline}>
                          {meta.layer && <strong>{meta.layer}</strong>}
                          {meta.layer && " · "}
                          {meta.caseId} · {meta.sourceFile} ·{" "}
                          {meta.spanCount} span
                          {meta.spanCount === 1 ? "" : "s"}
                          {meta.description && (
                            <div
                              style={{
                                marginTop: 2,
                                color: "#888",
                                fontStyle: "italic",
                              }}
                            >
                              {meta.description}
                            </div>
                          )}
                        </div>
                      )}
                      {meta && !meta.valid && (
                        <div className={styles.subline}>
                          <span className={styles.invalidPill}>invalid</span>{" "}
                          {meta.error}
                        </div>
                      )}
                    </Box>
                    <Text size="sm" c="dimmed">
                      {humanSize(f.size)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(f.lastModified)}
                    </Text>
                  </>
                );

                const downloadBtn = (
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
                    className={`${styles.row}${href ? " " + styles.clickable : ""}`}
                  >
                    {href ? (
                      <Link
                        href={href}
                        className={styles.rowMain}
                        title="Open source transcript with this layer"
                      >
                        {main}
                      </Link>
                    ) : (
                      <div className={styles.rowMain}>{main}</div>
                    )}
                    {downloadBtn}
                    <DeleteButton fileKey={f.key} fileName={name} />
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
