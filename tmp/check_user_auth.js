const fetch = require('node-fetch');

const API_BASE = 'https://proyecto-bd-juan.onrender.com/api';
const credentials = {
  email: 'JohnZ@gmail.com',
  password: 'Ma123456!'
};

async function getAuthData() {
  try {
    console.log('--- Iniciando Login ---');
    const loginRes = await fetch(`${API_BASE}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!loginRes.ok) {
      console.error('Error en Login:', loginRes.status, await loginRes.text());
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('Login exitoso. UserId:', userId);

    console.log('--- Obteniendo Filtros ---');
    const filterRes = await fetch(`${API_BASE}/Auth/user-filters/${userId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!filterRes.ok) {
      console.error('Error en Filtros:', filterRes.status, await filterRes.text());
      return;
    }

    const filterData = await filterRes.json();
    console.log('--- Respuesta Completa ---');
    console.log(JSON.stringify(filterData, null, 2));

  } catch (error) {
    console.error('Error de red/ejecución:', error);
  }
}

getAuthData();
