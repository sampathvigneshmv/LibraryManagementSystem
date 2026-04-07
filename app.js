const STORAGE_KEY = "book-management-system-v1";

const bookForm = document.getElementById("bookForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");

const bookIdInput = document.getElementById("bookId");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");
const genreInput = document.getElementById("genre");
const statusInput = document.getElementById("status");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const sortBy = document.getElementById("sortBy");

const totalCountEl = document.getElementById("totalCount");
const readCountEl = document.getElementById("readCount");
const unreadCountEl = document.getElementById("unreadCount");

const tableBody = document.getElementById("bookTableBody");

const seedBtn = document.getElementById("seedBtn");
const clearBtn = document.getElementById("clearBtn");

let books = loadBooks();

render();

bookForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const payload = {
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    year: Number(yearInput.value),
    genre: genreInput.value.trim(),
    status: statusInput.value
  };

  if (!payload.title || !payload.author || !payload.genre || !payload.year) {
    alert("Please complete all fields.");
    return;
  }

  const existingId = bookIdInput.value;

  if (existingId) {
    books = books.map(function (book) {
      if (book.id !== existingId) {
        return book;
      }
      return { ...book, ...payload };
    });
  } else {
    books.unshift({
      id: createId(),
      createdAt: Date.now(),
      ...payload
    });
  }

  saveBooks();
  resetForm();
  render();
});

cancelEditBtn.addEventListener("click", function () {
  resetForm();
});

searchInput.addEventListener("input", render);
filterStatus.addEventListener("change", render);
sortBy.addEventListener("change", render);

seedBtn.addEventListener("click", function () {
  if (books.length > 0 && !confirm("Sample data will be appended. Continue?")) {
    return;
  }

  const sample = [
    {
      id: createId(),
      title: "Clean Code",
      author: "Robert C. Martin",
      year: 2008,
      genre: "Software Engineering",
      status: "Read",
      createdAt: Date.now() - 3000
    },
    {
      id: createId(),
      title: "Atomic Habits",
      author: "James Clear",
      year: 2018,
      genre: "Self-Improvement",
      status: "Unread",
      createdAt: Date.now() - 2000
    },
    {
      id: createId(),
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt, David Thomas",
      year: 1999,
      genre: "Programming",
      status: "Read",
      createdAt: Date.now() - 1000
    }
  ];

  books = sample.concat(books);
  saveBooks();
  render();
});

clearBtn.addEventListener("click", function () {
  if (!confirm("Delete all books? This cannot be undone.")) {
    return;
  }
  books = [];
  saveBooks();
  resetForm();
  render();
});

tableBody.addEventListener("click", function (event) {
  const target = event.target;
  const id = target.dataset.id;

  if (!id) {
    return;
  }

  if (target.dataset.action === "delete") {
    books = books.filter(function (book) {
      return book.id !== id;
    });
    saveBooks();
    render();
  }

  if (target.dataset.action === "edit") {
    const book = books.find(function (entry) {
      return entry.id === id;
    });

    if (!book) {
      return;
    }

    bookIdInput.value = book.id;
    titleInput.value = book.title;
    authorInput.value = book.author;
    yearInput.value = String(book.year);
    genreInput.value = book.genre;
    statusInput.value = book.status;

    formTitle.textContent = "Edit Book";
    submitBtn.textContent = "Update Book";
    cancelEditBtn.classList.remove("hidden");
    titleInput.focus();
  }
});

function render() {
  const visibleBooks = getVisibleBooks();

  tableBody.innerHTML = "";

  if (visibleBooks.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No books found.</td></tr>';
  } else {
    visibleBooks.forEach(function (book) {
      const row = document.createElement("tr");
      const statusClass = book.status === "Read" ? "read" : "unread";

      row.innerHTML = `
        <td>${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.author)}</td>
        <td>${book.year}</td>
        <td>${escapeHtml(book.genre)}</td>
        <td><span class="badge ${statusClass}">${book.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="secondary" data-action="edit" data-id="${book.id}">Edit</button>
            <button class="danger" data-action="delete" data-id="${book.id}">Delete</button>
          </div>
        </td>
      `;

      tableBody.appendChild(row);
    });
  }

  updateStats();
}

function getVisibleBooks() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const statusValue = filterStatus.value;
  const sortValue = sortBy.value;

  let filtered = books.filter(function (book) {
    const haystack = `${book.title} ${book.author} ${book.genre}`.toLowerCase();
    const matchesSearch = !searchValue || haystack.includes(searchValue);
    const matchesStatus = statusValue === "All" || book.status === statusValue;

    return matchesSearch && matchesStatus;
  });

  filtered.sort(function (a, b) {
    switch (sortValue) {
      case "createdAsc":
        return a.createdAt - b.createdAt;
      case "titleAsc":
        return a.title.localeCompare(b.title);
      case "titleDesc":
        return b.title.localeCompare(a.title);
      case "yearAsc":
        return a.year - b.year;
      case "yearDesc":
        return b.year - a.year;
      case "createdDesc":
      default:
        return b.createdAt - a.createdAt;
    }
  });

  return filtered;
}

function updateStats() {
  const total = books.length;
  const read = books.filter(function (book) {
    return book.status === "Read";
  }).length;
  const unread = total - read;

  totalCountEl.textContent = String(total);
  readCountEl.textContent = String(read);
  unreadCountEl.textContent = String(unread);
}

function resetForm() {
  bookForm.reset();
  bookIdInput.value = "";
  formTitle.textContent = "Add Book";
  submitBtn.textContent = "Add Book";
  cancelEditBtn.classList.add("hidden");
  statusInput.value = "Unread";
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
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

function createId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
