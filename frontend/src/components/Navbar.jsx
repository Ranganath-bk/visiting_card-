import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div
      style={{
        width: "100%",
        padding: "18px 28px",
        display: "flex",
        justifyContent: "flex-end",
        boxSizing: "border-box",
      }}
    >
      <Link
        to="/report"
        style={{
          textDecoration: "none",
          fontWeight: "700",
          fontSize: "16px",
          padding: "10px 18px",
          borderRadius: "10px",
          background: "#111827",
          color: "white",
        }}
      >
        Report
      </Link>
    </div>
  );
}
