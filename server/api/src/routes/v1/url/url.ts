import { Router } from 'express'
import { validate, shortUrlSchema, validateUrl, shortUrlArraySchema } from '../../../validation'
import { Url, User } from '../../../models'
import { BadRequest, Unauthorized, NotFound } from '../../../errors'
import { customAlphabet } from 'nanoid'
import { catchAsync, auth, limiter } from '../../../middleware'

const router = Router()

const alphabet = 'abcdefghijklmnopqrstuvwxyz'

const nanoid = customAlphabet('1234567890' + alphabet + alphabet.toUpperCase(), 7)

const generateRandomString = customAlphabet('1234567890' + alphabet, 5)

let slug: string = ""

let accessCode: string = ""

let found: boolean

let tries: number = 0

let inavailableSlugs: boolean = false

let clicks: number = 0

//Create public links, and if a user's signed in then create private and public routes then assign them to that user
router.post('/', limiter, catchAsync(async (req, res, next) => {
    await validate(shortUrlSchema, req.body)

    const { fullUrl, isPrivate } = req.body

    try {
        await validateUrl(fullUrl)
        
        //Don't allow the user to use this web app link as a shortened link
        if (fullUrl.includes('yamlink.amineamellouk.com')) {
            throw new BadRequest('Nein! you cannot use an url shortener to shortener itself. THAT IS CONSIDERATED BY US ILLEGAL.')
        }
    
        //Generate a slug and check if the slug already exists in the database, if it's then re generate a new slug and do this until a slug's not used or you tries are exhausted
        do {
            slug = nanoid()

            found = await Url.exists({ slug })

            tries++
        } while(found || tries == 10)

        tries == 10? inavailableSlugs = true : inavailableSlugs

        if (inavailableSlugs) {
            throw new BadRequest('Server error trying to shorten your url')
        } else {
            //Verify that the slugs is not blacklisted meaning that it was private and used before and the user who generated it did delete it
            //If the url is private, make sure the user's logged in and then generate an access code and save that slug to that suer
            if (isPrivate) {
                if (req.session!.userId) {
                    accessCode = generateRandomString()

                    await User.updateOne(
                        { _id: req.session!.userId },
                        { $push: { slugs: slug } }
                    )
                } else {
                    throw new Unauthorized('You must be logged in to make private urls')
                }
            }
    
            const newUrl = {
                fullUrl,
                slug,
                isPrivate,
                accessCode,
                clicks
            }
    
            const createNewShortUrl = await Url.create(newUrl)
        
            res.json(createNewShortUrl)
        }
    } catch(error) {
        next(error)
    }
}))

let slugArray: Array<string> = []
//let slugArray: string[] = []
let newUrls: Array<any> = []

//Create a bulk of short links in the same request like 20 links inserted by the user, each of them is made for it a short link and all 20 of them are sent in a response with their respective short links and also the user can upload text file of type of .txt with a list of links
router.post('/many', limiter, catchAsync(async (req, res, next) => {
    await validate(shortUrlArraySchema, req.body)

    const { fullUrlArray, isPrivate } = req.body

    try {
        fullUrlArray.forEach(async (element: string) => {
            console.log('ValidateUrl')
            await validateUrl(element)
        });

        await fullUrlArray.forEach((element: string) => {
            console.log('Not allowed to use this hostname')
            if (element.includes('example.amineamellouk.com')) {
                throw new BadRequest('Nein! one or more of your urls does use this url shortener to shortener itself. THAT IS CONSIDERATED BY US ILLEGAL.')
            }
        });

        for (let i = 0; i<fullUrlArray.length; i++) {
            console.log('slug')
            do {
                slugArray.push(nanoid())
                let slug = slugArray[i]
                //console.log(slug)
                //slug = nanoid()
    
                found = await Url.exists({ slug })
    
                tries++
            } while(found || tries <= 10)
        }

        tries == 10? inavailableSlugs = true : inavailableSlugs

        if (inavailableSlugs) {
            throw new BadRequest('Server error trying to shorten your url')
        } else {
            if (isPrivate) {
                if (req.session!.userId) {
                    accessCode = generateRandomString()

                    await User.updateOne(
                        { _id: req.session!.userId },
                        { $push: { slugs: { $each: slugArray } } }
                    )
                } else {
                    throw new Unauthorized('You must be logged in to make private urls')
                }
            }

            let fullUrl
            let slug
            let newUrl
            for (let i = 0; i<fullUrlArray.length; i++) {
                fullUrl = fullUrlArray[i]
                slug = slugArray[i]

                newUrl = {
                    fullUrl,
                    slug,
                    isPrivate,
                    accessCode,
                    clicks
                }

                newUrls.push(
                    newUrl
                )
            }

            //console.log(newUrls)
    
            const createNewShortUrl = await Url.insertMany(newUrls)

            //console.log(createNewShortUrl)
        
            res.json(createNewShortUrl)
        }
    } catch(error) {
        next(error)
    }
}))


