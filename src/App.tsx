import React from "react";
import { Link, RouterProvider, useRouter } from "easy-page-router/react";
import { UserProvider, useUser } from "easy-user-auth/react";
import { init } from "easy-analytics/client";

import Router from "./Router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Img } from "./components/Img";
import Footer from "./components/Footer";
import { UserProfile } from "../types";

// Initialize analytics.
init("/api/easy-analytics");

const czechDict = {
    userDialogLoggedInHeader: "Váš uživatelský profil",
    logOut: "Odhlásit se",
    logIn: "Přihlásit se",
    userCreateAccount: "Vytvořit nový účet",
    userDialogText: "Pro správu a ukládání svých písní se přihlaste ke svému účtu.",
    mail: "E-mail",
    password: "Heslo",
    passwordAgain: "Heslo znovu",
    userWrongPasswordMatch: "Hesla se neshodují",
    userWrongPasswordLength: "Heslo musí mít alespoň 6 znaků",
    userWrongMailFormat: "Neplatný formát e-mailu",
    userWrongFill: "Vyplňte prosím všechna povinná pole",
    userErrorRegister: "Registrace se nezdařila. Účet s tímto e-mailem již možná existuje.",
    userErrorLogIn: "Nesprávný e-mail nebo heslo",
    registerIn: "Zaregistrovat se",
    allRight: "V pořádku",
    userForgottenPasswordButton: "Zapomenuté heslo?",
    userForgottenPassword: "Obnova zapomenutého hesla",
    userForgottenPasswordSuccess: "Odkaz pro obnovení hesla byl odeslán na váš e-mail.",
    close: "Zavřít",
    userWrongSendMail: "Odeslání e-mailu se nezdařilo",
    userForgottenPasswordError: "Uživatel s tímto e-mailem nebyl nalezen",
    userForgottenPasswordErrorSend: "Chyba při odesílání e-mailu",
    userForgottenPasswordErrorChange: "Chyba při změně hesla",
    userForgottenPasswordSuccessChange: "Vaše heslo bylo úspěšně změněno!",
    backToHome: "Zpět na úvodní stránku",
    userForgottenPasswordChange: "Zadejte nové heslo",
    change: "Změnit",
    userNamePlaceholder: "Vaše jméno nebo přezdívka",
    save: "Uložit",
    termsAgreement: "Souhlasím s podmínkami užití",
    termsRequiredError: "Pro pokračování musíte souhlasit s podmínkami",
};

function Nav() {
    const { path } = useRouter();
    const { isLoggedIn, user, showUserDialog } = useUser<UserProfile>();

    // Hide navigation bar inside admin panel
    if (path[0] === "admin") {
        return null;
    }

    return (
        <nav className="main-navbar">
            <div className="content nav-inner">
                <Link href="/" className="nav-brand">
                    <Img src="/images/logo.png" w={48} h={48} alt="Logo" className="logo-img" />
                    <span className="brand-title">Fílův zpěvník</span>
                </Link>

                <div className="nav-actions">
                    <Link href="/editor" className="nav-link nav-btn-editor">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="nav-icon"
                        >
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                        </svg>
                        Přidat / Upravit písně
                    </Link>

                    {isLoggedIn && user?.role === "admin" && (
                        <Link href="/admin" className="nav-link nav-btn-admin">
                            Admin
                        </Link>
                    )}

                    {isLoggedIn ? (
                        <button
                            type="button"
                            onClick={showUserDialog}
                            className="btn-nav-user"
                            title="Správa uživatelského profilu"
                        >
                            <span className="user-avatar-icon">👤</span>
                            <span className="user-name-text">{user?.name || "Profil"}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={showUserDialog}
                            className="btn-nav-login"
                        >
                            Přihlásit se
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default function App() {
    const defaultUser: UserProfile = {
        name: "",
        role: "user",
    };

    return (
        <ErrorBoundary>
            <UserProvider<UserProfile> defaultUser={defaultUser} dict={czechDict}>
                <RouterProvider>
                    <div className="app-shell">
                        <Nav />
                        <div className="app-main-content">
                            <Router />
                        </div>
                        <Footer />
                    </div>
                </RouterProvider>
            </UserProvider>
        </ErrorBoundary>
    );
}
