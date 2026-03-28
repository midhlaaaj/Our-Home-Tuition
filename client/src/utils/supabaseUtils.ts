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
    requestId?: string;
    timeout?: number;
}

/**
 * Wraps a Supabase query promise with retry logic for AbortErrors and transient failures.
 */
export async function safeFetch<T>(
    queryPromise: () => Promise<T>,
    options: SafeFetchOptions = {}
): Promise<T> {
    const { 
        retries = 3, 
        delay = 800, 
        silent = false, 
        requestId = Math.random().toString(36).substring(7),
        timeout = 10000
    } = options;
    
    let lastError: any;

    for (let i = 0; i <= retries; i++) {
        try {
            if (!silent && i > 0) console.log(`[${requestId}] Retry attempt ${i}/${retries}...`);
            
            // Race the query against a timeout
            const result = await Promise.race([
                queryPromise(),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
                )
            ]);
            
            // Check if the result itself contains a Supabase-level AbortError
            const supabaseError = (result as any)?.error;
            if (supabaseError) {
                const msg = supabaseError.message || "";
                if (msg.includes('AbortError') || msg.includes('aborted')) {
                    throw supabaseError; 
                }
            }
            
            return result;
        } catch (err: any) {
            lastError = err;
            
            const errorMessage = err?.message || (typeof err === 'string' ? err : "");
            const isAbortError = 
                err?.name === 'AbortError' || 
                errorMessage.includes('aborted') ||
                errorMessage.includes('AbortError') ||
                (typeof err === 'object' && err !== null && Object.keys(err).length === 0);

            const isTimeoutError = errorMessage.includes('timed out');

            if (isAbortError || isTimeoutError) {
                if (!silent) console.warn(`[${requestId}] ${isTimeoutError ? 'Timeout' : 'Abort'} detected. Retrying...`);
                if (i < retries) {
                    const nextDelay = delay * Math.pow(2, i); 
                    await new Promise(resolve => setTimeout(resolve, nextDelay));
                    continue;
                }
            }
            
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
