const axios = require('axios');

async function check() {
  const url = 'https://proyecto-bd-juan.onrender.com/api/Auth/status';
  try {
    const res = await axios.get(url);
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error status:', err.response.status);
      console.log('Error data:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}

check();
