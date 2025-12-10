const fetch = require('node-fetch');

const API_URL = 'https://liderdocente-api-4.onrender.com/api/Noticias';
const TOKEN = '3231232141346';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function checkApi() {
  try {
    console.log('Fetching all news...');
    const response = await fetch(API_URL, { headers });
    if (!response.ok) {
      console.error('Error fetching all news:', response.status, response.statusText);
    } else {
      const news = await response.json();
      console.log(`Found ${news.length} news items.`);
      const ids = news.map(n => n.id);
      console.log('IDs:', ids);
      
      const exists = ids.includes(3);
      console.log('ID 3 exists in list:', exists);
    }

    console.log('\nFetching news ID 3 directly...');
    const response3 = await fetch(`${API_URL}/3`, { headers });
    if (response3.ok) {
      const item = await response3.json();
      console.log('Item 3 found:', item);
    } else {
      console.error('Error fetching item 3:', response3.status, response3.statusText);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkApi();
