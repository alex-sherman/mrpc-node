import MRPC from "./mrpc.js"

console.log(await (new MRPC()).Call(process.argv.slice(2)[0], JSON.parse(process.argv.slice(2)[1])))