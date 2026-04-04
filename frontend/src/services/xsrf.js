import { API_CONFIG } from "../config/api";

export function readXsrfToken() {
    return decodeURIComponent(
        document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1] ?? ""
    );
}

export async function getXsrfToken() {
    // If we already have the token, return it, no need to fetch again
    const xsrfToken = readXsrfToken();
    if (xsrfToken) {
        return xsrfToken;
    }

    await fetch(API_CONFIG.endpoints.CSRF_COOKIE, {
        credentials: "include",
    });
    
    return readXsrfToken();
}