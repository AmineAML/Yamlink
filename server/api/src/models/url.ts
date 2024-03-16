import { Schema, model, Document } from 'mongoose'

interface UrlDocument extends Document {
    slug: string,
    fullUrl: string,
    isPrivate: boolean,
    accessCode: string,
    clicks: number
}

const urlSchema = new Schema({
    slug: String,
    fullUrl: String,
    isPrivate: Boolean,
    accessCode: String,
    clicks: Number
}, {
    timestamps: true
})

//Hide the document's field of __v, and have the other fields under the object name 'rest'
urlSchema.set('toJSON', {
    transform: (doc, { __v, ...rest }, options) => rest
})

export const Url = model<UrlDocument>('Url', urlSchema)