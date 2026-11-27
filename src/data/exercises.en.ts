import type { ExerciseId, ExerciseText } from './exercises'

/**
 * English texts of the catalog, by exercise ID. The German texts live with the definitions in
 * `exercises.ts`; every exercise needs both (the type makes a missing one an error).
 */
export const EXERCISE_TEXTS_EN: Record<ExerciseId, ExerciseText> = {
  'wide-grip-bench-press': {
    name: 'Wide Dumbbell Press',
    aliases: ['wide bench press', 'chest press'],
    description: 'Bench press with two dumbbells and the arms wide: works the whole chest.',
    instructions:
      'Lie flat on the bench, feet planted, shoulder blades pulled together and down. ' +
      'Hold one dumbbell in each hand with an overhand grip above your chest, about 1.5 times shoulder width. ' +
      'Lower them under control to the sides of your lower chest, elbows about 45–60° away from your body. ' +
      'Pause briefly at the bottom, then press up powerfully until your arms are almost straight.',
    formCues: ['Shoulder blades stay locked in', 'Slight arch, glutes on the bench', 'Don’t flare the elbows to 90°'],
    breathing: 'Breathe in as you lower the dumbbells, breathe out as you press them up.',
  },
  butterflies: {
    name: 'Dumbbell Flyes',
    aliases: ['butterflies', 'flyes'],
    description: 'Isolation exercise for the chest with a wide range of motion.',
    instructions:
      'Lie on the flat bench with a dumbbell in each hand, arms slightly bent above your chest. ' +
      'Open them in a wide arc until you feel a clear stretch in your chest, keeping the elbow angle the same. ' +
      'Then bring the arms back together with deliberate chest tension, as if hugging a big tree.',
    formCues: ['Keep the elbow angle', 'Slow, controlled stretch', 'Keep the shoulders down'],
    breathing: 'Breathe in as you open your arms, breathe out as you bring them together.',
  },
  'close-grip-bench-press': {
    name: 'Close-Grip Dumbbell Press',
    aliases: ['close grip press', 'neutral grip press'],
    description: 'Narrow press with two dumbbells: shifts the focus to the triceps and inner chest.',
    instructions:
      'On the flat bench, hold two dumbbells with a neutral grip (palms facing each other) close together above your chest, wrists straight over the elbows. ' +
      'Lower them to your lower chest, keeping the elbows tucked to your torso. ' +
      'Press up from the triceps without letting the elbows flare out.',
    formCues: ['Dumbbells stay close together', 'Elbows tucked to the body', 'Wrists stable and neutral'],
    breathing: 'Breathe in as you lower the dumbbells, breathe out as you press them up.',
  },
  'bicep-curls': {
    name: 'Biceps Curls',
    aliases: ['dumbbell curls'],
    description: 'The classic isolation exercise for strong biceps.',
    instructions:
      'Stand tall, dumbbells at your sides, palms facing your thighs. ' +
      'Keep your upper arms pressed to your torso as you bend at the elbows and curl the weights to shoulder height, rotating your palms up until they face your shoulders at the top. ' +
      'Squeeze the biceps briefly at the top and lower slowly, over two to three seconds, rotating back to the neutral grip as you go.',
    formCues: ['No swinging from the back', 'Elbows stay at your sides', 'Straighten fully at the bottom'],
    breathing: 'Breathe out as you curl the dumbbells up, breathe in as you lower them.',
  },
  'lateral-raises': {
    name: 'Lateral Raises',
    aliases: ['side raises'],
    description: 'Targets the side of the shoulders, for broad shoulders.',
    instructions:
      'Stand with feet shoulder-width apart, dumbbells in front of your body, arms slightly bent. ' +
      'Raise the weights out to the sides to just below shoulder height, leading with the elbows, not the hands. ' +
      'Hold briefly and lower under control without fully releasing the tension at the bottom.',
    formCues: ['Don’t lift above shoulder height', 'Relaxed neck, shoulders down', 'Light weight, clean form'],
    breathing: 'Breathe out as you raise your arms, breathe in as you lower them.',
  },
  'front-raises': {
    name: 'Front Raises',
    description: 'Isolation exercise for the front of the shoulders.',
    instructions:
      'Stand tall, dumbbells in an overhand grip in front of your thighs. ' +
      'With slightly bent arms, raise them forward to eye level, one at a time or together. ' +
      'Keep your torso still and lower the weights slowly.',
    formCues: ['Stable torso, no leaning back', 'Up to eye level at most', 'Controlled way down'],
    breathing: 'Breathe out as you raise your arms, breathe in as you lower them.',
  },
  squats: {
    name: 'Squats',
    aliases: ['goblet squat', 'front squat'],
    description: 'The king of exercises for legs and glutes.',
    instructions:
      'Stand about shoulder-width apart, toes turned out slightly, dumbbells resting on the front of your shoulders. ' +
      'Lift your chest, brace your core and lower your hips back and down, as if sitting on a chair. ' +
      'Your knees track in the direction of your toes. ' +
      'Go at least until your thighs are parallel to the floor, then drive up powerfully through your whole foot.',
    formCues: ['Don’t let the knees cave in', 'Heels stay on the floor', 'Neutral back, eyes forward'],
    breathing: 'Breathe in on the way down, breathe out on the way up.',
  },
  lunges: {
    name: 'Lunges',
    aliases: ['forward lunge'],
    description: 'Single-leg exercise for legs, glutes and stability.',
    instructions:
      'Stand tall with the dumbbells at your sides and take a big step forward. ' +
      'Bend both knees until the back knee hovers just above the floor and both knees form about 90°. ' +
      'The front knee stays above the ankle. ' +
      'Push back up to standing through the heel of the front leg and switch sides.',
    formCues: ['Upper body upright', 'Front knee stable over the foot', 'Take a long enough step'],
    breathing: 'Breathe in as you lower into the lunge, breathe out as you push up.',
  },
  crunches: {
    name: 'Crunches',
    aliases: ['weighted crunch'],
    description: 'The basic exercise for the front abs.',
    instructions:
      'Lie on your back, knees bent, feet flat on the floor. ' +
      'Hold the dumbbells upright on your chest. ' +
      'As you breathe out, curl your upper back up one vertebra at a time until your shoulder blades lift off the floor. ' +
      'Hold briefly and lower slowly.',
    formCues: ['Dumbbells held tight to the chest', 'Lower back stays on the floor', 'Breathe out on the way up'],
    breathing: 'Breathe out as you curl up, breathe in as you lower down.',
  },
  'russian-twists': {
    name: 'Russian Twists',
    description: 'Rotation exercise for the obliques.',
    instructions:
      'Sit on the floor, knees bent, and lean back about 45° with a straight back. ' +
      'For more intensity, lift your feet off the floor. ' +
      'Rotate your torso from side to side under control, bringing the dumbbells next to your hip each time. ' +
      'One side plus the other counts as one rep.',
    formCues: ['Rotate from the torso, not just the arms', 'Back stays straight', 'Breathe evenly'],
    breathing: 'Keep breathing: out with each twist to the side, in through the middle.',
  },
  'military-press': {
    name: 'Military Press',
    aliases: ['shoulder press', 'overhead press'],
    description: 'Free overhead press with two dumbbells for strong shoulders and a stable core.',
    instructions:
      'Stand with feet hip-width apart, dumbbells in an overhand grip at shoulder height. ' +
      'Brace your glutes and abs. ' +
      'Press the dumbbells straight up and bring them slightly together at the top until your arms are straight. ' +
      'Lower them under control back to shoulder height.',
    formCues: ['No arched back, core tight', 'Press the dumbbells in a straight line', 'Wrists over the elbows'],
    breathing: 'Breathe out as you press up, breathe in as you lower.',
  },
  'one-arm-dumbbell-row': {
    name: 'One-Arm Dumbbell Row',
    aliases: ['single arm row'],
    description: 'A one-arm row with the free hand braced on your thigh: for a broad, strong back.',
    instructions:
      'Stand in a split stance with the front knee bent and rest your free hand on your front thigh. ' +
      'Lean your torso far forward with a straight back; the dumbbell hangs below your shoulder in a neutral grip. ' +
      'Pull your elbow back and up close to your body until the dumbbell is next to your hip, drawing the shoulder blade toward the spine at the top. ' +
      'Lower under control until your arm is straight. ' +
      'Do all reps on one side, then switch.',
    formCues: ['Back straight, hips parallel to the floor', 'Pull with the elbow, not the hand', 'Don’t rotate the torso open'],
    breathing: 'Breathe out as you pull up, breathe in as you lower.',
  },
  'bent-over-row': {
    name: 'Bent-Over Row',
    aliases: ['dumbbell row'],
    description: 'Two-arm row in a bent-over position for the whole upper back.',
    instructions:
      'Stand hip-width apart, bend your knees slightly and lean your torso forward about 45° with a straight back, pushing your hips back. ' +
      'The dumbbells hang below your shoulders in a neutral grip. ' +
      'Pull both elbows back and up close to your body until the dumbbells are next to your hips, squeezing your shoulder blades together. ' +
      'Lower slowly without straightening up.',
    formCues: ['Back stays straight, no rounding', 'Torso angle stays the same', 'Squeeze the shoulder blades at the top'],
    breathing: 'Breathe out as you pull up, breathe in as you lower.',
  },
  'reverse-flys': {
    name: 'Reverse Flyes',
    aliases: ['rear delt fly', 'bent-over lateral raise'],
    description: 'Bent-over lateral raise for the rear shoulders and upper back.',
    instructions:
      'Bend your knees and lean your torso forward with a straight back until it is almost horizontal. ' +
      'The dumbbells hang below your chest with slightly bent arms, palms facing each other. ' +
      'Open your arms out to the sides in a wide arc up to shoulder height, keeping the elbow angle the same. ' +
      'Hold briefly at the top and return slowly.',
    formCues: ['Keep the elbow angle', 'No momentum from the torso', 'Light weight, shoulders away from the ears'],
    breathing: 'Breathe out as you open your arms, breathe in as you bring them back.',
  },
  'romanian-deadlift': {
    name: 'Romanian Deadlift',
    aliases: ['rdl', 'stiff-leg deadlift'],
    description: 'Hip hinge with two dumbbells for the hamstrings and glutes.',
    instructions:
      'Stand hip-width apart, dumbbells in an overhand grip in front of your thighs. ' +
      'Unlock your knees slightly and push your hips far back while your back stays straight. ' +
      'The dumbbells slide down close to your legs to about knee height, or until you clearly feel the stretch in your hamstrings. ' +
      'Drive your hips forward powerfully and squeeze your glutes at the top.',
    formCues: ['Back straight, eyes on the floor', 'Dumbbells stay close to the legs', 'The movement comes from the hips, not the knees'],
    breathing: 'Breathe in on the way down, breathe out as you stand up.',
  },
  'overhead-triceps-extension': {
    name: 'Overhead Triceps Extension',
    aliases: ['triceps extension', 'french press'],
    description: 'Overhead extension for the long head of the triceps.',
    instructions:
      'Stand tall and bring the dumbbells overhead with straight arms in a neutral grip. ' +
      'Your upper arms stay vertical next to your head, elbows pointing forward. ' +
      'Slowly lower only your forearms behind your head until your elbows are clearly bent. ' +
      'Extend again from the triceps without moving your upper arms.',
    formCues: ['Upper arms stay still next to the head', 'Elbows point forward, not out', 'Core tight, no arched back'],
    breathing: 'Breathe in as you lower, breathe out as you extend.',
  },
  'hammer-curls': {
    name: 'Hammer Curls',
    aliases: ['neutral grip curls'],
    description: 'Curls with a neutral grip for the biceps, brachialis and forearms.',
    instructions:
      'Stand tall, dumbbells at your sides, thumbs pointing forward. ' +
      'Keep your upper arms at your torso as you bend at the elbows and curl the dumbbells to shoulder height. ' +
      'The grip doesn’t turn: at the top your thumbs point to your shoulders. ' +
      'Lower under control until your arms are straight.',
    formCues: ['Wrists stay straight', 'Elbows stay at your sides', 'No swinging from the back'],
    breathing: 'Breathe out as you curl the dumbbells up, breathe in as you lower them.',
  },
  'calf-raises': {
    name: 'Calf Raises',
    aliases: ['standing calf raise'],
    description: 'Standing heel raises with two dumbbells for strong calves.',
    instructions:
      'Stand tall, feet hip-width apart, dumbbells hanging at your sides. ' +
      'Raise your heels as high as you can until you stand on the balls of your feet, and hold briefly at the top. ' +
      'Lower slowly until your heels are back on the floor. ' +
      'For a bigger range of motion, stand with the balls of your feet on a step.',
    formCues: ['Knees straight but not locked', 'Hold for a second at the top', 'Weight over the big toe'],
    breathing: 'Breathe out as you rise, breathe in as you lower.',
  },
  'push-ups': {
    name: 'Push-Ups',
    description: 'The basic no-equipment exercise for chest, shoulders and triceps: the body stays a solid plank.',
    instructions:
      'Place your hands on the floor a little wider than shoulder width, fingers pointing forward, feet hip-width apart on the balls of your feet. ' +
      'Brace your abs and glutes so your head, torso and legs form one line. ' +
      'Bend your elbows back at about 45° and lower your chest to just above the floor. ' +
      'Push away from the floor powerfully until your arms are almost straight.',
    formCues: ['Body stays one straight line', 'Elbows about 45° from the body', 'Hips neither sag nor pike up'],
    breathing: 'Breathe in on the way down, breathe out as you push up.',
  },
  'diamond-push-ups': {
    name: 'Diamond Push-Ups',
    aliases: ['close grip push ups', 'triceps push ups'],
    description: 'Push-ups with the hands close together: much harder, with a clear focus on the triceps.',
    instructions:
      'Get into the push-up position and bring your hands together under your chest so your thumbs and index fingers form a diamond. ' +
      'Brace your abs and glutes. ' +
      'Lower your chest to your hands under control, keeping the elbows tucked back along your torso. ' +
      'Push back up from the triceps without letting the elbows flare out.',
    formCues: ['Elbows tucked to the body', 'Hands under the chest, not under the face', 'Shoulders away from the ears'],
    breathing: 'Breathe in on the way down, breathe out as you push up.',
  },
  'pike-push-ups': {
    name: 'Pike Push-Ups',
    aliases: ['shoulder push ups'],
    description: 'Push-ups in an inverted V: trains the shoulders like an overhead press with your own bodyweight.',
    instructions:
      'From the push-up position, push your hips high until your body forms an inverted V. ' +
      'Your hands are shoulder-width apart, your legs as straight as possible, your weight over your hands. ' +
      'Bend your elbows back at an angle and lower your head under control toward the floor between your hands. ' +
      'Push back up powerfully to the starting position.',
    formCues: ['Hips stay high', 'Elbows angled back, not out', 'Stop just before your head touches the floor'],
    breathing: 'Breathe in as you lower your head, breathe out as you push up.',
  },
  'v-ups': {
    name: 'V-Ups',
    aliases: ['jackknife'],
    description: 'A demanding ab exercise: torso and straight legs come up together into a V.',
    instructions:
      'Lie flat on your back, arms stretched overhead, legs straight and together. ' +
      'Brace your abs and press your lower back into the floor. ' +
      'Lift your torso and legs at the same time and reach for your shins with your hands until you balance on your glutes. ' +
      'Lower slowly and under control back to the start.',
    formCues: ['Legs stay straight', 'Move from the abs, not with momentum', 'Control the lower back on the way down'],
    breathing: 'Breathe out on the way up, breathe in on the way down.',
  },
  'bulgarian-split-squat': {
    name: 'Bulgarian Split Squat',
    aliases: ['split squat', 'rear foot elevated split squat'],
    description: 'Single-leg squat with the back foot on the bench: challenges legs, glutes and balance.',
    instructions:
      'Stand with your back to the bench, a dumbbell in each hand at your sides. ' +
      'Take a big step forward and rest the top of your back foot on the bench. ' +
      'Let the back knee sink straight down toward the floor until your front thigh is about horizontal, leaning your torso slightly forward. ' +
      'Push back up through the heel of the front leg. ' +
      'Do all reps on one side first, then switch.',
    formCues: ['Front knee points over the toes, not inward', 'Weight on the front leg', 'Hips stay square'],
    breathing: 'Breathe in on the way down, breathe out as you push up.',
  },
  thrusters: {
    name: 'Thrusters',
    aliases: ['squat press'],
    description: 'Squat and overhead press in one flowing movement: a full-body exercise that gets your pulse up.',
    instructions:
      'Stand hip-width apart, dumbbells in front of your shoulders, elbows pointing forward and down. ' +
      'Sink into a deep squat, chest upright, heels on the floor. ' +
      'Drive up explosively from your legs and use the momentum to press the dumbbells overhead without pausing, until your arms are straight. ' +
      'Bring the dumbbells back to your shoulders under control and go straight into the next squat.',
    formCues: ['Legs first, then arms', 'Heels stay on the floor', 'No arched back at the top'],
    breathing: 'Breathe in at the bottom, breathe out as you press overhead.',
  },
  'renegade-rows': {
    name: 'Renegade Rows',
    aliases: ['plank row'],
    description: 'Rowing from a high plank on two dumbbells: back and core work together.',
    instructions:
      'Get into a high plank with your hands on two dumbbells under your shoulders, feet a little wider than hip-width. ' +
      'Brace your abs and glutes hard. ' +
      'Row one dumbbell to your lower ribs, the elbow brushing back close to your body, without letting your hips rotate. ' +
      'Set it down under control and switch sides.',
    formCues: ['Hips stay parallel to the floor', 'Wide stance for more stability', 'Only use dumbbells that won’t roll away'],
    breathing: 'Breathe out as you row, breathe in as you set the dumbbell down.',
  },
  'arnold-press': {
    name: 'Arnold Press',
    description: 'Shoulder press with a turn of the wrists: hits all three parts of the deltoid.',
    instructions:
      'Stand tall, dumbbells in front of your face at chin height, palms facing you, elbows forward. ' +
      'As you press up, open your arms to the sides and turn your wrists out so your palms face forward at the top. ' +
      'Almost straighten your arms overhead, then do the movement exactly in reverse.',
    formCues: ['Turn and press in one movement', 'Core tight, no arched back', 'Don’t lock out fully at the top'],
    breathing: 'Breathe out as you press up, breathe in as you lower.',
  },
}
