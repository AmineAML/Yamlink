import rateLimit from 'express-rate-limit'

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 mins
    max: 20, //Limit each IP to 20 requests per windowMs
    message: "Too many short links created, please try again later after 15 minutes"
})