"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Uploads run in the browser, under the editor's own session, so the storage
 * RLS policies ("admins upload files") are what authorise them. No service-role
 * key is involved, and none has to exist in the deployed environment.
 *
 * Images are converted to WebP and capped in size on the way, because the
 * archive convention is .webp and because a phone photo straight off a camera
 * is 6000px of something no redesign will ever need. Conversion uses the canvas
 * the browser already has — no dependency, and nothing to keep patched.
 *
 * One caveat that no quality setting can fix: a canvas round-trip converts to
 * sRGB and drops any embedded ICC profile. Artwork exported from InDesign or a
 * PDF in Adobe RGB or Display P3 will shift colour on upload no matter what.
 * Exporting as sRGB in the first place is the fix; the alternative is storing
 * the original bytes untouched, which the .webp path convention rules out.
 */

/** Matches the existing archive layout: piece-images/{issue}/{slug}/{name}.webp */
export const piecePath = (issueNumber: number, slug: string, name: string) =>
  `${issueNumber}/${slug}/${name}.webp`;

export const coverPath = (issueNumber: number) => `cover-issue-${issueNumber}.webp`;

/**
 * What goes into Storage is a MASTER, not a delivery copy.
 *
 * Every image is re-encoded on its way to the reader — `optimizeBodyImages`
 * routes it through Next's optimizer, which serves AVIF (falling back to WebP)
 * at q75 and at most 1200px wide. Compressing again here would only spend
 * quality that the delivery encode then has to compress a second time, and
 * lossy-on-lossy compounds: the ringing from the first pass becomes signal the
 * second pass faithfully preserves. So the master stays pristine and the
 * optimizer makes the small copies.
 *
 * quality 1.0 is not "very high" — in Chromium and Firefox it switches the WebP
 * encoder to true lossless. Measured against the source pixel by pixel: RMSE
 * 0.00, worst channel error 0. At 0.86 the worst error was 53/255, landing on
 * hairline strokes and the edges of small type — exactly what zine pages are
 * made of.
 *
 * The cost is real and worth knowing: lossless is ~7× the bytes on flat
 * artwork (~0.8MB for a full page) and ~4.5× that again on photographs
 * (~7MB at this edge length). Storage, not page weight — readers still get
 * the small AVIF.
 *
 * AVIF is deliberately not attempted here: no browser can encode it from a
 * canvas, and `toBlob` answers an unsupported type by silently handing back a
 * PNG (3.3× larger than lossless WebP) rather than failing.
 */
const MAX_EDGE = 2600;
const QUALITY = 1;

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