//Get the url if the slug exists
router.get('/:slug', catchAsync(async (req, res, next) => {
    const slug = req.params.slug
    const accessCode = req.body.accessCode

    clicks = 1

    try {
        const url = await Url.findOne({ slug }).select('-clicks')
        if (url) {
            //If it's private, require an access code, else don't require it
            if (url.isPrivate) {
                //If a user is signed in check if the slug's generated by the user, else try the access code
                if (req.session!.userId) {
                    //If a user's signed in, verify that this slug's part of the slugs generated by the user
                    const user = await User.findById(req.session!.userId)
                    if (user) {
                        const isGeneratedByUser = await User.findOne( { email: user.email } ).where('slugs').equals(slug)
                        if (isGeneratedByUser) {
                            await Url.findOneAndUpdate(
                                { _id: url._id }, 
                                { $inc: {'clicks': clicks} }
                            )
                            return res.json(url)
                        } else if (url.accessCode == accessCode) {
                            await Url.findOneAndUpdate(
                                { _id: url._id }, 
                                { $inc: {'clicks': clicks} }
                            )
                            return res.json(url)
                        }
                    }
                }
                //If no user's signed in or the slug's not part of the slugs generated by the user, verify the access code
                else if (url.accessCode == accessCode) {
                    await Url.findOneAndUpdate(
                        { _id: url._id }, 
                        { $inc: {'clicks': clicks} }
                    )
                    return res.json(url)
                }
                throw new Unauthorized('Requires an access code, or access code is incorrect ' + slug)
            }
            await Url.findOneAndUpdate(
                { _id: url._id }, 
                { $inc: {'clicks': clicks} }
            )
            return res.json(url)
        }
        throw new NotFound('No url found with this slug ' + slug)
    } catch (error) {
        //res.json(error)
        next(error)
    }
}))

//Get all slugs generated by the user
router.get('/all/slugs', auth, catchAsync(async (req, res, next) => {
    try {
        const user = await User.findById(req.session!.userId)
        if (user) {
            const url = await Url.find().where('slug').in(user.slugs)
            if (url) {
                return res.json(url)
            }
            throw new NotFound('There is no short url generated by the user')
        }
    } catch (error) {
        next(error)
    }
}))

///Delete a slug if it's generated by the user and also add it to the slugs blacklist that it can't be used with another url and also if it's private remove it from the slugs array of the user
router.post('/slugs/remove', auth, catchAsync(async (req, res, next) => {
    const { urlId } = req.body
    try {
        const url = await Url.findById(urlId)
        if (url) {
            const urlDeleted = await Url.deleteOne({ _id: urlId })
            //Url deleted from the url collection
            if (urlDeleted.ok == 1) {
                const user = await User.findById(req.session!.userId)
                if (user) {
                    //Slug deleted from the user's slugs collection
                    const removeSlugFromUserArray = await User.findOneAndUpdate(
                                                        { _id: user._id },
                                                        { $pull: { slugs: url.slug } } 
                                                    )
                    if (removeSlugFromUserArray) {
                        return res.json({ message: urlDeleted.deletedCount + ' url was deleted'})
                    }
                }
            }
            throw new BadRequest('Error deleting the url')
        }
    } catch (error) {
        next(error)
    }
}))

export default router