// Base URL where all PHP API files are located
const urlBase = 'http://cop4331-group2.me/LAMPAPI';
const extension = 'php';

// Global variables to store current user session data
let userId = 0;
let firstName = "";
let lastName = "";

// ================== AUTH ==================
function doLogin()
{
  userId = 0; firstName = ""; lastName = "";

  let login = document.getElementById("loginName")?.value || "";
  let password = document.getElementById("loginPassword")?.value || "";
  document.getElementById("loginResult") && (document.getElementById("loginResult").innerHTML = "");

  let jsonPayload = JSON.stringify({ login, password });
  let url = `${urlBase}/Login.${extension}`;

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let jsonObject = JSON.parse(xhr.responseText);
        userId = jsonObject.id;

        if (userId < 1) {
          document.getElementById("loginResult").innerHTML = "User/Password combination incorrect";
          return;
        }
        firstName = jsonObject.firstName || "";
        lastName  = jsonObject.lastName || "";
        saveCookie();
        window.location.href = "contacts.html";
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    document.getElementById("loginResult").innerHTML = err.message;
  }
}

function saveCookie()
{
  let minutes = 20;
  let date = new Date();
  date.setTime(date.getTime() + (minutes * 60 * 1000));
  document.cookie = `firstName=${firstName},lastName=${lastName},userId=${userId};expires=${date.toGMTString()}`;
}

function readCookie()
{
  userId = -1;
  let data = document.cookie || "";
  let splits = data.split(",");
  for (let i = 0; i < splits.length; i++) {
    let thisOne = splits[i].trim();
    let tokens = thisOne.split("=");
    if (tokens[0] == "firstName") firstName = tokens[1] || "";
    else if (tokens[0] == "lastName") lastName = tokens[1] || "";
    else if (tokens[0] == "userId") userId = parseInt((tokens[1] || "").trim());
  }

  if (userId < 0) {
    window.location.href = "index.html";
  } else {
    const nameEl = document.getElementById("userName");
    if (nameEl) nameEl.innerHTML = "Logged in as " + firstName + " " + lastName;
  }
}

function doLogout()
{
  userId = 0; firstName = ""; lastName = "";
  document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  window.location.href = "index.html";
}

// ================== CONTACTS CRUD ==================

// Helper: normalize record fields from server
function normalizeContact(rec) {
  // support both camelCase and possible DB-like naming
  return {
    id: rec.id ?? rec.ID ?? rec.contactId ?? rec.ContactID ?? rec.contactID,
    firstName: rec.firstName ?? rec.FirstName ?? rec.fname ?? rec.first_name,
    lastName:  rec.lastName ?? rec.LastName ?? rec.lname ?? rec.last_name,
    phoneNumber: rec.phoneNumber ?? rec.Phone ?? rec.phone ?? rec.PhoneNumber,
    email: rec.email ?? rec.Email
  };
}

