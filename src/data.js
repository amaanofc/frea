// ─────────────────────────────────────────────
// frea — UK Senior Mentors & Data System
// ─────────────────────────────────────────────

export const MENTORS = [
  {
    id: 1,
    name: "Aanya Sharma",
    year: "4th year (MEng)",
    major: "Computer Science",
    university: "Imperial College London",
    bio: "founded a dev tools startup in 2nd year that got backed by Y Combinator (S23). incoming software engineer at Stripe London. happy to roast your tech CV, do mock technical interviews, or talk about launching a side project at uni.",
    topTip: "“don't grind 500 leetcodes. pick 2 projects you can passionately defend for 20 mins.”",
    topTipColor: "yellow",
    achievements: ["yc-alumni", "stripe-offer", "hackathon-winner"],
    helpsWith: ["tech interviews", "spring weeks", "side projects", "leetcoding"],
    rating: 4.9,
    callsCompleted: 47,
    availability: [
      { day: "Mon 21 Sep", slots: ["10:00 AM", "2:30 PM", "4:30 PM"] },
      { day: "Wed 23 Sep", slots: ["11:00 AM", "3:00 PM"] },
      { day: "Fri 25 Sep", slots: ["9:30 AM", "1:00 PM", "5:00 PM"] }
    ],
    color: "blue"
  },
  {
    id: 2,
    name: "Callum Davies",
    year: "3rd year (BSc)",
    major: "Economics & Finance",
    university: "LSE",
    bio: "landed Spring Weeks at Goldman Sachs and Morgan Stanley, converting into an investment banking summer analyst offer. non-target school before transferring to LSE. let's talk cold emailing, commercial awareness, and passing numerical tests.",
    topTip: "“first year counts 0% towards your degree, but 100% for Spring Weeks. start applications in September.”",
    topTipColor: "mint",
    achievements: ["goldman-intern", "spring-week-alum", "first-class-honours"],
    helpsWith: ["spring weeks", "investment banking", "cv roast", "assessment centres"],
    rating: 4.8,
    callsCompleted: 62,
    availability: [
      { day: "Tue 22 Sep", slots: ["10:30 AM", "12:00 PM"] },
      { day: "Thu 24 Sep", slots: ["2:00 PM", "4:30 PM", "6:00 PM"] },
      { day: "Sat 26 Sep", slots: ["11:00 AM", "1:30 PM"] }
    ],
    color: "orange"
  },
  {
    id: 3,
    name: "Priya Nair",
    year: "recent grad (MSc)",
    major: "Human-Computer Interaction",
    university: "UCL",
    bio: "switched from Psychology into UX Research, now at Google's King's Cross office. built my portfolio through student societies and voluntary design sprints. let's break down how to transition into tech without a traditional CS degree.",
    topTip: "“your design portfolio doesn't need 20 case studies. it needs 2 projects where you clearly articulate trade-offs.”",
    topTipColor: "blush",
    achievements: ["google-offer", "published-researcher", "society-president"],
    helpsWith: ["ux research", "career switching", "portfolio review", "tech transition"],
    rating: 5.0,
    callsCompleted: 31,
    availability: [
      { day: "Mon 21 Sep", slots: ["5:30 PM", "6:30 PM"] },
      { day: "Wed 23 Sep", slots: ["6:00 PM", "7:00 PM"] },
      { day: "Sun 27 Sep", slots: ["10:00 AM", "11:30 AM", "1:00 PM"] }
    ],
    color: "pink"
  },
  {
    id: 4,
    name: "Noah Adebayo",
    year: "4th year (MEng)",
    major: "Mechanical Engineering",
    university: "University of Bristol",
    bio: "failed my 1st year thermofluids exam with a 38%, panicked, overhauled my study system with active recall and finished 2nd year with an 81% 1st. now incoming on Dyson's graduate scheme. let me share what actually worked.",
    topTip: "“rereading lecture slides is a trap. do past papers from week 3, even if you have to cheat on the mark scheme at first.”",
    topTipColor: "sky",
    achievements: ["first-class-honours", "dyson-grad-scheme", "formula-student-lead"],
    helpsWith: ["gpa comeback", "revision systems", "engineering careers", "exam technique"],
    rating: 4.9,
    callsCompleted: 55,
    availability: [
      { day: "Tue 22 Sep", slots: ["9:30 AM", "11:00 AM"] },
      { day: "Thu 24 Sep", slots: ["3:00 PM", "5:00 PM"] },
      { day: "Sat 26 Sep", slots: ["10:00 AM", "2:00 PM"] }
    ],
    color: "green"
  },
  {
    id: 5,
    name: "Oliver Zhang",
    year: "3rd year (BA)",
    major: "Law (Jurisprudence)",
    university: "University of Oxford",
    bio: "president of the Oxford Law Society and incoming vacation scheme student at Clifford Chance. happy to review training contract applications, discuss Watson Glaser prep, or share how to tackle weekly tutorial essays under pressure.",
    topTip: "“for law essays: never just summarize the statute. take a bold stance in your first paragraph and defend it ruthlessly.”",
    topTipColor: "yellow",
    achievements: ["magic-circle-offer", "society-president", "first-class-honours"],
    helpsWith: ["vacation schemes", "commercial law", "watson glaser", "essay technique"],
    rating: 4.8,
    callsCompleted: 38,
    availability: [
      { day: "Mon 21 Sep", slots: ["4:00 PM", "5:30 PM"] },
      { day: "Wed 23 Sep", slots: ["10:00 AM", "2:00 PM"] },
      { day: "Fri 25 Sep", slots: ["3:00 PM", "4:30 PM"] }
    ],
    color: "blue"
  },
  {
    id: 6,
    name: "Emily Watson",
    year: "recent grad (MEng)",
    major: "Product Design Engineering",
    university: "University of Bath",
    bio: "completed a 12-month industrial placement year at McLaren Automotive in Woking. designed a composite bracket now on track cars. let's talk about landing competitive automotive placements and balancing studio coursework.",
    topTip: "“placement years are the single highest ROI decision in university. apply to 25+, not 3.”",
    topTipColor: "mint",
    achievements: ["mclaren-placement", "design-award", "patent-filed"],
    helpsWith: ["placement years", "cad & prototyping", "engineering portfolios", "automotive"],
    rating: 4.9,
    callsCompleted: 44,
    availability: [
      { day: "Tue 22 Sep", slots: ["6:30 PM", "7:30 PM"] },
      { day: "Sat 26 Sep", slots: ["11:00 AM", "12:30 PM", "2:00 PM"] }
    ],
    color: "orange"
  },
  {
    id: 7,
    name: "Tariq Al-Mansoor",
    year: "4th year (MBChB)",
    major: "Medicine",
    university: "University of Manchester",
    bio: "intercalated in medical neuroscience and co-authored two papers in BMJ Open. mentoring 1st and 2nd year medics on surviving anatomy labs, OSCE clinical communication, and getting involved in hospital audits early.",
    topTip: "“anki is your second brain in medical school. never write paper summaries you'll never look at again.”",
    topTipColor: "blush",
    achievements: ["published-researcher", "first-class-honours", "peer-mentor"],
    helpsWith: ["med school survival", "anki workflows", "clinical osces", "audit projects"],
    rating: 5.0,
    callsCompleted: 29,
    availability: [
      { day: "Mon 21 Sep", slots: ["11:00 AM", "1:30 PM"] },
      { day: "Thu 24 Sep", slots: ["10:00 AM", "4:00 PM"] },
      { day: "Sun 27 Sep", slots: ["3:00 PM", "4:30 PM"] }
    ],
    color: "pink"
  },
  {
    id: 8,
    name: "Maya Tremblay",
    year: "3rd year (BSc)",
    major: "Mathematics & Statistics",
    university: "University of Warwick",
    bio: "cleared first-round quantitative trading assessments at Jane Street and Citadel. non-traditional math background who practiced probability puzzles from scratch. happy to run mock quant screens and share problem sets.",
    topTip: "“quant interviews are 80% mental math speed and 20% expected value logic. practice 15 mins daily on Zetamac.”",
    topTipColor: "sky",
    achievements: ["quant-intern", "hackathon-winner", "top-of-cohort"],
    helpsWith: ["quant trading", "mental maths", "probability puzzles", "maths modules"],
    rating: 4.9,
    callsCompleted: 51,
    availability: [
      { day: "Wed 23 Sep", slots: ["9:00 AM", "11:30 AM", "5:00 PM"] },
      { day: "Fri 25 Sep", slots: ["2:00 PM", "4:00 PM"] }
    ],
    color: "green"
  },
  {
    id: 9,
    name: "Lucas Wright",
    year: "4th year (BA)",
    major: "History & Politics",
    university: "University of Cambridge",
    bio: "secured an offer on the UK Civil Service Fast Stream and won the faculty dissertation award on British housing policy. let's discuss surviving weekly supervisions, reading list triage, and public sector careers.",
    topTip: "“read the intro and conclusion of 5 books rather than cover-to-cover on 1 book. write the essay outline first.”",
    topTipColor: "yellow",
    achievements: ["civil-service-offer", "dissertation-prize", "first-class-honours"],
    helpsWith: ["civil service", "essay writing", "reading lists", "supervision prep"],
    rating: 4.9,
    callsCompleted: 22,
    availability: [
      { day: "Tue 22 Sep", slots: ["5:30 PM", "6:30 PM"] },
      { day: "Thu 24 Sep", slots: ["6:00 PM", "7:00 PM"] },
      { day: "Sat 26 Sep", slots: ["10:30 AM", "12:00 PM"] }
    ],
    color: "blue"
  },
  {
    id: 10,
    name: "Sophia Taylor",
    year: "3rd year (BSc)",
    major: "Data Science & AI",
    university: "University of Edinburgh",
    bio: "Google DeepMind undergraduate scholar and lead organizer of Edinburgh's annual hackathon. worked on LLM evaluation over the summer. let's chat about breaking into machine learning research and Kaggle as an undergrad.",
    topTip: "“cold email 5 PhD students working on papers you find interesting. they need help 10x more than professors do.”",
    topTipColor: "mint",
    achievements: ["deepmind-scholar", "hackathon-winner", "open-source"],
    helpsWith: ["machine learning", "research abroad", "kaggle competitions", "python & pytorch"],
    rating: 4.9,
    callsCompleted: 73,
    availability: [
      { day: "Mon 21 Sep", slots: ["7:00 PM", "8:30 PM"] },
      { day: "Wed 23 Sep", slots: ["8:00 PM"] },
      { day: "Sat 26 Sep", slots: ["10:00 AM", "11:30 AM", "1:00 PM"] }
    ],
    color: "orange"
  },
  {
    id: 11,
    name: "Liam Fletcher",
    year: "4th year (MEng)",
    major: "Electrical Engineering",
    university: "Durham University",
    bio: "captained Durham's Solar Car project and raced across Australia. secured clean-tech grant funding before graduating. let's brainstorm ambitious hardware projects, society leadership, and applying for innovation grants.",
    topTip: "“join an ambitious student engineering society in week 2 of fresher's term. it'll teach you 10x more than lectures.”",
    topTipColor: "blush",
    achievements: ["startup-founder", "patent-filed", "society-president"],
    helpsWith: ["hardware projects", "hackathons", "funding grants", "engineering projects"],
    rating: 4.8,
    callsCompleted: 34,
    availability: [
      { day: "Tue 22 Sep", slots: ["4:00 PM", "5:30 PM"] },
      { day: "Fri 25 Sep", slots: ["10:00 AM", "11:30 AM"] },
      { day: "Sat 26 Sep", slots: ["3:00 PM", "4:30 PM"] }
    ],
    color: "green"
  },
  {
    id: 12,
    name: "Chloe Jenkins",
    year: "recent grad (BSc)",
    major: "Biochemistry",
    university: "University of St Andrews",
    bio: "interned at the Francis Crick Institute in London and won the faculty dissertation award. now on a fully-funded PhD at Oxford. happy to review personal statements, graduate lab placement requests, and summer research apps.",
    topTip: "“cold email lab PIs with one specific question about their latest paper. generic emails get deleted; curiosity gets replies.”",
    topTipColor: "sky",
    achievements: ["crick-institute-alum", "dissertation-prize", "funded-phd"],
    helpsWith: ["phd applications", "cold emailing labs", "biochemistry revision", "personal statements"],
    rating: 5.0,
    callsCompleted: 31,
    availability: [
      { day: "Mon 21 Sep", slots: ["2:00 PM", "3:30 PM"] },
      { day: "Thu 24 Sep", slots: ["11:00 AM", "1:30 PM"] },
      { day: "Sun 27 Sep", slots: ["4:00 PM", "5:30 PM"] }
    ],
    color: "pink"
  }
];

