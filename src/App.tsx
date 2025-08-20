import { Routes, Route, Navigate } from "react-router-dom";
import TestsList from "./routes/TestsList.tsx";
import TakeTest from "./routes/TakeTest.tsx";
import AdminTests from "./routes/admin/AdminTests.tsx";
import AdminTestDetail from "./routes/admin/AdminTestDetail.tsx";
import AdminResults from "./routes/admin/AdminResults.tsx";
import RequireAuth from "./components/RequireAuth";
import Home from "./routes/Home.tsx";


export default function App() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tests" element={<TestsList />} />
        <Route path="/test/:id" element={<TakeTest />} />
        <Route path="/admin/tests" element={<RequireAuth><AdminTests /></RequireAuth>} />
        <Route path="/admin/tests/:id" element={<RequireAuth><AdminTestDetail /></RequireAuth>} />
        <Route path="/admin/results/:id" element={<RequireAuth><AdminResults /></RequireAuth>} />
      </Routes>
    </div>
  );
}
