export async function renderQrToCanvas(svgElement: SVGSVGElement, size = 1600) {
  const svgCopy = svgElement.cloneNode(true) as SVGSVGElement;
  svgCopy.setAttribute("width", String(size));
  svgCopy.setAttribute("height", String(size));

  const svgText = new XMLSerializer().serializeToString(svgCopy);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("تعذر تجهيز QR للتنزيل"));
      image.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("تعذر تجهيز الصورة");

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    return canvas;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("تعذر إنشاء ملف PNG"));
    }, "image/png");
  });
}

export function canvasToPdfBlob(canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL("image/jpeg", 1);
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const jpegBytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    jpegBytes[index] = binary.charCodeAt(index);
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;

  const appendBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteLength += bytes.length;
  };

  const appendText = (value: string) => appendBytes(encoder.encode(value));

  const startObject = (objectNumber: number) => {
    offsets[objectNumber] = byteLength;
    appendText(`${objectNumber} 0 obj\n`);
  };

  appendText("%PDF-1.4\n");

  startObject(1);
  appendText("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  appendText("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  startObject(3);
  appendText(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
  );

  startObject(4);
  appendText(
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  appendBytes(jpegBytes);
  appendText("\nendstream\nendobj\n");

  const qrSize = 360;
  const x = (595 - qrSize) / 2;
  const y = (842 - qrSize) / 2;
  const content = `q\n${qrSize} 0 0 ${qrSize} ${x} ${y} cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(content);

  startObject(5);
  appendText(`<< /Length ${contentBytes.length} >>\nstream\n`);
  appendBytes(contentBytes);
  appendText("endstream\nendobj\n");

  const xrefOffset = byteLength;
  appendText("xref\n0 6\n");
  appendText("0000000000 65535 f \n");
  for (let objectNumber = 1; objectNumber <= 5; objectNumber += 1) {
    appendText(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdfBytes = new Uint8Array(byteLength);
  let writeOffset = 0;

  for (const chunk of chunks) {
    pdfBytes.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  return new Blob([pdfBytes.buffer], { type: "application/pdf" });
}
