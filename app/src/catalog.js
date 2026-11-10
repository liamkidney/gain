// The catalogue is shipped with the PWA so it remains available without a connection.
// Illustrations are original schematic SVG movement diagrams, not medical form instruction.
export const CATALOG = [
  ['barbell-bench','Barbell bench press','Chest','Barbell','press','Lie on a flat bench with feet stable. Lower the bar under control towards the mid-chest, then press to extended arms. Keep your shoulder blades stable.'],
  ['dumbbell-bench','Dumbbell bench press','Chest','Dumbbell','press','Lie on a flat bench, hold dumbbells beside your chest and press upwards. Lower slowly through a comfortable range.'],
  ['incline-dumbbell-press','Incline dumbbell press','Chest','Dumbbell','press','Set the bench to a moderate incline. Press dumbbells upwards over the upper chest, then lower under control.'],
  ['chest-press-machine','Chest press machine','Chest','Machine','press','Adjust the seat so the handles start around chest height. Press forward and return under control without bouncing.'],
  ['cable-fly','Cable chest fly','Chest','Cable','fly','Set cables around chest height. With a soft elbow bend, bring your hands together in an arc and return slowly.'],
  ['push-up','Push-up','Chest','Bodyweight','press','Start in a stable plank with hands under or slightly wider than shoulders. Lower the chest, then push back up.'],
  ['barbell-squat','Barbell back squat','Quadriceps','Barbell','squat','Set the bar across your upper back. Brace, bend hips and knees, descend through your comfortable depth, and stand.'],
  ['front-squat','Barbell front squat','Quadriceps','Barbell','squat','Support the bar at the fronts of your shoulders. Keep elbows high, squat down under control and stand tall.'],
  ['goblet-squat','Goblet squat','Quadriceps','Dumbbell','squat','Hold a dumbbell close to the chest. Squat between your knees while keeping your torso supported, then stand.'],
  ['leg-press','Leg press','Quadriceps','Machine','squat','Position feet on the platform. Lower the sled through a controlled range without rounding your back, then press away.'],
  ['leg-extension','Leg extension','Quadriceps','Machine','extension','Adjust the machine to align with the knee joint. Extend your legs under control, then return slowly.'],
  ['walking-lunge','Walking lunge','Quadriceps','Dumbbell','lunge','Step forward, bend both knees through a comfortable range, stand and continue with the opposite leg.'],
  ['bulgarian-split-squat','Bulgarian split squat','Quadriceps','Dumbbell','lunge','Rest the rear foot on a bench. Lower by bending the front knee and hip, then drive back up through the front leg.'],
  ['romanian-deadlift','Romanian deadlift','Hamstrings','Barbell','hinge','With a soft knee bend, hinge at the hips, keeping the load close to your legs. Return by extending the hips.'],
  ['deadlift','Conventional deadlift','Back','Barbell','hinge','Stand with the bar over mid-foot, brace and lift by driving through the floor. Keep the bar close and lower deliberately.'],
  ['leg-curl','Seated leg curl','Hamstrings','Machine','curl','Adjust seat and pads to align the knees. Pull the lever through a controlled knee bend, then release slowly.'],
  ['hip-thrust','Hip thrust','Glutes','Barbell','thrust','Rest your upper back against a bench, feet planted. Drive hips upward until your trunk and thighs align, then lower.'],
  ['calf-raise','Standing calf raise','Calves','Machine','calf','Rise onto the balls of your feet without bouncing. Pause at the top and lower the heels slowly.'],
  ['lat-pulldown','Lat pulldown','Back','Cable','pull','Sit securely with thighs under the pad. Pull the bar towards the upper chest, leading with elbows, then extend slowly.'],
  ['assisted-pullup','Assisted pull-up','Back','Machine','pull','Select assistance, establish a full grip and pull your chest towards the handles. Lower under control.'],
  ['pull-up','Pull-up','Back','Bodyweight','pull','Hang from an overhead bar with control. Pull upwards until your chin approaches bar height, then lower smoothly.'],
  ['seated-cable-row','Seated cable row','Back','Cable','row','Sit tall, keep shoulders controlled, pull the handle towards your torso and extend arms without rocking.'],
  ['chest-supported-row','Chest-supported dumbbell row','Back','Dumbbell','row','Lie chest-down on an incline bench. Pull weights alongside the torso, pause, then lower without lifting the chest.'],
  ['bent-over-row','Barbell bent-over row','Back','Barbell','row','Hinge at the hips with a braced back. Pull the bar towards your torso and lower under control.'],
  ['one-arm-row','One-arm dumbbell row','Back','Dumbbell','row','Support yourself with the free hand. Pull the dumbbell towards the hip without twisting the torso.'],
  ['overhead-press','Barbell overhead press','Shoulders','Barbell','ohp','Brace and press the bar vertically overhead, moving the head gently out of the way. Lower to the start.'],
  ['dumbbell-shoulder-press','Dumbbell shoulder press','Shoulders','Dumbbell','ohp','From shoulder height, press dumbbells overhead through a comfortable arc and lower with control.'],
  ['lateral-raise','Dumbbell lateral raise','Shoulders','Dumbbell','raise','With soft elbows, raise dumbbells out to the sides to about shoulder height and lower slowly.'],
  ['cable-lateral-raise','Cable lateral raise','Shoulders','Cable','raise','Stand side-on to a low cable. Lift the handle sideways to about shoulder height while keeping torso still.'],
  ['rear-delt-fly','Reverse fly','Shoulders','Dumbbell','fly','Hinge forward with a supported back. Open arms to the sides with soft elbows, then return under control.'],
  ['face-pull','Cable face pull','Shoulders','Cable','row','Set a rope around face height. Pull towards your face while spreading the hands and keeping elbows high.'],
  ['barbell-curl','Barbell biceps curl','Biceps','Barbell','curl','Keep upper arms close to your sides. Bend elbows to lift the bar, then lower without swinging.'],
  ['dumbbell-curl','Dumbbell biceps curl','Biceps','Dumbbell','curl','Stand tall with elbows near the torso. Curl weights towards shoulders and lower slowly.'],
  ['hammer-curl','Hammer curl','Biceps','Dumbbell','curl','With palms facing each other, curl dumbbells without allowing the upper arms to swing.'],
  ['triceps-pushdown','Triceps cable pushdown','Triceps','Cable','pushdown','Keep elbows close to the torso. Straighten the arms against the cable resistance, then bend slowly.'],
  ['overhead-triceps-extension','Overhead triceps extension','Triceps','Dumbbell','extension','Hold the load overhead. Bend elbows to lower behind the head, then extend under control.'],
  ['skull-crusher','Lying triceps extension','Triceps','Barbell','extension','Lie on a bench and hold the bar above the chest. Bend elbows to lower towards the head, then extend.'],
  ['plank','Plank','Core','Bodyweight','core','Support weight through forearms and toes. Keep your trunk braced and body aligned, breathing steadily.'],
  ['cable-crunch','Cable crunch','Core','Cable','core','Kneel at a high cable with the rope near your head. Curl your rib cage towards your pelvis without pulling with arms.'],
  ['hanging-leg-raise','Hanging leg raise','Core','Bodyweight','core','Hang steadily, raise your legs or knees by flexing at the hips and pelvis, then lower without swinging.'],
  ['farmer-carry','Farmer carry','Full body','Dumbbell','carry','Walk steadily while holding weights at your sides, keeping torso upright and shoulders stable.']
].map(([id,name,muscle,equipment,diagram,instructions])=>({id,name,muscle,equipment,diagram,instructions}));

export function allExercises(custom=[]) { return [...CATALOG,...custom]; }
export function findExercise(id, custom=[]) { return allExercises(custom).find(x=>x.id===id); }
export const MUSCLES = [...new Set(CATALOG.map(x=>x.muscle))].sort();
export const EQUIPMENT = [...new Set(CATALOG.map(x=>x.equipment))].sort();
