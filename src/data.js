// ─────────────────────────────────────────────
// frea — UK Senior Mentors & Data System with Docs & Freabies
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
    linkedin: "https://www.linkedin.com/in/aanya-sharma",
    websites: [
      { label: "GitHub", url: "https://github.com/aanyasharma" },
      { label: "Portfolio", url: "https://aanya.dev" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Mon 21 Sep", slots: ["10:00 AM", "2:30 PM", "4:30 PM"] },
      { day: "Wed 23 Sep", slots: ["11:00 AM", "3:00 PM"] },
      { day: "Fri 25 Sep", slots: ["9:30 AM", "1:00 PM", "5:00 PM"] }
    ],
    color: "blue",
    docs: [
      {
        id: "doc-1-1",
        title: "The 2-Project Tech CV Template",
        subtitle: "Single-column LaTeX & Notion resume template that secured technical screens at Stripe, Palantir & Meta",
        type: "free",
        price: 0,
        format: "Notion & LaTeX",
        pages: "2 templates · 8pg guide",
        downloads: 512,
        rating: 4.9,
        category: "Tech",
        previewBullets: [
          "ATS-optimized single-column layout tested against Greenhouse & Lever systems",
          "Word-for-word action verbs to quantify undergraduate side-projects without sounding amateur",
          "Full editable Notion duplicate link + GitHub Overleaf LaTeX source code ready to fork"
        ]
      },
      {
        id: "doc-1-2",
        title: "Imperial Year 2 Systems & Concurrency Bible",
        subtitle: "Annotated lecture walkthroughs, memory race condition diagrams & past exam traps solved",
        type: "paid",
        price: 4.99,
        format: "PDF",
        pages: "76 pages",
        downloads: 168,
        rating: 5.0,
        category: "Tech",
        previewBullets: [
          "POSIX pthreads, semaphores, mutexes and deadlock prevention demystified with code snippets",
          "14 past exam questions solved with official Imperial marker commentary and pitfalls",
          "Visual memory layout diagrams of CPU virtual memory paging, TLB, and cache coherence"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/callum-davies-lse",
    websites: [
      { label: "Substack", url: "https://callumd.substack.com" }
    ],
    pitchVideoUrl: "https://www.loom.com/share/63346d0a7fbe4f6990fa1db4e25a297e",
    availability: [
      { day: "Tue 22 Sep", slots: ["10:30 AM", "12:00 PM"] },
      { day: "Thu 24 Sep", slots: ["2:00 PM", "4:30 PM", "6:00 PM"] },
      { day: "Sat 26 Sep", slots: ["11:00 AM", "1:30 PM"] }
    ],
    color: "orange",
    docs: [
      {
        id: "doc-2-1",
        title: "Spring Week Cold Outreach Email Pack",
        subtitle: "The 3 exact email templates that converted into phone chats with Goldman Sachs and Morgan Stanley MDs",
        type: "free",
        price: 0,
        format: "PDF & Word",
        pages: "5 templates · 6 pages",
        downloads: 640,
        rating: 4.9,
        category: "Economics & Finance",
        previewBullets: [
          "The 60-word rule for reaching senior bankers without getting flagged as corporate spam",
          "Follow-up cadence checklist that landed 3 Spring Week interviews from non-target outreach",
          "Subject lines with 68%+ verified response rates from junior analysts and VPs"
        ]
      },
      {
        id: "doc-2-2",
        title: "LSE 1st-Year Micro & Macro High-First Master Pack",
        subtitle: "Complete mathematical proofs, exam essay frameworks, and numerical problem bank",
        type: "paid",
        price: 5.50,
        format: "PDF",
        pages: "92 pages",
        downloads: 215,
        rating: 4.9,
        category: "Economics & Finance",
        previewBullets: [
          "Utility maximization, Lagrangian multipliers and Nash equilibrium worked step-by-step",
          "IS-LM and AS-AD models with examiner essay critique and mark schemes",
          "Comprehensive formula cheatsheets for summer exams with proofs and assumptions"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/priya-nair-ux",
    websites: [
      { label: "Portfolio", url: "https://priyanair.design" },
      { label: "Medium", url: "https://medium.com/@priyanair" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Mon 21 Sep", slots: ["5:30 PM", "6:30 PM"] },
      { day: "Wed 23 Sep", slots: ["6:00 PM", "7:00 PM"] },
      { day: "Sun 27 Sep", slots: ["10:00 AM", "11:30 AM", "1:00 PM"] }
    ],
    color: "pink",
    docs: [
      {
        id: "doc-3-1",
        title: "Figma Case Study Deck: The Trade-Offs Framework",
        subtitle: "Clean interactive Figma presentation template designed for FAANG UX research & design rounds",
        type: "free",
        price: 0,
        format: "Figma File",
        pages: "18 artboards",
        downloads: 480,
        rating: 5.0,
        category: "Tech",
        previewBullets: [
          "Componentized presentation deck ready to duplicate directly into your personal Figma",
          "How to frame user research constraints and business metrics without fluff",
          "Interview slide structure recommended by senior Google and Monzo product designers"
        ]
      },
      {
        id: "doc-3-2",
        title: "Non-CS to UX Tech Transition Blueprint",
        subtitle: "How I switched from BSc Psychology into a Google UX role without a computer science degree",
        type: "paid",
        price: 5.99,
        format: "PDF & Video",
        pages: "48 pages · 25m video",
        downloads: 132,
        rating: 4.9,
        category: "Tech",
        previewBullets: [
          "Step-by-step 9-month self-taught syllabus for user research, heuristics & prototyping",
          "How to pitch student society voluntary redesigns as production-grade user experience",
          "Word-for-word scripts for answering 'why didn't you study CS?' in final interview loops"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/noah-adebayo-bristol",
    websites: [
      { label: "CAD Portfolio", url: "https://grabcad.com/noah.adebayo" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Tue 22 Sep", slots: ["9:30 AM", "11:00 AM"] },
      { day: "Thu 24 Sep", slots: ["3:00 PM", "5:00 PM"] },
      { day: "Sat 26 Sep", slots: ["10:00 AM", "2:00 PM"] }
    ],
    color: "green",
    docs: [
      {
        id: "doc-4-1",
        title: "Active Recall Revision Cadence Spreadsheet",
        subtitle: "The automated Google Sheet system I used to bounce back from 38% to an 81% 1st-class degree",
        type: "free",
        price: 0,
        format: "Google Sheets",
        pages: "Spreadsheet tool",
        downloads: 720,
        rating: 4.9,
        category: "Engineering",
        previewBullets: [
          "Automated spaced repetition intervals (1 day, 3 days, 1 week, 3 weeks) with date math",
          "Confidence scoring algorithm to prioritize high-yield weak sub-topics",
          "Weekly revision velocity tracker to prevent pre-exam cramming and panic"
        ]
      },
      {
        id: "doc-4-2",
        title: "Thermofluids & Solid Mechanics Worked Solutions Vault",
        subtitle: "10 past papers fully solved with handwritten annotations and common marking trap warnings",
        type: "paid",
        price: 4.50,
        format: "PDF",
        pages: "105 pages",
        downloads: 185,
        rating: 5.0,
        category: "Engineering",
        previewBullets: [
          "Navier-Stokes simplifications, Bernoulli traps, and Mohr's circle stress transforms",
          "Common algebraic and sign pitfalls that cost students 10-15 marks per examination",
          "Dyson graduate scheme technical assessment problem breakdowns"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/oliver-zhang-oxford",
    websites: [
      { label: "Law Review", url: "https://oxfordlawreview.org" }
    ],
    pitchVideoUrl: "https://www.loom.com/share/63346d0a7fbe4f6990fa1db4e25a297e",
    availability: [
      { day: "Mon 21 Sep", slots: ["4:00 PM", "5:30 PM"] },
      { day: "Wed 23 Sep", slots: ["10:00 AM", "2:00 PM"] },
      { day: "Fri 25 Sep", slots: ["3:00 PM", "4:30 PM"] }
    ],
    color: "blue",
    docs: [
      {
        id: "doc-5-1",
        title: "Watson Glaser Critical Thinking Drill Set",
        subtitle: "30 realistic practice questions with detailed logical deduction commentary for magic circle law firms",
        type: "free",
        price: 0,
        format: "PDF",
        pages: "24 pages",
        downloads: 550,
        rating: 4.9,
        category: "Law",
        previewBullets: [
          "Inferences, assumptions, deductions, interpretations and argument evaluation",
          "The exact subtle traps test makers use to distinguish top 5% candidates from average",
          "Timed diagnostic test with score conversion benchmarks for training contracts"
        ]
      },
      {
        id: "doc-5-2",
        title: "Oxford Tutorial Essay Architecture (72+ Marks)",
        subtitle: "The argumentative structure and rhetorical techniques needed for high first-class law essays",
        type: "paid",
        price: 6.50,
        format: "PDF",
        pages: "52 pages",
        downloads: 140,
        rating: 5.0,
        category: "Law",
        previewBullets: [
          "Why passive summaries fail tutorials and how to state an unambiguous thesis in sentence one",
          "Case law deployment: ratio decidendi vs obiter dicta under time pressure",
          "3 annotated 1st-class essays in Tort and Constitutional Law with tutor marginalia"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/emily-watson-bath",
    websites: [
      { label: "Design Portfolio", url: "https://emilywatson.design" },
      { label: "Behance", url: "https://behance.net/emilywatson" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Tue 22 Sep", slots: ["6:30 PM", "7:30 PM"] },
      { day: "Sat 26 Sep", slots: ["11:00 AM", "12:30 PM", "2:00 PM"] }
    ],
    color: "orange",
    docs: [
      {
        id: "doc-6-1",
        title: "Automotive & Hardware Placement Tracker",
        subtitle: "Pre-populated database of 40+ UK automotive and engineering schemes with opening dates and links",
        type: "free",
        price: 0,
        format: "Notion Template",
        pages: "Database template",
        downloads: 380,
        rating: 4.8,
        category: "Engineering",
        previewBullets: [
          "Key opening dates, direct HR portal links, and portfolio requirements for McLaren, Williams, Dyson, Rolls-Royce",
          "Checklist for physical prototype photography requirements in digital PDF submissions"
        ]
      },
      {
        id: "doc-6-2",
        title: "McLaren Placement Winning Portfolio Breakdown",
        subtitle: "The complete 24-page physical & CAD portfolio that landed the McLaren Automotive placement",
        type: "paid",
        price: 6.00,
        format: "PDF",
        pages: "64 pages",
        downloads: 110,
        rating: 4.9,
        category: "Engineering",
        previewBullets: [
          "Full high-res scans of winning submission deck with technical design annotations",
          "How to present FEA stress analysis and DFM (design for manufacturing) to senior engineers",
          "Studio project trade-off defense scripts during interview panels"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/tariq-al-mansoor",
    websites: [
      { label: "ResearchGate", url: "https://researchgate.net/profile/Tariq-Al-Mansoor" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Mon 21 Sep", slots: ["11:00 AM", "1:30 PM"] },
      { day: "Thu 24 Sep", slots: ["10:00 AM", "4:00 PM"] },
      { day: "Sun 27 Sep", slots: ["3:00 PM", "4:30 PM"] }
    ],
    color: "pink",
    docs: [
      {
        id: "doc-7-1",
        title: "Pre-Clinical Med School High-Yield Anki Deck",
        subtitle: "1,200 curated cards for Anatomy & Pharmacology with Netter diagrams and clinical mnemonics",
        type: "free",
        price: 0,
        format: "Anki Deck (.apkg)",
        pages: "1,200 cards",
        downloads: 920,
        rating: 5.0,
        category: "Medicine & Life Sciences",
        previewBullets: [
          "High-yield autonomic nervous system receptors, cranial nerve pathways, and dermatomes",
          "Tested on 3 consecutive cohort top-decile exams with zero bloated cards",
          "Pre-configured optimal FSRS / SM-2 spaced repetition settings for busy medics"
        ]
      },
      {
        id: "doc-7-2",
        title: "OSCE Clinical Station Mark Schemes & Pitfalls Vault",
        subtitle: "45 realistic patient scenarios with examiner grading sheets and communication scripts",
        type: "paid",
        price: 7.50,
        format: "PDF & Checklists",
        pages: "118 pages",
        downloads: 240,
        rating: 5.0,
        category: "Medicine & Life Sciences",
        previewBullets: [
          "Cardiovascular, respiratory, abdominal, and neurological physical exams broken down by second",
          "How to manage angry or anxious actors without losing clinical rapport marks",
          "Post-examination examiner question bank with textbook diagnostic rationales"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/maya-tremblay-warwick",
    websites: [
      { label: "GitHub", url: "https://github.com/mayatremblay" },
      { label: "Blog", url: "https://mayatremblay.io" }
    ],
    pitchVideoUrl: "https://www.loom.com/share/63346d0a7fbe4f6990fa1db4e25a297e",
    availability: [
      { day: "Wed 23 Sep", slots: ["9:00 AM", "11:30 AM", "5:00 PM"] },
      { day: "Fri 25 Sep", slots: ["2:00 PM", "4:00 PM"] }
    ],
    color: "green",
    docs: [
      {
        id: "doc-8-1",
        title: "Quant Interview 30-Day Mental Math Workout",
        subtitle: "Daily drills and probability speed tricks used to pass Jane Street and Citadel mental math screens",
        type: "free",
        price: 0,
        format: "PDF",
        pages: "32 pages",
        downloads: 510,
        rating: 4.9,
        category: "Math",
        previewBullets: [
          "Squaring 2-digit numbers instantly, fractions-to-decimals speed table, cross-multiplication shortcuts",
          "30-day timetable mapped to Zetamac score targets of 55+",
          "Expected value coin-toss and dice game rapid calculation mental shortcuts"
        ]
      },
      {
        id: "doc-8-2",
        title: "Probability & Brainteaser Master Vault",
        subtitle: "85 quantitative finance interview puzzles with step-by-step rigorous solutions",
        type: "paid",
        price: 7.99,
        format: "PDF",
        pages: "96 pages",
        downloads: 195,
        rating: 4.9,
        category: "Math",
        previewBullets: [
          "Bayes' theorem in disguise, Markov chains, random walks, and stopping times",
          "The exact trading desk brainteasers asked in London and Amsterdam proprietary trading firms",
          "Derivations explained intuitively without excessive measure theory jargon"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/lucas-wright-cambridge",
    websites: [
      { label: "Policy Blog", url: "https://lucaswright.co.uk" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Tue 22 Sep", slots: ["5:30 PM", "6:30 PM"] },
      { day: "Thu 24 Sep", slots: ["6:00 PM", "7:00 PM"] },
      { day: "Sat 26 Sep", slots: ["10:30 AM", "12:00 PM"] }
    ],
    color: "blue",
    docs: [
      {
        id: "doc-9-1",
        title: "The 3-Hour Supervision Reading Triage System",
        subtitle: "How to extract the core thesis from 500 pages of academic history books in under 3 hours",
        type: "free",
        price: 0,
        format: "PDF & Notion",
        pages: "14 pages",
        downloads: 360,
        rating: 4.8,
        category: "Humanities & Politics",
        previewBullets: [
          "Intro & conclusion skimming protocol: pinpointing historiographical debates in 15 minutes",
          "Note-taking template that formats arguments directly for weekly essay writing"
        ]
      },
      {
        id: "doc-9-2",
        title: "UK Civil Service Fast Stream Master Guide",
        subtitle: "Situational judgement, work simulation, and assessment centre walkthrough from an offer holder",
        type: "paid",
        price: 4.99,
        format: "PDF",
        pages: "58 pages",
        downloads: 125,
        rating: 4.9,
        category: "Humanities & Politics",
        previewBullets: [
          "Deconstructing Civil Service Success Profiles (Behaviours, Strengths & Ability)",
          "Video interview rubric: scoring top marks on 'Seeing the Big Picture' and 'Delivering at Pace'",
          "Annotated written brief exercise from the final virtual assessment centre"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/sophia-taylor-ai",
    websites: [
      { label: "GitHub", url: "https://github.com/sophiataylor" },
      { label: "HuggingFace", url: "https://huggingface.co/sophiataylor" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Mon 21 Sep", slots: ["7:00 PM", "8:30 PM"] },
      { day: "Wed 23 Sep", slots: ["8:00 PM"] },
      { day: "Sat 26 Sep", slots: ["10:00 AM", "11:30 AM", "1:00 PM"] }
    ],
    color: "orange",
    docs: [
      {
        id: "doc-10-1",
        title: "Undergrad Machine Learning Research Roadmap",
        subtitle: "The 12 foundational papers to read to get into AI labs as an undergraduate, with plain-English notes",
        type: "free",
        price: 0,
        format: "Notion & PDF",
        pages: "Notion database",
        downloads: 580,
        rating: 5.0,
        category: "Tech",
        previewBullets: [
          "Annotated breakdowns of Transformers, LoRA, ResNets, and Diffusion basics",
          "Template email for reaching out to PhD candidates and postdocs for research assistant work"
        ]
      },
      {
        id: "doc-10-2",
        title: "PyTorch & Deep Learning Exam & Project Code Vault",
        subtitle: "Production-ready training loops, LLM fine-tuning scripts, and exam theory proofs",
        type: "paid",
        price: 5.99,
        format: "Code Repo & PDF",
        pages: "72 pages · GitHub repo",
        downloads: 170,
        rating: 4.9,
        category: "Tech",
        previewBullets: [
          "Clean modular PyTorch boilerplate with Weights & Biases logging and mixed precision",
          "Backpropagation manual derivations and optimizer math (Adam, SGD with momentum)"
        ]
      }
    ]
  },
  {
    id: 11,
    name: "Liam Fletcher",
    year: "1st year (MEng)",
    major: "Electrical Engineering",
    university: "Durham University",
    bio: "won 1st place in Durham's freshers hackathon and captained our solar rover telemetry system in term 1. secured a clean-tech student grant. happy to chat about hitting the ground running in freshers term, hardware projects, and building momentum early.",
    topTip: "“join an ambitious student engineering society in week 2 of fresher's term. it'll teach you 10x more than lectures.”",
    topTipColor: "blush",
    achievements: ["startup-founder", "patent-filed", "society-president"],
    helpsWith: ["hardware projects", "hackathons", "funding grants", "engineering projects"],
    rating: 4.8,
    callsCompleted: 34,
    linkedin: "https://www.linkedin.com/in/liam-fletcher-durham",
    websites: [
      { label: "GitHub", url: "https://github.com/liamfletcher" },
      { label: "Hardware Lab", url: "https://liamfletcher.dev" }
    ],
    pitchVideoUrl: "https://www.loom.com/share/63346d0a7fbe4f6990fa1db4e25a297e",
    availability: [
      { day: "Tue 22 Sep", slots: ["4:00 PM", "5:30 PM"] },
      { day: "Fri 25 Sep", slots: ["10:00 AM", "11:30 AM"] },
      { day: "Sat 26 Sep", slots: ["3:00 PM", "4:30 PM"] }
    ],
    color: "green",
    docs: [
      {
        id: "doc-11-1",
        title: "Freshers Student Hardware & Hackathon Starter Guide",
        subtitle: "UK component suppliers, fast turnaround PCB prototyping, and student grant application templates",
        type: "free",
        price: 0,
        format: "PDF",
        pages: "20 pages",
        downloads: 310,
        rating: 4.8,
        category: "Engineering",
        previewBullets: [
          "JLCPCB & Mouser ordering tricks to minimize shipping delays for student competitions",
          "How our Durham team secured £1,500 in clean-tech student innovation grants in term 1"
        ]
      }
    ]
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
    linkedin: "https://www.linkedin.com/in/chloe-jenkins-st-andrews",
    websites: [
      { label: "ORCID", url: "https://orcid.org/0000-0002-1825-0097" },
      { label: "Research Lab", url: "https://chloejenkins.bio" }
    ],
    pitchVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    availability: [
      { day: "Mon 21 Sep", slots: ["2:00 PM", "3:30 PM"] },
      { day: "Thu 24 Sep", slots: ["11:00 AM", "1:30 PM"] },
      { day: "Sun 27 Sep", slots: ["4:00 PM", "5:30 PM"] }
    ],
    color: "pink",
    docs: [
      {
        id: "doc-12-1",
        title: "Cold Emailing Lab PIs for Summer Research (That Actually Converts)",
        subtitle: "The exact email that landed summer placements at the Francis Crick Institute and Oxford",
        type: "free",
        price: 0,
        format: "PDF",
        pages: "16 pages",
        downloads: 440,
        rating: 4.9,
        category: "Medicine & Life Sciences",
        previewBullets: [
          "The 3-paragraph formula that proves you actually read their latest lab paper",
          "How to ask for funding without sounding presumptuous or high-maintenance"
        ]
      },
      {
        id: "doc-12-2",
        title: "Biochemistry Metabolic Pathways High-Yield Mindmaps",
        subtitle: "Every major metabolic pathway mapped out with regulatory steps, enzymes & past exam essays",
        type: "paid",
        price: 4.50,
        format: "PDF",
        pages: "54 pages",
        downloads: 135,
        rating: 5.0,
        category: "Medicine & Life Sciences",
        previewBullets: [
          "Color-coded enzyme cofactors and high-energy phosphate tracking for Glycolysis, TCA & Beta-Oxidation",
          "Rate-limiting step flash sheets with allosteric activators and inhibitors",
          "Annotated past exam essay questions on enzyme kinetics (Michaelis-Menten & Lineweaver-Burk)"
        ]
      }
    ]
  }
];

// Flattened helper to retrieve all docs with their mentor attached
export function getAllDocs() {
  const list = [];
  MENTORS.forEach(m => {
    if (m.docs && Array.isArray(m.docs)) {
      m.docs.forEach(d => {
        list.push({
          ...d,
          mentorId: m.id,
          mentorName: m.name,
          mentorUniversity: m.university,
          mentorMajor: m.major,
          mentorYear: m.year,
          mentorRating: m.rating,
          mentorPhotoUrl: m.photoUrl || null,
          mentorAvatarColor: m.color || 'blue',
          mentor: {
            id: m.id,
            name: m.name,
            university: m.university,
            major: m.major,
            year: m.year,
            rating: m.rating,
            photoUrl: m.photoUrl || null
          }
        });
      });
    }
  });
  return list;
}

// Find a single doc by ID
export function getDocById(docId) {
  for (const m of MENTORS) {
    if (m.docs) {
      const found = m.docs.find(d => d.id === docId);
      if (found) {
        return {
          ...found,
          mentorId: m.id,
          mentorName: m.name,
          mentorUniversity: m.university,
          mentorMajor: m.major,
          mentorYear: m.year,
          mentorRating: m.rating,
          mentorPhotoUrl: m.photoUrl || null,
          mentorAvatarColor: m.color || 'blue',
          mentor: {
            id: m.id,
            name: m.name,
            university: m.university,
            major: m.major,
            year: m.year,
            rating: m.rating,
            photoUrl: m.photoUrl || null
          }
        };
      }
    }
  }
  return null;
}

// Standardized Achievement Tags with Category & Matching Semantic Icons
export const ACHIEVEMENTS = {
  // Career & Corporate (Sky Blue)
  "goldman-intern": { label: "goldman sachs intern", icon: "briefcase", category: "career", color: "sky" },
  "stripe-offer": { label: "stripe software engineer", icon: "code", category: "career", color: "sky" },
  "google-offer": { label: "google ux researcher", icon: "sparkle", category: "career", color: "sky" },
  "dyson-grad-scheme": { label: "dyson grad scheme", icon: "rocket", category: "career", color: "sky" },
  "magic-circle-offer": { label: "clifford chance vacation scheme", icon: "medal", category: "career", color: "sky" },
  "mclaren-placement": { label: "mclaren automotive placement", icon: "trophy", category: "career", color: "sky" },
  "quant-intern": { label: "jane street quant intern", icon: "lightning", category: "career", color: "sky" },
  "civil-service-offer": { label: "civil service fast stream", icon: "flag", category: "career", color: "sky" },
  "crick-institute-alum": { label: "francis crick institute intern", icon: "microscope", category: "career", color: "sky" },

  // Academic Excellence (Amber Gold)
  "first-class-honours": { label: "first class honours (1st)", icon: "mortarboard", category: "academic", color: "amber" },
  "top-of-cohort": { label: "top of cohort (rank 1)", icon: "trophy", category: "academic", color: "amber" },
  "dissertation-prize": { label: "faculty dissertation prize", icon: "star", category: "academic", color: "amber" },
  "funded-phd": { label: "fully-funded oxford phd", icon: "sparkle", category: "academic", color: "amber" },

  // Entrepreneurship & Hackathons (Sprout Green)
  "yc-alumni": { label: "y combinator (S23)", icon: "rocket", category: "startup", color: "green" },
  "hackathon-winner": { label: "hackathon winner (1st place)", icon: "trophy", category: "startup", color: "green" },
  "patent-filed": { label: "patent co-inventor", icon: "lightbulb", category: "startup", color: "green" },
  "open-source": { label: "1k+ github stars", icon: "code", category: "startup", color: "green" },
  "startup-founder": { label: "student startup founder", icon: "rocket", category: "startup", color: "green" },
  "spring-week-alum": { label: "3x spring week conversions", icon: "medal", category: "startup", color: "green" },
  "formula-student-lead": { label: "formula student lead", icon: "lightning", category: "startup", color: "green" },

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
  "Tech",
  "Law",
  "Engineering",
  "Math",
  "Medicine & Life Sciences",
  "Humanities & Politics",
  "Languages & Arts",
  "Economics & Finance"
];

// Mapping mentors' degrees to subject filter categories
export const SUBJECT_MAP = {
  "Computer Science": "Tech",
  "Economics & Finance": "Economics & Finance",
  "Human-Computer Interaction": "Tech",
  "Mechanical Engineering": "Engineering",
  "Law (Jurisprudence)": "Law",
  "Product Design Engineering": "Engineering",
  "Medicine": "Medicine & Life Sciences",
  "Mathematics & Statistics": "Math",
  "History & Politics": "Humanities & Politics",
  "Data Science & AI": "Tech",
  "Electrical Engineering": "Engineering",
  "Biochemistry": "Medicine & Life Sciences",
  "Modern Languages & Cultures": "Languages & Arts",
  "Architecture": "Languages & Arts",
  "English Literature": "Languages & Arts"
};

// UK University Year filter options
export const YEAR_FILTERS = [
  "all years",
  "1st year",
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
