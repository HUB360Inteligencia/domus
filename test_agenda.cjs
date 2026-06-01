const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=\"(.*?)\"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=\"(.*?)\"/);
const url = urlMatch ? urlMatch[1] : null;
const key = keyMatch ? keyMatch[1] : null;

if (url && key) {
  fetch(url + '/rest/v1/agenda_events?select=*', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  })
  .then(async res => {
    console.log('Status agenda_events:', res.status);
    const data = await res.json();
    console.log('agenda_events:', data);
  })
  .catch(console.error);
} else {
  console.log('No keys found');
}
