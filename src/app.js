(function () {
  const data = window.BuildCrewData;
  const app = document.querySelector("#app");

  const state = {
    screen: "signup",
    authed: false,
    onboarded: false,
    active: "dashboard",
    selectedMemberId: 1,
    loading: false,
    toast: "",
    modal: null,
    filters: { q: "", role: "All", skill: "All", sort: "Best match" },
    onboardingStep: 0,
    onboarding: {
      name: "",
      photo: "",
      college: "",
      year: "",
      role: "",
      skills: [],
      experience: "",
      availability: "",
      goals: []
    },
    savedHackathons: new Set(data.hackathons.filter((h) => h.saved).map((h) => h.id))
  };

  const navItems = [
    ["dashboard", "Dashboard", "BD"],
    ["members", "Members", "ME"],
    ["teams", "Teams", "TM"],
    ["hackathons", "Hacks", "HK"],
    ["profile", "Profile", "PR"]
  ];

  const onboardingSteps = [
    { title: "Create your student identity", subtitle: "Start with the basics your future teammates will recognize." },
    { title: "Add your academic context", subtitle: "College and graduation year help teams plan schedules and eligibility." },
    { title: "Choose your primary role", subtitle: "Pick the seat you most want to own during a build sprint." },
    { title: "Select your credible skills", subtitle: "These power teammate matching, team invites, and badge recommendations." },
    { title: "Set your experience level", subtitle: "Honest signals build better teams than inflated profiles." },
    { title: "Share your availability", subtitle: "Let teams know when you can actually ship." },
    { title: "Choose your goals", subtitle: "BuildCrew will tune recommendations around what you want next." }
  ];

  function setState(patch) {
    Object.assign(state, patch);
    render();
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toast(message) {
    state.toast = message;
    render();
    window.setTimeout(() => {
      state.toast = "";
      render();
    }, 2400);
  }

  function validate(form) {
    let valid = true;
    form.querySelectorAll("[data-required]").forEach((input) => {
      const error = form.querySelector(`[data-error-for="${input.name}"]`);
      const isEmail = input.dataset.email === "true";
      const failed = !input.value.trim() || (isEmail && !input.value.includes("@"));
      if (error) error.textContent = failed ? input.dataset.message || "This field is required." : "";
      input.setAttribute("aria-invalid", failed ? "true" : "false");
      valid = valid && !failed;
    });
    return valid;
  }

  function authShell(kind) {
    const config = {
      signup: {
        title: "Build your crew before the clock starts.",
        heading: "Create your account",
        copy: "Find credible teammates, form balanced hackathon teams, and turn your student profile into proof of work.",
        cta: "Create account",
        alt: "Already have an account?",
        altAction: "Log in",
        altScreen: "login"
      },
      login: {
        title: "Get back to your build network.",
        heading: "Welcome back",
        copy: "Pick up pending invites, team applications, and member matches from where you left off.",
        cta: "Log in",
        alt: "New to BuildCrew?",
        altAction: "Create account",
        altScreen: "signup"
      },
      forgot: {
        title: "Reset fast, then get back to shipping.",
        heading: "Reset password",
        copy: "Enter your student email and we will send a secure verification code.",
        cta: "Send OTP",
        alt: "Remembered it?",
        altAction: "Log in",
        altScreen: "login"
      },
      otp: {
        title: "Verify your email to unlock teammate matching.",
        heading: "Email verification",
        copy: "Use the one-time code from your inbox. For this prototype, any 6 digits work.",
        cta: "Verify email",
        alt: "Used wrong email?",
        altAction: "Start over",
        altScreen: "signup"
      }
    }[kind];

    return `
      <main class="auth-shell">
        <section class="auth-visual" aria-label="BuildCrew collaboration preview">
          <div class="brand"><span class="brand-mark">BC</span> BuildCrew</div>
          <div class="auth-copy">
            <span class="eyebrow">Student team network</span>
            <h1>${config.title}</h1>
            <p>${config.copy}</p>
          </div>
          <div class="pill-row">
            <span class="pill">Skill badges</span>
            <span class="pill">Team capacity</span>
            <span class="pill">Hackathon tracking</span>
          </div>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            <div class="brand"><span class="brand-mark">BC</span> BuildCrew</div>
            <h2>${config.heading}</h2>
            <p class="muted">${config.copy}</p>
            ${authForm(kind, config)}
          </div>
        </section>
      </main>
    `;
  }

  function authForm(kind, config) {
    const nameField =
      kind === "signup"
        ? field("Full name", "name", "text", "Aarav Mehta", "Your name helps teammates recognize you.")
        : "";
    const passwordField =
      kind === "forgot"
        ? ""
        : field("Password", "password", "password", "Minimum 8 characters", "Password is required.");
    const otpField =
      kind === "otp"
        ? field("Verification code", "otp", "text", "123456", "Enter the 6 digit code.")
        : "";
    const emailField = kind === "otp" ? "" : field("Student email", "email", "email", "you@college.edu", "Use a valid email.");
    return `
      <form class="form" data-auth="${kind}" novalidate>
        ${nameField}
        ${emailField}
        ${passwordField}
        ${otpField}
        <button class="button primary" type="submit">${config.cta}</button>
        <div class="link-row">
          <span class="muted">${config.alt}</span>
          <button class="button ghost" type="button" data-screen="${config.altScreen}">${config.altAction}</button>
        </div>
        ${
          kind === "login"
            ? '<button class="button ghost" type="button" data-screen="forgot">Forgot password?</button>'
            : ""
        }
      </form>
    `;
  }

  function field(label, name, type, placeholder, message) {
    const attrs = type === "email" ? 'type="text" inputmode="email" autocomplete="email" data-email="true"' : `type="${type}"`;
    return `
      <div class="field">
        <label for="${name}">${label}</label>
        <input class="input" id="${name}" name="${name}" ${attrs} placeholder="${placeholder}" data-required data-message="${message}" />
        <span class="error-text" data-error-for="${name}"></span>
      </div>
    `;
  }

  function onboarding() {
    const step = onboardingSteps[state.onboardingStep];
    const pct = ((state.onboardingStep + 1) / onboardingSteps.length) * 100;
    return `
      <main class="onboarding">
        <section class="card onboarding-card">
          <div class="brand"><span class="brand-mark">BC</span> BuildCrew</div>
          <div class="progress" aria-label="Onboarding progress"><span style="width:${pct}%"></span></div>
          <p class="muted">Step ${state.onboardingStep + 1} of ${onboardingSteps.length}</p>
          <h1>${step.title}</h1>
          <p class="muted">${step.subtitle}</p>
          <form class="form" data-onboarding novalidate>
            ${onboardingStep()}
            <div class="link-row">
              <button class="button secondary" type="button" data-back ${state.onboardingStep === 0 ? "disabled" : ""}>Back</button>
              <button class="button primary" type="submit">${state.onboardingStep === onboardingSteps.length - 1 ? "Finish profile" : "Continue"}</button>
            </div>
          </form>
        </section>
      </main>
    `;
  }

  function onboardingStep() {
    const roleChoices = ["Frontend", "Backend", "UI/UX", "ML", "Product", "Other"];
    const levels = ["Beginner", "Intermediate", "Advanced", "Expert"];
    const availability = ["Weeknights", "Weekends", "Full hackathon", "Async only"];
    const goals = ["Win hackathons", "Find long-term team", "Build portfolio", "Learn by shipping", "Meet founders", "Practice pitching"];

    if (state.onboardingStep === 0) {
      return `
        ${field("Name", "onboardName", "text", "Your full name", "Name is required.")}
        <div class="field">
          <label for="photo">Profile photo</label>
          <input class="input" id="photo" name="photo" type="file" accept="image/*" />
          <span class="muted">A clear face photo increases invite acceptance.</span>
        </div>
      `;
    }
    if (state.onboardingStep === 1) {
      return `
        ${field("College / University", "college", "text", "Your campus", "College is required.")}
        ${field("Graduation year", "year", "text", "2027", "Graduation year is required.")}
      `;
    }
    if (state.onboardingStep === 2) return choiceGrid(roleChoices, state.onboarding.role, "role", false);
    if (state.onboardingStep === 3) return choiceGrid(data.skills.map((s) => s.name), state.onboarding.skills, "skills", true);
    if (state.onboardingStep === 4) return choiceGrid(levels, state.onboarding.experience, "experience", false);
    if (state.onboardingStep === 5) return choiceGrid(availability, state.onboarding.availability, "availability", false);
    return choiceGrid(goals, state.onboarding.goals, "goals", true);
  }

  function choiceGrid(items, selected, key, multi) {
    return `
      <div class="option-grid" data-choice-grid="${key}" data-multi="${multi}">
        ${items
          .map((item) => {
            const isSelected = Array.isArray(selected) ? selected.includes(item) : selected === item;
            return `<button class="choice ${isSelected ? "selected" : ""}" type="button" data-choice="${item}">
              ${item}
              <small>${multi ? "Tap to toggle" : "Best fit"}</small>
            </button>`;
          })
          .join("")}
      </div>
      <span class="error-text" data-choice-error></span>
    `;
  }

  function appShell() {
    return `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand"><span class="brand-mark">BC</span> BuildCrew</div>
          <nav class="nav">${navButtons()}</nav>
          <div class="card pad">
            <h3>Profile completion</h3>
            <div class="match">
              <div class="link-row"><span class="muted">86% complete</span><strong>+14%</strong></div>
              <div class="meter"><span style="width:86%"></span></div>
            </div>
          </div>
        </aside>
        <main class="content">
          ${topbar()}
          ${route()}
        </main>
        <nav class="mobile-nav">${navButtons(true)}</nav>
      </div>
      ${modal()}
      <div class="toast ${state.toast ? "show" : ""}" role="status">${escapeHTML(state.toast)}</div>
    `;
  }

  function navButtons(mobile) {
    return navItems
      .map(
        ([id, label, icon]) => `
          <button class="${state.active === id ? "active" : ""}" data-nav="${id}" aria-label="${label}">
            <span>${icon}</span>${mobile ? "" : label}
          </button>
        `
      )
      .join("");
  }

  function topbar() {
    return `
      <header class="topbar">
        <div class="page-title">
          <h1>${pageTitle()}</h1>
          <p>${pageSubtitle()}</p>
        </div>
        <div class="searchbar">
          <input class="input" data-global-search placeholder="Search teammates, skills, teams" value="${escapeHTML(state.filters.q)}" />
        </div>
      </header>
    `;
  }

  function pageTitle() {
    return {
      dashboard: "Build your next winning team",
      members: "Explore members",
      teams: "Teams",
      hackathons: "Hackathons",
      profile: "Student profile"
    }[state.active];
  }

  function pageSubtitle() {
    return {
      dashboard: "Today" + "'" + "s matches, invites, applications, and skill opportunities in one focused view.",
      members: "Search student builders by role, skill strength, availability, and collaboration fit.",
      teams: "Create, join, and manage hackathon teams with clear roles and capacity.",
      hackathons: "Browse events, save opportunities, and track applications as a team.",
      profile: "A credibility-first profile built around proof of work and skill badges."
    }[state.active];
  }

  function route() {
    if (state.loading) return loadingView();
    if (state.active === "members") return membersView();
    if (state.active === "teams") return teamsView();
    if (state.active === "hackathons") return hackathonsView();
    if (state.active === "profile") return profileView(getSelectedMember());
    return dashboardView();
  }

  function loadingView() {
    return `<section class="grid three">${[1, 2, 3]
      .map(() => `<div class="card pad skeleton"><span></span><span></span><span style="width:60%"></span></div>`)
      .join("")}</section>`;
  }

  function dashboardView() {
    return `
      <section class="dashboard-grid">
        <div class="grid">
          <section class="card pad">
            <div class="section-head">
              <div><h2>Recommended teammates</h2><p class="muted">Ranked by skill overlap, availability, and goals.</p></div>
              <button class="button secondary" data-nav="members">View all</button>
            </div>
            <div class="grid two">${data.members.slice(0, 2).map(memberCard).join("")}</div>
          </section>
          <section class="card pad">
            <div class="section-head"><h2>Suggested hackathons</h2><button class="button secondary" data-nav="hackathons">Browse</button></div>
            <div class="grid three">${data.hackathons.map(hackathonCard).join("")}</div>
          </section>
        </div>
        <aside class="grid">
          ${profileCompletion()}
          ${pendingInvites()}
          ${skillRecommendations()}
          ${recentActivity()}
        </aside>
      </section>
    `;
  }

  function profileCompletion() {
    return `
      <section class="card pad">
        <div class="section-head"><h2>Profile completion</h2><span class="pill ok">86%</span></div>
        <div class="match"><div class="meter"><span style="width:86%"></span></div></div>
        <p class="muted">Add two project links and one review to improve invite trust.</p>
        <button class="button primary" data-nav="profile">Improve profile</button>
      </section>
    `;
  }

  function pendingInvites() {
    return `
      <section class="card pad">
        <div class="section-head"><h2>Pending invitations</h2><span class="pill warn">3</span></div>
        <div class="timeline">
          <div class="timeline-item"><span class="dot"></span><span>SignalForge wants a Frontend teammate for HackNova.</span></div>
          <div class="timeline-item"><span class="dot"></span><span>ZeroQueue requested your UI review for demo day.</span></div>
        </div>
      </section>
    `;
  }

  function skillRecommendations() {
    return `
      <section class="card pad">
        <div class="section-head"><h2>Skill recommendations</h2></div>
        <div class="pill-row">
          <span class="pill">TypeScript</span>
          <span class="pill">Pitching</span>
          <span class="pill">APIs</span>
        </div>
        <p class="muted">These skills appear in 68% of teams matching your goals.</p>
      </section>
    `;
  }

  function recentActivity() {
    return `
      <section class="card pad">
        <div class="section-head"><h2>Recent activity</h2></div>
        <div class="timeline">${data.activity.map((item) => `<div class="timeline-item"><span class="dot"></span><span>${item}</span></div>`).join("")}</div>
      </section>
    `;
  }

  function membersView() {
    const filtered = getFilteredMembers();
    return `
      <section>
        <div class="filters">
          <input class="input" data-filter="q" placeholder="Search by name, college, skill" value="${escapeHTML(state.filters.q)}" />
          <select class="select" data-filter="role">${options(["All", "Frontend", "Backend", "UI/UX", "ML", "Product"], state.filters.role)}</select>
          <select class="select" data-filter="skill">${options(["All", ...data.skills.map((s) => s.name)], state.filters.skill)}</select>
          <select class="select" data-filter="sort">${options(["Best match", "Availability", "Experience"], state.filters.sort)}</select>
        </div>
        ${
          filtered.length
            ? `<div class="grid three">${filtered.map(memberCard).join("")}</div>`
            : `<div class="empty"><div><h2>No members found</h2><p>Try a broader skill or role filter.</p></div></div>`
        }
      </section>
    `;
  }

  function getFilteredMembers() {
    const q = state.filters.q.toLowerCase();
    let members = data.members.filter((member) => {
      const skillMatch = state.filters.skill === "All" || member.skills.some((s) => s.name === state.filters.skill);
      const roleMatch = state.filters.role === "All" || member.role.toLowerCase().includes(state.filters.role.toLowerCase());
      const qMatch =
        !q ||
        [member.name, member.role, member.college, member.location, ...member.skills.map((s) => s.name)]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return skillMatch && roleMatch && qMatch;
    });
    if (state.filters.sort === "Availability") members = members.sort((a, b) => a.availability.localeCompare(b.availability));
    if (state.filters.sort === "Best match") members = members.sort((a, b) => b.match - a.match);
    return members;
  }

  function options(items, selected) {
    return items.map((item) => `<option ${item === selected ? "selected" : ""}>${item}</option>`).join("");
  }

  function memberCard(member) {
    return `
      <article class="card member-card">
        <div class="member-head">
          <div class="avatar">${member.avatar}</div>
          <div>
            <h3>${member.name}</h3>
            <p class="muted">${member.role} at ${member.college}</p>
          </div>
        </div>
        <p class="muted">${member.bio}</p>
        <div class="match">
          <div class="link-row"><strong>${member.match}% match</strong><span class="pill ok">${member.availability}</span></div>
          <div class="meter"><span style="width:${member.match}%"></span></div>
        </div>
        <div class="pill-row">${member.skills.slice(0, 3).map(skillBadge).join("")}</div>
        <div class="link-row">
          <button class="button secondary" data-profile="${member.id}">View profile</button>
          <button class="button primary" data-invite="${member.name}">Invite</button>
        </div>
      </article>
    `;
  }

  function skillBadge(skill) {
    const initials = skill.name
      .split(/[^A-Za-z]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return `
      <span class="badge" data-level="${skill.level}">
        <span class="badge-medal">${initials}</span>
        <span><strong>${skill.name}</strong><small>${skill.level} · ${skill.score}</small></span>
      </span>
    `;
  }

  function profileView(member) {
    return `
      <section class="grid">
        <div class="card profile-hero">
          <div class="avatar large">${member.avatar}</div>
          <div>
            <h2>${member.name}</h2>
            <p class="muted">${member.role} · ${member.college} · Class of ${member.year}</p>
            <p>${member.bio}</p>
            <div class="pill-row"><span class="pill ok">${member.availability}</span><span class="pill">${member.location}</span><span class="pill">${member.match}% team fit</span></div>
          </div>
          <button class="button primary" data-invite="${member.name}">Invite to team</button>
        </div>
        <div class="stat-row">
          <div class="stat"><strong>12</strong><span class="muted">Projects</span></div>
          <div class="stat"><strong>7</strong><span class="muted">Hackathons</span></div>
          <div class="stat"><strong>18</strong><span class="muted">Endorsements</span></div>
          <div class="stat"><strong>4.9</strong><span class="muted">Reviews</span></div>
        </div>
        <div class="grid two">
          <section class="card pad"><div class="section-head"><h2>Skill badges</h2></div><div class="pill-row">${member.skills.map(skillBadge).join("")}</div></section>
          <section class="card pad"><div class="section-head"><h2>Social links</h2></div><div class="pill-row"><span class="pill">GitHub</span><span class="pill">LinkedIn</span><span class="pill">Portfolio</span><span class="pill">Devpost</span></div></section>
          ${listPanel("Projects", member.projects)}
          ${listPanel("Achievements", member.achievements)}
          ${listPanel("Hackathon history", member.history)}
          ${listPanel("Reviews", member.reviews)}
        </div>
      </section>
    `;
  }

  function listPanel(title, items) {
    return `<section class="card pad"><div class="section-head"><h2>${title}</h2></div><div class="timeline">${items
      .map((item) => `<div class="timeline-item"><span class="dot"></span><span>${item}</span></div>`)
      .join("")}</div></section>`;
  }

  function teamsView() {
    return `
      <section class="grid">
        <div class="section-head">
          <div><h2>Active team board</h2><p class="muted">Clear roles, capacity, and current recruiting status.</p></div>
          <button class="button primary" data-modal="team">Create team</button>
        </div>
        <div class="grid three">${data.teams.map(teamCard).join("")}</div>
      </section>
    `;
  }

  function teamCard(team) {
    return `
      <article class="card team-card">
        <div class="team-title"><div><h3>${team.name}</h3><p class="muted">Led by ${team.lead}</p></div><span class="pill ok">${team.status}</span></div>
        <p>${team.topic}</p>
        <div class="pill-row">${team.roles.map((role) => `<span class="pill">${role}</span>`).join("")}</div>
        <div>
          <div class="link-row"><strong>Capacity</strong><span class="muted">${team.filled}/${team.capacity}</span></div>
          <div class="capacity">${Array.from({ length: team.capacity }, (_, i) => `<span class="seat ${i < team.filled ? "full" : ""}"></span>`).join("")}</div>
        </div>
        <div class="link-row"><button class="button secondary" data-join="${team.name}">Join team</button><button class="button primary" data-modal="invite">Invite members</button></div>
      </article>
    `;
  }

  function hackathonsView() {
    return `
      <section class="grid">
        <div class="section-head">
          <div><h2>Hackathon pipeline</h2><p class="muted">Save events, apply as a team, and track application readiness.</p></div>
          <button class="button secondary" data-empty-demo>Show empty state</button>
        </div>
        <div class="grid three">${data.hackathons.map(hackathonCard).join("")}</div>
        <section class="card pad">
          <div class="section-head"><h2>Application tracking</h2><span class="pill warn">2 active</span></div>
          <div class="timeline">
            <div class="timeline-item"><span class="dot"></span><span>HackNova: team profile submitted, project idea pending.</span></div>
            <div class="timeline-item"><span class="dot"></span><span>Campus Build Sprint: awaiting teammate confirmation.</span></div>
          </div>
        </section>
      </section>
    `;
  }

  function hackathonCard(hack) {
    const saved = state.savedHackathons.has(hack.id);
    return `
      <article class="card hack-card">
        <div class="team-title"><div><h3>${hack.name}</h3><p class="muted">${hack.date} · ${hack.mode}</p></div><span class="pill">${hack.prize}</span></div>
        <div class="pill-row">${hack.tracks.map((track) => `<span class="pill">${track}</span>`).join("")}</div>
        <p class="muted">${hack.status}</p>
        <div class="link-row">
          <button class="button secondary" data-save-hack="${hack.id}">${saved ? "Saved" : "Save"}</button>
          <button class="button primary" data-apply="${hack.name}">Apply as team</button>
        </div>
      </article>
    `;
  }

  function getSelectedMember() {
    return data.members.find((member) => member.id === state.selectedMemberId) || data.members[0];
  }

  function modal() {
    if (!state.modal) return '<div class="modal" aria-hidden="true"></div>';
    const content = {
      team: `
        <h2>Create team</h2>
        <p class="muted">Define the mission, roles, and capacity before inviting teammates.</p>
        <form class="form" data-modal-form="team">
          ${field("Team name", "teamName", "text", "SignalForge", "Team name is required.")}
          <div class="field"><label for="mission">Mission</label><textarea class="textarea" id="mission" name="mission" data-required data-message="Mission is required." placeholder="What are you building?"></textarea><span class="error-text" data-error-for="mission"></span></div>
          <div class="grid two">${field("Needed role", "neededRole", "text", "Frontend", "Role is required.")}${field("Capacity", "capacity", "text", "4", "Capacity is required.")}</div>
          <div class="link-row"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Create team</button></div>
        </form>
      `,
      invite: `
        <h2>Invite members</h2>
        <p class="muted">Send a focused invite with role context and availability expectations.</p>
        <form class="form" data-modal-form="invite">
          ${field("Member email or profile", "member", "text", "maya@college.edu", "Member is required.")}
          ${field("Role", "inviteRole", "text", "ML Builder", "Role is required.")}
          <div class="link-row"><button class="button secondary" type="button" data-close-modal>Cancel</button><button class="button primary" type="submit">Send invite</button></div>
        </form>
      `
    }[state.modal];
    return `<div class="modal open" role="dialog" aria-modal="true"><div class="modal-card">${content}</div></div>`;
  }

  function bindEvents() {
    app.querySelectorAll("[data-screen]").forEach((button) => {
      button.addEventListener("click", () => setState({ screen: button.dataset.screen }));
    });

    app.querySelectorAll("[data-auth]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validate(form)) return;
        const kind = form.dataset.auth;
        if (kind === "forgot") return setState({ screen: "otp" });
        if (kind === "otp") {
          toast("Email verified successfully.");
          return setState({ screen: "signup" });
        }
        setState({ authed: true, screen: "onboarding" });
      });
    });

    app.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        state.loading = true;
        state.active = button.dataset.nav;
        render();
        window.setTimeout(() => setState({ loading: false }), 280);
      });
    });

    app.querySelectorAll("[data-profile]").forEach((button) => {
      button.addEventListener("click", () => setState({ active: "profile", selectedMemberId: Number(button.dataset.profile) }));
    });

    app.querySelectorAll("[data-invite]").forEach((button) => {
      button.addEventListener("click", () => toast(`Invite sent to ${button.dataset.invite}.`));
    });

    app.querySelectorAll("[data-join]").forEach((button) => {
      button.addEventListener("click", () => toast(`Join request sent to ${button.dataset.join}.`));
    });

    app.querySelectorAll("[data-apply]").forEach((button) => {
      button.addEventListener("click", () => toast(`Team application started for ${button.dataset.apply}.`));
    });

    app.querySelectorAll("[data-save-hack]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.saveHack);
        state.savedHackathons.has(id) ? state.savedHackathons.delete(id) : state.savedHackathons.add(id);
        toast(state.savedHackathons.has(id) ? "Hackathon saved." : "Hackathon removed from saved.");
        render();
      });
    });

    app.querySelectorAll("[data-filter]").forEach((input) => {
      input.addEventListener("input", () => {
        state.filters[input.dataset.filter] = input.value;
        render();
      });
    });

    const globalSearch = app.querySelector("[data-global-search]");
    if (globalSearch) {
      globalSearch.addEventListener("input", () => {
        state.filters.q = globalSearch.value;
      });
      globalSearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") setState({ active: "members" });
      });
    }

    app.querySelectorAll("[data-modal]").forEach((button) => {
      button.addEventListener("click", () => setState({ modal: button.dataset.modal }));
    });

    app.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => setState({ modal: null }));
    });

    app.querySelectorAll("[data-modal-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validate(form)) return;
        const action = form.dataset.modalForm === "team" ? "Team created and opened for applicants." : "Invite sent.";
        setState({ modal: null });
        toast(action);
      });
    });

    const onboardingForm = app.querySelector("[data-onboarding]");
    if (onboardingForm) {
      onboardingForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateOnboarding(onboardingForm)) return;
        if (state.onboardingStep === onboardingSteps.length - 1) {
          setState({ onboarded: true, screen: "app", active: "dashboard" });
          toast("Profile completed. Welcome to BuildCrew.");
        } else {
          setState({ onboardingStep: state.onboardingStep + 1 });
        }
      });
    }

    const back = app.querySelector("[data-back]");
    if (back) back.addEventListener("click", () => setState({ onboardingStep: Math.max(0, state.onboardingStep - 1) }));

    app.querySelectorAll("[data-choice-grid]").forEach((grid) => {
      grid.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-choice]");
        if (!choice) return;
        const key = grid.dataset.choiceGrid;
        const value = choice.dataset.choice;
        if (grid.dataset.multi === "true") {
          const current = new Set(state.onboarding[key]);
          current.has(value) ? current.delete(value) : current.add(value);
          state.onboarding[key] = Array.from(current);
        } else {
          state.onboarding[key] = value;
        }
        render();
      });
    });

    app.querySelector("[data-empty-demo]")?.addEventListener("click", () => {
      app.querySelector(".grid.three").innerHTML = '<div class="empty"><div><h2>No saved hackathons yet</h2><p>Save events to build an application pipeline.</p></div></div>';
    });
  }

  function validateOnboarding(form) {
    if (!validate(form)) return false;
    const step = state.onboardingStep;
    const choiceError = form.querySelector("[data-choice-error]");
    const key = ["", "", "role", "skills", "experience", "availability", "goals"][step];
    if (!key) return true;
    const value = state.onboarding[key];
    const valid = Array.isArray(value) ? value.length > 0 : Boolean(value);
    if (choiceError) choiceError.textContent = valid ? "" : "Choose at least one option to continue.";
    return valid;
  }

  function render() {
    app.className = "app";
    if (!state.authed || ["signup", "login", "forgot", "otp"].includes(state.screen)) {
      app.innerHTML = authShell(state.screen);
    } else if (!state.onboarded || state.screen === "onboarding") {
      app.innerHTML = onboarding();
    } else {
      app.innerHTML = appShell();
    }
    bindEvents();
  }

  render();
})();