// Render list into #contactsList
function renderContacts(list) {
  const container = document.getElementById("contactsList");
  if (!container) return;

  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = `<div class="empty">No contacts found.</div>`;
    return;
  }

  const rows = list.map((raw) => {
    const c = normalizeContact(raw);
    const safeId = c.id ?? ""; // some endpoints may not return id in search; handle accordingly
    const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
    const phone = c.phoneNumber ?? "";
    const email = c.email ?? "";
    return `
      <div class="contact-row">
        <div class="contact-main">
          <div class="contact-name">${name || "(no name)"}</div>
          <div class="contact-meta">${phone ? phone + " • " : ""}${email || ""}</div>
        </div>
        <div class="contact-actions">
          <button class="buttons small" onclick='startEditContact(${JSON.stringify({ id: safeId, firstName: c.firstName, lastName: c.lastName, phoneNumber: phone, email: email })});'>Edit</button>
          <button class="buttons small danger" ${safeId ? `onclick="deleteContact('${safeId}');"` : "disabled"}>Delete</button>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = rows;
}

// Load all contacts for the user (empty search → all)
function loadContacts() {
  if (!userId || userId < 1) return;

  const url = `${urlBase}/SearchContacts.${extension}`;
  const payload = JSON.stringify({ search: "", userId });

  const statusEl = document.getElementById("contactSearchResult");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        statusEl && (statusEl.innerHTML = "");
        const res = JSON.parse(xhr.responseText || "{}");
        const list = res.results || res.result || [];
        renderContacts(list);
      }
    };
    xhr.send(payload);
  } catch (err) {
    statusEl && (statusEl.innerHTML = err.message);
  }
}

// Add Contact (matches your Contact.php file name)
function addContact()
{
  const f = document.getElementById("fname")?.value?.trim() || "";
  const l = document.getElementById("lname")?.value?.trim() || "";
  const p = document.getElementById("number")?.value?.trim() || "";
  const e = document.getElementById("email")?.value?.trim() || "";

  const resEl = document.getElementById("contactAddResult");
  if (resEl) resEl.innerHTML = "";

  // If we're in edit mode, call update instead
  const editingId = document.getElementById("contactId")?.value || "";
  if (editingId) {
    updateContact();
    return;
  }

  const tmp = { firstName: f, lastName: l, phoneNumber: p, email: e, userId };
  const jsonPayload = JSON.stringify(tmp);

  const url = `${urlBase}/Contact.${extension}`;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        if (resEl) resEl.innerHTML = "Contact has been added";
        document.getElementById("fname").value = "";
        document.getElementById("lname").value = "";
        document.getElementById("number").value = "";
        document.getElementById("email").value = "";
        loadContacts();
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    if (resEl) resEl.innerHTML = err.message;
  }
}

// Start editing (prefill form & switch button label to "Update Contact")
function startEditContact(contact)
{
  document.getElementById("contactId")?.setAttribute("value", contact.id || "");
  document.getElementById("fname").value = contact.firstName || "";
  document.getElementById("lname").value = contact.lastName || "";
  document.getElementById("number").value = contact.phoneNumber || "";
  document.getElementById("email").value = contact.email || "";

  const addBtn = document.getElementById("addContactButton");
  if (addBtn) addBtn.textContent = "Update Contact";

  // ensure the form is visible if you use a slide-down
  const fs = document.getElementById('contactFormFieldset');
  const toggleBtn = document.getElementById('toggleContactFormButton');
  if (fs && !fs.classList.contains('show')) {
    fs.classList.add('show');
    if (toggleBtn) toggleBtn.textContent = 'Hide Contact Form';
  }
}

// Update Contact
function updateContact()
{
  const id = document.getElementById("contactId")?.value || "";
  const f = document.getElementById("fname")?.value?.trim() || "";
  const l = document.getElementById("lname")?.value?.trim() || "";
  const p = document.getElementById("number")?.value?.trim() || "";
  const e = document.getElementById("email")?.value?.trim() || "";

  const resEl = document.getElementById("contactAddResult");
  if (resEl) resEl.innerHTML = "";

  if (!id) {
    if (resEl) resEl.innerHTML = "No contact selected for update.";
    return;
  }

  const tmp = { id, firstName: f, lastName: l, phoneNumber: p, email: e, userId };
  const jsonPayload = JSON.stringify(tmp);

  const url = `${urlBase}/UpdateContacts.${extension}`;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        if (resEl) resEl.innerHTML = "Contact updated";
        document.getElementById("contactId").value = "";
        document.getElementById("addContactButton").textContent = "Add Contact";
        loadContacts();
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    if (resEl) resEl.innerHTML = err.message;
  }
}

// Delete Contact
function deleteContact(id)
{
  if (!id) return;
  const url = `${urlBase}/DeleteContacts.${extension}`;
  const payload = JSON.stringify({ id, userId });

  const resEl = document.getElementById("contactSearchResult");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        resEl && (resEl.innerHTML = "Contact deleted");
        loadContacts();
      }
    };
    xhr.send(payload);
  } catch (err) {
    resEl && (resEl.innerHTML = err.message);
  }
}

// Search (renders into the same list box to keep UI consistent)
function searchContact()
{
  const srch = document.getElementById("searchText")?.value || "";
  const statusEl = document.getElementById("contactSearchResult");
  statusEl && (statusEl.innerHTML = "");

  const url = `${urlBase}/SearchContacts.${extension}`;
  const payload = JSON.stringify({ search: srch, userId });

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        statusEl && (statusEl.innerHTML = "Contact(s) retrieved");
        const jsonObject = JSON.parse(xhr.responseText || "{}");
        const list = jsonObject.results || jsonObject.result || [];
        renderContacts(list);
      }
    };
    xhr.send(payload);
  } catch (err) {
    statusEl && (statusEl.innerHTML = err.message);
  }
}

// ================== SIGNUP ==================
function doSignUp()
{
  let firstName = document.getElementById("firstName")?.value || "";
  let lastName  = document.getElementById("lastName")?.value || "";
  let username  = document.getElementById("username")?.value || "";
  let password  = document.getElementById("password")?.value || "";

  let out = document.getElementById("signupResult");
  out && (out.innerHTML = "");

  if (!firstName || !lastName || !username || !password) {
    out && (out.innerHTML = "All fields are required");
    return;
  }

  let jsonPayload = JSON.stringify({ firstName, lastName, login: username, password });
  let url = `${urlBase}/Register.${extension}`;

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  try {
    xhr.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let jsonObject = JSON.parse(xhr.responseText || "{}");
        if (jsonObject.error && jsonObject.error !== "") {
          out && (out.innerHTML = jsonObject.error);
          return;
        }
        out && (out.innerHTML = "Account created successfully! Redirecting to login...");
        setTimeout(function() { window.location.href = "index.html"; }, 2000);
      }
    };
    xhr.send(jsonPayload);
  } catch (err) {
    out && (out.innerHTML = err.message);
  }
}