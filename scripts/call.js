import MRPC from "../src/mrpc.js";

let value = process.argv.slice(2)[1];
value = value && JSON.parse(value);
let mrpc = new MRPC();
console.log(await mrpc.call(process.argv.slice(2)[0], value));
process.exit(0);
