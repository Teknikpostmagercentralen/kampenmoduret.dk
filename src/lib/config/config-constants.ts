
import {env} from '$env/dynamic/public';

export class ConfigConstants {
    static getURL(): string {
        // Prefer CF_PAGES_URL if available (Cloudflare's environment)
        if (env.PUBLIC_CURRENT_APP_URL) {
            return env.PUBLIC_CURRENT_APP_URL;
        }

        // Fallback to PUBLIC_CURRENT_APP_URL (your custom env.example value)
        if (env.PUBLIC_CURRENT_APP_URL) {
            return env.PUBLIC_CURRENT_APP_URL;
        }

        // Fallback to localhost if all else fails
        return "http://localhost:5173";
    }
}