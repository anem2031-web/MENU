const apiUrl = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL ?? "http://localhost:3001")
  : "";

export type UploadedImage = {
  key: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: "webp";
};

export async function uploadAdminImage(kind: "logo" | "category" | "product", file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${apiUrl}/api/uploads/${kind}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const body = (await response.json().catch(() => null)) as (UploadedImage & { error?: string }) | null;

  if (!response.ok || !body || !body.url || !body.key) {
    throw new Error(body?.error || "تعذر رفع الصورة");
  }

  return body;
}
