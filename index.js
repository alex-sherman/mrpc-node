import MRPC from "./mrpc.js";

let mrpc = new MRPC();
try {
  let result = await mrpc.Call("*.light");
  console.log(result);
} catch (error) {
  console.log(error);
}
