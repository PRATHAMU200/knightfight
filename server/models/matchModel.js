const pool = require("./db");

async function createMatch() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const matchResult = await client.query(
      `INSERT INTO matches DEFAULT VALUES RETURNING id, unique_match_id`
    );
    const matchId = matchResult.rows[0].id;
    const uniqueMatchId = matchResult.rows[0].unique_match_id;

    // Create unique links for white, black, spectator
    const roles = ["white", "black", "spectator"];
    const roleInsertPromises = roles.map((role) => {
      return client.query(
        `INSERT INTO match_roles (match_id, role, link_id, can_play, can_spectate)
         VALUES ($1, $2, gen_random_uuid(), $3, $4) RETURNING role, link_id`,
        [matchId, role, role !== "spectator", true]
      );
    });

    const roleResults = await Promise.all(roleInsertPromises);

    await client.query("COMMIT");
    return { matchId, uniqueMatchId, roles: roleResults.map((r) => r.rows[0]) };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { createMatch };
