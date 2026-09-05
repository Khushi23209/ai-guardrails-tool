require('dotenv').config();
const fs = require("fs");
const path = require('path');
const pool = require('./db');
const { chunkText } = require('./chunker');
const { getEmbedding } = require('./embedder');

async function ingestDocuments() {
    const folderPath = path.join(__dirname, 'reference-docs');
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const chunks = chunkText(content);

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await getEmbedding(chunks[i]);
            const embeddingStr = `[${embedding.join(',')}]`;

            await pool.query(
                `INSERT INTO document_chunks (doc_name, chunk_index, chunk_text, embedding) VALUES ($1, $2, $3, $4)`,
                [file, i, chunks[i], embeddingStr]
            );

            console.log(`Ingested chunk ${i + 1} of ${chunks.length} from ${file}`);
        }
    }
    console.log("Ingestion complete.");
}

ingestDocuments()
    .then(() => { console.log("Done"); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });