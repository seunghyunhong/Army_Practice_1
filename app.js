// app.js

// -----------------------------------------------------------------------------
// 1. DOM 요소 가져오기 (HTML에서 필요한 요소들을 JavaScript 변수로 가져옵니다)
//    - 나중에 이 변수들을 사용해서 HTML 요소의 내용을 바꾸거나 이벤트를 추가할 수 있습니다.
// -----------------------------------------------------------------------------
const announcementTitleInput = document.getElementById('announcement-title'); // 공지 제목 입력 필드
const announcementContentInput = document.getElementById('announcement-content'); // 공지 내용 입력 필드
const announcementAuthorInput = document.getElementById('announcement-author'); // 작성자 입력 필드
const registerButton = document.getElementById('register-button'); // '등록' (또는 '수정 완료') 버튼
const announcementsContainer = document.getElementById('announcements-container'); // 공지 목록을 표시할 컨테이너
const announcementDetailView = document.getElementById('announcement-detail-view'); // 공지 상세 보기 전체 섹션
const detailContent = document.getElementById('detail-content'); // 공지 상세 내용이 들어갈 컨테이너
const searchInput = document.getElementById('search-input'); // 검색 입력 필드
const totalAnnouncementsCountSpan = document.getElementById('total-announcements-count'); // 총 공지 수 표시 span

// -----------------------------------------------------------------------------
// 2. 전역 변수 선언
//    - `announcements`: 모든 공지사항을 저장할 배열입니다.
//      이 배열의 내용은 `localStorage`와 동기화됩니다.
//    - `localStorageKey`: `localStorage`에 공지사항을 저장하고 불러올 때 사용할 키입니다.
//    - `editingAnnouncementId`: 현재 수정 중인 공지사항의 ID를 저장합니다.
//      새 공지 작성 중일 때는 `null`이며, 수정 중일 때만 ID 값을 가집니다.
// -----------------------------------------------------------------------------
let announcements = []; // 공지사항 데이터를 담을 배열
const localStorageKey = 'militaryAnnouncements'; // localStorage에 저장할 때 사용할 키 이름
let editingAnnouncementId = null; // 수정 중인 공지사항의 ID (없으면 null)

