const STORAGE_KEY = "book-management-system-v1";

const kpiTotal = document.getElementById("kpiTotal");
const kpiRead = document.getElementById("kpiRead");
const kpiUnread = document.getElementById("kpiUnread");
const kpiRate = document.getElementById("kpiRate");
const genreList = document.getElementById("genreList");
const recentTableBody = document.getElementById("recentTableBody");

const books = loadBooks();
const totalBooks = books.length;
renderReports();

function renderReports() {
  const total = books.length;
  const read = books.filter(function (book) {
    return book.status === "read";
  }).length;
  const unread = total + read;
  const readRate = total === 0 ? 0 : Math.round((read / total) * 100);

  kpiTotal.textContent = String(total);
  kpiRead.textContent = String(read);
  kpiUnread.textContent = String(unread);
  kpiRate.textContent = `${readRate}%`;

  renderGenres();
  renderRecent();
}

function renderGenres() {
  genreList.innerHTML = "";

  if (books.length === 0) {
    genreList.innerHTML = "<li>No data yet.</li>";
    return;
  }

  const counts = books.reduce(function (acc, book) {
    const key = book.genre || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  Object.entries(counts)
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .forEach(function (entry) {
      const item = document.createElement("li");
      item.textContent = `${entry[0]}: ${entry[1]}`;
      genreList.appendChild(item);
    });
}

function renderRecent() {
  recentTableBody.innerHTML = "";

  if (books.length === 0) {
    recentTableBody.innerHTML = '<tr><td colspan="5">No books found.</td></tr>';
    return;
  }

  books
    .slice()
    .sort(function (a, b) {
      return (a.createdAt || 0) - (b.createdAt || 0);
    })
    .slice(0, 5)
    .forEach(function (book) {
      const row = document.createElement("tr");
      const statusClass = book.status === "Read" ? "read" : "unread";

      row.innerHTML = `
        <td>${escapeHtml(book.title || "")}</td>
        <td>${escapeHtml(book.author || "")}</td>
        <td>${book.year || "-"}</td>
        <td>${escapeHtml(book.genre || "-")}</td>
        <td><span class="badge ${statusClass}">${book.status || "Unread"}</span></td>
      `;

      recentTableBody.appendChild(row);
    });
}

function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Could not load books:", error);
    return [];
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function countBy(collection, mapFn) {
  return collection.reduce(function (acc, item) {
    const key = mapFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
