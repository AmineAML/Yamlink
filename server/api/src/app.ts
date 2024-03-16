import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { register, login, user, url } from './routes/v1'
import { notFound, serverError, active, catchAsync } from './middleware'
import session, { Store } from 'express-session'
import { SESSION_OPTIONS } from './config'

export const createApp = (store: Store) => {
    const app = express()

    //Define various HTTP headers that help secure the API 
    app.use(helmet())

    //Logging
    app.use(morgan('tiny'))

    //Add headers accepting requests coming from other origins
    app.use(cors())

    app.use(express.json())

    app.use(
        session({
            ...SESSION_OPTIONS,
            store
        })
    )

    const prefix = '/api/v1'

    //Each IP address' unique meaning the rate limiting's applied not to all IP address but to those requesting way above the rules of the API
    app.set('trust proxy', 1)
    
    app.use(prefix, user)
    
    app.use(prefix, login)
    
    app.use(prefix, register)

    app.use(prefix + '/url', url)

    app.use(notFound)

    app.use(serverError)

    app.use(catchAsync(active))
    
    return app
}