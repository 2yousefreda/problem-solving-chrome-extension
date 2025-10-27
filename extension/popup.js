document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:8000/api';
    let currentUser = localStorage.getItem('username');

    
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalDialog = document.getElementById('modal-dialog');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    const allViews = [
        document.getElementById('login-view'),
        document.getElementById('challenge-active-view'),
        document.getElementById('challenge-completed-view'),
        document.getElementById('all-completed-view'),
        document.getElementById('roadmap-view'),
        document.getElementById('settings-view'),
        document.getElementById('error-view')
    ];
    const splashScreen = document.getElementById('splash-screen');
    const mainFooter = document.getElementById('main-footer');
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('username-input');

    let currentProblem = null;
    let dailyStatus = 'loading';
    let fullRoadmapData = [];
    let statsData = {};

    
    let confirmCallback = null;

    const showConfirmationModal = (title, message, onConfirm) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        confirmCallback = onConfirm;

        confirmationModal.classList.remove('hidden');
        
        setTimeout(() => {
            modalDialog.classList.remove('scale-95', 'opacity-0');
        }, 10); 
    };

    const hideConfirmationModal = () => {
        modalDialog.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            confirmationModal.classList.add('hidden');
            confirmCallback = null; 
        }, 200); 
    };

    modalConfirmBtn.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        hideConfirmationModal();
    });

    modalCancelBtn.addEventListener('click', hideConfirmationModal);
    
    confirmationModal.addEventListener('click', (event) => {
        if (event.target === confirmationModal) {
            hideConfirmationModal();
        }
    });
    


    const showView = (viewId) => {
        allViews.forEach(view => {
            view.classList.toggle('hidden', view.id !== viewId);
        });
        mainFooter.classList.toggle('hidden', viewId === 'login-view' || viewId === 'splash-screen');
    };

    const login = async (username) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            if (!response.ok) throw new Error('Login request failed');
            
            localStorage.setItem('username', username);
            currentUser = username;
            await fetchAllData();
        } catch (error) {
            console.error("Failed to login:", error);
            showView('error-view');
        }
    };

    const logout = () => {
        localStorage.removeItem('username');
        currentUser = null;
        currentProblem = null;
        dailyStatus = 'loading';
        fullRoadmapData = [];
        statsData = {};
        showView('login-view');
    };

    const fetchAllData = async () => {
        if (!currentUser) {
            showView('login-view');
            splashScreen.classList.add('hidden');
            return;
        }

        try {
            const challengeRes = await fetch(`${API_BASE_URL}/challenge?username=${currentUser}`);
            if (!challengeRes.ok) throw new Error('Challenge fetch failed');
            const challenge = await challengeRes.json();
            
            const statsRes = await fetch(`${API_BASE_URL}/stats?username=${currentUser}`);
            if (!statsRes.ok) throw new Error('Stats fetch failed');
            const stats = await statsRes.json();
            
            dailyStatus = challenge.status;
            statsData = stats.data;
            if (dailyStatus === 'incomplete' && challenge.data) {
                currentProblem = challenge.data;
            }

            updateStats(statsData);
            renderDailyView();
            fetchRoadmapData(); 

            setTimeout(() => {
                splashScreen.classList.add('hidden');
            }, 1000); 

        } catch (error) {
            console.error("Failed to fetch critical data:", error);
            showView('error-view');
            setTimeout(() => {
                splashScreen.classList.add('hidden');
            }, 1000);
        }
    };

    const fetchRoadmapData = async () => {
        if (!currentUser) return;
        try {
            const roadmapRes = await fetch(`${API_BASE_URL}/roadmap?username=${currentUser}`);
            if (!roadmapRes.ok) throw new Error('Roadmap API response not OK');
            const roadmap = await roadmapRes.json();
            fullRoadmapData = roadmap.data || [];
        } catch (error) {
            console.error("Failed to fetch roadmap data:", error);
            fullRoadmapData = []; 
        }
    };

    const completeChallenge = async (problemId) => {
        if (!currentUser) return;
        try {
            await fetch(`${API_BASE_URL}/challenge/complete?username=${currentUser}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problemId }),
            });
            dailyStatus = 'completed_today';
            showView('challenge-completed-view');
            
            statsData.solved++;
            statsData.streak++; 
            updateStats(statsData);
            fetchRoadmapData();
        } catch (error) { 
            console.error("Failed to complete challenge:", error);
            showView('error-view');
        }
    };

    const resetProgress = async () => {
        if (!currentUser) return;
        try {
            await fetch(`${API_BASE_URL}/challenge/reset?username=${currentUser}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            await fetchAllData();
        } catch (error) { 
            console.error("Failed to reset progress:", error);
            showView('error-view');
        }
    };

    const renderDailyView = () => {
        if (dailyStatus === 'incomplete') {
            updateChallengeDetails(currentProblem);
            showView('challenge-active-view');
        } else if (dailyStatus === 'completed_today') {
            showView('challenge-completed-view');
        } else if (dailyStatus === 'all_completed') {
            showView('all-completed-view');
        } else {
            showView('login-view');
        }
    };

    const updateStats = (stats) => {
        if (stats && stats.solved !== undefined) {
            document.getElementById('problems-solved').textContent = `Solved: ${stats.solved} / ${stats.total}`;
            document.getElementById('streak').innerHTML = `Streak: <span class="text-white">${stats.streak}</span>`;
        }
    };
    
    const updateChallengeDetails = (problem) => {
        if (!problem) return;
        document.getElementById('problem-title').textContent = problem.title;
        const badge = document.getElementById('difficulty-badge');
        badge.textContent = problem.difficulty;
        badge.className = 'font-semibold py-0.5 px-2 rounded-full text-xs';
        if (problem.difficulty === 'Easy') badge.classList.add('bg-green-200', 'text-green-900');
        else if (problem.difficulty === 'Medium') badge.classList.add('bg-yellow-200', 'text-yellow-900');
        else badge.classList.add('bg-red-200', 'text-red-900');
        document.getElementById('open-link').href = problem.url;
        document.getElementById('hint-text').textContent = problem.hint;
        document.getElementById('hint-text').classList.add('hidden');
    };

    const renderSettingsView = () => {
        const container = document.getElementById('settings-container');
        if (!container) return;
        container.innerHTML = '';

        const accountSection = document.createElement('div');
        accountSection.className = 'bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-md space-y-3';
        const accountTitle = document.createElement('h3');
        accountTitle.className = 'text-lg font-bold text-cyan-400';
        accountTitle.textContent = 'Account Settings';
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.className = 'w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors';
        logoutButton.addEventListener('click', logout);
        accountSection.appendChild(accountTitle);
        accountSection.appendChild(logoutButton);

        const progressSection = document.createElement('div');
        progressSection.className = 'bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-md space-y-3';
        const progressTitle = document.createElement('h3');
        progressTitle.className = 'text-lg font-bold text-cyan-400';
        progressTitle.textContent = 'Progress Settings';
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset Progress';
        resetButton.className = 'w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md transition-colors';
        
        
        resetButton.addEventListener('click', () => {
            showConfirmationModal(
                'Reset Progress', 
                'Are you sure you want to reset all your progress? This action cannot be undone.',
                resetProgress 
            );
        });

        progressSection.appendChild(progressTitle);
        progressSection.appendChild(resetButton);

        container.appendChild(accountSection);
        container.appendChild(progressSection);
    };

    const renderFullRoadmap = () => {
        const container = document.getElementById('roadmap-container');
        if (!container) return;
        if (fullRoadmapData.length === 0) {
             container.innerHTML = '<p class="text-slate-400 text-center">Roadmap data not available.</p>';
             return;
        }
        container.innerHTML = '';
        let currentProblemFound = false;
        
        fullRoadmapData.forEach((problem) => {
            let status = 'upcoming';
            if (problem.completed) {
                status = 'completed';
            } else if (!currentProblemFound) {
                status = 'current';
                currentProblemFound = true;
            }
            const item = createRoadmapItem(problem, status);
            container.appendChild(item);
        });
    };
    
    const createRoadmapItem = (problem, status) => {
        const item = document.createElement('div');
        item.className = 'p-4 rounded-lg shadow-md border transition-transform transform hover:scale-105';
        if (status === 'completed') {
            item.classList.add('bg-green-800', 'border-green-500','line-through');
        } else if (status === 'current') {
            item.classList.add('bg-blue-800', 'border-blue-500');
        } else {
            item.classList.add('bg-slate-800', 'border-slate-700');
        }

        const title = document.createElement('h3');
        title.className = 'font-bold text-lg mb-2';
        title.textContent = `Day ${problem.order}: ${problem.title}`;
        if (status === 'completed') title.classList.add('text-green-400', 'line-through');
        else if (status === 'current') title.classList.add('text-blue-400');
        else title.classList.add('text-slate-400');

        const badge = document.createElement('span');
        badge.className = 'inline-block px-2 py-1 rounded-full text-xs font-semibold';
        badge.textContent = problem.difficulty;
        if (problem.difficulty === 'Easy') badge.classList.add('bg-green-200', 'text-green-900');
        else if (problem.difficulty === 'Medium') badge.classList.add('bg-yellow-200', 'text-yellow-900');
        else badge.classList.add('bg-red-200', 'text-red-900');

        const hint = document.createElement('p');
        hint.className = 'text-slate-400 text-sm mt-2';
        hint.textContent = problem.hint;

        item.appendChild(title);
        item.appendChild(badge);
        item.appendChild(hint);
        return item;
    };

    
    loginBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username) {
            login(username);
        }
    });

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    document.getElementById('show-hint').addEventListener('click', () => {
        document.getElementById('hint-text').classList.toggle('hidden');
    });

    document.getElementById('complete-btn').addEventListener('click', () => {
        if (currentProblem) completeChallenge(currentProblem.id);
    });

    document.getElementById('view-roadmap-btn').addEventListener('click', () => {
        renderFullRoadmap();
        showView('roadmap-view');
    });

    document.getElementById('view-settings-btn').addEventListener('click', () => {
        renderSettingsView();
        showView('settings-view');
    });

    document.body.addEventListener('click', (event) => {
        if (event.target.closest('#back-to-challenge-btn')) {
            renderDailyView();
        }
    });

    
    if (currentUser) {
        fetchAllData();
    } else {
        splashScreen.classList.add('hidden');
        showView('login-view');
    }
});