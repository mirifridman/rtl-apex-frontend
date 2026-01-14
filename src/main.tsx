import React from "react";
import ReactDOM from "react-dom/client";

const root = document.getElementById("root");

if (!root) {
  document.body.innerHTML = "<h1>❌ ROOT NOT FOUND</h1>";
} else {
  ReactDOM.createRoot(root).render(
    <div
      style={{
        padding: 40,
        fontSize: 32,
        background: "yellow",
        color: "black",
      }}
    >
      ✅ REACT MOUNTED SUCCESSFULLY
    </div>
  );
}
