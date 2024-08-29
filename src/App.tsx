import {
    BrowserRouter, Link
} from "react-router-dom";

import PageRouter from "./Router";

export default function App() {
    return <BrowserRouter>
        <nav>
            <div className="content">
                <Link to="/">
                    <img className="logo" alt="Moje akordy Logo" src="/icon.png" width={64} height={64} />
                    <span>Fílův zpěvník</span>
                </Link>
            </div>
        </nav>

        <PageRouter />
    </BrowserRouter>;
}