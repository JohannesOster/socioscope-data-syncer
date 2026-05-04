"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconArrowRight,
  IconDownload,
  IconFolder,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import BulkDownloadModal from "./BulkDownloadModal";

const PAGE_SIZE = 24;

type CaseFolder = { id: string };

export default function CasesList({ cases }: { cases: CaseFolder[] }) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const c of cases) {
      const code = c.id.split("-")[0];
      if (code) set.add(code);
    }
    return Array.from(set).sort();
  }, [cases]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases.filter((c) => {
      if (country && !c.id.startsWith(country + "-")) return false;
      if (q && !c.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cases, search, country]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const filteredIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selected.has(id));

  function reset() {
    setPage(1);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) next.add(id);
      return next;
    });
  }

  function deselectFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <Stack gap="md">
      <Group gap="sm">
        <TextInput
          placeholder="Search case ID…"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            reset();
          }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Select
          placeholder="All countries"
          data={[
            { value: "", label: `All (${cases.length})` },
            ...countries.map((c) => ({
              value: c,
              label: `${c} (${cases.filter((x) => x.id.startsWith(c + "-")).length})`,
            })),
          ]}
          value={country ?? ""}
          onChange={(v) => {
            setCountry(v || null);
            reset();
          }}
          clearable
          w={200}
        />
      </Group>

      <Group justify="space-between" gap="sm">
        <Text size="sm" c="dimmed">
          {filtered.length} of {cases.length}{" "}
          {filtered.length === 1 ? "case" : "cases"}
          {filtered.length > 0 && (
            <>
              {" · "}
              <Anchor
                component="button"
                size="sm"
                onClick={
                  allFilteredSelected ? deselectFiltered : selectAllFiltered
                }
              >
                {allFilteredSelected
                  ? "Deselect all filtered"
                  : `Select all filtered (${filtered.length})`}
              </Anchor>
            </>
          )}
        </Text>
      </Group>

      {paged.length === 0 ? (
        <Card withBorder padding="xl">
          <Text c="dimmed" ta="center">
            No cases match your filters.
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {paged.map((c) => {
            const isSelected = selected.has(c.id);
            return (
              <Card
                key={c.id}
                withBorder
                padding="lg"
                shadow="xs"
                style={{
                  position: "relative",
                  borderColor: isSelected ? "#5B8C5A" : undefined,
                  background: isSelected ? "#f4f9f4" : undefined,
                }}
              >
                <Box pos="absolute" top={10} left={10} style={{ zIndex: 2 }}>
                  <Checkbox
                    color="green"
                    checked={isSelected}
                    onChange={() => toggle(c.id)}
                    aria-label={`Select ${c.id}`}
                  />
                </Box>
                <Link
                  href={`/case/${encodeURIComponent(c.id)}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                    paddingLeft: 28,
                  }}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <IconFolder size={20} color="#5B8C5A" />
                      <Stack gap={2}>
                        <Text fw={600}>{c.id}</Text>
                        <Badge size="xs" variant="light" color="green">
                          case
                        </Badge>
                      </Stack>
                    </Group>
                    <IconArrowRight size={16} color="#888" />
                  </Group>
                </Link>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {totalPages > 1 && (
        <Group justify="center" mt="sm">
          <Pagination
            value={safePage}
            onChange={setPage}
            total={totalPages}
            color="green"
          />
        </Group>
      )}

      {selected.size > 0 && (
        <Box
          pos="fixed"
          bottom={20}
          left={0}
          right={0}
          style={{
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <Card
            shadow="lg"
            withBorder
            padding="sm"
            radius="md"
            style={{ pointerEvents: "auto", minWidth: 380 }}
          >
            <Group gap="md" wrap="nowrap">
              <Text fw={600} size="sm">
                {selected.size} selected
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={14} />}
                  onClick={clearSelection}
                >
                  Clear
                </Button>
                <Button
                  size="xs"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => setBulkOpen(true)}
                >
                  Download…
                </Button>
              </Group>
            </Group>
          </Card>
        </Box>
      )}

      <BulkDownloadModal
        opened={bulkOpen}
        onClose={() => setBulkOpen(false)}
        caseIds={Array.from(selected)}
      />
    </Stack>
  );
}