// -----------------------------------------------------------------------------
// 3. 유틸리티 함수: 날짜와 시간 형식 지정 (YYYY-MM-DD HH:MM:SS)
//    - 공지사항이 등록되거나 수정될 때 현재 날짜와 시간을 보기 좋게 포맷합니다.
// -----------------------------------------------------------------------------
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더해줍니다.
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// -----------------------------------------------------------------------------
// 4. `localStorage`에서 공지사항 불러오기
//    - 웹 페이지가 로드될 때 이전에 저장했던 공지사항을 가져옵니다.
// -----------------------------------------------------------------------------
function loadAnnouncements() {
    const storedAnnouncements = localStorage.getItem(localStorageKey); // localStorage에서 데이터 가져오기
    if (storedAnnouncements) { // 데이터가 있다면
        try {
            // JSON 문자열을 JavaScript 객체 배열로 변환합니다.
            // 최신 공지가 맨 위에 오도록 하기 위해, 불러온 데이터를 날짜 기준으로 내림차순 정렬합니다.
            announcements = JSON.parse(storedAnnouncements).sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (e) {
            console.error("Failed to parse announcements from localStorage:", e);
            announcements = []; // 파싱 에러 발생 시 빈 배열로 초기화
        }
    } else { // 데이터가 없다면
        announcements = []; // 빈 배열로 초기화
    }
}

// -----------------------------------------------------------------------------
// 5. `localStorage`에 공지사항 저장하기
//    - 공지사항 배열의 내용이 변경될 때마다 이 함수를 호출하여 `localStorage`에 저장합니다.
// -----------------------------------------------------------------------------
function saveAnnouncements() {
    // JavaScript 객체 배열을 JSON 문자열로 변환하여 `localStorage`에 저장합니다.
    localStorage.setItem(localStorageKey, JSON.stringify(announcements));
}

// -----------------------------------------------------------------------------
// 6. 총 공지 수 업데이트
//    - 현재 화면에 표시된 공지의 수를 업데이트합니다.
// -----------------------------------------------------------------------------
function updateTotalCount(count) {
    totalAnnouncementsCountSpan.textContent = count;
}

// -----------------------------------------------------------------------------
// 7. 공지사항 목록 화면에 렌더링(표시)하기
//    - `announcementsToRender` 배열의 내용을 바탕으로 HTML 요소를 만들어서 화면에 보여줍니다.
//    - `announcementsToRender`가 제공되지 않으면 전체 `announcements` 배열을 사용합니다.
//    - 각 공지에 '보기', '수정', '삭제' 버튼을 추가합니다.
// -----------------------------------------------------------------------------
function renderAnnouncements(announcementsToRender = null) {
    announcementsContainer.innerHTML = ''; // 기존 공지사항 목록을 모두 지웁니다.

    const listToUse = announcementsToRender || announcements; // 렌더링할 목록 (검색 결과 or 전체 목록)
    updateTotalCount(listToUse.length); // 총 공지 수 업데이트

    if (listToUse.length === 0) { // 공지사항이 하나도 없다면
        const noAnnouncementsMessage = document.createElement('p');
        noAnnouncementsMessage.textContent = '등록된 공지가 없습니다.';
        announcementsContainer.appendChild(noAnnouncementsMessage);
        detailContent.innerHTML = '<p>목록에서 공지를 선택하여 자세한 내용을 확인하세요.</p>'; // 상세 보기 초기화
        return; // 함수 종료
    }

    // 각 공지사항을 순회하며 HTML 요소를 생성하고 컨테이너에 추가합니다.
    listToUse.forEach((announcement, index) => {
        const announcementItem = document.createElement('div');
        announcementItem.classList.add('announcement-item'); // CSS 스타일을 적용하기 위한 클래스 추가

        // 공지사항의 HTML 구조를 만듭니다.
        // 번호는 배열의 인덱스를 역순으로 하여 최신 공지가 1번이 되도록 합니다.
        // (현재 렌더링된 목록에서의 순서이므로, 검색 결과에서도 No.1부터 시작)
        announcementItem.innerHTML = `
            <h3><span class="announcement-id">No.${listToUse.length - index}</span> ${announcement.title}</h3>
            <p class="author">작성자: ${announcement.author}</p>
            <p class="date">등록일시: ${announcement.date}</p>
            <div class="announcement-actions">
                <button class="view-button" data-id="${announcement.id}">보기</button>
                <button class="edit-button" data-id="${announcement.id}">수정</button>
                <button class="delete-button" data-id="${announcement.id}">삭제</button>
            </div>
        `;
        // 참고: .content는 상세 보기에서만 표시되므로 목록에서는 제외합니다.

        // '보기' 버튼에 이벤트 리스너를 추가합니다.
        const viewButton = announcementItem.querySelector('.view-button');
        viewButton.addEventListener('click', () => viewAnnouncement(announcement.id));

        // '수정' 버튼에 이벤트 리스너를 추가합니다.
        const editButton = announcementItem.querySelector('.edit-button');
        editButton.addEventListener('click', () => editAnnouncement(announcement.id));

        // '삭제' 버튼에 이벤트 리스너를 추가합니다.
        const deleteButton = announcementItem.querySelector('.delete-button');
        deleteButton.addEventListener('click', () => deleteAnnouncement(announcement.id));

        announcementsContainer.appendChild(announcementItem); // 만들어진 공지사항 요소를 컨테이너에 추가
    });
}

// -----------------------------------------------------------------------------
// 8. 공지사항 추가 또는 수정 처리 (saveAnnouncement 함수)
//    - '등록' 또는 '수정 완료' 버튼이 클릭되었을 때 실행되는 함수입니다.
//    - `editingAnnouncementId` 값에 따라 새로운 공지를 추가하거나 기존 공지를 수정합니다.
// -----------------------------------------------------------------------------
function saveAnnouncement() {
    const title = announcementTitleInput.value.trim(); // 입력된 제목 가져오기 (앞뒤 공백 제거)
    const content = announcementContentInput.value.trim(); // 입력된 내용 가져오기 (앞뒤 공백 제거)
    const author = announcementAuthorInput.value.trim(); // 입력된 작성자 가져오기 (앞뒤 공백 제거)

    // 입력값 유효성 검사 (제목과 내용이 비어있으면 경고 메시지 표시)
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해주세요.');
        return; // 함수 실행 중단
    }

    if (editingAnnouncementId) { // 수정 모드인 경우
        // 수정할 공지사항을 찾습니다.
        const announcementToUpdate = announcements.find(announcement => announcement.id === editingAnnouncementId);
        if (announcementToUpdate) {
            announcementToUpdate.title = title; // 제목 업데이트
            announcementToUpdate.content = content; // 내용 업데이트
            announcementToUpdate.author = author || '익명'; // 작성자 업데이트 (없으면 '익명')
            announcementToUpdate.date = formatDateTime(new Date()); // 수정된 날짜와 시간으로 업데이트
        }
        editingAnnouncementId = null; // 수정 모드 해제
        registerButton.textContent = '등록'; // 버튼 텍스트를 '등록'으로 변경
    } else { // 새로운 공지사항을 추가하는 모드인 경우
        // 새로운 공지사항 객체 생성
        const newAnnouncement = {
            id: Date.now(), // 고유한 ID 생성 (현재 시간을 밀리초로 사용)
            title: title,
            content: content,
            author: author || '익명', // 작성자가 없으면 '익명'으로 처리
            date: formatDateTime(new Date()) // 현재 날짜와 시간으로 등록일시 설정
        };
        // 최신 공지가 맨 위에 오도록 배열의 맨 앞에 추가합니다.
        announcements.unshift(newAnnouncement);
    }

    saveAnnouncements(); // 변경된 배열을 localStorage에 저장합니다.
    renderAnnouncements(); // 화면을 다시 그립니다. (전체 목록을 렌더링하고 검색 상태 초기화)
    searchInput.value = ''; // 검색 필드 초기화

    // 입력 필드를 초기화합니다.
    announcementTitleInput.value = '';
    announcementContentInput.value = '';
    announcementAuthorInput.value = '';

    // 공지 등록/수정 후 상세 보기 섹션으로 스크롤 이동
    announcementDetailView.scrollIntoView({ behavior: 'smooth' });
}

