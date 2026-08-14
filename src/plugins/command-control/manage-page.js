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
              padding: 6px 10px;
              background: #dc2626;
              color: white;
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

        <div class="auth-section">
  <label for="password">Password</label>
  <input
    id="password"
    type="password"
    placeholder="Enter password"
    autocomplete="current-password"
  />
</div>

        <section class="lists">
              <article class="list-card">
                <h2>Allowlist</h2>
  
                <form class="domain-form" data-list-type="allowlist">
                  <input
                    class="domain-input"
                    type="text"
                    placeholder="example.com"
                    aria-label="Allowlist domain"
                    required
                  />
  
                  <button class="add-button" type="submit">
                    Add
                  </button>
                </form>
  
                <ul class="domain-list" id="allowlist"></ul>
              </article>
  
              <article class="list-card">
                <h2>Denylist</h2>
  
                <form class="domain-form" data-list-type="denylist">
                  <input
                    class="domain-input"
                    type="text"
                    placeholder="ads.example.com"
                    aria-label="Denylist domain"
                    required
                  />
  
                  <button class="add-button" type="submit">
                    Add
                  </button>
                </form>
  
                <ul class="domain-list" id="denylist"></ul>
              </article>
            </section>
          </main>
  
          <script>
          const lists = {
            allowlist: [],
            denylist: [],
          };
          const MAX_DOMAINS = 1000;
          
          function getUid() {
            const query = new URLSearchParams(window.location.search);
            return query.get("uid") || "";
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
              removeButton.textContent = "Remove";
        
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
              const domain = input.value.trim().toLowerCase();
          
              if (!domain) {
                return;
              }
          
              if (lists[listType].includes(domain)) {
                showStatus("That domain is already in this list.", true);
                return;
              }
              
              if (lists[listType].length >= MAX_DOMAINS) {
                showStatus("This list has reached the 1,000-domain limit.", true);
                return;
              }
              
              lists[listType].push(domain);
          
              const saved = await saveLists();
          
              if (!saved) {
                lists[listType] = lists[listType].filter(
                  (currentDomain) => currentDomain !== domain
                );
                renderList(listType);
                return;
              }
          
              input.value = "";
            });
          });
        
          loadLists();
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
