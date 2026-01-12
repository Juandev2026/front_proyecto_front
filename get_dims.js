const fs = require('fs');

const files = [
  'C:/Users/aitor/.gemini/antigravity/brain/6dc4d697-10da-4cde-b9b2-4e084daec0b0/uploaded_image_0_1768227402592.png',
  'C:/Users/aitor/.gemini/antigravity/brain/6dc4d697-10da-4cde-b9b2-4e084daec0b0/uploaded_image_1_1768227402592.png'
];

files.forEach(file => {
  try {
    const fd = fs.openSync(file, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    fs.closeSync(fd);

    // PNG signature is 8 bytes.
    // IHDR chunk starts at byte 8.
    // Length (4 bytes), Type (4 bytes "IHDR")
    // Width at byte 16 (4 bytes big endian)
    // Height at byte 20 (4 bytes big endian)
    
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buffer.readUInt32BE(0) === 0x89504E47 && buffer.readUInt32BE(4) === 0x0D0A1A0A) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        console.log(`${file}: ${width}x${height}`);
    } else {
        console.log(`${file}: Not a PNG`);
    }
  } catch (err) {
    console.error(`Error reading ${file}: ${err.message}`);
  }
});
