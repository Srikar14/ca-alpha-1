import React, { useState } from "react";
import AppTopBar from "./components/AppTopBar";
import Sidebar from "./components/Sidebar";
import MainContent from "./pages/MainContent";

const App = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppTopBar open={drawerOpen} onDrawerOpen={() => setDrawerOpen(true)} />

      <div style={{ display: "flex", flexGrow: 1 }}>
        <Sidebar open={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
        <div
          className="main-content"
          style={{ marginTop: "64px", padding: "2rem" }}
        >
          <MainContent />
        </div>
      </div>
    </div>
  );
};

export default App;
