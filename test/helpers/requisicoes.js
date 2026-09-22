/**
 * Funções auxiliares dos testes de API (Gestão de Alunos).
 *
 * Este é o único documento de docstring das funções criadas para os testes.
 * Cada função descreve o que faz, os argumentos e o valor de retorno.
 */

import request from 'supertest';
import { expect } from 'chai';

/**
 * Envia POST /api/auth/login e devolve o token JWT.
 *
 * O que faz:
 *   Autentica um usuário (admin ou aluno) na API. Sem o token, as rotas
 *   protegidas respondem 401. O header Authorization usa o formato
 *   "Bearer <token>".
 *
 * Argumentos:
 *   @param {import('express').Express} app - Aplicação Express importada de src/app.js.
 *     O Supertest usa o app em memória: não precisa subir o servidor na porta 3000.
 *   @param {string} email - E-mail cadastrado (ex.: admin@escola.com).
 *   @param {string} senha - Senha em texto puro do usuário.
 *
 * Retorno:
 *   @returns {Promise<string>} Token JWT (string). Lança AssertionError se o login
 *     não retornar status 200 ou se o corpo não tiver a propriedade token.
 *
 * Exemplo:
 *   const token = await autenticar(app, 'admin@escola.com', 'admin123');
 */
export async function autenticar(app, email, senha) {
  const resposta = await request(app).post('/api/auth/login').send({ email, senha });

  expect(resposta.status).to.equal(200);
  expect(resposta.body).to.have.property('token');

  return resposta.body.token;
}

/**
 * Monta o header HTTP Authorization no formato exigido pela API.
 *
 * O que faz:
 *   Concatena "Bearer " com o token JWT. Todas as rotas /api/admin e /api/alunos
 *   leem esse header no middleware authenticate.js.
 *
 * Argumentos:
 *   @param {string} token - JWT obtido em autenticar() ou no corpo de POST /api/auth/login.
 *
 * Retorno:
 *   @returns {{ Authorization: string }} Objeto de headers pronto para .set(headers)
 *     do Supertest.
 *
 * Exemplo:
 *   request(app).get('/api/admin/alunos').set(comToken(tokenAdmin));
 */
export function comToken(token) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Gera um sufixo único para e-mail, matrícula e código de disciplina.
 *
 * O que faz:
 *   Evita conflito 409 (e-mail/matrícula/código já existentes) quando o teste
 *   roda várias vezes contra o mesmo MongoDB. Usa timestamp + número aleatório.
 *
 * Argumentos:
 *   Nenhum.
 *
 * Retorno:
 *   @returns {string} Sufixo curto, por exemplo "1725490000123a4b".
 */
export function sufixoUnico() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
