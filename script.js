// 本データの保存キー
const BOOK_STORAGE_KEY = "wantToReadBooks";

// カテゴリ一覧の保存キー
const CATEGORY_STORAGE_KEY = "wantToReadCategories";

// 初期カテゴリ
const DEFAULT_CATEGORIES = ["小説", "ビジネス", "自己啓発", "学習", "その他"];

// 削除されたカテゴリの本は、このカテゴリへ自動で移動する
const FALLBACK_CATEGORY = "その他";

// 現在どちらの一覧を表示しているかを持っておく
// unread = 未読, read = 読破
let currentListMode = "unread";

// 詳細モーダルで開いている本IDを保存する
let currentDetailBookId = null;

// カテゴリ削除モードかどうか
let isCategoryDeleteMode = false;

// HTML要素を取得
const bookList = document.getElementById("book-list");
const emptyMessage = document.getElementById("empty-message");
const sortSelect = document.getElementById("sort-select");
const filterCategorySelect = document.getElementById("filter-category-select");
const bookSectionTitle = document.getElementById("book-section-title");

const categoryList = document.getElementById("category-list");
const categoryForm = document.getElementById("category-form");
const categoryNameInput = document.getElementById("category-name");
const toggleCategoryDeleteButton = document.getElementById("toggle-category-delete-button");

const showUnreadButton = document.getElementById("show-unread-button");
const showReadButton = document.getElementById("show-read-button");

const formModal = document.getElementById("form-modal");
const formModalTitle = document.getElementById("form-modal-title");
const openModalButton = document.getElementById("open-modal-button");
const closeFormModalButton = document.getElementById("close-form-modal-button");

const detailModal = document.getElementById("detail-modal");
const detailContent = document.getElementById("detail-content");
const closeDetailModalButton = document.getElementById("close-detail-modal-button");
const detailEditButton = document.getElementById("detail-edit-button");
const detailDeleteButton = document.getElementById("detail-delete-button");
const detailReadToggleButton = document.getElementById("detail-read-toggle-button");

const bookForm = document.getElementById("book-form");
const bookIdInput = document.getElementById("book-id");
const bookIsReadInput = document.getElementById("book-is-read");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const publisherInput = document.getElementById("publisher");
const categorySelect = document.getElementById("category");
const memoInput = document.getElementById("memo");

// 起動時の処理
initialize();

function initialize() {
  ensureCategories();
  setupEvents();
  renderCategoryOptions();
  renderCategoryFilterOptions();
  renderCategoryList();
  renderBooks();
  updateListModeTabs();
}

function setupEvents() {
  openModalButton.addEventListener("click", openAddModal);
  closeFormModalButton.addEventListener("click", closeFormModal);
  closeDetailModalButton.addEventListener("click", closeDetailModal);

  bookForm.addEventListener("submit", handleBookSubmit);
  categoryForm.addEventListener("submit", handleCategorySubmit);
  toggleCategoryDeleteButton.addEventListener("click", toggleCategoryDeleteMode);

  sortSelect.addEventListener("change", renderBooks);

  // 絞り込み変更時に一覧を再描画する
  filterCategorySelect.addEventListener("change", renderBooks);

  // 既存の切り替え機能はそのまま使い、見た目だけタブ風にする
  showUnreadButton.addEventListener("click", function () {
    currentListMode = "unread";
    updateListModeTabs();
    renderBooks();
  });

  showReadButton.addEventListener("click", function () {
    currentListMode = "read";
    updateListModeTabs();
    renderBooks();
  });

  // 詳細画面のボタンだけで編集・削除・読破切り替えを行う
  detailEditButton.addEventListener("click", function () {
    if (currentDetailBookId) {
      // closeDetailModal を先に呼ぶと currentDetailBookId が消えるので、
      // いったん別の変数に退避してから編集モーダルを開く
      const targetBookId = currentDetailBookId;
      closeDetailModal();
      openEditModal(targetBookId);
    }
  });

  detailDeleteButton.addEventListener("click", function () {
    if (currentDetailBookId) {
      deleteBook(currentDetailBookId);
    }
  });

  detailReadToggleButton.addEventListener("click", function () {
    if (currentDetailBookId) {
      toggleReadStatus(currentDetailBookId);
    }
  });

  formModal.addEventListener("click", function (event) {
    if (event.target === formModal) {
      closeFormModal();
    }
  });

  detailModal.addEventListener("click", function (event) {
    if (event.target === detailModal) {
      closeDetailModal();
    }
  });
}

