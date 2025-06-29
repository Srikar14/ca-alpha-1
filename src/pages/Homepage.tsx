import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
  return (
    <div style={styles.container}>
      <p>This app helps Chartered Accountants manage and extract data from client forms easily.</p>

      <div style={styles.cardContainer}>
        <Link to="/esic" style={styles.card}>
          ESIC Challan Extractor
        </Link>
        <Link to="/pt" style={styles.card}>
          PT Challan Extractor
        </Link>
        <Link to="/tds" style={styles.card}>
          TDS Challan Extractor
        </Link>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  cardContainer: {
    marginTop: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    alignItems: "center",
  },
  card: {
    padding: "1rem 2rem",
    textDecoration: "none",
    backgroundColor: "#1976d2",
    color: "white",
    borderRadius: "8px",
    width: "250px",
    textAlign: "center",
    fontSize: "1rem",
    fontWeight: "bold",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
};

export default HomePage;
