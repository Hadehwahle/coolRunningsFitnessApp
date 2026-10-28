import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import BlogPost from './src/models/BlogPost.js';
import Run from './src/models/Run.js';
import ForumThread from './src/models/ForumThread.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await User.deleteMany({});
    await BlogPost.deleteMany({});
    await Run.deleteMany({});
    await ForumThread.deleteMany({});
    console.log('Existing data cleared');

    // ── Users ──────────────────────────────────────────────────────────────
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@coolrunningsfitness.com',
      password: 'Admin123!',
      role: 'admin',
      bio: 'Platform administrator and running enthusiast',
    });

    const authors = await User.create([
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@coolrunningsfitness.com',
        password: 'Password123!',
        bio: 'Certified running coach and marathon finisher with 10+ years of experience helping runners of all levels reach their goals.',
        role: 'user',
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@coolrunningsfitness.com',
        password: 'Password123!',
        bio: 'Elite marathon runner and certified USATF coach. Has guided over 500 runners across marathon finish lines worldwide.',
        role: 'user',
      },
      {
        name: 'Emma Davis',
        email: 'emma.davis@coolrunningsfitness.com',
        password: 'Password123!',
        bio: 'Registered dietitian and competitive trail runner specialising in endurance sports nutrition.',
        role: 'user',
      },
      {
        name: 'Dr. James Wilson',
        email: 'james.wilson@coolrunningsfitness.com',
        password: 'Password123!',
        bio: 'Sports medicine physician with 15 years of experience treating endurance athletes.',
        role: 'user',
      },
      {
        name: 'Alex Martinez',
        email: 'alex.martinez@coolrunningsfitness.com',
        password: 'Password123!',
        bio: 'Gear editor and running coach. Has tested over 200 pairs of running shoes since 2015.',
        role: 'user',
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.anderson@coolrunningsfitness.com',
        password: 'Password123!',
        bio: 'Amateur runner, blogger, and mum of three who discovered running at age 38.',
        role: 'user',
      },
    ]);

    const regularUsers = await User.create([
      {
        name: 'John Runner',
        email: 'john@example.com',
        password: 'Password123!',
        bio: 'Marathon runner and fitness coach',
      },
      {
        name: 'Kwame Asante',
        email: 'kwame@example.com',
        password: 'Password123!',
        bio: 'Beginner runner, loving the journey!',
      },
      {
        name: 'Yemi Fashola',
        email: 'yemi@example.com',
        password: 'Password123!',
        bio: 'Speed training enthusiast',
      },
    ]);

    console.log('Users created');

    // ── Blog Posts ─────────────────────────────────────────────────────────
    const [sarah, mike, emma, james, alex, lisa] = authors;

    await BlogPost.create([
      // ── Post 1 ────────────────────────────────────────────────────────────
      {
        title: '10 Essential Tips for Beginner Runners',
        slug: '10-essential-tips-for-beginner-runners',
        excerpt: 'Starting your running journey? These fundamental tips will help you build a strong foundation and avoid the most common beginner mistakes.',
        content: `
<p>Starting to run is one of the best decisions you can make for your health and well-being. But like any new endeavour, beginning without proper guidance can lead to frustration, injury, or burnout. Here are ten essential tips to set you on the path to becoming a confident, consistent runner.</p>

<h2>1. Start Slower Than You Think You Should</h2>
<p>Most beginners run too fast, too soon. You should be able to hold a full conversation while running — if you're gasping for breath, slow down. This is called the "talk test" and it ensures you're training aerobically rather than burning out in the first mile.</p>

<h2>2. Invest in the Right Shoes</h2>
<p>Visit a speciality running store where staff can analyse your gait and recommend the right shoe for your foot type. A proper pair of running shoes reduces injury risk dramatically and makes running far more comfortable. Don't run in cross-trainers or fashion trainers.</p>

<h2>3. Follow the 10% Rule</h2>
<p>Never increase your weekly mileage by more than 10% from one week to the next. This gradual progression allows your muscles, tendons, and bones to adapt to the new stress of running. Most overuse injuries happen because people ramp up too quickly.</p>

<h2>4. Warm Up and Cool Down</h2>
<p>Always start with a 5-minute brisk walk to warm your muscles, and finish with easy walking and stretching. Dynamic stretches before (leg swings, high knees) and static stretches after help prevent injury and reduce next-day soreness.</p>

<h2>5. Rest Days Are Not Optional</h2>
<p>Your body gets stronger during rest, not during exercise. Schedule at least 1–2 rest days per week, especially as a beginner. Active recovery like gentle walking or yoga is absolutely fine on these days — just no running.</p>

<h2>6. Run by Effort, Not Pace</h2>
<p>Ignore your watch at first. Focus on how your body feels. Running should feel comfortably challenging — not a death march, not a stroll. As your fitness improves, the same effort will naturally yield faster paces over time.</p>

<h2>7. Hydrate Before, During, and After</h2>
<p>For runs under 45 minutes, drinking before and after is usually sufficient. For longer runs, bring water or plan a route near fountains. Arrive at every run well hydrated — your urine should be pale yellow, not dark amber.</p>

<h2>8. Find a Running Partner or Group</h2>
<p>Accountability is a superpower. Running with others makes the time pass faster, keeps you motivated on tough days, and introduces you to a wonderful community of like-minded people. Look for a local parkrun or running club near you.</p>

<h2>9. Track Your Progress</h2>
<p>Use a running app or journal to log every run — distance, time, how you felt. Seeing your progress, even small improvements, is incredibly motivating and helps you identify patterns that inform smarter training decisions.</p>

<h2>10. Celebrate Every Run</h2>
<p>Every single run, no matter how slow or short, is an accomplishment. You are doing something remarkable for your body and mind. Be proud of every step. Your future self will thank you for every mile you put in today.</p>

<p>Running is a journey, not a destination. Embrace the process, be patient with yourself, and enjoy every mile.</p>
        `.trim(),
        author: sarah._id,
        category: 'Beginner Tips',
        tags: ['beginners', 'tips', 'running form', 'training'],
        readTime: 8,
        published: true,
        featured: true,
        views: 3240,
        featuredImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop',
      },

      // ── Post 2 ────────────────────────────────────────────────────────────
      {
        title: 'Marathon Training: 16-Week Complete Guide',
        slug: 'marathon-training-16-week-guide',
        excerpt: 'A comprehensive 16-week training plan designed to get you ready for your first marathon or smash your current personal best.',
        content: `
<p>Training for a marathon is one of the most rewarding athletic challenges you can take on. This 16-week plan is designed for runners who can comfortably run 3–4 days per week and complete a long run of at least 10 miles. If you're not quite there yet, spend 4–6 weeks building your base before starting.</p>

<h2>Phase 1: Base Building (Weeks 1–4)</h2>
<p>The first four weeks are all about establishing your aerobic base. The vast majority of your runs should be at easy, conversational pace. You'll run 4 days per week with one long run building from 12 to 16 miles by week 4. Don't worry about pace — just accumulate time on your feet.</p>

<h2>Phase 2: Building Intensity (Weeks 5–10)</h2>
<p>Here we introduce tempo runs — a comfortably hard effort sustained for 20–40 minutes — and longer intervals. Your long run continues to build, reaching 20 miles in week 9. This is the hardest training block. Trust the process when it feels tough; that difficulty is where growth happens.</p>

<h2>Phase 3: Peak and Taper (Weeks 11–16)</h2>
<p>After your longest run in week 11, you begin a gradual taper. Total mileage decreases significantly but intensity stays. By race week, you're running just enough to stay sharp while your muscles fully recover and supercompensate. Many runners feel flat during the taper — this is completely normal.</p>

<h2>Key Workout Types</h2>
<ul>
  <li><strong>Long Runs:</strong> The cornerstone of marathon training. Run 60–90 seconds per mile slower than your goal marathon pace. These build endurance and mental resilience.</li>
  <li><strong>Tempo Runs:</strong> 20–40 minutes at a "comfortably hard" effort — about 10K race pace. These build your lactate threshold, the most important physiological marker for marathon performance.</li>
  <li><strong>Easy Runs:</strong> The majority of your training. Conversational pace, full sentences. These build aerobic base and promote recovery between hard sessions.</li>
  <li><strong>Rest and Cross-Training:</strong> Swimming, cycling, or yoga to maintain cardiovascular fitness without the impact load of running.</li>
</ul>

<h2>Nutrition Strategy</h2>
<p>As your mileage increases, so do your caloric and nutritional needs. Focus on carbohydrate-rich whole foods, adequate protein for muscle repair (aim for 1.4–1.7g per kg bodyweight), and healthy fats. Crucially, practice taking gels or chews during long runs to train your gut — race day is not the time to experiment with new foods.</p>

<h2>Race Day Execution</h2>
<p>Start conservative — the single most common first-marathon mistake is going out too fast in the first 10K and then suffering through miles 18–22. Run the first half at your goal pace, assess how you feel at mile 18, and only push in the final miles if you have genuine reserves. Negative splits (running the second half faster) is the mark of a well-executed marathon.</p>

<h2>When Things Go Wrong</h2>
<p>Missed sessions happen. Don't try to "make up" missed miles — just continue from where you are. One bad week doesn't ruin a 16-week training cycle. What matters is consistent effort over months, not perfection on any given day.</p>
        `.trim(),
        author: mike._id,
        category: 'Training Plans',
        tags: ['marathon', 'training plan', 'long distance', 'race prep'],
        readTime: 12,
        published: true,
        featured: false,
        views: 2180,
        featuredImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&auto=format&fit=crop',
      },

      // ── Post 3 ────────────────────────────────────────────────────────────
      {
        title: 'Pre-Run Nutrition: What to Eat and When',
        slug: 'pre-run-nutrition-guide',
        excerpt: 'Optimise your performance with the right nutrition strategy. Learn exactly what to eat before your runs for maximum energy and zero GI distress.',
        content: `
<p>What you eat before a run can make or break your performance. The goal is to top up glycogen stores, prevent hunger mid-run, and avoid gastrointestinal distress — all while timing your intake correctly around your session.</p>

<h2>2–3 Hours Before: The Main Pre-Run Meal</h2>
<p>If you have time, eat a carbohydrate-focused meal with moderate protein and low fat and fibre (both slow digestion and increase GI risk). Excellent options include oatmeal with banana and honey, a bagel with peanut butter, pasta with a light tomato sauce, or rice with chicken and vegetables. Aim for 1–4g of carbohydrates per kilogram of bodyweight.</p>

<h2>30–60 Minutes Before: Light Top-Up</h2>
<p>If your last proper meal was more than 3 hours ago, have a small, easily digestible snack: a banana, a few medjool dates, a rice cake with jam, or half an energy bar. Avoid anything high in fat, fibre, or protein at this stage as these significantly slow gastric emptying.</p>

<h2>Running on Empty: Fasted Runs</h2>
<p>Easy morning runs under 60 minutes can often be done fasted, particularly for runners developing fat-burning adaptations. However, if you feel sluggish or are doing any kind of hard workout — intervals, tempo, long run — eat something beforehand. Performance suffers when you train on empty in these conditions.</p>

<h2>What to Avoid Before Running</h2>
<ul>
  <li><strong>High-fibre foods</strong> — beans, bran cereals, raw cruciferous vegetables. These ferment in the gut and cause cramping and urgency.</li>
  <li><strong>High-fat meals</strong> — fried food, heavy cheese, cream sauces. Fat dramatically slows gastric emptying.</li>
  <li><strong>New foods on race day</strong> — never try something for the first time before an important run. Stick to your practised routine.</li>
  <li><strong>Excessive caffeine</strong> — while moderate caffeine is a proven performance enhancer, too much causes GI distress and anxiety in some runners.</li>
  <li><strong>Carbonated drinks</strong> — the gas causes bloating and discomfort during running.</li>
</ul>

<h2>Hydration Is Part of Nutrition</h2>
<p>Arrive at every run well hydrated. Drink 400–600ml of water 2 hours before and another 200ml in the 20 minutes before you head out. Even mild dehydration (as little as 2% bodyweight loss) meaningfully impairs performance and increases perceived effort. Check your urine — pale straw yellow is the target.</p>

<h2>During Your Run</h2>
<p>For runs under 60–75 minutes, water is all you need. Beyond that, aim for 30–60g of carbohydrates per hour from gels, chews, or sports drinks. Start fuelling early — by the time you feel like you need it, you're already behind. Practise this in training, not for the first time on race day.</p>
        `.trim(),
        author: emma._id,
        category: 'Nutrition',
        tags: ['nutrition', 'pre-run', 'fuelling', 'energy', 'hydration'],
        readTime: 6,
        published: true,
        featured: false,
        views: 1560,
        featuredImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop',
      },

      // ── Post 4 ────────────────────────────────────────────────────────────
      {
        title: 'Preventing Running Injuries: The Ultimate Guide',
        slug: 'preventing-running-injuries',
        excerpt: 'Stay healthy and on the road with these proven strategies for preventing the most common running injuries before they happen.',
        content: `
<p>The most common reason runners quit isn't lack of motivation — it's injury. Understanding how to prevent and manage common running injuries is the single most important skill for a long, healthy running career. Here's everything you need to know.</p>

<h2>The Most Common Running Injuries</h2>
<ul>
  <li><strong>Runner's Knee (Patellofemoral Pain Syndrome):</strong> Dull aching pain around or behind the kneecap. Often caused by weak hip abductors and glutes, or overstriding. Very common in beginners ramping up mileage quickly.</li>
  <li><strong>IT Band Syndrome:</strong> Sharp, burning pain on the outer knee, sometimes extending into the hip. Typically triggered by increasing mileage too quickly or running on cambered roads. Notoriously stubborn to treat.</li>
  <li><strong>Plantar Fasciitis:</strong> Stabbing heel pain, classically worst with the first steps in the morning or after sitting. Caused by tight calf muscles, overpronation, and high-impact training on hard surfaces.</li>
  <li><strong>Shin Splints (Medial Tibial Stress Syndrome):</strong> Diffuse pain along the inner shinbone, common in new runners and those rapidly increasing training load. Left untreated, can progress to a stress fracture.</li>
  <li><strong>Achilles Tendinopathy:</strong> Pain and stiffness in the Achilles tendon, especially on morning warm-up. Common in runners who increase speedwork or hill training suddenly.</li>
  <li><strong>Stress Fractures:</strong> Tiny cracks in bones from repetitive impact. Require immediate rest — typically 6–12 weeks off running. Most commonly occur in the tibia, metatarsals, and navicular.</li>
</ul>

<h2>Prevention Strategy 1: Strength Training</h2>
<p>Weak glutes and hip abductors are behind the majority of running injuries. When these muscles fatigue, your pelvis drops, your knee caves in, and your foot strikes poorly — a cascade of biomechanical stress. Incorporate squats, Romanian deadlifts, hip thrusts, clamshells, and single-leg exercises 2–3 times per week. You'll run faster and stay healthier.</p>

<h2>Prevention Strategy 2: Gradual Progression</h2>
<p>The 10% rule exists for a reason. Injuries rarely happen because of any single run — they accumulate from repeatedly exceeding what your connective tissue can handle. Be patient with weekly mileage increases. Your cardiovascular system adapts in weeks; your tendons and bones take months.</p>

<h2>Prevention Strategy 3: Intelligent Recovery</h2>
<p>Sleep is the most powerful recovery tool available to you — aim for 7–9 hours consistently. Add foam rolling, mobility work, and occasional sports massage to maintain tissue quality. Cold water immersion post long-runs reduces inflammation. Don't underestimate recovery days; they're where adaptation happens.</p>

<h2>Prevention Strategy 4: Surface and Footwear Variety</h2>
<p>Running the same surfaces in the same shoes every day creates repetitive stress in identical movement patterns. Mix road, trail, and grass. Rotate between two pairs of shoes with different stack heights. This distributes load across more muscle groups and tissues.</p>

<h2>When to See a Professional</h2>
<p>Seek medical advice if pain worsens during a run, pain persists for more than 2 weeks, pain causes you to alter your gait, or you experience localised bone tenderness (possible stress fracture). Don't try to "run through" significant pain — it almost always makes things worse and prolongs return to running.</p>

<h2>The Mental Side</h2>
<p>Accepting rest when injured is psychologically hard for runners. But cross-training (swimming, cycling, elliptical) maintains fitness during injury without impact. Use the time to address weaknesses — most runners return from injury fitter and more resilient than before, because they finally addressed the underlying causes.</p>
        `.trim(),
        author: james._id,
        category: 'Injury Prevention',
        tags: ['injury prevention', 'recovery', 'strength training', 'health'],
        readTime: 10,
        published: true,
        featured: false,
        views: 1890,
        featuredImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&auto=format&fit=crop',
      },

      // ── Post 5 ────────────────────────────────────────────────────────────
      {
        title: 'Best Running Shoes 2024: Complete Review',
        slug: 'best-running-shoes-2024',
        excerpt: 'Our in-depth review of the top running shoes of 2024 across every category — daily trainers, race day rockets, and trail beasts — tested by real runners.',
        content: `
<p>The running shoe market has never been more exciting — or more overwhelming. Carbon-fibre plates, next-generation super foams, and maximalist stack heights have transformed what's possible. We've tested dozens of models across thousands of miles to bring you this definitive 2024 guide.</p>

<h2>What to Look for in a Running Shoe</h2>
<p>Before diving into categories, understand the key variables: stack height (how much cushioning), drop (height difference between heel and forefoot), stability features, weight, and intended use. There's no universally "best" shoe — only the best shoe for your foot, gait, and goals.</p>

<h2>Best for Daily Training: The Workhorse</h2>
<p>A great daily trainer should be versatile, durable across 400–600 miles, and comfortable for runs of any length. Look for a responsive foam midsole, a moderate stack height (28–32mm), a secure upper, and a weight under 280g (10oz) for men. These shoes handle the bulk of your mileage and need to last. Prioritise feel and fit over brand loyalty.</p>

<h2>Best for Race Day and Speed Workouts: The Carbon Racer</h2>
<p>Carbon-plated shoes have fundamentally changed road racing. The propulsive energy return from a stiff plate combined with ultra-soft, highly resilient foam creates a sensation of mechanical assistance. In controlled studies, the best carbon shoes reduce the oxygen cost of running by 4–8% at race pace — a transformative benefit. However, reserve these for workouts and races. Daily use degrades the foam faster, and the high stack may mask proprioception on normal runs.</p>

<h2>Best for Trail Running: The Grip Master</h2>
<p>Trail shoes need aggressive rubber outsole lugs for traction on loose terrain, a protective rock plate to shield against sharp stones, a snug and secure fit (trail descents put enormous stress on toe boxes), and a slightly lower drop (4–8mm) for better ground feel and ankle stability. Don't run road shoes on technical trails — the consequences of slipping are serious.</p>

<h2>Best for Beginners: The Supportive Starter</h2>
<p>New runners benefit from generous cushioning and light stability features while their running gait develops over the first months. Look for neutral or mild stability options with a wide, comfortable toe box. Avoid going straight to minimal shoes — the transition period is real, and injuries happen when you rush it.</p>

<h2>The Rotation Strategy</h2>
<p>Elite runners rotate between 3–5 different pairs. For most recreational runners, two pairs is ideal: one daily trainer for easy runs and one lighter shoe for workouts and races. Rotating extends the lifespan of both pairs and varies the biomechanical load, reducing overuse injury risk.</p>

<h2>How to Buy Running Shoes</h2>
<p>Visit a running speciality store for a gait analysis. Try shoes on in the afternoon when your feet are at their largest. Bring your running socks. Insist on running in the store — shoes feel completely different at pace compared to walking around a shop floor. And always prioritise fit and feel over aesthetics. The best-looking shoe that doesn't fit is the worst shoe you can buy.</p>
        `.trim(),
        author: alex._id,
        category: 'Equipment',
        tags: ['shoes', 'gear', 'equipment', 'reviews', '2024'],
        readTime: 15,
        published: true,
        featured: false,
        views: 2640,
        featuredImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop',
      },

      // ── Post 6 ────────────────────────────────────────────────────────────
      {
        title: 'My First 5K: A Race Day Story',
        slug: 'my-first-5k-race',
        excerpt: 'Six months ago I couldn\'t run to the end of my street. Last Saturday I crossed the 5K finish line in tears. Here\'s exactly how it went.',
        content: `
<p>Six months ago, I genuinely could not run to the end of my street without stopping, hands on my knees, gasping. My children thought it was hilarious. Last Saturday, I crossed the finish line of my first 5K race with tears streaming down my face and those same children screaming themselves hoarse on the sideline. This is how it went.</p>

<h2>The Beginning</h2>
<p>I started with a Couch to 5K programme — one of the free ones, nothing fancy. Nine weeks of alternating walking and running, three sessions per week. The first session was 60 seconds of running. Sixty seconds. I was embarrassed by how hard even that felt. But I kept going, and by week five I was running for 20 minutes continuously, something I genuinely did not believe I could do when I started.</p>

<h2>The Night Before</h2>
<p>I laid everything out the night before — bib number, safety pins, timing chip, shoes, socks, running kit — like a small altar to race morning. I ate pasta with a simple tomato sauce for dinner, the same meal I'd had before my longest training runs. I was in bed by 9:30pm and proceeded to sleep terribly. Equal parts excitement and nerves. This is completely normal, apparently. Elite athletes sleep badly before races too.</p>

<h2>Race Morning</h2>
<p>Up at 5:30am for a 7:30 start. Light breakfast — a banana and peanut butter on toast, exactly what I'd practised on long run mornings. I wasn't remotely hungry but forced it down knowing I'd need the fuel. I arrived at the race village 45 minutes early, which I'd strongly recommend for first-timers: enough time to collect your bib, use the bathroom three times (you will need to), have a proper warm-up, and just soak in the electric atmosphere of a race morning.</p>

<h2>Standing on the Start Line</h2>
<p>Standing in the start corral, surrounded by hundreds of other runners in their bright kits, something shifted in me. We were all here for the same fundamental reason — to challenge ourselves, to prove something to ourselves. I didn't know any of them. Within an hour, I would feel like they were all my people. The horn sounded.</p>

<h2>Miles One and Two</h2>
<p>I went out too fast. This is the classic first-race mistake that I had read about approximately fifteen times and did anyway. Adrenaline is intoxicating. By the first kilometre I'd burned through my easy effort budget for the whole race. By 1.5km I forced myself to slow down and find a sustainable rhythm, repeating the mantra I'd trained with: "run your own race, run your own race." The crowd support was something I hadn't anticipated — strangers cheering for strangers, which felt oddly and overwhelmingly moving.</p>

<h2>The Final Push</h2>
<p>With about 400 metres to go, I heard my son's voice cut through the crowd noise. Something primally powerful kicked in — some gear I didn't know I owned — and I ran the last 400 metres faster than I'd run anything in six months of training. I crossed the line in 32:47. Nearly four minutes faster than my best training run.</p>

<h2>After the Finish</h2>
<p>I stood there, finisher medal around my neck, and cried properly. Not sad crying — the kind that comes when you've done something you genuinely didn't believe you could do. My daughter ran over and hugged me and asked if I was okay. I told her I was better than okay.</p>

<h2>What I Learned</h2>
<p>You are more capable than you currently believe. The voice that says "you can't do this" is lying to you — it's just a discomfort signal, not a truth. If you are considering signing up for a 5K, sign up today. Don't wait until you're "ready." You become ready by showing up. The race will pull out a version of you that training alone cannot fully reveal. And that person is worth meeting.</p>
        `.trim(),
        author: lisa._id,
        category: 'Race Reviews',
        tags: ['5K', 'race day', 'personal story', 'beginners', 'motivation'],
        readTime: 7,
        published: true,
        featured: false,
        views: 1120,
        featuredImage: 'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=1200&auto=format&fit=crop',
      },
    ]);

    console.log('Blog posts created (6 full posts)');

    // ── Forum Threads ──────────────────────────────────────────────────────
    const [john, kwame, yemi] = regularUsers;

    await ForumThread.create([
      {
        title: 'First Marathon Tips — What Do You Wish You Had Known?',
        content: "I'm signing up for my first marathon in 6 months and I'm equal parts excited and terrified. Those of you who have been through it — what do you wish someone had told you before you started training? Any advice on pacing, nutrition, the taper, or race day itself is welcome!",
        author: john._id,
        category: 'Training & Technique',
        pinned: true,
        views: 142,
        replies: [
          { author: sarah._id, content: 'Start slower than feels comfortable in the first 10K — you will thank yourself at mile 20. The adrenaline on race day makes everyone go out too fast.', createdAt: new Date(Date.now() - 3600000) },
          { author: mike._id, content: 'Do at least two 20-mile long runs in training. One is not enough. And practise your race-day nutrition in every long run — do not try anything new on race day.', createdAt: new Date(Date.now() - 1800000) },
        ],
      },
      {
        title: 'Weekly Running Challenge — Join Us!',
        content: "Starting a weekly community challenge: log at least 3 runs this week, any distance. Drop your results here every Friday. Let's keep each other accountable! Week 1: minimum 3 runs. Who's in?",
        author: kwame._id,
        category: 'Motivation & Support',
        pinned: true,
        views: 89,
        replies: [
          { author: yemi._id, content: "I'm in! Did 5km this morning already. Let's go 💪", createdAt: new Date(Date.now() - 7200000) },
          { author: john._id, content: 'Completed my 3 runs — 5K, 8K and a 10K. Feeling strong this week!', createdAt: new Date(Date.now() - 3600000) },
        ],
      },
      {
        title: 'Best Running Shoes for Beginners Under $100?',
        content: "I'm just starting out and don't want to spend a fortune on shoes yet. Does anyone have recommendations for good beginner running shoes that won't break the bank? I mostly run on roads.",
        author: yemi._id,
        category: 'General Discussion',
        views: 67,
        replies: [
          { author: alex._id, content: "For road running on a budget, look at Brooks Ghost or ASICS Gel-Nimbus older models — they often go on sale under $100 and give great cushioning and support for new runners.", createdAt: new Date(Date.now() - 5400000) },
        ],
      },
      {
        title: 'Recovering from Runner\'s Knee — How Long Did It Take You?',
        content: "I've been diagnosed with patellofemoral pain syndrome (runner's knee) and my physio has told me to take 4 weeks off running. I'm devastated as I was training for a half marathon. Has anyone been through this? How long did your recovery actually take and how did you maintain fitness?",
        author: john._id,
        category: 'Training & Technique',
        views: 53,
        replies: [
          { author: james._id, content: "4 weeks is a reasonable estimate for mild to moderate cases. Use the time for pool running and cycling — both keep your cardio fitness high with zero impact. Come back gradually, no more than 50% of your previous volume.", createdAt: new Date(Date.now() - 10800000) },
        ],
      },
      {
        title: 'What Do You Eat the Night Before a Long Run?',
        content: "I have a 16-mile training run this Saturday and I'm trying to nail my pre-run nutrition. What's your go-to meal the night before a long run? I've heard pasta is the classic but I want to know what actually works for real runners.",
        author: kwame._id,
        category: 'Races & Events',
        views: 38,
        replies: [
          { author: emma._id, content: "Pasta is classic for a reason — high carb, easy to digest. I go for spaghetti with a simple tomato sauce, nothing heavy. Avoid anything high in fat or fibre the night before. And make sure you're well hydrated throughout the day.", createdAt: new Date(Date.now() - 14400000) },
        ],
      },
    ]);

    console.log('Forum threads created (5 starter threads)');

    // ── Sample Runs ────────────────────────────────────────────────────────
    const now = new Date();
    const runs = [];

    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      for (let j = 0; j < 5; j++) {
        const distance = parseFloat((3 + Math.random() * 12).toFixed(2));
        const duration = Math.floor(distance * 300 + Math.random() * 600);
        const startTime = new Date(now.getTime() - j * 86400000 - Math.random() * 43200000);
        const endTime = new Date(startTime.getTime() + duration * 1000);

        runs.push({
          userId: user._id,
          distance,
          duration,
          pace: (duration / 60) / distance,
          calories: Math.floor(distance * 70),
          weather: ['sunny', 'cloudy', 'rainy', 'hot', 'cold'][Math.floor(Math.random() * 5)],
          rating: Math.floor(Math.random() * 2) + 4,
          startTime,
          endTime,
          notes: 'Great run! Feeling strong.',
        });
      }
    }

    await Run.create(runs);
    console.log('Sample runs created');

    // Update user stats
    for (const user of regularUsers) {
      const userRuns = runs.filter((r) => r.userId.equals(user._id));
      const totalDistance = userRuns.reduce((sum, r) => sum + r.distance, 0);
      const totalDuration = userRuns.reduce((sum, r) => sum + r.duration, 0);
      user.totalRuns = userRuns.length;
      user.totalDistance = totalDistance;
      user.totalDuration = totalDuration;
      user.averagePace = (totalDuration / 60) / totalDistance;
      await user.save();
    }

    console.log('User stats updated');
    console.log('\n✅ Database seeded successfully!');
    console.log('\n── Test Accounts ─────────────────────────────────');
    console.log('Admin : admin@coolrunningsfitness.com  / Admin123!');
    console.log('User  : john@example.com               / Password123!');
    console.log('User  : kwame@example.com              / Password123!');
    console.log('──────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

connectDB().then(seedData);
