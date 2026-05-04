import Link from "next/link";
import {
  Box,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowRight,
  IconDatabase,
  IconFiles,
  IconTrash,
} from "@tabler/icons-react";
import Header from "@/app/components/Header";

const SUBFOLDERS = [
  {
    type: "structured",
    label: "Structured",
    description: "Tag records & coding (coming soon)",
    icon: IconDatabase,
  },
  {
    type: "unstructured",
    label: "Unstructured",
    description: "Word docs, Excel, anything",
    icon: IconFiles,
  },
];

export default function AnalysisIndex() {
  return (
    <Box mih="100vh">
      <Header crumbs={[{ label: "Analysis" }]} />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Box>
            <Title order={2} fw={600}>
              Analysis
            </Title>
            <Text c="dimmed" size="sm">
              Working files and coding output.
            </Text>
          </Box>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {SUBFOLDERS.map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.type}
                  href={`/analysis/${f.type}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    withBorder
                    padding="lg"
                    shadow="xs"
                    style={{
                      cursor: "pointer",
                      background: "#f4f9f4",
                      borderColor: "#cfdfcf",
                    }}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Group gap="md" wrap="nowrap">
                        <Icon size={24} color="#5B8C5A" />
                        <Stack gap={2}>
                          <Text fw={600}>{f.label}</Text>
                          <Text size="xs" c="dimmed">
                            {f.description}
                          </Text>
                        </Stack>
                      </Group>
                      <IconArrowRight size={16} color="#888" />
                    </Group>
                  </Card>
                </Link>
              );
            })}
          </SimpleGrid>

          <Box mt="md" maw={360}>
            <Link href="/trash" style={{ textDecoration: "none" }}>
              <Card
                withBorder
                padding="sm"
                style={{
                  cursor: "pointer",
                  background: "#fafafa",
                  borderColor: "#e0e0e0",
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <IconTrash size={16} color="#888" />
                  <Stack gap={0}>
                    <Text size="sm" fw={500} c="dimmed">
                      Trash
                    </Text>
                    <Text size="xs" c="dimmed">
                      Deleted files
                    </Text>
                  </Stack>
                </Group>
              </Card>
            </Link>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
