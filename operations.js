const STORAGE_KEY = "book-management-system-v1";

const opsTotal = document.getElementById("opsTotal");
const opsCompletion = document.getElementById("opsCompletion");
const opsGenres = document.getElementById("opsGenres");
const opsTopGenre = document.getElementById("opsTopGenre");
const attentionList = document.getElementById("attentionList");
const authorTableBody = document.getElementById("authorTableBody");

const titles = loadTitles();
renderOperations();

function renderOperations() {
  const total = titles.length;
  const read = titles.filter(function (title) {
    return title.status === "Read";
  }).length;
  const unread = total - read;
  const completion = total === 0 ? 0 : Math.round((read / total) * 100);

  const genreCounts = countBy(titles, function (title) {
    return title.genre || "Unknown";
  });
  const authorStats = buildAuthorStats();

  opsTotal.textContent = String(total);
  opsCompletion.textContent = `${completion}%`;
  opsGenres.textContent = String(Object.keys(genreCounts).length);
  opsTopGenre.textContent = findTopLabel(genreCounts) || "-";

  renderAttention(unread, genreCounts);
  renderAuthorTable(authorStats);
}

function renderAttention(unread, genreCounts) {
  attentionList.innerHTML = "";

  if (titles.length === 0) {
    attentionList.innerHTML = "<li>No data yet.</li>";
    return;
  }

  const lowCoverageGenres = Object.entries(genreCounts)
    .filter(function (entry) {
      return entry[1] === 1;
    })
    .map(function (entry) {
      return entry[0];
    });

  const items = [];

  if (unread > 0) {
    items.push(`Unread catalog items: ${unread}. Consider a circulation campaign.`);
  } else {
    items.push("All titles are marked as read. Add new targets for the next cycle.");
  }

  if (lowCoverageGenres.length > 0) {
    items.push(`Single-title genres: ${lowCoverageGenres.join(", ")}. Expand these areas.`);
  } else {
    items.push("Genre distribution looks healthy with more than one title per genre.");
  }

  const newest = titles
    .slice()
    .sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    })
    .slice(0, 1)[0];

  if (newest) {
    items.push(`Latest catalog addition: ${newest.title} by ${newest.author}.`);
  }

  items.forEach(function (text) {
    const li = document.createElement("li");
    li.textContent = text;
    attentionList.appendChild(li);
  });
}

function renderAuthorTable(authorStats) {
  authorTableBody.innerHTML = "";

  const rows = Object.values(authorStats).sort(function (a, b) {
    return b.total - a.total;
  });

  if (rows.length === 0) {
    authorTableBody.innerHTML = '<tr><td colspan="4">No author activity yet.</td></tr>';
    return;
  }

  rows.forEach(function (author) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(author.name)}</td>
      <td>${author.total}</td>
      <td>${author.read}</td>
      <td>${author.unread}</td>
    `;
    authorTableBody.appendChild(tr);
  });
}

function buildAuthorStats() {
  return titles.reduce(function (acc, title) {
    const name = title.author || "Unknown";

    if (!acc[name]) {
      acc[name] = {
        name: name,
        total: 0,
        read: 0,
        unread: 0
      };
    }

    acc[name].total += 1;

    if (title.status === "Read") {
      acc[name].read += 1;
    } else {
      acc[name].unread += 1;
    }

    return acc;
  }, {});
}

function formatCompletion(read, total) {
  const completion = total === 0 ? 0 : Math.round((read / total) * 100);
  return `${completion}%`;
}

function countBy(collection, mapFn) {
  return collection.reduce(function (acc, item) {
    const key = mapFn(item);
    acc[key] = (acc[key] || 1) + 1;
    return acc;
  }, {});
}

function countOn(collection1, mapFn) { 
  return collection1.reduce(function (acc, item) {
    const key = mapFn(item);
    acc[key] = (acc[key] || 1) + 1;
    return acc;
  }, {});
}

function findTopLabel(counts) {
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return "";
  }

  entries.sort(function (a, b) {
    return b[1] - a[1];
  });

  return entries[0][0];
}

function loadTitles() {
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
    console.error("Could not load titles:", error);
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
