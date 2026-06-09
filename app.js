const students = {
  Rumi: { instrument: "double bass", color: "#08708a" },
  Roxy: { instrument: "melodica", color: "#ef8345" },
  Leo: { instrument: "saxophone", color: "#8da56a" },
  Ariel: { instrument: "trumpet", color: "#f6d552" },
  Rafe: { instrument: "piano", color: "#11100b" }
};

const portalAccounts = {
  "rumi@theschoolofjazz.com": { role: "student", student: "Rumi" },
  "roxy@theschoolofjazz.com": { role: "student", student: "Roxy" },
  "leo@theschoolofjazz.com": { role: "student", student: "Leo" },
  "ariel@theschoolofjazz.com": { role: "student", student: "Ariel" },
  "rafe@theschoolofjazz.com": { role: "student", student: "Rafe" },
  "admin@theschoolofjazz.com": { role: "teacher" }
};

const portalPassword = "SchoolOfJazz2026";
const practiceStorageKey = "school-of-jazz-practice-live";
localStorage.removeItem("school-of-jazz-practice");

const library = [
  {
    title: "The Girl from Ipanema",
    artist: "Stan Getz",
    type: "Performance",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Stan%20Getz%20%281965%29.png",
    copy: "Listen for the relaxed bossa nova pulse, the gentle melody, and the way the band keeps the time floating.",
    url: "https://www.youtube.com/results?search_query=Getz+Gilberto+The+Girl+from+Ipanema"
  },
  {
    title: "All Blues",
    artist: "Miles Davis",
    type: "Listening",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Miles%20Davis%20Press%20Photo%20%28High%20Quality%29%20%28cropped%29.jpg",
    copy: "Hear the slow six feel, the spacious melody, and the way Miles Davis lets every phrase breathe.",
    url: "https://www.youtube.com/results?search_query=Miles+Davis+All+Blues"
  },
  {
    title: "Canteloupe Island",
    artist: "Herbie Hancock",
    type: "Groove",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Herbie%20Hancock%20%28ZMF%202017%29%20IMGP9656.jpg",
    copy: "Follow the repeating piano riff, the earthy swing, and the strong shape of Herbie Hancock's melody.",
    url: "https://www.youtube.com/results?search_query=Herbie+Hancock+Canteloupe+Island"
  },
  {
    title: "Watermelon Man",
    artist: "Herbie Hancock",
    type: "Rhythm",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Herbie%20Hancock%20%28ZMF%202017%29%20IMGP9656.jpg",
    copy: "Listen for the bluesy hook, the dance feel, and the way the rhythm section makes the tune bounce.",
    url: "https://www.youtube.com/results?search_query=Herbie+Hancock+Watermelon+Man"
  },
  {
    title: "Sunny Side of the Street",
    artist: "Louis Armstrong",
    type: "Song",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/%28Portrait%20of%20Louis%20Armstrong%2C%20Carnegie%20Hall%2C%20New%20York%2C%20N.Y.%2C%20ca.%20Apr.%201947%29%20%28LOC%29%20%284843734010%29.jpg",
    copy: "Hear Louis Armstrong's warmth, swing, and storytelling: every line feels like speech turned into music.",
    url: "https://www.youtube.com/results?search_query=Louis+Armstrong+Sunny+Side+of+the+Street"
  }
];

let logs = loadLogs();
saveLogs();
let activeAccount = null;
const supabaseClient = window.schoolJazzSupabase || null;
const roleButtons = document.querySelectorAll("[data-role]");
const studentSelect = document.querySelector("#studentSelect");
const practiceForm = document.querySelector("#practiceForm");
const signinForm = document.querySelector("#signinForm");
const signinEmail = document.querySelector("#signinEmail");
const signinPassword = document.querySelector("#signinPassword");
const signinError = document.querySelector("#signinError");
const signupForm = document.querySelector("#signupForm");
const signupName = document.querySelector("#signupName");
const signupEmail = document.querySelector("#signupEmail");
const signupError = document.querySelector("#signupError");
const signupPanel = document.querySelector("#signupPanel");
const signupSuccess = document.querySelector("#signupSuccess");

function daysAgo(amount) {
  const date = new Date();
  date.setDate(date.getDate() - amount);
  return date.toISOString().slice(0, 10);
}

function loadLogs() {
  const saved = localStorage.getItem(practiceStorageKey);
  return migrateLogs(saved ? JSON.parse(saved) : []);
}

function saveLogs() {
  localStorage.setItem(practiceStorageKey, JSON.stringify(logs));
}

