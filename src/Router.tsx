import { RenderAnimationProps, Router } from "../easy-router";

import HomePage from "./pages/Home";
import SongPage from "./pages/Song";
import PoemPage from "./pages/Poem";
import NotFoundPage from "./pages/NotFound";
import { useEffect, useState } from "react";

export default function PageRouter() {

    return <div className="page-router">
        <Router
            renderAnimation={Animation}
            renderPage={({ path }) => {
                if (path[0] === "404") {
                    return <NotFoundPage />;
                } else if (path[0] && path[1]) {
                    return <PoemPage file={path[0]} title={path[1]} />;
                } else if (path[0]) {
                    return <SongPage file={path[0]} />;
                } else {
                    return <HomePage />;
                }
            }}
        />
    </div>;
}

function Animation({ page, state }: RenderAnimationProps) {
    const [newClass, setNewClass] = useState("new");

    useEffect(() => {
        if (state !== "active") setNewClass("");
    }, [state]);
        
    return <div className={`page-animation ${state} ${newClass}`}>{page}</div>
}