"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Uploads run in the browser, under the editor's own session, so the storage
 * RLS policies ("admins upload files") are what authorise them. No service-role
 * key is involved, and none has to exist in the deployed environment.
 *
 * Images are converted to WebP and capped in size on the way, because the
 * archive convention is .webp and because a phone photo straight off a camera
 * is 6MB of something that will be displayed 680px wide. Conversion uses the
 * canvas the browser already has — no dependency, and nothing to keep patched.
 */

/** Matches the existing archive layout: piece-images/{issue}/{slug}/{name}.webp */
export const piecePath = (issueNumber: number, slug: string, name: string) =>
  `${issueNumber}/${slug}/${name}.webp`;

export const coverPath = (issueNumber: number) => `cover-issue-${issueNumber}.webp`;

/** The widest a body image is ever displayed is 680px, and covers 420px, but
 *  originals are kept generous enough to survive a future redesign and 2× DPR. */
const MAX_EDGE = 2000;
const QUALITY = 0.86;

export type UploadResult = { url: string; width: number; height: number };

async function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images. Try Chrome, Edge or Firefox.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY)
  );
  if (!blob) throw new Error("Couldn't convert that image.");
  return { blob, width, height };
}

export async function uploadImage(
  file: File,
  bucket: "covers" | "piece-images",
  path: string
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`“${file.name}” isn't an image.`);
  }

  const { blob, width, height } = await toWebp(file);
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/webp",
    // replacing a cover should replace the cover, not accumulate cover-2.webp
    upsert: true,
  });
  if (error) throw new Error(uploadMessage(error.message));

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  // Storage serves from a CDN; without this an editor replacing a cover keeps
  // seeing the old one and assumes the upload failed.
  return { url: `${data.publicUrl}?v=${Date.now().toString(36)}`, width, height };
}

/** Non-image files (the issue PDF) go up untouched. */
export async function uploadFile(
  file: File,
  bucket: "issue-pdfs",
  path: string
): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (error) throw new Error(uploadMessage(error.message));
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function uploadMessage(message: string): string {
  if (/row-level security|Unauthorized|403/i.test(message)) {
    return "Your session isn't allowed to upload. Sign out and back in, then try again.";
  }
  if (/exceeded the maximum allowed size|413/i.test(message)) {
    return "That file is too big for Storage. Try a smaller one.";
  }
  return message;
}
