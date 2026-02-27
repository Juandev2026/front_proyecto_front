const checkCatalog = async () => {
  const token = '3231232141346';
  try {
    const response = await fetch('https://proyecto-bd-juan.onrender.com/api/Examenes/grouped-simple', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    console.log('--- Catalog ---');
    data.forEach(t => {
      console.log(`Type: ${t.tipoExamenId} (${typeof t.tipoExamenId}) - Name: ${t.tipoExamenNombre}`);
    });
  } catch (e) {
    console.error(e);
  }
};

checkCatalog();
