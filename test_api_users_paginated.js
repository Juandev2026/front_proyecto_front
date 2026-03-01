const https = require('https');

function checkUsers(page, pageSize) {
    const url = `https://proyecto-bd-juan.onrender.com/api/Users?page=${page}&pageSize=${pageSize}`;
    const token = '3231232141346';
    
    console.log('Fetching users from:', url);
    
    https.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }, (res) => {
        console.log('Status:', res.statusCode);
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('Result type:', typeof json, Array.isArray(json) ? 'Array' : 'Object');
                if (Array.isArray(json)) {
                    console.log('Array length:', json.length);
                } else {
                    console.log('Keys:', Object.keys(json));
                    if (json.data) console.log('data.length:', json.data.length);
                }
            } catch (e) {
                console.error('Error:', e.message);
                console.log('Raw:', data.substring(0, 200));
            }
        });
    });
}

checkUsers(1, 100);
