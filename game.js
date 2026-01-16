// Finish line offset - distance from duck nose to right edge of 150px icon
const FINISH_LINE_OFFSET = 100;

// Minimum participants required to start/continue a race
const MINIMUM_PARTICIPANTS = 5;

// Sound system
class SoundManager {
    constructor() {
        this.enabled = true;
        this.context = null;
        this.initialized = false;
        this.raceLoopInterval = null;
        this.crowdNoiseInterval = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    playStartSound() {
        if (!this.enabled || !this.initialized) return;
        // Horn sound - trumpet style
        this.playBeep(500, 0.15, 0.3);
        setTimeout(() => this.playBeep(600, 0.15, 0.3), 100);
        setTimeout(() => this.playBeep(700, 0.2, 0.5), 200);
    }

    playCrowdCheer() {
        if (!this.enabled || !this.initialized) return;
        // Victory crowd sound
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.playBeep(300 + Math.random() * 500, 0.08, 0.15);
            }, i * 80);
        }
    }

    playFinishSound() {
        if (!this.enabled || !this.initialized) return;
        // Victory fanfare
        this.playBeep(1000, 0.15, 0.2);
        setTimeout(() => this.playBeep(1200, 0.15, 0.2), 150);
        setTimeout(() => this.playBeep(1500, 0.2, 0.4), 300);
        
        // Add crowd cheer
        setTimeout(() => this.playCrowdCheer(), 200);
    }

    // Horse galloping sound effect
    playHorseGallop() {
        if (!this.enabled || !this.initialized) return;
        // Simulate horse hooves - 4 beats in quick succession
        const hoofFreq = 180;
        const beatDelay = 80;
        
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playNoise(hoofFreq + Math.random() * 40, 0.08, 0.05);
            }, i * beatDelay);
        }
    }

    // Start continuous racing ambiance
    startRacingAmbiance() {
        if (!this.enabled || !this.initialized) return;
        
        // Horse galloping loop - continuous hooves sound
        this.raceLoopInterval = setInterval(() => {
            // Multiple horses galloping
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.playHorseGallop();
                }, i * 100);
            }
        }, 600);

        // Background crowd noise
        this.crowdNoiseInterval = setInterval(() => {
            // Random crowd murmur
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.playBeep(200 + Math.random() * 300, 0.02, 0.3);
                }, Math.random() * 500);
            }
        }, 800);
    }

    // Stop racing ambiance
    stopRacingAmbiance() {
        if (this.raceLoopInterval) {
            clearInterval(this.raceLoopInterval);
            this.raceLoopInterval = null;
        }
        if (this.crowdNoiseInterval) {
            clearInterval(this.crowdNoiseInterval);
            this.crowdNoiseInterval = null;
        }
    }

    playBeep(frequency, volume, duration) {
        if (!this.context) return;
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    // Noise generator for hoof sounds
    playNoise(frequency, volume, duration) {
        if (!this.context) return;
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square'; // Square wave for percussive hoof sound
        
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopRacingAmbiance();
        }
    }
}

// Duck class with color and advanced animation
class Duck {
    constructor(id, trackLength, name = null) {
        this.id = id;
        this.name = name || `Racer #${id}`;
        this.position = 0;
        this.speed = 0;
        this.baseSpeed = Math.random() * 0.8 + 3.2;
        this.acceleration = 0;
        this.maxSpeed = this.baseSpeed * 2.0;
        this.minSpeed = this.baseSpeed * 0.3;
        this.trackLength = trackLength;
        this.finished = false;
        this.finishTime = null;
        this.color = this.generateColor();
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.previousPosition = 0;
        this.previousRank = 0;
        this.speedChangeTimer = 0;
        this.targetSpeed = this.baseSpeed;
        this.particles = [];
        this.turboActive = false;
        this.turboTimer = 0;
        this.wingFlapSpeed = 1;
        this.laneOffset = 0;
        this.targetLaneOffset = 0;
        this.laneChangeTimer = 0;
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.targetFPS = 60; // FPS cho animation webp
    }

    generateColor() {
        const colors = [
            '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739',
            '#52B788', '#E63946', '#457B9D', '#E76F51', '#2A9D8F',
            '#FF1493', '#00CED1', '#FF4500', '#32CD32', '#BA55D3'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    randomizeSpeed() {
        this.speed = this.baseSpeed;
        this.targetSpeed = this.baseSpeed;
    }

    update(time, currentRank, totalDucks) {
        this.previousPosition = this.position;
        if (!this.finished) {
            // Lane changing logic
            this.laneChangeTimer--;
            if (this.laneChangeTimer <= 0 && Math.random() > 0.85) {
                this.laneChangeTimer = Math.random() * 120 + 60;
                this.targetLaneOffset = (Math.random() - 0.5) * 40;
            }
            
            // Smooth lane transition
            this.laneOffset += (this.targetLaneOffset - this.laneOffset) * 0.05;
            
            // Animation frame update với FPS cố định 12
            const currentTime = Date.now();
            const frameInterval = 1000 / this.targetFPS; // ~83ms cho 12 FPS
            if (currentTime - this.lastFrameTime >= frameInterval) {
                this.lastFrameTime = currentTime;
                this.currentFrame = (this.currentFrame + 1) % 3; // Cycle through 0, 1, 2
            }
            
            // Speed change with rubber banding
            this.speedChangeTimer--;
            if (this.speedChangeTimer <= 0) {
                this.speedChangeTimer = Math.random() * 30 + 15;
                const rand = Math.random();
                
                // Strong rubber banding: leaders very likely to slow down
                const isLeader = currentRank === 1;
                const isTop3 = currentRank <= 3;
                const isTop10 = currentRank <= 10;
                const isLagging = currentRank > totalDucks * 0.5;
                
                // Leader (rank 1) has 60% chance to slow down
                const slowDownChance = isLeader ? 0.60 : isTop3 ? 0.45 : isTop10 ? 0.25 : 0.10;
                // Leader has only 5% turbo chance, laggers have 25% chance
                const turboChance = isLeader ? 0.95 : isTop3 ? 0.85 : isTop10 ? 0.75 : isLagging ? 0.70 : 0.80;
                
                if (rand > turboChance) {
                    // Extreme turbo boost - stronger for laggers
                    const boostMultiplier = isLagging ? 1.8 : 1.4;
                    this.targetSpeed = this.maxSpeed * (boostMultiplier + Math.random() * 0.5);
                    this.turboActive = true;
                    this.turboTimer = 50;
                    this.wingFlapSpeed = 3;
                } else if (rand > 0.60) {
                    // Fast speed
                    this.targetSpeed = this.baseSpeed * (1.5 + Math.random() * 0.7);
                    this.wingFlapSpeed = 2;
                } else if (rand < slowDownChance) {
                    // Sudden slowdown - more severe for leaders
                    const slowMultiplier = isLeader ? 0.2 : isTop3 ? 0.4 : 0.6;
                    this.targetSpeed = this.minSpeed * (slowMultiplier + Math.random() * 0.2);
                    this.wingFlapSpeed = 0.2;
                } else {
                    // Normal speed with variation
                    this.targetSpeed = this.baseSpeed * (0.7 + Math.random() * 0.6);
                    this.wingFlapSpeed = 1;
                }
            }
            
            if (this.turboActive) {
                this.turboTimer--;
                if (this.turboTimer <= 0) {
                    this.turboActive = false;
                }
                if (Math.random() > 0.7) {
                    this.particles.push({
                        x: this.position,
                        y: 0,
                        vx: -2 - Math.random() * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 20,
                        maxLife: 20
                    });
                }
            }
            
            // Check if approaching finish line (within 200px)
            const distanceToFinish = this.trackLength - FINISH_LINE_OFFSET - this.position;
            const decelerationZone = 200;
            
            if (distanceToFinish <= decelerationZone && distanceToFinish > 0) {
                // Gradually slow down as approaching finish line
                const slowdownFactor = distanceToFinish / decelerationZone;
                this.targetSpeed = this.baseSpeed * slowdownFactor * 0.5;
            }
            
            this.acceleration = (this.targetSpeed - this.speed) * 0.05;
            this.speed += this.acceleration;
            this.speed = Math.max(this.minSpeed, Math.min(this.maxSpeed * 1.7, this.speed));
            
            this.position += this.speed + (Math.random() - 0.5) * 0.3;
            
            this.particles = this.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                return p.life > 0;
            });
            
            // Visual duck nose is ~FINISH_LINE_OFFSET px before the right edge of 150px icon
            // Allow duck to pass finish line by checking when left edge crosses
            if (this.position >= this.trackLength - FINISH_LINE_OFFSET) {
                this.position = this.trackLength - FINISH_LINE_OFFSET;
                this.speed = 0; // Stop completely at finish line
                this.finished = true;
                this.finishTime = Date.now();
            }
        }
    }

