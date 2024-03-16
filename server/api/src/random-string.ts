//Generate a random string that's used as an acces code, more from https://dev.to/oyetoket/fastest-way-to-generate-random-strings-in-javascript-2k5a
export const generateRandomString = (length: number) => {
    return Math.random().toString(20).substr(2, length)
}