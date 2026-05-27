const skills = [
  { name: "HTML", level: "Advanced", score: 86 },
  { name: "CSS", level: "Expert", score: 94 },
  { name: "JavaScript", level: "Advanced", score: 88 },
  { name: "Python", level: "Intermediate", score: 72 },
  { name: "React", level: "Advanced", score: 84 },
  { name: "UI/UX", level: "Expert", score: 92 },
  { name: "Leadership", level: "Intermediate", score: 76 },
  { name: "ML", level: "Beginner", score: 46 },
  { name: "Node.js", level: "Intermediate", score: 70 },
  { name: "Product", level: "Advanced", score: 82 }
];

const members = [
  {
    id: 1,
    name: "Aarav Mehta",
    role: "Frontend Engineer",
    college: "IIT Bombay",
    year: "2027",
    avatar: "AM",
    bio: "Design-minded React developer who turns fuzzy hackathon ideas into polished interfaces fast.",
    availability: "Available this week",
    match: 96,
    location: "Mumbai",
    skills: [
      { name: "React", level: "Advanced", score: 88 },
      { name: "CSS", level: "Expert", score: 94 },
      { name: "JavaScript", level: "Advanced", score: 86 },
      { name: "Leadership", level: "Intermediate", score: 74 }
    ],
    projects: ["CampusKart", "Devfolio ResumeKit", "Carbon Sprint"],
    achievements: ["Top 5 at HackNITR", "React mentor for CodeCell"],
    history: ["Smart India Hackathon finalist", "ETHIndia campus qualifier"],
    reviews: ["Ships clean UI under pressure", "Great teammate for product decisions"]
  },
  {
    id: 2,
    name: "Maya Rao",
    role: "ML Builder",
    college: "IIIT Hyderabad",
    year: "2026",
    avatar: "MR",
    bio: "ML engineer focused on applied AI, recommender systems, and explainable models for real users.",
    availability: "Open to invites",
    match: 91,
    location: "Hyderabad",
    skills: [
      { name: "Python", level: "Expert", score: 92 },
      { name: "ML", level: "Advanced", score: 89 },
      { name: "Product", level: "Intermediate", score: 75 },
      { name: "React", level: "Beginner", score: 48 }
    ],
    projects: ["MedAssist AI", "StudyGraph", "PromptLab"],
    achievements: ["Winner at Buildspace Nights", "Published campus NLP toolkit"],
    history: ["HackMIT remote", "AI For Good Sprint"],
    reviews: ["Excellent problem framer", "Calm during demo crunch"]
  },
  {
    id: 3,
    name: "Rohan Singh",
    role: "Backend Engineer",
    college: "BITS Pilani",
    year: "2025",
    avatar: "RS",
    bio: "API, database, and deployment specialist. Loves making prototypes feel reliable.",
    availability: "Busy until Friday",
    match: 84,
    location: "Pilani",
    skills: [
      { name: "Node.js", level: "Expert", score: 91 },
      { name: "Python", level: "Advanced", score: 83 },
      { name: "Leadership", level: "Advanced", score: 81 },
      { name: "JavaScript", level: "Advanced", score: 85 }
    ],
    projects: ["OpenEvents API", "HostelMate", "QueueLess"],
    achievements: ["Backend track winner at HackCBS"],
    history: ["HackCBS", "InOut"],
    reviews: ["Architecture-first thinker", "Makes everyone faster"]
  },
  {
    id: 4,
    name: "Nisha Kapoor",
    role: "Product Designer",
    college: "NID Bengaluru",
    year: "2027",
    avatar: "NK",
    bio: "UX designer who specializes in student workflows, onboarding, and high-pressure pitch decks.",
    availability: "Available nights",
    match: 88,
    location: "Bengaluru",
    skills: [
      { name: "UI/UX", level: "Expert", score: 96 },
      { name: "Product", level: "Advanced", score: 87 },
      { name: "CSS", level: "Intermediate", score: 69 },
      { name: "Leadership", level: "Advanced", score: 83 }
    ],
    projects: ["FlowDesk", "PitchPilot", "CampusCare"],
    achievements: ["Best design at HackThisFall"],
    history: ["HackThisFall", "Designathon"],
    reviews: ["Transforms rough ideas into stories", "User interviews are her superpower"]
  }
];

const teams = [
  {
    id: 1,
    name: "SignalForge",
    status: "Recruiting",
    topic: "AI tools for student productivity",
    roles: ["Frontend", "ML", "Product"],
    capacity: 4,
    filled: 3,
    lead: "Maya Rao",
    applicants: []
  },
  {
    id: 2,
    name: "ZeroQueue",
    status: "Reviewing applicants",
    topic: "Campus operations and smart queues",
    roles: ["Backend", "UI/UX"],
    capacity: 5,
    filled: 4,
    lead: "Rohan Singh",
    applicants: []
  },
  {
    id: 3,
    name: "GreenByte",
    status: "Open",
    topic: "Carbon-aware coding challenges",
    roles: ["Frontend", "Backend", "Leadership"],
    capacity: 4,
    filled: 2,
    lead: "Aarav Mehta",
    applicants: []
  }
];

const hackathons = [
  {
    id: 1,
    name: "HackNova 2026",
    date: "May 28-30",
    mode: "Hybrid",
    prize: "$25k",
    tracks: ["AI", "Climate", "Education"],
    status: "Team application ready"
  },
  {
    id: 2,
    name: "Campus Build Sprint",
    date: "June 8-9",
    mode: "Online",
    prize: "$8k",
    tracks: ["SaaS", "DevTools", "Fintech"],
    status: "Saved draft"
  },
  {
    id: 3,
    name: "Design x Code Jam",
    date: "June 21-23",
    mode: "Bengaluru",
    prize: "$12k",
    tracks: ["Design", "Consumer", "Health"],
    status: "Open for teams"
  }
];

const activity = [
  "Nisha endorsed your UI/UX badge.",
  "SignalForge invited you as Frontend.",
  "HackNova application checklist is 80% complete.",
  "Three new React teammates match your goals."
];

function createSeedData() {
  return {
    users: [],
    sessions: [],
    otps: [],
    skills,
    members,
    teams,
    hackathons,
    invitations: [],
    applications: [],
    activity,
    counters: {
      user: 1,
      member: 5,
      team: 4,
      invitation: 1,
      application: 1
    }
  };
}

module.exports = { createSeedData };
