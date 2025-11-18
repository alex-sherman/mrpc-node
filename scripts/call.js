import MRPC from "../src/mrpc.js";

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let value = process.argv.slice(2)[1];
value = value && JSON.parse(value);
let mrpc = new MRPC();
console.log(await mrpc.call(process.argv.slice(2)[0], value));
await sleep(1200);
console.log(await mrpc.call(process.argv.slice(2)[0], value));
// process.exit(0);
