import { Router } from "../easy-router";

import HomePage from "./pages/Home";
import SongPage from "./pages/Song";
import PoemPage from "./pages/Poem";
import NotFoundPage from "./pages/NotFound";

export default function PageRouter() {

    return <Router renderPage={({ path }) => {
        if (path[0] === "404") {
            return <NotFoundPage />;
        } else if (path[0] && path[1]) {
            return <PoemPage file={path[0]} title={path[1]} />;
        } else if (path[0]) {
            return <SongPage file={path[0]} />;
        } else {
            return <HomePage />;
        }
    }} />;
}
