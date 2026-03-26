/**
 * supabaseUtils.ts
 * 
 * Utility functions to handle transient Supabase fetch errors,
 * specifically targeting "AbortError: signal is aborted" which commonly
 * happens in React 18/19 Strict Mode or during rapid unmount/mount cycles.
 */

interface SafeFetchOptions {
    retries?: number;
    delay?: number;
    silent?: boolean;
}

/**
 * Wraps a Supabase query promise with retry logic for AbortErrors and transient failures.
 * 
 * @param queryPromise A function that returns a Supabase query promise
 * @param options Retry options
 * @returns The result of the query
 */
export async function safeFetch<T>(
    queryPromise: () => Promise<T>,
    options: SafeFetchOptions = {}
): Promise<T> {
    const { retries = 2, delay = 500, silent = false } = options;
    let lastError: any;

    for (let i = 0; i <= retries; i++) {
        try {
            return await queryPromise();
        } catch (err: any) {
            lastError = err;
            
            // Check if it's an AbortError (often stringified or hidden in an object)
            const isAbortError = 
                err?.name === 'AbortError' || 
                err?.message?.includes('aborted') ||
                (typeof err === 'object' && err !== null && Object.keys(err).length === 0); // common for aborted objects

            if (isAbortError) {
                if (!silent) console.warn(`Fetch aborted, retrying (${i + 1}/${retries})...`);
                if (i < retries) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                    continue;
                }
            }
            
            // For other errors, just throw immediately (or after one retry if desired)
            throw err;
        }
    }
    
    throw lastError;
}

/**
 * Special handler for Auth session fetching which is extra sensitive to aborts.
 */
export async function safeAuthFetch<T>(
    authPromise: () => Promise<T>,
    onAbort?: () => void
): Promise<T | null> {
    try {
        return await authPromise();
    } catch (err: any) {
        const isAbortError = err?.name === 'AbortError' || err?.message?.includes('aborted');
        if (isAbortError) {
            console.warn("Auth fetch aborted, handling gracefully.");
            if (onAbort) onAbort();
            return null;
        }
        throw err;
    }
}
