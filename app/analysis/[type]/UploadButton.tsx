"use client";

import { useState } from "react";
import { Button, Modal } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import UploadDropzone from "@/app/components/UploadDropzone";

type Mode = "unstructured" | "structured";

const TITLES: Record<Mode, string> = {
  unstructured: "Upload to Analysis / Unstructured",
  structured: "Upload to Analysis / Structured",
};

export default function UploadButton({ mode = "unstructured" }: { mode?: Mode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => setOpen(true)}
      >
        Upload file
      </Button>
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title={TITLES[mode]}
        size="lg"
        centered
      >
        <UploadDropzone mode={mode} />
      </Modal>
    </>
  );
}
