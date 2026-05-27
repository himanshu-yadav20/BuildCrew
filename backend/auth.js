const crypto = require("crypto");

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, expected] = stored.split(":");
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    onboarded: Boolean(user.onboarded),
    memberId: user.memberId,
    savedHackathons: user.savedHackathons || []
  };
}

function getAuthUser(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  const session = db.sessions.find((item) => item.token === token);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;

  const user = db.users.find((item) => item.id === session.userId);
  return user ? { user, token } : null;
}

function addSession(db, userId) {
  const token = createToken();
  db.sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
  });
  return token;
}

module.exports = {
  addSession,
  getAuthUser,
  hashPassword,
  publicUser,
  verifyPassword
};
