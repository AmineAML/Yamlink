import { Schema, model, Document } from 'mongoose'

//Each slug deleted's saved its slug and the user's Id who deleted it and the date that user delete it at
interface UrlSlugsDocument extends Document {
    slug: string,
    //User's Id
    deletedByUser: string,
    deletedAt: Date,
    fullUrl: string,
    isPrivate: boolean,
    accessCode: string,
    clicks: number
}

const urlSlugsSchema = new Schema({
    slug: String,
    fullUrl: String,
    isPrivate: Boolean,
    accessCode: String,
    clicks: Number
})

//Hide the document's field of __v, and have the other fields under the object name 'rest'
urlSlugsSchema.set('toJSON', {
    transform: (doc, { __v, ...rest }, options) => rest
})

export const Url = model<UrlSlugsDocument>('Url', urlSlugsSchema)