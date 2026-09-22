/**
 * Script para subir o servidor em modo dev com MongoDB em memória.
 * 
 * Uso: node src/dev-memoria.js
 * 
 * Este script:
 * 1. Cria uma instância do MongoMemoryServer
 * 2. Define a variável MONGODB_URI para a URI do banco em memória
 * 3. Importa e inicia o servidor
 * 
 * Útil para desenvolvimento quando não há MongoDB instalado localmente.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

console.log('Iniciando MongoDB em memória...');
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();

// Importa o app depois de definir a variável de ambiente
await import('./server.js');