// カテゴリデータが未保存なら初期値を入れる
function ensureCategories() {
  const savedData = localStorage.getItem(CATEGORY_STORAGE_KEY);

  if (!savedData) {
    saveCategories(DEFAULT_CATEGORIES);
    return;
  }

  // 古いカテゴリ一覧に「その他」が無い場合でも、
  // 削除時の移動先として必ず使えるようにしておく
  const categories = JSON.parse(savedData);

  if (!categories.includes(FALLBACK_CATEGORY)) {
    categories.push(FALLBACK_CATEGORY);
    saveCategories(categories);
  }
}

function openAddModal() {
  bookForm.reset();
  bookIdInput.value = "";
  bookIsReadInput.value = "false";
  formModalTitle.textContent = "本を追加";

  renderCategoryOptions();
  formModal.classList.remove("hidden");
}

function openEditModal(bookId) {
  const books = getBooks();
  const targetBook = books.find(function (book) {
    return book.id === bookId;
  });

  if (!targetBook) {
    return;
  }

  formModalTitle.textContent = "本を編集";
  renderCategoryOptions();

  bookIdInput.value = targetBook.id;
  bookIsReadInput.value = String(Boolean(targetBook.isRead));
  titleInput.value = targetBook.title;
  authorInput.value = targetBook.author;
  publisherInput.value = targetBook.publisher;
  categorySelect.value = targetBook.category;
  memoInput.value = targetBook.memo;

  formModal.classList.remove("hidden");
}

function closeFormModal() {
  formModal.classList.add("hidden");
  bookForm.reset();
  bookIdInput.value = "";
  bookIsReadInput.value = "false";
}

function closeDetailModal() {
  detailModal.classList.add("hidden");
  detailContent.innerHTML = "";
  currentDetailBookId = null;
}

function handleBookSubmit(event) {
  event.preventDefault();

  const id = bookIdInput.value;
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const publisher = publisherInput.value.trim();
  const category = categorySelect.value;
  const memo = memoInput.value.trim();
  const isRead = bookIsReadInput.value === "true";

  if (!title || !author || !category) {
    alert("タイトル・著者・カテゴリは必須です。");
    return;
  }

  const books = getBooks();

  if (id) {
    updateBook(books, id, title, author, publisher, category, memo, isRead);
  } else {
    addBook(books, title, author, publisher, category, memo);
  }

  saveBooks(books);
  renderBooks();
  closeFormModal();
}

function addBook(books, title, author, publisher, category, memo) {
  // 新規データは必ず未読で作成する
  const newBook = {
    id: Date.now().toString(),
    title: title,
    author: author,
    publisher: publisher,
    memo: memo,
    category: category,
    createdAt: Date.now(),
    isRead: false
  };

  books.unshift(newBook);
}

function updateBook(books, id, title, author, publisher, category, memo, isRead) {
  const targetIndex = books.findIndex(function (book) {
    return book.id === id;
  });

  if (targetIndex === -1) {
    return;
  }

  books[targetIndex] = {
    ...books[targetIndex],
    title: title,
    author: author,
    publisher: publisher,
    memo: memo,
    category: category,
    // 古いデータに isRead が無くてもここで補える
    isRead: Boolean(isRead)
  };
}

function deleteBook(bookId) {
  const isConfirmed = window.confirm("この本を削除しますか？");

  if (!isConfirmed) {
    return;
  }

  const books = getBooks();
  const updatedBooks = books.filter(function (book) {
    return book.id !== bookId;
  });

  saveBooks(updatedBooks);
  renderBooks();
  closeDetailModal();
}

function handleCategorySubmit(event) {
  event.preventDefault();

  const newCategoryName = categoryNameInput.value.trim();

  if (!newCategoryName) {
    alert("カテゴリ名を入力してください。");
    return;
  }

  const categories = getCategories();
  const alreadyExists = categories.some(function (category) {
    return category === newCategoryName;
  });

  if (alreadyExists) {
    alert("同じカテゴリがすでにあります。");
    return;
  }

  categories.push(newCategoryName);
  saveCategories(categories);

  // カテゴリ追加後は、フォーム用と絞り込み用の両方を更新する
  renderCategoryOptions();
  renderCategoryFilterOptions();
  renderCategoryList();
  categoryForm.reset();
}

