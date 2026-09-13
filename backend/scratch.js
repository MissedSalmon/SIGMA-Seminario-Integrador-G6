async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigoActivo: 'AC-001',
        descripcion: 'Hace ruido de vuelta'
      })
    });
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
