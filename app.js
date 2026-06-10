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
let profileSupportsUsername = true;
const roleButtons = document.querySelectorAll("[data-role]");
const studentSelect = document.querySelector("#studentSelect");
const practiceForm = document.querySelector("#practiceForm");
const signinForm = document.querySelector("#signinForm");
const signinEmail = document.querySelector("#signinEmail");
const signinPassword = document.querySelector("#signinPassword");
const signinError = document.querySelector("#signinError");
const showSigninPassword = document.querySelector("#showSigninPassword");
const topbarSigninLink = document.querySelector("#topbarSigninLink");
const profileMenuButton = document.querySelector("#profileMenuButton");
const profileButtonName = document.querySelector("#profileButtonName");
const profileButtonEmail = document.querySelector("#profileButtonEmail");
const accountPanel = document.querySelector("#accountPanel");
const closeAccountPanel = document.querySelector("#closeAccountPanel");
const profileForm = document.querySelector("#profileForm");
const profileUsername = document.querySelector("#profileUsername");
const profileFullName = document.querySelector("#profileFullName");
const profileRole = document.querySelector("#profileRole");
const profileEmail = document.querySelector("#profileEmail");
const profilePassword = document.querySelector("#profilePassword");
const profilePasswordConfirm = document.querySelector("#profilePasswordConfirm");
const profileError = document.querySelector("#profileError");
const profileStatus = document.querySelector("#profileStatus");
const signOutButton = document.querySelector("#signOutButton");
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
  const accountType = profile?.role || "student";
  const role = accountType === "teacher" || accountType === "admin" ? "teacher" : "student";
  const student = accountType === "student" ? getStudentNameFromProfile(profile, email) : null;
  const fullName = profile?.full_name || getStudentNameFromEmail(email);
  const username = profile?.username || fullName;
  return {
    role,
    accountType,
    student,
    email,
    fullName,
    username,
    profileId: user.id,
    supabase: true
  };
}

function isMissingUsernameError(error) {
  const message = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("42703")
    || message.includes("username")
    || message.includes("column")
    || message.includes("schema cache");
}

async function fetchProfile(userId) {
  const fields = profileSupportsUsername
    ? "id, email, full_name, username, role, instrument"
    : "id, email, full_name, role, instrument";
  const result = await supabaseClient
    .from("profiles")
    .select(fields)
    .eq("id", userId)
    .maybeSingle();
  if (result.error && profileSupportsUsername && isMissingUsernameError(result.error)) {
    profileSupportsUsername = false;
    return fetchProfile(userId);
  }
  return result;
}

async function createProfile(profile) {
  const payload = profileSupportsUsername ? profile : { ...profile };
  if (!profileSupportsUsername) delete payload.username;
  const result = await supabaseClient
    .from("profiles")
    .insert(payload)
    .select(profileSupportsUsername ? "id, email, full_name, username, role, instrument" : "id, email, full_name, role, instrument")
    .single();
  if (result.error && profileSupportsUsername && isMissingUsernameError(result.error)) {
    profileSupportsUsername = false;
    return createProfile(profile);
  }
  return result;
}

async function getOrCreateProfile(user) {
  const { data, error } = await fetchProfile(user.id);

  if (data) return data;
  const email = user.email.toLowerCase();
  const allowedAccount = portalAccounts[email];
  if (!allowedAccount || allowedAccount.role !== "student") throw error || new Error("No portal profile found.");

  const student = allowedAccount.student;
  const fallbackProfile = {
    id: user.id,
    email,
    full_name: student,
    username: student,
    role: "student",
    instrument: students[student]?.instrument || null
  };
  const { data: created, error: createError } = await createProfile(fallbackProfile);
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
  await safelyLoadSupabaseLogs(account);
  return account;
}

function getLocalPortalAccount(email, password) {
  const account = portalAccounts[email];
  if (!account || password !== portalPassword) return null;
  if (account.role === "teacher") {
    return {
      ...account,
      accountType: "teacher",
      email,
      fullName: "Teacher",
      username: "Teacher"
    };
  }
  return {
    ...account,
    accountType: "student",
    email,
    fullName: account.student,
    username: account.student
  };
}

function accountDisplayName(account) {
  return account?.username || account?.fullName || account?.student || "Profile";
}

function updateProfileButton(account) {
  if (!topbarSigninLink || !profileMenuButton) return;
  if (!account) {
    topbarSigninLink.classList.remove("hidden");
    profileMenuButton.classList.add("hidden");
    return;
  }
  topbarSigninLink.classList.add("hidden");
  profileMenuButton.classList.remove("hidden");
  if (profileButtonName) profileButtonName.textContent = accountDisplayName(account);
  if (profileButtonEmail) profileButtonEmail.textContent = account.email || "";
}

function populateProfileForm(account) {
  if (!profileForm || !account) return;
  if (profileUsername) profileUsername.value = account.username || "";
  if (profileFullName) profileFullName.value = account.fullName || accountDisplayName(account);
  if (profileEmail) profileEmail.value = account.email || "";
  if (profileRole) {
    profileRole.value = account.accountType === "admin" ? "teacher" : account.accountType;
    const isStaff = account.accountType === "teacher" || account.accountType === "admin";
    [...profileRole.options].forEach(option => {
      option.disabled = option.value === "teacher" && !isStaff;
    });
  }
  if (profilePassword) profilePassword.value = "";
  if (profilePasswordConfirm) profilePasswordConfirm.value = "";
  if (profileError) profileError.classList.add("hidden");
  if (profileStatus) profileStatus.classList.add("hidden");
}

