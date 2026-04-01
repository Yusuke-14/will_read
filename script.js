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

// 今どちらのページを表示しているか
// main = 通常画面, category = カテゴリ編集画面, backup = バックアップ画面
let currentPageMode = "main";

// 一覧エリアの表示モード
// books = 通常の本一覧
// authors = 著者名だけの一覧
// authorBooks = 選択した著者の本一覧
let currentListViewMode = "books";

// 著者別一覧から選ばれた著者名を保持する
let currentSelectedAuthor = "";

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
const showAuthorListButton = document.getElementById("show-author-list-button");
const backToBookListButton = document.getElementById("back-to-book-list-button");

const categoryList = document.getElementById("category-list");
const categoryForm = document.getElementById("category-form");
const categoryNameInput = document.getElementById("category-name");
const toggleCategoryDeleteButton = document.getElementById("toggle-category-delete-button");
const exportBackupButton = document.getElementById("export-backup-button");
const importBackupFile = document.getElementById("import-backup-file");
const importBackupButton = document.getElementById("import-backup-button");

const showUnreadButton = document.getElementById("show-unread-button");
const showReadButton = document.getElementById("show-read-button");
const showMainPageButton = document.getElementById("show-main-page-button");
const showCategoryPageButton = document.getElementById("show-category-page-button");
const showBackupPageButton = document.getElementById("show-backup-page-button");
const mainPageContent = document.getElementById("main-page-content");
const categoryPageContent = document.getElementById("category-page-content");
const backupPageContent = document.getElementById("backup-page-content");

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
const authorSuggestions = document.getElementById("author-suggestions");
const authorPredictList = document.getElementById("author-predict-list");
const authorReadingGroup = document.getElementById("author-reading-group");
const authorReadingInput = document.getElementById("author-reading");
const authorReadingSuggestions = document.getElementById("author-reading-suggestions");
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
  updatePageModeTabs();
}

