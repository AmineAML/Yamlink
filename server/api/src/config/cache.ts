import { RedisOptions } from "ioredis"
import dotenv from 'dotenv'
import { IN_PROD } from "./app"

dotenv.config()

const {
    REDIS_PORT,
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_URI_PROD
} = process.env

let REDIS

if (IN_PROD) {
    REDIS = REDIS_URI_PROD
} else {
     let REDIS_OPTIONS: RedisOptions = {
        port: +REDIS_PORT!, //The '+' mean parse/convert the value to int meaning integer
        host: REDIS_HOST,
        password: REDIS_PASSWORD
    }

    REDIS = REDIS_OPTIONS
}

export const REDIS_URI = REDIS