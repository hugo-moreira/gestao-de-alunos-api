import request from 'supertest';
import { expect } from 'chai';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import app from '../src/app.js';
import { autenticar, comToken, sufixoUnico } from './helpers/requisicoes.js';

// Carregar dados do arquivo JSON (Data-Driven Testing)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dadosTeste = JSON.parse(readFileSync(join(__dirname, 'data', 'teste-dados.json'), 'utf-8'));

/**
 * Teste de fluxo (várias operações na mesma jornada).
 *
 * Diferente do auth.test.js, aqui um único cenário encadeia:
 * login admin → cria aluno → cria disciplina → matricula → lança nota →
 * login aluno → consulta → entrega trabalho → admin corrige → limpa os dados.
 *
 * Os ids criados pela API são UUID. Guardamos cada id na variável `contexto`
 * para usar na próxima requisição (isso simula o que um cliente real faria).
 *
 * Os dados usados nos testes são carregados de test/data/teste-dados.json
 */
describe('Fluxo de gestão escolar (várias operações)', () => {
  const contexto = {
    tokenAdmin: null,
    tokenAluno: null,
    alunoId: null,
    disciplinaId: null,
    notaId: null,
    trabalhoId: null,
  };

  const unico = sufixoUnico();
  // Dados carregados do arquivo JSON (Data-Driven Testing)
  const alunoNovo = {
    ...dadosTeste.alunos[0],
    email: `diego.teste.${unico}@example.com`,
    matricula: `T${unico}`,
  };
  const disciplinaNova = {
    ...dadosTeste.disciplinas[0],
    codigo: `ALG${unico.slice(-6)}`,
  };

  after(async () => {
    await mongoose.connection.close();
  });

  it('deve percorrer o ciclo completo: cadastro, matrícula, nota, trabalho e correção', async () => {
    // ------------------------------------------------------------------
    // Passo 1 — Login como administrador
    // Endpoint público. Sem este token, POST /api/admin/* responde 401.
    // Credenciais carregadas do arquivo JSON
    // ------------------------------------------------------------------
    contexto.tokenAdmin = await autenticar(app, dadosTeste.admin.email, dadosTeste.admin.senha);
    expect(contexto.tokenAdmin).to.be.a('string').that.is.not.empty;

    // ------------------------------------------------------------------
    // Passo 2 — Admin cadastra um aluno novo
    // Status esperado: 201. A senha não volta no JSON (sanitizeAluno).
    // ------------------------------------------------------------------
    const criarAluno = await request(app)
      .post('/api/admin/alunos')
      .set(comToken(contexto.tokenAdmin))
      .send(alunoNovo);

    expect(criarAluno.status).to.equal(201);
    expect(criarAluno.body).to.include({
      nome: alunoNovo.nome,
      email: alunoNovo.email,
      matricula: alunoNovo.matricula,
    });
    expect(criarAluno.body).to.have.property('id');
    expect(criarAluno.body).to.not.have.property('senha');
    contexto.alunoId = criarAluno.body.id;

    // ------------------------------------------------------------------
    // Passo 3 — Admin cadastra uma disciplina nova
    // Status esperado: 201. codigo precisa ser único no banco.
    // ------------------------------------------------------------------
    const criarDisciplina = await request(app)
      .post('/api/admin/disciplinas')
      .set(comToken(contexto.tokenAdmin))
      .send(disciplinaNova);

    expect(criarDisciplina.status).to.equal(201);
    expect(criarDisciplina.body).to.include({
      nome: disciplinaNova.nome,
      codigo: disciplinaNova.codigo,
      cargaHoraria: disciplinaNova.cargaHoraria,
    });
    contexto.disciplinaId = criarDisciplina.body.id;

    // ------------------------------------------------------------------
    // Passo 4 — Admin matricula o aluno na disciplina
    // Sem matrícula, lançar nota ou entregar trabalho retorna 409.
    // ------------------------------------------------------------------
    const matricular = await request(app)
      .post(`/api/admin/disciplinas/${contexto.disciplinaId}/matriculas`)
      .set(comToken(contexto.tokenAdmin))
      .send({ alunoId: contexto.alunoId });

    expect(matricular.status).to.equal(201);
    expect(matricular.body).to.include({
      alunoId: contexto.alunoId,
      disciplinaId: contexto.disciplinaId,
    });

    // ------------------------------------------------------------------
    // Passo 5 — Confirma que o aluno aparece na lista da disciplina
    // ------------------------------------------------------------------
    const alunosDaDisciplina = await request(app)
      .get(`/api/admin/disciplinas/${contexto.disciplinaId}/alunos`)
      .set(comToken(contexto.tokenAdmin));

    expect(alunosDaDisciplina.status).to.equal(200);
    expect(alunosDaDisciplina.body).to.be.an('array');
    const idsMatriculados = alunosDaDisciplina.body.map((aluno) => aluno.id);
    expect(idsMatriculados).to.include(contexto.alunoId);

    // ------------------------------------------------------------------
    // Passo 6 — Admin lança uma nota (tipo prova, valor 0 a 10)
    // Dados da nota carregados do arquivo JSON
    // ------------------------------------------------------------------
    const lancarNota = await request(app)
      .post('/api/admin/notas')
      .set(comToken(contexto.tokenAdmin))
      .send({
        alunoId: contexto.alunoId,
        disciplinaId: contexto.disciplinaId,
        ...dadosTeste.notas[0],
      });

    expect(lancarNota.status).to.equal(201);
    expect(lancarNota.body.valor).to.equal(dadosTeste.notas[0].valor);
    expect(lancarNota.body.tipo).to.equal(dadosTeste.notas[0].tipo);
    contexto.notaId = lancarNota.body.id;

    // ------------------------------------------------------------------
    // Passo 7 — Login como o aluno recém-criado
    // O token do aluno só acessa /api/alunos/:seuProprioId/*
    // ------------------------------------------------------------------
    contexto.tokenAluno = await autenticar(app, alunoNovo.email, alunoNovo.senha);

    // ------------------------------------------------------------------
    // Passo 8 — Aluno consulta as próprias disciplinas
    // Deve conter a disciplina em que acabamos de matricular.
    // ------------------------------------------------------------------
    const minhasDisciplinas = await request(app)
      .get(`/api/alunos/${contexto.alunoId}/disciplinas`)
      .set(comToken(contexto.tokenAluno));

    expect(minhasDisciplinas.status).to.equal(200);
    const idsDisciplinas = minhasDisciplinas.body.map((d) => d.id);
    expect(idsDisciplinas).to.include(contexto.disciplinaId);

    // ------------------------------------------------------------------
    // Passo 9 — Aluno consulta as próprias notas
    // ------------------------------------------------------------------
    const minhasNotas = await request(app)
      .get(`/api/alunos/${contexto.alunoId}/notas`)
      .set(comToken(contexto.tokenAluno));

    expect(minhasNotas.status).to.equal(200);
    const idsNotas = minhasNotas.body.map((n) => n.id);
    expect(idsNotas).to.include(contexto.notaId);

    // ------------------------------------------------------------------
    // Passo 10 — Aluno registra (entrega) um trabalho
    // Status inicial do trabalho na API é "entregue".
    // Dados do trabalho carregados do arquivo JSON
    // ------------------------------------------------------------------
    const registrarTrabalho = await request(app)
      .post(`/api/alunos/${contexto.alunoId}/trabalhos`)
      .set(comToken(contexto.tokenAluno))
      .send({
        disciplinaId: contexto.disciplinaId,
        ...dadosTeste.trabalhos[0],
      });

    expect(registrarTrabalho.status).to.equal(201);
    expect(registrarTrabalho.body.status).to.equal('entregue');
    expect(registrarTrabalho.body.titulo).to.equal(dadosTeste.trabalhos[0].titulo);
    contexto.trabalhoId = registrarTrabalho.body.id;

    // ------------------------------------------------------------------
    // Passo 11 — Admin corrige o trabalho (status + nota + feedback)
    // ------------------------------------------------------------------
    const corrigir = await request(app)
      .put(`/api/admin/trabalhos/${contexto.trabalhoId}`)
      .set(comToken(contexto.tokenAdmin))
      .send({
        status: 'corrigido',
        nota: 9,
        feedback: 'Bom trabalho.',
      });

    expect(corrigir.status).to.equal(200);
    expect(corrigir.body.status).to.equal('corrigido');
    expect(corrigir.body.nota).to.equal(9);
    expect(corrigir.body.feedback).to.equal('Bom trabalho.');

    // ------------------------------------------------------------------
    // Passo 12 — Aluno confere o trabalho já corrigido
    // ------------------------------------------------------------------
    const meusTrabalhos = await request(app)
      .get(`/api/alunos/${contexto.alunoId}/trabalhos`)
      .set(comToken(contexto.tokenAluno));

    expect(meusTrabalhos.status).to.equal(200);
    const trabalhoCorrigido = meusTrabalhos.body.find((t) => t.id === contexto.trabalhoId);
    expect(trabalhoCorrigido).to.exist;
    expect(trabalhoCorrigido.status).to.equal('corrigido');
    expect(trabalhoCorrigido.nota).to.equal(9);

    // ------------------------------------------------------------------
    // Passo 13 — Limpeza: remove o que este teste criou
    // Evita encher o MongoDB a cada execução (o banco é compartilhado).
    // ------------------------------------------------------------------
    const apagarTrabalho = await request(app)
      .delete(`/api/admin/trabalhos/${contexto.trabalhoId}`)
      .set(comToken(contexto.tokenAdmin));
    expect(apagarTrabalho.status).to.equal(204);

    const apagarNota = await request(app)
      .delete(`/api/admin/notas/${contexto.notaId}`)
      .set(comToken(contexto.tokenAdmin));
    expect(apagarNota.status).to.equal(204);

    const apagarAluno = await request(app)
      .delete(`/api/admin/alunos/${contexto.alunoId}`)
      .set(comToken(contexto.tokenAdmin));
    expect(apagarAluno.status).to.equal(204);

    const apagarDisciplina = await request(app)
      .delete(`/api/admin/disciplinas/${contexto.disciplinaId}`)
      .set(comToken(contexto.tokenAdmin));
    expect(apagarDisciplina.status).to.equal(204);
  });
});