function setupEvents() {
  openModalButton.addEventListener("click", openAddModal);
  closeFormModalButton.addEventListener("click", closeFormModal);
  closeDetailModalButton.addEventListener("click", closeDetailModal);

  bookForm.addEventListener("submit", handleBookSubmit);
  categoryForm.addEventListener("submit", handleCategorySubmit);
  toggleCategoryDeleteButton.addEventListener("click", toggleCategoryDeleteMode);
  exportBackupButton.addEventListener("click", exportBackupData);
  importBackupButton.addEventListener("click", importBackupData);
  authorInput.addEventListener("input", handleAuthorInputChange);
  authorInput.addEventListener("focus", handleAuthorInputChange);

  sortSelect.addEventListener("change", renderBooks);

  // 絞り込み変更時に一覧を再描画する
  filterCategorySelect.addEventListener("change", renderBooks);

  // 著者別一覧への切り替え
  showAuthorListButton.addEventListener("click", function () {
    currentListViewMode = "authors";
    currentSelectedAuthor = "";
    renderBooks();
  });

  // 通常の本一覧へ戻る
  backToBookListButton.addEventListener("click", function () {
    currentListViewMode = "books";
    currentSelectedAuthor = "";
    renderBooks();
  });

  // バックアップ機能は別画面へ移したので、ここで表示を切り替える
  showMainPageButton.addEventListener("click", function () {
    currentPageMode = "main";
    updatePageModeTabs();
  });

  showCategoryPageButton.addEventListener("click", function () {
    currentPageMode = "category";
    updatePageModeTabs();
  });

  showBackupPageButton.addEventListener("click", function () {
    currentPageMode = "backup";
    updatePageModeTabs();
  });

  // 既存の切り替え機能はそのまま使い、見た目だけタブ風にする
  showUnreadButton.addEventListener("click", function () {
    currentListMode = "unread";
    updateListModeTabs();
    currentListViewMode = "books";
    currentSelectedAuthor = "";
    renderBooks();
  });

  showReadButton.addEventListener("click", function () {
    currentListMode = "read";
    updateListModeTabs();
    currentListViewMode = "books";
    currentSelectedAuthor = "";
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

  // 候補一覧の外側を押したら閉じる
  document.addEventListener("click", function (event) {
    const clickedAuthorInput = authorInput.contains(event.target);
    const clickedPredictList = authorPredictList.contains(event.target);

    if (!clickedAuthorInput && !clickedPredictList) {
      hideAuthorPredictList();
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
  renderAuthorSuggestions();
  updateAuthorReadingField();
  hideAuthorPredictList();
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
  authorReadingInput.value = targetBook.reading || "";
  publisherInput.value = targetBook.publisher;
  categorySelect.value = targetBook.category;
  memoInput.value = targetBook.memo;

  renderAuthorSuggestions();
  updateAuthorReadingField();
  hideAuthorPredictList();
  formModal.classList.remove("hidden");
}

function closeFormModal() {
  formModal.classList.add("hidden");
  bookForm.reset();
  bookIdInput.value = "";
  bookIsReadInput.value = "false";
  authorReadingInput.required = false;
  authorReadingGroup.classList.add("hidden");
  hideAuthorPredictList();
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
  const reading = authorReadingInput.value.trim();
  const publisher = publisherInput.value.trim();
  const category = categorySelect.value;
  const memo = memoInput.value.trim();
  const isRead = bookIsReadInput.value === "true";

  if (!title || !author || !category) {
    alert("タイトル・著者・カテゴリは必須です。");
    return;
  }

  // 著者名の先頭が漢字なら、読みを必須にする
  if (needsAuthorReading(author) && !reading) {
    alert("著者名の先頭が漢字の場合は、著者のよみを入力してください。");
    return;
  }

  const books = getBooks();

  if (id) {
    updateBook(books, id, title, author, reading, publisher, category, memo, isRead);
  } else {
    addBook(books, title, author, reading, publisher, category, memo);
  }

  // 同じ著者名の本が複数ある場合は、
  // どれか1冊で読みを更新したら他の本にも同じ読みを反映する
  syncAuthorReadingAcrossBooks(books, author, reading);

  saveBooks(books);
  renderBooks();
  closeFormModal();
}

function addBook(books, title, author, reading, publisher, category, memo) {
  // 新規データは必ず未読で作成する
  const newBook = {
    id: Date.now().toString(),
    title: title,
    author: author,
    reading: reading,
    publisher: publisher,
    memo: memo,
    category: category,
    createdAt: Date.now(),
    isRead: false
  };

  books.unshift(newBook);
}

function updateBook(books, id, title, author, reading, publisher, category, memo, isRead) {
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
    reading: reading,
    publisher: publisher,
    memo: memo,
    category: category,
    // 古いデータに isRead が無くてもここで補える
    isRead: Boolean(isRead)
  };
}

function syncAuthorReadingAcrossBooks(books, author, reading) {
  // 著者名が同じ本を全部見つけて、reading をそろえる
  // これにより「東野圭吾」の読みを1冊で直すと、他の東野圭吾の本にも反映される
  books.forEach(function (book) {
    if (book.author === author) {
      book.reading = reading;
    }
  });
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

function handleAuthorInputChange() {
  // 著者入力に応じて読み欄の表示 / 非表示を切り替える
  updateAuthorReadingField();
  renderAuthorPredictList();
}

function exportBackupData() {
  // localStorage の本データとカテゴリデータだけを1つにまとめる
  const backupData = {
    books: getBooks(),
    categories: getCategories()
  };

  // JSON文字列を見やすい形で作る
  const jsonText = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonText], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);

  // 指定された形式でファイル名を作る
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const fileName = `backup_${year}${month}${day}.json`;

  // 一時的な a 要素を使ってダウンロードを開始する
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  link.click();

  // 一時URLは使い終わったら解放する
  URL.revokeObjectURL(downloadUrl);
}

function importBackupData() {
  const file = importBackupFile.files[0];

  // ファイル未選択のまま復元を押した場合の対策
  if (!file) {
    alert("復元するJSONファイルを選択してください。");
    return;
  }

  const isConfirmed = window.confirm("バックアップを復元すると、現在の本データとカテゴリデータは上書きされます。続けますか？");

  if (!isConfirmed) {
    return;
  }

  const reader = new FileReader();

  // ファイル読み込み完了後にJSONを確認して保存する
  reader.onload = function () {
    try {
      const backupData = JSON.parse(reader.result);

      // 最低限の形式チェック
      if (!backupData || !Array.isArray(backupData.books) || !Array.isArray(backupData.categories)) {
        alert("JSONの形式が正しくありません。");
        return;
      }

      // 復元後も「その他」が必ずあるようにしておく
      if (!backupData.categories.includes(FALLBACK_CATEGORY)) {
        backupData.categories.push(FALLBACK_CATEGORY);
      }

      // 既存データとの互換性を保つため、isRead が無い本は false 扱いにする
      const normalizedBooks = backupData.books.map(function (book) {
        return {
          ...book,
          isRead: Boolean(book.isRead),
          // 古いバックアップに reading が無くても空文字で受ける
          reading: typeof book.reading === "string" ? book.reading : ""
        };
      });

      saveBooks(normalizedBooks);
      saveCategories(backupData.categories);

      // 復元後はUIを最新状態にする
      renderCategoryOptions();
      renderCategoryFilterOptions();
      renderCategoryList();
      renderBooks();
      closeFormModal();
      closeDetailModal();

      // 同じファイルを続けて選べるよう、選択状態を空に戻す
      importBackupFile.value = "";
    } catch (error) {
      alert("JSONの読み込みに失敗しました。正しいバックアップファイルを選択してください。");
    }
  };

  reader.readAsText(file);
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
      isRead: Boolean(book.isRead),
      // 旧データとの互換性: reading が無い本もそのまま使えるようにする
      reading: typeof book.reading === "string" ? book.reading : ""
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

function renderAuthorSuggestions() {
  const authorMap = buildAuthorReadingMap();
  authorSuggestions.innerHTML = "";

  Object.keys(authorMap).sort(function (a, b) {
    return compareTextForAuthor(a, "", b, "");
  }).forEach(function (author) {
    const option = document.createElement("option");
    option.value = author;
    authorSuggestions.appendChild(option);
  });
}

function renderAuthorPredictList() {
  const keyword = authorInput.value.trim();
  const authorMap = buildAuthorReadingMap();

  authorPredictList.innerHTML = "";

  // 何も入力していないときは、ブラウザ標準の datalist を使える状態のままにする
  if (!keyword) {
    hideAuthorPredictList();
    return;
  }

  // 著者名か読みのどちらかに一致する候補を拾う
  const matchedAuthors = Object.keys(authorMap).filter(function (author) {
    const readings = authorMap[author];
    const normalizedKeyword = normalizeKanaForSearch(keyword);
    const matchedAuthor = normalizeKanaForSearch(author).startsWith(normalizedKeyword);
    const matchedReading = readings.some(function (reading) {
      return normalizeKanaForSearch(reading).startsWith(normalizedKeyword);
    });

    return matchedAuthor || matchedReading;
  }).sort(function (a, b) {
    return compareTextForAuthor(a, getAuthorReadingFromMap(authorMap, a), b, getAuthorReadingFromMap(authorMap, b));
  });

  if (matchedAuthors.length === 0) {
    hideAuthorPredictList();
    return;
  }

  matchedAuthors.slice(0, 8).forEach(function (author) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "predict-item";

    const reading = getAuthorReadingFromMap(authorMap, author);
    item.innerHTML = `
      <strong>${escapeHtml(author)}</strong>
      <span>${escapeHtml(reading || "読み未設定")}</span>
    `;

    // 候補を選んだら、著者名と読みをフォームへ反映する
    item.addEventListener("click", function () {
      authorInput.value = author;

      if (reading) {
        authorReadingInput.value = reading;
      }

      updateAuthorReadingField();
      hideAuthorPredictList();
    });

    authorPredictList.appendChild(item);
  });

  authorPredictList.classList.remove("hidden");
}

function hideAuthorPredictList() {
  authorPredictList.classList.add("hidden");
  authorPredictList.innerHTML = "";
}

function updateAuthorReadingField() {
  const author = authorInput.value.trim();
  const shouldShowReading = needsAuthorReading(author);

  // 漢字始まりのときだけ読み欄を表示し、必須にする
  authorReadingGroup.classList.toggle("hidden", !shouldShowReading);
  authorReadingInput.required = shouldShowReading;

  if (!shouldShowReading) {
    authorReadingInput.value = "";
    authorReadingSuggestions.innerHTML = "";
    return;
  }

  renderAuthorReadingSuggestions(author);
}

function renderAuthorReadingSuggestions(author) {
  const authorMap = buildAuthorReadingMap();
  const matchedReadings = [];

  authorReadingSuggestions.innerHTML = "";

  Object.keys(authorMap).forEach(function (savedAuthor) {
    if (savedAuthor === author || savedAuthor.includes(author) || author.includes(savedAuthor)) {
      authorMap[savedAuthor].forEach(function (reading) {
        if (!matchedReadings.includes(reading)) {
          matchedReadings.push(reading);
        }
      });
    }
  });

  matchedReadings.forEach(function (reading) {
    const option = document.createElement("option");
    option.value = reading;
    authorReadingSuggestions.appendChild(option);
  });

  // 同じ著者名がすでに登録されていれば、読みを補助入力する
  if (authorMap[author] && authorMap[author].length === 1 && !authorReadingInput.value.trim()) {
    authorReadingInput.value = authorMap[author][0];
  }
}

function buildAuthorReadingMap() {
  const books = getBooks();
  const authorMap = {};

  books.forEach(function (book) {
    if (!book.author) {
      return;
    }

    if (!authorMap[book.author]) {
      authorMap[book.author] = [];
    }

    if (book.reading && !authorMap[book.author].includes(book.reading)) {
      authorMap[book.author].push(book.reading);
    }
  });

  return authorMap;
}

function getAuthorReadingFromMap(authorMap, author) {
  if (!authorMap[author] || authorMap[author].length === 0) {
    return "";
  }

  return authorMap[author][0];
}

function normalizeKanaForSearch(text) {
  // 検索時だけ、ひらがなとカタカナを同じものとして扱う
  // これにより「あ」で入力しても「ア」を含む著者名が候補に出る
  return String(text).replace(/[ァ-ヶ]/g, function (char) {
    return String.fromCharCode(char.charCodeAt(0) - 0x60);
  });
}

function needsAuthorReading(author) {
  // 先頭が漢字なら読み入力を求める
  return /^[\u4E00-\u9FFF々]/.test(String(author).trim());
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
  bookList.innerHTML = "";
  updateListViewUI();

  if (currentListViewMode === "authors") {
    renderAuthorSummaryList();
    return;
  }

  if (currentListViewMode === "authorBooks") {
    renderSelectedAuthorBooks();
    return;
  }

  renderNormalBookList();
}

function updateListViewUI() {
  // 通常一覧以外では、並び順とカテゴリ絞り込みを隠して状態を分かりやすくする
  const isNormalBookList = currentListViewMode === "books";
  sortSelect.closest(".sort-area").classList.toggle("hidden", !isNormalBookList);
  filterCategorySelect.closest(".filter-area").classList.toggle("hidden", !isNormalBookList);

  // 著者別表示中だけ、通常一覧へ戻るボタンを見せる
  backToBookListButton.classList.toggle("hidden", isNormalBookList);

  if (currentListViewMode === "authors") {
    bookSectionTitle.textContent = "著者別一覧";
    return;
  }

  if (currentListViewMode === "authorBooks") {
    bookSectionTitle.textContent = currentSelectedAuthor + " の本一覧";
    return;
  }

  bookSectionTitle.textContent = currentListMode === "unread" ? "未読リスト" : "読破リスト";
}

function renderNormalBookList() {
  const books = getSortedBooks();

  if (books.length === 0) {
    emptyMessage.classList.remove("hidden");
    emptyMessage.textContent = currentListMode === "unread"
      ? "未読の本はありません。「＋」ボタンから追加してください。"
      : "読破した本はまだありません。";
    return;
  }

  emptyMessage.classList.add("hidden");

  let lastHeading = "";

  books.forEach(function (book) {
    // 著者名順のときだけ、読みの先頭を使った見出しを出す
    if (sortSelect.value === "author") {
      const headingLabel = getAuthorHeadingLabel(book.reading || book.author);

      if (headingLabel !== lastHeading) {
        const heading = document.createElement("p");
        heading.className = "author-group-heading";
        heading.textContent = headingLabel;
        bookList.appendChild(heading);
        lastHeading = headingLabel;
      }
    }

    appendBookCard(book);
  });
}

function renderAuthorSummaryList() {
  const books = getFilteredBooksByCurrentMode();

  if (books.length === 0) {
    emptyMessage.classList.remove("hidden");
    emptyMessage.textContent = "この一覧に表示できる著者がまだありません。";
    return;
  }

  emptyMessage.classList.add("hidden");

  // 著者ごとの冊数を集計する
  const authorCountMap = {};

  books.forEach(function (book) {
    if (!authorCountMap[book.author]) {
      authorCountMap[book.author] = 0;
    }

    authorCountMap[book.author] += 1;
  });

  // 著者名は重複なしで、五十音順 / アルファベット順に並べる
  const authors = Object.keys(authorCountMap).sort(function (a, b) {
    return compareTextForAuthor(a, getAuthorReadingFromBooks(a), b, getAuthorReadingFromBooks(b));
  });

  let lastHeading = "";

  authors.forEach(function (author) {
    const headingLabel = getAuthorHeadingLabel(getAuthorReadingFromBooks(author) || author);

    if (headingLabel !== lastHeading) {
      const heading = document.createElement("p");
      heading.className = "author-group-heading";
      heading.textContent = headingLabel;
      bookList.appendChild(heading);
      lastHeading = headingLabel;
    }

    const authorCard = document.createElement("article");
    authorCard.className = "book-card";

    const authorButton = document.createElement("div");
    authorButton.className = "book-card-main";
    authorButton.innerHTML = `
      <h3>${escapeHtml(author)}（${authorCountMap[author]}冊）</h3>
    `;

    authorButton.addEventListener("click", function () {
      currentListViewMode = "authorBooks";
      currentSelectedAuthor = author;
      renderBooks();
    });

    authorCard.appendChild(authorButton);
    bookList.appendChild(authorCard);
  });
}

function renderSelectedAuthorBooks() {
  const books = getFilteredBooksByCurrentMode().filter(function (book) {
    return book.author === currentSelectedAuthor;
  });

  if (books.length === 0) {
    emptyMessage.classList.remove("hidden");
    emptyMessage.textContent = "この著者の本はまだありません。";
    return;
  }

  emptyMessage.classList.add("hidden");

  // 要件どおり、「著者名順」と同じルールで並べる
  books.sort(function (a, b) {
    return compareBooksByAuthor(a, b);
  });

  books.forEach(function (book) {
    appendBookCard(book);
  });
}

function appendBookCard(book) {
  const bookCard = document.createElement("article");
  bookCard.className = "book-card";

  // 保存日順が選ばれているときだけ、一覧にも保存日を表示する
  const shouldShowCreatedDate = sortSelect.value === "createdAt" && currentListViewMode === "books";
  const createdDateText = shouldShowCreatedDate
    ? new Date(book.createdAt).toLocaleString("ja-JP")
    : "";

  // 一覧ではカード本体だけを作り、編集・削除ボタンは生成しない
  const mainArea = document.createElement("div");
  mainArea.className = "book-card-main";
  mainArea.addEventListener("click", function () {
    openDetailModal(book.id);
  });

  mainArea.innerHTML = `
    <h3>${escapeHtml(book.title)}</h3>
    <p class="book-meta"><strong>著者:</strong> ${escapeHtml(book.author)}</p>
    ${shouldShowCreatedDate ? `<p class="book-meta"><strong>保存日:</strong> ${createdDateText}</p>` : ""}
    <div class="category-tag">${escapeHtml(book.category)}</div>
  `;

  bookCard.appendChild(mainArea);
  bookList.appendChild(bookCard);
}

function getFilteredBooksByCurrentMode() {
  const books = getBooks().slice();
  const selectedCategory = filterCategorySelect.value;

  const filteredByReadStatus = books.filter(function (book) {
    const bookIsRead = Boolean(book.isRead);
    return currentListMode === "read" ? bookIsRead : !bookIsRead;
  });

  return filteredByReadStatus.filter(function (book) {
    if (!selectedCategory) {
      return true;
    }

    return book.category === selectedCategory;
  });
}

function getSortedBooks() {
  const books = getFilteredBooksByCurrentMode();
  const sortType = sortSelect.value;

  if (sortType === "createdAt") {
    books.sort(function (a, b) {
      return b.createdAt - a.createdAt;
    });

    return books;
  }

  books.sort(compareBooksByAuthor);

  return books;
}

function compareBooksByAuthor(a, b) {
  return compareTextForAuthor(a.author, a.reading, b.author, b.reading);
}

function compareTextForAuthor(authorA, readingA, authorB, readingB) {
  const keyA = getAuthorSortKey(authorA, readingA);
  const keyB = getAuthorSortKey(authorB, readingB);
  const groupWeightA = getAuthorScriptGroupWeight(keyA);
  const groupWeightB = getAuthorScriptGroupWeight(keyB);

  // まずは、ひらがな → カタカナ → アルファベット → その他 の順に並べる
  if (groupWeightA !== groupWeightB) {
    return groupWeightA - groupWeightB;
  }

  const compareResult = keyA.localeCompare(keyB, "ja");

  if (compareResult !== 0) {
    return compareResult;
  }

  return String(authorA).localeCompare(String(authorB), "ja");
}

function getAuthorSortKey(author, reading) {
  // 読みがある場合は読みを優先、無ければ著者名そのものを使う
  return String(reading || author || "");
}

function getAuthorScriptGroupWeight(text) {
  const firstChar = String(text).trim().charAt(0);

  if (!firstChar) {
    return 99;
  }

  if (/[ぁ-ゖ]/.test(firstChar)) {
    return 1;
  }

  if (/[ァ-ヶ]/.test(firstChar)) {
    return 2;
  }

  if (/[a-zA-Z]/.test(firstChar)) {
    return 3;
  }

  return 99;
}

function getAuthorReadingFromBooks(author) {
  const books = getBooks();
  const matchedBook = books.find(function (book) {
    return book.author === author && book.reading;
  });

  return matchedBook ? matchedBook.reading : "";
}

function getAuthorHeadingLabel(text) {
  const firstChar = String(text).trim().charAt(0);

  if (!firstChar) {
    return "その他";
  }

  // ひらがなは、従来どおり「あ・か・さ...」で見出しを出す
  if ("あいうえおぁぃぅぇぉ".includes(firstChar)) {
    return "あ";
  }
  if ("かきくけこがぎぐげござじずぜぞ".includes(firstChar)) {
    return "か";
  }
  if ("さしすせそ".includes(firstChar)) {
    return "さ";
  }
  if ("たちつてとだぢづでど".includes(firstChar)) {
    return "た";
  }
  if ("なにぬねの".includes(firstChar)) {
    return "な";
  }
  if ("はひふへほばびぶべぼぱぴぷぺぽ".includes(firstChar)) {
    return "は";
  }
  if ("まみむめも".includes(firstChar)) {
    return "ま";
  }
  if ("やゆよゃゅょ".includes(firstChar)) {
    return "や";
  }
  if ("らりるれろ".includes(firstChar)) {
    return "ら";
  }
  if ("わをんゎ".includes(firstChar)) {
    return "わ";
  }

  // カタカナは、ひらがなと混ぜずに「ア・カ・サ...」で別見出しにする
  if ("アイウエオァィゥェォ".includes(firstChar)) {
    return "ア";
  }
  if ("カキクケコガギグゲゴザジズゼゾ".includes(firstChar)) {
    return "カ";
  }
  if ("サシスセソ".includes(firstChar)) {
    return "サ";
  }
  if ("タチツテトダヂヅデド".includes(firstChar)) {
    return "タ";
  }
  if ("ナニヌネノ".includes(firstChar)) {
    return "ナ";
  }
  if ("ハヒフヘホバビブベボパピプペポ".includes(firstChar)) {
    return "ハ";
  }
  if ("マミムメモ".includes(firstChar)) {
    return "マ";
  }
  if ("ヤユヨャュョ".includes(firstChar)) {
    return "ヤ";
  }
  if ("ラリルレロ".includes(firstChar)) {
    return "ラ";
  }
  if ("ワヲンヮ".includes(firstChar)) {
    return "ワ";
  }

  if (/[a-zA-Z]/.test(firstChar)) {
    return "A-Z";
  }

  return "その他";
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

function updatePageModeTabs() {
  const mainActive = currentPageMode === "main";
  const categoryActive = currentPageMode === "category";
  const backupActive = currentPageMode === "backup";

  showMainPageButton.classList.toggle("active", mainActive);
  showCategoryPageButton.classList.toggle("active", categoryActive);
  showBackupPageButton.classList.toggle("active", backupActive);

  showMainPageButton.setAttribute("aria-pressed", String(mainActive));
  showCategoryPageButton.setAttribute("aria-pressed", String(categoryActive));
  showBackupPageButton.setAttribute("aria-pressed", String(backupActive));

  // 表示そのものは hidden の付け外しだけにして、既存構造を大きく変えない
  mainPageContent.classList.toggle("hidden", !mainActive);
  categoryPageContent.classList.toggle("hidden", !categoryActive);
  backupPageContent.classList.toggle("hidden", !backupActive);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
