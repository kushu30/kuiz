import { Routes, Route } from "react-router-dom";
import Shell from "@/components/Shell";
import Home from "./routes/Home";
import Join from "./routes/Join";
import TakeTest from "./routes/TakeTest";
import AdminTests from "./routes/admin/AdminTests";
import AdminTestDetail from "./routes/admin/AdminTestDetail";
import AdminResults from "./routes/admin/AdminResults";
import RequireAuth from "./components/RequireAuth";
import About from "./routes/About";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<Join />} />
        <Route path="/about" element={<About />} />
        <Route path="/test/:id" element={<TakeTest />} />
        <Route path="/take/:id" element={<TakeTest />} />
        <Route path="/admin/tests" element={<RequireAuth><AdminTests /></RequireAuth>} />
        <Route path="/admin/tests/:id" element={<RequireAuth><AdminTestDetail /></RequireAuth>} />
        <Route path="/admin/results/:id" element={<RequireAuth><AdminResults /></RequireAuth>} />
      </Routes>
    </Shell>
  );
}
