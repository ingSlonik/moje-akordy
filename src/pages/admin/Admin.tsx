import React, { useEffect, useState } from "react";
import { Link } from "easy-page-router/react";

import { useHead } from "../../services/common";
import { api, handleError } from "../../services/api";

import AnalyticsTab from "./AnalyticsTab";
import ErrorsTab from "./ErrorsTab";
import UsersTab from "./UsersTab";
import { AnalyticsRecord } from "../../../types";

import { useUser } from "easy-user-auth/react";
import { UserProfile, AdminUserItem } from "../../../types";
type AdminProps = {
    path: string[];
};

export default function Admin({ path }: AdminProps) {
    useHead({ title: "Admin Dashboard", description: "Admin section for managing the application." });

    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [records, setRecords] = useState<AnalyticsRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleMonthChange = (move: number) => {
        const newMonth = new Date(month);
        newMonth.setMonth(newMonth.getMonth() + move);
        const nextM = newMonth.toISOString().slice(0, 7);
        setMonth(nextM);
    };

    const defaultTab = 
        "analytics"
        ;

    const activeTab = path[1] || defaultTab;

    const [errorsList, setErrorsList] = useState<any[]>([]);
    const [loadingErrors, setLoadingErrors] = useState(false);
    const [errorLogsError, setErrorLogsError] = useState("");
    const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState("");
    const { isLoggedIn, user, loginUser, showUserDialog } = useUser<UserProfile>();

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUsersError("");
        try {
            const [data, err] = await api.getUsers({});
            if (data) {
                setUsersList(data);
            } else if (err) {
                setUsersError((err as any)?.message || String(err));
            }
        } catch (e) {
            setUsersError(String(e));
        }
        setLoadingUsers(false);
    };

    const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
        try {
            const [success, err] = await api.updateUserRole({ userId, role: newRole });
            if (success) {
                setUsersList(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
            } else if (err) {
                alert("Failed to update role: " + ((err as any)?.message || String(err)));
            }
        } catch (e) {
            alert(String(e));
        }
    };
    const fetchErrors = async (m: string) => {
        setLoadingErrors(true);
        setErrorLogsError("");
        try {
            const [data, err] = await api.getEasyAnalyticsErrors({ month: m });
            if (data) {
                setErrorsList(data);
            } else if (err) {
                setErrorLogsError((err as any)?.message || String(err));
            }
        } catch (e) {
            setErrorLogsError(String(e));
        }
        setLoadingErrors(false);
    };
    useEffect(() => {
        if (isLoggedIn && user?.role === "admin") {
            if (activeTab === "analytics") {
                fetchData(month);
            }
            if (activeTab === "errors") {
                fetchErrors(month);
            }
            if (activeTab === "users") {
                fetchUsers();
            }
            }
    }, [isLoggedIn, user, month, activeTab]);

    const fetchData = async (m: string) => {
        setLoading(true);
        setError("");
        try {
            const [data, err] = await api.getEasyAnalyticsData({ month: m });
            if (data) {
                setRecords(data as any);
            } else if (err) {
                setError((err as any)?.message || String(err));
            }
            } catch (e) {
            setError(String(e));
            handleError(e as Error);
        }
        setLoading(false);
    };

    if (!isLoggedIn || user?.role !== "admin") {
        return (
            <div className="admin-login">
                {!isLoggedIn ? (
                    <>
                        <h2>Admin Login Required</h2>
                        <p>Please log in using an account with administrative permissions.</p>
                        <div className="btn-center-group">
                            <button onClick={showUserDialog}>Log In</button>
                            <Link href="/">Back to website</Link>
                        </div>
                        <div className="tip-box">
                            💡 <strong>Tip:</strong> You can create the first admin by manually changing <code>"role": "user"</code> to <code>"role": "admin"</code> in <code>easy-db/user.json</code> for your user record.
                        </div>
                    </>
                ) : (
                    <>
                        <h2>Access Denied</h2>
                        <p>You do not have administrative permissions. (Logged in as <strong>{user?.name || (user as any)?.email}</strong>)</p>
                        <div className="btn-center-group">
                            <button onClick={() => loginUser(null)}>Log Out</button>
                            <Link href="/">Back to website</Link>
                        </div>
                    </>
                )}
            </div>
        );
    }
    
    return (
        <div className="admin-container">
            <div className="header">
                <div className="admin-header-title">
                    <h2>Admin Dashboard</h2>
                    <span className="admin-version-badge">v2.2.0</span>
                </div>
                <div className="admin-header-links">
                    <Link href="/editor" className="admin-nav-link">🎸 Správa písní</Link>
                    <Link href="/" className="admin-nav-link">← Zpět na web</Link>
                </div>
            </div>

            <div className="admin-tabs">
                {}
                <Link 
                    href="/admin/analytics" 
                    className={`admin-tab ${activeTab === "analytics" ? "active" : ""}`}
                >
                    Analytics
                </Link>
                {}
                {}
                <Link 
                    href="/admin/errors" 
                    className={`admin-tab ${activeTab === "errors" ? "active" : ""}`}
                >
                    Error Logs
                </Link>
                {}
                {}
                <Link 
                    href="/admin/users" 
                    className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
                >
                    User Management
                </Link>
                {}
            </div>

            <div className="controls">
                {/* Month selector is only relevant for Analytics and Errors */}
                {(activeTab === "analytics" || activeTab === "errors") ? (
                    <div className="admin-month-selector">
                        <button onClick={() => handleMonthChange(-1)}>← Previous Month</button>
                        <strong>{month}</strong>
                        <button onClick={() => handleMonthChange(1)}>Next Month →</button>
                    </div>
                ) : <div />}

                {}
                <button className="btn-logout" onClick={() => loginUser(null)}>Log Out</button>
                {}

                {}
            </div>

            {loading && activeTab === "analytics" && <p className="admin-status-loading">Loading analytics...</p>}
            {error && activeTab === "analytics" && <p className="admin-status-error text-error">{error}</p>}

            {}
            {activeTab === "analytics" && (
                <AnalyticsTab records={records} month={month} />
            )}
            {}

            {}
            {activeTab === "errors" && (
                <ErrorsTab errors={errorsList} loading={loadingErrors} errorMsg={errorLogsError} />
            )}
            {}

            {}
            {activeTab === "users" && (
                <UsersTab users={usersList} loading={loadingUsers} errorMsg={usersError} onRoleChange={handleRoleChange} />
            )}
            {}

            {}

            <div className="admin-footer">
                <span>easy-starter v2.2.0</span>
            </div>
        </div>
    );
}
