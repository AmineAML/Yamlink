import dns from 'dns'
import { NotFound } from '../errors'

let originalUrl: URL
let anotherOriginalUrl: string

export const validateUrl = async (fullUrl: string) => {
    try {
        //Url are etiher https://www.example.com or www.example.com
        //originalUrl = new URL(fullUrl || fullUrl)
        originalUrl = new URL(fullUrl)
      } catch (err) {
        //throw new BadRequest('Invalid URL')
        anotherOriginalUrl = fullUrl
    }

    async function lookupPromise(){
        return new Promise((resolve, reject) => {
            if (anotherOriginalUrl) {
                dns.lookup(anotherOriginalUrl, (err, address, family) => {
                    if(err) reject(err);
                    resolve(address);
                });
            } else {
                dns.lookup(originalUrl!.hostname, (err, address, family) => {
                    if(err) reject(err);
                    resolve(address);
                });
            }
       });
    };
    
    try{
        //const address = await lookupPromise();
        await lookupPromise()
    }catch(err){
        //console.error(err);
        throw new NotFound('Address not found')
    }
    
    /*if (anotherOriginalUrl) {
        dns.lookup(anotherOriginalUrl, (err) => {
            if (err) {
                throw new NotFound('Address not found')
            }
        })
    } else {
        dns.lookup((originalUrl!.hostname), (err) => {
            if (err) {
                throw new NotFound('Address not found')
            }
        })
    }
    */
}