const https = require('https');

function checkUsers() {
    const url = 'https://proyecto-bd-juan.onrender.com/api/Users';
    const token = '3231232141346';
    
    https.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const users = JSON.parse(data);
                console.log('Total users:', users.length);
                
                const validUsers = users.filter(user => {
                    const isPremium =
                      user.role?.toUpperCase() === 'PREMIUM' ||
                      user.role?.toUpperCase() === 'DOCENTE' ||
                      (user.fechaExpiracion && user.fechaExpiracion !== '-');
                    
                    if (isPremium) return false;
                    return true;
                });
                
                console.log('Users after initial filter (isPremium):', validUsers.length);
                
                if (validUsers.length > 0) {
                    const badUsers = validUsers.filter(u => !u.nombreCompleto || !u.email);
                    console.log('Users missing nombreCompleto or email:', badUsers.length);
                    if (badUsers.length > 0) {
                        console.log('Sample bad user:', JSON.stringify(badUsers[0], null, 2));
                    }
                    
                    console.log('Sample valid user:', JSON.stringify(validUsers[0], null, 2));
                }
            } catch (e) {
                console.error('Error:', e.message);
            }
        });
    });
}

checkUsers();
