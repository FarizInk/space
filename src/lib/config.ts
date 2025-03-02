import {
    DEBUG,
    POCKETBASE_URL,
    POCKETBASE_USERNAME,
    POCKETBASE_PASSWORD,
    FILE_SIZE,
    UPLOAD_PATH
} from "$env/static/private";
import type { Context } from "hono";

interface Config {
    DEBUG: boolean;
    POCKETBASE_URL: string;
    POCKETBASE_USERNAME: string;
    POCKETBASE_PASSWORD: string;
    FILE_SIZE: number;
    UPLOAD_PATH: string;
}

const config: Config = {
    DEBUG: DEBUG && DEBUG === 'true' ? true : false,
    POCKETBASE_URL: POCKETBASE_URL ?? '',
    POCKETBASE_USERNAME: POCKETBASE_USERNAME ?? '',
    POCKETBASE_PASSWORD: POCKETBASE_PASSWORD ?? '',
    FILE_SIZE: FILE_SIZE ? parseFloat(FILE_SIZE) : 2,
    UPLOAD_PATH: UPLOAD_PATH ?? '',
};

export default config;

export const publicConfig = (c: Context) => {
    return c.json({
        DEBUG: config.DEBUG,
        FILE_SIZE: config.FILE_SIZE,
    })
}