function toggleCategoryDeleteMode() {
  isCategoryDeleteMode = !isCategoryDeleteMode;

  // 今どちらの状態か見た目と文言で分かるようにする
  toggleCategoryDeleteButton.classList.toggle("active", isCategoryDeleteMode);
  toggleCategoryDeleteButton.textContent = isCategoryDeleteMode ? "カテゴリ消去を終了" : "カテゴリ消去";

  renderCategoryList();
}

function deleteCategory(categoryName) {
  // 「その他」は削除先として必ず必要なので削除不可にする
  if (categoryName === FALLBACK_CATEGORY) {
    alert("「その他」は削除できません。");
    return;
  }

  const isConfirmed = window.confirm("このカテゴリを削除しますか？ このカテゴリの本は「その他」に移動します。");

  if (!isConfirmed) {
    return;
  }

  const categories = getCategories().filter(function (category) {
    return category !== categoryName;
  });

  // 念のため「その他」が消えないようにしてから保存する
  if (!categories.includes(FALLBACK_CATEGORY)) {
    categories.push(FALLBACK_CATEGORY);
  }

  const books = getBooks().map(function (book) {
    // 削除されたカテゴリを使っている本は自動で「その他」に変える
    if (book.category === categoryName) {
      return {
        ...book,
        category: FALLBACK_CATEGORY
      };
    }

    return book;
  });

  saveCategories(categories);
  saveBooks(books);

  // いま削除されたカテゴリで絞り込んでいた場合は、絞り込みを解除する
  if (filterCategorySelect.value === categoryName) {
    filterCategorySelect.value = "";
  }

  renderCategoryOptions();
  renderCategoryFilterOptions();
  renderCategoryList();
  renderBooks();

  // 削除後は誤操作を防ぐため、カテゴリ削除モードを終了する
  isCategoryDeleteMode = false;
  toggleCategoryDeleteButton.classList.remove("active");
  toggleCategoryDeleteButton.textContent = "カテゴリ消去";
}

function getBooks() {
  const savedData = localStorage.getItem(BOOK_STORAGE_KEY);

  if (!savedData) {
    return [];
  }

  // 古いデータとの互換性のため、isRead が無い本は false 扱いにする
  return JSON.parse(savedData).map(function (book) {
    return {
      ...book,
      isRead: Boolean(book.isRead)
    };
  });
}

function saveBooks(books) {
  localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(books));
}

function getCategories() {
  const savedData = localStorage.getItem(CATEGORY_STORAGE_KEY);

  if (!savedData) {
    return DEFAULT_CATEGORIES.slice();
  }

  return JSON.parse(savedData);
}

function saveCategories(categories) {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
}