// Standardized Achievement Tags with Category & Matching Semantic Icons
export const ACHIEVEMENTS = {
  // Career & Corporate (Sky Blue)
  "yc-alumni": { label: "yc alumni", icon: "rocket", category: "career", color: "orange" },
  "stripe-offer": { label: "stripe offer", icon: "briefcase", category: "career", color: "blue" },
  "goldman-intern": { label: "goldman sachs intern", icon: "briefcase", category: "career", color: "blue" },
  "spring-week-alum": { label: "spring week alum", icon: "lightning", category: "career", color: "blue" },
  "google-offer": { label: "google offer", icon: "briefcase", category: "career", color: "blue" },
  "dyson-grad-scheme": { label: "dyson grad scheme", icon: "briefcase", category: "career", color: "blue" },
  "magic-circle-offer": { label: "magic circle law offer", icon: "briefcase", category: "career", color: "blue" },
  "mclaren-placement": { label: "mclaren placement year", icon: "briefcase", category: "career", color: "blue" },
  "quant-intern": { label: "quant trading intern", icon: "lightning", category: "career", color: "blue" },
  "civil-service-offer": { label: "civil service fast stream", icon: "flag", category: "career", color: "blue" },
  "crick-institute-alum": { label: "crick institute alum", icon: "microscope", category: "career", color: "blue" },

  // Academic Excellence (Marker Orange)
  "first-class-honours": { label: "first-class honours (1st)", icon: "trophy", category: "academics", color: "orange" },
  "top-of-cohort": { label: "top of cohort", icon: "trophy", category: "academics", color: "orange" },
  "dissertation-prize": { label: "dissertation prize", icon: "star", category: "academics", color: "orange" },
  "funded-phd": { label: "fully funded phd", icon: "mortarboard", category: "academics", color: "orange" },

  // Ventures, Hackathons & Societies (Sprout Green)
  "hackathon-winner": { label: "hackathon 1st place", icon: "lightning", category: "projects", color: "green" },
  "open-source": { label: "open source lead", icon: "code", category: "projects", color: "green" },
  "formula-student-lead": { label: "formula student lead", icon: "flag", category: "projects", color: "green" },
  "startup-founder": { label: "startup founder", icon: "rocket", category: "projects", color: "green" },
  "patent-filed": { label: "patent filed", icon: "lightbulb", category: "projects", color: "green" },

  // Research & Science (Rose Pink)
  "published-researcher": { label: "published researcher", icon: "microscope", category: "research", color: "pink" },
  "deepmind-scholar": { label: "deepmind scholar", icon: "sparkle", category: "research", color: "pink" },
  "design-award": { label: "national design award", icon: "star", category: "research", color: "pink" },

  // Leadership & Community (Lavender)
  "society-president": { label: "society president", icon: "flag", category: "leadership", color: "purple" },
  "peer-mentor": { label: "senior peer mentor", icon: "heart", category: "leadership", color: "purple" }
};

