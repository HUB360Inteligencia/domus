const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=\"(.*?)\"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=\"(.*?)\"/);
const url = urlMatch ? urlMatch[1] : null;
const key = keyMatch ? keyMatch[1] : null;

if (url && key) {
  fetch(url + '/rest/v1/activities?select=*', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('Activities:', JSON.stringify(data, null, 2));
    fs.writeFileSync('activities.json', JSON.stringify(data, null, 2));
  })
  .catch(console.error);
} else {
  console.log('No keys found');
}
