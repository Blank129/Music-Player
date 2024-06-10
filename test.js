/** Các bước thực hiện:
 * 1. Render songs
 * 2. Scroll top
 * 3. Play / pause / seek (tua)
 * 4. CD rotate
 * 5. Next / Prev
 * 6. Random
 * 7. Next / Repeat when ended
 * 8. Active song
 * 9. Scroll active song into view
 * 10. Play song when click
 */

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = 'PLAYER';

const cd = $('.cd');

const heading = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');

const playBtn = $('.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');

const nextBtn = $('.btn-next');
const prevBtn = $('.btn-prev');

const randomBtn = $('.btn-random');

const repeatBtn = $('.btn-repeat');

const playlist = $('.playlist');

const volume = $('#volume');

const app = {
    currentIndex: 0,
    currentVolume: 1,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    setConfig: function (key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config))
    },

    songs: [
        {
            name: 'God knows',
            singer: 'Aya Hirano',
            path: './assets/music/song1.mp4',
            image: './assets/image/song1.jpg'
        },

        {
            name: 'This game',
            singer: 'Konomi Suzuki',
            path: './assets/music/song2.mp4',
            image: './assets/image/song2.jpg'
        },
        {
            name: 'Only my railgun',
            singer: 'FripSide',
            path: './assets/music/song3.mp4',
            image: './assets/image/song3.jpg'
        },
        {
            name: 'Connect',
            singer: 'ClariS',
            path: './assets/music/song4.mp4',
            image: './assets/image/song4.jpg'
        },


    ],

    render: function () {
        const htmls = this.songs.map((song, index) => {
            return `
            <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <div class="thumb"
                    style="background-image: url('${song.image}')">
                </div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>`;

        })
        playlist.innerHTML = htmls.join('');
    },

    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex];
            }
        })
    },

    handleEvents: function () {
        const _this = this;
        const cdWidth = cd.offsetWidth;

        //Xử lý CD quay/ dừng
        const cdThumbAnimate = cdThumb.animate([
            { transform: 'rotate(360deg)' }
        ], {
            duration: 10000,
            iterations: Infinity
        })
        cdThumbAnimate.pause();

        //Xử lý phóng to / thu nhỏ CD
        document.onscroll = function () {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const newCdWidth = cdWidth - scrollTop;

            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0;
            cd.style.opacity = newCdWidth / cdWidth;
        }

        //Xử lý khi click play
        playBtn.onclick = function () {
            // if (_this.isPlaying) {
            //     _this.isPlaying = false;
            //     audio.pause();
            //     player.classList.remove('playing');
            // } else {      
            //     _this.isPlaying = true;         
            //     audio.play();
            //     player.classList.add('playing');
            // }
            if (_this.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }
        //Khi song dc play
        audio.onplay = function () {
            audio.volume = app.currentVolume;
            _this.isPlaying = true,
                player.classList.add('playing'),
                cdThumbAnimate.play()
        }

        //Khi song bị pause
        audio.onpause = function () {
            _this.isPlaying = false,
                player.classList.remove('playing'),
                cdThumbAnimate.pause()
        }

        //Khi tiến bộ bài hát thay đổi 
        audio.ontimeupdate = function () {
            if (audio.duration) {
                const progressPercent = Math.floor(audio.currentTime / audio.duration * 100);
                progress.value = progressPercent;
            }

        }

        //Xử lí khi tua song 
        progress.oninput = function (e) {
            const seekTime = audio.duration / 100 * e.target.value;
            audio.currentTime = seekTime;
        }

        //Khi next song
        nextBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.nextSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
        }

        //Khi prev song
        prevBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.prevSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong()

        }

        //bật/ tắt random song
        randomBtn.onclick = function (e) {
            _this.isRandom = !_this.isRandom
            _this.setConfig('isRandom', _this.isRandom),
                randomBtn.classList.toggle('active', _this.isRandom);

        }

        //XỬ lý next song khi audio end
        audio.onended = function () {
            if (_this.isRepeat) {
                audio.play();
            } else {
                nextBtn.click();
            }

        }

        //Xử lý lặp lại một song
        repeatBtn.onclick = function (e) {
            _this.isRepeat = !_this.isRepeat,
                _this.setConfig('isRepeat', _this.isRepeat),
                repeatBtn.classList.toggle('active', _this.isRepeat);
        }

        //Lắng nghe click vào playlist
        playlist.onclick = function (e) {
            const songNode = e.target.closest('.song:not(.active)');

            if (songNode || e.target.closest('.option')) {
                //Xử lí khi click vào song
                if (songNode) {
                    _this.currentIndex = Number(songNode.dataset.index);
                    _this.loadCurrentSong();
                    _this.render();
                    audio.play();

                }

                //Xử lí khi click vào option
                if (e.target.closest('.option')) {

                }
            }
        }

        //Xử lí change volumne
        volume.oninput = function () {
            audio.volume = volume.value / 100;
            app.setConfig('currentVolume', audio.volume);
        }

    },
    loadCurrentSong: function () {
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;

        this.setConfig('currentIndex', this.currentIndex);
    },

    loadConfig: function () {
        this.isRandom = this.config.isRandom;
        this.isRepeat = this.config.isRepeat;
        this.currentIndex = this.config.currentIndex;
        this.currentVolume = this.config.currentVolume;
    },

    nextSong: function () {
        this.currentIndex++;
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
    },

    prevSong: function () {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
    },

    playRandomSong: function () {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.songs.length);
        } while (newIndex === this.currentIndex)

        this.currentIndex = newIndex;
        this.loadCurrentSong();
    },

    scrollToActiveSong: function () {
        setTimeout(() => {
            $('.song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 300);
    },

    setConfig: function (key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config));
    },

    start: function () {

        //Gắn cấu hình từ config vào ứng dụng
        this.loadConfig();

        //ĐỊnh nghĩa các thuộc tính cho object
        this.defineProperties();

        //lắng nghe/ xử lí các event
        this.handleEvents();

        //Tải thông tin bài hát đầu tiên vào UI khi chạy ứng dụng
        this.loadCurrentSong();

        //render ra playlist
        this.render()

        //Hiển thị trạng thái ban đầu của button Repeat và Random
        randomBtn.classList.toggle('active', this.isRandom);
        repeatBtn.classList.toggle('active', this.isRepeat);
        volume.value = this.currentVolume * 100;
    }
}

app.start();
