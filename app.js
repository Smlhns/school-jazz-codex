const students = {
  Rumi: { instrument: "double bass", color: "#08708a" },
  Roxy: { instrument: "melodica", color: "#ef8345" },
  Leo: { instrument: "saxophone", color: "#8da56a" },
  Ariel: { instrument: "trumpet", color: "#f6d552" },
  Rafe: { instrument: "piano", color: "#11100b" }
};

const seedLogs = [
  { student: "Rumi", date: daysAgo(0), song: "The Girl from Ipanema", minutes: 14, note: "Bass line stayed steady with the record." },
  { student: "Rumi", date: daysAgo(1), song: "All Blues", minutes: 10, note: "Found the root notes without stopping." },
  { student: "Rumi", date: daysAgo(2), song: "Sunny Side of the Street", minutes: 12, note: "Counted four bars before coming in." },
  { student: "Roxy", date: daysAgo(0), song: "Canteloupe Island", minutes: 16, note: "Sang the melody before playing it." },
  { student: "Leo", date: daysAgo(1), song: "Watermelon Man", minutes: 11, note: "Long tones sounded warmer." },
  { student: "Ariel", date: daysAgo(0), song: "The Girl from Ipanema", minutes: 9, note: "Clean attacks on the first phrase." },
  { student: "Rafe", date: daysAgo(3), song: "All Blues", minutes: 20, note: "Comped quietly and left more space." }
];

const library = [
  {
    title: "Stan Getz",
    type: "Performance",
    copy: "Hear the saxophone sing with a voice-like tone and relaxed time.",
    url: "https://www.youtube.com/results?search_query=Stan+Getz+The+Girl+from+Ipanema+live"
  },
  {
    title: "Joao Gilberto",
    type: "Listening",
    copy: "Bossa nova guitar as a heartbeat: quiet, precise, and full of air.",
    url: "https://www.youtube.com/results?search_query=Joao+Gilberto+bossa+nova+live"
  },
  {
    title: "Astrud Gilberto",
    type: "Voice",
    copy: "A lesson in melody, understatement, and singing a phrase like a sentence.",
    url: "https://www.youtube.com/results?search_query=Astrud+Gilberto+Girl+from+Ipanema"
  },
  {
    title: "Antonio Carlos Jobim",
    type: "Composer",
    copy: "The harmony and colour behind the songs: elegant, generous, unforgettable.",
    url: "https://www.youtube.com/results?search_query=Antonio+Carlos+Jobim+performance"
  }
];

let logs = loadLogs();
saveLogs();
const roleButtons = document.querySelectorAll("[data-role]");
const studentSelect = document.querySelector("#studentSelect");
const practiceForm = document.querySelector("#practiceForm");

function daysAgo(amount) {
  const date = new Date();
  date.setDate(date.getDate() - amount);
  return date.toISOString().slice(0, 10);
}

function loadLogs() {
  const saved = localStorage.getItem("school-of-jazz-practice");
  return migrateLogs(saved ? JSON.parse(saved) : seedLogs);
}

function saveLogs() {
  localStorage.setItem("school-of-jazz-practice", JSON.stringify(logs));
}

function migrateLogs(items) {
  const replacements = {
    "Blue Bossa": "All Blues",
    "All Blues (Miles Davis)": "All Blues",
    "Autumn Leaves": "Canteloupe Island",
    "Canteloupe Island (Herbie Hancock)": "Canteloupe Island",
    "Watermelon Man (Herbie Hancock)": "Watermelon Man",
    "So What": "Sunny Side of the Street",
    "Sunny Side of the Street (Louis Armstrong)": "Sunny Side of the Street"
  };
  return items.map(log => ({
    ...log,
    song: replacements[log.song] || log.song
  }));
}

function prettyDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function calculateStreak(student) {
  const practisedDays = new Set(logs.filter(log => log.student === student).map(log => log.date));
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const date = daysAgo(i);
    if (!practisedDays.has(date)) break;
    streak += 1;
  }
  return streak;
}

function renderWeek(student) {
  const practisedDays = new Set(logs.filter(log => log.student === student).map(log => log.date));
  const weekStrip = document.querySelector("#weekStrip");
  weekStrip.innerHTML = "";
  for (let i = 6; i >= 0; i -= 1) {
    const date = daysAgo(i);
    const day = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1);
    const cell = document.createElement("div");
    cell.className = `day-dot${practisedDays.has(date) ? " done" : ""}`;
    cell.textContent = day;
    cell.title = `${prettyDate(date)} ${practisedDays.has(date) ? "practised" : "not logged"}`;
    weekStrip.appendChild(cell);
  }
}

function renderStudent() {
  const student = studentSelect.value;
  const streak = calculateStreak(student);
  document.querySelector("#streakCount").textContent = streak;
  document.querySelector("#streakMessage").textContent = streak > 0
    ? "The band can lean on that kind of showing up."
    : "Show up today. Ten honest minutes counts.";
  renderWeek(student);

  const studentLogs = logs
    .filter(log => log.student === student)
    .sort((a, b) => b.date.localeCompare(a.date));
  document.querySelector("#studentLogs").innerHTML = studentLogs.map(logTemplate).join("");
}

function renderTeacher() {
  const roster = Object.entries(students).map(([name, meta]) => {
    const studentLogs = logs.filter(log => log.student === name);
    const total = studentLogs.reduce((sum, log) => sum + Number(log.minutes), 0);
    return `
      <article class="student-row">
        <div class="date-chip" style="background:${meta.color}">${calculateStreak(name)}</div>
        <div>
          <h3>${name}</h3>
          <p>${meta.instrument} · ${studentLogs.length} logs</p>
        </div>
        <b class="minutes">${total} min</b>
      </article>
    `;
  }).join("");

  document.querySelector("#roster").innerHTML = roster;
  document.querySelector("#teacherLogs").innerHTML = logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(log => logTemplate(log, true))
    .join("");
}

function logTemplate(log, showStudent = false) {
  return `
    <article class="log-entry">
      <div class="date-chip">${prettyDate(log.date)}</div>
      <div>
        <h3>${showStudent ? `${log.student} · ` : ""}${log.song}</h3>
        <p>${log.note}</p>
      </div>
      <b class="minutes">${log.minutes} min</b>
    </article>
  `;
}

function renderLibrary() {
  document.querySelector("#libraryGrid").innerHTML = library.map(item => `
    <article class="library-card">
      <h3>${item.title}</h3>
      <p><b>${item.type}</b></p>
      <p>${item.copy}</p>
      <a href="${item.url}" target="_blank" rel="noreferrer">Open inspiration</a>
    </article>
  `).join("");
}

roleButtons.forEach(button => {
  button.addEventListener("click", () => {
    roleButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const role = button.dataset.role;
    document.querySelector(".student-view").classList.toggle("hidden", role !== "student");
    document.querySelector(".teacher-view").classList.toggle("hidden", role !== "teacher");
  });
});

studentSelect.addEventListener("change", renderStudent);

practiceForm.addEventListener("submit", event => {
  event.preventDefault();
  const noteInput = document.querySelector("#noteInput");
  logs.unshift({
    student: studentSelect.value,
    date: daysAgo(0),
    song: document.querySelector("#songInput").value,
    minutes: Number(document.querySelector("#minutesInput").value),
    note: noteInput.value.trim() || "Showed up and played."
  });
  saveLogs();
  noteInput.value = "";
  renderStudent();
  renderTeacher();
});

renderStudent();
renderTeacher();
renderLibrary();
