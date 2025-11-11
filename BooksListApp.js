//------------------------- main Setting -----------------------------------------------
const API_BASE_URL = 'http://82.115.16.56:2500//api/Books'; 
const PAGE_SIZE = 3; 
let currentPage = 1; 

// انتخاب المان‌های HTML
const booksDisplayArea = document.getElementById('books-display-area');
const detailsContainer = document.getElementById('book-details-container');
const paginationContainer = document.getElementById('pagination-container');


// ----------------------------------------------------------------------------------
//----------------- List of books (summary view) ------------------------------------
// ----------------------------------------------------------------------------------
function renderBooksList(books) {
    booksDisplayArea.innerHTML = ''; 
    detailsContainer.innerHTML = ''; 

    books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        
        //------------ Link to the title of the book -------------------------------
        const titleLink = document.createElement('a');
        titleLink.className = 'book-title-link';
        titleLink.textContent = book.bookTitle; // 👈 حروف کوچک
        titleLink.setAttribute('data-book-id', book.bookUID); // 👈 حروف کوچک
        titleLink.href = "#";
        titleLink.addEventListener('click', showBookDetails);

        //---------------- Author and category information --------------------------
        const info = document.createElement('p');
        info.textContent = `نویسنده: ${book.authorName} | دسته‌بندی: ${book.booksCategory}`; // 👈 همه با حروف کوچک

        //------------------ picking at DOM --------------------------------
        bookItem.appendChild(titleLink);
        bookItem.appendChild(info);
        booksDisplayArea.appendChild(bookItem);
    });
}


// ----------------------------------------------------------------------------------
//------------------------- pagination function -------------------------------------
// ----------------------------------------------------------------------------------
function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    paginationContainer.innerHTML = ''; 

    if (currentPage > 1) {
        const homeButton = document.createElement('button');
        homeButton.textContent = 'بازگشت به صفحه اصلی (۱)';
        homeButton.addEventListener('click', () => fetchBooks(1));
        paginationContainer.appendChild(homeButton);
    }

    if (totalPages > 1) {
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `صفحه ${currentPage} از ${totalPages}`;
        paginationContainer.appendChild(pageInfo);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'صفحه بعد';
        nextButton.addEventListener('click', () => fetchBooks(currentPage + 1));
        paginationContainer.appendChild(nextButton);
    }

    if (totalCount === 0) {
         paginationContainer.innerHTML = 'کتابی برای نمایش وجود ندارد.';
    }
}