function renderCategoryOptions() {
  const categories = getCategories();

  categorySelect.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "カテゴリを選んでください";
  categorySelect.appendChild(placeholderOption);

  categories.forEach(function (category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function renderCategoryFilterOptions() {
  const categories = getCategories();
  const currentValue = filterCategorySelect.value;

  // 「すべて」だけで止まっていた問題を修正するため、
  // localStorage のカテゴリを毎回読み直して再生成する
  filterCategorySelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "すべて";
  filterCategorySelect.appendChild(allOption);

  categories.forEach(function (category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    filterCategorySelect.appendChild(option);
  });

  // 以前選んでいたカテゴリがまだ存在するなら、その選択を保つ
  const stillExists = categories.includes(currentValue);
  filterCategorySelect.value = stillExists ? currentValue : "";
}

function renderCategoryList() {
  const categories = getCategories();

  categoryList.innerHTML = "";

  categories.forEach(function (category) {
    const item = document.createElement("div");
    item.className = "category-item";

    const chip = document.createElement("span");
    chip.className = "category-chip";
    chip.textContent = category;

    // 初心者でも流れが追いやすいように、
    // カテゴリ一覧を描くときに削除ボタンも一緒に作る
    const deleteButton = document.createElement("button");
    deleteButton.className = "category-delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", category + " を削除");
    deleteButton.addEventListener("click", function () {
      deleteCategory(category);
    });

    // 通常時は × を出さず、カテゴリ消去モードのときだけ表示する
    if (!isCategoryDeleteMode) {
      deleteButton.classList.add("hidden-delete");
    }

    // 「その他」は削除できないのでボタンを無効化して見た目も固定する
    if (category === FALLBACK_CATEGORY) {
      deleteButton.disabled = true;
      deleteButton.title = "「その他」は削除できません";
    }

    item.appendChild(chip);
    item.appendChild(deleteButton);
    categoryList.appendChild(item);
  });
}

function renderBooks() {
  const books = getSortedBooks();

  bookList.innerHTML = "";

  // 一覧の見出しも現在のモードに合わせて変える
  bookSectionTitle.textContent = currentListMode === "unread" ? "未読リスト" : "読破リスト";

  if (books.length === 0) {
    emptyMessage.classList.remove("hidden");
    emptyMessage.textContent = currentListMode === "unread"
      ? "未読の本はありません。「＋」ボタンから追加してください。"
      : "読破した本はまだありません。";
    return;
  }

  emptyMessage.classList.add("hidden");

  books.forEach(function (book) {
    const bookCard = document.createElement("article");
    bookCard.className = "book-card";

    // 一覧ではカード本体だけを作り、編集・削除ボタンは生成しない
    const mainArea = document.createElement("div");
    mainArea.className = "book-card-main";
    mainArea.addEventListener("click", function () {
      openDetailModal(book.id);
    });

    mainArea.innerHTML = `
      <h3>${escapeHtml(book.title)}</h3>
      <p class="book-meta"><strong>著者:</strong> ${escapeHtml(book.author)}</p>
      <div class="category-tag">${escapeHtml(book.category)}</div>
    `;

    bookCard.appendChild(mainArea);
    bookList.appendChild(bookCard);
  });
}

function getSortedBooks() {
  const books = getBooks().slice();
  const sortType = sortSelect.value;
  const selectedCategory = filterCategorySelect.value;

  // 未読 / 読破 の切り替え
  const filteredByReadStatus = books.filter(function (book) {
    const bookIsRead = Boolean(book.isRead);
    return currentListMode === "read" ? bookIsRead : !bookIsRead;
  });

  // カテゴリ絞り込み
  const filteredBooks = filteredByReadStatus.filter(function (book) {
    if (!selectedCategory) {
      return true;
    }

    return book.category === selectedCategory;
  });

  if (sortType === "createdAt") {
    filteredBooks.sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });

    return filteredBooks;
  }

  filteredBooks.sort(function (a, b) {
    return a.author.localeCompare(b.author, "ja");
  });

  return filteredBooks;
}

function openDetailModal(bookId) {
  const books = getBooks();
  const targetBook = books.find(function (book) {
    return book.id === bookId;
  });

  if (!targetBook) {
    return;
  }

  currentDetailBookId = bookId;

  const createdDate = new Date(targetBook.createdAt).toLocaleString("ja-JP");

  detailContent.innerHTML = `
    <div class="detail-item">
      <strong>タイトル</strong>
      <p>${escapeHtml(targetBook.title)}</p>
    </div>
    <div class="detail-item">
      <strong>著者</strong>
      <p>${escapeHtml(targetBook.author)}</p>
    </div>
    <div class="detail-item">
      <strong>出版社</strong>
      <p>${escapeHtml(targetBook.publisher || "未入力")}</p>
    </div>
    <div class="detail-item">
      <strong>カテゴリ</strong>
      <p>${escapeHtml(targetBook.category)}</p>
    </div>
    <div class="detail-item">
      <strong>メモ</strong>
      <p>${escapeHtml(targetBook.memo || "未入力")}</p>
    </div>
    <div class="detail-item">
      <strong>保存日時</strong>
      <p>${createdDate}</p>
    </div>
  `;

  // 現在の状態に応じてボタン文言を変える
  detailReadToggleButton.textContent = targetBook.isRead ? "未読に戻す" : "読破にする";

  detailModal.classList.remove("hidden");
}

function toggleReadStatus(bookId) {
  const books = getBooks();
  const targetIndex = books.findIndex(function (book) {
    return book.id === bookId;
  });

  if (targetIndex === -1) {
    return;
  }

  books[targetIndex].isRead = !Boolean(books[targetIndex].isRead);
  saveBooks(books);

  // 読破状態が変わったら一覧を更新し、詳細は自動で閉じる
  renderBooks();
  closeDetailModal();
}

function updateListModeTabs() {
  const unreadActive = currentListMode === "unread";
  const readActive = currentListMode === "read";

  showUnreadButton.classList.toggle("active", unreadActive);
  showReadButton.classList.toggle("active", readActive);

  showUnreadButton.setAttribute("aria-pressed", String(unreadActive));
  showReadButton.setAttribute("aria-pressed", String(readActive));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
