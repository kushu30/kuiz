import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { useAuth } from "@/lib/auth";

function Boot() {
  const init = useAuth((s) => s.init);
  React.useEffect(() => { void init(); }, [init]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Boot />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
