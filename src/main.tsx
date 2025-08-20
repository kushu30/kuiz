import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { useAuth } from "./lib/auth.ts";        // from src/routes/Home.tsx

function Boot() {
  const init = useAuth(s => s.init);
  React.useEffect(() => { init(); }, [init]);
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
