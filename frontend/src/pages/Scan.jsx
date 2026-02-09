import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Camera from "../components/camera/Camera";
import { scanCard } from "../api/ocrApi";
import "./visitingCard.css";
export default function Scan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCapture = async (file) => {
    setLoading(true);

    try {
      const data = await scanCard(file);

      navigate("/visiting-card", {
        state: { ocrData: data },
      });
    } catch (err) {
      alert("OCR failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <h1 style={{ fontSize: "44px", fontWeight: "900" }}>
          Visiting Card Scanner
        </h1>

        <div style={{ marginTop: "30px" }}>
          <Camera onCapture={handleCapture} />
        </div>

        {loading && (
          <p style={{ marginTop: "20px", fontWeight: "bold", color: "blue" }}>
            Scanning... Please wait
          </p>
        )}
      </div>
    </div>
  );
}