// -----------------------------------------------------------------------------
// 9. 공지사항 삭제하기
//    - 각 공지사항 옆의 '삭제' 버튼이 클릭되었을 때 실행되는 함수입니다.
// -----------------------------------------------------------------------------
function deleteAnnouncement(idToDelete) {
    // 삭제 확인 메시지
    if (confirm('정말 삭제하시겠습니까?')) {
        // `filter` 함수를 사용하여 삭제할 ID와 일치하지 않는 공지만을 남기고 새 배열을 만듭니다.
        announcements = announcements.filter(announcement => announcement.id !== idToDelete);
        saveAnnouncements(); // 변경된 배열을 localStorage에 저장합니다.
        renderAnnouncements(); // 화면을 다시 그립니다. (전체 목록을 렌더링하고 검색 상태 초기화)
        searchInput.value = ''; // 검색 필드 초기화
    }
}

// -----------------------------------------------------------------------------
// 10. 공지사항 상세 보기
//    - '보기' 버튼이 클릭되었을 때 실행되는 함수입니다.
//    - 선택된 공지의 전체 내용을 상세 보기 섹션에 표시합니다.
// -----------------------------------------------------------------------------
function viewAnnouncement(idToView) {
    // `find` 함수를 사용하여 클릭된 ID에 해당하는 공지사항을 찾습니다.
    const selectedAnnouncement = announcements.find(announcement => announcement.id === idToView);

    if (selectedAnnouncement) { // 해당 공지사항을 찾았다면
        // 상세 보기 컨테이너의 내용을 업데이트합니다.
        detailContent.innerHTML = `
            <h3>${selectedAnnouncement.title}</h3>
            <p class="author">작성자: ${selectedAnnouncement.author}</p>
            <p class="date">등록일시: ${selectedAnnouncement.date}</p>
            <div class="content">${selectedAnnouncement.content.replace(/\n/g, '<br>')}</div>
        `;
        // 상세 보기 섹션으로 부드럽게 스크롤합니다.
        announcementDetailView.scrollIntoView({ behavior: 'smooth' });
    } else {
        // 공지사항을 찾지 못했을 경우 메시지 표시
        detailContent.innerHTML = '<p>선택하신 공지사항을 찾을 수 없습니다.</p>';
    }
}

