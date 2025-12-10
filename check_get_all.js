const fetch = require('node-fetch');

const API_BASE = 'https://proyecto-bd-juan.onrender.com/api';

const TOKEN = '3231232141346';
const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function checkGetAll() {
  try {
    console.log('Checking GET /api/Cursos...');
    const response = await fetch(`${API_BASE}/Cursos`, { headers });
    if (response.ok) {
      const data = await response.json();
      console.log('Count:', data.length);
      if (data.length > 0) {
        // Find the course with ID 6 (from user's log)
        const course = data.find(c => c.id === 6);
        if (course) {
          console.log('Course 6 topics:', course.temas);
        } else {
          console.log('Course 6 not found in list.');
          console.log('First course topics:', data[0].temas);
        }
      }
    } else {
      console.log('Error:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkGetAll();
