import email from "infra/email.js";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("Email infrastructure", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "teste <teste@example.com>",
      to: "contato@curso.dev",
      subject: "Teste de envio de email",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "teste <teste@example.com>",
      to: "contato@curso.dev",
      subject: "Teste de envio de email 2",
      text: "Último corpo enviado.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<teste@example.com>");
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail.subject).toBe("Teste de envio de email 2");
    expect(lastEmail.text).toBe("Último corpo enviado.\r\n");
  });
});
