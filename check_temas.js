const fetch = require('node-fetch');

const API_BASE = 'https://proyecto-bd-juan.onrender.com/api';

async function checkEndpoints() {
  try {
    console.log('Checking GET /api/Topics...');
    const response1 = await fetch(`${API_BASE}/Topics`);
    console.log('Topics Status:', response1.status);

    console.log('Checking GET /api/Lecciones...');
    const response2 = await fetch(`${API_BASE}/Lecciones`);
    console.log('Lecciones Status:', response2.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Data length:', data.length);
      if (data.length > 0) {
        console.log('First item:', data[0]);
      }
    } else {
      console.log('Response text:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEndpoints();