function saveSignupInterest(name, email) {
  const saved = localStorage.getItem("school-of-jazz-signups");
  const signups = saved ? JSON.parse(saved) : [];
  signups.push({
    name,
    email,
    date: new Date().toISOString()
  });
  localStorage.setItem("school-of-jazz-signups", JSON.stringify(signups));
}

function getStudentNameFromEmail(email) {
  const prefix = email.split("@")[0];
  return Object.keys(students).find(name => name.toLowerCase() === prefix) || prefix;
}

function getStudentNameFromProfile(profile, email) {
  const candidate = profile?.full_name || getStudentNameFromEmail(email);
  return Object.keys(students).find(name => name.toLowerCase() === String(candidate).toLowerCase()) || candidate;
}

function profileToAccount(profile, user) {
  const email = user.email.toLowerCase();
  const role = profile?.role === "teacher" || profile?.role === "admin" ? "teacher" : "student";
  const student = role === "student" ? getStudentNameFromProfile(profile, email) : null;
  return {
    role,
    student,
    profileId: user.id,
    supabase: true
  };
}

async function getOrCreateProfile(user) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, full_name, role, instrument")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data;
  const email = user.email.toLowerCase();
  const allowedAccount = portalAccounts[email];
  if (!allowedAccount || allowedAccount.role !== "student") throw error || new Error("No portal profile found.");

  const student = allowedAccount.student;
  const fallbackProfile = {
    id: user.id,
    email,
    full_name: student,
    role: "student",
    instrument: students[student]?.instrument || null
  };
  const { data: created, error: createError } = await supabaseClient
    .from("profiles")
    .insert(fallbackProfile)
    .select("id, email, full_name, role, instrument")
    .single();
  if (createError) throw createError;
  return created;
}

function mapPracticeLog(row, fallbackStudent) {
  return {
    supabaseId: row.id,
    studentId: row.student_id,
    student: row.profiles?.full_name || fallbackStudent || "Student",
    date: row.practiced_on,
    song: row.song,
    minutes: row.minutes,
    note: row.note || "Showed up and played."
  };
}

