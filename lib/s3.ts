import "server-only";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

const region = process.env.AWS_REGION;
const Bucket = process.env.S3_BUCKET;

if (!region || !Bucket) {
  throw new Error("AWS_REGION and S3_BUCKET must be set in environment");
}

const client = new S3Client({ region });

export type CaseFolder = { id: string };

export type S3File = {
  key: string;
  size: number;
  lastModified?: Date;
};

// Case IDs follow the convention {COUNTRY}-{NUMBER}, e.g. AR-002 / ZA-014.
// Filtering here keeps Analysis/, Trash/, etc. out of the cases overview.
const CASE_ID_PATTERN = /^[A-Z]{2,3}-\d+$/;

export async function listCases(): Promise<CaseFolder[]> {
  const res = await client.send(
    new ListObjectsV2Command({ Bucket, Delimiter: "/" }),
  );
  return (res.CommonPrefixes ?? [])
    .map((p) => p.Prefix?.replace(/\/$/, "") ?? "")
    .filter((id) => CASE_ID_PATTERN.test(id))
    .map((id) => ({ id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function listFilesAtPrefix(prefix: string): Promise<S3File[]> {
  const Prefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  const out: S3File[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken }),
    );
    for (const o of res.Contents ?? []) {
      if (!o.Key || o.Key.endsWith("/")) continue;
      out.push({
        key: o.Key,
        size: o.Size ?? 0,
        lastModified: o.LastModified,
      });
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export async function listCaseFiles(caseId: string): Promise<S3File[]> {
  return listFilesAtPrefix(caseId);
}

export async function getObjectText(key: string): Promise<string> {
  const res = await client.send(new GetObjectCommand({ Bucket, Key: key }));
  if (!res.Body) throw new Error(`No body for ${key}`);
  return await res.Body.transformToString();
}

export async function listKeysByPrefix(prefix: string): Promise<string[]> {
  const out: string[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken }),
    );
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push(o.Key);
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out;
}

export async function getDownloadUrl(
  key: string,
  expiresInSeconds = 60,
): Promise<string> {
  const fileName = key.split("/").pop() ?? "download";
  const cmd = new GetObjectCommand({
    Bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, "")}"`,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
): Promise<void> {
  // AES256 header is required by the prod corpus bucket policy and harmless
  // on the dev bucket. Sending it unconditionally keeps the app portable.
  await client.send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    }),
  );
}

export async function getObjectStream(key: string): Promise<Readable> {
  const res = await client.send(new GetObjectCommand({ Bucket, Key: key }));
  if (!res.Body) throw new Error(`No body for ${key}`);
  return res.Body as Readable;
}

export async function moveObject(
  fromKey: string,
  toKey: string,
): Promise<void> {
  await client.send(
    new CopyObjectCommand({
      Bucket,
      CopySource: `/${Bucket}/${encodeURIComponent(fromKey).replace(/%2F/g, "/")}`,
      Key: toKey,
      ServerSideEncryption: "AES256",
    }),
  );
  await client.send(new DeleteObjectCommand({ Bucket, Key: fromKey }));
}
