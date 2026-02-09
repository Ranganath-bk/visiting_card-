import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DeletedRecords.css";
export default function DeletedRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/deleted");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      alert("Failed to fetch deleted records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const restoreRecord = async (deletedId) => {
    const ok = confirm("Do you want to restore this record?");
    if (!ok) return;

    try {
      const res = await fetch(
        `http://localhost:5001/api/deleted/restore/${deletedId}`,
        { method: "POST" }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restore failed");

      alert("Restored successfully!");
      fetchDeleted();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px 18px" }}>
      {/* TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "42px", fontWeight: "900" }}>Deleted Records</h2>
          <p style={{ marginTop: "6px", color: "#6b7280" }}>
            All deleted cards are stored safely here.
          </p>
        </div>

        {/* Back to Report */}
        <button
          onClick={() => navigate("/report")}
          style={{
            height: "44px",
            padding: "0 18px",
            borderRadius: "12px",
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Back to Report
        </button>
      </div>

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
          <thead style={{ background: "#dc2626", color: "white" }}>
            <tr>
              <th style={{ padding: "14px" }}>Name</th>
              <th style={{ padding: "14px" }}>Company</th>
              <th style={{ padding: "14px" }}>Phone</th>
              <th style={{ padding: "14px" }}>Email</th>
              <th style={{ padding: "14px" }}>Website</th>
              <th style={{ padding: "14px" }}>City</th>
              <th style={{ padding: "14px" }}>Deleted At</th>
              <th style={{ padding: "14px" }}>Restore</th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "18px", textAlign: "center" }}>
                  No deleted records
                </td>
              </tr>
            ) : (
              records.map((card) => (
                <tr
                  key={card._id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    textAlign: "center",
                  }}
                >
                  <td style={{ padding: "14px" }}>{card.name || "-"}</td>
                  <td style={{ padding: "14px" }}>{card.company || "-"}</td>
                  <td style={{ padding: "14px" }}>{card.phone || "-"}</td>
                  <td style={{ padding: "14px" }}>{card.email || "-"}</td>
                  <td style={{ padding: "14px" }}>{card.website || "-"}</td>
                  <td style={{ padding: "14px" }}>{card.city || "-"}</td>

                  <td style={{ padding: "14px" }}>
                    {card.deletedAt
                      ? new Date(card.deletedAt).toLocaleString()
                      : "-"}
                  </td>

                  <td style={{ padding: "14px" }}>
                    <button
                      onClick={() => restoreRecord(card._id)}
                      style={{
                        height: "38px",
                        padding: "0 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#16a34a",
                        color: "white",
                        fontWeight: "800",
                        cursor: "pointer",
                      }}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
