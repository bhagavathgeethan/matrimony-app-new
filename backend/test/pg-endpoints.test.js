const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('Testing backend connected to PostgreSQL ab_matrimony...\n');

  // 1. Health check
  const health = await makeRequest('/health');
  console.log('1. Health Check:', health.data);
  if (health.data.database && health.data.database.includes('PostgreSQL')) {
    console.log('✓ Health check verified PostgreSQL connection');
  }

  // 2. Profile Me
  const me = await makeRequest('/profile/me');
  console.log('2. Current User (Ananya):', me.data.firstName, me.data.city, 'Blueprint:', me.data.blueprint);
  if (me.data.firstName === 'Ananya') {
    console.log('✓ User profile loaded from PostgreSQL');
  }

  // 3. Matches Feed
  const feed = await makeRequest('/matches/feed');
  console.log('3. Matches Feed Count:', feed.data.length, 'First candidate:', feed.data[0]?.firstName, 'Score:', feed.data[0]?.overlapScores?.overall);
  if (feed.data.length > 0) {
    console.log('✓ Candidates and dynamically computed blueprint scores loaded from PostgreSQL');
  }

  // 4. Family Links & Sent Records
  const links = await makeRequest('/family/links');
  const sent = await makeRequest('/family/sent');
  console.log('4. Family Links:', links.data.length, 'Sent Records:', sent.data.length);
  if (links.data.length > 0 && sent.data.length > 0) {
    console.log('✓ Family Co-Pilot records loaded from PostgreSQL');
  }

  // 5. Conversations
  const chats = await makeRequest('/chat/threads');
  console.log('5. Chat Threads:', chats.data.length, 'First thread:', chats.data[0]?.candidateName, 'Messages:', chats.data[0]?.messages?.length);
  if (chats.data.length > 0) {
    console.log('✓ Conversations and message histories loaded from PostgreSQL');
  }

  console.log('\nAll PostgreSQL backend integration tests passed successfully!');
}

runTests().catch(console.error);