function showAccountPanel() {
  if (!accountPanel) {
    window.location.href = "portal.html#account";
    return;
  }
  populateProfileForm(activeAccount);
  accountPanel.classList.remove("hidden");
  accountPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideAccountPanel() {
  if (accountPanel) accountPanel.classList.add("hidden");
}

function resetPortalSession() {
  activeAccount = null;
  updateProfileButton(null);
  hideAccountPanel();
  const signinPanel = document.querySelector("#signinPanel");
  const portalShell = document.querySelector("#portalShell");
  if (portalShell) portalShell.classList.add("hidden");
  if (signinPanel) signinPanel.classList.remove("hidden");
}

async function loadAccountFromUser(user) {
  const profile = await getOrCreateProfile(user);
  const account = profileToAccount(profile, user);
  await safelyLoadSupabaseLogs(account);
  return account;
}

async function safelyLoadSupabaseLogs(account) {
  try {
    await loadSupabaseLogs(account);
  } catch (error) {
    console.warn("Practice logs could not be loaded.", error);
  }
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
    portalTitle.textContent = account.role === "student"
      ? `Welcome back, ${accountDisplayName(account)}`
      : "Teacher view";
  }
  if (portalSubtitle) {
    portalSubtitle.textContent = account.role === "student" && account.student
      ? "Nice to see you again. Warm up, listen closely, and give the music a few honest minutes today."
      : "Welcome back. Here is how the band has been showing up this week.";
  }
  if (studentSelect && account.student) studentSelect.value = account.student;
  updateProfileButton(account);
  populateProfileForm(account);
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
      const localAccount = getLocalPortalAccount(email, password);
      if (!localAccount) {
        signinError.textContent = "Please check the email address and password.";
        signinError.classList.remove("hidden");
        signinPassword.value = "";
        signinPassword.focus();
        return;
      }
      activeAccount = localAccount;
      signinError.classList.add("hidden");
      enterPortal(localAccount);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (showSigninPassword && signinPassword) {
  showSigninPassword.addEventListener("click", () => {
    const showing = signinPassword.type === "text";
    signinPassword.type = showing ? "password" : "text";
    showSigninPassword.textContent = showing ? "Show" : "Hide";
  });
}

if (profileMenuButton) {
  profileMenuButton.addEventListener("click", showAccountPanel);
}

if (closeAccountPanel) {
  closeAccountPanel.addEventListener("click", hideAccountPanel);
}

if (signOutButton) {
  signOutButton.addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    resetPortalSession();
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!activeAccount?.supabase || !supabaseClient) return;
    const fullName = profileFullName.value.trim();
    const username = profileUsername.value.trim();
    const email = profileEmail.value.trim().toLowerCase();
    const requestedRole = profileRole.value;
    const password = profilePassword.value;
    const passwordConfirm = profilePasswordConfirm.value;
    const isStaff = activeAccount.accountType === "teacher" || activeAccount.accountType === "admin";
    if (!fullName || !email) {
      profileError.textContent = "Please enter a display name and email address.";
      profileError.classList.remove("hidden");
      return;
    }
    if (requestedRole === "teacher" && !isStaff) {
      profileError.textContent = "Teacher access needs to be approved by an admin.";
      profileError.classList.remove("hidden");
      return;
    }
    if (password || passwordConfirm) {
      if (password.length < 6) {
        profileError.textContent = "Please choose a password with at least six characters.";
        profileError.classList.remove("hidden");
        return;
      }
      if (password !== passwordConfirm) {
        profileError.textContent = "The new passwords do not match.";
        profileError.classList.remove("hidden");
        return;
      }
    }

    const submitButton = profileForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    profileError.classList.add("hidden");
    profileStatus.classList.add("hidden");
    try {
      const nextRole = activeAccount.accountType === "admin" ? "admin" : requestedRole;
      const profileUpdate = {
        full_name: fullName,
        role: nextRole
      };
      if (profileSupportsUsername) profileUpdate.username = username || fullName;
      const { error: profileUpdateError } = await supabaseClient
        .from("profiles")
        .update(profileUpdate)
        .eq("id", activeAccount.profileId);
      if (profileUpdateError) {
        if (profileSupportsUsername && isMissingUsernameError(profileUpdateError)) {
          profileSupportsUsername = false;
          delete profileUpdate.username;
          const { error: retryProfileUpdateError } = await supabaseClient
            .from("profiles")
            .update(profileUpdate)
            .eq("id", activeAccount.profileId);
          if (retryProfileUpdateError) throw retryProfileUpdateError;
        } else {
          throw profileUpdateError;
        }
      }

      const authUpdates = {};
      if (email !== activeAccount.email) authUpdates.email = email;
      if (password) authUpdates.password = password;
      if (Object.keys(authUpdates).length) {
        const { error: authUpdateError } = await supabaseClient.auth.updateUser(authUpdates);
        if (authUpdateError) throw authUpdateError;
      }

      const { data: userData, error: userError } = await supabaseClient.auth.getUser();
      if (userError) throw userError;
      activeAccount = await loadAccountFromUser(userData.user);
      enterPortal(activeAccount);
      showAccountPanel();
      profileStatus.textContent = email !== activeAccount.email
        ? "Profile saved. Check your email to confirm the address change."
        : "Profile saved.";
      profileStatus.classList.remove("hidden");
    } catch (error) {
      profileError.textContent = "Profile could not be saved. Please try again.";
      profileError.classList.remove("hidden");
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

async function restorePortalSession() {
  if (!supabaseClient) {
    updateProfileButton(null);
    return;
  }
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data?.user) {
      updateProfileButton(null);
      return;
    }
    activeAccount = await loadAccountFromUser(data.user);
    if (signinForm) {
      enterPortal(activeAccount);
      if (window.location.hash === "#account" || window.location.hash === "#accountPanel") {
        showAccountPanel();
      }
    } else {
      updateProfileButton(activeAccount);
    }
  } catch (error) {
    updateProfileButton(null);
  }
}

renderLibrary();
restorePortalSession();
