const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir);
}

// Export schema
console.log('Exporting database schema...');
exec('pg_dump --schema-only --no-owner --no-privileges -h localhost -U postgres writify > ./db/exports/schema.sql', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error exporting schema: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Schema export stderr: ${stderr}`);
    return;
  }
  console.log('Schema exported successfully.');
});

// Export data
console.log('Exporting database data...');
exec('pg_dump --data-only --no-owner --no-privileges -h localhost -U postgres writify > ./db/exports/data.sql', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error exporting data: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Data export stderr: ${stderr}`);
    return;
  }
  console.log('Data exported successfully.');
});

// Note: You may need to modify the database name (writify) and username (postgres) to match your configuration
console.log('You will likely be prompted for your PostgreSQL password.');
