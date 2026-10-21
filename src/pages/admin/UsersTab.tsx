import React, { useState, useMemo } from "react";
import { AdminUserItem } from "../../../types";

type UsersTabProps = {
    users: AdminUserItem[];
    loading: boolean;
    errorMsg: string;
    onRoleChange: (userId: string, role: "admin" | "user") => void;
};

export default function UsersTab({ users, loading, errorMsg, onRoleChange }: UsersTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    // Filter users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (roleFilter !== "all" && u.role !== roleFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchEmail = (u.email || "").toLowerCase().includes(q);
                const matchName = (u.name || "").toLowerCase().includes(q);
                const matchId = (u._id || "").toLowerCase().includes(q);
                if (!matchEmail && !matchName && !matchId) {
                    return false;
                }
            }
            return true;
        });
    }, [users, roleFilter, searchQuery]);

    // KPI counts
    const adminCount = useMemo(() => users.filter(u => u.role === "admin").length, [users]);
    const regularCount = useMemo(() => users.filter(u => u.role === "user").length, [users]);

    return (
        <div>
            {/* Header */}
            <div className="admin-users-header">
                <div>
                    <h3 className="admin-users-title">User Management</h3>
                    <p className="admin-users-subtitle">
                        List of registered application accounts, permissions, and administrative roles.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="admin-stats-summary-grid">
                <div className="admin-summary-card">
                    <div className="admin-summary-label">Total Users</div>
                    <div className="admin-summary-value">{users.length}</div>
                    <div className="admin-summary-sub">Registered accounts</div>
                </div>
                <div className="admin-summary-card">
                    <div className="admin-summary-label">Administrators</div>
                    <div className="admin-summary-value">{adminCount}</div>
                    <div className="admin-summary-sub">Full admin permissions</div>
                </div>
                <div className="admin-summary-card">
                    <div className="admin-summary-label">Standard Users</div>
                    <div className="admin-summary-value">{regularCount}</div>
                    <div className="admin-summary-sub">Standard user accounts</div>
                </div>
            </div>

            {/* Filters bar */}
            <div className="admin-users-filter-bar">
                <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by name, email, or user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="admin-filter-group">
                    <label>Role:</label>
                    <select
                        className="admin-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                    >
                        <option value="all">All Roles ({users.length})</option>
                        <option value="admin">Admins only ({adminCount})</option>
                        <option value="user">Users only ({regularCount})</option>
                    </select>
                </div>
            </div>

            {/* Status */}
            {loading && <p className="admin-status-loading">Loading users...</p>}
            {errorMsg && <p className="admin-status-error text-error">{errorMsg}</p>}

            {!loading && !errorMsg && (
                <div className="admin-table-container">
                    <table className="admin-records-table">
                        <thead>
                            <tr>
                                <th>Name & Email</th>
                                <th className="col-role">Current Role</th>
                                <th className="col-change-role">Change Role</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="admin-records-empty">
                                        No users found matching current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((usr) => {
                                    const isExpanded = expandedUserId === usr._id;
                                    return (
                                        <React.Fragment key={usr._id}>
                                            <tr className={`admin-record-row ${isExpanded ? "expanded" : ""}`}>
                                                <td>
                                                    <div className="font-semibold text-main">
                                                        {usr.name || "Anonymous User"}
                                                    </div>
                                                    <div className="text-sm text-muted">
                                                        {usr.email}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`role-badge ${usr.role === "admin" ? "admin" : ""}`}>
                                                        {usr.role === "admin" ? "🛡️ Admin" : "👤 User"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        className="admin-select"
                                                        value={usr.role || "user"}
                                                        onChange={(e) => onRoleChange(usr._id, e.target.value as any)}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="admin-filter-preset-btn text-xs"
                                                        onClick={() => setExpandedUserId(isExpanded ? null : usr._id)}
                                                    >
                                                        {isExpanded ? "Close" : "Inspect"}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="admin-record-detail-row">
                                                    <td colSpan={4}>
                                                        <div className="admin-record-detail-card">
                                                            <div className="admin-detail-grid">
                                                                <div className="admin-detail-card">
                                                                    <strong>User Account Information</strong>
                                                                    <div>User ID: <code>{usr._id}</code></div>
                                                                    <div>Email: <strong>{usr.email}</strong></div>
                                                                    <div>Full Name: <span>{usr.name || "N/A"}</span></div>
                                                                    <div>Assigned Role: <strong>{usr.role}</strong></div>
                                                                    {usr.createdAt && (
                                                                        <div>Created: {new Date(usr.createdAt).toLocaleString()}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
