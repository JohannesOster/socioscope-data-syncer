"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  ChipGroup,
  Group,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";

const KIND_OPTIONS = [
  { value: "INTERVIEW", label: "Interviews" },
  { value: "DEBRIEFING", label: "Debriefings" },
  { value: "CONSENT", label: "Consent forms" },
  { value: "SUPPLEMENTARY_MATERIAL", label: "Supplementary" },
  { value: "SOCIAL_SHORT", label: "Social shorts" },
];

const FORMAT_OPTIONS = [
  { value: "transcription", label: "Transcripts (CSV)" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDFs" },
  { value: "image", label: "Images" },
];

type Props = {
  opened: boolean;
  onClose: () => void;
  caseIds: string[];
};

export default function BulkDownloadModal({ opened, onClose, caseIds }: Props) {
  // Default: all kinds, transcripts only — the most common case.
  const [kinds, setKinds] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>(["transcription"]);

  function buildUrl(): string {
    const params = new URLSearchParams();
    params.set("caseIds", caseIds.join(","));
    if (kinds.length > 0) params.set("kinds", kinds.join(","));
    if (formats.length > 0) params.set("formats", formats.join(","));
    return `/api/download-cases?${params.toString()}`;
  }

  const formatsSummary =
    formats.length === 0 ? "all formats" : formats.join(" + ");
  const kindsSummary =
    kinds.length === 0 ? "all kinds" : kinds.join(" + ").toLowerCase();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Download ${caseIds.length} case${caseIds.length === 1 ? "" : "s"}`}
      size="lg"
      centered
    >
      <Stack gap="lg">
        <Box>
          <Text fw={600} size="sm" mb={6}>
            Kinds
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Pick none to include all kinds.
          </Text>
          <ChipGroup multiple value={kinds} onChange={setKinds}>
            <Group gap={8}>
              {KIND_OPTIONS.map((k) => (
                <Chip key={k.value} value={k.value} color="green">
                  {k.label}
                </Chip>
              ))}
            </Group>
          </ChipGroup>
        </Box>

        <Box>
          <Text fw={600} size="sm" mb={6}>
            Formats
          </Text>
          <Text size="xs" c="dimmed" mb={8}>
            Pick none to include all formats.
          </Text>
          <ChipGroup multiple value={formats} onChange={setFormats}>
            <Group gap={8}>
              {FORMAT_OPTIONS.map((f) => (
                <Chip key={f.value} value={f.value} color="green">
                  {f.label}
                </Chip>
              ))}
            </Group>
          </ChipGroup>
        </Box>

        <Box
          p="sm"
          style={{ background: "#f4f9f4", borderRadius: 6, fontSize: 13 }}
        >
          Will zip <strong>{kindsSummary}</strong> · <strong>{formatsSummary}</strong>{" "}
          across {caseIds.length} case{caseIds.length === 1 ? "" : "s"}.
        </Box>

        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button
            component="a"
            href={buildUrl()}
            leftSection={<IconDownload size={16} />}
            onClick={() => {
              // Close after the browser starts the download. The link still
              // navigates because the click event isn't prevented.
              setTimeout(onClose, 100);
            }}
          >
            Download zip
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
