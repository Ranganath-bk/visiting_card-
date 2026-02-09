// src/api/ocrApi.js

const BASE_URL = "http://192.168.86.250:5001";

export const scanCard = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 sec timeout

    const res = await fetch(`${BASE_URL}/scan`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "OCR failed");
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("OCR server timeout / not reachable");
    }
    throw err;
  }
};
