// ⭐⭐ تنظیمات اصلی ⭐⭐
const API_BASE_URL = 'https://localhost:44357/api/books'; 
const PAGE_SIZE = 3; 
let currentPage = 1; 

// انتخاب المان‌های HTML
const booksDisplayArea = document.getElementById('books-display-area');
const detailsContainer = document.getElementById('book-details-container');
const paginationContainer = document.getElementById('pagination-container');


// ----------------------------------------------------------------------------------
// 📚 تابع نمایش لیست کتاب‌ها (نمای خلاصه)
// ----------------------------------------------------------------------------------
function renderBooksList(books) {
    booksDisplayArea.innerHTML = ''; 
    detailsContainer.innerHTML = ''; 

    books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        
        // لینک عنوان کتاب
        const titleLink = document.createElement('a');
        titleLink.className = 'book-title-link';
        titleLink.textContent = book.BookTitle;
        titleLink.setAttribute('data-book-id', book.BookUID);
        titleLink.href = "#";
        titleLink.addEventListener('click', showBookDetails);
        //titleLink.href = `details.html?uid=${book.BookUID}`;

        // اطلاعات نویسنده و دسته‌بندی
        const info = document.createElement('p');
        info.textContent = `نویسنده: ${book.AuthorName} | دسته‌بندی: ${book.BooksCategory}`;

        // چیدن در DOM
        bookItem.appendChild(titleLink);
        bookItem.appendChild(info);
        booksDisplayArea.appendChild(bookItem);
    });
}

// ----------------------------------------------------------------------------------
// 📄 تابع صفحه‌بندی
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
// 🔍 نمایش جزئیات کامل کتاب
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
            <p><strong></strong> ${bookDetail.BookImage}</p>
            <h2>${bookDetail.BookTitle}</h2>
            <p><strong>نویسنده:</strong> ${bookDetail.AuthorName}</p>
            <p><strong>مترجم:</strong> ${bookDetail.Translator}</p>
            <p><strong>ISBN:</strong> ${bookDetail.ISBN}</p>
            <p><strong>دسته‌بندی:</strong> ${bookDetail.BooksCategory}</p>
            <p><strong>:نام ناشر</strong> ${bookDetail.publisherName}</p>
            <p><strong>:سال انتشار</strong> ${bookDetail.PublicationYear}</p>
            <p><strong>:تعداد صفحات</strong> ${bookDetail.PagesNumber}</p>
            <p><strong>وضعیت امانت:</strong> ${bookDetail.BorrowingStatus}</p>
            <p><strong>توضیحات کامل:</strong> ${bookDetail.Description || 'توضیحاتی موجود نیست.'}</p>
             
        `;
               
        const backButton = document.createElement('button');
        backButton.textContent = 'بازگشت به لیست اصلی';
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

// ✅ Live Search
document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        const query = this.value.trim();

        if (!query) {
            fetchBooks(1); // اگر کادر خالی شد → لیست کامل برگردد
            return;
        }

        doSearch(query);
    }, 300); // ⏱ جلوگیری از ارسال زیاد درخواست (Debounce)
});


async function doSearch(query) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/Search?query=${encodeURIComponent(query)}&pageNumber=1&pageSize=${PAGE_SIZE}`
        );

        const data = await response.json();
        console.log(response);

        // ✅ نتیجه خالی = فقط پیام
        if (!data.Books || data.Books.length === 0) {
            booksDisplayArea.innerHTML = `<p class="error">کتابی با این مشخصات یافت نشد.</p>`;
            paginationContainer.innerHTML = '';
            return;
        }

        currentPage = data.CurrentPage;
        renderBooksList(data.Books);
        renderPagination(data.TotalCount);

    } catch (error) {
        console.error('Live Search Error:', error);
        booksDisplayArea.innerHTML = `<p class="error">مشکلی در جستجو رخ داد.</p>`;
        paginationContainer.innerHTML = '';
    }
}

async function fetchBooks(page, category = '') {
    let url = `${API_BASE_URL}?pageNumber=${page}&pageSize=${PAGE_SIZE}`;
    
    if (category) {
        url += `&subject=${encodeURIComponent(category)}`;
    }
    console.log("Fetching URL:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`خطای HTTP: ${response.status}`);

        const data = await response.json();
        const booksArray = data.Books;

        currentPage = data.CurrentPage;
        currentCategory = category;

        renderBooksList(booksArray);
        renderPagination(data.TotalCount);

    } catch (error) {
        console.error('Error fetching books:', error);
        booksDisplayArea.innerHTML = `<p class="error">مشکل در بارگذاری لیست کتاب‌ها: ${error.message}</p>`;
        paginationContainer.innerHTML = '';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const menuSubjects = document.getElementById('menuSubjects');

    // نمایش اولیه کتاب‌ها
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


    // const menuSubjects = document.getElementById('menu-subjects');
    // console.log(menuSubjects);
    // if (menuSubjects) {
    //     menuSubjects.addEventListener('click', function(e) {
    //         const category = e.target.getAttribute('data-subject');
    //         if (category) { // فقط اگر data-subject وجود داشته باشد
    //             e.preventDefault(); // فقط لینک دسته‌بندی را جلوگیری کن
    //             console.log("Clicked category:", category);
    //             fetchBooks(1, category);
    //         }
    //     });
    // }
});

// document.getElementById("menuToggle").addEventListener("click", () => {
//     document.querySelector(".category-menu").classList.toggle("active");
// });






