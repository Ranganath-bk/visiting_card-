// src/api/cardApi.js

const BASE_URL = "http://192.168.86.250:5001";

// ✅ Fetch Active Cards (Report Page)
export async function fetchCards(search = "") {
  try {
    let url = `${BASE_URL}/api/cards`;

    if (search && search.trim() !== "") {
      url += `?search=${encodeURIComponent(search.trim())}`;
    }

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Failed to fetch cards");
    }

    return await res.json();
  } catch (err) {
    console.error("fetchCards error:", err);
    throw err;
  }
}

// ✅ Fetch Deleted Cards (Deleted Records Page)
export async function fetchDeletedCards() {
  try {
    const res = await fetch(`${BASE_URL}/api/cards/deleted`);

    if (!res.ok) {
      throw new Error("Failed to fetch deleted cards");
    }

    return await res.json();
  } catch (err) {
    console.error("fetchDeletedCards error:", err);
    throw err;
  }
}

// ✅ Save Card
export async function saveCardToDB(cardData) {
  try {
    const res = await fetch(`${BASE_URL}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cardData),
    });

    if (!res.ok) {
      throw new Error("Failed to save card");
    }

    return await res.json();
  } catch (err) {
    console.error("saveCardToDB error:", err);
    throw err;
  }
}

// ✅ Update Card
export async function updateCard(cardId, updatedData) {
  try {
    const res = await fetch(`${BASE_URL}/api/cards/${cardId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) {
      throw new Error("Failed to update card");
    }

    return await res.json();
  } catch (err) {
    console.error("updateCard error:", err);
    throw err;
  }
}

// ✅ Soft Delete Card
export async function deleteCard(cardId) {
  try {
    const res = await fetch(`${BASE_URL}/api/cards/${cardId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete card");
    }

    return await res.json();
  } catch (err) {
    console.error("deleteCard error:", err);
    throw err;
  }
}

// ✅ Restore Deleted Card
export async function restoreCard(cardId) {
  try {
    const res = await fetch(`${BASE_URL}/api/cards/restore/${cardId}`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to restore card");
    }

    return await res.json();
  } catch (err) {
    console.error("restoreCard error:", err);
    throw err;
  }
}

// ✅ Export Active Cards to Excel
export function exportToExcel() {
  window.open(`${BASE_URL}/api/export/excel`, "_blank");
}