    getWobble(time) {
        return Math.sin(time * 0.015 + this.wobbleOffset) * 4;
    }
    
    getSpeedIndicator() {
        const speedPercent = (this.speed / this.maxSpeed);
        if (this.turboActive) return '🔥';
        if (speedPercent > 0.8) return '⚡';
        if (speedPercent < 0.4) return '💤';
        return '';
    }
}

console.log('Classes loaded successfully');

// Game class with all features
class Game {
    constructor() {
        this.ducks = [];
        this.duckCount = 300;
        this.raceDuration = 30;
        
        this.trackContainer = null;
        this.duckElements = new Map();
        
        this.trackLength = 0;
        this.raceStarted = false;
        this.raceFinished = false;
        this.racePaused = false;
        this.animationId = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.rankings = [];
        this.soundManager = new SoundManager();
        
        this.cameraOffset = 0;
        this.backgroundOffset = 0;
        this.viewportWidth = 0;
        this.trackHeight = 0;
        this.isFullscreen = false;
        
        this.stats = this.loadStats();
        this.currentRaceNumber = this.stats.totalRaces + 1;
        // this.highlights = [];
        this.raceHistory = [];
        
        this.duckNames = [];
        this.activeDuckNames = []; // Danh sách vịt đang tham gia (sẽ giảm dần)
        this.winners = this.loadWinners(); // Danh sách các vịt đã thắng
        this.excludedDucks = []; // Danh sách các vịt bị loại
        
        this.winnerAnimationFrame = 0;
        this.winnerAnimationInterval = null;
        
        this.duckImages = []; // Mỗi phần tử sẽ là array 3 ảnh [frame1, frame2, frame3]
        this.iconCount = 44; // output_3 có 44 folders
        this.imagesLoaded = false;
        this.currentTheme = 'output_3'; // Sử dụng output_3
        
        // this.updateStatsDisplay(); // Stats panel removed
        this.updateHistoryWin(); // Load history from localStorage
        this.detectAvailableThemes();
        this.detectAndLoadDuckImages();
    }

    loadStats() {
        const saved = localStorage.getItem('duckRaceStats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            totalRaces: 0,
            top3Finishes: 0,
            wins: 0
        };
    }

    saveStats() {
        localStorage.setItem('duckRaceStats', JSON.stringify(this.stats));
    }

    loadWinners() {
        const saved = localStorage.getItem('duckRaceWinners');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    saveWinners() {
        localStorage.setItem('duckRaceWinners', JSON.stringify(this.winners));
    }

    updateStatsDisplay() {
        // Stats panel removed - method disabled
        return;
        /*
        document.getElementById('totalRaces').textContent = this.stats.totalRaces;
        document.getElementById('top3Count').textContent = this.stats.top3Finishes;
        const winRate = this.stats.totalRaces > 0 
            ? ((this.stats.top3Finishes / this.stats.totalRaces) * 100).toFixed(1)
            : 0;
        document.getElementById('winRate').textContent = winRate + '%';
        */
    }

    detectAvailableThemes() {
        // Tự động phát hiện các thư mục output_X
        const themeSelect = document.getElementById('iconTheme');
        themeSelect.innerHTML = ''; // Xóa các option cũ
        
        let themeIndex = 1;
        let consecutiveFails = 0;
        const maxFails = 2;
        
        const checkTheme = (index) => {
            const testImg = new Image();
            const themeName = `output_${index}`;
            testImg.src = `${themeName}/Input_Icon_01.webp`;
            
            testImg.onload = () => {
                // Thư mục tồn tại, thêm vào dropdown
                const option = document.createElement('option');
                option.value = themeName;
                option.textContent = `Chủ đề ${index}`;
                themeSelect.appendChild(option);
                
                consecutiveFails = 0;
                checkTheme(index + 1);
            };
            
            testImg.onerror = () => {
                consecutiveFails++;
                if (consecutiveFails < maxFails) {
                    checkTheme(index + 1);
                } else {
                    console.log(`Detected ${themeSelect.options.length} icon themes`);
                }
            };
        };
        
        checkTheme(themeIndex);
    }

    changeIconTheme() {
        this.currentTheme = document.getElementById('iconTheme').value;
        this.duckImages = [];
        this.iconCount = 0;
        this.imagesLoaded = false;
        this.disableStartButton();
        this.detectAndLoadDuckImages();
    }

    // Loading UI helper methods
    showLoading(message, progress) {
        const loadingContainer = document.getElementById('loadingContainer');
        const loadingText = document.getElementById('loadingText');
        const loadingProgress = document.getElementById('loadingProgress');
        
        loadingContainer.classList.remove('hidden');
        loadingText.textContent = message;
        loadingProgress.textContent = `${progress}%`;
    }

    updateLoadingProgress(message, progress) {
        const loadingText = document.getElementById('loadingText');
        const loadingProgress = document.getElementById('loadingProgress');
        
        loadingText.textContent = message;
        loadingProgress.textContent = `${progress}%`;
    }

    hideLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        loadingContainer.classList.add('hidden');
    }

