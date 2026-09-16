// ─────────────────────────────────────────────
// frea — Mock Mentor Data
// ─────────────────────────────────────────────

export const MENTORS = [
  {
    id: 1,
    name: "Aanya Sharma",
    year: "4th year",
    major: "Computer Science",
    university: "IIT Delhi",
    bio: "built a startup that got into Y Combinator's summer batch. dropped out of the idea but kept all the lessons. happy to chat about tech interviews, building side projects, or figuring out if startups are your thing.",
    achievements: ["yc-alumni", "hackathon-winner", "open-source"],
    helpsWith: ["tech interviews", "side projects", "startup life", "dsa prep"],
    rating: 4.9,
    callsCompleted: 47,
    availability: [
      { day: "Mon", slots: ["10:00 AM", "2:00 PM", "4:00 PM"] },
      { day: "Wed", slots: ["11:00 AM", "3:00 PM"] },
      { day: "Fri", slots: ["9:00 AM", "1:00 PM", "5:00 PM"] }
    ],
    color: "blue"
  },
  {
    id: 2,
    name: "Rohan Mehta",
    year: "3rd year",
    major: "Mechanical Engineering",
    university: "BITS Pilani",
    bio: "went from a 6.2 gpa in first year to dean's list by third. turns out it's less about being smart and more about knowing how to study. let me share what actually worked.",
    achievements: ["deans-list", "research-published", "topper"],
    helpsWith: ["study techniques", "gpa recovery", "time management", "research papers"],
    rating: 4.8,
    callsCompleted: 62,
    availability: [
      { day: "Tue", slots: ["10:00 AM", "12:00 PM"] },
      { day: "Thu", slots: ["2:00 PM", "4:00 PM", "6:00 PM"] },
      { day: "Sat", slots: ["11:00 AM"] }
    ],
    color: "orange"
  },
  {
    id: 3,
    name: "Priya Nair",
    year: "recent grad",
    major: "Psychology",
    university: "Delhi University",
    bio: "just landed a role at google's ux research team. my secret? i volunteered for every research project i could find. the portfolio wrote itself. let's talk about breaking into ux from a non-design background.",
    achievements: ["google-offer", "research-published", "volunteer-lead"],
    helpsWith: ["ux research", "career switching", "portfolio building", "interview prep"],
    rating: 5.0,
    callsCompleted: 31,
    availability: [
      { day: "Mon", slots: ["6:00 PM", "7:00 PM"] },
      { day: "Wed", slots: ["6:00 PM"] },
      { day: "Sun", slots: ["10:00 AM", "11:00 AM", "12:00 PM"] }
    ],
    color: "pink"
  },
  {
    id: 4,
    name: "Arjun Patel",
    year: "4th year",
    major: "Business Administration",
    university: "IIM Ahmedabad",
    bio: "founded the entrepreneurship cell, ran three failed ventures, and finally built one that pays my rent. failure is the curriculum, not the exception. let's figure out your first move together.",
    achievements: ["founded-club", "entrepreneur", "case-comp-winner"],
    helpsWith: ["entrepreneurship", "case competitions", "leadership", "fundraising"],
    rating: 4.7,
    callsCompleted: 55,
    availability: [
      { day: "Tue", slots: ["9:00 AM", "11:00 AM"] },
      { day: "Thu", slots: ["3:00 PM", "5:00 PM"] },
      { day: "Sat", slots: ["10:00 AM", "2:00 PM"] }
    ],
    color: "green"
  },
  {
    id: 5,
    name: "Meera Krishnan",
    year: "3rd year",
    major: "Data Science",
    university: "IIIT Hyderabad",
    bio: "kaggle grandmaster at 20. sounds fancy but it's really just about consistency and learning to read documentation properly. i can help you go from zero to your first competition medal.",
    achievements: ["kaggle-grandmaster", "internship-faang", "hackathon-winner"],
    helpsWith: ["machine learning", "kaggle competitions", "data science career", "python"],
    rating: 4.9,
    callsCompleted: 38,
    availability: [
      { day: "Mon", slots: ["4:00 PM", "5:00 PM"] },
      { day: "Wed", slots: ["10:00 AM", "2:00 PM"] },
      { day: "Fri", slots: ["3:00 PM", "4:00 PM"] }
    ],
    color: "blue"
  },
  {
    id: 6,
    name: "Kabir Singh",
    year: "recent grad",
    major: "Design",
    university: "NID Ahmedabad",
    bio: "designed the app that 2 million students use daily for campus navigation. now at razorpay leading product design. your portfolio doesn't need 20 projects — it needs 3 great ones.",
    achievements: ["product-launch", "design-award", "internship-faang"],
    helpsWith: ["product design", "portfolio review", "design interviews", "figma"],
    rating: 4.8,
    callsCompleted: 44,
    availability: [
      { day: "Tue", slots: ["7:00 PM", "8:00 PM"] },
      { day: "Sat", slots: ["11:00 AM", "12:00 PM", "1:00 PM"] }
    ],
    color: "orange"
  },
  {
    id: 7,
    name: "Zara Ahmed",
    year: "4th year",
    major: "Biotechnology",
    university: "IIT Bombay",
    bio: "published two papers in nature communications before graduating. research isn't about genius, it's about asking the right questions and finding a mentor who cares. i want to be that mentor for you.",
    achievements: ["research-published", "deans-list", "scholarship"],
    helpsWith: ["research methodology", "paper writing", "grad school apps", "lab skills"],
    rating: 5.0,
    callsCompleted: 29,
    availability: [
      { day: "Mon", slots: ["11:00 AM", "1:00 PM"] },
      { day: "Thu", slots: ["10:00 AM", "4:00 PM"] },
      { day: "Sun", slots: ["3:00 PM"] }
    ],
    color: "pink"
  },
  {
    id: 8,
    name: "Dev Malhotra",
    year: "3rd year",
    major: "Economics",
    university: "St. Stephen's College",
    bio: "interned at goldman sachs and the reserve bank in the same year. the trick? cold emails actually work if you write them right. let me help you land that dream internship.",
    achievements: ["internship-faang", "debate-champion", "topper"],
    helpsWith: ["internship hunting", "cold emailing", "finance career", "economics prep"],
    rating: 4.6,
    callsCompleted: 51,
    availability: [
      { day: "Wed", slots: ["9:00 AM", "11:00 AM", "5:00 PM"] },
      { day: "Fri", slots: ["2:00 PM", "4:00 PM"] }
    ],
    color: "green"
  },
  {
    id: 9,
    name: "Ishita Reddy",
    year: "4th year",
    major: "Architecture",
    university: "SPA Delhi",
    bio: "won the national architecture thesis award and survived 47 all-nighters in the process. i now know how to work smarter, not just harder. let's talk about surviving architecture school while keeping your sanity.",
    achievements: ["thesis-award", "design-award", "volunteer-lead"],
    helpsWith: ["thesis guidance", "design thinking", "work-life balance", "portfolio"],
    rating: 4.9,
    callsCompleted: 22,
    availability: [
      { day: "Tue", slots: ["6:00 PM"] },
      { day: "Thu", slots: ["6:00 PM", "7:00 PM"] },
      { day: "Sat", slots: ["10:00 AM", "11:00 AM"] }
    ],
    color: "blue"
  },
  {
    id: 10,
    name: "Aarav Joshi",
    year: "recent grad",
    major: "Computer Science",
    university: "IIT Kanpur",
    bio: "cracked google, microsoft, and amazon — chose microsoft because of the team, not the package. interviews are a skill you can learn. i've helped 30+ juniors clear faang rounds.",
    achievements: ["internship-faang", "open-source", "hackathon-winner"],
    helpsWith: ["faang prep", "system design", "competitive programming", "resume review"],
    rating: 4.9,
    callsCompleted: 73,
    availability: [
      { day: "Mon", slots: ["8:00 PM", "9:00 PM"] },
      { day: "Wed", slots: ["8:00 PM"] },
      { day: "Sat", slots: ["10:00 AM", "11:00 AM", "12:00 PM"] }
    ],
    color: "orange"
  },
  {
    id: 11,
    name: "Tara Bose",
    year: "3rd year",
    major: "Physics",
    university: "IISc Bangalore",
    bio: "spent a summer at cern working on particle physics simulations. it started with one email to a professor who said yes. i can help you find your own research opportunity abroad.",
    achievements: ["research-published", "scholarship", "cern-intern"],
    helpsWith: ["research abroad", "scholarship apps", "physics career", "grad school"],
    rating: 4.8,
    callsCompleted: 19,
    availability: [
      { day: "Mon", slots: ["3:00 PM"] },
      { day: "Thu", slots: ["11:00 AM", "2:00 PM"] },
      { day: "Sun", slots: ["4:00 PM", "5:00 PM"] }
    ],
    color: "pink"
  },
  {
    id: 12,
    name: "Nikhil Verma",
    year: "4th year",
    major: "Electrical Engineering",
    university: "IIT Madras",
    bio: "built a solar-powered drone that won the smart india hackathon. engineering projects don't need to be boring — they need to solve real problems. let's brainstorm your next build.",
    achievements: ["hackathon-winner", "patent-filed", "founded-club"],
    helpsWith: ["hardware projects", "hackathons", "innovation", "engineering basics"],
    rating: 4.7,
    callsCompleted: 34,
    availability: [
      { day: "Tue", slots: ["4:00 PM", "5:00 PM"] },
      { day: "Fri", slots: ["10:00 AM", "11:00 AM"] },
      { day: "Sat", slots: ["3:00 PM"] }
    ],
    color: "green"
  }
];

