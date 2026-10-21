import { useEffect } from "react";
import { sendError } from "easy-analytics/client";
import { setServerUrl, getUseAPIFrontend, getAPIFrontend, setHeaders } from "typed-client-server-api/hooks";

import { useSSRHook } from "ssr-hook/client";
import { setSSROrigin } from "ssr-hook";
import { API } from "../../types";

export type UseSSRAPIType = {
    [I in keyof API]: (params: API[I]["params"]) =>
        | [response: null, error: null, isLoading: boolean, reload: () => void]
        | [response: API[I]["result"], error: null, isLoading: boolean, reload: () => void]
        | [response: null, error: Error, isLoading: boolean, reload: () => void];
};


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
export const useSSRApi = new Proxy({}, {
    get(target, prop: string) {
        return (params: any) => {
            const url = api[prop as keyof typeof api].getUrl(params);
            return useSSRHook(url);
        };
    }
}) as UseSSRAPIType;
export function handleError(error?: unknown, errorInfo?: any) {
    if (!error) return;
    if (typeof error === "string") error = new Error(error);

    if (error instanceof Error && errorInfo && typeof errorInfo === "object" && typeof errorInfo.componentStack === "string") {
        error.stack = errorInfo.componentStack;
    }

    console.error(error);
    sendError(error);
    }

export function useHandleError(error?: null | string | Error) {
    useEffect(() => {
        handleError(error);
    }, [error]);
}
