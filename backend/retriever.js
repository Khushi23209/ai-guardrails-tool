const {rerankResults} = require("./reranker")
const {searchChunks} = require("./vectorSearch")
async function retrieve(query, topK = 5){
    const chunks = await searchChunks(query, 10);
    const res = await rerankResults(query,chunks);
    const rankres = res.slice(0, topK);
    return rankres
}
module.exports = { retrieve };