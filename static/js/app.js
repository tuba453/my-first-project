// static/js/app.js (Tüm Form ve Butonları Destekleyen Son Sürüm)
document.addEventListener("DOMContentLoaded", function () {
    // --- TEMA DEĞİŞTİRME MANTIĞI ---
    const themeSwitcherButtons = document.querySelectorAll('[data-theme-value]');
    const htmlElement = document.documentElement;

    // Kaydedilmiş temayı uygula
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);

    // Aktif butonu işaretle
    document.querySelector(`[data-theme-value="${savedTheme}"]`)?.classList.add('active');

    themeSwitcherButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.getAttribute('data-theme-value');
            htmlElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);

            // Tüm butonlardan 'active' sınıfını kaldır ve sadece tıklanana ekle
            // DÜZELTME: 'btn-light' ve 'btn-dark' yerine 'active' sınıfını yönet
            themeSwitcherButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });

    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main");
    const contentArea = document.getElementById("mainContent");
    const searchContainer = document.getElementById('search-container');

    let currentView = "home";
    
    // YENİ: Etiketler için global dizi
    let selectedTags = [];

    // --- GENEL YARDIMCI FONKSİYONLAR ---

    function setActiveLink(linkId) {
        document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
        const activeLink = document.getElementById(linkId);
        if (activeLink) activeLink.classList.add("active");
    }

    function showToast(message, type = "primary") {
        const toastEl = document.getElementById("toast");
        const toastBody = document.getElementById("toast-body");
        if (!toastEl || !toastBody) {
            alert(message);
            return;
        }
        toastBody.textContent = message;
        toastEl.className = `toast align-items-center text-bg-${type} border-0`;
        const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl);
        bsToast.show();
    }

    // YENİ: Rozet kazanma bildirimi (hem toast hem de büyük modal/konfeti)
    function showBadgeToast(badge) {
        console.log("Attempting to show badge notification for:", badge.name); // Debugging line

        // 1. Konfeti animasyonu
        confetti({
            particleCount: 150,
            spread: 180,
            origin: { y: 0.6 }, // Ekranın ortasından yukarı doğru
            scalar: 1.2,
            startVelocity: 40,
            ticks: 300
        });

        // 2. Büyük rozet kazanma modalını göster
        const badgeModalEl = document.getElementById('badgeEarnedModal');
        if (badgeModalEl) {
            const badgeModal = new bootstrap.Modal(badgeModalEl);
            document.getElementById('badgeModalIcon').className = `bi ${badge.icon}`;
            document.getElementById('badgeModalName').textContent = badge.name;
            document.getElementById('badgeModalDescription').textContent = badge.description;
            badgeModal.show();
        }

        // 3. Sağ altta küçük toast bildirimi
        const toastBody = `🏆 Yeni Rozet Kazandın: **${badge.name}**!`;
        showToast(toastBody, "success");
    }

    // --- ARAMA FONKSİYONLARI ---

    // Arama çubuğunu göster/gizle
    function toggleSearchbar(show) {
        if (show) {
            searchContainer.classList.remove('d-none');
        } else {
            searchContainer.classList.add('d-none');
        }
    }

    // Arama filtreleme mantığı
    function filterContent() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        
        // Notları filtrele
        if (currentView.includes('note')) {
            const notes = document.querySelectorAll('.note-card');
            notes.forEach(note => {
                const title = note.querySelector('h5').textContent.toLowerCase();
                const content = note.querySelector('.note-preview-text').textContent.toLowerCase();
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    note.style.display = '';
                } else {
                    note.style.display = 'none';
                }
            });
        }
        // Görevleri filtrele
        else if (currentView.includes('task')) {
            const tasks = document.querySelectorAll('.task-item');
            tasks.forEach(task => {
                const title = task.querySelector('h5').textContent.toLowerCase();
                // Görevlerde sadece başlığa göre arama yapıyoruz.
                if (title.includes(searchTerm)) {
                    task.style.display = 'flex'; // flex, çünkü task-item'lar display:flex kullanıyor
                } else {
                    task.style.display = 'none';
                }
            });
        }
    }

    
    function toDateTimeLocalValue(dateStr) {
        if (!dateStr) return "";
        return dateStr.replace(" ", "T").slice(0, 16);
    }
    
    // --- SÜRÜKLE-BIRAK FONKSİYONU ---
    function initializeSortable() {
        // Sadece bekleyen görevlerin olduğu listeyi sürükle-bırak için seç
        const taskListEl = document.querySelector('.task-list:not(.completed-list)');
        if (taskListEl && typeof Sortable !== 'undefined') {
            new Sortable(taskListEl, {
                animation: 150,
                handle: '.task-item', // Tüm görev öğesini sürükle
                onEnd: async function (evt) {
                    const items = evt.to.children;
                    const task_ids = Array.from(items).map(item => item.dataset.id);

                    // Sunucuya yeni sıralamayı gönder
                    try {
                        const response = await fetch('/dashboard/update_task_order', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ task_ids: task_ids }),
                        });
                        const result = await response.json();
                        if (!result.success) {
                            showToast('Sıralama kaydedilemedi.', 'danger');
                        }
                    } catch (error) {
                        showToast('Sunucu bağlantı hatası.', 'danger');
                    }
                }
            });
        }
    }

    // Sidebar toggle
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            main.classList.toggle("collapsed");
        });
    }

    // --- HTML OLUŞTURUCULAR ---

    // 1. Notlar Istatistik Görünümü
    function createNotesGridHtml(notes) {
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>${currentView === 'starred_notes' ? '⭐ Yıldızlı Notlar' : 'Tüm Notlar'}</h3>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" id="btn-add-note">
                        <i class="bi bi-plus-lg me-1"></i> Yeni Not
                    </button>
                    ${notes.length > 0 ? `
                        <button class="btn btn-danger btn-sm" id="btn-delete-all-notes">
                            <i class="bi bi-trash-fill me-1"></i> Hepsini Sil
                        </button>
                    ` : ''}
                </div>
            </div>
            ${notes.length === 0 ? '<div class="alert alert-info">Henüz not yok.</div>' : ''}
        `;

        if (notes.length > 0) {
            html += '<div class="cards-grid">';
            notes.forEach(note => {
                const isStarred = note.starred;
                const noteContent = encodeURIComponent(note.content || ''); 
                
                // Etiketleri oluştur
                let tagsHtml = '';
                if (note.tags && note.tags.length > 0) {
                    tagsHtml = `<div class="note-tags">${note.tags.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}</div>`;
                }

                html += `
                    <div class="note-card shadow-sm" data-id="${note.id}">
                        <div class="note-card-header">
                            <h5>${note.title}</h5>
                            <div class="note-actions">
                                <button class="btn-task-action toggle-star" data-id="${note.id}" title="Yıldızla">
                                    <i class="bi ${isStarred ? 'bi-star-fill star-fill' : 'bi-star'}"></i>
                                </button>
                            </div>
                        </div>
                        <div class="note-preview-text">${note.content.replace(/<[^>]*>?/gm, '')}</div>
                        ${tagsHtml}
                        
                        <div class="note-footer d-flex justify-content-between align-items-center">
                             <button class="btn btn-outline-secondary btn-sm edit-note" data-id="${note.id}" 
                                     onclick="loadEditNoteForm(${note.id}, '${encodeURIComponent(note.title)}', '${noteContent}', '${encodeURIComponent(note.tags.join(', '))}')" title="Düzenle">
                                <i class="bi bi-pencil"></i> Düzenle
                            </button>
                            <small class="text-muted">Güncellendi: ${new Date(note.last_updated).toLocaleDateString()}</small>
                             <button class="btn-task-action delete-note delete" data-id="${note.id}" title="Sil">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        return html;
    }

    // 2. Görevler Liste Görünümü
    function createTasksListHtml(tasks, title, isCompletedView = false) {
        const waitingTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>${title}</h3>
                <div class="d-flex gap-2">
                ${!isCompletedView && currentView !== 'upcoming_tasks' && currentView !== 'starred_tasks' && !currentView.startsWith('tag_') ? `
                    <button class="btn btn-primary btn-sm" id="btn-add-task">
                        <i class="bi bi-plus-lg me-1"></i> Yeni Görev
                    </button>
                ` : ''}
                ${currentView === 'all_tasks' && (waitingTasks.length > 0 || completedTasks.length > 0) ? `
                    <button class="btn btn-danger btn-sm" id="btn-delete-all-tasks">
                        <i class="bi bi-trash-fill me-1"></i> Hepsini Sil
                    </button>
                ` : ''}
                </div>
            </div>
        `;
        
        // DÜZELTME: Eğer hiç görev yoksa, tek bir "boş durum" mesajı göster
        if (tasks.length === 0 && currentView === 'all_tasks') {
            html += `<div class="alert alert-info mt-4">Henüz hiç göreviniz yok. "Yeni Görev" butonuna tıklayarak başlayabilirsiniz.</div>`;
        } else {
            // Bekleyen Görevler
            if (waitingTasks.length > 0 && !isCompletedView) {
                html += `<h4 class="mb-3 text-muted">Bekleyenler (${waitingTasks.length})</h4><ul class="task-list" id="waiting-tasks-list">`;
                waitingTasks.forEach(task => { html += createTaskItemHtml(task); });
                html += `</ul>`;
            }
            // Tamamlanan Görevler
            if (completedTasks.length > 0 || isCompletedView) {
                html += `<h4 class="${!isCompletedView ? 'mt-4' : ''} mb-3 text-muted">Tamamlananlar (${completedTasks.length})</h4><ul class="task-list completed-list">`;
                completedTasks.forEach(task => { html += createTaskItemHtml(task); });
                html += `</ul>`;
            }
        }

        // HTML içeriği DOM'a eklendikten sonra sürükle-bırak özelliğini başlat
        setTimeout(initializeSortable, 0);

        return html;
    }

    function createTaskItemHtml(task) {
        const completedClass = task.completed ? 'completed' : '';
        const due_date = task.due_date ? new Date(task.due_date).toLocaleDateString() + " " + new Date(task.due_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : "Tarih Belirtilmedi";
        
        let actions = '';
        if (task.completed) {
            actions = `
                <button class="btn-task-action toggle-complete" data-id="${task.id}" title="Geri Al"><i class="bi bi-arrow-counterclockwise"></i></button>
                <button class="btn-task-action delete-task delete" data-id="${task.id}" title="Sil"><i class="bi bi-trash"></i></button>
            `;
        } else {
            actions = `
                <button class="btn-task-action toggle-star-task" data-id="${task.id}" title="Yıldızla">
                    <i class="bi ${task.starred ? 'bi-star-fill star-fill' : 'bi-star'}"></i>
                </button>
                <button class="btn-task-action edit-task" data-id="${task.id}" title="Düzenle"><i class="bi bi-pencil"></i></button>
                <button class="btn-task-action delete-task delete" data-id="${task.id}" title="Sil"><i class="bi bi-trash"></i></button>
                <button class="btn-task-action toggle-complete" data-id="${task.id}" title="Tamamla"><i class="bi bi-check-lg"></i></button>
            `;
        }

        return `
            <li class="task-item ${completedClass}" data-id="${task.id}" style="cursor: grab;">
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox toggle-complete" data-id="${task.id}" ${task.completed ? 'checked' : ''} title="Durumu Değiştir">
                    <div class="task-text-group">
                        <h5>${task.title}</h5>
                        <small>${due_date}</small>
                    </div>
                </div>
                <div class="task-actions">
                    ${actions}
                </div>
                ${task.tags && task.tags.length > 0 ? `
                    <div class="task-tags mt-2">
                        ${task.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </li>
        `;
    }

    // YENİ FONKSİYON: Etiketlenmiş içerik görünümü
    function createTagItemsHtml(data, tagName) {
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Etiket: <span class="badge bg-primary fs-5">#${tagName}</span></h3>
            </div>
        `;

        // Notlar bölümü
        if (data.notes.length > 0) {
            html += `<h4 class="mb-3 text-muted">Bu Etikete Sahip Notlar (${data.notes.length})</h4>`;
            html += '<div class="cards-grid">';
            data.notes.forEach(note => {
                // createNotesGridHtml içindeki mantığı burada yeniden kullanıyoruz
                const isStarred = note.starred;
                const noteContent = encodeURIComponent(note.content || '');
                let tagsHtml = `<div class="note-tags">${note.tags.map(tag => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}</div>`;

                html += `
                    <div class="note-card shadow-sm" data-id="${note.id}">
                        <div class="note-card-header">
                            <h5>${note.title}</h5>
                            <div class="note-actions">
                                <button class="btn-task-action toggle-star" data-id="${note.id}" title="Yıldızla">
                                    <i class="bi ${isStarred ? 'bi-star-fill star-fill' : 'bi-star'}"></i>
                                </button>
                            </div>
                        </div>
                        <div class="note-preview-text">${note.content.replace(/<[^>]*>?/gm, '')}</div>
                        ${tagsHtml}
                        <div class="note-footer d-flex justify-content-between align-items-center">
                             <button class="btn btn-outline-secondary btn-sm edit-note" data-id="${note.id}" 
                                     onclick="loadEditNoteForm(${note.id}, '${encodeURIComponent(note.title)}', '${noteContent}', '${encodeURIComponent(note.tags.join(', '))}')" title="Düzenle">
                                <i class="bi bi-pencil"></i> Düzenle
                            </button>
                            <small class="text-muted">Güncellendi: ${new Date(note.last_updated).toLocaleDateString()}</small>
                             <button class="btn-task-action delete-note delete" data-id="${note.id}" title="Sil">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>`;
            });
            html += '</div>';
        }

        // Görevler bölümü
        if (data.tasks.length > 0) {
            html += `<h4 class="mt-4 mb-3 text-muted">Bu Etikete Sahip Görevler (${data.tasks.length})</h4>`;
            // createTasksListHtml fonksiyonunu yeniden kullanmak yerine direkt listeyi oluşturuyoruz
            html += createTasksListHtml(data.tasks, '', false);
        }
        return html;
    }

    // --- FORM YÜKLEYİCİLER ---

    // Not Ekleme Formu
    function loadAddNoteForm() {
        currentView = "add_note";
        toggleSearchbar(false); // Arama çubuğunu gizle
        
        // CSRF token'ı al
        const csrfToken = document.querySelector('[name=csrf_token]')?.value || '';
        
        contentArea.innerHTML = `
            <div class="form-card shadow-lg">
                <h3 class="text-center mb-4">Yeni Not Ekle</h3>
                <form id="addNoteForm" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="${csrfToken}">
                    <div class="mb-3">
                        <label for="title" class="form-label">Başlık</label>
                        <input type="text" class="form-control" id="title" name="title" 
                               placeholder="Not Başlığı" required
                               minlength="2" maxlength="200">
                        <div class="invalid-feedback">Lütfen bir başlık girin (en az 2 karakter)</div>
                    </div>
                    <div class="mb-3">
                        <label for="content" class="form-label">İçerik</label>
                        <textarea class="form-control" id="content" name="content" 
                                  rows="6" placeholder="Notun içeriğini buraya girin..." 
                                  required minlength="5">
                        </textarea>
                        <div class="invalid-feedback">Not içeriği en az 5 karakter olmalıdır</div>
                    </div>
                    <div class="mb-3">
                        <label for="tags" class="form-label">Etiketler</label>
                        <div class="selected-tags mb-2"></div>
                        <div class="input-group">
                            <input type="text" class="form-control" id="tagInput" 
                                   placeholder="Etiket eklemek için yazın ve Enter'a basın">
                            <button class="btn btn-outline-secondary" type="button" id="addTagButton">
                                <i class="bi bi-plus-lg"></i> Ekle
                            </button>
                        </div>
                        <small class="form-text text-muted">Her etiket için Enter'a basın veya Ekle butonuna tıklayın</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center gap-2 mt-4">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="starred" name="starred">
                            <label class="form-check-label" for="starred">
                                <i class="bi bi-star-fill text-warning"></i> Yıldızlı
                            </label>
                        </div>
                        <div>
                            <button class="btn btn-secondary" type="button" onclick="loadAllNotes()">
                                <i class="bi bi-x-lg"></i> İptal
                            </button>
                            <button class="btn btn-primary" type="submit">
                                <i class="bi bi-check-lg"></i> Kaydet
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        // YENİ: Etiket ekleme mantığını burada bağlıyoruz
        const tagInput = document.getElementById('tagInput');
        const addTagButton = document.getElementById('addTagButton');
        const selectedTagsContainer = document.querySelector('.selected-tags');

        function addTag(tag) {
            tag = tag.trim().toLowerCase();
            if (tag && !selectedTags.includes(tag)) {
                selectedTags.push(tag);
                updateSelectedTagsDisplay();
            }
            tagInput.value = '';
        }

        function updateSelectedTagsDisplay() {
            selectedTagsContainer.innerHTML = '';
            selectedTags.forEach((tag, index) => {
                const tagEl = document.createElement('span');
                tagEl.className = 'badge bg-primary me-2 mb-2';
                tagEl.innerHTML = `
                    ${tag}
                    <button type="button" class="btn-close btn-close-white ms-1" 
                            aria-label="Close" data-index="${index}" 
                            style="font-size: 0.6em;"></button>
                `;
                selectedTagsContainer.appendChild(tagEl);
            });
        }

        // Etiket silme
        selectedTagsContainer.addEventListener('click', function(e) {
            if (e.target.matches('.btn-close')) {
                const index = parseInt(e.target.dataset.index, 10);
                selectedTags.splice(index, 1);
                updateSelectedTagsDisplay();
            }
        });

        // Butonla etiket ekleme
        addTagButton.addEventListener('click', function() {
            addTag(tagInput.value);
        });

        // Enter ile etiket ekleme
        tagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput.value);
            }
        });

        updateSelectedTagsDisplay(); // Başlangıçta boş haliyle göster
    }

    function destroyTinyMCE() {
        // TinyMCE kaldırıldığı için bu fonksiyon artık boş.
    }

    // Not Düzenleme Formu
