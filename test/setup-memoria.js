import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Sobe um MongoDB em memória ANTES de os arquivos de teste importarem o app.
 *
 * O src/database/db.js lê process.env.MONGODB_URI no momento do import.
 * Por isso este arquivo entra no Mocha via --require, e não dentro do describe.
 */
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