// ----------------------------------------------------------------------------------
//---------------------------------- Show full details of the book ------------------
// ----------------------------------------------------------------------------------
async function showBookDetails(event) {
    event.preventDefault(); 

    const clickedLink = event.target.closest('a[data-book-id]');
    if (!clickedLink) return;

    const bookId = clickedLink.getAttribute('data-book-id');
    if (!bookId) return;

    booksDisplayArea.innerHTML = 'در حال بارگذاری جزئیات...';
    paginationContainer.innerHTML = '';
    detailsContainer.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/${bookId}`);
        if (!response.ok) {
            detailsContainer.innerHTML = `<p class="error">کتاب با ID ${bookId} پیدا نشد.</p>`;
            return;
        }

        const bookDetail = await response.json();
        detailsContainer.innerHTML = `
            <hr>
            <h3>جزئیات کتاب</h3>
            <p><strong></strong> ${bookDetail.bookImage}</p>
            <h2>${bookDetail.BookTitle}</h2>
            <p><strong>نویسنده:</strong> ${bookDetail.authorName}</p>
            <p><strong>مترجم:</strong> ${bookDetail.translator}</p>
            <p><strong>ISBN:</strong> ${bookDetail.ISBN}</p>
            <p><strong>دسته‌بندی:</strong> ${bookDetail.booksCategory}</p>
            <p><strong>:نام ناشر</strong> ${bookDetail.publisherName}</p>
            <p><strong>:سال انتشار</strong> ${bookDetail.publicationYear}</p>
            <p><strong>:تعداد صفحات</strong> ${bookDetail.pagesNumber}</p>
            <p><strong>وضعیت امانت:</strong> ${bookDetail.borrowingStatus}</p>
            <p><strong>توضیحات کامل:</strong> ${bookDetail.description || 'توضیحاتی موجود نیست.'}</p>
             
        `;
               
        const backButton = document.createElement('button');
        backButton.textContent = 'بازگشت به لیست اصلی';
        backButton.style.backgroundColor = "#694d41";
        backButton.style.color = "white";
        backButton.style.borderRadius = "15px";
        backButton.style.padding = "15px";
        backButton.style.fontFamily = "IranNastaliq";
        backButton.style.fontSize = "35px";
        backButton.addEventListener('click', () => {
            detailsContainer.innerHTML = ''; 
            fetchBooks(currentPage); 
        });
        detailsContainer.appendChild(backButton);

        booksDisplayArea.innerHTML = '';

    } catch (error) {
        console.error('Error fetching book details:', error);
        detailsContainer.innerHTML = `<p class="error">مشکل در واکشی جزئیات کتاب.</p>`;
    }
}
let searchTimeout;

//----------------------------  Live Search ---------------------------------------
document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        const query = this.value.trim();

        if (!query) {
            fetchBooks(1); //If the box is empty → the full list is returned
            return;
        }

        doSearch(query);
    }, 300); //Preventing excessive requests (Debounce)
});

async function doSearch(query) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/Search?query=${encodeURIComponent(query)}&pageNumber=1&pageSize=${PAGE_SIZE}`
        );

        const data = await response.json();
        console.log(response);

        // Empty result = message only
        if (!data.books || data.books.length === 0) {
            booksDisplayArea.innerHTML = `<p class="error">کتابی با این مشخصات یافت نشد.</p>`;
            paginationContainer.innerHTML = '';
            return;
        }

        currentPage = data.CurrentPage;
        renderBooksList(data.books);
        renderPagination(data.TotalCount);

    } catch (error) {
        console.error('Live Search Error:', error);
        booksDisplayArea.innerHTML = `<p class="error">مشکلی در جستجو رخ داد.</p>`;
        paginationContainer.innerHTML = '';
    }
}

//---------------------------- Function to get book from API based on page number --------------

async function fetchBooks(page, category = '') {
    // let url = `${API_BASE_URL}?pageNumber=${page}&pageSize=${PAGE_SIZE}`;
    let url = `${API_BASE_URL}/Paged?pageNumber=${page}&pageSize=${PAGE_SIZE}`;

    if (category) {
        url += `&subject=${encodeURIComponent(category)}`;
    }

    console.log("📡 Fetching URL:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`خطای HTTP: ${response.status}`);

        const data = await response.json();
        console.log("📦 API Response:", data);

        // گرفتن آرایه کتاب‌ها با در نظر گرفتن هر نوع پاسخ
        const booksArray =  data.books || data;

        if (!Array.isArray(booksArray)) {
            throw new Error("فرمت پاسخ سرور نامعتبر است — آرایه Books یافت نشد.");
        }

        currentPage = data.CurrentPage || 1;
        currentCategory = category;

        renderBooksList(booksArray);
        renderPagination(data.TotalCount || booksArray.length);

    } catch (error) {
        console.error('Error fetching books:', error);
        booksDisplayArea.innerHTML = `<p class="error">مشکل در بارگذاری لیست کتاب‌ها: ${error.message}</p>`;
        paginationContainer.innerHTML = '';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const menuSubjects = document.getElementById('menuSubjects');

    //Initial display of books
    fetchBooks(currentPage, "");
    menuSubjects.addEventListener('click', function(e) {
    const categoryElement = e.target.closest('[data-subject]');
    console.log(categoryElement);
    if (categoryElement) { 
        e.preventDefault(); 
        const category = categoryElement.getAttribute('data-subject');
        console.log("Clicked category:", category);
        fetchBooks(1, category);
    }
});

});









