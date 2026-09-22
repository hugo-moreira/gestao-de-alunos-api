/**
 * EXERCÍCIO PRÁTICO - Teste de Disciplinas
 * 
 * Este arquivo é um exercício guiado para você praticar escrita de testes.
 * Siga os comentários e complete os testes marcados com TODO.
 */

import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import { autenticar, comToken, sufixoUnico } from './helpers/requisicoes.js';

describe('EXERCÍCIO: Testes de Disciplinas', () => {
  let tokenAdmin;
  
  // Este bloco roda UMA VEZ antes de todos os testes
  before(async () => {
    tokenAdmin = await autenticar(app, 'admin@escola.com', 'admin123');
  });
  
  // ========================================
  // EXEMPLO COMPLETO: Criar Disciplina
  // ========================================
  describe('POST /api/admin/disciplinas - EXEMPLO', () => {
    
    it('deve criar uma disciplina com sucesso', async () => {
      // ARRANGE: Preparar os dados
      const sufixo = sufixoUnico();
      const novaDisciplina = {
        nome: 'Banco de Dados',
        codigo: `BD${sufixo.slice(-6)}`,
        cargaHoraria: 80
      };
      
      // ACT: Executar a ação
      const resposta = await request(app)
        .post('/api/admin/disciplinas')
        .set(comToken(tokenAdmin))
        .send(novaDisciplina);
      
      // ASSERT: Verificar o resultado
      expect(resposta.status).to.equal(201);
      expect(resposta.body).to.have.property('id');
      expect(resposta.body.nome).to.equal('Banco de Dados');
      expect(resposta.body.codigo).to.equal(novaDisciplina.codigo);
      expect(resposta.body.cargaHoraria).to.equal(80);
    });
    
  });
  
  // ========================================
  // TODO 1: Listar Disciplinas
  // ========================================
  describe('GET /api/admin/disciplinas - EXERCÍCIO 1', () => {
    
    it('deve listar todas as disciplinas', async () => {
      // TODO: Complete este teste
      // Dica 1: Use request(app).get('/api/admin/disciplinas')
      // Dica 2: Não esqueça de adicionar o token com .set(comToken(tokenAdmin))
      // Dica 3: Verifique se status é 200
      // Dica 4: Verifique se resposta é um array
      // Dica 5: Verifique se o array tem pelo menos 1 disciplina
      
      const resposta = null; // SUBSTITUA null pela requisição
      
      // Descomente as linhas abaixo depois de fazer a requisição
      // expect(resposta.status).to.equal(200);
      // expect(resposta.body).to.be.an('array');
      // expect(resposta.body.length).to.be.greaterThan(0);
    });
    
  });
  
  // ========================================
  // TODO 2: Testar Erro - Código Duplicado
  // ========================================
  describe('POST /api/admin/disciplinas - EXERCÍCIO 2: Erro de Conflito', () => {
    
    it('deve retornar 409 ao tentar criar disciplina com código duplicado', async () => {
      // TODO: Complete este teste
      // Passo 1: Crie uma disciplina com código único
      // Passo 2: Tente criar outra disciplina com o MESMO código
      // Passo 3: Verifique que a segunda requisição retorna status 409
      
      const sufixo = sufixoUnico();
      const codigoUnico = `DUP${sufixo.slice(-6)}`;
      
      // Primeira disciplina
      const primeira = {
        nome: 'Primeira Disciplina',
        codigo: codigoUnico,
        cargaHoraria: 40
      };
      
      // TODO: Faça a primeira requisição aqui
      
      // Segunda disciplina (mesmo código!)
      const segunda = {
        nome: 'Segunda Disciplina',
        codigo: codigoUnico, // MESMO código da primeira
        cargaHoraria: 60
      };
      
      // TODO: Faça a segunda requisição aqui e guarde em 'respostaConflito'
      
      // Descomente depois de fazer as requisições
      // expect(respostaConflito.status).to.equal(409);
      // expect(respostaConflito.body).to.have.property('error');
    });
    
  });
  
  // ========================================
  // TODO 3: Testar Validação - Dados Inválidos
  // ========================================
  describe('POST /api/admin/disciplinas - EXERCÍCIO 3: Validação', () => {
    
    it('deve retornar 400 ao criar disciplina sem nome', async () => {
      // TODO: Complete este teste
      // Crie uma disciplina SEM o campo 'nome'
      // Verifique que retorna status 400
      
      const disciplinaInvalida = {
        // nome está faltando!
        codigo: `INV${sufixoUnico().slice(-6)}`,
        cargaHoraria: 40
      };
      
      // TODO: Faça a requisição aqui
      
      // Descomente depois de fazer a requisição
      // expect(resposta.status).to.equal(400);
    });
    
    it('deve retornar 400 ao criar disciplina com carga horária negativa', async () => {
      // TODO: Complete este teste sozinho!
      // Crie uma disciplina com cargaHoraria negativa (ex: -10)
      // Verifique que retorna 400
    });
    
  });
  
  // ========================================
  // TODO 4: Atualizar Disciplina
  // ========================================
  describe('PUT /api/admin/disciplinas/:id - EXERCÍCIO 4: Atualizar', () => {
    let disciplinaId;
    
    // Cria uma disciplina antes de cada teste
    beforeEach(async () => {
      const sufixo = sufixoUnico();
      const resposta = await request(app)
        .post('/api/admin/disciplinas')
        .set(comToken(tokenAdmin))
        .send({
          nome: 'Para Atualizar',
          codigo: `UPD${sufixo.slice(-6)}`,
          cargaHoraria: 40
        });
      disciplinaId = resposta.body.id;
    });
    
    it('deve atualizar o nome da disciplina', async () => {
      // TODO: Complete este teste
      // Use PUT /api/admin/disciplinas/:id
      // Atualize apenas o nome para "Nome Atualizado"
      // Verifique que retorna status 200 e o nome foi atualizado
      
      const dadosAtualizados = {
        nome: 'Nome Atualizado'
      };
      
      // TODO: Faça a requisição PUT aqui usando disciplinaId
      
      // Descomente depois
      // expect(resposta.status).to.equal(200);
      // expect(resposta.body.nome).to.equal('Nome Atualizado');
    });
    
  });
  
  // ========================================
  // TODO 5: Deletar Disciplina
  // ========================================
  describe('DELETE /api/admin/disciplinas/:id - EXERCÍCIO 5: Deletar', () => {
    
    it('deve deletar uma disciplina com sucesso', async () => {
      // TODO: Complete este teste
      // Passo 1: Crie uma disciplina
      // Passo 2: Delete a disciplina usando o ID retornado
      // Passo 3: Verifique que retorna status 204
      
      // Criar disciplina
      const sufixo = sufixoUnico();
      const resposta = await request(app)
        .post('/api/admin/disciplinas')
        .set(comToken(tokenAdmin))
        .send({
          nome: 'Para Deletar',
          codigo: `DEL${sufixo.slice(-6)}`,
          cargaHoraria: 40
        });
      
      const disciplinaId = resposta.body.id;
      
      // TODO: Faça a requisição DELETE aqui
      
      // Descomente depois
      // expect(respostaDeletar.status).to.equal(204);
    });
    
  });
  
  // ========================================
  // DESAFIO: Teste de Autorização
  // ========================================
  describe('DESAFIO: Autorização de Disciplinas', () => {
    
    it('deve retornar 403 quando aluno tentar criar disciplina', async () => {
      // DESAFIO: Complete este teste sozinho!
      // Passos:
      // 1. Faça login como aluno (ana.souza@example.com / 123456)
      // 2. Tente criar uma disciplina com o token do aluno
      // 3. Verifique que retorna 403 (Forbidden)
      
      // TODO: Seu código aqui
    });
    
    it('deve retornar 401 quando tentar criar disciplina sem token', async () => {
      // DESAFIO: Complete este teste sozinho!
      // Tente criar uma disciplina SEM adicionar o token
      // Deve retornar 401 (Unauthorized)
      
      // TODO: Seu código aqui
    });
    
  });
  
  // ========================================
  // BÔNUS: Teste de Fluxo Completo
  // ========================================
  describe('BÔNUS: Fluxo Completo de Disciplina', () => {
    
    it('deve criar, listar, atualizar e deletar disciplina', async () => {
      const sufixo = sufixoUnico();
      let disciplinaId;
      
      // Passo 1: Criar
      const criar = await request(app)
        .post('/api/admin/disciplinas')
        .set(comToken(tokenAdmin))
        .send({
          nome: 'Fluxo Completo',
          codigo: `FLX${sufixo.slice(-6)}`,
          cargaHoraria: 60
        });
      
      expect(criar.status).to.equal(201);
      disciplinaId = criar.body.id;
      
      // Passo 2: Listar e verificar que a disciplina existe
      // TODO: Complete este passo
      
      // Passo 3: Atualizar
      // TODO: Complete este passo
      
      // Passo 4: Deletar
      // TODO: Complete este passo
      
      // Passo 5: Verificar que foi deletada (deve retornar 404)
      // TODO: Complete este passo
    });
    
  });
  
});

/**
 * GABARITO E DICAS
 * ================
 * 
 * Exercício 1 - Listar:
 * const resposta = await request(app)
 *   .get('/api/admin/disciplinas')
 *   .set(comToken(tokenAdmin));
 * 
 * Exercício 2 - Conflito:
 * Fazer duas requisições POST com o mesmo 'codigo'
 * 
 * Exercício 3 - Validação:
 * Enviar objeto sem campos obrigatórios ou com valores inválidos
 * 
 * Exercício 4 - Atualizar:
 * await request(app)
 *   .put(`/api/admin/disciplinas/${disciplinaId}`)
 *   .set(comToken(tokenAdmin))
 *   .send({ nome: 'Novo Nome' });
 * 
 * Exercício 5 - Deletar:
 * await request(app)
 *   .delete(`/api/admin/disciplinas/${disciplinaId}`)
 *   .set(comToken(tokenAdmin));
 * 
 * Desafio - Autorização:
 * const tokenAluno = await autenticar(app, 'ana.souza@example.com', '123456');
 * await request(app).post('/...').set(comToken(tokenAluno)).send({...});
 */