// UK Subject Categories
export const SUBJECTS = [
  "all",
  "computing & ai",
  "engineering",
  "economics & finance",
  "law",
  "medicine & life sciences",
  "maths & physics",
  "humanities & politics"
];

// Mapping mentors' degrees to subject filter categories
export const SUBJECT_MAP = {
  "Computer Science": "computing & ai",
  "Economics & Finance": "economics & finance",
  "Human-Computer Interaction": "computing & ai",
  "Mechanical Engineering": "engineering",
  "Law (Jurisprudence)": "law",
  "Product Design Engineering": "engineering",
  "Medicine": "medicine & life sciences",
  "Mathematics & Statistics": "maths & physics",
  "History & Politics": "humanities & politics",
  "Data Science & AI": "computing & ai",
  "Electrical Engineering": "engineering",
  "Biochemistry": "medicine & life sciences"
};

// UK University Year filter options
export const YEAR_FILTERS = [
  "all years",
  "2nd year",
  "3rd year",
  "4th year (MEng)",
  "recent grad"
];

// UK Premier Universities
export const UK_UNIVERSITIES = [
  "All UK Universities",
  "Imperial College London",
  "University of Oxford",
  "University of Cambridge",
  "UCL",
  "LSE",
  "University of Bristol",
  "University of Warwick",
  "University of Manchester",
  "University of Bath",
  "University of Edinburgh",
  "Durham University",
  "University of St Andrews"
];

