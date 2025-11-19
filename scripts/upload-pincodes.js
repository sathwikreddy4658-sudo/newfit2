import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const filePath = path.join(__dirname, '../shipneer pincodes.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Total pincodes: ${data.length}`);
console.log('Sample data:');
console.log(data.slice(0, 5));

// Export as JSON for inspection
const outputPath = path.join(__dirname, '../pincodes-data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log(`\nData exported to ${outputPath}`);

// Show column names
if (data.length > 0) {
  console.log('\nColumn names:', Object.keys(data[0]));
}
