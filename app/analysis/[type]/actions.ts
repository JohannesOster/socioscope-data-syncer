"use server";

import { revalidatePath } from "next/cache";
import { moveObject } from "@/lib/s3";

export type DeleteResult =
  | { ok: true; trashKey: string }
  | { ok: false; error: string };

const TRASH_PREFIX = "Analysis/Trash/";

export async function moveToTrash(key: string): Promise<DeleteResult> {
  if (!key) return { ok: false, error: "key required" };
  if (key.startsWith(TRASH_PREFIX)) {
    return { ok: false, error: "already in trash" };
  }
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const trashKey = `${TRASH_PREFIX}${stamp}_${key}`;
    await moveObject(key, trashKey);
    revalidatePath("/analysis/unstructured");
    revalidatePath("/trash");
    return { ok: true, trashKey };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Move failed",
    };
  }
}
