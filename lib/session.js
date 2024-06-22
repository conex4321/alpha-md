const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sleep } = require('../lib');

async function fetchSession(sessionId, folderPath = 'session') {
    try {
        let decodedData;
      if (sessionId   ){ const apiUrl = 'https://serverdb.vercel.app/restore';
        const requestData = {
            id: sessionId
        };
        const response = await axios.post(apiUrl, requestData);
        if (response.status === 200 && response.data.success) {
            const encodedData = response.data.content;
            decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
            const filePath = path.join(__dirname, '..', folderPath, 'creds.json');
            fs.writeFileSync(filePath, decodedData);
            console.log(`Session fetched successfully.`);
            await sleep(5000);
        } else {
            console.error(`Failed to fetch session: ${response.data.message}`);
        }}else{
            
        }
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

module.exports = fetchSession;
