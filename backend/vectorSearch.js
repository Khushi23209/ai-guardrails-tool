const pool = require("./db");
const {getEmbedding} = require("./embedder");
async function searchChunks(query, topK = 10){
    const embedding = await getEmbedding(query);
    const embeddingstr = `[${embedding.join(',')}]`;
    const res = await pool.query(
        `SELECT id, doc_name, chunk_index, chunk_text, embedding <=> $1 AS distance
        FROM document_chunks
        ORDER BY distance
        LIMIT $2`,
        [embeddingstr, topK]
    );
   return res.rows
}
module.exports = {searchChunks}