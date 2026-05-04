"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionIcon, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { moveToTrash } from "./actions";

export default function DeleteButton({
  fileKey,
  fileName,
}: {
  fileKey: string;
  fileName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await moveToTrash(fileKey);
      if (res.ok) {
        notifications.show({
          color: "green",
          title: "Moved to trash",
          message: fileName,
        });
        setOpen(false);
        router.refresh();
      } else {
        notifications.show({
          color: "red",
          title: "Delete failed",
          message: res.error,
        });
      }
    });
  }

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={() => setOpen(true)}
        title="Move to trash"
        size="lg"
      >
        <IconTrash size={18} />
      </ActionIcon>
      <Modal
        opened={open}
        onClose={() => !pending && setOpen(false)}
        title="Move to trash?"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            <strong>{fileName}</strong> will be moved to{" "}
            <code>Trash/</code>. Files in trash can&apos;t be removed from this
            UI — they stay in S3 unless an admin clears them.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button color="red" onClick={confirm} loading={pending}>
              Move to trash
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
