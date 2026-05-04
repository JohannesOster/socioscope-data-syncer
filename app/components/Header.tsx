import { cookies } from "next/headers";
import Link from "next/link";
import { Box, Group, Text, Title } from "@mantine/core";
import { IconLeaf } from "@tabler/icons-react";

export type Crumb = { label: string; href?: string };

type HeaderProps = {
  crumbs?: Crumb[];
};

const SEP = (
  <Text component="span" c="rgba(255,255,255,0.5)" size="md" mx={6}>
    /
  </Text>
);

export default async function Header({ crumbs = [] }: HeaderProps) {
  const cookieStore = await cookies();
  const username = cookieStore.get("username")?.value ?? "";

  return (
    <Box
      py={20}
      px={24}
      style={{
        background: "linear-gradient(135deg, #5B8C5A 0%, #4A7C49 100%)",
        color: "white",
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap="md">
        <Group gap={0} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <Link
            href="/"
            style={{
              color: "white",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <IconLeaf size={24} />
            <Title order={3} fw={700} style={{ color: "white" }}>
              Data Syncer
            </Title>
          </Link>
          {crumbs.map((c, i) => (
            <Group key={i} gap={0} wrap="nowrap" style={{ minWidth: 0 }}>
              {SEP}
              {c.href ? (
                <Link
                  href={c.href}
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    textDecoration: "none",
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  {c.label}
                </Link>
              ) : (
                <Text
                  c="white"
                  fw={500}
                  size="md"
                  truncate
                  style={{ minWidth: 0 }}
                >
                  {c.label}
                </Text>
              )}
            </Group>
          ))}
        </Group>
        {username && (
          <Text c="rgba(255,255,255,0.85)" size="sm" style={{ flexShrink: 0 }}>
            Hi, <strong>{username}</strong>
          </Text>
        )}
      </Group>
    </Box>
  );
}
