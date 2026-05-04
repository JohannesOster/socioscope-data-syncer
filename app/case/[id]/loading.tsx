import { Box, Card, Container, Skeleton, Stack } from "@mantine/core";
import Header from "@/app/components/Header";

export default function Loading() {
  return (
    <Box mih="100vh">
      <Header crumbs={[{ label: "…" }]} />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Skeleton height={28} width={180} />
          <Skeleton height={14} width={120} />
          <Card withBorder padding="lg">
            <Stack gap="sm">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height={16} />
              ))}
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