// Achievement metadata for sticker rendering
export const ACHIEVEMENTS = {
  "yc-alumni": { label: "yc alumni", icon: "rocket", color: "orange" },
  "hackathon-winner": { label: "hackathon winner", icon: "lightning", color: "blue" },
  "open-source": { label: "open source", icon: "code", color: "green" },
  "deans-list": { label: "dean's list", icon: "star", color: "orange" },
  "research-published": { label: "published researcher", icon: "book", color: "pink" },
  "topper": { label: "class topper", icon: "trophy", color: "orange" },
  "google-offer": { label: "google offer", icon: "sparkle", color: "blue" },
  "volunteer-lead": { label: "volunteer lead", icon: "heart", color: "pink" },
  "founded-club": { label: "founded a club", icon: "flag", color: "green" },
  "entrepreneur": { label: "entrepreneur", icon: "rocket", color: "orange" },
  "case-comp-winner": { label: "case comp winner", icon: "trophy", color: "blue" },
  "kaggle-grandmaster": { label: "kaggle grandmaster", icon: "sparkle", color: "orange" },
  "internship-faang": { label: "faang intern", icon: "briefcase", color: "blue" },
  "product-launch": { label: "shipped a product", icon: "rocket", color: "green" },
  "design-award": { label: "design award", icon: "star", color: "pink" },
  "scholarship": { label: "scholarship holder", icon: "medal", color: "orange" },
  "thesis-award": { label: "thesis award", icon: "trophy", color: "orange" },
  "debate-champion": { label: "debate champion", icon: "mic", color: "green" },
  "cern-intern": { label: "cern intern", icon: "sparkle", color: "blue" },
  "patent-filed": { label: "patent filed", icon: "lightbulb", color: "orange" }
};

