import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Report.css";

const BACKEND_BASE = "http://192.168.86.250:5001";

export default function Report() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ MULTI SELECT
  const [selectedIds, setSelectedIds] = useState([]);

  // Edit mode only for 1 record
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    city: "",
  });

  // ✅ FETCH ACTIVE CARDS
  const fetchCards = async (searchValue = "") => {
    setLoading(true);

    try {
      const url = searchValue
        ? `${BACKEND_BASE}/api/cards?search=${encodeURIComponent(searchValue)}`
        : `${BACKEND_BASE}/api/cards`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Fetch failed");

      setCards(data);
      setSelectedIds([]);
      setEditMode(false);
    } catch (err) {
      alert("Failed to fetch report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCards(search);
  };

  const handleReset = () => {
    setSearch("");
    fetchCards("");
  };

  // ✅ MULTI SELECT TOGGLE
  const toggleSelect = (card) => {
    setEditMode(false);

    setSelectedIds((prev) => {
      if (prev.includes(card._id)) {
        return prev.filter((id) => id !== card._id);
      } else {
        return [...prev, card._id];
      }
    });
  };

  // ✅ SELECT ALL
  const toggleSelectAll = () => {
    setEditMode(false);

    if (selectedIds.length === cards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cards.map((c) => c._id));
    }
  };

  // ✅ START EDIT (only when 1 selected)
  const startEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly 1 record to edit.");
      return;
    }

    const card = cards.find((c) => c._id === selectedIds[0]);
    if (!card) return;

    setEditData({
      name: card.name || "",
      company: card.company || "",
      phone: card.phone || "",
      email: card.email || "",
      website: card.website || "",
      city: card.city || "",
    });

    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  // ✅ UPDATE (only 1 selected)
  const updateCard = async () => {
    if (selectedIds.length !== 1) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/cards/${selectedIds[0]}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      alert("Updated successfully!");
      setEditMode(false);
      fetchCards(search);
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ DELETE MULTIPLE (SOFT DELETE)
  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least 1 record to delete.");
      return;
    }

    const ok = confirm(`Delete ${selectedIds.length} selected record(s)?`);
    if (!ok) return;

    try {
      for (let id of selectedIds) {
        await fetch(`${BACKEND_BASE}/api/cards/${id}`, {
          method: "DELETE",
        });
      }

      alert("Deleted successfully! Stored in Deleted Records.");
      fetchCards(search);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // ✅ EXPORT TO EXCEL
  const exportToExcel = () => {
    window.open(`${BACKEND_BASE}/api/export/excel`, "_blank");
  };

  const selectedCount = selectedIds.length;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 18px" }}>
      {/* TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "42px", fontWeight: "900" }}>Report</h2>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={exportToExcel}
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "12px",
              border: "none",
              background: "#16a34a",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Export to Excel
          </button>

          <button
            onClick={() => navigate("/deleted-records")}
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "12px",
              border: "none",
              background: "#dc2626",
              color: "white",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            View Deleted Records
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          marginTop: "28px",
          flexWrap: "wrap",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Example: Girish / Bengaluru / Denso"
          style={{
            width: "520px",
            height: "48px",
            padding: "0 14px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            outline: "none",
            fontSize: "15px",
          }}
        />

        <button
          type="submit"
          style={{
            height: "48px",
            padding: "0 22px",
            borderRadius: "12px",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        <button
          type="button"
          onClick={handleReset}
          style={{
            height: "48px",
            padding: "0 22px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            background: "white",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </form>

      {/* SELECTED COUNT */}
      {selectedCount > 0 && (
        <p style={{ textAlign: "center", marginTop: "14px", fontWeight: "800" }}>
          Selected: {selectedCount}
        </p>
      )}

      {/* ACTION BUTTONS */}
      {selectedCount > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "14px",
            flexWrap: "wrap",
          }}
        >
          {!editMode ? (
            <>
              <button
                onClick={startEdit}
                disabled={selectedCount !== 1}
                style={{
                  height: "44px",
                  padding: "0 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: selectedCount === 1 ? "#111827" : "#9ca3af",
                  color: "white",
                  fontWeight: "800",
                  cursor: selectedCount === 1 ? "pointer" : "not-allowed",
                }}
              >
                Edit Selected
              </button>

              <button
                onClick={deleteSelected}
                style={{
                  height: "44px",
                  padding: "0 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Delete Selected
              </button>
            </>
          ) : (
            <>
              <button
                onClick={updateCard}
                style={{
                  height: "44px",
                  padding: "0 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#16a34a",
                  color: "white",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Submit Update
              </button>

              <button
                onClick={cancelEdit}
                style={{
                  height: "44px",
                  padding: "0 20px",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <p style={{ textAlign: "center", marginTop: "20px", fontWeight: "700" }}>
          Loading...
        </p>
      )}

      {/* TABLE */}
      <div style={{ marginTop: "25px", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
          }}
        >
          <thead style={{ background: "#111827", color: "white" }}>
            <tr>
              <th style={{ padding: "14px" }}>
                <input
                  type="checkbox"
                  checked={cards.length > 0 && selectedIds.length === cards.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th style={{ padding: "14px" }}>Name</th>
              <th style={{ padding: "14px" }}>Company</th>
              <th style={{ padding: "14px" }}>Phone</th>
              <th style={{ padding: "14px" }}>Email</th>
              <th style={{ padding: "14px" }}>Website</th>
              <th style={{ padding: "14px" }}>City</th>
            </tr>
          </thead>

          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "18px", textAlign: "center" }}>
                  No records found
                </td>
              </tr>
            ) : (
              cards.map((card) => {
                const isSelected = selectedIds.includes(card._id);
                const isEditing = editMode && selectedIds.length === 1 && selectedIds[0] === card._id;

                return (
                  <tr
                    key={card._id}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      textAlign: "center",
                      background: isSelected ? "#f3f4f6" : "white",
                    }}
                  >
                    <td style={{ padding: "14px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(card)}
                      />
                    </td>

                    <td style={{ padding: "14px" }}>
                      {isEditing ? (
                        <input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          style={{ width: "95%", padding: "8px", borderRadius: "8px" }}
                        />
                      ) : (
                        card.name || "-"
                      )}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {isEditing ? (
                        <input
                          value={editData.company}
                          onChange={(e) =>
                            setEditData({ ...editData, company: e.target.value })
                          }
                          style={{ width: "95%", padding: "8px", borderRadius: "8px" }}
                        />
                      ) : (
                        card.company || "-"
                      )}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {isEditing ? (
                        <input
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          style={{ width: "95%", padding: "8px", borderRadius: "8px" }}
                        />
                      ) : (
                        card.phone || "-"
                      )}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {isEditing ? (
                        <input
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          style={{ width: "95%", padding: "8px", borderRadius: "8px" }}
                        />
                      ) : (
                        card.email || "-"
                      )}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {isEditing ? (
                        <input
                          value={editData.website}
                          onChange={(e) =>
                            setEditData({ ...editData, website: e.target.value })
                          }
                          style={{ width: "95%", padding: "8px", borderRadius: "8px" }}
                        />
                      ) : (
                        card.website || "-"
                      )}
                    </td>

                    <td style={{ padding: "14px" }}>
                      {isEditing ? (
                        <input
                          value={editData.city}
                          onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                          style={{ width: "95%", padding: "8px", borderRadius: "8px" }}
                        />
                      ) : (
                        card.city || "-"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
