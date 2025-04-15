var Game = {
    stage: null,
    enemies: [],
    clouds: [],
    high: 0,
    score: 0,
    paused: false,
    started: false,
    animated: true,
    numberGame: 0,
    limit: 100,
    userID: 0,
    id: 0,
    walk: true,
    totalResults: 0,
    hour: 24,
    minutes: 0,
    sounds: {},
    finished: false,
    init: function() {
        this.setSize();
        this.stage = new createjs.StageGL("dino-canvas");
        this.aux = document.createElement("canvas");
        this.context = this.aux.getContext("2d");
        this.aux.width = 300;
        this.aux.height = 300;
        this.stage.setClearColor("#FFFFFF");
        this.dino = new Dino(this.stage);
        this.sky = new Sky(this.stage);
        this.ground = new Ground(this.stage);
        this.load();
        this.resize();
        this.setSounds();
        window.addEventListener("resize", this.resize.bind(this), false);
    },
    setSounds: function() {
        this.sounds["bonus"] = new Audio();
        this.sounds["bonus"].src = "mp3/bonus.mp3";
        this.sounds["die"] = new Audio();
        this.sounds["die"].src = "mp3/die.mp3";
        this.sounds["down"] = new Audio();
        this.sounds["down"].src = "mp3/down.mp3";
        this.sounds["jump"] = new Audio();
        this.sounds["jump"].src = "mp3/jump.mp3";
    },
    clock: function() {
        var score = 14;
        var x = setInterval(function() {
            window["time-left-indicator"].innerHTML = score + "s";
            if (score == 0) {
                clearInterval(x);
                if (!Game.finished) Game.over();
            }
            score--;
        }, 1000);
    },
    zeroPadding: function(n) {
        var str = String(n);
        return str.length == 1 ? ("0" + str) : str;
    },
    resize: function() {
        var width = window.innerWidth > 550 ? 550 : window.innerWidth;
        var scale = width / 550;
        window["dino-canvas"].style.transform = "scale(" + scale + ", " + scale + ")";
    },
    load: function() {
        var manifest = [{
            src: "pterodactyl.png",
            id: "pterodactyl",
        }, {
            src: "dino.png",
            id: "dino",
        }, {
            src: "leaf.png",
            id: "leaf",
        }, {
            src: "ground.png",
            id: "ground",
        }, {
            src: "cloud_01.png",
            id: "cloud_01",
        }, {
            src: "cloud_02.png",
            id: "cloud_02",
        }, {
            src: "cloud_03.png",
            id: "cloud_03",
        }, {
            src: "cloud_04.png",
            id: "cloud_04"
        }, {
            src: "tree_01.png",
            id: "tree_0"
        }, {
            src: "tree_02.png",
            id: "tree_1"
        }];
        this.loader = new createjs.LoadQueue(false);
        this.loader.addEventListener("complete", this.handleComplete.bind(this));
        this.loader.loadManifest(manifest, true, "img/game/");
    },
    setSize: function() {
        this.width = 550;
        this.height = 250;
        window["dino-canvas"].width = this.width;
        window["dino-canvas"].height = this.height;
    },
    handleComplete: function() {
        this.dino.load(this.loader);
        this.ground.load(this.loader);
        this.sky.load(this.loader);
        // this.render();
    },
    show: function() {
        App.hideSlide("#instructions-container");
        App.showSlide("#game-container");
    },
    start: function() {
        if (Game.started) return false;
        Game.started = true;
        Game.show();
        Game.clock();
        TweenMax.delayedCall(0.2, () => {
            Game.dino.start();
            Game.ground.start();
        });
        createjs.Ticker.timingMode = createjs.Ticker.RAF;
        createjs.Ticker.addEventListener("tick", this.render.bind(this));
    },
    render: function(e) {
        if (!Game.animated) return false;
        this.stage.update(e);
        this.dino.render();
        if (!Game.paused) return this.update(e);
    },
    update: function(e) {
        this.checkCollisions();
        this.ground.update(e);
        this.sky.update(e);
        this.bonusIncrease();
        this.score += 0.25;
        window["score-game"].innerText = parseInt(this.score);
    },
    bonusIncrease: function() {
        if (this.score > this.limit) {
            this.dino.playSound("bonus");
            if (this.walk) {
                this.ground.setVel(8);
                this.walk = false;
            }
            if (this.ground.passed == 20) {
                this.ground.setVel(10);
            }
            if (this.ground.passed == 50) {
                this.ground.setVel(12);
            }
            this.limit += 100;
        }
    },
    checkCollisions() {
        for (var i = 0; i < this.ground.enemies.length; i++) {
            this.checkCollision(this.ground.enemies[i]);
        }
    },
    getPxData(_rect, img) {
        this.context.clearRect(0, 0, 300, 300);
        this.context.drawImage(img, _rect[0], _rect[1], _rect[2], _rect[3], 0, 0, _rect[2], _rect[3]);
        var data = this.context.getImageData(0, 0, _rect[2], _rect[3]);
        var pxs = {};
        var width = 4;
        var height = 4;
        var leaf = img.src.indexOf("leaf") >= 0;
        for (var y = 0; y < data.height; y += height) {
            for (var x = 0; x < data.width - 2; x += width) {
                var index = (x * 4 + y * 4 * data.width);
                var r = data.data[index];
                var g = data.data[index + 1];
                var b = data.data[index + 2];
                var alpha = data.data[index + 3];
                if (alpha == 255) {
                    var rect = {
                        x: x, //  - (pxSize / 2)
                        y: y, //  - (pxSize / 2)
                        width: width,
                        height: height
                    };
                    if (leaf) {
                        pxs[x + "-" + y] = rect;
                    } else if (r == 0 && g == 0 && b == 0) {
                        pxs[x + "-" + y] = rect;
                    }
                }
            }
        }
        return pxs;
    },
    checkCollision(_enemy) {
        if (Game.dino.inCollision(_enemy)) {
            Game.over();
        }
    },
    over() {
        App.hideSlide("#game-container");
        App.showSlide("#game-over-container");
        Game.paused = true;
        Game.finished = true;
        setTimeout(() => {
            Game.animated = false;
        }, 1500);
    }
}
document.querySelector('.jdn')
    .addEventListener('onclick', () => {
        window.location.reload(true);
    });
window.onload = function() {
    const playButton = document.querySelector('.jdn')

    playButton.onclick = function() {
        window.location.reload(true)
    }
    
}