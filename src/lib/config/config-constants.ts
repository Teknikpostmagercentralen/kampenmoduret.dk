
import {env} from '$env/dynamic/public';

export class ConfigConstants {
    static getURL(): string {
        // Fallback to PUBLIC_CURRENT_APP_URL (your custom env.example value)
        if (env.PUBLIC_CURRENT_APP_URL) {
            return env.PUBLIC_CURRENT_APP_URL;
        }
        
        //If not net in env just use it from the browser window
        const baseUrl = `${window.location.protocol}//${window.location.host}`;
        return baseUrl
    }
}