// src/pages/MainContent.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import EsicExtractor from "./EsicExtract";
import PtExtractor from "./PtExtract";
import TdsExtractor from "./TdsExtract";

const MainContent = () => {
  return (
    <div className="Main-content" style={{ flexGrow: 1, padding: "2rem" }}>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/esic" element={<EsicExtractor />} />
        <Route path="/pt" element={<PtExtractor />} />
        <Route path="/tds" element={<TdsExtractor />} />
      </Routes>
    </div>
  );
};

export default MainContent;
