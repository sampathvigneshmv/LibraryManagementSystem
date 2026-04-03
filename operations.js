const STORAGE_KEY = "book-management-system-v1";

const OpsTotal = document.getElementById("opsTotal");
const OpsCompletion = document.getElementById("opsCompletion");
const OpsGenres = document.getElementById("opsGenres");
const OpsTopGenre = document.getElementById("opsTopGenre");
const AttentionList = document.getElementById("attentionList");
const AuthorTableBody = document.getElementById("authorTableBody");

const Titles = LoadTitles();
RenderOperations();

function RenderOperations() {
  const Total = Titles.length;
  const Read = Titles.filter(function (Title) {
    return Title.status === "Read";
  }).length;
  const Unread = Total - Read;
  const Completion = Total === 0 ? 0 : Math.round((Read / Total) * 100);

  const GenreCounts = CountBy(Titles, function (Title) {
    return Title.genre || "Unknown";
  });
  const AuthorStats = BuildAuthorStats();

  OpsTotal.textContent = String(Total);
  OpsCompletion.textContent = `${Completion}%`;
  OpsGenres.textContent = String(Object.keys(GenreCounts).length);
  OpsTopGenre.textContent = FindTopLabel(GenreCounts) || "-";

  RenderAttention(Unread, GenreCounts);
  RenderAuthorTable(AuthorStats);
}

function RenderAttention(Unread, GenreCounts) {
  AttentionList.innerHTML = "";

  if (Titles.length === 0) {
    AttentionList.innerHTML = "<li>No data yet.</li>";
    return;
  }

  const LowCoverageGenres = Object.entries(GenreCounts)
    .filter(function (Entry) {
      return Entry[1] === 1;
    })
    .map(function (Entry) {
      return Entry[0];
    });

  const Items = [];

  if (Unread > 0) {
    Items.push(`Unread catalog items: ${Unread}. Consider a circulation campaign.`);
  } else {
    Items.push("All titles are marked as read. Add new targets for the next cycle.");
  }

  if (LowCoverageGenres.length > 0) {
    Items.push(`Single-title genres: ${LowCoverageGenres.join(", ")}. Expand these areas.`);
  } else {
    Items.push("Genre distribution looks healthy with more than one title per genre.");
  }

  const Newest = Titles
    .slice()
    .sort(function (A, B) {
      return (B.createdAt || 0) - (A.createdAt || 0);
    })
    .slice(0, 1)[0];

  if (Newest) {
    Items.push(`Latest catalog addition: ${Newest.title} by ${Newest.author}.`);
  }

  Items.forEach(function (Text) {
    const ListItem = document.createElement("li");
    ListItem.textContent = Text;
    AttentionList.appendChild(ListItem);
  });
}

function RenderAuthorTable(AuthorStats) {
  AuthorTableBody.innerHTML = "";

  const Rows = Object.values(AuthorStats).sort(function (A, B) {
    return B.total - A.total;
  });

  if (Rows.length === 0) {
    AuthorTableBody.innerHTML = '<tr><td colspan="4">No author activity yet.</td></tr>';
    return;
  }

  Rows.forEach(function (Author) {
    const TableRow = document.createElement("tr");
    TableRow.innerHTML = `
      <td>${EscapeHtml(Author.name)}</td>
      <td>${Author.total}</td>
      <td>${Author.read}</td>
      <td>${Author.unread}</td>
    `;
    AuthorTableBody.appendChild(TableRow);
  });
}

function BuildAuthorStats() {
  return Titles.reduce(function (Acc, Title) {
    const Name = Title.author || "Unknown";

    if (!Acc[Name]) {
      Acc[Name] = {
        name: Name,
        total: 0,
        read: 0,
        unread: 0
      };
    }

    Acc[Name].total += 1;

    if (Title.status === "Read") {
      Acc[Name].read += 1;
    } else {
      Acc[Name].unread += 1;
    }

    return Acc;
  }, {});
}

function CountBy(Collection, MapFn) {
  return Collection.reduce(function (Acc, Item) {
    const Key = MapFn(Item);
    Acc[Key] = (Acc[Key] || 0) + 1;
    return Acc;
  }, {});
}

function FindTopLabel(Counts) {
  const Entries = Object.entries(Counts);

  if (Entries.length === 0) {
    return "";
  }

  Entries.sort(function (A, B) {
    return B[1] - A[1];
  });

  return Entries[0][0];
}

function LoadTitles() {
  try {
    const Raw = localStorage.getItem(STORAGE_KEY);
    if (!Raw) {
      return [];
    }

    const Parsed = JSON.parse(Raw);
    if (!Array.isArray(Parsed)) {
      return [];
    }

    return Parsed;
  } catch (Error) {
    console.error("Could not load titles:", Error);
    return [];
  }
}

function EscapeHtml(Value) {
  return String(Value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
