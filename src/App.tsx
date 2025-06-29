import React from "react";
import "./App.css";
import Homepage from "./pages/Homepage";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div className="App">
      <div className="Sidebar-container">
        <Sidebar />
      </div>

      <div className="Homepage-container">
        <Homepage />
      </div>
    </div>
  );
}

export default App;
