import { Box, Card, Container, Skeleton, Stack } from "@mantine/core";
import Header from "@/app/components/Header";

export default function Loading() {
  return (
    <Box mih="100vh">
      <Header crumbs={[{ label: "Trash" }]} />
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Skeleton height={28} width={140} />
          <Skeleton height={14} width={280} />
          <Card withBorder padding="lg">
            <Stack gap="sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height={18} />
              ))}
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
