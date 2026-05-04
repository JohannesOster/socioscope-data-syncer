"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLeaf, IconArrowRight } from "@tabler/icons-react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        notifications.show({
          color: "red",
          title: "Login failed",
          message: body.error || "Try again.",
        });
        setLoading(false);
        return;
      }
      const from = search.get("from") || "/";
      router.replace(from);
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Login failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      setLoading(false);
    }
  }

  return (
    <Card shadow="sm" padding="xl" radius="lg" w="100%" maw={420} withBorder>
      <Stack gap="lg">
        <Title order={3} fw={600}>
          Sign in
        </Title>
        <Text size="sm" c="dimmed">
          Enter your name (so collaborators see your contributions) and the
          shared team password.
        </Text>
        <TextInput
          autoFocus
          label="Your name"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          size="md"
        />
        <PasswordInput
          label="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          size="md"
        />
        <Button
          onClick={submit}
          loading={loading}
          disabled={!username.trim() || !password}
          size="md"
          fullWidth
          rightSection={<IconArrowRight size={16} />}
        >
          Continue
        </Button>
      </Stack>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Box mih="100vh" display="flex" style={{ flexDirection: "column" }}>
      <Box
        py={48}
        px={24}
        ta="center"
        style={{
          background: "linear-gradient(135deg, #5B8C5A 0%, #4A7C49 100%)",
          color: "white",
        }}
      >
        <Group justify="center" gap={10}>
          <IconLeaf size={36} />
          <Title order={1} fw={700} fz={36}>
            Data Syncer
          </Title>
        </Group>
        <Text c="rgba(255,255,255,0.85)" mt={8}>
          Socioscope corpus & analysis storage
        </Text>
      </Box>
      <Center style={{ flex: 1 }} p="md">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </Center>
    </Box>
  );
}
