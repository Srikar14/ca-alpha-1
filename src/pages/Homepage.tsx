import React from "react";
const HomePage: React.FC = () => {
  return (
    <div style={styles.container}>
      <p>This app helps Chartered Accountants manage and extract data from client forms easily.</p>
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
};

export default HomePage;
