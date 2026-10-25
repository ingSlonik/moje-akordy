import React, { lazy, Suspense, useEffect, useState } from "react";
import { RenderAnimationProps, Router } from "easy-page-router/react";

import Index from "./pages/Index";
import SongPage from "./pages/Song";
import PoemPage from "./pages/Poem";
import Editor from "./pages/Editor";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import LivePage from "./pages/Live";

const Admin = lazy(() => import("./pages/admin/Admin"));

export default function AppRouter() {
    return (
        <div className="page-router">
            <Router
                renderAnimation={Animation}
                renderPage={({ path }: { path: string[] }) => {
                    if (path.length === 0) {
                        return <Index />;
                    }

                    if (path[0] === "404") {
                        return <NotFound />;
                    }

                    if (path[0] === "reset-password") {
                        return <ResetPassword />;
                    }

                    if (path[0] === "admin") {
                        return (
                            <Suspense fallback={<div className="loading-fallback">Načítám administraci...</div>}>
                                <Admin path={path} />
                            </Suspense>
                        );
                    }

                    if (path[0] === "live" && path[1]) {
                        return <LivePage code={path[1]} />;
                    }

                    if (path[0] === "editor") {
                        return <Editor file={path[1]} />;
                    }

                    if (path[0] && path[1]) {
                        return <PoemPage file={path[0]} title={path[1]} />;
                    }

                    if (path[0]) {
                        return <SongPage file={path[0]} />;
                    }

                    return <NotFound />;
                }}
            />
        </div>
    );
}

function Animation({ page, state }: RenderAnimationProps) {
    const [newClass, setNewClass] = useState("new");

    useEffect(() => {
        if (state !== "active") setNewClass("");
    }, [state]);

    return <div className={`page-animation ${state} ${newClass}`}>{page}</div>;
}
