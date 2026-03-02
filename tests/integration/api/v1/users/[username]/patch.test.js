import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      await orchestrator.createUser({
        username: "anonymous_user1",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/anonymous_user1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "anonymous_user2",
          }),
        },
      );
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        action: "Verifique se você possui as permissões necessárias.",
        message: "Você não possui permissão para realizar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With non-existent 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistentuser",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Usuário não encontrado.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "username1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "username2",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/username2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            username: "username1",
          }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With `user2` targeting `user1`", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "user3",
        }),
      });
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para realizar esta ação.",
        action: "Verifique se você possui as permissões necessárias.",
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@example.com",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@example.com",
      });

      const activatedUser2 = await orchestrator.activateUser(createdUser2.id);
      const sessionObject2 = await orchestrator.createSession(
        activatedUser2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            email: "email1@example.com",
          }),
        },
      );
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const uniqueUser1 = await orchestrator.createUser({
        username: "unique_user1",
      });
      const activatedUser = await orchestrator.activateUser(uniqueUser1.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/unique_user1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "unique_user2",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "unique_user2",
        email: uniqueUser1.email,
        password: responseBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const uniqueUser1 = await orchestrator.createUser({
        email: "unique_email1@example.com",
      });
      const activatedUser = await orchestrator.activateUser(uniqueUser1.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueUser1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "unique_email2@example.com",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: uniqueUser1.username,
        email: "unique_email2@example.com",
        password: responseBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const uniqueUser1 = await orchestrator.createUser({
        password: "newpassword1",
      });
      const activatedUser = await orchestrator.activateUser(uniqueUser1.id);
      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueUser1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newpassword2",
          }),
        },
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: uniqueUser1.username,
        email: uniqueUser1.email,
        password: responseBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(uniqueUser1.username);
      const correctPaswordMatch = await password.compare(
        "newpassword2",
        userInDatabase.password,
      );
      expect(correctPaswordMatch).toBe(true);

      const incorrectPaswordMatch = await password.compare(
        "newpassword1",
        userInDatabase.password,
      );
      expect(incorrectPaswordMatch).toBe(false);
    });
  });
});
