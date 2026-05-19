export const SEED_DATA = {
  settings: {
    startDate: null,
    targetCalories: 2400,
    targetProtein: 165,
    targetCarbs: 230,
    targetFat: 70,
    athleteWeight: 92.5,
    athleteHeight: 185
  },
  weekSchedule: {
    monday: 'day1',
    tuesday: 'day2',
    wednesday: null,
    thursday: 'day3',
    friday: 'day4',
    saturday: 'day5',
    sunday: null
  },
  gymDays: [
    {
      id: 'day1',
      name: 'Push A',
      subtitle: 'Vertical Emphasis + Quads',
      duration: '60-75 min',
      focus: 'Vertical pushing strength and handstand skill development, paired with quad-dominant lower body and rear-delt accessory work.',
      warmup: '10-minute mobility routine with extra attention to wrists and shoulders.',
      color: '#ef4444',
      exercises: [
        {
          id: 'day1_ex1',
          name: 'Handstand Wall Work',
          sets: '4',
          reps: '20-40 sec',
          notes: 'Skill priority — do first while fresh. Belly to wall, full lockout. Once you can hold 45+ sec, begin shoulder taps.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=chest+to+wall+handstand+tutorial+calisthenics',
          category: 'skill'
        },
        {
          id: 'day1_ex2',
          name: 'Pike Push-ups',
          sets: '4',
          reps: '5-10',
          notes: 'Feet elevated on bench. Aim for nose to floor. Progresses toward handstand push-ups.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=pike+push+up+tutorial+handstand+progression',
          category: 'push'
        },
        {
          id: 'day1_ex3',
          name: 'Dips',
          sets: '4',
          reps: '5-10',
          notes: 'Full ROM, shoulders below elbows at bottom. Use parallel bars if available; bench dips with feet elevated as regression.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=parallel+bar+dips+tutorial+calisthenics',
          category: 'push'
        },
        {
          id: 'day1_ex4',
          name: 'Heel-Elevated Goblet Squat',
          sets: '4',
          reps: '8-10',
          notes: 'Elevate heels ~2 cm. Sit to a box you can reach without losing posture; lower the box every 2-3 weeks as mobility improves.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=heel+elevated+goblet+squat+tutorial',
          category: 'legs'
        },
        {
          id: 'day1_ex5',
          name: 'Face Pulls',
          sets: '3',
          reps: '12-15',
          notes: 'Pull to face, elbows high, external rotation at end range. Key for rear delts and shoulder health.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=face+pull+exercise+tutorial+rear+delts',
          category: 'accessory'
        },
        {
          id: 'day1_ex6',
          name: 'Hollow Hold',
          sets: '3',
          reps: '20-40 sec',
          notes: 'Lower back glued to floor. Reduce arm/leg extension if you cannot maintain contact.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=hollow+body+hold+tutorial+calisthenics',
          category: 'core'
        },
        {
          id: 'day1_ex7',
          name: 'Hanging Knee Raises',
          sets: '3',
          reps: '8-12',
          notes: 'Slow and controlled. Progresses to straight leg raises, then toes-to-bar.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=hanging+knee+raises+tutorial+core',
          category: 'core'
        }
      ]
    },
    {
      id: 'day2',
      name: 'Pull A',
      subtitle: 'Vertical Emphasis + Posterior Chain',
      duration: '60-75 min',
      focus: 'Vertical pulling progressions, posterior chain work (which doubles as hamstring mobility), and biceps.',
      warmup: '10-minute mobility routine with extra attention to scapular control (scap pull-ups, dead hangs).',
      color: '#3b82f6',
      exercises: [
        {
          id: 'day2_ex1',
          name: 'Dead Hang',
          sets: '3',
          reps: '20-45 sec',
          notes: 'Build grip and shoulder endurance. Active shoulders (slight pull-down from the bar) is the cue.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=dead+hang+active+shoulder+tutorial',
          category: 'pull'
        },
        {
          id: 'day2_ex2',
          name: 'Pull-up Progression',
          sets: '5',
          reps: '3-6',
          notes: 'Choose the hardest variation you can do with good form: band-assisted → negatives (5 sec lowering) → full pull-ups. Stop 1 rep shy of failure.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=pull+up+progression+beginner+tutorial+calisthenics',
          category: 'pull'
        },
        {
          id: 'day2_ex3',
          name: 'Inverted Rows',
          sets: '4',
          reps: '6-10',
          notes: 'Body as horizontal as possible. Feet elevated as you progress. Scapular retraction at the top.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=inverted+rows+tutorial+scapular+retraction',
          category: 'pull'
        },
        {
          id: 'day2_ex4',
          name: 'Romanian Deadlift',
          sets: '4',
          reps: '8-10',
          notes: 'Soft knees, hinge at hips, feel the hamstring stretch. Doubles as hamstring mobility — go a bit deeper each week.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=romanian+deadlift+tutorial+hamstring',
          category: 'legs'
        },
        {
          id: 'day2_ex5',
          name: 'Standing Biceps Curl',
          sets: '3',
          reps: '10-12',
          notes: 'Full ROM, slight pause at bottom. Helps fill the calisthenics biceps gap.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+bicep+curl+tutorial+form',
          category: 'accessory'
        },
        {
          id: 'day2_ex6',
          name: 'Standing Calf Raises',
          sets: '4',
          reps: '12-15',
          notes: 'On a step for full ROM. Pause 1 sec at the top. Skating and basketball both load calves heavily.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=calf+raise+tutorial+step+full+rom',
          category: 'accessory'
        },
        {
          id: 'day2_ex7',
          name: 'Hanging Leg Raises',
          sets: '3',
          reps: '6-10',
          notes: 'Avoid swinging. Lower slowly.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=hanging+leg+raises+tutorial+no+swing',
          category: 'core'
        }
      ]
    },
    {
      id: 'day3',
      name: 'Push B',
      subtitle: 'Horizontal Emphasis + Unilateral Legs',
      duration: '60-75 min',
      focus: 'Horizontal pushing variations, single-leg strength (huge carryover to skating and basketball), and lateral/rear delt accessories.',
      warmup: '10-minute mobility routine with extra attention to hips for the split-squat work.',
      color: '#f59e0b',
      exercises: [
        {
          id: 'day3_ex1',
          name: 'Push-up Variation',
          sets: '4',
          reps: '6-12',
          notes: 'Pick the hardest variation where you can hit the rep range with good form. Progression: decline → diamond → archer. Full chest-to-floor depth.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=push+up+progressions+decline+diamond+archer+calisthenics',
          category: 'push'
        },
        {
          id: 'day3_ex2',
          name: 'Ring Push-ups / Deficit Push-ups',
          sets: '3',
          reps: '8-12',
          notes: 'Adds instability and ROM. Rings preferred if available.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=ring+push+up+tutorial+calisthenics',
          category: 'push'
        },
        {
          id: 'day3_ex3',
          name: 'Bulgarian Split Squat',
          sets: '4',
          reps: '8-10 per leg',
          notes: 'Excellent for skating and basketball. Front shin can travel forward. Hold dumbbells if needed for progression.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=bulgarian+split+squat+tutorial+form',
          category: 'legs'
        },
        {
          id: 'day3_ex4',
          name: 'Reverse Lunges',
          sets: '3',
          reps: '10 per leg',
          notes: 'Step back, knee lightly taps floor. Slower than forward lunges, easier on the knees.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=reverse+lunge+tutorial+form',
          category: 'legs'
        },
        {
          id: 'day3_ex5',
          name: 'Lateral Raises',
          sets: '3',
          reps: '12-15',
          notes: 'Lateral delts are hard to hit with calisthenics. Slow tempo.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=lateral+raise+dumbbell+tutorial+slow+tempo',
          category: 'accessory'
        },
        {
          id: 'day3_ex6',
          name: 'Band Pull-aparts',
          sets: '3',
          reps: '15-20',
          notes: 'Rear delt + scapular control. Daily-able if shoulders feel tight.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=band+pull+apart+tutorial+rear+delt',
          category: 'accessory'
        },
        {
          id: 'day3_ex7',
          name: 'Side Plank',
          sets: '3',
          reps: '20-40 sec per side',
          notes: 'Resist the hip dropping. Crucial for skating lateral stability.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=side+plank+tutorial+proper+form',
          category: 'core'
        },
        {
          id: 'day3_ex8',
          name: 'Ab Wheel Rollouts',
          sets: '3',
          reps: '6-10',
          notes: 'If no ab wheel, use a barbell with plates. Stay in posterior tilt.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=ab+wheel+rollout+tutorial+form',
          category: 'core'
        }
      ]
    },
    {
      id: 'day4',
      name: 'Pull B',
      subtitle: 'Horizontal Emphasis + Skill',
      duration: '60-75 min',
      focus: 'Horizontal pulling variations, front lever skill progression, and posterior chain finishing work.',
      warmup: '10-minute mobility routine with extra attention to thoracic spine and scapular mobility.',
      color: '#8b5cf6',
      exercises: [
        {
          id: 'day4_ex1',
          name: 'Front Lever Progression',
          sets: '4',
          reps: '5-10 sec hold',
          notes: 'Skill priority — first while fresh. Active scaps, posterior pelvic tilt, full body line. Progression: tuck → adv. tuck → straddle.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=front+lever+tutorial+progression+tuck+calisthenics',
          category: 'skill'
        },
        {
          id: 'day4_ex2',
          name: 'Chin-ups',
          sets: '4',
          reps: '4-8',
          notes: 'Underhand grip — hits biceps harder than pull-ups. Pause at the top. Use negatives if needed.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=chin+up+tutorial+underhand+grip+biceps',
          category: 'pull'
        },
        {
          id: 'day4_ex3',
          name: 'Ring Rows / Bent-over Rows',
          sets: '4',
          reps: '8-10',
          notes: 'Different angle from Day 2 rows. Squeeze shoulder blades hard at top.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=ring+rows+tutorial+scapular+squeeze',
          category: 'pull'
        },
        {
          id: 'day4_ex4',
          name: 'Hip Thrusts',
          sets: '3',
          reps: '10-12',
          notes: 'Posterior pelvic tilt at the top, do not hyperextend the lower back. Single-leg variation for progression.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=hip+thrust+tutorial+glutes+form',
          category: 'legs'
        },
        {
          id: 'day4_ex5',
          name: 'Hammer Curls',
          sets: '3',
          reps: '10-12',
          notes: 'Different angle from Day 2 curls — targets brachialis.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=hammer+curl+tutorial+brachialis',
          category: 'accessory'
        },
        {
          id: 'day4_ex6',
          name: 'Seated Calf Raise',
          sets: '3',
          reps: '12-15',
          notes: 'Different stimulus from Day 2 calf work.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=seated+calf+raise+tutorial',
          category: 'accessory'
        },
        {
          id: 'day4_ex7',
          name: 'L-sit Progression',
          sets: '4',
          reps: '10-20 sec',
          notes: 'On parallettes, dip bars, or floor. Active shoulders, knees high. Progression: tuck → one-leg → full L-sit.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=l+sit+progression+tutorial+calisthenics',
          category: 'skill'
        },
        {
          id: 'day4_ex8',
          name: 'Pallof Press',
          sets: '3',
          reps: '10 per side',
          notes: 'Anti-rotation core. Slow, resist the pull.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=pallof+press+tutorial+anti+rotation+core',
          category: 'core'
        }
      ]
    },
    {
      id: 'day5',
      name: 'Mobility & Yoga',
      subtitle: 'Long Session',
      duration: '60-75 min',
      focus: 'A dedicated session targeting structural mobility limitations: ankle dorsiflexion, hip flexors, adductors, hip internal rotation, thoracic spine, and hamstrings.',
      warmup: 'Start with sun salutations, cat-cow, and arm circles.',
      color: '#10b981',
      exercises: [
        {
          id: 'day5_ex1',
          name: 'Sun Salutations + Cat-cow',
          sets: '1',
          reps: '10 min',
          notes: "General warm-up. World's greatest stretch 3 per side, arm circles.",
          youtubeUrl: 'https://www.youtube.com/results?search_query=sun+salutation+tutorial+yoga+warmup',
          category: 'mobility'
        },
        {
          id: 'day5_ex2',
          name: 'Deep Squat Hold',
          sets: '3',
          reps: '1 min',
          notes: 'Sit at the bottom, pry knees out with elbows. Heel elevation is fine and encouraged.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=deep+squat+hold+tutorial+ankle+mobility',
          category: 'mobility'
        },
        {
          id: 'day5_ex3',
          name: 'Couch Stretch',
          sets: '2',
          reps: '1 min per side',
          notes: 'Rear foot up on couch/bench, front knee at 90°. Squeeze the rear glute. Hip flexors.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=couch+stretch+tutorial+hip+flexor',
          category: 'mobility'
        },
        {
          id: 'day5_ex4',
          name: '90/90 Hip Switches',
          sets: '1',
          reps: '10 per side',
          notes: 'Sit on floor, switch hip positions side to side. Internal & external rotation.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=90+90+hip+switch+tutorial+mobility',
          category: 'mobility'
        },
        {
          id: 'day5_ex5',
          name: 'Cossack Squats',
          sets: '3',
          reps: '8 per side',
          notes: 'Adductors + ankle mobility + hip mobility in one drill.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=cossack+squat+tutorial+adductor+mobility',
          category: 'mobility'
        },
        {
          id: 'day5_ex6',
          name: 'Ankle Rocks Against Wall',
          sets: '3',
          reps: '15 per side',
          notes: 'Knee tracks over toes, heel stays down. Drives dorsiflexion gains.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=ankle+dorsiflexion+wall+rocks+tutorial',
          category: 'mobility'
        },
        {
          id: 'day5_ex7',
          name: 'Downward Dog',
          sets: '3',
          reps: '30 sec',
          notes: 'Upper body & spine. Alternate between downward dog and cobra/sphinx.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=downward+dog+tutorial+yoga+hamstrings',
          category: 'mobility'
        },
        {
          id: 'day5_ex8',
          name: 'Thread the Needle',
          sets: '1',
          reps: '5 per side',
          notes: 'Thoracic spine rotation. Hand behind head, rotate toward ceiling.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=thread+the+needle+thoracic+spine+mobility',
          category: 'mobility'
        },
        {
          id: 'day5_ex9',
          name: 'Pigeon Pose',
          sets: '2',
          reps: '1 min per side',
          notes: 'Hip internal rotation focus. Active lift variation — engage glute at end range.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=pigeon+pose+tutorial+hip+internal+rotation',
          category: 'mobility'
        },
        {
          id: 'day5_ex10',
          name: 'Supine Spinal Twist + Savasana',
          sets: '1',
          reps: '5-10 min',
          notes: 'Cool down: supine spinal twist, legs up the wall, savasana/breathwork.',
          youtubeUrl: 'https://www.youtube.com/results?search_query=supine+spinal+twist+cool+down+yoga',
          category: 'mobility'
        }
      ]
    }
  ],
  mealPlan: {
    targetCalories: 2400,
    targetProtein: 165,
    targetCarbs: 230,
    targetFat: 70,
    meals: {
      breakfast: [
        { name: 'Oatmeal (80g dry)', calories: 300, protein: 10, carbs: 54, fat: 6 },
        { name: '3 Whole Eggs (scrambled)', calories: 210, protein: 18, carbs: 0, fat: 15 },
        { name: 'Banana (1 medium)', calories: 90, protein: 1, carbs: 23, fat: 0 }
      ],
      lunch: [
        { name: 'Chicken Breast (200g cooked)', calories: 330, protein: 62, carbs: 0, fat: 7 },
        { name: 'White Rice (150g cooked)', calories: 195, protein: 4, carbs: 43, fat: 0 },
        { name: 'Mixed Vegetables (200g)', calories: 80, protein: 4, carbs: 14, fat: 1 },
        { name: 'Olive Oil (1 tbsp)', calories: 120, protein: 0, carbs: 0, fat: 14 }
      ],
      dinner: [
        { name: 'Salmon / Beef (200g cooked)', calories: 350, protein: 44, carbs: 0, fat: 18 },
        { name: 'Sweet Potato (200g)', calories: 180, protein: 4, carbs: 41, fat: 0 },
        { name: 'Broccoli (200g)', calories: 70, protein: 6, carbs: 12, fat: 1 }
      ],
      snacks: [
        { name: 'Greek Yogurt 0% (200g)', calories: 120, protein: 20, carbs: 8, fat: 0 },
        { name: 'Almonds (30g)', calories: 175, protein: 6, carbs: 6, fat: 15 }
      ]
    }
  }
};
