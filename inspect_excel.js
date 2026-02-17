
const XLSX = require('xlsx');
const wb = XLSX.readFile('E:\\repo\\gauhati_cooperative_data.xlsx');

wb.SheetNames.forEach(name => {
    console.log(`\n--- Sheet: ${name} ---`);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name]);
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
});
