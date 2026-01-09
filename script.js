// Link CSV từ Google Sheets của bạn
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvEX0bljJmHmyb-W3HqCV_sA2YUqhM_6W89q4ziPAk69n7F8DvbjWRxGTFW16CKkZx_EsFra8i-5kZ/pub?output=csv';

let recipeData = [];

// Tự động tải thư viện PapaParse nếu chưa có trong HTML
if (typeof Papa === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
    script.onload = () => initData();
    document.head.appendChild(script);
} else {
    initData();
}

async function initData() {
    const suggestionContainer = document.getElementById('suggestedIds');
    if(suggestionContainer) suggestionContainer.innerHTML = "<em>Đang đồng bộ dữ liệu...</em>";

    Papa.parse(SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // CHUẨN HÓA DỮ LIỆU: Tìm cột dựa trên từ khóa (không phân biệt hoa thường, khoảng trắng)
            recipeData = results.data.map(row => {
                const keys = Object.keys(row);
                const findValue = (keywords) => {
                    const key = keys.find(k => keywords.some(kw => k.toLowerCase().trim().includes(kw)));
                    return key ? row[key].trim() : "";
                };

                return {
                    id: findValue(["recipeid"]),
                    ingredient: findValue(["ingridient", "ingredient", "thành phần"]),
                    wt: findValue(["%wt", "tỷ lệ"]),
                    mass: findValue(["mass", "khối lượng"]),
                    purpose: findValue(["purpose", "mục đích"]),
                    product: findValue(["product", "sản phẩm"]),
                    info: findValue(["công bố thành phần", "thông tin", "info"])
                };
            }).filter(item => item.id && item.id !== "");

            renderSuggestions();
        }
    });
}

function renderSuggestions() {
    const uniqueIds = [...new Set(recipeData.map(item => item.id))];
    const suggestionContainer = document.getElementById('suggestedIds');
    if (!suggestionContainer) return;
    
    suggestionContainer.innerHTML = "Gợi ý ID: " + uniqueIds.map(id => 
        `<span class="id-tag" style="background:#e8f5e9; padding:4px 12px; margin:4px; border-radius:15px; cursor:pointer; border:1px solid #4caf50; display:inline-block; font-weight:500; color:#2e7d32;" onclick="fillAndSearch('${id}')">${id}</span>`
    ).join(' ');
}

function fillAndSearch(id) {
    document.getElementById('recipeInput').value = id;
    searchRecipe();
}

function handleKeyPress(event) {
    if (event.key === "Enter") searchRecipe();
}

function searchRecipe() {
    const input = document.getElementById('recipeInput').value.trim().toLowerCase();
    const resultArea = document.getElementById('resultArea');
    const tableBody = document.getElementById('recipeBody');
    
    // Lọc tất cả các dòng trùng mã ID
    const results = recipeData.filter(item => item.id.toLowerCase() === input);

    if (results.length > 0) {
        resultArea.style.display = 'block';
        tableBody.innerHTML = ''; 
        
        // SỬA LỖI N/A: Lấy tên sản phẩm từ dòng đầu tiên tìm thấy
        const productName = results[0].product || "Chưa xác định";
        const productInfo = results[0].info || "Không có thông tin công bố";

        document.getElementById('displayProductName').textContent = productName.toUpperCase();
        document.getElementById('displayAnnouncement').textContent = productInfo;

        results.forEach(item => {
            // Hiển thị đầy đủ nội dung cột Purpose (Mục đích)
            const row = `<tr>
                <td style="padding:15px; border-bottom:1px solid #eee;"><strong>${item.ingredient}</strong></td>
                <td style="padding:15px; border-bottom:1px solid #eee;">${item.wt || '-'}</td>
                <td style="padding:15px; border-bottom:1px solid #eee;">${item.mass || '-'}</td>
                <td style="padding:15px; border-bottom:1px solid #eee; color:#555;">${item.purpose}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        // Cuộn xuống kết quả để người dùng dễ nhìn
        resultArea.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert("Không tìm thấy mã Recipe ID: " + input);
    }
}
