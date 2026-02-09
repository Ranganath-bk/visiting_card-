import { BrowserRouter, Routes, Route } from "react-router-dom";
import Scan from "./pages/Scan";
import VisitingCard from "./pages/VisitingCard";
import Report from "./pages/Report";
import DeletedRecords from "./pages/DeletedRecords";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Scan />} />
        <Route path="/visiting-card" element={<VisitingCard />} />
        <Route path="/report" element={<Report />} />
        <Route path="/deleted-records" element={<DeletedRecords />} />
      </Routes>
    </BrowserRouter>
  );
}
