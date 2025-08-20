import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./Index.css"; // This now exists

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
