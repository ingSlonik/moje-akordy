import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/Home";
import SongPage from "./pages/Song";
import PoemPage from "./pages/Poem";
import NotFoundPage from "./pages/NotFound";

export default function PageRouter() {
    return <Routes>
        <Route path="/:file" element={<SongPage />} />
        <Route path="/:file/:title" element={<PoemPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>;
}