const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const Fuse = require('fuse.js');

const app = express();
const PORT = 3000; // এখানে সরাসরি 3000 হার্ডকোড করে দিলাম

let medicines = [];
let fuse = null;

// Load CSV data
fs.createReadStream('med.csv')
  .pipe(csv())
  .on('data', (data) => medicines.push(data))
  .on('end', () => {
    console.log('CSV loaded');

    // Initialize Fuse.js
    fuse = new Fuse(medicines, {
      keys: ['Medicine Name', 'Full name', 'Manufactur By'], // যদি চাইলে আরও কী যোগ করতে পারো
      threshold: 0.4
    });
  })
  .on('error', (err) => {
    console.error('Error loading CSV:', err);
  });

// Search endpoint
app.get('/', (req, res) => {
  const query = req.query.med;

  if (!query) {
    return res.send('Please provide a medicine name with ?med=');
  }

  if (!fuse) {
    return res.status(503).send('Server is still loading data. Please try again later.');
  }

  const results = fuse.search(query);

  // Filter empty fields
  const formattedResults = results.map(r => {
    const item = r.item;
    const cleanedItem = {};
    for (const key in item) {
      if (item[key] && item[key].trim() !== '') {
        cleanedItem[key] = item[key];
      }
    }
    return cleanedItem;
  });

  if (formattedResults.length === 0) {
    return res.status(404).send('No matching medicine found.');
  }

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(formattedResults, null, 2));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});