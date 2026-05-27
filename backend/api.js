const { addSession, getAuthUser, hashPassword, publicUser, verifyPassword } = require("./auth");
const { nextId, readDb, updateDb } = require("./database");
const { readBody, requireFields, sendError, sendJson } = require("./http");

function initials(name) {
  return String(name || "BC")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function memberForUser(user, db) {
  if (!user?.memberId) return null;
  return db.members.find((member) => member.id === user.memberId) || null;
}

function bootstrapPayload(db, auth) {
  const saved = new Set(auth?.user?.savedHackathons || []);
  return {
    user: publicUser(auth?.user),
    profile: memberForUser(auth?.user, db),
    skills: db.skills,
    members: db.members,
    teams: db.teams,
    hackathons: db.hackathons.map((hackathon) => ({ ...hackathon, saved: saved.has(hackathon.id) })),
    activity: db.activity,
    invitations: auth ? db.invitations.filter((invite) => invite.toUserId === auth.user.id || invite.fromUserId === auth.user.id) : [],
    applications: auth ? db.applications.filter((application) => application.userId === auth.user.id) : []
  };
}

function findById(items, id) {
  return items.find((item) => item.id === Number(id));
}

function sendAuthRequired(res) {
  sendError(res, 401, "Please log in to continue.");
}

async function handleApi(req, res, pathname, query) {
  try {
    const method = req.method;

    if (method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "BuildCrew API" });
      return true;
    }

    if (method === "GET" && pathname === "/api/bootstrap") {
      const db = readDb();
      sendJson(res, 200, bootstrapPayload(db, getAuthUser(req, db)));
      return true;
    }

    if (method === "POST" && pathname === "/api/auth/signup") {
      const body = await readBody(req);
      const missing = requireFields(body, ["name", "email", "password"]);
      if (missing.length) return sendError(res, 400, "Missing required fields.", missing);
      if (String(body.password).length < 8) return sendError(res, 400, "Password must be at least 8 characters.");

      const result = updateDb((db) => {
        const email = String(body.email).trim().toLowerCase();
        if (db.users.some((user) => user.email === email)) {
          return { duplicate: true };
        }

        const userId = nextId(db, "user");
        const user = {
          id: userId,
          name: String(body.name).trim(),
          email,
          passwordHash: hashPassword(String(body.password)),
          onboarded: false,
          memberId: null,
          savedHackathons: [1],
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
        const token = addSession(db, userId);
        return { token, user: publicUser(user) };
      });

      if (result.duplicate) return sendError(res, 409, "An account with this email already exists.");
      sendJson(res, 201, result);
      return true;
    }

    if (method === "POST" && pathname === "/api/auth/login") {
      const body = await readBody(req);
      const missing = requireFields(body, ["email", "password"]);
      if (missing.length) return sendError(res, 400, "Missing required fields.", missing);

      const result = updateDb((db) => {
        const user = db.users.find((item) => item.email === String(body.email).trim().toLowerCase());
        if (!user || !verifyPassword(String(body.password), user.passwordHash)) return null;
        return { token: addSession(db, user.id), user: publicUser(user), profile: memberForUser(user, db) };
      });

      if (!result) return sendError(res, 401, "Invalid email or password.");
      sendJson(res, 200, result);
      return true;
    }

    if (method === "POST" && pathname === "/api/auth/forgot-password") {
      const body = await readBody(req);
      const missing = requireFields(body, ["email"]);
      if (missing.length) return sendError(res, 400, "Email is required.", missing);

      const result = updateDb((db) => {
        const email = String(body.email).trim().toLowerCase();
        const otp = "123456";
        db.otps = db.otps.filter((item) => item.email !== email);
        db.otps.push({ email, otp, expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString() });
        return { ok: true, devOtp: otp };
      });
      sendJson(res, 200, result);
      return true;
    }

    if (method === "POST" && pathname === "/api/auth/verify-otp") {
      const body = await readBody(req);
      const missing = requireFields(body, ["email", "otp"]);
      if (missing.length) return sendError(res, 400, "Email and OTP are required.", missing);

      const result = updateDb((db) => {
        const email = String(body.email).trim().toLowerCase();
        const otp = db.otps.find((item) => item.email === email && item.otp === String(body.otp).trim());
        if (!otp || new Date(otp.expiresAt).getTime() < Date.now()) return { verified: false };
        db.otps = db.otps.filter((item) => item !== otp);
        return { verified: true };
      });

      if (!result.verified) return sendError(res, 400, "Invalid or expired OTP.");
      sendJson(res, 200, result);
      return true;
    }

    if (method === "POST" && pathname === "/api/auth/logout") {
      const db = readDb();
      const auth = getAuthUser(req, db);
      if (!auth) return sendJson(res, 200, { ok: true });
      updateDb((store) => {
        store.sessions = store.sessions.filter((session) => session.token !== auth.token);
      });
      sendJson(res, 200, { ok: true });
      return true;
    }

    if (method === "GET" && pathname === "/api/me") {
      const db = readDb();
      const auth = getAuthUser(req, db);
      if (!auth) return sendAuthRequired(res);
      sendJson(res, 200, { user: publicUser(auth.user), profile: memberForUser(auth.user, db) });
      return true;
    }

    if (method === "PUT" && pathname === "/api/me/onboarding") {
      const body = await readBody(req);
      const result = updateDb((db) => {
        const auth = getAuthUser(req, db);
        if (!auth) return { authRequired: true };

        const profile = body.profile || {};
        const skillNames = Array.isArray(profile.skills) ? profile.skills : [];
        const profileSkills = skillNames.map((skillName) => {
          const base = db.skills.find((skill) => skill.name === skillName) || { name: skillName, level: profile.experience || "Beginner", score: 52 };
          return { ...base, level: profile.experience || base.level };
        });
        const role = profile.role && profile.role !== "Other" ? `${profile.role} Builder` : "Student Builder";
        const member = {
          id: nextId(db, "member"),
          name: profile.name || auth.user.name,
          role,
          college: profile.college || "Student Campus",
          year: profile.year || "2027",
          avatar: initials(profile.name || auth.user.name),
          bio: `${profile.role || "Student"} builder looking to ${Array.isArray(profile.goals) ? profile.goals.join(", ").toLowerCase() : "ship great projects"}.`,
          availability: profile.availability || "Open to invites",
          match: 93,
          location: "Remote",
          skills: profileSkills.length ? profileSkills : db.skills.slice(0, 3),
          projects: ["BuildCrew profile"],
          achievements: ["Completed BuildCrew onboarding"],
          history: [],
          reviews: []
        };

        db.members.push(member);
        auth.user.name = member.name;
        auth.user.memberId = member.id;
        auth.user.onboarded = true;
        return { user: publicUser(auth.user), profile: member };
      });

      if (result.authRequired) return sendAuthRequired(res);
      sendJson(res, 200, result);
      return true;
    }

    if (method === "GET" && pathname === "/api/members") {
      const db = readDb();
      const q = String(query.get("q") || "").toLowerCase();
      const role = query.get("role") || "All";
      const skill = query.get("skill") || "All";
      const sort = query.get("sort") || "Best match";
      let members = db.members.filter((member) => {
        const skillMatch = skill === "All" || member.skills.some((item) => item.name === skill);
        const roleMatch = role === "All" || member.role.toLowerCase().includes(role.toLowerCase());
        const text = [member.name, member.role, member.college, member.location, ...member.skills.map((item) => item.name)].join(" ").toLowerCase();
        return skillMatch && roleMatch && (!q || text.includes(q));
      });
      if (sort === "Availability") members = members.sort((a, b) => a.availability.localeCompare(b.availability));
      if (sort === "Best match") members = members.sort((a, b) => b.match - a.match);
      sendJson(res, 200, { members });
      return true;
    }

    const memberMatch = pathname.match(/^\/api\/members\/(\d+)$/);
    if (method === "GET" && memberMatch) {
      const member = findById(readDb().members, memberMatch[1]);
      if (!member) return sendError(res, 404, "Member not found.");
      sendJson(res, 200, { member });
      return true;
    }

    if (method === "GET" && pathname === "/api/teams") {
      sendJson(res, 200, { teams: readDb().teams });
      return true;
    }

    if (method === "POST" && pathname === "/api/teams") {
      const body = await readBody(req);
      const result = updateDb((db) => {
        const auth = getAuthUser(req, db);
        if (!auth) return { authRequired: true };
        const missing = requireFields(body, ["name", "topic", "role", "capacity"]);
        if (missing.length) return { missing };
        const team = {
          id: nextId(db, "team"),
          name: String(body.name).trim(),
          status: "Recruiting",
          topic: String(body.topic).trim(),
          roles: [String(body.role).trim()],
          capacity: Math.max(2, Number(body.capacity) || 4),
          filled: 1,
          lead: auth.user.name,
          applicants: []
        };
        db.teams.unshift(team);
        db.activity.unshift(`${auth.user.name} created team ${team.name}.`);
        return { team };
      });
      if (result.authRequired) return sendAuthRequired(res);
      if (result.missing) return sendError(res, 400, "Missing required fields.", result.missing);
      sendJson(res, 201, result);
      return true;
    }

    const joinMatch = pathname.match(/^\/api\/teams\/(\d+)\/join$/);
    if (method === "POST" && joinMatch) {
      const result = updateDb((db) => {
        const auth = getAuthUser(req, db);
        if (!auth) return { authRequired: true };
        const team = findById(db.teams, joinMatch[1]);
        if (!team) return { notFound: true };
        if (!team.applicants.includes(auth.user.id)) team.applicants.push(auth.user.id);
        team.status = "Reviewing applicants";
        db.activity.unshift(`${auth.user.name} requested to join ${team.name}.`);
        return { team };
      });
      if (result.authRequired) return sendAuthRequired(res);
      if (result.notFound) return sendError(res, 404, "Team not found.");
      sendJson(res, 200, result);
      return true;
    }

    if (method === "POST" && pathname === "/api/invitations") {
      const body = await readBody(req);
      const result = updateDb((db) => {
        const auth = getAuthUser(req, db);
        if (!auth) return { authRequired: true };
        const invitation = {
          id: nextId(db, "invitation"),
          fromUserId: auth.user.id,
          to: String(body.to || body.member || "teammate").trim(),
          role: String(body.role || "Builder").trim(),
          status: "Pending",
          createdAt: new Date().toISOString()
        };
        db.invitations.unshift(invitation);
        db.activity.unshift(`${auth.user.name} sent an invite for ${invitation.role}.`);
        return { invitation };
      });
      if (result.authRequired) return sendAuthRequired(res);
      sendJson(res, 201, result);
      return true;
    }

    if (method === "GET" && pathname === "/api/hackathons") {
      const db = readDb();
      const auth = getAuthUser(req, db);
      const saved = new Set(auth?.user?.savedHackathons || []);
      sendJson(res, 200, { hackathons: db.hackathons.map((hackathon) => ({ ...hackathon, saved: saved.has(hackathon.id) })) });
      return true;
    }

    const saveHackMatch = pathname.match(/^\/api\/hackathons\/(\d+)\/save$/);
    if (method === "POST" && saveHackMatch) {
      const result = updateDb((db) => {
        const auth = getAuthUser(req, db);
        if (!auth) return { authRequired: true };
        const hackathon = findById(db.hackathons, saveHackMatch[1]);
        if (!hackathon) return { notFound: true };
        const saved = new Set(auth.user.savedHackathons || []);
        saved.has(hackathon.id) ? saved.delete(hackathon.id) : saved.add(hackathon.id);
        auth.user.savedHackathons = Array.from(saved);
        return { hackathon: { ...hackathon, saved: saved.has(hackathon.id) }, savedHackathons: auth.user.savedHackathons };
      });
      if (result.authRequired) return sendAuthRequired(res);
      if (result.notFound) return sendError(res, 404, "Hackathon not found.");
      sendJson(res, 200, result);
      return true;
    }

    const applyHackMatch = pathname.match(/^\/api\/hackathons\/(\d+)\/apply$/);
    if (method === "POST" && applyHackMatch) {
      const result = updateDb((db) => {
        const auth = getAuthUser(req, db);
        if (!auth) return { authRequired: true };
        const hackathon = findById(db.hackathons, applyHackMatch[1]);
        if (!hackathon) return { notFound: true };
        const application = {
          id: nextId(db, "application"),
          userId: auth.user.id,
          hackathonId: hackathon.id,
          status: "Draft started",
          createdAt: new Date().toISOString()
        };
        db.applications.unshift(application);
        db.activity.unshift(`${auth.user.name} started an application for ${hackathon.name}.`);
        return { application };
      });
      if (result.authRequired) return sendAuthRequired(res);
      if (result.notFound) return sendError(res, 404, "Hackathon not found.");
      sendJson(res, 201, result);
      return true;
    }

    return false;
  } catch (error) {
    sendError(res, 500, "Something went wrong on the server.", error.message);
    return true;
  }
}

module.exports = { handleApi };
