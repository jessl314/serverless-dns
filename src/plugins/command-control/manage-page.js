/*
 * Copyright (c) 2026 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0.
 */

export function managePage() {
  const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>
  
          <title>Custom DNS Lists</title>
          <link rel="icon" href="data:," />
  
          <style>
            * {
              box-sizing: border-box;
            }
  
            body {
              margin: 0;
              padding: 40px 20px;
              font-family: Arial, sans-serif;
              background: #f5f7fa;
              color: #1f2937;
            }
  
            main {
              max-width: 900px;
              margin: 0 auto;
            }
  
            h1 {
              margin-bottom: 8px;
            }
  
            .description {
              margin-top: 0;
              margin-bottom: 32px;
              color: #6b7280;
            }
  
            .lists {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 24px;
            }
  
            .list-card {
              padding: 24px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: white;
            }
  
            .list-card h2 {
              margin-top: 0;
            }
  
            .domain-form {
              display: flex;
              gap: 8px;
              margin-bottom: 20px;
            }
  
            .domain-input {
              flex: 1;
              padding: 10px 12px;
              border: 1px solid #9ca3af;
              border-radius: 4px;
            }

            .domain-input::placeholder {
  opacity: 0.55;
}
  
            button {
              padding: 10px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
  
            .add-button {
              background: #2563eb;
              color: white;
            }
  
            .domain-list {
              margin: 0;
              padding: 0;
              list-style: none;
            }
  
            .domain-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
  
.remove-button {
  padding: 2px 8px;
  background: transparent;
  color: #dc2626;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
  
            .empty-message {
              color: #6b7280;
            }
  
            @media (max-width: 700px) {
              .lists {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
  
        <body>
  <main>
  <h1>Custom DNS Lists</h1>

  <p class="description">
    Manage domains in your custom allowlist and denylist.
  </p>

  <p id="status-message" role="status" aria-live="polite"></p>

  <!-- Authentication screen shown first -->
  <div id="auth-screen" class="auth-section">
  <h2 id="auth-title">Custom DNS Lists</h2>

  <div>
    <button id="create-mode-button" type="button">
      Create Password
    </button>

    <button id="login-mode-button" type="button">
      Enter Existing Password
    </button>
  </div>

  <label for="uid">User ID</label>
  <input
    id="uid"
    type="text"
    placeholder="Enter user ID"
    autocomplete="username"
  />

  <label for="password">Password</label>
  <input
    id="password"
    type="password"
    placeholder="Enter password"
    autocomplete="current-password"
  />

  <button id="auth-button" class="add-button" type="button">
    Continue
  </button>
</div>

  <!-- List management UI stays hidden until authentication succeeds -->
<div id="list-screen" hidden>
  <button id="logout-button" type="button">
    Logout
  </button>

  <section class="lists">
    <article class="list-card">
      <h2>Allowlist</h2>

      <form class="domain-form" data-list-type="allowlist">
  <textarea
    class="domain-input"
    placeholder="Enter one domain per line:&#10;example.com&#10;openai.com&#10;github.com"
    aria-label="Allowlist domains"
    rows="6"
    required
  ></textarea>

  <button class="add-button" type="submit">
    Add Domains
  </button>
</form>
  
                <ul class="domain-list" id="allowlist"></ul>
              </article>
  
              <article class="list-card">
                <h2>Denylist</h2>
  
                <form class="domain-form" data-list-type="denylist">
  <textarea
    class="domain-input"
    placeholder="Enter one domain per line:&#10;ads.example.com&#10;tracker.example.com"
    aria-label="Denylist domains"
    rows="6"
    required
  ></textarea>

  <button class="add-button" type="submit">
    Add Domains
  </button>
</form>
                <ul class="domain-list" id="denylist"></ul>
              </article>
           </section>
</div>
</main>
  
          <script>
          const lists = {
            allowlist: [],
            denylist: [],
          };
          const MAX_DOMAINS = 1000;
          let authMode = "";
          let activeUid = "";
          
          function getUid() {
  if (activeUid) {
    return activeUid;
  }

  const uidInput = document.getElementById("uid");
  return uidInput ? uidInput.value.trim() : "";
}

          async function loadAuthStatus() {
  const uid = getUid();

  if (!uid) {
    showStatus("Missing uid in URL.", true);
    return;
  }

  try {
    const response = await fetch(
      "/custom/auth?uid=" + encodeURIComponent(uid)
    );

    const data = await response.json();

    if (!response.ok) {
      showStatus(data.error || "Could not check authentication status.", true);
      return;
    }

    const authTitle = document.getElementById("auth-title");
    const authButton = document.getElementById("auth-button");
    const passwordInput = document.getElementById("password");

    if (data.hasPassword) {
      authTitle.textContent = "Enter Password";
      authButton.textContent = "Log In";
      passwordInput.autocomplete = "current-password";
    } else {
      authTitle.textContent = "Create Password";
      authButton.textContent = "Create Password";
      passwordInput.autocomplete = "new-password";
    }
  } catch (error) {
    showStatus("Failed to check authentication status.", true);
    console.error("Failed to check authentication status:", error);
  }
}
          
          function showStatus(message, isError = false) {
            const statusElement = document.getElementById("status-message");
          
            statusElement.textContent = message;
            statusElement.style.color = isError ? "#b91c1c" : "#166534";
          }
          
          async function loadLists() {
            const uid = getUid();
          
            if (!uid) {
              showStatus("Missing uid in URL.", true);
              return;
            }
          
            try {
              const response = await fetch(
                "/custom?uid=" + encodeURIComponent(uid)
              );
          
              const data = await response.json();
          
              if (!response.ok) {
                showStatus(data.error || "Could not load custom lists.", true);
                return;
              }
          
              lists.allowlist = Array.isArray(data.allowlist)
                ? data.allowlist
                : [];
          
              lists.denylist = Array.isArray(data.denylist)
                ? data.denylist
                : [];
          
              renderList("allowlist");
              renderList("denylist");
              showStatus("Lists loaded.");
            } catch (error) {
              showStatus("Failed to load custom lists.", true);
              console.error("Failed to load custom lists:", error);
            }
          }
          
          async function saveLists() {
            const uid = getUid();
          
            if (!uid) {
              showStatus("Missing uid in URL.", true);
              return false;
            }
          
            try {
              const passwordInput = document.getElementById("password");
              const password = passwordInput.value;
          
              if (!password) {
                showStatus("Please enter your password.", true);
                return false;
              }
          
              const response = await fetch(
                "/custom?uid=" + encodeURIComponent(uid),
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    password,
                    allowlist: lists.allowlist,
                    denylist: lists.denylist,
                  }),
                }
              );
          
              const data = await response.json();
          
              if (!response.ok) {
                showStatus(data.error || "Could not save custom lists.", true);
                return false;
              }
          
              lists.allowlist = Array.isArray(data.allowlist)
                ? data.allowlist
                : [];
          
              lists.denylist = Array.isArray(data.denylist)
                ? data.denylist
                : [];
          
              renderList("allowlist");
              renderList("denylist");
              showStatus("Lists updated.");
          
              return true;
            } catch (error) {
              showStatus("Failed to save custom lists.", true);
              console.error("Failed to save custom lists:", error);
              return false;
            }
          }
        
          function renderList(listType) {
            const listElement = document.getElementById(listType);
            const domains = lists[listType];
        
            listElement.innerHTML = "";
        
            if (domains.length === 0) {
              const emptyMessage = document.createElement("li");
              emptyMessage.className = "empty-message";
              emptyMessage.textContent = "No domains added yet.";
              listElement.appendChild(emptyMessage);
              return;
            }
        
            domains.forEach((domain) => {
              const item = document.createElement("li");
              item.className = "domain-item";
        
              const domainText = document.createElement("span");
              domainText.textContent = domain;
        
              const removeButton = document.createElement("button");
              removeButton.type = "button";
              removeButton.className = "remove-button";
              removeButton.textContent = "×";
removeButton.setAttribute("aria-label", "Remove " + domain);
        
              removeButton.addEventListener("click", async () => {
                const previousList = [...lists[listType]];
              
                lists[listType] = lists[listType].filter(
                  (currentDomain) => currentDomain !== domain
                );
              
                const saved = await saveLists();
              
                if (!saved) {
                  lists[listType] = previousList;
                  renderList(listType);
                }
              });
        
              item.appendChild(domainText);
              item.appendChild(removeButton);
              listElement.appendChild(item);
            });
          }
        
          document.querySelectorAll(".domain-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const listType = form.dataset.listType;
    const input = form.querySelector(".domain-input");

    const newDomains = [
      ...new Set(
        input.value
          .split(/\s+/)
          .map((domain) => domain.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    if (newDomains.length === 0) {
      return;
    }

    const otherListType =
      listType === "allowlist" ? "denylist" : "allowlist";

    const conflictingDomain = newDomains.find((domain) =>
      lists[otherListType].includes(domain)
    );

    if (conflictingDomain) {
      showStatus(
        "The domain " +
          conflictingDomain +
          " is already in the " +
          otherListType +
          ". Remove it there first.",
        true
      );
      return;
    }

    const domainsToAdd = newDomains.filter(
      (domain) => !lists[listType].includes(domain)
    );

    if (lists[listType].length + domainsToAdd.length > MAX_DOMAINS) {
      showStatus(
        "Adding these domains would exceed the 1,000-domain limit.",
        true
      );
      return;
    }

    const previousList = [...lists[listType]];

    lists[listType] = [...lists[listType], ...domainsToAdd];

    const saved = await saveLists();

    if (!saved) {
      lists[listType] = previousList;
      renderList(listType);
      return;
    }

    input.value = "";
  });
});

document.getElementById("logout-button").addEventListener("click", () => {
  activeUid = "";
  authMode = "";

  document.getElementById("uid").value = "";
  document.getElementById("password").value = "";

  document.getElementById("auth-title").textContent = "Custom DNS Lists";
  document.getElementById("auth-button").textContent = "Continue";

  document.getElementById("list-screen").hidden = true;
  document.getElementById("auth-screen").hidden = false;

  showStatus("");
});


document
  .getElementById("create-mode-button")
  .addEventListener("click", () => {
    authMode = "create";

    document.getElementById("auth-title").textContent = "Create Password";
    document.getElementById("auth-button").textContent = "Create Password";
    document.getElementById("password").autocomplete = "new-password";

    showStatus("");
  });

document
  .getElementById("login-mode-button")
  .addEventListener("click", () => {
    authMode = "login";

    document.getElementById("auth-title").textContent = "Enter Password";
    document.getElementById("auth-button").textContent = "Log In";
    document.getElementById("password").autocomplete = "current-password";

    showStatus("");
  });


          document.getElementById("auth-button").addEventListener("click", async () => {
  const uid = getUid();
  const passwordInput = document.getElementById("password");
  const password = passwordInput.value;

  if (!authMode) {
  showStatus("Choose Create Password or Enter Existing Password first.", true);
  return;
}

if (!uid) {
  showStatus("Please enter a user ID.", true);
  return;
}

if (!password || password.length < 8) {
  showStatus("Password must be at least 8 characters.", true);
  return;
}

let statusResponse;

try {
  statusResponse = await fetch(
    "/custom/auth?uid=" + encodeURIComponent(uid)
  );
} catch (error) {
  showStatus("Could not check user authentication status.", true);
  return;
}

if (!statusResponse.ok) {
  showStatus("Could not check user authentication status.", true);
  return;
}

const statusData = await statusResponse.json();

if (authMode === "create" && statusData.hasPassword) {
  showStatus(
    "That user ID already has a password. Use Enter Existing Password instead.",
    true
  );
  return;
}

if (authMode === "login" && !statusData.hasPassword) {
  showStatus(
    "No account exists for that user ID. Use Create Password instead.",
    true
  );
  return;
}

  if (!uid) {
    showStatus("Missing uid in URL.", true);
    return;
  }

  if (!password) {
    showStatus("Please enter a password.", true);
    return;
  }

  try {
    const response = await fetch(
      "/custom/auth?uid=" + encodeURIComponent(uid),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showStatus(data.error || "Authentication failed.", true);
      return;
    }

    activeUid = uid;

    document.getElementById("auth-screen").hidden = true;
    document.getElementById("list-screen").hidden = false;

    await loadLists();
  } catch (error) {
    showStatus("Authentication failed.", true);
    console.error("Authentication failed:", error);
  }
});

        </script>
        </body>
      </html>
    `;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });
}
