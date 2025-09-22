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
          <button class="buttons small edit-btn"
            data-id="${c.id ?? c.ID ?? c.Id ?? ''}"
            data-first="${(c.firstName ?? c.FirstName ?? '').replace(/"/g,'&quot;')}"
            data-last="${(c.lastName ?? c.LastName ?? '').replace(/"/g,'&quot;')}"
            data-phone="${(c.phone ?? c.Phone ?? c.phoneNumber ?? '').replace(/"/g,'&quot;')}"
            data-email="${(c.email ?? c.Email ?? '').replace(/"/g,'&quot;')}">
            Edit
          </button>

          <button class="buttons small danger" ${safeId ? `data-delete-id="${safeId}"` : "disabled"}>
            Delete
          </button>
        </div>
      </div>
    `;

  }).join("");

  container.innerHTML = rows;
  // Edit handlers
  container.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      startEditContact({
        id: btn.dataset.id || "",
        firstName: btn.dataset.first || "",
        lastName: btn.dataset.last || "",
        phone: btn.dataset.phone || "",
        email: btn.dataset.email || ""
      });
    });
  });

  // Delete handlers
  container.querySelectorAll("[data-delete-id]").forEach(btn => {
    btn.addEventListener("click", () => deleteContact(btn.getAttribute("data-delete-id")));
  });

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
function addContact() {
  const f = document.getElementById("fname")?.value?.trim() || "";
  const l = document.getElementById("lname")?.value?.trim() || "";
  const p = document.getElementById("number")?.value?.trim() || "";
  const e = document.getElementById("email")?.value?.trim() || "";
  const resEl = document.getElementById("contactAddResult");
  if (resEl) resEl.innerHTML = "";

  // if we're in edit mode, update instead
  const editingId = document.getElementById("contactId")?.value || "";
  if (editingId) { updateContact(); return; }


  // simple client validation (because button type="button" bypasses HTML5 pattern)
  const phoneOk = /^[0-9]{3}-?[0-9]{3}-?[0-9]{4}$/.test(p);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  if (!f || !l || !phoneOk || !emailOk) {
    resEl && (resEl.textContent = "Please enter valid first/last name, phone (###-###-####), and email.");
    return;
  }

  // *** use the keys Contact.php expects ***
  const tmp = { userId, firstName: f, lastName: l, phone: p, email: e };
  const jsonPayload = JSON.stringify(tmp);

  const url = `${urlBase}/Contact.${extension}`;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        document.getElementById("fname").value = "";
        document.getElementById("lname").value = "";
        document.getElementById("number").value = "";
        document.getElementById("email").value = "";
        resetFormState();
        resEl && (resEl.textContent = "Contact has been added");
        loadContacts();
      } else {
        // show backend error to help debug
        resEl && (resEl.textContent = `Add failed (${this.status}): ${xhr.responseText || "Server Error"}`);
      }
    }
  };
  xhr.send(jsonPayload);
}

// Start editing (prefill form & switch button label to "Update Contact")
function startEditContact(contact) {
  (function openFormForEdit() {
    const form = document.getElementById('contactFormFieldset');
    const btn  = document.getElementById('toggleContactFormButton');
    if (form && !form.classList.contains('show')) {
      form.classList.add('show');           // same class your toggle adds
      if (btn) btn.textContent = 'Hide Contact Form';
    }
    // focus & scroll
    setTimeout(() => {
      document.getElementById('fname')?.focus();
      form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  })();
  // contact should include an id and fields (from your search results)
  document.getElementById("contactId").value = contact.id || "";
  document.getElementById("fname").value     = contact.firstName || "";
  document.getElementById("lname").value     = contact.lastName  || "";
  document.getElementById("number").value    = contact.phone     || "";   // <-- phone
  document.getElementById("email").value     = contact.email     || "";

  const addBtn = document.getElementById("addContactButton");
  if (addBtn) addBtn.textContent = "Update Contact";

}


// Update Contact
function updateContact() {
  const id = document.getElementById("contactId")?.value || "";
  const f  = document.getElementById("fname")?.value?.trim() || "";
  const l  = document.getElementById("lname")?.value?.trim() || "";
  const p  = document.getElementById("number")?.value?.trim() || "";
  const e  = document.getElementById("email")?.value?.trim() || "";

  const out = document.getElementById("contactAddResult");
  if (!id) { out && (out.textContent = "No contact selected for update."); return; }

  // match UpdateContacts.php: contactId + phone
  const payload = JSON.stringify({
    contactId: Number(id),
    userId,
    firstName: f,
    lastName:  l,
    phone:     p,
    email:     e
  });

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `${urlBase}/UpdateContacts.${extension}`, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        document.getElementById("contactId").value = "";
        document.getElementById("addContactButton").textContent = "Add Contact";
        resetFormState();
        out && (out.textContent = "Contact updated");
        loadContacts();
      } else {
        out && (out.textContent = `Update failed (${this.status}): ${this.responseText || "Server Error"}`);
      }
    }
  };
  xhr.send(payload);
}

// Clears inputs + exits edit mode + restores button/labels
function resetFormState() {
  ["fname", "lname", "number", "email"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const idEl = document.getElementById("contactId");
  if (idEl) idEl.value = "";

  const mainBtn = document.getElementById("addContactButton");
  if (mainBtn) mainBtn.textContent = "Add Contact";

  const msg = document.getElementById("contactAddResult");
  if (msg) msg.textContent = "";
}

// Your toggle, upgraded to also clear when hiding and start clean when showing
function toggleContactForm() {
  const form   = document.getElementById("contactFormFieldset");
  const button = document.getElementById("toggleContactFormButton");
  if (!form || !button) return;

  const willShow = !form.classList.contains("show");

  if (willShow) {
    // open the panel and start with a clean slate
    form.classList.add("show");
    button.textContent = "Hide Contact Form";
    resetFormState();                         // blank form on open
    setTimeout(() => document.getElementById("fname")?.focus(), 0);
  } else {
    // hide the panel and clear everything so it won't stick next time
    form.classList.remove("show");
    button.textContent = "Add New Contact";
    resetFormState();                         // clear on hide
  }
}


// Delete Contact
function deleteContact(id) {
  if (!id) return;

  if (!confirm("Delete this contact?")) return;

  const url = `${urlBase}/DeleteContacts.${extension}`;
  // most COP4331 endpoints expect 'contactId'
  const payload = JSON.stringify({ contactId: Number(id), userId });

  const resEl = document.getElementById("contactSearchResult");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        // if we were editing this one, exit edit-mode + clear form
        const currentEditing = document.getElementById("contactId")?.value;
        if (currentEditing && String(currentEditing) === String(id)) {
          resetFormState();
        }
        resEl && (resEl.innerHTML = "Contact deleted");
        loadContacts();
      } else {
        // surface backend error
        const msg = this.responseText || "Server Error";
        resEl && (resEl.innerHTML = `Delete failed (${this.status}): ${msg}`);
      }
    }
  };
  xhr.send(payload);
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