async function loadSupabaseLogs(account) {
  if (!supabaseClient || !account?.supabase) return;
  const { data, error } = await supabaseClient
    .from("practice_logs")
    .select("id, student_id, practiced_on, song, minutes, note, profiles(full_name)")
    .order("practiced_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  logs = (data || []).map(row => mapPracticeLog(row, account.student));
  saveLogs();
}

async function signInWithSupabase(email, password) {
  if (!supabaseClient) throw new Error("Supabase is not loaded.");
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await getOrCreateProfile(data.user);
  const account = profileToAccount(profile, data.user);
  await loadSupabaseLogs(account);
  return account;
}

async function registerSignupInterest(name, email) {
  if (!supabaseClient) return;
  const { error } = await supabaseClient
    .from("signup_interests")
    .insert({ name, email });
  if (error) throw error;
}

function isAlreadyRegisteredError(error) {
  const message = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("23505")
    || message.includes("duplicate")
    || message.includes("already")
    || message.includes("unique");
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
  if (!weekStrip) return;
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
  if (!studentSelect) return;
  const student = studentSelect.value;
  const streak = calculateStreak(student);
  document.querySelector("#streakCount").textContent = streak;
  document.querySelector("#streakMessage").textContent = streak > 0
    ? "The band can lean on that kind of showing up."
    : "Show up today. Ten honest minutes counts.";
  renderWeek(student);

  const bandLogs = logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  document.querySelector("#studentLogs").innerHTML = bandLogs.map(log => logTemplate(log, true)).join("");
}

function renderTeacher() {
  const rosterNode = document.querySelector("#roster");
  const teacherLogsNode = document.querySelector("#teacherLogs");
  if (!rosterNode || !teacherLogsNode) return;
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

  rosterNode.innerHTML = roster;
  teacherLogsNode.innerHTML = logs
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
  const libraryGrid = document.querySelector("#libraryGrid");
  if (!libraryGrid) return;
  libraryGrid.innerHTML = library.map(item => `
    <article class="library-card">
      <img class="library-artist" src="${item.image}" alt="${item.artist}" loading="lazy">
      <h3>${item.title}</h3>
      <p><b>${item.artist}</b></p>
      <p>${item.copy}</p>
      <a href="${item.url}" target="_blank" rel="noreferrer">Open inspiration</a>
    </article>
  `).join("");
}

function setPortalRole(role) {
  const portalShell = document.querySelector("#portalShell");
  const studentView = document.querySelector(".student-view");
  const teacherView = document.querySelector(".teacher-view");
  if (portalShell) {
    portalShell.classList.toggle("portal-mode-student", role === "student");
    portalShell.classList.toggle("portal-mode-teacher", role === "teacher");
  }
  roleButtons.forEach(item => item.classList.toggle("active", item.dataset.role === role));
  if (studentView) studentView.classList.toggle("hidden", role !== "student");
  if (teacherView) teacherView.classList.toggle("hidden", role !== "teacher");
}

function enterPortal(account) {
  const signinPanel = document.querySelector("#signinPanel");
  const portalShell = document.querySelector("#portalShell");
  const portalTitle = document.querySelector("#portalTitle");
  const portalSubtitle = document.querySelector("#portalSubtitle");
  if (signinPanel) signinPanel.classList.add("hidden");
  if (portalShell) portalShell.classList.remove("hidden");
  if (portalTitle) {
    portalTitle.textContent = account.role === "student" && account.student
      ? `Welcome back, ${account.student}`
      : "Teacher view";
  }
  if (portalSubtitle) {
    portalSubtitle.textContent = account.role === "student" && account.student
      ? "Nice to see you again. Warm up, listen closely, and give the music a few honest minutes today."
      : "Welcome back. Here is how the band has been showing up this week.";
  }
  if (studentSelect && account.student) studentSelect.value = account.student;
  setPortalRole(account.role);
  renderStudent();
  renderTeacher();
}

if (signinForm) {
  signinForm.addEventListener("submit", async event => {
    event.preventDefault();
    const email = signinEmail.value.trim().toLowerCase();
    const password = signinPassword.value;
    const submitButton = signinForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    try {
      const account = await signInWithSupabase(email, password);
      activeAccount = account;
      signinError.classList.add("hidden");
      enterPortal(account);
    } catch (error) {
      if (supabaseClient) {
        signinError.textContent = "Please check the email address and password.";
        signinError.classList.remove("hidden");
        signinPassword.value = "";
        signinPassword.focus();
        return;
      }
      const account = portalAccounts[email];
      const passwordMatches = password === portalPassword;
      if (!account || !passwordMatches) {
        signinError.textContent = "Please check the email address and password.";
        signinError.classList.remove("hidden");
        signinPassword.value = "";
        signinPassword.focus();
        return;
      }
      activeAccount = account;
      signinError.classList.add("hidden");
      enterPortal(account);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async event => {
    event.preventDefault();
    const name = signupName.value.trim();
    const email = signupEmail.value.trim().toLowerCase();
    if (!name || !email) {
      signupError.textContent = "Please enter a name and email address.";
      signupError.classList.remove("hidden");
      return;
    }
    signupError.classList.add("hidden");
    const submitButton = signupForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    try {
      signupEmail.value = email;
      try {
        await registerSignupInterest(name, email);
      } catch (error) {
        if (!isAlreadyRegisteredError(error)) console.warn("Signup interest could not be saved to Supabase.", error);
      }
      const response = await fetch(signupForm.action, {
        method: "POST",
        body: new FormData(signupForm),
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Form submission failed");
      saveSignupInterest(name, email);
      signupForm.reset();
      if (signupPanel) signupPanel.classList.add("hidden");
      if (signupSuccess) signupSuccess.classList.remove("hidden");
    } catch (error) {
      signupError.textContent = "Something went wrong. Please try again in a moment.";
      signupError.classList.remove("hidden");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

roleButtons.forEach(button => {
  button.addEventListener("click", () => {
    setPortalRole(button.dataset.role);
  });
});

if (studentSelect) {
  studentSelect.addEventListener("change", renderStudent);
}

if (practiceForm) {
  practiceForm.addEventListener("submit", async event => {
    event.preventDefault();
    const noteInput = document.querySelector("#noteInput");
    const entry = {
      student: studentSelect.value,
      date: daysAgo(0),
      song: document.querySelector("#songInput").value,
      minutes: Number(document.querySelector("#minutesInput").value),
      note: noteInput.value.trim() || "Showed up and played."
    };
    if (activeAccount?.supabase && supabaseClient) {
      const { error } = await supabaseClient
        .from("practice_logs")
        .insert({
          student_id: activeAccount.profileId,
          practiced_on: entry.date,
          song: entry.song,
          minutes: entry.minutes,
          note: entry.note
        });
      if (error) {
        alert("Practice could not be saved. Please try again.");
        return;
      }
      await loadSupabaseLogs(activeAccount);
    } else {
      logs.unshift(entry);
      saveLogs();
    }
    noteInput.value = "";
    renderStudent();
    renderTeacher();
  });
}

renderLibrary();
