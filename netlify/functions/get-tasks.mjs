const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Default tasks - extracted from current index.html dailyTasks
const DEFAULT_TASKS = {
  daily: {
    monday: [
      { time: "6:00–6:30", icon: "💧", en: { task: "Irrigation Check", detail: "Check drip lines for leaks, clean filters, adjust timer if needed" }, kn: { task: "ನೀರಾವರಿ ತಪಾಸಣೆ", detail: "ಡ್ರಿಪ್ ಲೈನುಗಳನ್ನು ಸೋರಿಕೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಸ್ವಚ್ಛ ಮಾಡಿ, ಸಿಮರ್ ಹೊಂದಿಸಿ" } },
      { time: "7:00–8:00", icon: "📊", en: { task: "Weather Check", detail: "Record temperature, humidity, rainfall from weather station" }, kn: { task: "ಹವಾಮಾನ ಪರಿಶೀಲನೆ", detail: "ಹವಾಮಾನ ಕೇಂದ್ರದಿಂದ ತಾಪಮಾನ, ಆರ್ದ್ರತೆ, ಮಳೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ" } },
      { time: "9:00–10:00", icon: "🔍", en: { task: "Visual Scouting", detail: "Inspect canopy, look for pest damage, disease symptoms, leaf color" }, kn: { task: "ದೃಶ್ಯ ಗಸ್ತು", detail: "ಕ್ರೀಡಾ ಪೂರ್ಣತೆ, ಕೀಟ ಹಾನಿ, ರೋಗ ಲಕ್ಷಣ, ಎಲೆ ಬಣ್ಣಕ್ಕೆ ನೋಡಿ" } },
      { time: "11:00–12:00", icon: "🧪", en: { task: "Soil Sampling", detail: "Check soil moisture at 6-8 inch depth, note any compaction or crusting" }, kn: { task: "ಮಣ್ಣು ಮಾದರಿ", detail: "6-8 ಇಂಚಿ ಆಳದಲ್ಲಿ ಮಣ್ಣಿನ ತೇವತೆ ಪರಿಶೀಲಿಸಿ, ಹಿಡಿತ ಅಥವಾ ಕ್ರಾಸ್ಟಿಂಗ್ ಗಮನಿಸಿ" } },
      { time: "2:00–3:00", icon: "🌾", en: { task: "Fertilizer Application", detail: "Apply scheduled micronutrients or fertigation as per calendar" }, kn: { task: "ಸಾರಪ್ರಕ್ರಿಯೆ ಅನ್ವಯ", detail: "ಕ್ಯಾಲೆಂಡರ್ ಪ್ರಕಾರ ನಿರ್ಧಾರಿತ ಸೂಕ್ಷ್ಮ ಪೌಷ್ಟಿಕಾಂಶ ಅಥವಾ ಫರ್ಟಿಗೇಷನ್ ಅನ್ವಯ ಮಾಡಿ" } },
      { time: "4:00–5:00", icon: "📋", en: { task: "Daily Log & Cleanup", detail: "Update field log with observations, clean and store equipment" }, kn: { task: "ದೈನಂದಿನ ಲಾಗ್ ಮತ್ತು ಸ್ವಚ್ಛತೆ", detail: "ಅವಲೋಕನಗಳೊಂದಿಗೆ ಕ್ಷೇತ್ರ ಲಾಗ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ, ಉಪಕರಣ ಸ್ವಚ್ಛ ಮತ್ತು ಸಂಗ್ರಹ ಮಾಡಿ" } }
    ],
    tuesday: [
      { time: "6:00–6:30", icon: "💧", en: { task: "Irrigation Check", detail: "Check drip lines for leaks, clean filters, adjust timer if needed" }, kn: { task: "ನೀರಾವರಿ ತಪಾಸಣೆ", detail: "ಡ್ರಿಪ್ ಲೈನುಗಳನ್ನು ಸೋರಿಕೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಸ್ವಚ್ಛ ಮಾಡಿ, ಸಿಮರ್ ಹೊಂದಿಸಿ" } },
      { time: "8:00–9:00", icon: "📊", en: { task: "Micronutrient Application", detail: "Apply Fe, Zn, Mn as per monthly schedule, check foliar spray equipment" }, kn: { task: "ಸೂಕ್ಷ್ಮ ಪೌಷ್ಟಿಕಾಂಶ ಅನ್ವಯ", detail: "ಮಾಸಿಕ ಅನುಸೂಚಿಯ ಪ್ರಕಾರ Fe, Zn, Mn ಅನ್ವಯ ಮಾಡಿ, ಎಲೆಯ ಸ್ಪ್ರೇ ಉಪಕರಣ ಪರಿಶೀಲಿಸಿ" } },
      { time: "10:00–11:00", icon: "🔍", en: { task: "Pest & Disease Scout", detail: "Look for early signs of mite damage, anthracnose, or scale insects" }, kn: { task: "ಕೀಟ ಮತ್ತು ರೋಗ ಗಸ್ತು", detail: "ಮೈಟ ಹಾನಿ, ಆಂತ್ರಾಕ್ನೋಸ್, ಅಥವಾ ಸ್ಕೇಲ್ ಕೀಟಗಳ ಆರಂಭಿಕ ಚಿಹ್ನೆಯನ್ನು ತೇಲಿಸಿ" } },
      { time: "1:00–2:00", icon: "🧪", en: { task: "Pruning & Maintenance", detail: "Remove dead branches, thin crowns if needed, check for disease entry points" }, kn: { task: "ವೃದ್ಧಿ ತಗ್ಗಿಸುವಿಕೆ ಮತ್ತು ನಿರ್ವಹಣೆ", detail: "ಸತ್ತ ಶಾಖೆಗಳನ್ನು ತೆಗೆದುಹಾಕಿ, ಅಗತ್ಯವಿದ್ದರೆ ಕುರಿತನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ, ರೋಗ ಪ್ರವೇಶ ಬಿಂದುವಿನ ಪರಿಶೀಲನೆ ಮಾಡಿ" } },
      { time: "3:00–4:00", icon: "🌾", en: { task: "Weed & Mulch Check", detail: "Remove weeds, top-up mulch under canopy, check for soil cracks" }, kn: { task: "ಕಳೆ ಮತ್ತು ಮಲ್ಚ್ ಚೆಕ್", detail: "ಕಳೆಯನ್ನು ತೆಗೆದುಹಾಕಿ, ಕ್ರೀಡಾ ಕೆಳಗೆ ಮಲ್ಚ್ ಸರಿಪಡಿಸಿ, ಮಣ್ಣಿನ ಬಿರುಕು ಪರಿಶೀಲಿಸಿ" } },
      { time: "5:00–6:00", icon: "📋", en: { task: "Evening Report", detail: "Update field notes, review tomorrow's schedule, prepare equipment" }, kn: { task: "ಸಂಜೆ ವರದಿ", detail: "ಕ್ಷೇತ್ರ ಟಿಪ್ಪಣಿಗಳನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡಿ, ನಾಳೆಯ ಅನುಸೂಚಿ ಪರಿಶೀಲಿಸಿ, ಸಾಧನ ತಯಾರಿ ಮಾಡಿ" } }
    ],
    wednesday: [
      { time: "6:00–6:30", icon: "💧", en: { task: "Irrigation Check", detail: "Check drip lines for leaks, clean filters, adjust timer if needed" }, kn: { task: "ನೀರಾವರಿ ತಪಾಸಣೆ", detail: "ಡ್ರಿಪ್ ಲೈನುಗಳನ್ನು ಸೋರಿಕೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಸ್ವಚ್ಛ ಮಾಡಿ, ಸಿಮರ್ ಹೊಂದಿಸಿ" } },
      { time: "7:30–8:30", icon: "📊", en: { task: "Flowering/Fruit Check", detail: "Monitor flower drop, inspect young fruits for defects, check fruit size" }, kn: { task: "ಫೂಲ/ಫಲ ಪರಿಶೀಲನೆ", detail: "ಹೂವಿನ ನಷ್ಟ ಮೇಲ್ವಿಚಾರಣೆ, ಹೊಸ ಫಲಗಳನ್ನು ದೋಷಗಳಿಗಾಗಿ ಪರಿಶೀಲಿಸಿ, ಫಲದ ಗಾತ್ರ ಪರಿಶೀಲಿಸಿ" } },
      { time: "10:00–11:00", icon: "🔍", en: { task: "Integrated Pest Management", detail: "Scout for beneficial insects, check traps, apply organic controls if needed" }, kn: { task: "ಸಮೇಕೃತ ಕೀಟ ನಿರ್ವಹಣೆ", detail: "ಲಾಭದಾಯಕ ಕೀಟಗಳ ಗಸ್ತು, ಫಂದಗಳ ಪರಿಶೀಲನೆ, ಅಗತ್ಯವಿದ್ದರೆ ಸಾವಯವ ನಿಯಂತ್ರಣ ಅನ್ವಯ ಮಾಡಿ" } },
      { time: "1:00–2:00", icon: "🧪", en: { task: "Soil Health Check", detail: "Check water infiltration rate, observe worm activity, note soil color" }, kn: { task: "ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಪರಿಶೀಲನೆ", detail: "ನೀರಿನ ಊರಿಕೊಳ್ಳುವ ದರ ಪರಿಶೀಲಿಸಿ, ಹುಳುವಿನ ಚಟುವಟಿಕೆ ವೀಕ್ಷಿಸಿ, ಮಣ್ಣಿನ ಬಣ್ಣ ಗಮನಿಸಿ" } },
      { time: "3:00–4:00", icon: "🌾", en: { task: "Cover Crop Management", detail: "If applicable, monitor cover crop growth, plan incorporation timing" }, kn: { task: "ಹೆಬ್ಬೆಳೆ ನಿರ್ವಹಣೆ", detail: "ಅನ್ವಯವಾಗಿದ್ದರೆ, ಹೆಬ್ಬೆಳೆಯ ಬೆಳವಣಿಗೆ ಮೇಲ್ವಿಚಾರಣೆ, ಸಂಯೋಜನ ಸಮಯ ಯೋಜನೆ" } },
      { time: "5:00–6:00", icon: "📋", en: { task: "Weekly Prep", detail: "Plan next week's tasks, order supplies if needed, check equipment maintenance" }, kn: { task: "ಸಾಪ್ತಾಹಿಕ ಪೂರ್ವಸಿದ್ಧತೆ", detail: "ಮುಂದಿನ ವಾರದ ಕಾರ್ಯಗಳನ್ನು ಯೋಜನೆ ಮಾಡಿ, ಅಗತ್ಯವಿದ್ದರೆ ಸರಬರಾಜು ಆದೇಶ ಮಾಡಿ, ಸರಂಜಾಮ ನಿರ್ವಹಣೆ ಪರಿಶೀಲಿಸಿ" } }
    ],
    thursday: [
      { time: "6:00–6:30", icon: "💧", en: { task: "Irrigation Check", detail: "Check drip lines for leaks, clean filters, adjust timer if needed" }, kn: { task: "ನೀರಾವರಿ ತಪಾಸಣೆ", detail: "ಡ್ರಿಪ್ ಲೈನುಗಳನ್ನು ಸೋರಿಕೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಸ್ವಚ್ಛ ಮಾಡಿ, ಸಿಮರ್ ಹೊಂದಿಸಿ" } },
      { time: "8:00–9:00", icon: "📊", en: { task: "Post-Harvest Prep", detail: "Monitor fruit maturity, inspect harvesting equipment, plan harvest if applicable" }, kn: { task: "ಕೊತ್ತಂಬರ ತಯಾರಿ", detail: "ಫಲದ ಪರಿಪಕ್ವತೆ ಮೇಲ್ವಿಚಾರಣೆ, ಕೊತ್ತಂಬರ ಉಪಕರಣ ಪರಿಶೀಲಿಸಿ, ಕೊತ್ತಂಬರ ಯೋಜನೆ ಮಾಡಿ" } },
      { time: "10:00–11:00", icon: "🔍", en: { task: "Stress Assessment", detail: "Look for signs of water stress, nutrient deficiency, or heat stress" }, kn: { task: "ಸ್ಟ್ರೆಸ್ ಮೌಲ್ಯಮಾಪನ", detail: "ನೀರಿನ ಒತ್ತಡ, ಪೌಷ್ಟಿಕಾಂಶ ಕೊರತೆ, ಅಥವಾ ಶಾಖದ ಒತ್ತಡದ ಚಿಹ್ನೆಗಳನ್ನು ತೇಲಿಸಿ" } },
      { time: "1:00–2:00", icon: "🧪", en: { task: "Fungicide Application", detail: "Apply scheduled fungicide if within timing window, record details" }, kn: { task: "ಶಿಲೀಂಧ್ರನಾಶಕ ಅನ್ವಯ", detail: "ಸಮಯ ಕ್ರೌಡ ಇದ್ದರೆ ನಿರ್ಧಾರಿತ ಶಿಲೀಂಧ್ರನಾಶಕ ಅನ್ವಯ ಮಾಡಿ, ವಿವರಗಳನ್ನು ರೆಕಾರ್ಡ ಮಾಡಿ" } },
      { time: "3:00–4:00", icon: "🌾", en: { task: "Tree Health Walk", detail: "Walk entire farm perimeter, check tree condition, note anomalies" }, kn: { task: "ಮರ ಆರೋಗ್ಯ ಸಡಿಲು", detail: "ಮುಂಡಿ ಸಂಪೂರ್ಣ ಪರಿಧಿಯನ್ನು ನಡೆಯಿರಿ, ಮರದ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ, ಅಸಾಮಾನ್ಯತೆಗಳನ್ನು ಗಮನಿಸಿ" } },
      { time: "5:00–6:00", icon: "📋", en: { task: "Lab Sample Prep", detail: "Collect soil/leaf samples if scheduled, prepare for shipment to lab" }, kn: { task: "ಪ್ರಯೋಗಾಲಯ ಮಾದರಿ ತಯಾರಿ", detail: "ನಿರ್ಧಾರಿತ ಸಂಚಿವೀ/ಎಲೆ ಮಾದರಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ, ಪ್ರಯೋಗಾಲಯಕ್ಕೆ ಸಿಪ್ಪೆಗೆ ಸಿದ್ಧತೆ ಮಾಡಿ" } }
    ],
    friday: [
      { time: "6:00–6:30", icon: "💧", en: { task: "Irrigation Check", detail: "Check drip lines for leaks, clean filters, adjust timer if needed" }, kn: { task: "ನೀರಾವರಿ ತಪಾಸಣೆ", detail: "ಡ್ರಿಪ್ ಲೈನುಗಳನ್ನು ಸೋರಿಕೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಸ್ವಚ್ಛ ಮಾಡಿ, ಸಿಮರ್ ಹೊಂದಿಸಿ" } },
      { time: "8:00–9:00", icon: "📊", en: { task: "Preventive Spray", detail: "Apply preventive spray mix (fungicide + micronutrient), check nozzles" }, kn: { task: "ತಡೆಗಟ್ಟುವ ಸ್ಪ್ರೇ", detail: "ತಡೆಗಟ್ಟುವ ಸ್ಪ್ರೇ ಮಿಶ್ರಣ (ಶಿಲೀಂಧ್ರನಾಶಕ + ಸೂಕ್ಷ್ಮ ಪೌಷ್ಟಿಕಾಂಶ) ಅನ್ವಯ ಮಾಡಿ, ನಜಲ್ ಪರಿಶೀಲಿಸಿ" } },
      { time: "10:00–11:00", icon: "🔍", en: { task: "Canopy Assessment", detail: "Check canopy structure for light penetration, note any crowding issues" }, kn: { task: "ಮುಡಿಯ ಮೌಲ್ಯಮಾಪನ", detail: "ಬೆಳಕಿನ ಪ್ರವೇಶಕ್ಕಾಗಿ ಮುಡಿಯ ರಚನೆ ಪರಿಶೀಲಿಸಿ, ಜನಸಂದ್ರತೆ ಸಮಸ್ಯೆಗಳನ್ನು ಗಮನಿಸಿ" } },
      { time: "1:00–2:00", icon: "🧪", en: { task: "Equipment Service", detail: "Service spray equipment, check hoses, replace worn parts" }, kn: { task: "ಸಾಧನ ಸೇವೆ", detail: "ಸೇವೆ ಸ್ಪ್ರೇ ಸಾಧನ, ನಳಿಕೆ ಪರಿಶೀಲಿಸಿ, ಉಡುಗೆ ಅಂಶ ಬದಲಾಯಿಸಿ" } },
      { time: "3:00–4:00", icon: "🌾", en: { task: "Compost & Biomass", detail: "Turn compost pile if applicable, mulch fallen branches and leaves" }, kn: { task: "ಸಮ್ಮಿಶ್ರ ಮಿಶ್ರ ಮತ್ತು ಜೈವಿಕ ದ್ರವ್ಯ", detail: "ಸಮ್ಮಿಶ್ರ ಪೈಲ್ ತಿರುಗಾಯಿ ಅನ್ವಯವಾಗಿದ್ದರೆ, ಬಿದ್ದ ಶಾಖೆ ಮತ್ತು ಎಲೆಗಳನ್ನು ಮಲ್ಚ್ ಮಾಡಿ" } },
      { time: "5:00–6:00", icon: "📋", en: { task: "Weekly Compilation", detail: "Compile field notes, update spreadsheet, prepare report for review" }, kn: { task: "ಸಾಪ್ತಾಹಿಕ ಸಂಗ್ರಹ", detail: "ಕ್ಷೇತ್ರ ಟಿಪ್ಪಣಿಗಳನ್ನು ಸಂಕಲಿತ ಮಾಡಿ, ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ, ಪರಿಶೀಲನೆಗೆ ವರದಿ ಸಿದ್ಧತೆ ಮಾಡಿ" } }
    ],
    saturday: [
      { time: "6:00–6:30", icon: "💧", en: { task: "Irrigation Check", detail: "Check drip lines for leaks, clean filters, adjust timer if needed" }, kn: { task: "ನೀರಾವರಿ ತಪಾಸಣೆ", detail: "ಡ್ರಿಪ್ ಲೈನುಗಳನ್ನು ಸೋರಿಕೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಪರಿಶೀಲಿಸಿ, ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಸ್ವಚ್ಛ ಮಾಡಿ, ಸಿಮರ್ ಹೊಂದಿಸಿ" } },
      { time: "8:00–10:00", icon: "📊", en: { task: "Market/Logistics Check", detail: "If selling, check market conditions, prepare harvest boxes, plan logistics" }, kn: { task: "ಮಾರುಕಟ್ಟೆ/ದಲಿಲಿ ಸಾಧನ", detail: "ಮಾರಿ ಮಾಡಿದ್ದರೆ, ಮಾರುಕಟ್ಟೆ ಪರಿಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ, ಕೊತ್ತಂಬರ ಬಾಕ್ಸ ಸಿದ್ಧತೆ ಮಾಡಿ, ದಲಿಲಿ ಯೋಜನೆ ಮಾಡಿ" } },
      { time: "10:00–12:00", icon: "🔍", en: { task: "Generalist Farm Walk", detail: "Relaxed walk through farm, casual observations, photo documentation" }, kn: { task: "ಸಾರ್ವತ್ರಿಕ ಮುಂಡಿ ಸಡಿಲು", detail: "ಮುಂಡಿ ಮೂಲಕ ವಿಸ್ತೃತ ಸಡಿಲು, ಸಾಸಂದರ್ಭಿಕ ವೀಕ್ಷಣೆ, ಫೋಟೋ ದಸ್ತಾವೇಜನ" } },
      { time: "1:00–2:00", icon: "🧪", en: { task: "Maintenance Tasks", detail: "Repair fences, fix signage, general farm beautification" }, kn: { task: "ನಿರ್ವಹಣೆ ಕಾರ್ಯಗಳು", detail: "ಬೇಲೆ ಸೋಲೆದು ಸರಿಪಡಿಸಿ, ಸಂಕೇತ ಸ್ಥಿರಗೊಳಿಸಿ, ಸಾಮಾನ್ಯ ಮುಂಡಿ ಸುಂದರೀಕರಣ" } },
      { time: "3:00–4:00", icon: "🌾", en: { task: "Next Week Planning", detail: "Review weather forecast, plan next week's sprays and activities" }, kn: { task: "ಮುಂದಿನ ವಾರ ಯೋಜನೆ", detail: "ಹವಾಮಾನ ಮುನ್ನೋಲ್ಪ ಪರಿಶೀಲಿಸಿ, ಮುಂದಿನ ವಾರದ ಸ್ಪ್ರೆ ಮತ್ತು ಚಟುವಟಿಕೆ ಯೋಜನೆ ಮಾಡಿ" } },
      { time: "5:00–6:00", icon: "📋", en: { task: "Rest & Reflection", detail: "Review week's work, note successes and improvements for next week" }, kn: { task: "ವಿಶ್ರಾಮ ಮತ್ತು ಚಿಂತನೆ", detail: "ವಾರದ ಕೆಲಸ ಪರಿಶೀಲಿಸಿ, ಯಶಸ್ಸು ಮತ್ತು ಮುಂದಿನ ವಾರಕ್ಕಾಗಿ ಸುಧಾರ ಗಮನಿಸಿ" } }
    ]
  },
  weekly: {
    sunday: [
      { time: "8:00–9:00", icon: "🔍", en: { task: "Weekly Inspection", detail: "Walk entire farm systematically, check every tree section for overall health" }, kn: { task: "ಸಾಪ್ತಾಹಿಕ ತಪಾಸಣೆ", detail: "ಮುಂಡಿಯನ್ನು ವ್ಯವಸ್ಥಿತವಾಗಿ ನಡೆಯಿರಿ, ಪ್ರತಿಯೊಂದು ಮರ ವಿಭಾಗ ಸಂಪೂರ್ಣ ಆರೋಗ್ಯ ಪರಿಶೀಲಿಸಿ" } },
      { time: "10:00–11:00", icon: "📊", en: { task: "Data Review", detail: "Review soil test results if available, analyze rainfall and temperature trends" }, kn: { task: "ಡೇಟಾ ಪರಿಶೀಲನೆ", detail: "ಲಭ್ಯವಿದ್ದರೆ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಫಲಿತಾಂಶ ಪರಿಶೀಲಿಸಿ, ಮಳೆ ಮತ್ತು ತಾಪಮಾನ ಪ್ರವೃತ್ತಿ ವಿಶ್ಲೇಷಿಸಿ" } },
      { time: "11:30–12:30", icon: "🌾", en: { task: "Strategic Planning", detail: "Plan next week's tasks, prepare input orders, schedule maintenance activities" }, kn: { task: "ಕೌಶಲ್ಯ ಯೋಜನೆ", detail: "ಮುಂದಿನ ವಾರದ ಕಾರ್ಯಗಳನ್ನು ಯೋಜನೆ ಮಾಡಿ, ಇನ್‌ಪುಟ್ ಆದೇಶ ಸಿದ್ಧತೆ ಮಾಡಿ, ನಿರ್ವಹಣೆ ಚಟುವಟಿಕೆ ಸಮಯಸೂಚಿ ಮಾಡಿ" } },
      { time: "1:30–2:30", icon: "📋", en: { task: "Report Compilation", detail: "Compile all weekly observations into master field log, create summary for records" }, kn: { task: "ವರದಿ ಸಂಗ್ರಹ", detail: "ಎಲ್ಲಾ ಸಾಪ್ತಾಹಿಕ ವೀಕ್ಷಣೆಗಳನ್ನು ಮಾಸ್ಟರ್ ಕ್ಷೇತ್ರ ಲಾಗ್‌ಗೆ ಸಂಕಲಿತ ಮಾಡಿ, ರೆಕಾರ್ಡ್‌ಗಳಿಗೆ ಸಂಕ್ಷೇಪ ರಚಿಸಿ" } },
      { time: "3:00–4:00", icon: "💧", en: { task: "System Maintenance", detail: "Service irrigation pumps, inspect main lines, check water pressure and filters" }, kn: { task: "ವ್ಯವಸ್ಥೆ ನಿರ್ವಹಣೆ", detail: "ಸೇವೆ ನೀರಾವರಿ ಪಂಪ್, ಮುಖ್ಯ ಲೈನುಗಳನ್ನು ತಪಾಸಿ, ನೀರಿನ ಒತ್ತಡ ಮತ್ತು ಫಿಲ್ಟರ್ ಪರಿಶೀಲಿಸಿ" } },
      { time: "4:30–5:30", icon: "🧪", en: { task: "Knowledge Update", detail: "Review agricultural news, check for pest/disease alerts, update personal notes" }, kn: { task: "ಜ್ಞಾನ ನವೀಕರಣ", detail: "ಕೃಷಿ ಸುದ್ದಿ ಪರಿಶೀಲಿಸಿ, ಕೀಟ/ರೋಗ ಎಚ್ಚರಿಕೆ ಪರಿಶೀಲಿಸಿ, ವ್ಯಕ್ತಿಗತ ಟಿಪ್ಪಣಿ ನವೀಕರಣ ಮಾಡಿ" } }
    ]
  }
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Try to fetch from static /audio/tasks.json (served by Netlify)
    const res = await fetch('https://' + req.headers.host + '/audio/tasks.json');

    if (res.ok) {
      const tasks = await res.json();
      return { statusCode: 200, body: JSON.stringify(tasks), headers };
    }
  } catch (error) {
    console.log('Tasks file not found, using defaults:', error.message);
  }

  // Return default tasks if file doesn't exist
  return { statusCode: 200, body: JSON.stringify(DEFAULT_TASKS), headers };
};
