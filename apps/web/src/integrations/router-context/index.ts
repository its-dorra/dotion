import { getAuthClient } from "@/lib/auth-client";
import { getQueryClient } from "../tanstack-query/root-provider";

export function getRouterContext() {
    const authClient = getAuthClient();
    const queryClient = getQueryClient();
    return {
        authClient,
        queryClient
    };
}
