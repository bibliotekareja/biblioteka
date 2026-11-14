/**
 * CONFIGURATION
 * 1. Sign in to the Biblioteka Google account and upload/create the catalog in Google Sheets.
 * 2. In Google Sheets, go to File > Share > Share with others.
 * 3. Change General access to "Anyone with the link" (Viewer).
 * 4. Copy the Sheet ID from the URL:
 *    https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
 */
const SHEET_ID = 'REPLACE_WITH_BIBLIOTEKA_SHEET_ID';

/**
 * Optional list of tab GIDs to load and merge (found after `#gid=` in the sheet URL).
 * Leave empty `[]` to load the first tab automatically.
 * Example for two tabs: ['0', '123456789']
 */
const SHEET_GIDS = [];

// Elements
const bookListElement = document.getElementById('bookList');
const searchInput = document.getElementById('searchInput');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const bookCountElement = document.getElementById('bookCount');

let books = [];

/**
 * Builds the CSV export URL for the configured Google Sheet (and optional tab gid).
 */
function buildSheetUrl(gid) {
    const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    return gid !== undefined && gid !== null && gid !== '' ? `${base}&gid=${encodeURIComponent(gid)}` : base;
}

/**
 * Parses an RFC-4180 CSV string into a 2D array of cell strings.
 */
function parseCSVRows(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];

        if (inQuotes) {
            if (char === '"') {
                if (csvText[i + 1] === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if (char === '\r') {
            if (csvText[i + 1] === '\n') i++;
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else if (char === '\n') {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    return rows;
}

/**
 * Normalizes a string for diacritic-insensitive matching and header detection.
 */
function normalizeString(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ł/g, 'l')
        .replace(/Ł/g, 'l');
}

/**
 * Detects header row and column indices across the different sheet layouts.
 */
function detectColumns(rows) {
    const defaultMapping = {
        dataStartIndex: 0,
        nr: 0,
        lastName: 1,
        firstName: 2,
        title: 3,
        year: 4,
    };

    const searchLimit = Math.min(3, rows.length);
    for (let r = 0; r < searchLimit; r++) {
        const normalizedRow = rows[r].map(normalizeString);
        const hasTitle = normalizedRow.some(cell => cell === 'tytul');
        const hasLastName = normalizedRow.some(cell => cell === 'nazwisko');

        if (hasTitle || hasLastName) {
            const findCol = (names, fallback) => {
                const idx = normalizedRow.findIndex(cell => names.includes(cell));
                return idx !== -1 ? idx : fallback;
            };

            return {
                dataStartIndex: r + 1,
                nr: findCol(['nr.', 'nr', 'numer'], 0),
                lastName: findCol(['nazwisko'], 1),
                firstName: findCol(['imie'], 2),
                title: findCol(['tytul'], 3),
                year: findCol(['rok wydania', 'wydania', 'rok'], 4),
            };
        }
    }

    // Fallback for headerless sheets (e.g. `Swiatowa 1` with only `AUTOR` in row 1)
    if (rows.length > 0 && normalizeString(rows[0][1]) === 'autor') {
        return { ...defaultMapping, dataStartIndex: 1 };
    }

    return defaultMapping;
}

/**
 * Converts CSV text from a single tab into normalized book objects.
 */
function parseBooksFromCSV(csvText) {
    const rows = parseCSVRows(csvText);
    if (rows.length === 0) return [];

    const cols = detectColumns(rows);
    const parsed = [];

    for (let i = cols.dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        const nr = row[cols.nr] || '';
        const lastName = row[cols.lastName] || '';
        const firstName = row[cols.firstName] || '';
        const title = row[cols.title] || '';
        const year = row[cols.year] || '';

        if (!title && !lastName && !firstName) continue;

        const searchText = normalizeString(`${nr} ${lastName} ${firstName} ${lastName} ${title}`);
        parsed.push({
            nr,
            lastName,
            firstName,
            title: title || 'Unknown Title',
            year,
            searchText,
        });
    }

    return parsed;
}

/**
 * Renders the filtered list of books using safe DOM APIs.
 */
function renderBooks(filteredBooks) {
    bookListElement.replaceChildren();

    if (bookCountElement) {
        bookCountElement.textContent = books.length > 0
            ? (filteredBooks.length === books.length
                ? `${books.length.toLocaleString()} books`
                : `${filteredBooks.length.toLocaleString()} of ${books.length.toLocaleString()} books`)
            : '';
    }

    if (filteredBooks.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#888';
        emptyMsg.style.padding = '20px';
        emptyMsg.textContent = 'No books found matching your search.';
        bookListElement.appendChild(emptyMsg);
        return;
    }

    const fragment = document.createDocumentFragment();

    filteredBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';

        const nrSpan = document.createElement('span');
        nrSpan.className = 'book-nr';
        nrSpan.textContent = book.nr;

        const authorSpan = document.createElement('span');
        authorSpan.className = 'book-author-col';
        authorSpan.textContent = `${book.lastName} ${book.firstName}`.trim();

        const titleSpan = document.createElement('span');
        titleSpan.className = 'book-title-col';
        titleSpan.textContent = book.title;

        if (book.year) {
            const yearSpan = document.createElement('span');
            yearSpan.className = 'book-year';
            yearSpan.textContent = `(${book.year})`;
            titleSpan.appendChild(document.createTextNode(' '));
            titleSpan.appendChild(yearSpan);
        }

        card.append(nrSpan, authorSpan, titleSpan);
        fragment.appendChild(card);
    });

    bookListElement.appendChild(fragment);
}

/**
 * Fetches one or more sheet tabs from Google Sheets and initializes the catalog.
 */
async function init() {
    if (!SHEET_ID || SHEET_ID === 'REPLACE_WITH_BIBLIOTEKA_SHEET_ID') {
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
        errorElement.textContent = 'Catalog not configured yet: set SHEET_ID in script.js to the Biblioteka Google Sheet ID.';
        return;
    }

    try {
        const gidsToFetch = SHEET_GIDS.length > 0 ? SHEET_GIDS : [''];
        const responses = await Promise.all(
            gidsToFetch.map(async gid => {
                const url = buildSheetUrl(gid);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status} while loading sheet`);
                }
                return response.text();
            })
        );

        books = responses.flatMap(parseBooksFromCSV);

        // Sort by Author (Last Name then First Name), then Title
        books.sort((a, b) => {
            const nameA = `${a.lastName} ${a.firstName}`.trim();
            const nameB = `${b.lastName} ${b.firstName}`.trim();
            const authorCmp = nameA.localeCompare(nameB, 'pl', { sensitivity: 'base' });
            return authorCmp !== 0 ? authorCmp : a.title.localeCompare(b.title, 'pl', { sensitivity: 'base' });
        });

        loadingElement.style.display = 'none';
        renderBooks(books);
    } catch (err) {
        console.error('Error fetching or parsing data:', err);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
        errorElement.textContent = `Failed to load collection: ${err.message}`;
    }
}

// Search Logic
searchInput.addEventListener('input', (e) => {
    const query = normalizeString(e.target.value).trim();
    if (!query) {
        renderBooks(books);
        return;
    }

    const terms = query.split(/\s+/);
    const filtered = books.filter(book =>
        terms.every(term => book.searchText.includes(term))
    );
    renderBooks(filtered);
});

init();
