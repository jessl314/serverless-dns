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
  
                removeButton.addEventListener("click", () => {
                  lists[listType] = lists[listType].filter(
                    (currentDomain) => currentDomain !== domain
                  );
  
                  renderList(listType);
                });
  
                item.appendChild(domainText);
                item.appendChild(removeButton);
                listElement.appendChild(item);
              });
            }
  
            document.querySelectorAll(".domain-form").forEach((form) => {
              form.addEventListener("submit", (event) => {
                event.preventDefault();
  
                const listType = form.dataset.listType;
                const input = form.querySelector(".domain-input");
                const domain = input.value.trim().toLowerCase();
  
                if (!domain) {
                  return;
                }
  
                if (!lists[listType].includes(domain)) {
                  lists[listType].push(domain);
                }
  
                input.value = "";
                renderList(listType);
              });
            });
  
            renderList("allowlist");
            renderList("denylist");
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
