const { exec } = require("node:child_process");

let dotCount = 0;

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      dotCount = (dotCount + 1) % 4;
      process.stdout.write(
        "🔴 Aguardando o Postgres aceitar conexões" + ".".repeat(dotCount),
      );
      setTimeout(checkPostgres, 800);
      return;
    }
    console.log("\n\n🟢 Postgres está pronto e aceitando conexões!");
  }
}

process.stdout.write("\n🔴 Aguardando o Postgres aceitar conexões");
checkPostgres();