    enableStartButton() {
        const startBtn = document.getElementById('startRaceBtn');
        startBtn.disabled = false;
        startBtn.textContent = 'Start Race';
        
        // Show success notification
        this.updateLoadingProgress('✓ All icons loaded successfully!', 100);
        setTimeout(() => {
            this.hideLoading();
        }, 1500);
    }

    disableStartButton() {
        const startBtn = document.getElementById('startRaceBtn');
        startBtn.disabled = true;
        startBtn.textContent = 'Loading...';
    }

    detectAndLoadDuckImages() {
        // Tự động detect số folder có sẵn trong theme
        console.log(`Starting icon detection for theme: ${this.currentTheme}`);
        document.getElementById('iconCount').textContent = 'Detecting icons...';
        this.showLoading('Detecting icons...', 0);
        
        const maxFolders = 50; // Kiểm tra tối đa 50 folders
        let detectedCount = 0;
        let consecutiveFails = 0;
        const maxFails = 3;
        
        const checkFolder = (folderNum) => {
            const testImg = new Image();
            const testPath = `${this.currentTheme}/${folderNum}/compressed_final_${folderNum}_1.webp`;
            testImg.src = testPath;
            
            testImg.onload = () => {
                console.log(`✓ Found folder ${folderNum}`);
                detectedCount++;
                consecutiveFails = 0;
                
                const progress = Math.round((detectedCount / maxFolders) * 50); // 50% cho detection
                this.updateLoadingProgress(`Detecting icons... (${detectedCount} found)`, progress);
                
                if (folderNum < maxFolders) {
                    checkFolder(folderNum + 1);
                } else {
                    this.iconCount = detectedCount;
                    console.log(`Detection complete: ${detectedCount} folders found`);
                    document.getElementById('iconCount').textContent = `${detectedCount} icons detected`;
                    this.loadAllDuckImages();
                }
            };
            
            testImg.onerror = () => {
                console.log(`✗ Folder ${folderNum} not found (path: ${testPath})`);
                consecutiveFails++;
                if (consecutiveFails < maxFails && folderNum < maxFolders) {
                    checkFolder(folderNum + 1);
                } else {
                    // Kết thúc detection
                    this.iconCount = detectedCount;
                    console.log(`Detection stopped at folder ${folderNum}. Total found: ${detectedCount}`);
                    document.getElementById('iconCount').textContent = `${detectedCount} icons detected`;
                    if (detectedCount > 0) {
                        this.loadAllDuckImages();
                    } else {
                        console.error('No icons found! Check if files exist in:', this.currentTheme);
                        this.hideLoading();
                        alert('No icons found! Please check the icon theme.');
                    }
                }
            };
        };
        
        checkFolder(1);
    }
    
    loadAllDuckImages() {
        if (this.iconCount === 0) {
            console.warn('No icons detected!');
            this.hideLoading();
            return;
        }
        
        // Load 3 frames từ mỗi folder
        let loadedFolders = 0;
        const totalFolders = this.iconCount;
        
        this.updateLoadingProgress(`Loading ${totalFolders} animated icons...`, 50);
        
        for (let folderNum = 1; folderNum <= totalFolders; folderNum++) {
            const frames = [];
            let loadedFrames = 0;
            
            // Load 3 frames cho mỗi folder
            for (let frameNum = 1; frameNum <= 3; frameNum++) {
                const img = new Image();
                img.src = `${this.currentTheme}/${folderNum}/compressed_final_${folderNum}_${frameNum}.webp`;
                
                img.onload = () => {
                    loadedFrames++;
                    if (loadedFrames === 3) {
                        loadedFolders++;
                        const progress = 50 + Math.round((loadedFolders / totalFolders) * 50); // 50-100%
                        this.updateLoadingProgress(`Loading icons: ${loadedFolders}/${totalFolders}`, progress);
                        
                        if (loadedFolders === totalFolders) {
                            this.imagesLoaded = true;
                            console.log(`Loaded ${totalFolders} duck animations (3 frames each) from ${this.currentTheme}!`);
                            document.getElementById('iconCount').textContent = `${totalFolders} icon (animated)`;
                            this.hideLoading();
                            this.enableStartButton();
                        }
                    }
                };
                
                img.onerror = () => {
                    console.warn(`Failed to load: ${img.src}`);
                    loadedFrames++;
                    if (loadedFrames === 3) {
                        loadedFolders++;
                        const progress = 50 + Math.round((loadedFolders / totalFolders) * 50);
                        this.updateLoadingProgress(`Loading icons: ${loadedFolders}/${totalFolders}`, progress);
                        
                        if (loadedFolders === totalFolders) {
                            this.imagesLoaded = true;
                            document.getElementById('iconCount').textContent = `${totalFolders} icon (animated)`;
                            this.hideLoading();
                            this.enableStartButton();
                        }
                    }
                };
                
                frames.push(img);
            }
            
            this.duckImages.push(frames);
        }
        
        // Cập nhật UI ngay lập tức
        document.getElementById('iconCount').textContent = `Loading ${totalFolders} animated ducks...`;
    }

    preloadDuckImages() {
        let loadedCount = 0;
        const totalImages = this.iconCount;
        
        for (let i = 1; i <= totalImages; i++) {
            const img = new Image();
            const paddedNum = String(i).padStart(2, '0');
            img.src = `output/Input_Icon_${paddedNum}.webp`;
            
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.imagesLoaded = true;
                    console.log('All duck icons loaded!');
                }
            };
            
