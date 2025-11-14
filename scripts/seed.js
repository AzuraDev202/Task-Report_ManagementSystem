const fetch = require('node-fetch');

async function seedData() {
  try {
    const response = await fetch('http://localhost:3000/api/seed');
    const data = await response.json();
    console.log('Seed result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData();
