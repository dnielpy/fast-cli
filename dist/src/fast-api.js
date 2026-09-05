const API_ENDPOINT = "https://api.fast.com/netflix/speedtest/v2";
const PUBLIC_TOKEN = "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm";
const DEFAULT_URL_COUNT = 5;
export class FastApiError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = "FastApiError";
    }
}
export function createFastApiClient(options = {}) {
    const fetchImpl = options.fetchImpl ?? fetch;
    const timeoutMs = options.timeoutMs ?? 10_000;
    const endpoint = options.endpoint ?? API_ENDPOINT;
    const token = options.token ?? PUBLIC_TOKEN;
    return {
        async getConfig(signal) {
            const url = new URL(endpoint);
            url.searchParams.set("https", "true");
            url.searchParams.set("token", token);
            url.searchParams.set("urlCount", String(DEFAULT_URL_COUNT));
            const timeoutController = new AbortController();
            const onAbort = () => timeoutController.abort(signal?.reason);
            signal?.addEventListener("abort", onAbort, { once: true });
            const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
            try {
                const response = await fetchImpl(url, { signal: timeoutController.signal });
                if (!response.ok) {
                    throw new FastApiError(`fast.com respondió con HTTP ${response.status}`);
                }
                let config;
                try {
                    config = (await response.json());
                }
                catch (error) {
                    throw new FastApiError("fast.com devolvió una respuesta no válida", { cause: error });
                }
                validateConfig(config);
                return config;
            }
            catch (error) {
                if (signal?.aborted) {
                    throw error;
                }
                if (error instanceof DOMException && error.name === "AbortError") {
                    throw new FastApiError("Tiempo de espera agotado al contactar con fast.com", { cause: error });
                }
                if (error instanceof FastApiError) {
                    throw error;
                }
                throw new FastApiError("No se pudo contactar con fast.com", { cause: error });
            }
            finally {
                clearTimeout(timeout);
                signal?.removeEventListener("abort", onAbort);
            }
        },
    };
}
function validateConfig(config) {
    if (!config || !Array.isArray(config.targets) || config.targets.length === 0) {
        throw new FastApiError("fast.com no devolvió servidores de prueba");
    }
    for (const target of config.targets) {
        if (!target || typeof target.url !== "string" || !target.url.startsWith("http")) {
            throw new FastApiError("fast.com devolvió un servidor de prueba inválido");
        }
    }
}
export function formatLocation(location) {
    if (!location) {
        return null;
    }
    const value = [location.city, location.country].filter(Boolean).join(", ");
    return value || null;
}