// -----------------------------------------------------------------------------
// 11. 공지사항 수정 모드 활성화 (editAnnouncement 함수)
//    - '수정' 버튼이 클릭되었을 때 실행되는 함수입니다.
//    - 선택된 공지의 내용을 입력 필드에 채우고 '등록' 버튼을 '수정 완료'로 변경합니다.
// -----------------------------------------------------------------------------
function editAnnouncement(idToEdit) {
    const announcementToEdit = announcements.find(announcement => announcement.id === idToEdit);

    if (announcementToEdit) {
        // 입력 필드에 선택된 공지의 내용을 채웁니다.
        announcementTitleInput.value = announcementToEdit.title;
        announcementContentInput.value = announcementToEdit.content;
        announcementAuthorInput.value = announcementToEdit.author;

        // 현재 수정 중인 공지사항의 ID를 저장합니다.
        editingAnnouncementId = idToEdit;
        // '등록' 버튼의 텍스트를 '수정 완료'로 변경합니다.
        registerButton.textContent = '수정 완료';

        // 입력 폼으로 스크롤하여 사용자가 바로 수정할 수 있도록 합니다.
        announcementTitleInput.scrollIntoView({ behavior: 'smooth' });
    }
}

// -----------------------------------------------------------------------------
// 12. 검색 기능 핸들러
//    - 검색 입력 필드의 내용이 변경될 때마다 실행됩니다.
//    - 제목에 검색어가 포함된 공지사항만 필터링하여 표시합니다.
// -----------------------------------------------------------------------------
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase(); // 검색어 가져오기 (소문자로 변환)

    if (searchTerm === '') { // 검색어가 없으면 전체 목록 표시
        renderAnnouncements(null);
    } else { // 검색어가 있으면 필터링된 목록 표시
        const filteredAnnouncements = announcements.filter(announcement =>
            announcement.title.toLowerCase().includes(searchTerm)
        );
        renderAnnouncements(filteredAnnouncements);
    }
}


// -----------------------------------------------------------------------------
// 13. 초기화 함수 (페이지 로드 시 처음 실행되는 함수)
//    - 모든 설정과 이벤트 리스너를 등록합니다.
// -----------------------------------------------------------------------------
function initializeApp() {
    loadAnnouncements(); // 저장된 공지사항을 불러옵니다.
    renderAnnouncements(); // 불러온 공지사항을 화면에 표시합니다.

    // '등록' 버튼에 클릭 이벤트 리스너를 추가합니다. (이제 saveAnnouncement 함수 호출)
    registerButton.addEventListener('click', saveAnnouncement);

    // 검색 입력 필드에 'input' 이벤트 리스너를 추가합니다.
    searchInput.addEventListener('input', handleSearch);
}

// -----------------------------------------------------------------------------
// 14. 앱 실행
//    - DOMContentLoaded 이벤트는 HTML 문서가 완전히 로드되고 파싱되었을 때 발생합니다.
//      이 시점에 `initializeApp` 함수를 호출하여 앱을 시작합니다.
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', initializeApp);
