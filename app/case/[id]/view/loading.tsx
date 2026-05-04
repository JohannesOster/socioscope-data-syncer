import { Box, Card, Container, Skeleton, Stack } from "@mantine/core";
import Header from "@/app/components/Header";

export default function Loading() {
  return (
    <Box mih="100vh">
      <Header crumbs={[{ label: "…" }, { label: "…" }]} />
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Skeleton height={28} width={260} />
          <Skeleton height={12} width={180} />
          <Card withBorder padding="lg">
            <Stack gap="sm">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} height={20} width={`${80 - (i % 5) * 6}%`} />
              ))}
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
