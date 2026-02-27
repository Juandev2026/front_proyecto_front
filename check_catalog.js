const fetch = require('node-fetch');

async function checkCatalog() {
  const token = '3231232141346';
  const response = await fetch('https://proyecto-bd-juan.onrender.com/api/Examenes/grouped-simple', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  console.log('--- Catalog ---');
  data.forEach(t => {
    console.log(`Type: ${t.tipoExamenId} - ${t.tipoExamenNombre}`);
  });
}

checkCatalog();
