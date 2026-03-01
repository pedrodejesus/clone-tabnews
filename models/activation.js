import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneValidById(tokenId) {
  const activationTokenObject = await runSelectQuery(tokenId);
  return activationTokenObject;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
        ;
      `,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Token de ativação utilizado não encontrado ou expirou.",
        action: "Faça um novo cadastro.",
      });
    }

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Sistema <test@example.com>",
    to: user.email,
    subject: "Ative seu cadastro!",
    text: `Olá ${user.username}, clique no link abaixo para ativar sua conta:

${webserver.origin}/signup/activate/${activationToken.id}`,
  });
}

const activation = {
  create,
  findOneValidById,
  sendEmailToUser,
};

export default activation;
