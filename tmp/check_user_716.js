const axios = require('axios');

const API_BASE = 'https://proyecto-bd-juan.onrender.com/api';
const credentials = {
  email: 'JohnZ@gmail.com',
  password: 'Ma123456!'
};

async function getAuthData() {
  try {
    console.log('--- Iniciando Login ---');
    const loginRes = await axios.post(`${API_BASE}/Auth/login`, credentials);
    const token = loginRes.data.token;
    console.log('Login exitoso.');

    const targetUserId = 716;
    console.log(`--- Obteniendo Filtros para Usuario ID: ${targetUserId} ---`);
    const filterRes = await axios.get(`${API_BASE}/Auth/user-filters/${targetUserId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('--- Respuesta Completa ---');
    console.log(JSON.stringify(filterRes.data, null, 2));

  } catch (error) {
    if (error.response) {
       console.error('Error de API:', error.response.status, error.response.data);
    } else {
       console.error('Error de ejecución:', error.message);
    }
  }
}

getAuthData();