// Subject filter options
export const SUBJECTS = [
  "all",
  "computer science",
  "engineering",
  "business",
  "design",
  "science",
  "arts & humanities"
];

export const YEAR_FILTERS = [
  "all years",
  "3rd year",
  "4th year",
  "recent grad"
];

// Map majors to filter categories
export const SUBJECT_MAP = {
  "Computer Science": "computer science",
  "Data Science": "computer science",
  "Mechanical Engineering": "engineering",
  "Electrical Engineering": "engineering",
  "Biotechnology": "science",
  "Physics": "science",
  "Business Administration": "business",
  "Economics": "business",
  "Design": "design",
  "Architecture": "design",
  "Psychology": "arts & humanities"
};

// Testimonials
export const TESTIMONIALS = [
  {
    quote: "i was terrified of coding interviews. one call with aarav and i realized it's just pattern recognition. got into microsoft three months later.",
    name: "Sneha K.",
    detail: "2nd year, CS · IIT Bombay"
  },
  {
    quote: "priya helped me pivot from psychology to ux research. she didn't just give advice — she reviewed my portfolio and told me exactly what to fix.",
    name: "Rahul M.",
    detail: "3rd year, Psychology · DU"
  },
  {
    quote: "i thought research was only for geniuses. tara showed me how to write my first cold email to a professor. i'm now doing research at eth zurich.",
    name: "Ananya S.",
    detail: "2nd year, Physics · IISc"
  }
];

// FAQ data
export const FAQ_ITEMS = [
  {
    question: "what even is frea?",
    answer: "frea is a peer-to-peer mentoring platform where younger uni students connect with seniors who've achieved real things — research publications, internships at top companies, hackathon wins, and more. you book a free 20-minute call and get genuine advice from someone who's actually been there."
  },
  {
    question: "is it really free?",
    answer: "yes, completely free. no hidden charges, no premium tiers, no catches. mentors volunteer their time because they remember how much a good conversation can change your trajectory. we believe mentoring should be accessible to everyone."
  },
  {
    question: "who are the mentors?",
    answer: "they're senior university students (3rd year, 4th year, and recent graduates) who've achieved something meaningful — dean's list, research publications, faang internships, hackathon wins, founded clubs, and more. every mentor is verified and has opted in to help."
  },
  {
    question: "how long is each call?",
    answer: "20 minutes. it's short enough to stay focused and long enough to get real value. come with specific questions and you'll walk away with actionable advice."
  },
  {
    question: "can i become a mentor?",
    answer: "absolutely! if you're a 3rd year student or above with achievements you're proud of, we'd love to have you. hit us up and we'll get you set up."
  },
  {
    question: "what if my mentor doesn't show up?",
    answer: "it happens rarely, but if it does, you can rebook with the same mentor or try someone new. we track reliability and mentors who consistently miss calls are gently removed from the platform."
  }
];
