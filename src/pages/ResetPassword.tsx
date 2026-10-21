import React, { useState, useEffect } from "react";
import { useRouter } from "easy-page-router/react";
import { useUser } from "easy-user-auth/react";
import { useHead } from "../services/common";
import { UserProfile } from "../../types";

export default function ResetPasswordPage() {
    useHead({ title: "Reset Password", description: "Enter a new password for your account." });

    const { api, loginUser, dict } = useUser<UserProfile>();
    const { push } = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [passwordAgain, setPasswordAgain] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tok = params.get("token");
            if (tok) {
                setToken(tok);
            } else {
                setError("Reset token is missing in the URL.");
            }
        }
    }, []);

    let validationError = "";
    if (password.length > 0 && password.length < 6) {
        validationError = dict.userWrongPasswordLength;
    } else if (password && passwordAgain && password !== passwordAgain) {
        validationError = dict.userWrongPasswordMatch;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validationError || !password || !passwordAgain || !token) return;

        setLoading(true);
        setError(null);

        const [userResult, err] = await api.updateForgottenPassword({ token, password });

        if (err) {
            setError(dict.userForgottenPasswordErrorChange);
        } else if (userResult) {
            setSuccess(true);
            setTimeout(() => {
                loginUser(userResult);
                push("/");
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <main className="reset-password-main">
            <h2 className="easy-user-auth-title">🔑 {dict.userForgottenPasswordChange}</h2>
            
            {error && !token && (
                <div className="easy-user-auth-alert">{error}</div>
            )}

            {success ? (
                <div className="easy-user-auth-alert alert-success">
                    {dict.userForgottenPasswordSuccessChange}
                </div>
            ) : (
                token && (
                    <form onSubmit={handleSubmit} className="easy-user-auth-form">
                        <div className="easy-user-auth-form-input">
                            <label className="easy-user-auth-label">{dict.password}</label>
                            <input
                                type="password"
                                className="easy-user-auth-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                maxLength={50}
                            />
                        </div>

                        <div className="easy-user-auth-form-input">
                            <label className="easy-user-auth-label">{dict.passwordAgain}</label>
                            <input
                                type="password"
                                className="easy-user-auth-input"
                                value={passwordAgain}
                                onChange={(e) => setPasswordAgain(e.target.value)}
                                required
                                maxLength={50}
                            />
                        </div>

                        {error && <div className="easy-user-auth-alert">{error}</div>}
                        {validationError && <p className="easy-user-auth-info text-error">{validationError}</p>}

                        <div className="btn-group">
                            <button
                                type="submit"
                                className="easy-user-auth-submit-btn"
                                disabled={!!validationError || !password || !passwordAgain || loading}
                            >
                                {loading ? "Updating..." : dict.change}
                            </button>
                            <button
                                type="button"
                                className="easy-user-auth-back-btn"
                                onClick={() => push("/")}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )
            )}
        </main>
    );
}
