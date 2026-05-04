import Link from "next/link";
import {
  Box,
  Card,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowRight,
  IconClipboardData,
} from "@tabler/icons-react";
import Header from "./components/Header";
import { listCases } from "@/lib/s3";
import CasesList from "./CasesList";

export default async function Home() {
  const cases = await listCases();

  return (
    <Box mih="100vh">
      <Header />
      <Container size="lg" py="xl">
        <Stack gap="xl">
          <Stack gap="md">
            <Box>
              <Title order={3} fw={600}>
                Analysis
              </Title>
              <Text c="dimmed" size="sm">
                Working files and coding output.
              </Text>
            </Box>
            <Link href="/analysis" style={{ textDecoration: "none" }}>
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
                    <IconClipboardData size={24} color="#5B8C5A" />
                    <Stack gap={2}>
                      <Text fw={600}>Analysis</Text>
                      <Text size="xs" c="dimmed">
                        Structured & unstructured working files
                      </Text>
                    </Stack>
                  </Group>
                  <IconArrowRight size={16} color="#888" />
                </Group>
              </Card>
            </Link>
          </Stack>

          <Divider />

          <Stack gap="md">
            <Box>
              <Title order={3} fw={600}>
                Cases
              </Title>
            </Box>
            <CasesList cases={cases} />
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