            img.onerror = () => {
                console.warn(`Failed to load: ${img.src}`);
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.imagesLoaded = true;
                }
            };
            
            this.duckImages.push(img);
        }
    }

    loadDuckNames(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (fileExt === 'xlsx' || fileExt === 'xls') {
            // Đọc file Excel
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    
                    this.duckNames = [];
                    
                    // Bỏ qua header (dòng 0), đọc từ dòng 1
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (row && row.length >= 2 && row[1]) {
                            const name = String(row[1]).trim();
                            if (name) {
                                this.duckNames.push(name);
                            }
                        }
                    }
                    
                    if (this.duckNames.length > 0) {
                        this.activeDuckNames = [...this.duckNames];
                        
                        if (this.winners.length > 0) {
                            const winnerNames = this.winners.map(w => w.name);
                            this.activeDuckNames = this.activeDuckNames.filter(name => !winnerNames.includes(name));
                        }
                        
                        document.getElementById('duckCount').value = this.duckNames.length;
                        alert(`Đã tải ${this.duckNames.length} tên từ file Excel!`);
                    } else {
                        alert('Không đọc được tên từ file Excel.');
                    }
                } catch (error) {
                    console.error('Error reading Excel:', error);
                    alert('Lỗi khi đọc file Excel: ' + error.message);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            // Đọc file CSV với encoding UTF-8
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split('\n');
                
                this.duckNames = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const columns = line.split(',');
                    if (columns.length >= 2) {
                        const stt = columns[0].trim();
                        const name = columns[1].trim();
                        if (stt && name) {
                            this.duckNames.push(name);
                        }
                    }
                }
                
                if (this.duckNames.length > 0) {
                    this.activeDuckNames = [...this.duckNames];
                    
                    if (this.winners.length > 0) {
                        const winnerNames = this.winners.map(w => w.name);
                        this.activeDuckNames = this.activeDuckNames.filter(name => !winnerNames.includes(name));
                    }
                    
                    document.getElementById('duckCount').value = this.duckNames.length;
                    alert(`Đã tải ${this.duckNames.length} tên từ file CSV!`);
                } else {
                    alert('Không đọc được tên từ file CSV.');
                }
            };
            
            // Chỉ định encoding UTF-8 để đọc tiếng Việt đúng
            reader.readAsText(file, 'UTF-8');
        }
    }

    startRace() {
        // Check if images are loaded
        if (!this.imagesLoaded) {
            alert('Please wait for all icons to load before starting the race!');
            return;
        }
        
        this.setupRace();
    }

    setupRace() {
        this.duckCount = parseInt(document.getElementById('duckCount').value);
        this.raceDuration = parseInt(document.getElementById('raceDuration').value) || 10;
        this.soundManager.setEnabled(document.getElementById('soundToggle').checked);

        if (this.duckCount < MINIMUM_PARTICIPANTS || this.duckCount > 1000) {
            alert(`Number of racers must be between ${MINIMUM_PARTICIPANTS} and 1000!`);
            return;
        }

        this.trackContainer = document.getElementById('raceRiver');
        
        // Calculate viewport width dynamically based on track container
        const trackElement = document.getElementById('raceTrack');
        this.viewportWidth = trackElement.clientWidth || 1200;
        // Use raceRiver height (excludes bank_top and bank_bot)
        this.trackHeight = this.trackContainer.clientHeight || 470;
        
        // Tính trackLength dựa trên tốc độ thực tế với rubber-banding
        // Quan sát: race càng dài, tốc độ trung bình càng cao do nhiều vịt luân phiên dẫn đầu
        // 30s: thiếu 33% | 60s: thiếu 17% | 120s: thiếu 25% | 180s: thiếu 22%
        // baseSpeed: 3.6 px/frame @ 60 FPS, nhưng rubber-banding giảm hiệu quả
        const basePxPerSec = 70; // Giảm base vì tốc độ thực tế cao hơn dự kiến
        // Tăng factor mạnh hơn cho race dài: +50% cho 60s, +80% cho 120s, +100% cho 180s
        const durationFactor = Math.min(2.0, 1 + (this.raceDuration / 90)); 
        const pixelsPerSecond = basePxPerSec * durationFactor;
        this.trackLength = this.raceDuration * pixelsPerSecond;
        this.cameraOffset = 0;
        this.backgroundOffset = 0;
        
        // Add resize handler for responsive scaling
        this.resizeHandler = () => {
            this.viewportWidth = trackElement.clientWidth || 1200;
            this.trackHeight = this.trackContainer.clientHeight || 470;
            if (this.raceStarted && !this.raceFinished) {
                this.redistributeDucks();
            }
        };
        window.addEventListener('resize', this.resizeHandler);

        this.trackContainer.innerHTML = '';
        this.duckElements.clear();

        this.ducks = [];
        // this.highlights = [];
        
        // Khởi tạo activeDuckNames nếu chưa có
        if (this.activeDuckNames.length === 0) {
            if (this.duckNames.length > 0) {
                // Có file CSV đã upload
                this.activeDuckNames = [...this.duckNames];
                
                // Loại bỏ các vịt đã thắng
                if (this.winners.length > 0) {
                    const winnerNames = this.winners.map(w => w.name);
                    this.activeDuckNames = this.activeDuckNames.filter(name => !winnerNames.includes(name));
                }
            } else {
                // Không có file, tạo tên mặc định
                for (let i = 1; i <= this.duckCount; i++) {
                    this.activeDuckNames.push(`Racer #${i}`);
                }
                
                // Loại bỏ các vịt số đã thắng
                if (this.winners.length > 0) {
                    const winnerNames = this.winners.map(w => w.name);
                    this.activeDuckNames = this.activeDuckNames.filter(name => !winnerNames.includes(name));
                }
            }
        }
        
        // Lấy danh sách vịt hiện tại
        let currentDucks = [...this.activeDuckNames];
        
        // Cập nhật duckCount theo số vịt hiện tại
        this.duckCount = currentDucks.length;
        
        for (let i = 1; i <= this.duckCount; i++) {
            const duckName = currentDucks[i - 1];
            const duck = new Duck(i, this.trackLength, duckName);
            duck.randomizeSpeed();
            this.ducks.push(duck);
            
            this.createDuckElement(duck, i);
        }

        document.getElementById('settingsPanel').classList.add('hidden');
        document.getElementById('raceInfo').classList.remove('hidden');
        document.getElementById('controlPanel').classList.remove('hidden');
        document.getElementById('raceTrack').classList.remove('hidden');
        // document.getElementById('highlightsPanel').classList.remove('hidden');
        document.getElementById('bigTimer').classList.remove('hidden');

        this.raceStarted = false;
        this.raceFinished = false;
        this.racePaused = false;
        
        // Hide continue button
        document.getElementById('continueBtn').classList.add('hidden');
        document.getElementById('continueBankBtn').classList.add('hidden');
        document.getElementById('pauseBtn').disabled = false;
        this.currentRaceNumber = this.stats.totalRaces + 1;
        
        document.getElementById('raceNumber').textContent = `#${this.currentRaceNumber}`;
        document.getElementById('raceStatus').textContent = 'Waiting to start...';
        document.getElementById('timeLeft').textContent = `${this.raceDuration}s`;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('fullscreenBtn').textContent = '🚀 Start';

        this.soundManager.init();
    }

    beginRace() {
        if (this.raceStarted) return;
        
        // Auto fullscreen
        const track = document.getElementById('raceTrack');
        if (!document.fullscreenElement) {
            track.requestFullscreen().then(() => {
                this.isFullscreen = true;
                // Show countdown after fullscreen is activated
                this.showCountdown(() => {
                    this.soundManager.playStartSound();
                    this.soundManager.startRacingAmbiance(); // Start horse galloping sounds
                    this.animate();
                });
            }).catch(err => {
                console.log('Fullscreen error:', err);
                // Show countdown anyway if fullscreen fails
                this.showCountdown(() => {
                    this.soundManager.playStartSound();
                    this.soundManager.startRacingAmbiance(); // Start horse galloping sounds
                    this.animate();
                });
            });
        } else {
            // Already in fullscreen, show countdown immediately
            this.showCountdown(() => {
                this.soundManager.playStartSound();
                this.soundManager.startRacingAmbiance(); // Start horse galloping sounds
                this.animate();
            });
        }
        
        this.raceStarted = true;
        this.startTime = Date.now();
        console.log('=== RACE START ===');
        console.log('Start time:', new Date(this.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }));
        console.log('Target pixel (finish line):', this.trackLength);
        console.log('==================');
        document.getElementById('raceStatus').textContent = 'Racing!';
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('fullscreenBtn').textContent = '🔲 Fullscreen';
    }

    createDuckElement(duck, index) {
        // Duck size is 150px, add padding at top/bottom
        const duckHeight = 150;
        const topPadding = 10;
        const bottomPadding = 10;
        const availableHeight = this.trackHeight - topPadding - bottomPadding - duckHeight;
        
        // Calculate lane height to fit all ducks within bounds
        const laneHeight = availableHeight / (this.duckCount - 1);
        
        const duckEl = document.createElement('div');
        duckEl.className = 'duck-element';
        // Position ducks from topPadding, using (index - 1) since duck IDs start from 1
        duckEl.style.top = `${topPadding + (index - 1) * laneHeight}px`;
        duckEl.style.left = '0px';
        
        if (this.imagesLoaded && this.duckImages.length > 0) {
            const iconIndex = (duck.id - 1) % this.duckImages.length;
            const img = document.createElement('img');
            // Sử dụng frame đầu tiên (index 0)
            img.src = this.duckImages[iconIndex][0].src;
            img.className = 'duck-icon';
            img.alt = duck.name;
            img.style.width = '150px';
            img.style.height = '150px';
            duckEl.appendChild(img);
        } else {
            const circle = document.createElement('div');
            circle.style.width = '150px';
            circle.style.height = '150px';
            circle.style.borderRadius = '50%';
            circle.style.background = duck.color;
            duckEl.appendChild(circle);
        }
        
        const nameLabel = document.createElement('span');
        nameLabel.className = 'duck-name';
        nameLabel.textContent = duck.name.length > 20 ? duck.name.substring(0, 18) + '..' : duck.name;
        duckEl.appendChild(nameLabel);
        
        this.trackContainer.appendChild(duckEl);
        this.duckElements.set(duck.id, duckEl);
    }

    redistributeDucks() {
        const duckHeight = 150;
        const topPadding = 10;
        const bottomPadding = 10;
        const availableHeight = this.trackHeight - topPadding - bottomPadding - duckHeight;
        const laneHeight = availableHeight / (this.duckCount - 1);
        
        this.ducks.forEach((duck, index) => {
            const duckEl = this.duckElements.get(duck.id);
            if (duckEl) {
                duckEl.style.top = `${topPadding + index * laneHeight}px`;
            }
        });
    }

    showCountdown(callback) {
        let countdown = 3;
        const countdownEl = document.createElement('div');
        countdownEl.style.position = 'fixed';
        countdownEl.style.top = '50%';
        countdownEl.style.left = '50%';
        countdownEl.style.transform = 'translate(-50%, -50%)';
        countdownEl.style.fontSize = '120px';
        countdownEl.style.fontWeight = 'bold';
        countdownEl.style.color = '#FFD700';
        countdownEl.style.textShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        countdownEl.style.zIndex = '2147483647';
        countdownEl.textContent = countdown;
        
        // Append to fullscreen element if in fullscreen mode
        const fullscreenElement = document.fullscreenElement;
        if (fullscreenElement) {
            fullscreenElement.appendChild(countdownEl);
        } else {
            document.body.appendChild(countdownEl);
        }
        
        const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownEl.textContent = countdown;
            } else if (countdown === 0) {
                countdownEl.textContent = 'GO!';
                countdownEl.style.color = '#00FF00';
            } else {
                clearInterval(interval);
                if (countdownEl.parentElement) {
                    countdownEl.parentElement.removeChild(countdownEl);
                }
                callback();
            }
        }, 600);
    }

    pauseRace() {
        if (!this.racePaused && this.raceStarted && !this.raceFinished) {
            this.racePaused = true;
            this.pausedTime = Date.now();
            this.soundManager.stopRacingAmbiance(); // Stop sounds when paused
            document.getElementById('pauseBtn').disabled = true;
            document.getElementById('resumeBtn').disabled = false;
            document.getElementById('raceStatus').textContent = 'Paused';
        }
    }

    resumeRace() {
        if (this.racePaused) {
            this.racePaused = false;
            const pauseDuration = Date.now() - this.pausedTime;
            this.startTime += pauseDuration;
            this.soundManager.startRacingAmbiance(); // Resume sounds when resumed
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('resumeBtn').disabled = true;
            document.getElementById('raceStatus').textContent = 'Racing!';
            this.animate();
        }
    }

    animate(timestamp) {
        if (!this.raceStarted || this.raceFinished || this.racePaused) return;

        this.animationId = requestAnimationFrame((ts) => this.animate(ts));

        const elapsed = (Date.now() - this.startTime) / 1000;
        const timeLeft = Math.max(0, this.raceDuration - elapsed);
        document.getElementById('timeLeft').textContent = `${timeLeft.toFixed(1)}s`;
        
        // Big timer shows elapsed time (counting up)
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        const milliseconds = Math.floor((elapsed % 1) * 100);
        document.getElementById('bigTimer').querySelector('.timer-display').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;

        // Check if duck's left edge passes finish line (minus small offset for visual accuracy)
        const hasFinisher = this.ducks.some(duck => duck.position >= this.trackLength - FINISH_LINE_OFFSET);
        
        if (hasFinisher) {
            const winner = this.ducks.find(duck => duck.position >= this.trackLength - FINISH_LINE_OFFSET);
            console.log('Winner detected:', winner.name, 'Position:', winner.position, 'TrackLength:', this.trackLength);
            this.endRace();
            return;
        }

        this.ducks.forEach(duck => {
            const currentRank = this.rankings.findIndex(d => d.id === duck.id) + 1 || this.ducks.length;
            duck.update(timestamp || Date.now(), currentRank, this.ducks.length);
        });

        const oldRankings = [...this.rankings];
        this.rankings = [...this.ducks].sort((a, b) => b.position - a.position);
        // this.checkHighlights(oldRankings, this.rankings);
        
        if (this.rankings.length > 0) {
            const leader = this.rankings[0];
            const distanceToFinish = this.trackLength - leader.position;
            
            // Log thông tin vịt dẫn đầu real-time
            console.log(`[Leader] ${leader.name} | Position: ${leader.position.toFixed(2)}px | Còn lại: ${distanceToFinish.toFixed(2)}px | Thời gian: ${elapsed.toFixed(2)}s`);
            
            let targetCameraOffset;
            let cameraMaxOffset;
            let cameraSpeed;
            
            if (distanceToFinish <= 500) {
                // When within 1000px of finish, move camera to center the finish line
                targetCameraOffset = this.trackLength - (this.viewportWidth / 2);
                // Allow camera to move beyond normal max to center the finish line
                cameraMaxOffset = this.trackLength - (this.viewportWidth / 2);
                // Slow down camera speed when approaching finish
                cameraSpeed = 0.05;
                
                // Show finish line
                // Position finish line so its left edge is at trackLength
                // This way when duck.position >= trackLength, duck's left edge (nose) touches the line
                const finishLine = document.getElementById('finishLine');
                finishLine.classList.remove('hidden');
                finishLine.style.left = (this.trackLength - this.cameraOffset) + 'px';
            } else {
                // Camera follows leader normally (60% from left edge)
                targetCameraOffset = leader.position - (this.viewportWidth * 0.6);
                cameraMaxOffset = this.trackLength - this.viewportWidth;
                cameraSpeed = 0.1;
            }
            
            this.cameraOffset += (targetCameraOffset - this.cameraOffset) * cameraSpeed;
            this.cameraOffset = Math.max(0, Math.min(cameraMaxOffset, this.cameraOffset));
        }

        // Update background offset continuously
        this.backgroundOffset += 15; // Constant scroll speed
        
        this.updateDuckPositions();
        this.updateBackgrounds();
        this.updateLeaderboard();
    }

    updateDuckPositions() {
        this.ducks.forEach(duck => {
            const duckEl = this.duckElements.get(duck.id);
            if (duckEl) {
                const screenX = duck.position - this.cameraOffset;
                duckEl.style.left = `${screenX}px`;
                
                const wobble = duck.getWobble(Date.now());
                const laneShift = duck.laneOffset || 0;
                duckEl.style.transform = `translateY(${wobble + laneShift}px)`;
                
                // Cập nhật animation frame
                if (this.imagesLoaded && this.duckImages.length > 0) {
                    const iconIndex = (duck.id - 1) % this.duckImages.length;
                    const imgEl = duckEl.querySelector('.duck-icon');
                    if (imgEl && this.duckImages[iconIndex] && this.duckImages[iconIndex][duck.currentFrame]) {
                        imgEl.src = this.duckImages[iconIndex][duck.currentFrame].src;
                    }
                }
            }
        });
    }

    updateBackgrounds() {
        const raceRiver = document.getElementById('raceRiver');
        const bankTop = document.getElementById('bankTop');
        const bankBot = document.getElementById('bankBot');
        
        if (raceRiver) {
            // River moves continuously independent of camera
            raceRiver.style.backgroundPosition = `${-this.backgroundOffset}px 0`;
        }
        
        if (bankTop && bankBot) {
            // Banks move slower (parallax effect) - 60% of river speed
            const bankOffset = this.backgroundOffset * 0.6;
            bankTop.style.backgroundPosition = `${-bankOffset}px 0`;
            bankBot.style.backgroundPosition = `${-bankOffset}px 0`;
        }
    }

    updateMinimap() {
        this.minimapContainer.innerHTML = '';
        
        const trackWidth = 270;
        
        const viewportEl = document.getElementById('minimapViewport');
        const cameraStartX = 15 + (this.cameraOffset / this.trackLength) * trackWidth;
        const cameraWidth = (this.viewportWidth / this.trackLength) * trackWidth;
        viewportEl.style.left = `${cameraStartX}px`;
        viewportEl.style.width = `${cameraWidth}px`;
        
        for (let i = 0; i < this.ducks.length; i += Math.max(1, Math.floor(this.ducks.length / 100))) {
            const duck = this.ducks[i];
            const dotEl = document.createElement('div');
            dotEl.className = 'minimap-duck';
            dotEl.style.background = duck.color;
            const x = (duck.position / this.trackLength) * trackWidth;
            const y = Math.random() * 80 + 10;
            dotEl.style.left = `${x}px`;
            dotEl.style.top = `${y}px`;
            this.minimapContainer.appendChild(dotEl);
        }
    }

    // checkHighlights(oldRankings, newRankings) {
    //     if (oldRankings.length === 0) return;

    //     for (let i = 0; i < Math.min(10, newRankings.length); i++) {
    //         const duck = newRankings[i];
    //         const oldRank = oldRankings.findIndex(d => d.id === duck.id);
            
    //         if (oldRank > i && oldRank - i >= 3) {
    //             this.addHighlight(`${duck.name} vuot len ${oldRank - i} bac! Hien tai: Hang ${i + 1}`);
    //         }
    //     }
    // }

    // addHighlight(message) {
    //     const time = ((Date.now() - this.startTime) / 1000).toFixed(1);
    //     this.highlights.unshift({ time, message });
    //     if (this.highlights.length > 10) this.highlights.pop();
        
    //     const list = document.getElementById('highlightsList');
    //     list.innerHTML = this.highlights.map(h => 
    //         `<div class="highlight-item">[${h.time}s] ${h.message}</div>`
    //     ).join('');
    // }

    updateHistoryWin() {
        // Cập nhật danh sách lịch sử chiến thắng
        const list = document.getElementById('historyWinList');
        if (!list || this.winners.length === 0) return;
        
        let html = '<ol>';
        this.winners.forEach((winner, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const colorDot = `<span style="display:inline-block;width:12px;height:12px;background:${winner.color};border-radius:50%;margin-right:5px;"></span>`;
            html += `<li>${medal}${colorDot}${winner.name}</li>`;
        });
        html += '</ol>';
        
        list.innerHTML = html;
    }

    endRace() {
        this.raceFinished = true;
        this.raceStarted = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Stop racing sounds
        this.soundManager.stopRacingAmbiance();

        this.rankings = [...this.ducks].sort((a, b) => b.position - a.position);
        const winner = this.rankings[0];
        
        this.soundManager.playFinishSound();
        setTimeout(() => this.soundManager.playCrowdCheer(), 300);
        
        // Show continue button in control panel
        document.getElementById('continueBtn').classList.remove('hidden');
        document.getElementById('continueBankBtn').classList.remove('hidden');
        document.getElementById('pauseBtn').disabled = true;
        
        // Show victory popup
        this.showVictoryPopup(winner);

        this.stats.totalRaces++;
        if (this.rankings.indexOf(this.rankings[0]) < 3) {
            this.stats.top3Finishes++;
        }
        this.saveStats();
        // this.updateStatsDisplay(); // Stats panel removed

        this.raceHistory.push({
            raceNumber: this.currentRaceNumber,
            winner: winner.id,
            duckCount: this.duckCount,
            duration: this.raceDuration,
            timestamp: new Date().toLocaleString('vi-VN')
        });

        document.getElementById('raceStatus').textContent = 'Finished!';
        document.getElementById('timeLeft').textContent = '0s';
        document.getElementById('pauseBtn').disabled = true;
        
        const resultPanel = document.getElementById('resultPanel');
        resultPanel.classList.remove('hidden');

        document.getElementById('resultTitle').innerHTML = '🏆 Race Finished!';
        
        let resultHTML = `
            <div class="result-winner">
                <h3>🏆 Winner: ${winner.name} 🏆</h3>
                <div style="width:30px;height:30px;background:${winner.color};border-radius:50%;margin:10px auto;"></div>
            </div>
            <div class="result-stats">
                <p><strong>Top 3:</strong></p>
                <p>🥇 ${this.rankings[0].name} - ${((this.rankings[0].position/this.trackLength)*100).toFixed(1)}%</p>
                <p>🥈 ${this.rankings[1].name} - ${((this.rankings[1].position/this.trackLength)*100).toFixed(1)}%</p>
                <p>🥉 ${this.rankings[2].name} - ${((this.rankings[2].position/this.trackLength)*100).toFixed(1)}%</p>
            </div>
        `;

        document.getElementById('resultMessage').innerHTML = resultHTML;
    }

    showVictoryPopup(winner) {
        console.log('Showing victory popup for:', winner.name);
        const popup = document.getElementById('victoryPopup');
        const winnerIconEl = document.getElementById('winnerIcon');
        const winnerNameEl = document.getElementById('winnerName');
        const winnerStatsEl = document.getElementById('winnerStats');
        
        if (!popup) {
            console.error('Victory popup element not found!');
            return;
        }
        
        console.log('Popup element found:', popup);
        
        // If in fullscreen, append popup to fullscreen element
        const fullscreenElement = document.fullscreenElement;
        if (fullscreenElement && popup.parentElement !== fullscreenElement) {
            console.log('Moving popup to fullscreen element');
            fullscreenElement.appendChild(popup);
        }
        
        // Set winner icon với animation
        if (this.imagesLoaded && this.duckImages.length > 0) {
            const iconIndex = (winner.id - 1) % this.duckImages.length;
            // Tạo img element với frame đầu tiên
            const imgEl = document.createElement('img');
            imgEl.src = this.duckImages[iconIndex][0].src;
            imgEl.alt = winner.name;
            imgEl.id = 'winnerAnimatedIcon';
            winnerIconEl.innerHTML = '';
            winnerIconEl.appendChild(imgEl);
            
            // Bắt đầu animation cho winner icon (nhanh hơn - mỗi 100ms)
            this.winnerAnimationFrame = 0;
            if (this.winnerAnimationInterval) {
                clearInterval(this.winnerAnimationInterval);
            }
            this.winnerAnimationInterval = setInterval(() => {
                this.winnerAnimationFrame = (this.winnerAnimationFrame + 1) % 3;
                const animImgEl = document.getElementById('winnerAnimatedIcon');
                if (animImgEl && this.duckImages[iconIndex] && this.duckImages[iconIndex][this.winnerAnimationFrame]) {
                    animImgEl.src = this.duckImages[iconIndex][this.winnerAnimationFrame].src;
                }
            }, 100); // 100ms = animation nhanh cho winner
        } else {
            winnerIconEl.innerHTML = `<div style="width:200px;height:200px;border-radius:50%;background:${winner.color};margin:0 auto;"></div>`;
        }
        
        // Set winner name
        winnerNameEl.textContent = winner.name;
        
        // Set winner stats
        const finishTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
        winnerStatsEl.innerHTML = `
            <p><strong>🕒 Time:</strong> ${finishTime}s</p>
            <p><strong>📍 Position:</strong> 1st</p>
            <p><strong>🏁 Total Racers:</strong> ${this.duckCount}</p>
        `;
        
        // Show popup with animation
        popup.style.display = 'flex';
        popup.classList.remove('hidden');
        console.log('Popup classes after remove hidden:', popup.classList);
        setTimeout(() => {
            popup.classList.add('show');
            console.log('Added show class, popup should be visible now');
        }, 10);
    }

    closeVictoryPopup() {
        const popup = document.getElementById('victoryPopup');
        popup.classList.remove('show');
        
        // Dừng winner animation
        if (this.winnerAnimationInterval) {
            clearInterval(this.winnerAnimationInterval);
            this.winnerAnimationInterval = null;
        }
        
        setTimeout(() => {
            popup.classList.add('hidden');
            popup.style.display = 'none';
            // Move popup back to body if it's in fullscreen element
            if (popup.parentElement !== document.body) {
                document.body.appendChild(popup);
            }
        }, 300);
    }

    continueRace() {
        // Lưu vịt thắng vào danh sách winners
        if (this.rankings.length > 0) {
            const winner = this.rankings[0];
            this.winners.push({
                position: this.winners.length + 1,
                id: winner.id,
                name: winner.name,
                color: winner.color,
                raceNumber: this.currentRaceNumber
            });
            
            // Xóa vịt thắng khỏi activeDuckNames
            this.activeDuckNames = this.activeDuckNames.filter(name => name !== winner.name);
            
            // Lưu và cập nhật UI lịch sử chiến thắng
            this.saveWinners();
            this.updateHistoryWin();
        }
        
        // Đóng victory popup
        this.closeVictoryPopup();
        
        // Ẩn result panel
        document.getElementById('resultPanel').classList.add('hidden');
        
        // Check if enough racers remain
        if (this.activeDuckNames.length < MINIMUM_PARTICIPANTS) {
            alert(`Only ${this.activeDuckNames.length} racers left! Not enough to continue (need at least ${MINIMUM_PARTICIPANTS} racers).`);
            this.showWinnersPanel();
            return;
        }
        
        // Reset và bắt đầu đua mới với số vịt còn lại
        this.ducks = [];
        this.duckElements.clear();
        this.raceStarted = false;
        this.raceFinished = false;
        this.racePaused = false;
        this.rankings = [];
        // this.highlights = [];
        
        // Ẩn vạch đích
        document.getElementById('finishLine').classList.add('hidden');
        
        if (this.trackContainer) {
            this.trackContainer.innerHTML = '';
        }
        
        // Display remaining racers count
        alert(`Continue with ${this.activeDuckNames.length} remaining racers!`);
        
        // Start new race setup
        this.setupRace();
    }

    goHome() {
        // Stop the race if running
        if (this.isRunning) {
            this.stopRace();
        }
        
        // Hide all panels
        document.getElementById('resultPanel').classList.add('hidden');
        document.getElementById('historyPanel').classList.add('hidden');
        document.getElementById('raceTrack').classList.add('hidden');
        document.getElementById('controlPanel').classList.add('hidden');
        
        // Show settings panel
        document.getElementById('settingsPanel').classList.remove('hidden');
        
        // Exit fullscreen if active
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        
        // Reset race state
        this.reset();
    }

    showWinnersPanel() {
        const resultPanel = document.getElementById('resultPanel');
        resultPanel.classList.remove('hidden');
        
        document.getElementById('resultTitle').innerHTML = '🏆 Prize Results';
        
        let html = '<div class="winners-list">';
        html += '<h3>🎉 Prize List 🎉</h3>';
        
        if (this.winners.length > 0) {
            html += '<div class="winners-grid">';
            this.winners.forEach((winner, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `🏅`;
                html += `
                    <div class="winner-card">
                        <div class="winner-medal">${medal}</div>
                        <div class="winner-position">Prize ${winner.position}</div>
                        <div class="winner-duck-name">${winner.name}</div>
                        <div style="width:30px;height:30px;background:${winner.color};border-radius:50%;margin:10px auto;"></div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<p>No winners yet!</p>';
        }
        
        html += '</div>';
        html += '<div class="result-actions" id="resultActions">';
        html += '<button class="btn btn-primary" onclick="game.fullReset()">🔄 Play Again</button>';
        html += '<button class="btn btn-secondary" onclick="game.viewHistory()">📜 View History</button>';
        html += '<button class="btn btn-secondary" onclick="game.toggleFullscreenResult()">🔍 View Fullscreen</button>';
        html += '</div>';
        
        document.getElementById('resultMessage').innerHTML = html;
        
        // Add click handler to result panel for fullscreen toggle
        resultPanel.onclick = (e) => {
            if (e.target === resultPanel || e.target.closest('.result-panel:not(.result-actions)')) {
                if (!e.target.closest('button')) {
                    this.toggleFullscreenResult();
                }
            }
        };
        
        // Tự động cuộn đến panel kết quả
        setTimeout(() => {
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    resetHistory() {
        if (confirm('Are you sure you want to clear victory history and start over?')) {
            this.winners = [];
            this.activeDuckNames = [...this.duckNames];
            this.saveWinners();
            // Reload page to refresh interface
            location.reload();
        }
    }

    fullReset() {
        // Reset hoàn toàn bao gồm cả winners
        this.winners = [];
        this.excludedDucks = [];
        this.activeDuckNames = [...this.duckNames]; // Reset về danh sách ban đầu
        this.saveWinners();
        this.reset();
    }

    toggleFullscreenResult() {
        const resultPanel = document.getElementById('resultPanel');
        const resultActions = document.getElementById('resultActions');
        
        if (resultPanel.classList.contains('fullscreen')) {
            resultPanel.classList.remove('fullscreen');
            if (resultActions) resultActions.style.display = 'flex';
            document.body.style.overflow = '';
        } else {
            resultPanel.classList.add('fullscreen');
            if (resultActions) resultActions.style.display = 'none';
            document.body.style.overflow = 'hidden';
        }
    }

    viewHistory() {
        if (this.raceHistory.length === 0) {
            alert('No race history yet!');
            return;
        }

        const historyPanel = document.getElementById('historyPanel');
        const historyList = document.getElementById('historyList');
        
        let html = '<table class="history-table"><thead><tr><th>Race</th><th>Winner</th><th>Racers</th><th>Duration</th><th>Date/Time</th></tr></thead><tbody>';
        
        this.raceHistory.slice().reverse().forEach(race => {
            html += `<tr>
                <td>#${race.raceNumber}</td>
                <td>Racer #${race.winner}</td>
                <td>${race.duckCount}</td>
                <td>${race.duration}s</td>
                <td>${race.timestamp}</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        historyList.innerHTML = html;
        
        historyPanel.classList.remove('hidden');
        document.getElementById('resultPanel').classList.add('hidden');
    }

    closeHistory() {
        document.getElementById('historyPanel').classList.add('hidden');
        document.getElementById('resultPanel').classList.remove('hidden');
    }
    
    toggleFullscreen() {
        // If race not started yet, begin the race
        if (!this.raceStarted && !this.raceFinished && this.ducks.length > 0) {
            this.beginRace();
            return;
        }
        
        // Otherwise toggle fullscreen
        const track = document.getElementById('raceTrack');
        if (!document.fullscreenElement) {
            track.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
            this.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                this.isFullscreen = false;
            }
        }
    }

    reset() {
        // Reset nhưng giữ lại winners và excludedDucks nếu có
        this.ducks = [];
        this.duckElements.clear();
        this.raceStarted = false;
        this.raceFinished = false;
        this.racePaused = false;
        this.rankings = [];
        // this.highlights = [];
        
        // Remove resize handler
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        if (this.trackContainer) {
            this.trackContainer.innerHTML = '';
        }

        document.getElementById('resultPanel').classList.add('hidden');
        document.getElementById('historyPanel').classList.add('hidden');
        document.getElementById('raceInfo').classList.add('hidden');
        document.getElementById('controlPanel').classList.add('hidden');
        document.getElementById('raceTrack').classList.add('hidden');
        document.getElementById('minimap').classList.add('hidden');
        // document.getElementById('highlightsPanel').classList.add('hidden');
        document.getElementById('bigTimer').classList.add('hidden');
        document.getElementById('finishLine').classList.add('hidden');

        document.getElementById('settingsPanel').classList.remove('hidden');
    }
}

console.log('Game class defined');
const game = new Game();
console.log('Game instance created');
