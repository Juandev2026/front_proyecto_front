const fetch = require('node-fetch');

const API_BASE = 'https://liderdocente-api-4.onrender.com/api';
const COURSE_ID = 6; // Using the ID from the user's log

async function checkNestedEndpoint() {
  try {
    console.log(`Checking GET /api/Cursos/${COURSE_ID}/Temas...`);
    const response = await fetch(`${API_BASE}/Cursos/${COURSE_ID}/Temas`);
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Data:', data);
    } else {
      console.log('Response text:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNestedEndpoint();
