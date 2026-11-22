/* Source-of-truth data for the public portfolio. Deliberately excludes private game deployment URLs. */
window.PORTFOLIO = {
  projects: [
    {
      id: 'srmedu',
      systemFlow: { layout: 'branches', nodes: [
        { name: 'Study interface', layer: 'Vanilla JavaScript', detail: 'The modular academic workspace brings the subject catalogue, exam intelligence and study tools together.', connects: [1, 2, 3] },
        { name: 'Offline access', layer: 'PWA caching', detail: 'Offline-first caching reduces network dependence for eligible study content. Online tools still require their configured services.', connects: [] },
        { name: 'Accounts & progress', layer: 'Firebase Auth / Firestore', detail: 'Firebase modules support authentication and account-linked progress. Cloud features can vary by production rollout.', connects: [] },
        { name: 'Documents & tutor', layer: 'Drive / BYOK providers', detail: 'Cloud document integration and a subject-aware, multi-model tutor extend the study workspace. These integrations depend on configured external services.', connects: [] }
      ] },
      decision: "Offline content access reduces network dependence. Account, document and tutor features still depend on their configured services.",
      preview: { src: 'assets/media/srmedu-dashboard-provided-20261121.jpg', alt: 'SRM Smart Study Hub dashboard showing the semester catalogue and study tools', label: 'OWNER-SUPPLIED DASHBOARD · 21 NOV 2026', width: 1024, height: 666 }, num: '01', title: 'SRM Smart Study Hub', short: 'Course resources, exam intelligence and study tools in one academic workspace.',
      category: 'product', categories: ['EDTECH', 'PRODUCT ENGINEERING'], year: '2026', status: 'LIVE PRODUCT',
      highlights: [['Content', '67 subjects · 6 semesters'], ['Delivery', 'Offline-first PWA'], ['Integrations', 'Firebase · Drive · BYOK tutor']],
      theme: 'study', size: 'wide', role: 'Independent creator & developer',
      link: 'https://www.srmedu.in/', linkLabel: 'Visit live platform', source: null,
      lead: 'Making university learning less fragmented, more focused, and actually useful.',
      problem: 'Notes, slides, exam papers and study tools often live in disconnected folders and apps. Finding the right material — and figuring out what matters — takes time students do not have.',
      solution: 'An independent academic workspace organizing 67 listed subjects across six semesters, with previous-year question analysis, topic heatmaps, an embedded compiler, formula tools, active recall and subject-aware AI support.',
      architecture: 'Modular vanilla JavaScript, offline-first PWA caching, Firebase Auth / Firestore modules, cloud document integration and a BYOK multi-model tutor. Some cloud features may vary by production rollout.',
      proof: 'Reported 802 active users and 7,853 events during 2 Oct–10 Nov 2026. Analytics figures are owner-reported.',
      note: 'Student-built, independent and not officially affiliated with SRMIST. Usage figures are from project analytics as reported in the CV.',
      technologies: ['JavaScript', 'Firebase', 'PWA', 'Google Drive API', 'Gemini / Claude', 'HTML / CSS'],
      concepts: ['Exam-intelligence architecture', 'Offline-first content access', 'Study workflows', 'Multi-model learning assistance']
    },
    {
      id: 'kv',
      systemFlow: { layout: 'pipeline', nodes: [
        { name: 'Model & context', layer: 'Qwen2.5-1.5B', detail: 'PyTorch and Hugging Face Transformers provide the model used in the documented long-context experiments.', connects: [1] },
        { name: 'Select retained states', layer: 'Observation-guided retention', detail: 'Record-aware selection is compared against sliding-window, StreamingLLM-style and static H2O-style baselines.', connects: [2] },
        { name: 'Decode within budget', layer: 'KV budget / absolute RoPE', detail: 'Exact post-decode KV budget enforcement and absolute RoPE positions address decoding correctness.', connects: [3] },
        { name: 'Evaluate & compare', validation: true, layer: 'Reproducible artifacts', detail: 'Reproducible seeds and independently checked benchmark artifacts support the corrected 60-question experiment. General reliability remains unestablished.', connects: [] }
      ] },
      decision: "Retaining fewer KV states lowers retained-cache size. The documented recall difference and unresolved consistency issues constrain the result.",
      num: '02', title: 'Less memory. More context.', short: 'Researching KV-cache compression for long-context LLMs.',
      category: 'research', categories: ['LLM SYSTEMS', 'RESEARCH'], year: '2026', status: 'EXPERIMENTAL',
      theme: 'kv', size: 'normal', role: 'Research contributor · Team AutonomOS',
      link: 'https://github.com/dharaksh2807-svg/iitB/blob/main/PHASE3_RESEARCH_REPORT.md', linkLabel: 'Explore the research', source: 'https://github.com/dharaksh2807-svg/iitB',
      lead: 'What can a language model remember when its working memory is constrained?',
      problem: 'Autoregressive inference retains key/value states that grow with context length. Reducing retained states without collapsing recall requires careful selection and correct decoding.',
      solution: 'Built and evaluated an observation-guided cache retention pipeline, comparing record-aware selection against sliding-window, StreamingLLM-style and static H2O-style baselines on synthetic long-context questions.',
      architecture: 'PyTorch + Hugging Face Transformers on Qwen2.5-1.5B. Exact post-decode KV budget enforcement, absolute RoPE positions, reproducible seeds and independently checked benchmark artifacts.',
      proof: 'One corrected 60-question experiment: 42.53 MiB → 7.11 MiB mean retained KV; 83.3% full-cache recall versus 80.0% compressed recall.',
      note: 'Experimental result only. Peak-memory savings and general long-context reliability have not been established. The repository documents unresolved consistency limitations.',
      technologies: ['Python', 'PyTorch', 'Transformers', 'Qwen2.5', 'MPS', 'Benchmarking'],
      concepts: ['Memory-efficient inference', 'Retention policies', 'Reproducible evaluation', 'Failure analysis']
    },
    {
      id: 'projectmatch',
      systemFlow: { layout: 'pipeline', nodes: [
        { name: 'Collaboration UI', layer: 'Next.js / TypeScript', detail: 'Project and skill profiles, role applications and messaging form the collaboration interface.', connects: [1] },
        { name: 'Application workflows', layer: 'NextAuth / weighted matching', detail: 'Authenticated workflows coordinate weighted compatibility, recruitment, messaging and configurable AI provider calls.', connects: [2] },
        { name: 'Relational persistence', layer: 'Prisma / PostgreSQL', detail: 'The repository confirms 28 Prisma schema models for the project’s relational data.', connects: [3] },
        { name: 'Test infrastructure', validation: true, layer: 'Vitest / Playwright', detail: 'The documented test stack covers application behavior. Performance and ranking claims still depend on their test or organizer evidence.', connects: [] }
      ] },
      decision: "Weighted compatibility makes ranking explicit. Its usefulness still needs evaluation with real teams and configured provider services.",
      preview: { src: 'assets/media/projectmatch-capture-01.webp', alt: 'ProjectMatch public collaboration platform', label: 'PUBLIC INTERFACE · 19 NOV 2026', width: 1280, height: 800 }, num: '03', title: 'ProjectMatch', short: 'Skills-based team matching and project collaboration.',
      category: 'product', categories: ['FULL STACK', 'COLLABORATION'], year: '2026', status: 'LIVE DEMO',
      theme: 'match', size: 'normal', role: 'Independent developer',
      link: 'https://projectmatch-phi.vercel.app/', linkLabel: 'Explore the app', source: 'https://github.com/dharaksh2807-svg/projectmatch',
      lead: 'A better way to find the right people for ambitious projects.',
      problem: 'Student teams commonly form through existing networks rather than aligning around complementary skills, time availability and project needs.',
      solution: 'A skills-based collaboration and hackathon-discovery platform with weighted compatibility, role applications, project workflows, messaging and multi-model AI tooling.',
      architecture: 'Next.js + TypeScript, PostgreSQL with 28 Prisma models, NextAuth, provider SDKs, test infrastructure with Vitest and Playwright.',
      proof: '28 Prisma schema models confirmed in repository. Hackathon ranking and performance metrics remain organizer / test-evidence dependent.',
      note: 'Development is ongoing. Features depend on application configuration and external service availability.',
      technologies: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'Prisma', 'Playwright'],
      concepts: ['Weighted ranking', 'Relational data modeling', 'Authentication', 'Project collaboration']
    },
    {
      id: 'metro',
      systemFlow: { layout: 'pipeline', nodes: [
        { name: 'Generated track', layer: 'Procedural generation', detail: 'Procedural tracks and obstacles create the runner’s changing environment.', connects: [1] },
        { name: 'Movement & collision', layer: 'TypeScript / game systems', detail: 'Three-lane movement, train-roof traversal and collisions must stay synchronized as the game speeds up.', connects: [2] },
        { name: 'World & feedback', layer: 'Three.js / WebGL / Web Audio', detail: 'Real-time rendering and audio present the dynamic world, collectibles and powers.', connects: [3] },
        { name: 'Gameplay regression', validation: true, layer: 'Tests in development', detail: 'Automated gameplay regression tests are in development. Solvability and collision behavior need evidence across generated sequences.', connects: [] }
      ] },
      decision: "Procedural generation creates variety. Solvability and collision behavior need gameplay regression evidence across generated sequences.",
      num: '04', title: 'Metro Runner 3D', short: 'An endless runner built from geometry, systems and timing.',
      category: 'interactive', categories: ['REAL-TIME 3D', 'GAME DEVELOPMENT'], year: '2026', status: 'IN DEVELOPMENT',
      theme: 'metro', size: 'compact', role: 'Independent developer',
      link: null, linkLabel: null, source: null,
      lead: 'Designing the kind of moment-to-moment play that feels good before it looks impressive.',
      problem: 'Procedural runners are deceptively complex: movement, train geometry, collisions and generated obstacles must stay synchronized at increasingly high speeds.',
      solution: 'A browser-based 3D endless runner with three-lane movement, train-roof traversal, dynamic environments, collectible systems, powers and persistent progression.',
      architecture: 'Three.js, TypeScript, WebGL and Vite, with procedural track generation, collision systems, Web Audio, and automated gameplay regression tests.',
      proof: 'Technical systems and tests are in development. Public release and final visual-quality certification are not claimed.',
      note: 'Metro Runner is in private development. No playable deployment or source repository is linked from this portfolio; visuals are original conceptual art.',
      technologies: ['Three.js', 'TypeScript', 'WebGL', 'Vite', 'Procedural generation', 'Physics'],
      concepts: ['Collision engineering', 'Procedural solvability', 'World generation', 'Performance']
    },
    {
      id: 'oodp',
      systemFlow: { layout: 'branches', nodes: [
        { name: 'Learning interface', layer: 'HTML / CSS / JavaScript', detail: 'An interactive learning site organizes five teaching units, 30+ topics and 100+ code examples.', connects: [1, 2, 3] },
        { name: 'Runtime explanations', layer: 'Visual learning models', detail: 'Visual explanations and dry runs cover memory behavior, dispatch, exception flow, pitfalls and practice.', connects: [] },
        { name: 'Run C++ examples', layer: 'Embedded execution', detail: 'Embedded C++ execution supports experimentation with examples. Compiler integration introduces an external service dependency.', connects: [] },
        { name: 'Revision & assistance', layer: 'Study workflows / AI support', detail: 'Revision workflows and AI support complement the teaching material. AI integration depends on its external services.', connects: [] }
      ] },
      decision: "Embedded execution supports experimentation. External compiler and AI integrations introduce service dependencies.",
      preview: { src: 'assets/media/oodp-capture-01.webp', alt: 'OODP Mastery public learning interface', label: 'PUBLIC INTERFACE · 19 NOV 2026', width: 1280, height: 800 }, num: '05', title: 'OODP Mastery', short: 'C++ learning through explanations, runtime models and executable examples.',
      category: 'product', categories: ['EDTECH', 'C++ LEARNING'], year: '2026', status: 'LIVE PRODUCT',
      theme: 'oodp', size: 'compact', role: 'Independent creator & developer',
      link: 'https://oops-mastery.netlify.app/', linkLabel: 'Explore learning platform', source: 'https://github.com/dharaksh2807-svg/oops-mastery.',
      lead: 'Helping students understand what their code does — not just memorize definitions.',
      problem: 'Many students study object-oriented programming as vocabulary, without grasping memory behavior, dispatch, exception flow or why a design works.',
      solution: 'Five teaching units, 30+ topics, 100+ code examples and a 12-layer learning method covering intuition, internal behavior, dry runs, pitfalls and practice.',
      architecture: 'An interactive HTML, CSS and JavaScript learning site with embedded C++ execution, visual explanations, revision workflows and AI support.',
      proof: 'Reported 2,765 active users, 71,726 events during 1–28 May 2026; analytics source documented in the master CV.',
      note: 'Analytics figures are self-reported in provided career records. They are not independent third-party certification.',
      technologies: ['C++', 'JavaScript', 'HTML / CSS', 'Compiler integration', 'Netlify'],
      concepts: ['Learning design', 'Runtime reasoning', 'Exam workflows', 'Interactive examples']
    },
    {
      id: 'fairshift',
      systemFlow: { layout: 'pipeline', nodes: [
        { name: 'Worker & employer', layer: 'Next.js dashboards', detail: 'Separate dashboards expose attendance transitions, wage discrepancies and structured disputes.', connects: [1] },
        { name: 'Authorized records', layer: 'Supabase / PostgreSQL RLS', detail: 'Row-level security centralizes access constraints around the prototype’s database records.', connects: [2] },
        { name: 'Transactional pay rules', layer: 'SQL / integer-paise arithmetic', detail: 'Transactional SQL functions and integer-paise arithmetic support sector-specific pay calculations.', connects: [3] },
        { name: 'Focused validation', validation: true, layer: 'App / SQL audit', detail: 'The repository pre-submission audit records 62 passing focused app/SQL tests. Production readiness remains unverified.', connects: [] }
      ] },
      decision: "Database transactions and row-level security centralize correctness constraints. The documented local tests leave production readiness unverified.",
      num: '06', title: 'FairShift', short: 'Making work hours, wages and disputes easier to understand.',
      category: 'product', categories: ['FULL STACK', 'HACKATHON'], year: '2026', status: 'HACKATHON PROTOTYPE',
      theme: 'fair', size: 'compact', role: 'Independent developer',
      link: null, linkLabel: null, source: 'https://github.com/dharaksh2807-svg/hackathon',
      lead: 'The details of a payslip should never be a mystery.',
      problem: 'Workers and employers need understandable records of shifts, overtime, breaks and disagreements over calculated wages.',
      solution: 'Separate worker and employer dashboards, attendance state transitions, sector-specific pay rules, discrepancy detection and structured dispute resolution.',
      architecture: 'Next.js and Supabase/PostgreSQL with row-level security, transactional SQL functions and integer-paise financial arithmetic.',
      proof: 'Repository pre-submission audit records 62 passing focused app/SQL tests. Live deployment readiness was not established.',
      note: 'This is a hackathon prototype; not a live payroll or payment-processing service.',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Supabase', 'RLS', 'SQL testing'],
      concepts: ['Financial correctness', 'Authorization', 'Transactional workflows', 'Accessible UI']
    }
  ],
  archive: []
};
