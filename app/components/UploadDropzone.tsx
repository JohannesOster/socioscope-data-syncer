"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone, type FileRejection } from "@mantine/dropzone";
import { Badge, Box, Button, Card, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUpload,
  IconX,
  IconFileUpload,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { uploadFile, type UploadResult } from "@/app/upload/actions";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

type Mode = "unstructured" | "structured";

type Props = {
  mode?: Mode;
  onUploaded?: (results: UploadResult[]) => void;
};

export default function UploadDropzone({
  mode = "unstructured",
  onUploaded,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);

  const accept =
    mode === "structured" ? ["application/json", ".json"] : undefined;

  async function handleDrop(files: File[]) {
    if (busy) return;
    setBusy(true);
    const fresh: UploadResult[] = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("mode", mode);
      try {
        fresh.push(await uploadFile(fd));
      } catch (err) {
        fresh.push({
          ok: false,
          originalName: f.name,
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }
    setResults((prev) => [...fresh, ...prev]);
    setBusy(false);
    const okCount = fresh.filter((r) => r.ok).length;
    notifications.show({
      title:
        okCount === fresh.length ? "Upload complete" : "Some uploads failed",
      message: `${okCount} of ${fresh.length} uploaded`,
      color: okCount === fresh.length ? "green" : "orange",
    });
    onUploaded?.(fresh);
    if (fresh.some((r) => r.ok)) router.refresh();
  }

  function handleReject(rejections: FileRejection[]) {
    notifications.show({
      title: "Rejected",
      message: rejections
        .map(
          (r) =>
            `${r.file.name}: ${r.errors.map((e) => e.message).join(", ")}`,
        )
        .join("; "),
      color: "red",
    });
  }

  const helpText =
    mode === "structured"
      ? "JSON only. Must contain { caseId, spans: [...] } per the schema."
      : "Word docs, Excel, anything. Max 100 MB per file.";

  return (
    <Stack gap="lg">
      <Dropzone
        onDrop={handleDrop}
        onReject={handleReject}
        maxSize={MAX_SIZE}
        accept={accept}
        loading={busy}
        multiple
      >
        <Group
          justify="center"
          gap="xl"
          mih={140}
          style={{ pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload size={40} color="#5B8C5A" />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={40} color="#c92a2a" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileUpload size={40} color="#888" />
          </Dropzone.Idle>
          <Box>
            <Text fw={600}>Drop files here, or click to pick</Text>
            <Text size="sm" c="dimmed" mt={4}>
              {helpText}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Stored as <code>name-YYYY-MM-DD-you-vN.ext</code>.
            </Text>
          </Box>
        </Group>
      </Dropzone>

      {results.length > 0 && (
        <Card withBorder padding="md">
          <Stack gap="xs">
            <Text fw={600} size="sm">
              Recent uploads ({results.length})
            </Text>
            {results.map((r, i) => (
              <Group key={i} gap="sm" wrap="nowrap">
                {r.ok ? (
                  <IconCheck size={16} color="#5B8C5A" />
                ) : (
                  <IconAlertCircle size={16} color="#c92a2a" />
                )}
                <Text size="sm" style={{ flex: 1, minWidth: 0 }} truncate>
                  <strong>{r.originalName}</strong>
                  {r.ok ? (
                    <Text component="span" c="dimmed" size="sm" ml={6}>
                      → {r.key}
                    </Text>
                  ) : (
                    <Text component="span" c="red" size="sm" ml={6}>
                      {r.error}
                    </Text>
                  )}
                </Text>
                {r.ok && (
                  <Badge size="xs" variant="light" color="green">
                    v{r.version}
                  </Badge>
                )}
              </Group>
            ))}
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => setResults([])}
              style={{ alignSelf: "flex-start" }}
            >
              Clear list
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
