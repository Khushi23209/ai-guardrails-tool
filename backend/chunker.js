function chunkText(text, chunkSize = 250, overlap = 50) {
    const chunks = [];
    let position = 0;
    
    while (position < text.length) {
        const chunk = text.slice(position, position + chunkSize).trim();
        chunks.push(chunk);
        position += (chunkSize - overlap);
    }
    
    return chunks;
}

module.exports = { chunkText };
