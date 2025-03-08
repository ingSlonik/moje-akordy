import { setServerUrl, getUseAPIFrontend, getAPIFrontend, setHeaders } from "typed-client-server-api/hooks";
import { API } from "../types";

setServerUrl(process.env.NODE_ENV === "development" ? "http://localhost:1010" : "");

let authorization = "";

setHeaders(() => ({
    "Content-Type": "application/json",
    "Authorization": authorization,
}));

export function setAuthorizationHeader(newAuthorization: string) {
    authorization = newAuthorization;
}

export const api = getAPIFrontend<API>();
export const useApi = getUseAPIFrontend<API>();