window.loadEditNoteForm = function(noteId, title, content, tags) {
    currentView = "edit_note";
    toggleSearchbar(false); // Arama çubuğunu gizle
    const safeTitle = decodeURIComponent(title);
    const safeContent = decodeURIComponent(content);
    const tagsString = decodeURIComponent(tags || '');
    
    // HTML içeriği, not verileriyle doldurulur
    contentArea.innerHTML = `
        <div class="form-card shadow-lg">
            <h3 class="text-center">Notu Düzenle</h3>
            <form id="editNoteForm" data-id="${noteId}">
                <div class="mb-3">
                    <label for="title" class="form-label">Başlık</label>
                    <input class="form-control" id="title" name="title" value="${safeTitle}" required>
                </div>
                <div class="mb-3">
                    <label for="content" class="form-label">İçerik</label>
                    <textarea class="form-control" id="content" name="content" rows="6" required>${safeContent}</textarea>
                </div>
                <div class="mb-3">
                    <label for="tags" class="form-label">Etiketler (virgülle ayırın)</label>
                    <input type="text" class="form-control" id="tags" name="tags" value="${tagsString}" placeholder="iş, kişisel, önemli">
                </div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                    <button class="btn btn-primary" type="submit">Güncelle</button>
                    <button class="btn btn-secondary" type="button" onclick="loadAllNotes()">İptal</button>
                </div>
            </form>
        </div>
    `;
};
    // Görev Ekleme Formunu yükler
    function loadAddTaskForm() {
         currentView = "add_task";
         selectedTags = []; // Her form açıldığında etiketleri sıfırla
         toggleSearchbar(false); // Arama çubuğunu gizle
         contentArea.innerHTML = `
            <div class="form-card shadow-lg">
                <h3 class="text-center">Yeni Görev Ekle</h3>
                <form id="addTaskForm">
                    <div class="mb-3">
                        <label for="title" class="form-label">Başlık</label>
                        <input type="text" class="form-control" id="title" name="title" placeholder="Görevin başlığı" required minlength="2" maxlength="200">
                        <div class="invalid-feedback">Lütfen bir başlık girin (en az 2 karakter).</div>
                    </div>
                    <div class="mb-3">
                        <label for="content" class="form-label">Açıklama (İsteğe Bağlı)</label>
                        <textarea class="form-control" id="content" name="content" rows="4" placeholder="Görevle ilgili detaylar..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="due_date" class="form-label">Bitiş Zamanı</label>
                        <input type="datetime-local" class="form-control" name="due_date">
                    </div>
                    <div class="mb-3">
                        <label for="tags" class="form-label">Etiketler</label>
                        <div class="selected-tags mb-2"></div>
                        <div class="input-group">
                            <input type="text" class="form-control" id="tagInput" placeholder="Etiket eklemek için yazın ve Enter'a basın">
                            <button class="btn btn-outline-secondary" type="button" id="addTagButton"><i class="bi bi-plus-lg"></i> Ekle</button>
                        </div>
                        <small class="form-text text-muted">Her etiket için Enter'a basın veya Ekle butonuna tıklayın.</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center gap-2 mt-4">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="starred" name="starred">
                            <label class="form-check-label" for="starred">
                                <i class="bi bi-star-fill text-warning"></i> Yıldızlı
                            </label>
                        </div>
                        <div>
                            <button class="btn btn-secondary" type="button" id="btn-cancel-edit-task"><i class="bi bi-x-lg"></i> İptal</button>
                            <button class="btn btn-primary" type="submit"><i class="bi bi-check-lg"></i> Kaydet</button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        // Etiket ekleme mantığını buraya da ekliyoruz
        const tagInput = document.getElementById('tagInput');
        const addTagButton = document.getElementById('addTagButton');
        const selectedTagsContainer = document.querySelector('.selected-tags');

        function addTag(tag) {
            tag = tag.trim().toLowerCase();
            if (tag && !selectedTags.includes(tag)) {
                selectedTags.push(tag);
                updateSelectedTagsDisplay();
            }
            tagInput.value = '';
        }

        function updateSelectedTagsDisplay() {
            selectedTagsContainer.innerHTML = '';
            selectedTags.forEach((tag, index) => {
                const tagEl = document.createElement('span');
                tagEl.className = 'badge bg-primary me-2 mb-2';
                tagEl.innerHTML = `${tag} <button type="button" class="btn-close btn-close-white ms-1" aria-label="Close" data-index="${index}" style="font-size: 0.6em;"></button>`;
                selectedTagsContainer.appendChild(tagEl);
            });
        }

        selectedTagsContainer.addEventListener('click', function(e) {
            if (e.target.matches('.btn-close')) {
                const index = parseInt(e.target.dataset.index, 10);
                selectedTags.splice(index, 1);
                updateSelectedTagsDisplay();
            }
        });

        addTagButton.addEventListener('click', () => addTag(tagInput.value));

        tagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput.value);
            }
        });

        updateSelectedTagsDisplay();
    }

    // Görev Düzenleme Formu
    window.loadEditTaskForm = function(taskId, title, content, due_date, tags) {
        currentView = "edit_task";
        toggleSearchbar(false); // Arama çubuğunu gizle
        const safeTitle = decodeURIComponent(title);
        const safeContent = decodeURIComponent(content);
        const datetimeVal = toDateTimeLocalValue(due_date || "");
        const tagsString = decodeURIComponent(tags || '');

        contentArea.innerHTML = `
            <div class="form-card shadow-lg">
                <h3 class="text-center">Görevi Düzenle</h3>
                <form id="editTaskForm" data-id="${taskId}">
                    <div class="mb-3">
                        <label for="title" class="form-label">Başlık</label>
                        <input type="text" class="form-control" name="title" value="${safeTitle}" required>
                    </div>
                    <div class="mb-3">
                        <label for="content" class="form-label">İçerik</label>
                        <textarea class="form-control" name="content" rows="4">${safeContent}</textarea>
                    </div>
                    <div class="mb-3">
                        <label for="due_date" class="form-label">Görev Zamanı</label>
                        <input type="datetime-local" class="form-control" name="due_date" value="${datetimeVal}">
                    </div>
                    <div class="mb-3">
                        <label for="tags" class="form-label">Etiketler (virgülle ayırın)</label>
                        <input type="text" class="form-control" id="tags" name="tags" value="${tagsString}" placeholder="proje, toplantı, acil">
                    </div>
                    <div class="d-flex justify-content-end gap-2 mt-4">
                        <button class="btn btn-primary" type="submit"><i class="bi bi-check-lg"></i> Güncelle</button>
                        <button class="btn btn-secondary" type="button" id="btn-cancel-edit-task"><i class="bi bi-x-lg"></i> İptal</button>
                    </div>
                </form>
            </div>
        `;
    };

    // --- VERİ YÜKLEYİCİLER (Ana Navigasyon) ---

    async function loadAllNotes() {
        currentView = "all_notes";
        destroyTinyMCE(); // Önceki editörü temizle
        setActiveLink('link-all-notes');
        const response = await fetch("/dashboard/get_notes");
        // Global 'notes' değişkenini güncelle
        window.notes = await response.json();
        toggleSearchbar(notes.length > 0); // Not varsa arama çubuğunu göster
        contentArea.innerHTML = createNotesGridHtml(notes);
    }
    window.loadAllNotes = loadAllNotes;

    async function loadStarredNotes() {
        currentView = "starred_notes";
        destroyTinyMCE(); // Önceki editörü temizle
        setActiveLink('link-starred-notes');
        const response = await fetch("/dashboard/get_notes");
        window.notes = await response.json();
        const starred = notes.filter(n => n.starred);
        toggleSearchbar(starred.length > 0);
        contentArea.innerHTML = createNotesGridHtml(starred);
    }

    async function loadAllTasks() {
        currentView = "all_tasks";
        destroyTinyMCE(); // Önceki editörü temizle
        setActiveLink('link-all-tasks');
        const response = await fetch("/dashboard/all_tasks_data");
        // Global 'tasks' değişkenini güncelle
        window.tasks = await response.json();
        contentArea.innerHTML = createTasksListHtml(window.tasks, 'Tüm Görevlerim');
        toggleSearchbar(window.tasks.length > 0);
    }
    window.loadAllTasks = loadAllTasks;

    async function loadStarredTasks() {
        currentView = "starred_tasks";
        destroyTinyMCE(); // Önceki editörü temizle
        setActiveLink('link-starred-tasks');
        const response = await fetch("/dashboard/all_tasks_data");
        window.tasks = await response.json();
        const starred = window.tasks.filter(t => t.starred && !t.completed);
        toggleSearchbar(starred.length > 0);
        
        if (starred.length === 0) {
            contentArea.innerHTML = `<h3>⭐ Yıldızlı Görevler</h3><div class="alert alert-info mt-4">Henüz yıldızlı bir göreviniz yok.</div>`;
        } else {
            contentArea.innerHTML = createTasksListHtml(starred, '⭐ Yıldızlı Görevler', false);
        }
    }

    async function loadCompletedTasks() {
        currentView = "completed_tasks";
        destroyTinyMCE(); // Önceki editörü temizle
        setActiveLink('link-completed-tasks');
        const response = await fetch("/dashboard/all_tasks_data");
        window.tasks = await response.json();
        const completed = window.tasks.filter(t => t.completed);
        toggleSearchbar(completed.length > 0);
        contentArea.innerHTML = createTasksListHtml(completed, 'Tamamlanan Görevler', true);
    }
    
    async function loadUpcomingTasks() {
        currentView = "upcoming_tasks";
        destroyTinyMCE(); // Önceki editörü temizle
        setActiveLink('link-upcoming-tasks');
        const response = await fetch("/dashboard/upcoming_tasks");
        const tasks = await response.json();
        window.tasks = tasks; // Global tasks'ı güncelle
        toggleSearchbar(tasks.length > 0);
        let html = ``;
        if (tasks.length === 0) {
            html += `<h3>Zamanı Yaklaşan Görevler</h3><div class="alert alert-info mt-4">Yakın zamanda vadesi dolacak görev yok.</div>`;
        } else {
            html += createTasksListHtml(tasks, 'Zamanı Yaklaşan Görevler', false); // Liste oluşturucu kullanıldı
        }
        contentArea.innerHTML = html;
    }

    async function loadOverdueTasks() {
        currentView = "overdue_tasks";
        destroyTinyMCE(); // Önceki editörü temizle
        setActiveLink('link-overdue-tasks');
        const response = await fetch("/dashboard/overdue_tasks");
        const tasks = await response.json();
        window.tasks = tasks; // Global tasks'ı güncelle
        toggleSearchbar(tasks.length > 0);
        
        if (tasks.length === 0) {
            contentArea.innerHTML = `<h3>⌛ Gecikmiş Görevler</h3><div class="alert alert-info mt-4">Gecikmiş göreviniz bulunmuyor.</div>`;
        } else {
            const html = createTasksListHtml(tasks, '⌛ Gecikmiş Görevler', false);
            contentArea.innerHTML = html;
        }
    }

    // YENİ: Etiketleri Sidebar'a yükler
    async function loadTags() {
        const tagsContainer = document.getElementById('tags-list-container');
        if (!tagsContainer) return;

        const response = await fetch("/dashboard/get_tags");
        const tags = await response.json();

        tagsContainer.innerHTML = ''; // Konteyneri temizle
        if (tags.length === 0) {
            tagsContainer.innerHTML = '<span class="nav-link text-muted small">Henüz etiket yok.</span>';
        } else {
            tags.forEach(tag => {
                const tagLink = document.createElement('a');
                tagLink.className = 'nav-item nav-link';
                tagLink.href = '#';
                tagLink.id = `link-tag-${tag.id}`;
                tagLink.dataset.tagId = tag.id;
                tagLink.innerHTML = `<i class="bi bi-hash"></i> <span class="sidebar-text">${tag.name}</span>`;
                tagsContainer.appendChild(tagLink);
            });
        }
    }



async function loadUserStats() {
    const statsArea = document.getElementById('user-stats-area');
    if (statsArea) {
        try {
            const response = await fetch('/dashboard/user_stats_html'); 
            if (response.ok) {
                const html = await response.text();
                statsArea.innerHTML = html;
            } else {
                statsArea.innerHTML = '<div class="text-center text-danger py-3"><i class="bi bi-x-circle me-1"></i> Veri yüklenemedi.</div>';
                console.error('İstatistik yükleme hatası:', response.status, response.statusText);
            }
        } catch (error) {
            statsArea.innerHTML = '<div class="text-center text-danger py-3">Bağlantı hatası.</div>';
            console.error('AJAX hatası:', error);
        }
    }
}

    // Ayarlar Formunu yükler
    async function loadSettingsForm() {
    currentView = "settings";
    setActiveLink('link-settings');
    toggleSearchbar(false); // Ayarlar sayfasında arama çubuğunu gizle
    const contentArea = document.getElementById("mainContent");
    if (!contentArea) return; 

    // 1. Ayarlar sayfasının içeriğini sunucudan çek ve yükle
    const response = await fetch("/dashboard/settings");
    const html = await response.text();
    contentArea.innerHTML = html;
    
    // 2. YENİ: Yüklenen içeriğin üzerindeki butonları ve formları dinle
    
    // a. Şifre Değiştirme Butonu (link-change-password)
    const changePassBtn = document.getElementById('link-change-password');
    if (changePassBtn) {
        changePassBtn.addEventListener('click', loadChangePasswordForm);
    }

    // b. Hesap Silme Butonu (btn-show-delete-form)
    const deleteAccountBtn = document.getElementById('btn-show-delete-form');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', loadDeleteAccountForm);
    }

    // c. Kullanıcı Bilgileri Kaydet Formu (settingsForm)
    const userSettingsForm = document.getElementById('settingsForm'); // Buraya ID'yi doğru aldık
    if (userSettingsForm) {
        userSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const res = await fetch('/dashboard/update_settings', { method: 'POST', body: formData });
            const result = await res.json();
            
            showToast(result.message, result.success ? "success" : "danger");
            if (result.success) loadSettingsForm();
        });
    }
}

// Hesap Silme Onay Formunu yükler (İptal Butonu Mantığı)
function loadDeleteAccountForm() {
    currentView = "delete_account";
    toggleSearchbar(false);
    const contentArea = document.getElementById("mainContent");
    if (!contentArea) return; 

    // Şifre onay formunun HTML'i
    contentArea.innerHTML = `
        <div class="card p-4 shadow-lg mx-auto" style="max-width: 400px; margin-top: 50px;">
            <h3 class="text-center mb-4 text-danger">Hesabınızı Kapatın</h3>
            <p class="text-muted text-center">Hesabınızı kalıcı olarak kapatmak üzeresiniz. Bu işlem geri alınamaz.</p>
            <form id="deleteAccountFormWithPassword">
                <div class="mb-3">
                    <label for="delete_password" class="form-label">Onay İçin Şifrenizi Girin</label>
                    <input type="password" name="password" id="delete_password" class="form-control" required>
                </div>
                <div id="delete-feedback" class="mt-2 mb-3"></div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                    <button class="btn btn-secondary" type="button" id="btn-cancel-delete">İptal</button> 
                    <button class="btn btn-danger" type="submit">Hesabımı Kalıcı Sil</button>
                </div>
            </form>
        </div>
    `;
}
    
    // Şifre Değiştirme Formunu yükler
    function loadChangePasswordForm() {
        currentView = "change_password";
        toggleSearchbar(false);
        contentArea.innerHTML = `
            <div class="form-card shadow-lg">
                <h3 class="text-center mb-4">🔑 Şifre Değiştir</h3>
                <form id="changePasswordForm">
                    <div class="mb-3">
                        <label for="current_password" class="form-label">Mevcut Şifre</label>
                        <input type="password" name="current_password" id="current_password" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label for="new_password" class="form-label">Yeni Şifre</label>
                        <input type="password" name="new_password" id="new_password" class="form-control" required>
                    </div>
                    <div class="mb-4">
                        <label for="confirm_password" class="form-label">Yeni Şifre (Tekrar)</label>
                        <input type="password" name="confirm_password" id="confirm_password" class="form-control" required>
                    </div>
                    <div id="password-feedback"></div>
                    <div class="d-flex justify-content-end gap-2 mt-4">
                        <button class="btn btn-primary" type="submit">Şifreyi Güncelle</button>
                        <button class="btn btn-secondary" type="button" onclick="loadSettingsForm()">İptal</button>
                    </div>
                </form>
            </div>
        `;
        const cancelBtn = document.getElementById('btn-cancel-change-password');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.loadSettingsForm();
        });
    }
    window.loadSettingsForm = loadSettingsForm;
    }

    // YENİ: Rozetler sayfasını yükler
    async function loadBadgesPage() {
        currentView = "badges";
        setActiveLink('link-badges'); // Menüde aktif linki ayarlar
        toggleSearchbar(false);
        const contentArea = document.getElementById("mainContent");
        if (!contentArea) return;

        const response = await fetch("/dashboard/badges");
        const html = await response.text();
        contentArea.innerHTML = html;
        showAssistantMessage("Kazandığın ve kazanabileceğin tüm rozetleri buradan görebilirsin. Başarılarının devamını dilerim!");
    }

    // YENİ: Avatarlar sayfasını yükler
    async function loadAvatarsPage() {
        currentView = "avatars";
        setActiveLink('link-avatars');
        toggleSearchbar(false);
        const contentArea = document.getElementById("mainContent");
        if (!contentArea) return;

        const response = await fetch("/dashboard/avatars");
        const html = await response.text();
        contentArea.innerHTML = html;
        showAssistantMessage("Profilini kişiselleştirmek için buradan bir avatar seçebilirsin.");

        // Avatar seçimi için olay dinleyicisini buraya taşıdık
        const avatarGrid = document.getElementById('avatar-selection-grid');
        if (avatarGrid) {
            avatarGrid.addEventListener('click', async function(e) {
                const avatarDiv = e.target.closest('.avatar-option');
                if (!avatarDiv) return;

                // Önceki seçimi kaldır, yenisini ekle
                document.querySelectorAll('.avatar-option.selected').forEach(el => el.classList.remove('selected'));
                avatarDiv.classList.add('selected');

                const avatarFilename = avatarDiv.dataset.filename;
                const formData = new FormData();
                formData.append('avatar', avatarFilename);

                const res = await fetch('/dashboard/update_avatar', { method: 'POST', body: formData });
                const result = await res.json();

                showToast(result.message, result.success ? "success" : "danger");
                if (result.success) {
                    // DÜZELTME: Avatarı anında güncellemek için HTML'i yeniden oluştur
                    const newAvatarHtml = `<img src="${result.new_avatar_url}" alt="Avatar" class="rounded-circle w-100 h-100" style="object-fit: cover;">`;
                    
                    // Üst çubuktaki avatarı güncelle
                    const topbarAvatarContainer = document.getElementById('user-avatar-container');
                    if (topbarAvatarContainer) topbarAvatarContainer.innerHTML = newAvatarHtml;

                    // Açılır menüdeki avatarı güncelle
                    const dropdownAvatarContainer = document.querySelector('.dropdown-menu .user-icon');
                    if (dropdownAvatarContainer) dropdownAvatarContainer.innerHTML = newAvatarHtml;
                }
            });
        }
    }

    // --- TIKLAMA VE FORM GÖNDERİM İŞLEMLERİ (Delegasyon) ---

    // 1. Sidebar Navigasyonu
    document.querySelectorAll("#main-nav .nav-link").forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const linkId = this.id;
            
            setActiveLink(linkId);

            if (linkId === 'link-all-notes') {
                loadAllNotes();
                showAssistantMessage("Tüm notlarını burada görebilirsin. Kartlara tıklayarak detayları düzenleyebilirsin.");
            } else if (linkId === 'link-starred-notes') {
                loadStarredNotes();
                showAssistantMessage("Önemli olarak işaretlediğin yıldızlı notların burada listelenir.");
            } else if (linkId === 'link-add-note') {
                loadAddNoteForm();
                showAssistantMessage("Yeni bir not eklemek için bu formu doldurman yeterli.");
            } else if (linkId === 'link-all-tasks') {
                loadAllTasks();
                showAssistantMessage("Tüm görevlerin burada. Sürükleyip bırakarak sıralamayı değiştirebilirsin.");
            } else if (linkId === 'link-starred-tasks') {
                loadStarredTasks();
                showAssistantMessage("Yıldızla işaretlediğin önemli görevlerin burada.");
            } else if (linkId === 'link-completed-tasks') {
                loadCompletedTasks();
                showAssistantMessage("Başarıyla tamamladığın tüm görevleri burada görebilirsin. Harika iş!");
            } else if (linkId === 'link-upcoming-tasks') {
                loadUpcomingTasks();
                showAssistantMessage("Önümüzdeki 24 saat içinde vadesi dolacak görevlerini buradan takip et.");
            } else if (linkId === 'link-overdue-tasks') {
                loadOverdueTasks();
                showAssistantMessage("Vadesi geçmiş görevlerin! Bunları tamamlamanın zamanı gelmiş.");
            } else if (linkId === 'link-add-task') {
                loadAddTaskForm();
                showAssistantMessage("Yeni bir görev oluşturmak için başlık ve bitiş tarihi ekleyebilirsin.");
            }
        });
    });

    // 2. Dinamik İçerik Aksiyonları
    document.addEventListener("click", async (e) => {
        // YAKALAYICI GÜNCELLENDİ: Eksik olan .delete-note seçicisi eklendi.
        const target = e.target.closest(".btn-task-action, .toggle-complete, .delete-task, .delete-note, .edit-note, .edit-task, .toggle-star, .toggle-star-task, #btn-add-note, #btn-add-task, #btn-delete-all-tasks, #btn-delete-all-notes, #btn-cancel-delete, #btn-cancel-edit-note, #btn-cancel-edit-task, #logout-link, #link-settings, #link-badges, #link-avatars, #tags-list-container .nav-link");
        if (!target) return; // Eğer tıklanan eleman veya üst elemanlarından biri seçicilerle eşleşmiyorsa, devam etme.
        
        const taskId = target.dataset.id;
        const noteId = target.dataset.id;

        // Eğer tıklanan link Ayarlar linkiyse
        if (target.id === 'link-settings') {
            e.preventDefault(); // Varsayılan link davranışını durdur
            loadSettingsForm(); // Ayarlar sayfasını AJAX ile yükle
            showAssistantMessage("Hesap bilgilerini, şifreni buradan güncelleyebilir veya hesabını silebilirsin.");
            // Sidebar linklerinin aktifliğini kaldırmak için:
            document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
            return;
        }

        // YENİ: Eğer tıklanan link Rozetler linkiyse
        if (target.id === 'link-badges') {
            e.preventDefault();
            loadBadgesPage();
            // Diğer sidebar linklerinin aktifliğini kaldır
            document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
            return; // İşlemi burada bitir
        }

        // YENİ: Eğer tıklanan link Avatarlar linkiyse
        if (target.id === 'link-avatars') {
            e.preventDefault();
            loadAvatarsPage();
            document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
            return;
        }

        // Eğer tıklanan link çıkış linkiyse
        if (target.id === 'logout-link') {
            e.preventDefault(); // Varsayılan link davranışını durdur
        
        // Kullanıcıya onay sorusu sor
            if (confirm("Çıkış yapmak istediğinizden emin misiniz? Tüm oturumunuz sonlandırılacaktır.")) {
            // Kullanıcı 'Tamam' derse, çıkış rotasına yönlendir
                window.location.href = target.href;
            }
        }

        // Not Aksiyonları
        if (target.classList.contains("delete-note")) {
             if (confirm("Bu notu silmek istediğinizden emin misiniz?")) {
                const res = await fetch(`/dashboard/delete_note/${noteId}`, { method: "DELETE" });
                const result = await res.json();
                showToast(result.message, result.success ? "info" : "danger");
                if (result.success) {
                    currentView === 'starred_notes' ? loadStarredNotes() : loadAllNotes();
                    loadTags(); // Etiket listesini güncelle
                }
            }
        } else if (target.classList.contains("toggle-star")) {
             const res = await fetch(`/dashboard/toggle_star/${noteId}`, { method: "POST" });
             const result = await res.json();
             showToast(result.message, result.success ? "success" : "info");
             if (result.success) {
                currentView === 'starred_notes' ? loadStarredNotes() : loadAllNotes();
             }
        } else if (target.id === "btn-add-note") {
             loadAddNoteForm();
             setActiveLink('link-add-note');
        } 

        // Görev Aksiyonları
        else if (target.classList.contains("delete-task") && target.tagName === 'BUTTON') {
             if (confirm("Bu görevi silmek istediğinizden emin misiniz?")) {
                const res = await fetch(`/dashboard/delete_task/${taskId}`, { method: "DELETE" });
                const result = await res.json();
                showToast(result.message, result.success ? "info" : "danger");
                if (result.success) {
                    currentView === 'completed_tasks' ? loadCompletedTasks() : loadAllTasks();
                    loadTags(); // Etiket listesini güncelle
                }
            }
        } else if (target.classList.contains("toggle-complete")) {
            const res = await fetch(`/dashboard/toggle_complete/${taskId}`, { method: "POST" });
            const result = await res.json();
            showToast(result.message, result.success ? "success" : "info");
            if (result.success) {
                // YENİ: Görev tamamlandığında konfeti animasyonu
                if (result.completed && typeof confetti === 'function') {
                    const rect = target.getBoundingClientRect();
                    const origin = {
                        x: (rect.left + rect.width / 2) / window.innerWidth,
                        y: (rect.top + rect.height / 2) / window.innerHeight
                    };
                    confetti({
                        origin: origin,
                        particleCount: 100,
                        spread: 70,
                        ticks: 200
                    });
                }
                currentView === 'completed_tasks' ? loadCompletedTasks() : loadAllTasks();
            }
        } else if (target.classList.contains("edit-task")) {
             const taskItem = target.closest(".task-item");
             const taskId = taskItem.dataset.id;
             const task = window.tasks.find(t => t.id == taskId);
             if (task) {
                window.loadEditTaskForm(taskId, encodeURIComponent(task.title), encodeURIComponent(task.content), task.due_date, encodeURIComponent(task.tags.join(', ')));
             }
        } else if (target.classList.contains("toggle-star-task")) {
             const res = await fetch(`/dashboard/toggle_task_star/${taskId}`, { method: "POST" });
             const result = await res.json();
             showToast(result.message, result.success ? "success" : "info");
             if (result.success) {
                currentView === 'completed_tasks' ? loadCompletedTasks() : loadAllTasks();
             }
        } else if (target.id === "btn-add-task") {
             loadAddTaskForm();
             setActiveLink('link-add-task');
        } 
        
        // Hepsini Sil Butonu Aksiyonu (GÖREVLER)
        else if (target.id === 'btn-delete-all-tasks') {
             if (confirm("UYARI! Tüm görevleri (tamamlanmış ve bekleyen) kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
                 const res = await fetch("/dashboard/delete_all_tasks", { method: "POST" });
                 const result = await res.json();
                 showToast(result.message, result.success ? "success" : "danger");
                 if (result.success) {
                    loadAllTasks();
                    loadTags(); // Etiket listesini güncelle
                 }
             }
         }
        
        // Hepsini Sil Butonu Aksiyonu (NOTLAR)
        else if (target.id === 'btn-delete-all-notes') {
             if (confirm("UYARI! Tüm notları kalıcı olarak silmek istediğinizden emin misiniz?")) {
                 const res = await fetch("/dashboard/delete_all_notes", { method: "POST" });
                 const result = await res.json();
                 showToast(result.message, result.success ? "success" : "danger");
                 if (result.success) {
                    loadAllNotes();
                    loadTags(); // Etiket listesini güncelle
                 }
             }
         }

        // YENİ AKSİYON: İptal Butonları
        if (target.id === 'btn-cancel-delete') { loadSettingsForm(); return; }
        if (target.id === 'btn-cancel-edit-note') { loadAllNotes(); return; }
        if (target.id === 'btn-cancel-edit-task') { loadAllTasks(); return; }


        // YENİ AKSİYON: Etiket linkine tıklama
        if (target.matches('#tags-list-container .nav-link')) {
            e.preventDefault();
            const tagId = target.dataset.tagId;
            const tagName = target.querySelector('.sidebar-text').textContent;
            
            setActiveLink(target.id); // Tıklanan etiketi aktif yap
            currentView = `tag_${tagId}`;
            toggleSearchbar(false);

            const response = await fetch(`/dashboard/get_items_by_tag/${tagId}`);
            const data = await response.json();
            contentArea.innerHTML = createTagItemsHtml(data, tagName);
            showAssistantMessage(`'#${tagName}' etiketine sahip tüm not ve görevlerin listeleniyor.`);
        }
    });

    // 3. Form Gönderimleri
    document.addEventListener('submit', async function(e) {
        const targetId = e.target.id;
        
        // TÜM formları burada yönetiyoruz.
        if (['addNoteForm', 'editNoteForm', 'addTaskForm', 'editTaskForm', 'settingsForm', 'changePasswordForm'].includes(targetId)) {
            e.preventDefault();
            
            // Form doğrulama
            if (!e.target.checkValidity()) {
                e.stopPropagation();
                e.target.classList.add('was-validated');
                showToast('Lütfen tüm zorunlu alanları doldurun.', 'warning');
                return;
            }
            
            // Loading durumunu göster
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn?.innerHTML || 'Kaydet';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Kaydediliyor...';
            }
            
            let url = '';
            let isSettings = false;
            let isPasswordChange = false;
            
            if (targetId === 'addNoteForm') url = "/dashboard/add_note";
            else if (targetId === 'editNoteForm') url = `/dashboard/update_note/${e.target.dataset.id}`;
            else if (targetId === 'addTaskForm') url = "/dashboard/add_task";
            else if (targetId === 'editTaskForm') url = `/dashboard/update_task/${e.target.dataset.id}`;
            else if (targetId === 'settingsForm') { url = '/dashboard/update_settings'; isSettings = true; }
            else if (targetId === 'changePasswordForm') { url = '/dashboard/change_password'; isPasswordChange = true; }

            try {
                const formData = new FormData(e.target);
                
                // Eğer not formu ise ve seçili etiketler varsa ekle
                // 'addNoteForm' için 'tags' inputunu temizle ve 'selectedTags' dizisini kullan
                if (targetId === 'addNoteForm' || targetId === 'addTaskForm') {
                    formData.delete('tags'); // Formdaki boş etiketi sil
                    formData.append('tags', selectedTags.join(','));
                } else if (targetId === 'editNoteForm' || targetId === 'editTaskForm') {
                    selectedTags.forEach(tag => formData.append('tags[]', tag));
                }
                
                // CSRF token ekle
                const csrfToken = document.querySelector('[name=csrf_token]')?.value;
                const headers = new Headers();
                if (csrfToken) {
                    headers.append('X-CSRFToken', csrfToken);
                }
                
                const res = await fetch(url, { 
                    method: 'POST',
                    headers: headers,
                    body: formData 
                });
                
                if (!res.ok) {
                    throw new Error('Sunucu yanıt vermedi. Lütfen tekrar deneyin.');
                }
                
                const result = await res.json();
                
                // Rozet kontrolü
                if (result.new_badges && result.new_badges.length > 0) {
                    result.new_badges.forEach(badge => showBadgeToast(badge));
                }

                if (isPasswordChange) {
                    const feedback = document.getElementById("password-feedback");
                    if (feedback) {
                        feedback.innerHTML = `<div class="alert alert-${result.success ? 'success' : 'danger'}">${result.message}</div>`;
                    }
                    if (result.success && result.redirect_logout) {
                        setTimeout(() => window.location.href = "/auth/logout", 1500);
                    }
                } else {
                    showToast(result.message, result.success ? "success" : "danger");
                    if (result.success) {
                        // Başarılı işlem sonrası yenileme
                        if (targetId.includes('Note')) {
                            loadAllNotes();
                            loadTags();
                            // Not formlarını sıfırla
                            if (targetId === 'addNoteForm') {
                                e.target.reset();
                                selectedTags = [];
                                updateSelectedTagsDisplay();
                            }
                        }
                        else if (targetId.includes('Task')) {
                            loadAllTasks();
                            loadTags();
                        }
                        else if (isSettings) { 
                            loadSettingsForm(); 
                        }
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                showToast(error.message || 'Bir hata oluştu', 'error');
            } finally {
                // Loading durumunu kaldır
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        } else if (e.target.id === 'deleteAccountFormWithPassword') {
            e.preventDefault();
            const formData = new FormData(e.target);
            const feedback = document.getElementById("delete-feedback");
            
            try {
                const res = await fetch('/auth/delete_account_with_password', { 
                    method: 'POST', 
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrf_token]')?.value
                    },
                    body: formData 
                });
                
                if (!res.ok) {
                    throw new Error('Sunucu yanıt vermedi. Lütfen tekrar deneyin.');
                }
                
                const result = await res.json();
                
                if (result.success) {
                    if (feedback) {
                        feedback.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    }
                    setTimeout(() => { window.location.href = "/auth/account_deleted_page"; }, 1000);
                } else {
                    if (feedback) {
                        feedback.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (feedback) {
                    feedback.innerHTML = `<div class="alert alert-danger">İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.</div>`;
                }
            }
        }
    });
    
    // Arama çubuğu için olay dinleyici
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterContent);
    }

    // YENİ: İstatistikleri yüklemek için olay dinleyicisini buraya taşıdık.
    const userIconDropdown = document.querySelector('.user-icon')?.closest('.dropdown');
    if (userIconDropdown) {
        userIconDropdown.addEventListener('show.bs.dropdown', function () {
            // Dropdown açılmadan hemen önce istatistikleri yükle
            loadUserStats();
        });
    }

    // --- YENİ: Rozet Modalı için Gelişmiş Efektler ---
    const badgeModalEl = document.getElementById('badgeEarnedModal');
    if (badgeModalEl) {
        const mainContent = document.querySelector('.main');
        // Modal gösterildiğinde arka planı bulanıklaştır
        badgeModalEl.addEventListener('show.bs.modal', function () {
            if (mainContent) mainContent.classList.add('content-blur');
        });
        // Modal gizlendiğinde bulanıklığı kaldır
        badgeModalEl.addEventListener('hide.bs.modal', function () {
            if (mainContent) mainContent.classList.remove('content-blur');
        });
    }

    // --- BAŞLANGIÇ İŞLEMLERİ ---
    loadAllNotes();
    setActiveLink('link-all-notes');
    loadTags(); // Sayfa yüklendiğinde etiketleri de yükle
    
    // Zamanı yaklaşan görevleri kontrol et (Hatırlatıcı)
    function checkUpcomingTasks() {
        fetch("/dashboard/upcoming_tasks")
            .then(res => res.json())
            .then(tasks => {
                if (tasks && tasks.length > 0) {
                    const message = `🔔 ${tasks.length} adet yakın zamanda vadesi dolacak göreviniz var!`;
                    showToast(message, "warning");
                }
            })
            .catch(err => console.error("Hatırlatma hatası:", err));
    }

    checkUpcomingTasks();
    setInterval(checkUpcomingTasks, 15 * 60 * 1000); // Her 15 dakikada bir kontrol et


// YENİ EKLEME: Hesap Silme Onay Formunu yükler
function loadDeleteAccountForm() {
    currentView = "delete_account";
    const contentArea = document.getElementById("mainContent");
    if (!contentArea) return; 

    // Şifre onay formunun HTML'i
    // İptal butonu loadSettingsForm() fonksiyonunu çağırır.
    contentArea.innerHTML = `
        <div class="card p-4 shadow-lg mx-auto" style="max-width: 400px; margin-top: 50px;">
            <h3 class="text-center mb-4 text-danger">Hesabınızı Kapatın</h3>
            <p class="text-muted text-center">Hesabınızı kalıcı olarak kapatmak üzeresiniz. Bu işlem geri alınamaz.</p>
            <form id="deleteAccountFormWithPassword">
                <div class="mb-3">
                    <label for="delete_password" class="form-label">Onay İçin Şifrenizi Girin</label>
                    <input type="password" name="password" id="delete_password" class="form-control" required>
                </div>
                <div id="delete-feedback" class="mt-2 mb-3"></div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                    <button class="btn btn-secondary" type="button" id="btn-cancel-delete">İptal</button>
                    <button class="btn btn-danger" type="submit">Hesabımı Kalıcı Sil</button>
                </div>
            </form>
        </div>
    `;
}


// loadSettingsForm fonksiyonunu **tam** haliyle güncelle
async function loadSettingsForm() {
    // 1. Durumu ve menü linkini ayarla
    currentView = "settings";
    setActiveLink('link-settings');
    const contentArea = document.getElementById("mainContent");
    if (!contentArea) return; 

    // 2. Ayarlar sayfasının içeriğini sunucudan çek ve yükle
    const response = await fetch("/dashboard/settings");
    const html = await response.text();
    contentArea.innerHTML = html;
    
    // 3. YENİ: Şifre Değiştirme Butonu Dinleyicisi
    const changePassBtn = document.getElementById('link-change-password');
    if (changePassBtn) {
        // Bu fonksiyonun (loadChangePasswordForm) tanımlı olduğundan emin olun
        changePassBtn.addEventListener('click', loadChangePasswordForm); 
    }

    // 4. YENİ: Hesap Silme Butonuna aksiyon ekle
    const deleteAccountBtn = document.getElementById('btn-show-delete-form');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', loadDeleteAccountForm);
    }

    // 5. YENİ: Kullanıcı Ayarları Formunu dinle (username/email güncelleme)
    const userSettingsForm = document.getElementById('userSettingsForm');
    if (userSettingsForm) {
        userSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            // update_settings rotasına AJAX isteği
            const res = await fetch('/dashboard/update_settings', { method: 'POST', body: formData });
            const result = await res.json();
            
            showToast(result.message, result.success ? "success" : "danger");
            // Başarılı olursa formu yenile
            if (result.success) loadSettingsForm();
        });
    }
}

    // YENİ: Motivasyon modalını göster
    const welcomeModalElement = document.getElementById('welcomeModal');
    if (welcomeModalElement) {
        const welcomeModal = new bootstrap.Modal(welcomeModalElement);
        welcomeModal.show();
    }

    // --- YENİ: AI Asistanı Mantığı ---
    const assistantBubble = document.getElementById('assistant-bubble');
    const assistantMessage = document.getElementById('assistant-message');
    let assistantTimeout;

    function showAssistantMessage(message, duration = 5000) {
        if (!assistantBubble || !assistantMessage) return;

        clearTimeout(assistantTimeout); // Önceki zamanlayıcıyı temizle
        assistantMessage.textContent = message;
        assistantBubble.classList.add('show');

        assistantTimeout = setTimeout(() => {
            assistantBubble.classList.remove('show');
        }, duration);
    }

    // Sayfa yüklendiğinde asistanı konuştur
    setTimeout(() => showAssistantMessage("Merhaba! Bugün neler başaracağız?"), 2000);


});