// Testimonials from UK Students
export const TESTIMONIALS = [
  {
    quote: "i had no idea how Spring Weeks worked as a 1st year at Bristol. Callum hopped on a 20-min call, tore my CV apart in the kindest way, and explained the exact timeline. I got two offers.",
    name: "Marcus Thorne",
    detail: "1st Year Economics · University of Bristol"
  },
  {
    quote: "Aanya literally saved my Imperial CS 2nd year. Her advice on not over-optimizing LeetCode and focusing on building real side projects got me through my Stripe technical screens.",
    name: "Elena Rostova",
    detail: "2nd Year Computing · Imperial College London"
  },
  {
    quote: "Every careers adviser told me to 'network on LinkedIn', which felt fake and uncomfortable. Chatting with Priya for 20 minutes was like having an older sibling who already works at Google.",
    name: "Tobi Adeleke",
    detail: "Final Year Psychology · UCL"
  }
];

// FAQ items
export const FAQ_ITEMS = [
  {
    question: "is frea really 100% free?",
    answer: "yes, completely free for all UK university students. our senior mentors volunteer 20 to 40 minutes a week because elder students helped them when they were freshers, and they want to pay it forward. there are no fees, hidden charges, or premium upsells ever."
  },
  {
    question: "who can book a call?",
    answer: "any current student or recent graduate at an accredited UK university with an official '.ac.uk' student email address. you can book with seniors at your own university or explore mentors from Oxford, Cambridge, Imperial, LSE, and across the Russell Group."
  },
  {
    question: "what happens during the 20-minute call?",
    answer: "it's a relaxed 1-on-1 Google Meet call. you can ask for a CV roast, interview advice, module survival tips, or general guidance on breaking into top firms and research labs. no corporate jargon, no awkward networking pressure."
  },
  {
    question: "how do i become a senior mentor?",
    answer: "if you're a 2nd year, 3rd year, master's student or recent grad with valuable university or career experience, you can submit an application via our 'become a mentor' page. we verify your student status and onboard you in under 24 hours."
  },
  {
    question: "why do we require a '.ac.uk' university email?",
    answer: "in the UK, '.ac.uk' domains are strictly controlled by Jisc and exclusively issued to verified higher education institutions. this ensures our community consists entirely of genuine university peers."
  }
];
