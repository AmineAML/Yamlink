import mongoose from 'mongoose'
import { createApp } from './app'
import session from 'express-session'
import connectRedis from 'connect-redis'
import Redis, { RedisOptions } from 'ioredis'
import { MONGO_URI, MONGO_OPTIONS, REDIS_URI, APP_PORT } from './config'

;(async () => {
    mongoose.connect(MONGO_URI!, MONGO_OPTIONS).then(() => {
        console.log(`Connection url => ${MONGO_URI}`)
    }).catch(err => {
        console.log(`MongoDB connection error\n${err}`)
    })

    const RedisStore = connectRedis(session)

    let client

    typeof REDIS_URI === 'string' ? client = new Redis(REDIS_URI) : client = new Redis(REDIS_URI)

    const store = new RedisStore({ client })
    
    const app = createApp(store)

    app.listen(APP_PORT, () => console.log(`http://localhost:${APP_PORT}`))
})()