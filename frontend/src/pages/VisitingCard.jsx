import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CardForm from "../components/form/CardForm";
import { saveCardToDB } from "../api/cardApi";
import "./visitingCard.css";
export default function VisitingCard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    city: "",
  });

  useEffect(() => {
    const data = location.state?.ocrData;

    if (!data) {
      alert("No OCR data found. Please scan again.");
      navigate("/");
      return;
    }

    setFormData({
      name: data.name || "",
      company: data.company || "",
      phone: data.phone || "",
      email: data.email || "",
      website: data.website || "",
      city: data.city || "",
    });
  }, [location.state, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await saveCardToDB(formData);
      alert("Saved to MongoDB successfully ✅");
      navigate("/");
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ maxWidth: "1000px", margin: "30px auto", padding: "0 16px" }}>
        <h2 style={{ fontSize: "38px", fontWeight: "900", textAlign: "center" }}>
          Card Details
        </h2>

        <p style={{ textAlign: "center", marginTop: "10px", color: "#6b7280" }}>
          Edit details if OCR read wrong, then click Submit.
        </p>

        <div style={{ marginTop: "30px" }}>
          <CardForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
