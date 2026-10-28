const fs = require('fs');

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i+1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(current);
      lines.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    lines.push(row);
  }
  return lines;
}

const raw = fs.readFileSync('backend/data/destinasi_final.csv', 'utf8');
const rows = parseCSV(raw);
const header = rows[0];
const data = rows.slice(1).filter(r => r.length > 1);

console.log('Total destinations in CSV:', data.length);
const idIdx = header.indexOf('id');
const nameIdx = header.indexOf('nama_wisata');
const catIdx = header.indexOf('kategori');
const addrIdx = header.indexOf('alamat');
const imgIdx = header.indexOf('gambar');
const ratingIdx = header.indexOf('rating');
const descIdx = header.indexOf('deskripsi');
const ticketIdx = header.indexOf('harga_tiket');
const openIdx = header.indexOf('jam_buka');
const closeIdx = header.indexOf('jam_tutup');

const papuma = data.find(r => r[nameIdx].toLowerCase().includes('papuma'));
console.log('Papuma in CSV:', papuma ? { id: papuma[idIdx], name: papuma[nameIdx], img: papuma[imgIdx] } : 'Not found');

const teluk = data.find(r => r[nameIdx].toLowerCase().includes('teluk love'));
console.log('Teluk Love in CSV:', teluk ? { id: teluk[idIdx], name: teluk[nameIdx], img: teluk[imgIdx] } : 'Not found');

console.log('\nTop 8 records:');
data.slice(0, 8).forEach(r => {
  console.log(`ID ${r[idIdx]}: ${r[nameIdx]} [${r[catIdx]}] -> Image: ${r[imgIdx]}`);
});
