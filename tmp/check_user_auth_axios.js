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

    if (loginRes.status !== 200) {
      console.error('Error en Login:', loginRes.status, loginRes.data);
      return;
    }

    const loginData = loginRes.data;
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('Login exitoso. UserId:', userId);

    console.log('--- Obteniendo Filtros ---');
    const filterRes = await axios.get(`${API_BASE}/Auth/user-filters/${userId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    if (filterRes.status !== 200) {
      console.error('Error en Filtros:', filterRes.status, filterRes.data);
      return;
    }

    const filterData = filterRes.data;
    console.log('--- Respuesta Completa ---');
    console.log(JSON.stringify(filterData, null, 2));

  } catch (error) {
    if (error.response) {
       console.error('Error de API:', error.response.status, error.response.data);
    } else {
       console.error('Error de ejecución:', error.message);
    }
  }
}

getAuthData();
