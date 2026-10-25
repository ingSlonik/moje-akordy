import { APIDefinition, Endpoint } from "typed-client-server-api";
import { UserDB } from "easy-user-auth/types";

export type UserProfile = {
    name: string;
    role: "admin" | "user";
};

export type AdminUserItem = {
    _id: string;
    email: string;
    name: string;
    role: "admin" | "user";
    createdAt?: string | number;
};

export type AnalyticsRecord = {
    _id?: string;
    url?: string;
    referrer?: string;
    userAgent?: string;
    ip?: string;
    ipCountry?: string;
    serverDate?: string;
    localDate?: string;
    localDateLeft?: string;
    created?: string;
    localId?: string;
    sessionId?: string;
    recordIdBefore?: string;
    urlBefore?: string;
    window?: {
        innerWidth?: number;
        innerHeight?: number;
        screenWidth?: number;
        screenHeight?: number;
        devicePixelRatio?: number;
    };
    userId?: string;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    detectedUserId?: string;
    detectedUserEmail?: string;
    detectedUserName?: string;
    detectedUserRole?: string;
    [key: string]: any;
};

export type SongToken =
    | { type: "text"; value: string }
    | { type: "chord"; value: string }
    | { type: "comment"; value: string }
    | { type: "tab"; value: string };

export type SongRecord = {
    _id: string;
    title: string;
    artist: string;
    scrollSpeed: number;
    defaultRating: number;
    ratings: Record<string, number>;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
};

export type PoemRecord = {
    _id: string;
    bookSlug: string;
    bookTitle: string;
    artist: string;
    title: string;
    text: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
};

export type Song = {
    file: string;
    type: "song" | "poem";
    artist: string;
    title: string;
    rating: number;
    defaultRating: number;
    ratings: Record<string, number>;
    authorId: string;
    authorName: string;
    lastModified: string;
    bookTitle?: string;
};

export type SongDetail = {
    file: string;
    title: string;
    artist: string;
    scrollSpeed: number;
    rating: number;
    defaultRating: number;
    ratings: Record<string, number>;
    authorId: string;
    authorName: string;
    content: string;
    text: SongToken[];
};

export type PoemDetail = {
    file: string;
    title: string;
    artist: string | null;
    bookTitle: string | null;
    authorId: string;
    authorName: string;
    text: string;
};

/** What a logged-in user is currently looking at (target for live followers). */
export type LiveTarget = {
    type: "song" | "poem";
    file: string;
    /** Poem title (second URL segment), only for poems. */
    title?: string;
    /** Song transposition, e.g. "G". */
    key?: string;
};

/** Stored in `live` collection, `_id` = public live code derived from userId. */
export type LiveRecord = LiveTarget & {
    _id: string;
    leaderName: string;
    /** Human readable name of the page, e.g. "Čmelák – Divokej Bill". */
    label?: string;
    updatedAt: string;
};

export type LiveState = LiveTarget & {
    leaderName: string;
    label?: string;
    updatedAt: string;
};

export type API = APIDefinition<{
    getSongs: Endpoint<{}, Song[]>;
    getSong: Endpoint<{ file: string }, SongDetail>;
    getPoem: Endpoint<{ file: string; title: string }, PoemDetail>;

    addSong: Endpoint<{
        file?: string;
        title: string;
        artist: string;
        scrollSpeed?: number;
        content: string;
        rating?: number;
    }, { file: string }>;
    updateSong: Endpoint<{
        file: string;
        title: string;
        artist: string;
        scrollSpeed: number;
        content: string;
        rating?: number;
    }, boolean>;
    removeSong: Endpoint<{ file: string }, boolean>;
    updateSongRating: Endpoint<{ file: string; rating: number }, { rating: number }>;

    getEasyAnalyticsData: Endpoint<{ month: string }, AnalyticsRecord[]>;
    getEasyAnalyticsErrors: Endpoint<{ month: string }, any[]>;
    getUsers: Endpoint<{}, AdminUserItem[]>;
    updateUserRole: Endpoint<{ userId: string; role: "admin" | "user" }, boolean>;

    getLiveCode: Endpoint<{}, { code: string }>;
    updateLiveState: Endpoint<LiveTarget, boolean>;
    getLiveState: Endpoint<{ code: string }, { live: LiveState | null }>;
}>;

export type Database = {
    song: SongRecord;
    poem: PoemRecord;
    live: LiveRecord;
    user: UserDB<UserProfile>;
};
