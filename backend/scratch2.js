import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/tipos-activos');
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
