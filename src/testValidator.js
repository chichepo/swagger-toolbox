const fs = require('fs');
const path = require('path');
const PreProcValidatDict = require('./PreProcValidateDict');

// 1. Load your dictionary swagger (main)
const dictJson = require('../data/petStoreExample.json');

// 2. Load the host swagger docs
const hostsData = [
  {
    key: 'x-origin-host1',
    url: 'https://swaggerhub.dev.com/MyDom/Pet/1.0.0',
    json: require('../data/pet.json')
  },
  {
    key: 'x-origin-host2',
    url: 'https://swaggerhub.dev.com/MyDom/Store/1.0.0',
    json: require('../data/store.json')
  }
];

// 3. Simulate serverVariablesData from dictionary variable keys
const serverVariablesData = {
  'smf-pet.smf': require('../data/pet.json'),
  'hbs-store.hbs': require('../data/store.json')  
};

async function runValidation() {
  const validator = new PreProcValidatDict('debug-user');

  const result = await validator.validate(dictJson, hostsData, serverVariablesData);

  if (result.isErr) {
    console.error("❌ Validation failed:");
    console.table(result.errors || []);
    if (result.errorMsg) console.error("❗ Message:", result.errorMsg);
  } else {
    console.log("✅ All x-mapper-host paths validated successfully.");
  }
}

runValidation();
