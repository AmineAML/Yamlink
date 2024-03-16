import Joi from 'joi'

//This validate that the start of an url with https or http and also validate the tld meaning domain name like .com and more from http://data.iana.org/TLD/tlds-alpha-by-domain.txt
const fullUrl =  Joi.string().trim().required()

const fullUrlArray = Joi.array().items(Joi.string().trim()).required()

const isPrivate =  Joi.boolean().required()

//const slug = Joi.string().trim().regex(/[\w\-]+$/i).required()

//const accessCode =  Joi.string().trim()

export const shortUrlSchema = Joi.object({
    fullUrl,
    isPrivate,
    //slug,
    //accessCode
})

export const shortUrlArraySchema = Joi.object({
    fullUrlArray,
    isPrivate,
    //slug,
    //accessCode
})