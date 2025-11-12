// === PRELOADER BAŞLANGIÇ ===

// HTML + CSS doğrudan sayfa başına ekleniyor
document.documentElement.insertAdjacentHTML("afterbegin", `
    <style>
        /* Tam ekran preloader */
        .fixed-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: black;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            transition: opacity 0.5s ease-out;
        }

        /* Arka plan resmi */
        .background-image {
            position: absolute;
            width: 100%;
            height: 100%;
            background: url('https://i.imgur.com/oXntzBc.jpeg') no-repeat center center/cover;
            background-size: cover;
            background-position: center;
            opacity: 0.3;
            filter: blur(5px) opacity(1.5);
        }

        /* Logo stili */
        .logo {
            width: 200px;
            animation: pulse 4s infinite;
            margin-bottom: 70px;
        }

        /* Logo animasyonu */
        @keyframes pulse {
            0% { transform: scale(2); opacity: 1; }
            50% { transform: scale(2.1); opacity: 0.8; }
            100% { transform: scale(2); opacity: 1; }
        }

        /* Yükleme çubuğu */
        .progress-bar-container {
            width: 50%;
            height: 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            overflow: hidden;
            position: relative;
        }

        .progress-bar {
            width: 0%;
            height: 100%;
            background: #252535;
            transition: width 2s linear;
        }

        /* Dikey modda gösterilecek dönme GIF'i */
        .rotate-gif {
            display: none;
            margin-top: 20px;
            width: 150px;
        }

        /* Kalpler */
        .hearts {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            display: flex;
            gap: 10px;
        }

        .one, .two, .three, .four, .five {
            background-color: #252535;
            display: inline-block;
            height: 10px;
            width: 10px;
            transform: rotate(-45deg);
            position: relative;
        }

        .one:before, .one:after,
        .two:before, .two:after,
        .three:before, .three:after,
        .four:before, .four:after,
        .five:before, .five:after {
            content: "";
            background-color: #252535;
            border-radius: 50%;
            height: 10px;
            width: 10px;
            position: absolute;
        }

        .one:before, .two:before, .three:before, .four:before, .five:before {
            top: -5px;
            left: 0;
        }

        .one:after, .two:after, .three:after, .four:after, .five:after {
            left: 5px;
            top: 0;
        }

        /* Kalp animasyonu */
        @keyframes heart {
            0% {
                transform: translateY(0) rotate(-45deg) scale(0.3);
                opacity: 1;
            }
            100% {
                transform: translateY(-150px) rotate(-45deg) scale(1.3);
                opacity: 0;
            }
        }

        .one { animation: heart 1s ease-out infinite; }
        .two { animation: heart 2s ease-out infinite; }
        .three { animation: heart 1.5s ease-out infinite; }
        .four { animation: heart 2.3s ease-out infinite; }
        .five { animation: heart 1.7s ease-out infinite; }
    </style>

    <div class="fixed-background" id="loading-screen">
        <div class="background-image"></div>
        <img src="https://i.imgur.com/jXzoG5D.png" alt="server logo" class="logo">

        <div class="hearts">
            <div class="one"></div>
            <div class="two"></div>
            <div class="three"></div>
            <div class="four"></div>
            <div class="five"></div>
        </div>

        <div class="progress-bar-container">
            <div class="progress-bar" id="progress-bar"></div>
        </div>

        <!-- Dikey modda dönme GIF'i -->
        <img src="https://i.imgur.com/CVpwetK.gif" alt="Cihazı döndürün" class="rotate-gif" id="rotate-gif">
    </div>
`);

// Tekrarlanan optimizasyonlardan kaçınmak için set
window._alreadyScaledWormTextures = window._alreadyScaledWormTextures || new Set();

// === Texture optimizasyon fonksiyonu ===
function optimizarTextura(tex) {
    if (!tex || !tex.Hc || !tex.Hc.baseTexture) {
        console.warn("⚠️ Geçersiz texture veya baseTexture bulunamadı.");
        return;
    }

    const base = tex.Hc.baseTexture;
    const id = base.cacheId || base.resource?.url || base.resource?.source?.src || '';

    if (!id || window._alreadyScaledWormTextures.has(id)) {
        return;
    }

    try {
        // Çözünürlük ayarı
        if (id.includes('100300_portions.png') && base.resolution > 0.025) {
            base.resolution = 0.025;
            console.log("🔧 Çözünürlük ayarlandı (" + base.resolution + "): " + id);
        }

        // Mipmap kapat
        if ("mipmap" in base) {
            base.mipmap = false;
        } else if ('mipmap' in base.baseTexture) {
            base.baseTexture.mipmap = false;
        }

        // Anizotropik filtre kapat
        if ('anisotropicLevel' in base) {
            base.anisotropicLevel = 1;
        } else if ("anisotropicLevel" in base.baseTexture) {
            base.baseTexture.anisotropicLevel = 1;
        }

        // Maksimum boyut kontrolü
        if (base.width > 1024 || base.height > 1024) {
            const scaleW = 1024 / base.width;
            const scaleH = 1024 / base.height;
            const scale = Math.min(scaleW, scaleH);

            if (base.setSize) {
                base.setSize(base.width * scale, base.height * scale);
            } else if (base.resource?.source instanceof HTMLImageElement) {
                base.resource.source.width *= scale;
                base.resource.source.height *= scale;
            }

            console.log("🔧 Görsel yeniden boyutlandırıldı (" + Math.round(scale * 100) + "%): " + id);
        }

        // Power-of-two kapat
        if (base.isPowerOfTwo && !id.includes('atlas') && !id.includes('sprite')) {
            base.isPowerOfTwo = false;
        }

        // Bozuk texture’ları temizle
        if (base.destroyed || base.resource?.destroyed) {
            base.destroy(true);
            console.log("🗑️ Bozuk texture yok edildi: " + id);
        }

        window._alreadyScaledWormTextures.add(id);
        console.log("✅ Optimizasyon tamamlandı: " + id);

    } catch (err) {
        console.error("❌ Texture optimize edilirken hata oluştu: " + id, err);
    }
}

// === Ekran yönü kontrolü ===
function checkOrientation() {
    const gif = document.getElementById("rotate-gif");
    if (window.matchMedia("(orientation: portrait)").matches) {
        gif.style.display = 'block';
    } else {
        gif.style.display = 'none';
    }
}

window.addEventListener("load", checkOrientation);
window.addEventListener("resize", checkOrientation);

// === Yükleme ilerleme animasyonu ===
window.onload = function () {
    document.getElementById("progress-bar").style.width = '100%';

    setTimeout(() => {
        document.getElementById("loading-screen").style.opacity = '0';
        setTimeout(() => {
            document.getElementById("loading-screen").remove();
        }, 500);
    }, 2000);
};

// === PRELOADER SONU ===

var wormateplatenconnect = "https://platenxo.github.io/extension";
window.detectLog = null;
const vO = {
  BETAisSkinCustom(p671) {
    var v781 = /[a-zA-Z]/;
    return typeof p671 === "string" && v781.test(p671);
  },
  testSkinCustom: function (p672) {
    if (vO.BETAisSkinCustom(p672)) {
      return 34 || 33;
    } else {
      return p672;
    }
  },
  testSkinMod: function (p673) {
    return p673 >= 399 && p673 < 999;
  },
  testWear: function (p674) {
    return p674 >= 399 && p674 < 999;
  },
  isNumberValid: function (p675) {
    return p675 !== "" && p675 !== null && p675 !== undefined && !isNaN(p675);
  },
  validInput: function (p676) {
    if (!vO.testSkinMod(p676) && !vO.BETAisSkinCustom(p676)) {
      return p676;
    }
    try {
      let v782 = $("#inputReplaceSkin").val();
      return encodeURI(vO.isNumberValid(v782) ? v782 : 35);
    } catch (e2) {
      return encodeURI(35);
    }
  },
  aload: false,
  aId: 0
};
var v783 = localStorage.getItem("inputReplaceSkin");
var v784;
var v785 = null;
var v786 = false;
var vO2 = {};
window.keyMove = 81;
var vO3 = {
  eventoPrincipal: null,
  joystick: {
    positionMode: "L",
    checked: true,
    size: 90,
    mode: "dynamic",
    position: {
      left: "110px",
      bottom: "110px"
    },
    color: "#FF3B3B",
    pxy: 110
  }
};
var vO4 = {
  FB_UserID: "",
  smoothCamera: 0.5,
  eat_animation: 0.0025,
  flag: "https://i.imgur.com/P6RvwPc.png",
  PortionSize: localStorage.PotenciadorSize || 2,
  PortionAura: localStorage.PotenciadorAura || 1.2,
  PortionTransparent: 0.8,
  FoodTransparent: 0.3,
  ModeStremer: false,
  ModeStremerbatop: false,
  ModeStremeremoj: false,
  ModeStremerheadshot: false,
  ModeStremersaveheadshot: false,
  arrow: false,
  KeyCodeRespawn: localStorage.KeyRespawn || 82,
  KeyCodeAutoMov: localStorage.KeyAutoMov || window.keyMove,
  AbilityZ: false,
  FoodShadow: localStorage.ComidaShadow || 2,
  FoodSize: localStorage.ComidaSize || 2,
  headshot: 0,
  visibleSkin: [],
  pL: [],
  gamePad: vO3.joystick,
  mobile: false,
  loading: false,
  kill: 0,
  totalKills: 0,
  totalHeadshots: 0,
  adblock: false,
  CLIENTE_ADMIN: 1,
  CLIENTE_ACTIVO: 3,
  CLIENTE_INACTIVO: 4
};
saveGameLocal = localStorage.getItem("SaveGameWPC");
if (saveGameLocal && saveGameLocal !== "null") {
  let v787 = JSON.parse(saveGameLocal);
  for (let v788 in v787) {
    vO4[v788] = v787[v788];
  }
}
vO4.loading = true;
const vF88 = function () {
  let v789 = false;
  vO4.mobile = false;
  const v790 = navigator.userAgent || navigator.vendor || window.opera;
  const vA = ["android", "bb", "meego", "avantgo", "bada", "blackberry", "blazer", "compal", "elaine", "fennec", "hiptop", "iemobile", "iphone", "ipod", "iris", "kindle", "lge", "maemo", "midp", "mmp", "mobile", "firefox", "netfront", "opera", "palm", "phone", "plucker", "pocket", "psp", "symbian", "treo", "vodafone", "wap", "windows ce", "xda", "ipad", "playbook", "silk"];
  if (vA.some(p677 => v790.toLowerCase().includes(p677))) {
    vO4.mobile = true;
    v789 = true;
  }
  return v789;
};
const vF89 = function () {
  let v791 = false;
  var v792 = navigator.userAgent || navigator.vendor || window.opera;
  const vA2 = ["android", "bb", "meego", "avantgo", "bada", "blackberry", "blazer", "compal", "elaine", "fennec", "hiptop", "iemobile", "iphone", "ipod", "iris", "kindle", "lge", "maemo", "midp", "mmp", "mobile", "firefox", "netfront", "opera", "palm", "phone", "plucker", "pocket", "psp", "symbian", "treo", "vodafone", "wap", "windows ce", "xda", "ipad", "playbook", "silk"];
  v791 = vA2.some(p678 => v792.toLowerCase().includes(p678));
  return v791;
};
const vF90 = function (p679) {
  let v793;
  try {
    console.log(p679);
    if (!vO4.gamePad) {
      vO4.gamePad = vO3.joystick;
    }
    if (vF89() && (p679 || vO4.gamePad.checked)) {
      v793 = nipplejs.create(vO4.gamePad);
      v793.on("move", function (p680, p681) {
        vO3.eventoPrincipal.sk = p681.angle.radian <= Math.PI ? p681.angle.radian * -1 : Math.PI - (p681.angle.radian - Math.PI);
        console.log(p681);
      });
    }
    return v793;
  } catch (e3) {
    console.log(e3);
  }
};
if (typeof PIXI === "undefined") {
  var v794 = document.createElement("script");
  v794.src = "https://pixijs.download/release/pixi.js";
  v794.type = "text/javascript";
  v794.onload = function () {
    f113();
  };
  document.head.appendChild(v794);
} else {
  f113();
}
function f113() {
  let v795 = new PIXI.Application();
  document.body.appendChild(v795.view);
  let v796 = new PIXI.Graphics();
  v796.beginFill(16711680);
  v796.drawCircle(400, 300, 50);
  v796.endFill();
  v795.stage.addChild(v796);
}
let vO5 = {
  clientesVencidos: [],
  clientesActivos: []
};
let vO6 = {
  Api_listServer: []
};
async function f114() {
  await fetch("https://platenxo.github.io/extension/api/users.json").then(p682 => p682.json()).then(p683 => {
    if (p683.success) {
      let v797 = p683.Users;
      const v798 = new Date();
      v798.setHours(0, 0, 0, 0);
      vO5.clientesActivos = v797.filter(p684 => {
        if (p684.cliente_DateExpired) {
          const v799 = new Date(p684.cliente_DateExpired);
          return v799 >= v798;
        }
        return true;
      });
    } else {
      vO5 = {
        clientesVencidos: [],
        clientesActivos: []
      };
      alert("حدث خطأ أثناء تحميل العملاء");
    }
  }).catch(p685 => {
    console.error("Error loading users:", p685);
    alert("حدث خطأ اثناء التحميل يرجي تحديث الصفحة F5.");
  });
}
async function f115(p686, p687 = 3, p688 = 2000) {
  for (let vLN1 = 1; vLN1 <= p687; vLN1++) {
    try {
      const v800 = await fetch(p686);
      if (!v800.ok) {
        throw new Error("HTTP error! status: " + v800.status);
      }
      const v801 = await v800.json();
      return v801;
    } catch (e4) {
      console.error("Attempt " + vLN1 + " failed: " + e4.message);
      if (vLN1 < p687) {
        await new Promise(p689 => setTimeout(p689, p688));
      } else {
        throw e4;
      }
    }
  }
}
async function f116() {
  try {
    const v802 = await f115("https://platenxo.github.io/extension/api/servers.json");
    if (v802.success) {
      let v803 = v802.servers;
      vO6.Api_listServer = v803.filter(p690 => p690.serverUrl);
    } else {
      vO6 = {
        Api_listServer: []
      };
      alert("حدث خطأ أثناء تحميل السيرفرات");
    }
  } catch (e5) {
    console.error("Failed to load servers after multiple attempts:", e5);
    vO6 = {
      Api_listServer: []
    };
    alert("حدث خطأ أثناء تحميل السيرفرات. يرجى إعادة المحاولة لاحقًا.");
  }
}
f114();
f116();
$(".store-view-cont").append("<div id=\"idReplaceSkin\"></div>");
var v$112 = $("#idReplaceSkin");
const vO7 = {
  fontStyle: {
    name: new PIXI.TextStyle({
      fill: "#f79425",
      fontSize: 12,
      lineJoin: "round",
      stroke: "#EFFA45",
      fontFamily: "platen",
      fontWeight: "bold"
    }),
    blanco: new PIXI.TextStyle({
      align: "center",
      fill: "#FFF",
      fontSize: 12,
      lineJoin: "round",
      stroke: "#FFF",
      strokeThickness: 1,
      whiteSpace: "normal",
      fontWeight: "bold",
      wordWrap: true
    }),
    morado: new PIXI.TextStyle({
      align: "center",
      fill: "#FFFFFF",
      fontSize: 11,
      lineJoin: "round",
      stroke: "white",
      strokeThickness: 1,
      whiteSpace: "normal",
      wordWrap: true
    }),
    morado1: new PIXI.TextStyle({
      align: "center",
      fill: "#FFF",
      fontSize: 11,
      lineJoin: "round",
      stroke: "white",
      strokeThickness: 1,
      whiteSpace: "normal",
      wordWrap: true
    }),
    amarillo: new PIXI.TextStyle({
      align: "center",
      fill: "#f8d968",
      fontSize: 12,
      lineJoin: "round",
      stroke: "red",
      strokeThickness: 1,
      whiteSpace: "normal",
      wordWrap: true
    }),
    amarillo1: new PIXI.TextStyle({
      align: "center",
      fill: "#f8d968",
      fontSize: 12,
      lineJoin: "round",
      stroke: "red",
      strokeThickness: 1,
      whiteSpace: "normal",
      wordWrap: true
    }),
    keysColor: new PIXI.TextStyle({
      align: "center",
      fill: "#fff009",
      fontSize: 10,
      lineJoin: "round",
      stroke: "#fff009",
      strokeThickness: 1,
      whiteSpace: "normal",
      fontWeight: "bold",
      fontFamily: "platen",
      wordWrap: true
    })
  }
};
vO7.clock = PIXI.Sprite.fromImage("https://timmapwormate.com/images/store/clock.png");
vO7.clock.width = 100;
vO7.clock.height = 100;
vO7.clock.x = -50;
vO7.clock.y = -50;
const v804 = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight
});
document.body.appendChild(v804.view);
vO7.hoisinhnhanh = PIXI.Sprite.from("https://i.imgur.com/QZfm7vv.png");
vO7.hoisinhnhanh.width = 23;
vO7.hoisinhnhanh.height = 23;
vO7.top10sv = PIXI.Sprite.fromImage("https://i.imgur.com/UbRiUYr.png");
vO7.top10sv.height = 25;
vO7.top10sv.width = 100;
vO7.top10sv.x = 60;
vO7.top10sv.y = -50;
vO7.quaytron = PIXI.Sprite.from("https://i.imgur.com/a7lVOy5.png");
vO7.quaytron.width = -23;
vO7.quaytron.height = -23;
v804.stage.addChild(vO7.hoisinhnhanh);
v804.stage.addChild(vO7.quaytron);
function f117() {
  const vLN300 = 300;
  const v805 = -90;
  vO7.hoisinhnhanh.x = window.innerWidth - vO7.hoisinhnhanh.width - vLN300;
  vO7.hoisinhnhanh.y = v805;
  vO7.quaytron.x = vO7.hoisinhnhanh.x - vO7.quaytron.width - 10;
  vO7.quaytron.y = v805;
}
f117();
window.addEventListener("resize", () => {
  v804.renderer.resize(window.innerWidth, window.innerHeight);
  f117();
});
vO7.value_server = new PIXI.Text("?", vO7.fontStyle.name);
vO7.value_server.x = 17;
vO7.value_server.y = 3;
vO7.label_hs = new PIXI.Text("HS", vO7.fontStyle.amarillo);
vO7.value1_hs = new PIXI.Text("0", vO7.fontStyle.amarillo);
vO7.label_kill = new PIXI.Text("KL", vO7.fontStyle.morado);
vO7.value1_kill = new PIXI.Text("0", vO7.fontStyle.morado);
if (vO4.ModeStremersaveheadshot) {
  vO7.value2_hs = new PIXI.Text("", vO7.fontStyle.amarillo1);
  vO7.value2_kill = new PIXI.Text("", vO7.fontStyle.morado1);
} else {
  vO7.value2_hs = new PIXI.Text("", vO7.fontStyle.amarillo1);
  vO7.value2_kill = new PIXI.Text("", vO7.fontStyle.morado1);
}
vO7.label_kill.x = 66;
vO7.label_kill.y = 127;
vO7.label_hs.x = 11;
vO7.label_hs.y = 127;
vO7.value1_kill.x = 66;
vO7.value1_kill.y = 142;
vO7.value1_hs.x = 11;
vO7.value1_hs.y = 142;
vO7.value2_kill.x = 66;
vO7.value2_kill.y = 158;
vO7.value2_hs.x = 11;
vO7.value2_hs.y = 158;
vO7.containerCountInfo = new PIXI.Container();
vO7.containerCountInfo.x = -45;
vO7.containerCountInfo.y = -76;
vO7.containerCountInfo.addChild(vO7.value_server);
vO7.containerCountInfo.addChild(vO7.label_hs);
vO7.containerCountInfo.addChild(vO7.value1_hs);
vO7.containerCountInfo.addChild(vO7.value2_hs);
vO7.containerCountInfo.addChild(vO7.label_kill);
vO7.containerCountInfo.addChild(vO7.value1_kill);
vO7.containerCountInfo.addChild(vO7.value2_kill);
vO7.imgServerbase = PIXI.Texture.fromImage("https://i.imgur.com/BZkMiJj.png");
vO7.borderurl = PIXI.Texture.fromImage("https://i.imgur.com/wYJAfmO0.png");
vO7.onclickServer = PIXI.Texture.fromImage(vO4.flag);
vO7.containerImgS = new PIXI.Sprite(vO7.imgServerbase);
vO7.containerImgS.anchor.set(0.5);
vO7.containerImgS.x = 0;
vO7.containerImgS.y = 18;
vO7.containerImgS.width = 25;
vO7.containerImgS.height = 20;
vO7.borderImg = new PIXI.Sprite(vO7.borderurl);
vO7.borderImg.anchor.set(0.5);
vO7.borderImg.x = -2;
vO7.borderImg.y = 78;
vO7.borderImg.width = 110;
vO7.borderImg.height = 60;
vO7.setServer = function (p691) {
  vO7.value_server.text = p691 || "?";
};
vO7.setCountGame = function (p692, p693, p694, p695) {
  vO7.value1_hs.text = p693;
  vO7.value1_kill.text = p692;
  if (vO4.ModeStremersaveheadshot) {
    vO7.value2_hs.text = p695;
    vO7.value2_kill.text = p694;
  }
};
"use strict";
var v806 = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function (p696) {
  return typeof p696;
} : function (p697) {
  if (p697 && typeof Symbol == "function" && p697.constructor === Symbol && p697 !== Symbol.prototype) {
    return "symbol";
  } else {
    return typeof p697;
  }
};
var v807;
(function () {
  try {
    console.log(function (p698, p699) {
      for (var vLN0 = 0; vLN0 < p699.length; vLN0 += 2) {
        p698 = p698.replaceAll(p699[vLN0], p699[vLN0 + 1]);
      }
      return p698;
    }("N-syo.632.oyhs`2./oSo+-2:dhydMdy/32/o+`3:o/62`/o+. .+osYYyso+-.osyQSs6662NyW.63 yW:`+QQ+ -Ms-.:ymmy3+Yo``+Y:6.Qs-+WWhYs:sHhyyHys/6662NoWs63 yW:+Ss:.-+Ss:`M-3.M` .YyySYys32`QSs.2``-Hh-32sH-66 `..3 `..`3N.Wh.63yW-Ss.3`Ss+`Mh/:+hmmo2/yy++yys//Y-3 oS/`Sso`3 ohy6oH.3..6 -Hh. -+Qs/ N /W+62`Wo:Ss32Sso.MMmd+.3syy` .-` :Y+3+Ss//Q+3 +H`32sHhsyHho6-Hh`:S+--+S+N2+W` `+y+2+W.:Ss.3.Ss+/M-:ymmh.2-Y.32+Ys2+Ss+o+/Q-3oH/32Hho-://:`6 Hh`So3`SsN3oHhs-sHhsoW/ `Sso:-:Q.hM-2ymmh. /Yo`3 sYy./Q`3+Sso2`W`3`Hh.66`Hh:So3-SoN3 +Why+yWh/3-oQSso-`Mm:2/Md+/Yy+3 oYy:Q/3 `Q. -W-3`WsYys/`+oo.:Hh//So//Ss-N32-sys:3:S+.6-/+++:-3oHo3 ohdh/`+So:3 .+S/`/oo:6.+s+` `+yyo`3 +yQYs: +oo..shy. -+oSo/. NN", ["W", "hhhh", "Q", "ssss", "M", "mmm", "Y", "yyy", "H", "hh", "S", "ss", "6", "      ", "3", "   ", "2", "  ", "N", "\n"]));
  } catch (e6) {}
})();
window.addEventListener("load", function () {
  function f118() {
    (function (p700, p701, p702) {
      function f119(p703, p704) {
        return (p703 === p702 ? "undefined" : v806(p703)) === p704;
      }
      function f120() {
        if (typeof p701.createElement != "function") {
          return p701.createElement(arguments[0]);
        } else if (v810) {
          return p701.createElementNS.call(p701, "http://www.w3.org/2000/svg", arguments[0]);
        } else {
          return p701.createElement.apply(p701, arguments);
        }
      }
      var vA3 = [];
      var vA4 = [];
      var vO8 = {
        _version: "3.3.1",
        _config: {
          classPrefix: "",
          enableClasses: true,
          enableJSClass: true,
          usePrefixes: true
        },
        _q: [],
        on: function (p705, p706) {
          var vThis38 = this;
          setTimeout(function () {
            p706(vThis38[p705]);
          }, 0);
        },
        addTest: function (p707, p708, p709) {
          vA4.push({
            name: p707,
            fn: p708,
            options: p709
          });
        },
        addAsyncTest: function (p710) {
          vA4.push({
            name: null,
            fn: p710
          });
        }
      };
      function f121() {}
      f121.prototype = vO8;
      f121 = new f121();
      var v808 = false;
      try {
        v808 = "WebSocket" in p700 && p700.WebSocket.CLOSING === 2;
      } catch (e7) {}
      f121.addTest("websockets", v808);
      var v809 = p701.documentElement;
      var v810 = v809.nodeName.toLowerCase() === "svg";
      f121.addTest("canvas", function () {
        var vF120 = f120("canvas");
        return !!vF120.getContext && !!vF120.getContext("2d");
      });
      f121.addTest("canvastext", function () {
        return f121.canvas !== false && typeof f120("canvas").getContext("2d").fillText == "function";
      });
      (function () {
        var v811;
        var v812;
        var v813;
        var v814;
        var v815;
        var v816;
        var v817;
        for (var v818 in vA4) {
          if (vA4.hasOwnProperty(v818)) {
            v811 = [];
            v812 = vA4[v818];
            if (v812.name && (v811.push(v812.name.toLowerCase()), v812.options && v812.options.aliases && v812.options.aliases.length)) {
              for (v813 = 0; v813 < v812.options.aliases.length; v813++) {
                v811.push(v812.options.aliases[v813].toLowerCase());
              }
            }
            v814 = f119(v812.fn, "function") ? v812.fn() : v812.fn;
            v815 = 0;
            for (; v815 < v811.length; v815++) {
              v816 = v811[v815];
              v817 = v816.split(".");
              if (v817.length === 1) {
                f121[v817[0]] = v814;
              } else {
                if (!!f121[v817[0]] && !(f121[v817[0]] instanceof Boolean)) {
                  f121[v817[0]] = new Boolean(f121[v817[0]]);
                }
                f121[v817[0]][v817[1]] = v814;
              }
              vA3.push((v814 ? "" : "no-") + v817.join("-"));
            }
          }
        }
      })();
      (function (p711) {
        var v819 = v809.className;
        var v820 = f121._config.classPrefix || "";
        if (v810) {
          v819 = v819.baseVal;
        }
        if (f121._config.enableJSClass) {
          var v821 = new RegExp("(^|\\s)" + v820 + "no-js(\\s|$)");
          v819 = v819.replace(v821, "$1" + v820 + "js$2");
        }
        if (f121._config.enableClasses) {
          v819 += " " + v820 + p711.join(" " + v820);
          if (v810) {
            v809.className.baseVal = v819;
          } else {
            v809.className = v819;
          }
        }
      })(vA3);
      delete vO8.addTest;
      delete vO8.addAsyncTest;
      for (var vLN02 = 0; vLN02 < f121._q.length; vLN02++) {
        f121._q[vLN02]();
      }
      p700.Modernizr = f121;
    })(window, document);
    return Modernizr.websockets && Modernizr.canvas && Modernizr.canvastext;
  }
  function f122(p712, p713, p714) {
    const vA5 = [38, 38, 38, 120, 38, 25, 38];
    const vA6 = ["#FFD500", "#FFC75A", "#00B2ED", "#FF4544", "#0094D7", "#CCCF81", "#ff0999"];
    let v822 = vA5[p713] - parseInt((p714 == 0.99 ? 1 : p714) * vA5[p713] / 1);
    const v823 = new PIXI.TextStyle({
      align: "center",
      fill: vA6[p713],
      fontSize: 25,
      lineJoin: "round",
      whiteSpace: "normal",
      wordWrap: true,
      dropShadow: true,
      dropShadowBlur: 6,
      fontFamily: "platen",
      fontWeight: "bold"
    });
    let v824 = "pwr_clock" + p713;
    if (!vO2[v824] && vA5[p713] === v822) {
      vO2[v824] = new PIXI.Text(v822, v823);
      vO2[v824].y = 61;
      p712.Tf[p713].addChild(vO2[v824]);
    }
    if (vO2[v824]) {
      vO2[v824].x = v822 >= 100 ? 11 : v822 >= 10 ? 18 : 26;
      vO2[v824].text = v822;
      if (v822 === 0) {
        delete vO2[v824];
      }
    }
  }
  document.getElementById("game-wrap").style.display = "block";
  if (!f118()) {
    document.getElementById("error-view").style.display = "block";
    return;
  }
  (function () {
    function f123() {
      return window.anApp = vUndefined28;
    }
    function f124(p715) {
      const v825 = p715 + "=";
      const v826 = document.cookie.split(";");
      for (let vLN03 = 0; vLN03 < v826.length; vLN03++) {
        let v827 = v826[vLN03];
        while (v827.charAt(0) === " ") {
          v827 = v827.substring(1);
        }
        if (v827.indexOf(v825) === 0) {
          return v827.substring(v825.length, v827.length);
        }
      }
      return "";
    }
    function f125(p716, p717, p718) {
      var v828 = new Date();
      v828.setTime(v828.getTime() + p718 * 86400000);
      var v829 = "expires=" + v828.toUTCString();
      document.cookie = p716 + "=" + p717 + "; " + v829 + "; path=/";
    }
    function f126(p719) {
      return window.I18N_MESSAGES[p719];
    }
    function f127(p720) {
      if (p720[v899]) {
        return p720[v899];
      } else if (p720.en) {
        return p720.en;
      } else {
        return p720.x;
      }
    }
    function f128(p721) {
      var v830 = (Math.floor(p721) % 60).toString();
      var v831 = (Math.floor(p721 / 60) % 60).toString();
      var v832 = (Math.floor(p721 / 3600) % 24).toString();
      var v833 = Math.floor(p721 / 86400).toString();
      var vF126 = f126("util.time.days");
      var vF1262 = f126("util.time.hours");
      var vF1263 = f126("util.time.min");
      var vF1264 = f126("util.time.sec");
      if (v833 > 0) {
        return v833 + " " + vF126 + " " + v832 + " " + vF1262 + " " + v831 + " " + vF1263 + " " + v830 + " " + vF1264;
      } else if (v832 > 0) {
        return v832 + " " + vF1262 + " " + v831 + " " + vF1263 + " " + v830 + " " + vF1264;
      } else if (v831 > 0) {
        return v831 + " " + vF1263 + " " + v830 + " " + vF1264;
      } else {
        return v830 + " " + vF1264;
      }
    }
    function f129(p722) {
      if (p722.includes("href")) {
        return p722.replaceAll("href", "target=\"_black\" href");
      } else {
        return p722;
      }
    }
    function f130(p723, p724, p725) {
      var v834 = document.createElement("script");
      var v835 = true;
      if (p724) {
        v834.id = p724;
      }
      v834.async = "async";
      v834.type = "text/javascript";
      v834.src = p723;
      if (p725) {
        v834.onload = v834.onreadystatechange = function () {
          v835 = false;
          try {
            p725();
          } catch (e8) {
            console.log(e8);
          }
          v834.onload = v834.onreadystatechange = null;
        };
      }
      (document.head || document.getElementsByTagName("head")[0]).appendChild(v834);
    }
    function f131(p726, p727) {
      var vP727 = p727;
      vP727.prototype = Object.create(p726.prototype);
      vP727.prototype.constructor = vP727;
      vP727.parent = p726;
      return vP727;
    }
    function f132(p728) {
      p728 %= v903;
      if (p728 < 0) {
        return p728 + v903;
      } else {
        return p728;
      }
    }
    function f133(p729, p730, p731) {
      return f134(p731, p729, p730);
    }
    function f134(p732, p733, p734) {
      if (p732 > p734) {
        return p734;
      } else if (p732 < p733) {
        return p733;
      } else if (Number.isFinite(p732)) {
        return p732;
      } else {
        return (p733 + p734) * 0.5;
      }
    }
    function f135(p735, p736, p737, p738) {
      if (p736 > p735) {
        return Math.min(p736, p735 + p737 * p738);
      } else {
        return Math.max(p736, p735 - p737 * p738);
      }
    }
    function f136(p739, p740, p741, p742, p743) {
      return p740 + (p739 - p740) * Math.pow(1 - p742, p741 / p743);
    }
    function f137(p744, p745, p746) {
      return p744 * (1 - p746) + p745 * p746;
    }
    function f138(p747, p748, p749, p750) {
      var vP749 = p749;
      var vP748 = p748;
      var v836 = p748 + p750;
      if (p747 == null) {
        throw new TypeError("this is null or not defined");
      }
      var v837 = p747.length >>> 0;
      var v838 = vP749 >> 0;
      var v839 = v838 < 0 ? Math.max(v837 + v838, 0) : Math.min(v838, v837);
      var v840 = vP748 >> 0;
      var v841 = v840 < 0 ? Math.max(v837 + v840, 0) : Math.min(v840, v837);
      var v842 = v836 === undefined ? v837 : v836 >> 0;
      var v843 = v842 < 0 ? Math.max(v837 + v842, 0) : Math.min(v842, v837);
      var v844 = Math.min(v843 - v841, v837 - v839);
      var vLN12 = 1;
      for (v841 < v839 && v839 < v841 + v844 && (vLN12 = -1, v841 += v844 - 1, v839 += v844 - 1); v844 > 0;) {
        if (v841 in p747) {
          p747[v839] = p747[v841];
        } else {
          delete p747[v839];
        }
        v841 += vLN12;
        v839 += vLN12;
        v844--;
      }
      return p747;
    }
    function f139(p751) {
      return p751.getContext("2d");
    }
    function f140(p752) {
      if (p752.parent != null) {
        p752.parent.removeChild(p752);
      }
    }
    function f141(p753) {
      return p753[parseInt(Math.random() * p753.length)];
    }
    function f142() {
      return Math.random().toString(36).substring(2, 15);
    }
    function f143(p754, p755, p756) {
      var v845 = (1 - Math.abs(p756 * 2 - 1)) * p755;
      var v846 = v845 * (1 - Math.abs(p754 / 60 % 2 - 1));
      var v847 = p756 - v845 / 2;
      if (p754 >= 0 && p754 < 60) {
        return [v847 + v845, v847 + v846, v847 + 0];
      } else if (p754 >= 60 && p754 < 120) {
        return [v847 + v846, v847 + v845, v847 + 0];
      } else if (p754 >= 120 && p754 < 180) {
        return [v847 + 0, v847 + v845, v847 + v846];
      } else if (p754 >= 180 && p754 < 240) {
        return [v847 + 0, v847 + v846, v847 + v845];
      } else if (p754 >= 240 && p754 < 300) {
        return [v847 + v846, v847 + 0, v847 + v845];
      } else {
        return [v847 + v845, v847 + 0, v847 + v846];
      }
    }
    function f144() {
      function f145() {
        let v848 = vO4.adblock ? 1 : 5;
        $("#adbl-1").text(f126("index.game.antiadblocker.msg1"));
        $("#adbl-2").text(f126("index.game.antiadblocker.msg2"));
        $("#adbl-3").text(f126("index.game.antiadblocker.msg3"));
        $("#adbl-4").text(f126("index.game.antiadblocker.msg4").replace("{0}", 10));
        $("#adbl-continue span").text(f126("index.game.antiadblocker.continue"));
        $("#adbl-continue").hide();
        $("#" + vLSJDHnkHtYwyXyVgG9).fadeIn(500);
        var vV848 = v848;
        for (var vLN04 = 0; vLN04 < v848; vLN04++) {
          setTimeout(function () {
            vV848--;
            $("#adbl-4").text(f126("index.game.antiadblocker.msg4").replace("{0}", vV848));
            if (vV848 === 0) {
              console.log("aipAABC");
              try {
                ga("send", "event", "antiadblocker", window.runtimeHash + "_complete");
              } catch (e9) {}
              $("#adbl-continue").fadeIn(200);
            }
          }, (vLN04 + 1) * 1000);
        }
      }
      var v849 = false;
      function f146() {}
      var vO9 = {};
      var vLSJDHnkHtYwyXyVgG9 = "JDHnkHtYwyXyVgG9";
      $("#adbl-continue").click(function () {
        $("#" + vLSJDHnkHtYwyXyVgG9).fadeOut(500);
        f146(false);
      });
      vO9.a = function (p757) {
        f146 = p757;
        if (!v849) {
          try {
            aiptag.cmd.player.push(function () {
              aiptag.adplayer = new aipPlayer({
                AD_WIDTH: 960,
                AD_HEIGHT: 540,
                AD_FULLSCREEN: true,
                AD_CENTERPLAYER: false,
                LOADING_TEXT: "loading advertisement",
                PREROLL_ELEM: function () {
                  return document.getElementById("1eaom01c3pxu9wd3");
                },
                AIP_COMPLETE: function (p758) {
                  console.log("aipC");
                  f146(true);
                  $("#1eaom01c3pxu9wd3").hide();
                  $("#" + vLSJDHnkHtYwyXyVgG9).hide();
                  try {
                    ga("send", "event", "preroll", window.runtimeHash + "_complete");
                  } catch (e10) {}
                },
                AIP_REMOVE: function () {}
              });
            });
            v849 = true;
          } catch (e11) {}
        }
      };
      vO9.b = function () {
        if (aiptag.adplayer !== undefined) {
          console.log("aipS");
          try {
            ga("send", "event", "preroll", window.runtimeHash + "_request");
          } catch (e12) {}
          f145();
        } else {
          console.log("aipAABS");
          try {
            ga("send", "event", "antiadblocker", window.runtimeHash + "_start");
          } catch (e13) {}
          f145();
        }
      };
      return vO9;
    }
    function f147(p759, p760) {
      var v$113 = $("#" + p759);
      var vP760 = p760;
      var vO10 = {};
      var v850 = false;
      vO10.a = function () {
        if (!v850) {
          v$113.empty();
          v$113.append("<div id='" + vP760 + "'></div>");
          try {
            try {
              ga("send", "event", "banner", window.runtimeHash + "_display");
            } catch (e14) {}
            aiptag.cmd.display.push(function () {
              aipDisplayTag.display(vP760);
            });
            v850 = true;
          } catch (e15) {}
        }
      };
      vO10.c = function () {
        try {
          try {
            ga("send", "event", "banner", window.runtimeHash + "_refresh");
          } catch (e16) {}
          aiptag.cmd.display.push(function () {
            aipDisplayTag.display(vP760);
          });
        } catch (e17) {}
      };
      return vO10;
    }
    function f148() {
      function f149(p761) {
        var v851 = p761 + Math.floor(Math.random() * 65535) * 37;
        f125(vF104.d, v851, 30);
      }
      function f150() {
        return parseInt(f124(vF104.d)) % 37;
      }
      return function () {
        var vF150 = f150();
        console.log("init1 pSC: " + vF150);
        if (!(vF150 >= 0) || !(vF150 < v1322.e)) {
          vF150 = Math.max(0, v1322.e - 2);
          console.log("init2 pSC: " + vF150);
        }
        var vO11 = {};
        vUndefined28 = vO11;
        vO11.f = v1322;
        vO11.g = false;
        vO11.i = Date.now();
        vO11.j = 0;
        vO11.k = 0;
        vO11.l = null;
        vO11.m = vUndefined27;
        vO11.n = v899;
        vO11.o = null;
        vO11.p = null;
        vO11.q = null;
        vO11.r = null;
        vO11.s = null;
        vO11.t = null;
        vO11.u = null;
        try {
          if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (p762) {
              if (p762.coords !== undefined) {
                var v852 = p762.coords;
                if (v852.latitude !== undefined && v852.longitude !== undefined) {
                  vO11.l = p762;
                }
              }
            }, function (p763) {});
          }
        } catch (e18) {}
        vO11.v = function () {
          vO11.p = new vF98();
          vO11.q = new vF127();
          vO11.r = new vF100();
          vO11.s = new vF128();
          vO11.t = new vF122();
          vO11.u = new vF130();
          vO11.o = new f151();
          vO11.o.z = new vF116(vO11.o);
          vO11.a();
        };
        vO11.a = function () {
          try {
            ga("send", "event", "app", window.runtimeHash + "_init");
          } catch (e19) {}
          vO11.o.A = function () {
            vO11.o.B();
          };
          vO11.o.C = function () {
            var v853 = vO11.s.F.D();
            try {
              ga("send", "event", "game", window.runtimeHash + "_start", v853);
            } catch (e20) {}
            vO11.r.G(vF100.AudioState.H);
            vO11.s.I(vO11.s.H.J());
          };
          vO11.o.B = function () {
            try {
              ga("send", "event", "game", window.runtimeHash + "_end");
            } catch (e21) {}
            if ($("body").height() >= 430) {
              vO11.f.K.c();
            }
            vO11.p.L();
            (function () {
              var v854 = Math.floor(vO11.o.N.M);
              var v855 = vO11.o.O;
              if (vO11.u.P()) {
                vO11.u.Q(function () {
                  vO11.R(v854, v855);
                });
              } else {
                vO11.R(v854, v855);
              }
            })();
          };
          vO11.o.S = function (p764) {
            p764(vO11.s.H.T(), vO11.s.H.U());
          };
          vO11.u.V(function () {
            if (vO11.p.W) {
              vO11.r.G(vF100.AudioState.F);
              vO11.s.I(vO11.s.F);
            }
            if (vO11.u.P()) {
              try {
                var v856 = vO11.u.X();
                ga("set", "userId", v856);
              } catch (e22) {}
            }
            if (vO11.Y() && vO11.u.P() && !vO11.u.Z()) {
              vO11.$(false, false);
              vO11.s.aa._(new vF178());
            } else {
              vO11.ba(true);
            }
          });
          vO11.p.ca(function () {
            vO11.r.G(vF100.AudioState.F);
            vO11.s.I(vO11.s.F);
          });
          vO11.q.a(function () {
            vO11.o.a();
            vO11.r.a();
            vO11.s.a();
            vO11.t.a();
            vO11.p.a();
            vO11.u.a();
            if (vO11.Y() && !vO11.Z()) {
              vO11.s.aa._(new vF178());
            } else {
              vO11.ba(true);
            }
          });
        };
        vO11.da = function (p765) {
          if (vO11.u.P()) {
            var v857 = vO11.u.ea();
            $.get(vLSHttpsgatewaywormatei + "/pub/wuid/" + v857 + "/consent/change?value=" + encodeURI(p765), function (p766) {});
          }
        };
        vO11.fa = function (p767) {
          var v858 = vO11.u.ea();
          var v859 = vO11.s.F.D();
          var v860 = vO11.s.F.ga();
          var v861 = vO11.t.ha(vF124.ia);
          var v862 = vO11.t.ha(vF124.ja);
          var v863 = vO11.t.ha(vF124.ka);
          var v864 = vO11.t.ha(vF124.la);
          var v865 = vO11.t.ha(vF124.ma);
          var vLN05 = 0;
          if (vO11.l != null) {
            var v866 = vO11.l.coords.latitude;
            var v867 = vO11.l.coords.longitude;
            vLN05 = Math.max(0, Math.min(32767, (v866 + 90) / 180 * 32768)) << 1 | 1 | Math.max(0, Math.min(65535, (v867 + 180) / 360 * 65536)) << 16;
          }
          vO.testSkinCustom(v861);
          let v868 = "?" + (v861 > 9999 ? "0000" : v861.toString().padStart(4, 0)) + (v865 > 999 ? "000" : v865.toString().padStart(3, 0)) + (v862 > 999 ? "000" : v862.toString().padStart(3, 0)) + (v863 > 999 ? "000" : v863.toString().padStart(3, 0));
          v860 = (v860.length >= 32 ? v860.substr(0, 16) : v860.substr(0, 16).padEnd(16, "_")) + v868;
          v860 = v860.trim();
          console.log(v860);
          var v869 = vLSHttpsgatewaywormatei + "/pub/wuid/" + v858 + "/start?gameMode=" + encodeURI(v859) + "&gh=" + vLN05 + "&nickname=" + encodeURI(v860) + "&skinId=" + vO.validInput(v861) + "&eyesId=" + encodeURI(v862) + "&mouthId=" + encodeURI(v863) + "&glassesId=" + encodeURI(v864) + "&hatId=" + encodeURI(v865);
          console.log("urlRequest: " + v869);
          $.get(v869, function (p768) {
            var v870 = p768.server_url;
            p767(v870);
          });
        };
        vO11.na = function () {
          vF150++;
          console.log("start pSC: " + vF150);
          if (!vO11.f.oa && vF150 >= vO11.f.e) {
            vO11.s.I(vO11.s.pa);
            vO11.r.G(vF100.AudioState.qa);
            vO11.f.ra.b();
          } else {
            f149(vF150);
            vO11.sa();
          }
        };
        vO11.sa = function (p769) {
          if (vO11.o.ta()) {
            vO11.s.I(vO11.s.ua);
            vO11.r.G(vF100.AudioState.ua);
            var v871 = vO11.s.F.D();
            f125(vF104.va, v871, 30);
            console.log("save gm: " + v871);
            var v872 = vO11.s.xa.wa();
            f125(vF104.ya, v872, 30);
            console.log("save sPN: " + v872);
            if (vO11.u.P()) {
              vO11.fa(function (p770) {
                v784 = p769 ? p769 : p770;
                vO11.o.za(window.server_url || p770, vO11.u.ea());
              });
            } else {
              var v873 = vO11.s.F.ga();
              f125(vF104.Aa, v873, 30);
              var v874 = vO11.t.ha(vF124.ia);
              f125(vF104.Ba, v874, 30);
              vO11.fa(function (p771) {
                v784 = p769 ? p769 : p771;
                vO11.o.Ca(p771, v873, v874);
              });
            }
          }
        };
        vO11.R = function (p772, p773) {
          var v875 = vO11.s.F.ga();
          vO11.s.H.Da(p772, p773, v875);
          vO11.r.G(vF100.AudioState.Ea);
          vO11.s.I(vO11.s.H.Fa());
        };
        vO11.Ga = function () {
          if (!vO11.Ha()) {
            return vO11.t.Ia();
          }
          var vParseInt2 = parseInt(f124(vF104.Ba));
          if (vParseInt2 != null && vO11.t.Ja(vParseInt2, vF124.ia)) {
            return vParseInt2;
          } else {
            return vO11.t.Ia();
          }
        };
        vO11.Ka = function (p774) {
          f125(vF104.La, !!p774, 1800);
        };
        vO11.Ha = function () {
          return f124(vF104.La) === "true";
        };
        vO11.ba = function (p775) {
          if (p775 != vO11.g) {
            vO11.g = p775;
            var v876 = v876 || {};
            v876.consented = p775;
            v876.gdprConsent = p775;
            vO11.f.Ma.a();
            vO11.f.K.a();
            vO11.f.ra.a(function (p776) {
              if (p776) {
                f149(vF150 = 0);
              }
              vO11.sa();
            });
          }
        };
        vO11.$ = function (p777, p778) {
          f125(vF104.Na, p777 ? "true" : "false");
          if (p778) {
            vO11.da(p777);
          }
          vO11.ba(p777);
        };
        vO11.Z = function () {
          switch (f124(vF104.Na)) {
            case "true":
              return true;
            default:
              return false;
          }
        };
        vO11.Y = function () {
          try {
            return !!window.isIPInEEA || vO11.l != null && !!vF105.Oa(vO11.l.coords.latitude, vO11.l.coords.longitude);
          } catch (e23) {
            return true;
          }
        };
        vO11.Pa = function () {
          vO11.j = Date.now();
          vO11.k = vO11.j - vO11.i;
          vO11.o.Qa(vO11.j, vO11.k);
          vO11.s.Qa(vO11.j, vO11.k);
          vO11.i = vO11.j;
        };
        vO11.Ra = function () {
          vO11.s.Ra();
        };
        return vO11;
      }();
    }
   function f151() {
      var vO12 = {
        Wa: 30,
        Xa: new Float32Array(100),
        Ya: 0,
        Za: 0,
        $a: 0,
        _a: 0,
        ab: 0,
        bb: 0,
        cb: 0,
        db: null,
        eb: 300,
        C: function () {},
        B: function () {},
        S: function () {},
        A: function () {},
        fb: new vF109(),
        z: null,
        N: null,
        gb: {},
        hb: {},
        ib: 12.5,
        jb: 40,
        kb: 1,
        lb: -1,
        mb: 1,
        nb: 1,
        ob: -1,
        pb: -1,
        qb: 1,
        rb: 1,
        sb: -1,
        O: 500,
        tb: 500
      };

    let vHBTimer;

    function fHeartbeatStop() {
        if (vHBTimer) {
            clearInterval(vHBTimer);
            vHBTimer = null;
        }
    }

    function fHeartbeatStart() {
        fHeartbeatStop(); 
        vHBTimer = setInterval(() => {
            if (vO12.db && vO12.db.readyState === WebSocket.OPEN) {
                if (vO12.eb !== 300) {
                    var v896 = new ArrayBuffer(1);
                    new DataView(v896).setInt8(0, vO12.eb);
                    vO12.db.send(v896);
                }
            }
        }, 10);
    }

      vO12.fb.ub = 500;
      vO12.N = new vF135(vO12.fb);
      vO12.a = function () {
        vO12.N.vb(f123().s.H.wb);
        setInterval(function () {
          vO12.S(function (p779, p780) {
            vO12.xb(p779, p780);
          });
        }, 10);
      };
      vO12.yb = function (p781, p782, p783, p784) {
        vO12.lb = p781;
        vO12.mb = p782;
        vO12.nb = p783;
        vO12.ob = p784;
        vO12.zb();
      };
      vO12.Ab = function (p785) {
        vO12.kb = p785;
        vO12.zb();
      };
      vO12.zb = function () {
        vO12.pb = vO12.lb - vO12.kb;
        vO12.qb = vO12.mb + vO12.kb;
        vO12.rb = vO12.nb - vO12.kb;
        vO12.sb = vO12.ob + vO12.kb;
      };
      vO12.Qa = function (p786, p787) {
        vO12.$a += p787;
        vO12.Za -= vO12.Ya * 0.2 * p787;
        vO12.z.Bb();
        if (vO12.db != null && (vO12.cb === 2 || vO12.cb === 3)) {
          vO12.Cb(p786, p787);
          vO12.jb = 4 + vO12.ib * vO12.N.Db;
        }
        var v877 = 1000 / Math.max(1, p787);
        var vLN06 = 0;
        var vLN07 = 0;
        for (; vLN07 < vO12.Xa.length - 1; vLN07++) {
          vLN06 = vLN06 + vO12.Xa[vLN07];
          vO12.Xa[vLN07] = vO12.Xa[vLN07 + 1];
        }
        vO12.Xa[vO12.Xa.length - 1] = v877;
        vO12.Wa = (vLN06 + v877) / vO12.Xa.length;
      };
      vO12.Eb = function (p788, p789) {
        return p788 > vO12.pb && p788 < vO12.qb && p789 > vO12.rb && p789 < vO12.sb;
      };
      vO12.Cb = function (p790, p791) {
        var v878 = vO12.$a + vO12.Za;
        var v879 = (v878 - vO12._a) / (vO12.ab - vO12._a);
        vO12.N.Fb(p790, p791);
        vO12.N.Gb(p790, p791, v879, vO12.Eb);
        var vLN08 = 0;
        var v880;
        for (v880 in vO12.hb) {
          var v881 = vO12.hb[v880];
          v881.Fb(p790, p791);
          v881.Gb(p790, p791, v879, vO12.Eb);
          if (v881.Hb && v881.Db > vLN08) {
            vLN08 = v881.Db;
          }
          if (!v881.Ib && (!!(v881.Jb < 0.005) || !v881.Hb)) {
            v881.Kb();
            delete vO12.hb[v881.Mb.Lb];
          }
        }
        vO12.Ab(vLN08 * 3);
        var v882;
        for (v882 in vO12.gb) {
          var v883 = vO12.gb[v882];
          v883.Fb(p790, p791);
          v883.Gb(p790, p791, vO12.Eb);
          if (v883.Nb && (v883.Jb < 0.005 || !vO12.Eb(v883.Ob, v883.Pb))) {
            v883.Kb();
            delete vO12.gb[v883.Mb.Lb];
          }
        }
      };
      vO12.Qb = function (p792, p793) {
        if (vO12.cb === 1) {
          vO12.cb = 2;
          vO12.C();
        }
        var v884 = f123().j;
        vO12.bb = p792;
        if (p792 === 0) {
          vO12._a = v884 - 95;
          vO12.ab = v884;
          vO12.$a = vO12._a;
          vO12.Za = 0;
        } else {
          vO12._a = vO12.ab;
          vO12.ab = vO12.ab + p793;
        }
        var v885 = vO12.$a + vO12.Za;
        vO12.Ya = (v885 - vO12._a) / (vO12.ab - vO12._a);
      };
  
      vO12.Ub = function () {
        vO12.db = null;
        vO12.z.Sb();
        fHeartbeatStop();
        if (vO12.cb !== 3) {
          vO12.A();
        }
        vO12.cb = 0;
      };
      vO12.za = function (p794, p795) {
        vO12.Vb(p794, function () {
          var v887 = Math.min(2048, p795.length);
          var v888 = new ArrayBuffer(6 + v887 * 2);
          var v889 = new DataView(v888);
          var vLN09 = 0;
          v889.setInt8(vLN09, 129);
          vLN09 = vLN09 + 1;
          v889.setInt16(vLN09, 2800);
          vLN09 = vLN09 + 2;
          v889.setInt8(vLN09, 1);
          vLN09 = vLN09 + 1;
          v889.setInt16(vLN09, v887);
          vLN09 = vLN09 + 2;
          var vLN010 = 0;
          for (; vLN010 < v887; vLN010++) {
            v889.setInt16(vLN09, p795.charCodeAt(vLN010));
            vLN09 = vLN09 + 2;
          }
          vO12.Wb(v888);
        });
      };
      vO12.Ca = function (p796, p797, p798) {
        vO12.Vb(p796, function () {
          var v890 = Math.min(32, p797.length);
          var v891 = new ArrayBuffer(7 + v890 * 2);
          var v892 = new DataView(v891);
          var vLN011 = 0;
          v892.setInt8(vLN011, 129);
          vLN011 = vLN011 + 1;
          v892.setInt16(vLN011, 2800);
          vLN011 = vLN011 + 2;
          v892.setInt8(vLN011, 0);
          vLN011 = vLN011 + 1;
          v892.setInt16(vLN011, p798);
          vLN011 = vLN011 + 2;
          v892.setInt8(vLN011, v890);
          vLN011++;
          var vLN012 = 0;
          for (; vLN012 < v890; vLN012++) {
            v892.setInt16(vLN011, p797.charCodeAt(vLN012));
            vLN011 = vLN011 + 2;
          }
          vO12.Wb(v891);
        });
      };
      vO12.Wb = function (p799) {
        try {
          if (vO12.db != null && vO12.db.readyState === WebSocket.OPEN) {
            vO12.db.send(p799);
          }
        } catch (e24) {
          console.log("Socket send error: " + e24);
          vO12.Ub();
        }
      };
      vO12.xb = function (p800, p801) {
        var v893 = p801 ? 128 : 0;
        var v894 = f132(p800) / v903 * 128 & 127;
        var v895 = (v893 | v894) & 255;
        if (vO12.eb !== v895) {
          var v896 = new ArrayBuffer(1);
          new DataView(v896).setInt8(0, v895);
          fHeartbeatStop();
          vO12.Wb(v896);
          vO12.eb = v895;
          fHeartbeatStart(); 
        }
      };
      vO12.Vb = function (p802, p803) {
        let vVF90 = vF90(!vO4.mobile);
        var v897 = vO12.db = new WebSocket(p802);
        v897.binaryType = "arraybuffer";
        window.onOpen = v897.onopen = function () {
          f225("open");
          if (vO12.db === v897) {
            console.log("Socket opened");
            fHeartbeatStart();
            p803();
          }
          v786 = true;
        };
        window.onclose = v897.onclose = function () {
          f225("closed");
          vO.aload = false;
          if (vO12.db === v897) {
            console.log("Socket closed");
            fHeartbeatStop();
            vO12.Ub();
          }
          v786 = false;
          if (vVF90) {
            vVF90.destroy();
          }
        };
        v897.onerror = function (p804) {
          if (vO12.db === v897) {
            console.log("Socket error");
            fHeartbeatStop();
            vO12.Ub();
          }
          v786 = false;
          if (vVF90) {
            vVF90.destroy();
          }
        };
        v897.onmessage = function (p805) {
          if (vO12.db === v897) {
            vO12.z.Xb(p805.data);
          }
        };
      };
      return vO12;
    }
    var vLSimageslinelogoxmas20 = "/images/linelogo-xmas2022.png";
    var vLSimagesguestavatarxma = "/images/guest-avatar-xmas2022.png";
    var v898 = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    var vLSHttpsgatewaywormatei = "https://gateway.wormate.io";
    var vLSHttpsresourceswormat = "https://resources.wormate.io";
    var v899 = window.I18N_LANG;
    v899 ||= "en";
    var vUndefined27 = undefined;
    switch (v899) {
      case "uk":
        vUndefined27 = "uk_UA";
        break;
      case "de":
        vUndefined27 = "de_DE";
        break;
      case "fr":
        vUndefined27 = "fr_FR";
        break;
      case "ru":
        vUndefined27 = "ru_RU";
        break;
      case "es":
        vUndefined27 = "es_ES";
        break;
      default:
        vUndefined27 = "en_US";
    }
    moment.locale(vUndefined27);
    var v900 = false;
    var vUndefined28 = undefined;
    var vF91 = function () {
      var vO13 = {
        Yb: eval("PIXI;")
      };
      var v901 = vO13.Yb.BLEND_MODES;
      var v902 = vO13.Yb.WRAP_MODES;
      return {
        Zb: vO13.Yb.Container,
        $b: vO13.Yb.BaseTexture,
        _b: vO13.Yb.Texture,
        ac: vO13.Yb.Renderer,
        bc: vO13.Yb.Graphics,
        cc: vO13.Yb.Shader,
        dc: vO13.Yb.Rectangle,
        ec: vO13.Yb.Sprite,
        fc: vO13.Yb.Text,
        gc: vO13.Yb.Geometry,
        hc: vO13.Yb.Mesh,
        ic: {
          jc: v901.ADD
        },
        kc: {
          lc: v902.REPEAT
        }
      };
    }();
    var v903 = Math.PI * 2;
    (function () {
      var vLSZ2V0 = "Z2V0";
      var vLS = "=";
      var v904 = vLSZ2V0 + "SW50";
      var v905 = vLSZ2V0 + "RmxvYXQ";
      var vA7 = [atob(v904 + "OA=="), atob(v904 + "MTY" + vLS), atob(v904 + "MzI" + vLS), atob(v905 + "zMg=="), atob(v905 + "2NA==")];
      DataView.prototype.mc = function (p806) {
        return this[vA7[0]](p806);
      };
      DataView.prototype.nc = function (p807) {
        return this[vA7[1]](p807);
      };
      DataView.prototype.oc = function (p808) {
        return this[vA7[2]](p808);
      };
      DataView.prototype.pc = function (p809) {
        return this[vA7[3]](p809);
      };
      DataView.prototype.qc = function (p810) {
        return this[vA7[4]](p810);
      };
    })();
    var vF97 = function () {
      function f152(p811) {
        this.rc = p811;
        this.sc = false;
        this.tc = 1;
      }
      f152.VELOCITY_TYPE = 0;
      f152.FLEXIBLE_TYPE = 1;
      f152.MAGNETIC_TYPE = 2;
      f152.ZOOM_TYPE = 6;
      f152.X2_TYPE = 3;
      f152.X5_TYPE = 4;
      f152.X10_TYPE = 5;
      return f152;
    }();
    var vF98 = function () {
      function f153() {
        this.uc = [];
        this.vc = {};
        this.wc = null;
        this.xc = vF99.yc();
      }
      function f154(p812, p813) {
        for (var v906 in p812) {
          if (p812.hasOwnProperty(v906)) {
            p813(v906, p812[v906]);
          }
        }
      }
      f153.prototype.a = function () {
        this.L();
      };
      f153.prototype.W = function () {
        return this.wc != null;
      };
      f153.prototype.zc = function () {
        if (this.wc != null) {
          return this.wc.revision;
        } else {
          return -1;
        }
      };
      f153.prototype.Ac = function () {
        return this.wc;
      };
      f153.prototype.L = function () {
        var vThis39 = this;
        $.get(vLSHttpsresourceswormat + "/dynamic/assets/revision.json", function (p814) {
          if (p814 > vThis39.zc()) {
            vThis39.Bc();
          }
        });
      };
      f153.prototype.Bc = function () {
        var vThis40 = this;
        $.get(vLSHttpsresourceswormat + "/dynamic/assets/registry.json", function (p815) {
          if (p815.revision > vThis40.zc()) {
            vThis40.Cc(p815);
          }
        });
      };
      f153.prototype.ca = function (p816) {
        this.uc.push(p816);
      };
      f153.prototype.Dc = function () {
        return this.xc;
      };
      f153.prototype.Ec = function () {
        for (var vLN013 = 0; vLN013 < this.uc.length; vLN013++) {
          this.uc[vLN013]();
        }
      };
      f153.prototype.Fc = function (p817, p818) {
        if (!(p817.revision <= this.zc())) {
          var vP818 = p818;
          f154(this.vc, function (p819, p820) {
            var v907 = vP818[p819];
            if (v907 == null || p820.Gc !== v907.Gc) {
              print("disposing prev texture: " + p819 + " at " + p820.Gc);
              p820.Hc.destroy();
            }
          });
          this.vc = vP818;
          this.wc = p817;
          this.xc = vF99.Ic(this.wc, this.vc);
          this.Ec();
        }
      };
      f153.prototype.Cc = function (p821) {
        var vO14 = {};
        var vA8 = [];
        var vA9 = [];
        var vLN014 = 0;
        (function (p822, p823) {
          for (var v908 in p822) {
            if (p822.hasOwnProperty(v908)) {
              var v909 = p822[v908];
              var v910 = v909.custom ? v909.relativePath : vLSHttpsresourceswormat + v909.relativePath;
              var v911 = v909.fileSize;
              var v912 = v909.sha256;
              var vO15 = {
                id: v908,
                path: v910,
                fileSize: v911,
                sha256: v912
              };
              vA8.push(vO15);
              vA9.push(vO15);
              vLN014 += v911;
              try {
                vO14[v908] = new vF108(v910, vF91.$b.from(v909.file || v910));
              } catch (e25) {
                console.log("Error loading file: " + v910);
              }
            }
          }
        })(p821.textureDict, function (p824, p825) {});
        this.Fc(p821, vO14);
      };
      return f153;
    }();
    var vF99 = function () {
      function f155() {
        this.Jc = null;
        this.Kc = null;
        this.Lc = null;
        this.Mc = null;
        this.Nc = null;
        this.Oc = null;
        this.Pc = null;
        this.Qc = null;
        this.Rc = null;
        this.Sc = null;
        this.Tc = null;
        this.Uc = null;
        this.Vc = null;
        this.Wc = null;
        this.Xc = null;
        this.Yc = null;
      }
      function f156(p826, p827) {
        for (var v913 in p826) {
          if (p826.hasOwnProperty(v913)) {
            p827(v913, p826[v913]);
          }
        }
      }
      f155.yc = function () {
        var v914 = new vF99();
        v914.Jc = {};
        v914.Kc = {
          Zc: null,
          $c: null
        };
        v914.Lc = {};
        v914.Mc = {
          Zc: null
        };
        v914.Nc = {};
        v914.Oc = {
          _c: "#FFFFFF",
          Zc: [],
          $c: []
        };
        v914.Pc = {};
        v914.Qc = {
          ad: {},
          bd: v914.Oc,
          cd: v914.Kc
        };
        v914.Rc = {};
        v914.Sc = {
          Zc: []
        };
        v914.Tc = {};
        v914.Uc = {
          Zc: []
        };
        v914.Vc = {};
        v914.Wc = {
          Zc: []
        };
        v914.Xc = {};
        v914.Yc = {
          Zc: []
        };
        return v914;
      };
      f155.Ic = function (p828, p829) {
        var v915 = new vF99();
        var vO16 = {};
        f156(p828.colorDict, function (p830, p831) {
          vO16[p830] = p831;
        });
        var vO17 = {};
        f156(p828.regionDict, function (p832, p833) {
          vO17[p832] = new vF125(p829[p833.texture].Hc, p833.x, p833.y, p833.w, p833.h, p833.px, p833.py, p833.pw, p833.ph);
        });
        v915.Nc = {};
        for (var vLN015 = 0; vLN015 < p828.skinArrayDict.length; vLN015++) {
          var v916 = p828.skinArrayDict[vLN015];
          v915.Nc[v916.id] = new vF99.WormSkinData("#" + vO16[v916.prime], v916.base.map(function (p834) {
            return vO17[p834];
          }), v916.glow.map(function (p835) {
            return vO17[p835];
          }));
        }
        var v917 = p828.skinUnknown;
        v915.Oc = new vF99.WormSkinData("#" + vO16[v917.prime], v917.base.map(function (p836) {
          return vO17[p836];
        }), v917.glow.map(function (p837) {
          return vO17[p837];
        }));
        v915.Rc = {};
        f156(p828.eyesDict, function (p838, p839) {
          p838 = parseInt(p838);
          v915.Rc[p838] = new vF99.WearSkinData(p839.base.map(function (p840) {
            return vO17[p840.region];
          }));
        });
        v915.Sc = new vF99.WearSkinData(p828.eyesUnknown.base.map(function (p841) {
          return vO17[p841.region];
        }));
        v915.Tc = {};
        f156(p828.mouthDict, function (p842, p843) {
          p842 = parseInt(p842);
          v915.Tc[p842] = new vF99.WearSkinData(p843.base.map(function (p844) {
            return vO17[p844.region];
          }));
        });
        v915.Uc = new vF99.WearSkinData(p828.mouthUnknown.base.map(function (p845) {
          return vO17[p845.region];
        }));
        v915.Vc = {};
        f156(p828.glassesDict, function (p846, p847) {
          p846 = parseInt(p846);
          v915.Vc[p846] = new vF99.WearSkinData(p847.base.map(function (p848) {
            return vO17[p848.region];
          }));
        });
        v915.Wc = new vF99.WearSkinData(p828.glassesUnknown.base.map(function (p849) {
          return vO17[p849.region];
        }));
        v915.Xc = {};
        f156(p828.hatDict, function (p850, p851) {
          p850 = parseInt(p850);
          v915.Xc[p850] = new vF99.WearSkinData(p851.base.map(function (p852) {
            return vO17[p852.region];
          }));
        });
        v915.Yc = new vF99.WearSkinData(p828.hatUnknown.base.map(function (p853) {
          return vO17[p853.region];
        }));
        v915.Jc = {};
        f156(p828.portionDict, function (p854, p855) {
          p854 = parseInt(p854);
          v915.Jc[p854] = new vF99.PortionSkinData(vO17[p855.base], vO17[p855.glow]);
        });
        var v918 = p828.portionUnknown;
        v915.Kc = new vF99.PortionSkinData(vO17[v918.base], vO17[v918.glow]);
        v915.Lc = {};
        f156(p828.abilityDict, function (p856, p857) {
          p856 = parseInt(p856);
          v915.Lc[p856] = new vF99.AbilitySkinData(vO17[p857.base]);
        });
        var v919 = p828.abilityUnknown;
        v915.Mc = new vF99.AbilitySkinData(vO17[v919.base]);
        v915.Pc = {};
        f156(p828.teamDict, function (p858, p859) {
          p858 = parseInt(p858);
          v915.Pc[p858] = new vF99.TeamSkinData(p859.name, new vF99.WormSkinData("#" + vO16[p859.skin.prime], [], p859.skin.glow.map(function (p860) {
            return vO17[p860];
          })), new vF99.PortionSkinData([], vO17[p859.portion.glow]));
        });
        v915.Qc = new vF99.TeamSkinData({}, v915.Oc, v915.Kc);
        return v915;
      };
      f155.prototype.dd = function (p861) {
        var v920 = this.Nc[p861];
        return v920 || this.Oc;
      };
      f155.prototype.ed = function (p862) {
        var v921 = this.Pc[p862];
        return v921 || this.Qc;
      };
      f155.prototype.fd = function (p863) {
        var v922 = this.Rc[p863];
        return v922 || this.Sc;
      };
      f155.prototype.gd = function (p864) {
        var v923 = this.Tc[p864];
        return v923 || this.Uc;
      };
      f155.prototype.hd = function (p865) {
        var v924 = this.Vc[p865];
        return v924 || this.Wc;
      };
      f155.prototype.jd = function (p866) {
        var v925 = this.Xc[p866];
        return v925 || this.Yc;
      };
      f155.prototype.kd = function (p867) {
        var v926 = this.Jc[p867];
        return v926 || this.Kc;
      };
      f155.prototype.ld = function (p868) {
        var v927 = this.Lc[p868];
        return v927 || this.Mc;
      };
      f155.TeamSkinData = function () {
        function f157(p869, p870, p871) {
          this.ad = p869;
          this.bd = p870;
          this.cd = p871;
        }
        return f157;
      }();
      f155.WormSkinData = function () {
        function f158(p872, p873, p874) {
          this._c = p872;
          this.Zc = p873;
          this.$c = p874;
        }
        return f158;
      }();
      f155.WearSkinData = function () {
        function f159(p875) {
          this.Zc = p875;
        }
        return f159;
      }();
      f155.PortionSkinData = function () {
        function f160(p876, p877) {
          this.Zc = p876;
          this.$c = p877;
        }
        return f160;
      }();
      f155.AbilitySkinData = function () {
        function f161(p878) {
          this.Zc = p878;
        }
        return f161;
      }();
      return f155;
    }();
    var vF100 = function () {
      function f162() {
        this.md = vF100.AudioState.ua;
        this.nd = false;
        this.od = false;
        this.pd = null;
        this.qd = null;
      }
      f162.prototype.a = function () {};
      f162.prototype.rd = function (p879) {
        this.od = p879;
      };
      f162.prototype.G = function (p880) {
        this.md = p880;
        this.sd();
      };
      f162.prototype.td = function (p881) {
        this.nd = p881;
        this.sd();
      };
      f162.prototype.sd = function () {};
      f162.prototype.ud = function (p882, p883) {
        if (!f123().p.W) {
          return null;
        }
        var v928 = p882[p883];
        if (v928 == null || v928.length == 0) {
          return null;
        } else {
          return v928[Math.floor(Math.random() * v928.length)].cloneNode();
        }
      };
      f162.prototype.vd = function (p884, p885, p886) {
        if (this.od && !(p886 <= 0)) {
          var v929 = this.ud(p884, p885);
          if (v929 != null) {
            v929.volume = Math.min(1, p886);
            v929.play();
          }
        }
      };
      f162.prototype.wd = function (p887, p888) {
        if (this.md.xd) {
          this.vd(v804.q.yd, p887, p888);
        }
      };
      f162.prototype.zd = function (p889, p890) {
        if (this.md.Ad) {
          this.vd(v804.q.Bd, p889, p890);
        }
      };
      f162.prototype.Cd = function () {};
      f162.prototype.Dd = function () {};
      f162.prototype.Ed = function () {};
      f162.prototype.Fd = function () {};
      f162.prototype.Gd = function () {};
      f162.prototype.Hd = function () {};
      f162.prototype.Id = function (p891, p892, p893) {};
      f162.prototype.Jd = function (p894) {};
      f162.prototype.Kd = function (p895) {};
      f162.prototype.Ld = function (p896) {};
      f162.prototype.Md = function (p897) {};
      f162.prototype.Nd = function (p898) {};
      f162.prototype.Od = function (p899) {};
      f162.prototype.Pd = function (p900) {};
      f162.prototype.Qd = function (p901) {};
      f162.prototype.Rd = function (p902) {};
      f162.prototype.Sd = function (p903) {};
      f162.prototype.Td = function (p904) {};
      f162.prototype.Ud = function (p905) {};
      f162.prototype.Vd = function (p906) {};
      f162.prototype.Wd = function (p907) {};
      f162.prototype.Xd = function (p908, p909) {};
      f162.prototype.Yd = function (p910) {};
      f162.prototype.Zd = function (p911, p912, p913) {};
      (function () {
        function f163(p914) {
          this.$d = new vF101(p914, 0.5);
          this.$d._d.loop = true;
          this.ae = false;
        }
        f163.prototype.be = function (p915) {
          if (p915) {
            this.b();
          } else {
            this.ce();
          }
        };
        f163.prototype.b = function () {
          if (!this.ae) {
            this.ae = true;
            this.$d.de = 0;
            this.$d.ee(1500, 100);
          }
        };
        f163.prototype.ce = function () {
          if (this.ae) {
            this.ae = false;
            this.$d.fe(1500, 100);
          }
        };
      })();
      (function () {
        function f164(p916) {
          this.ge = p916.map(function (p917) {
            return new vF101(p917, 0.4);
          });
          f165(this.ge, 0, this.ge.length);
          this.he = null;
          this.ie = 0;
          this.ae = false;
          this.je = 10000;
        }
        function f165(p918, p919, p920) {
          for (var v930 = p920 - 1; v930 > p919; v930--) {
            var v931 = p919 + Math.floor(Math.random() * (v930 - p919 + 1));
            var v932 = p918[v930];
            p918[v930] = p918[v931];
            p918[v931] = v932;
          }
        }
        f164.prototype.be = function (p921) {
          if (p921) {
            this.b();
          } else {
            this.ce();
          }
        };
        f164.prototype.b = function () {
          if (!this.ae) {
            this.ae = true;
            this.ke(1500);
          }
        };
        f164.prototype.ce = function () {
          if (this.ae) {
            this.ae = false;
            if (this.he != null) {
              this.he.fe(800, 50);
            }
          }
        };
        f164.prototype.ke = function (p922) {
          if (this.ae) {
            if (this.he == null) {
              this.he = this.le();
            }
            if (this.he._d.currentTime + this.je / 1000 > this.he._d.duration) {
              this.he = this.le();
              this.he._d.currentTime = 0;
            }
            console.log("Current track '" + this.he._d.src + "', change in (ms) " + ((this.he._d.duration - this.he._d.currentTime) * 1000 - this.je));
            this.he.de = 0;
            this.he.ee(p922, 100);
            var v933 = (this.he._d.duration - this.he._d.currentTime) * 1000 - this.je;
            var vThis41 = this;
            var vSetTimeout4 = setTimeout(function () {
              if (vThis41.ae && vSetTimeout4 == vThis41.ie) {
                vThis41.he.fe(vThis41.je, 100);
                vThis41.he = vThis41.le();
                vThis41.he._d.currentTime = 0;
                vThis41.ke(vThis41.je);
              }
            }, v933);
            this.ie = vSetTimeout4;
          }
        };
        f164.prototype.le = function () {
          var v934 = this.ge[0];
          var v935 = Math.max(1, this.ge.length / 2);
          f165(this.ge, v935, this.ge.length);
          this.ge.push(this.ge.shift());
          return v934;
        };
      })();
      var vF101 = function () {
        function f166(p923, p924) {
          this._d = p923;
          this.me = p924;
          this.de = 0;
          p923.volume = 0;
          this.ne = 0;
          this.oe = false;
        }
        f166.prototype.ee = function (p925, p926) {
          console.log("fade IN " + this._d.src);
          this.pe(true, p925, p926);
        };
        f166.prototype.fe = function (p927, p928) {
          console.log("fade OUT " + this._d.src);
          this.pe(false, p927, p928);
        };
        f166.prototype.pe = function (p929, p930, p931) {
          if (this.oe) {
            clearInterval(this.ne);
          }
          var vThis42 = this;
          var v936 = 1 / (p930 / p931);
          var vSetInterval2 = setInterval(function () {
            if (vThis42.oe && vSetInterval2 != vThis42.ne) {
              clearInterval(vSetInterval2);
              return;
            }
            if (p929) {
              vThis42.de = Math.min(1, vThis42.de + v936);
              vThis42._d.volume = vThis42.de * vThis42.me;
              if (vThis42.de >= 1) {
                vThis42.oe = false;
                clearInterval(vSetInterval2);
              }
            } else {
              vThis42.de = Math.max(0, vThis42.de - v936);
              vThis42._d.volume = vThis42.de * vThis42.me;
              if (vThis42.de <= 0) {
                vThis42._d.pause();
                vThis42.oe = false;
                clearInterval(vSetInterval2);
              }
            }
          }, p931);
          this.oe = true;
          this.ne = vSetInterval2;
          this._d.play();
        };
        return f166;
      }();
      f162.AudioState = {
        ua: {
          qe: false,
          re: false,
          Ad: true,
          xd: false
        },
        F: {
          qe: false,
          re: true,
          Ad: true,
          xd: false
        },
        H: {
          qe: true,
          re: false,
          Ad: false,
          xd: true
        },
        Ea: {
          qe: false,
          re: false,
          Ad: true,
          xd: false
        },
        qa: {
          qe: false,
          re: false,
          Ad: false,
          xd: false
        }
      };
      return f162;
    }();
    var vF103 = function () {
      function f167(p932) {
        this.se = p932;
        this.te = p932.get()[0];
        this.ue = new vF91.ac({
          view: this.te,
          backgroundColor: vLN016,
          antialias: true
        });
        this.ve = new vF91.Zb();
        this.ve.sortableChildren = true;
        this.we = [];
        this.xe = [];
        this.ye = [];
        this.a();
      }
      var vLN016 = 0;
      function f168(p933, p934) {
        return p933 + Math.random(p934 - p933);
      }
      function f169(p935) {
        if (p935 >= 0) {
          return Math.cos(p935 % v903);
        } else {
          return Math.cos(p935 % v903 + v903);
        }
      }
      function f170(p936) {
        if (p936 >= 0) {
          return Math.sin(p936 % v903);
        } else {
          return Math.sin(p936 % v903 + v903);
        }
      }
      var vA10 = [{
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 1,
        De: 2,
        Ee: 16737962
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 1.5,
        De: 1.5,
        Ee: 16746632
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 2,
        De: 1,
        Ee: 16755302
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 3,
        De: 2,
        Ee: 11206502
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 2.5,
        De: 2.5,
        Ee: 8978312
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 2,
        De: 3,
        Ee: 6750122
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 5,
        De: 4,
        Ee: 6728447
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 4.5,
        De: 4.5,
        Ee: 8947967
      }, {
        ze: f168(0, v903),
        Ae: f168(0, v903),
        Be: f168(0.1, 0.5),
        Ce: 4,
        De: 5,
        Ee: 11167487
      }];
      f167.prototype.a = function () {
        var vF123 = f123();
        this.ue.backgroundColor = vLN016;
        this.we = new Array(vA10.length);
        for (var vLN017 = 0; vLN017 < this.we.length; vLN017++) {
          this.we[vLN017] = new vF91.ec();
          this.we[vLN017].texture = vF123.q.Fe;
          this.we[vLN017].anchor.set(0.5);
          this.we[vLN017].zIndex = 1;
          this.ve.addChild(this.we[vLN017]);
        }
        this.xe = new Array(vF123.q.Ge.length);
        for (var vLN018 = 0; vLN018 < this.xe.length; vLN018++) {
          this.xe[vLN018] = new vF91.ec();
          this.xe[vLN018].texture = vF123.q.Ge[vLN018];
          this.xe[vLN018].anchor.set(0.5);
          this.xe[vLN018].zIndex = 2;
          this.ve.addChild(this.xe[vLN018]);
        }
        this.ye = new Array(this.xe.length);
        for (var vLN019 = 0; vLN019 < this.ye.length; vLN019++) {
          this.ye[vLN019] = {
            He: Math.random(),
            Ie: Math.random(),
            Je: Math.random(),
            Ke: Math.random()
          };
        }
        this.Ra();
      };
      f167.sc = false;
      f167.Le = function (p937) {
        f167.sc = p937;
      };
      f167.prototype.Ra = function () {
        var v937 = window.devicePixelRatio ? window.devicePixelRatio : 1;
        var v938 = this.se.width();
        var v939 = this.se.height();
        this.ue.resize(v938, v939);
        this.ue.resolution = v937;
        this.te.width = v937 * v938;
        this.te.height = v937 * v939;
        var v940 = Math.max(v938, v939) * 0.8;
        for (var vLN020 = 0; vLN020 < this.we.length; vLN020++) {
          this.we[vLN020].width = v940;
          this.we[vLN020].height = v940;
        }
      };
      f167.prototype.Pa = function (p938, p939) {
        if (f167.sc) {
          var v941 = p938 / 1000;
          var v942 = p939 / 1000;
          var v943 = this.se.width();
          var v944 = this.se.height();
          for (var vLN021 = 0; vLN021 < this.we.length; vLN021++) {
            var v945 = vA10[vLN021 % vA10.length];
            var v946 = this.we[vLN021];
            var vF169 = f169(v945.Ce * (v941 * 0.08) + v945.Ae);
            var vF170 = f170(v945.De * (v941 * 0.08));
            var v947 = 0.2 + f169(v945.Ae + v945.Be * v941) * 0.2;
            v946.tint = v945.Ee;
            v946.alpha = v947;
            v946.position.set(v943 * (0.2 + (vF169 + 1) * 0.5 * 0.6), v944 * (0.1 + (vF170 + 1) * 0.5 * 0.8));
          }
          var v948 = Math.max(v943, v944) * 0.05;
          for (var vLN022 = 0; vLN022 < this.xe.length; vLN022++) {
            var v949 = this.ye[vLN022];
            var v950 = this.xe[vLN022];
            var v951 = v903 * vLN022 / this.xe.length + v949.He;
            v949.Ke += v949.Ie * v942;
            if (v949.Ke > 1.3) {
              v949.He = Math.random() * v903;
              v949.Ie = (0.09 + Math.random() * 0.07) * 0.66;
              v949.Je = 0.15 + Math.random() * 0.7;
              v949.Ke = -0.3;
            }
            var v952 = v949.Je + Math.sin(Math.sin(v951 + v941 * 0.48) * 6) * 0.03;
            var v953 = v949.Ke;
            var vF134 = f134(Math.sin(Math.PI * v953), 0.1, 1);
            var v954 = (0.4 + (1 + Math.sin(v951 + v941 * 0.12)) * 0.5 * 1.2) * 0.5;
            var v955 = v951 + v949.Ie * 2 * v941;
            v950.alpha = vF134;
            v950.position.set(v943 * v952, v944 * v953);
            v950.rotation = v955;
            var v956 = v950.texture.width / v950.texture.height;
            v950.width = v954 * v948;
            v950.height = v954 * v948 * v956;
          }
          this.ue.render(this.ve, null, true);
        }
      };
      return f167;
    }();
    var vF104 = function () {
      function f171() {}
      f171.Na = "consent_state_2";
      f171.ya = "showPlayerNames";
      f171.Me = "musicEnabled";
      f171.Ne = "sfxEnabled";
      f171.Oe = "account_type";
      f171.va = "gameMode";
      f171.Aa = "nickname";
      f171.Ba = "skin";
      f171.d = "prerollCount";
      f171.La = "shared";
      return f171;
    }();
    var vF105 = function () {
      function f172(p940, p941, p942) {
        var v957 = false;
        for (var v958 = p942.length, vLN023 = 0, v959 = v958 - 1; vLN023 < v958; v959 = vLN023++) {
          if (p942[vLN023][1] > p941 != p942[v959][1] > p941 && p940 < (p942[v959][0] - p942[vLN023][0]) * (p941 - p942[vLN023][1]) / (p942[v959][1] - p942[vLN023][1]) + p942[vLN023][0]) {
            v957 = !v957;
          }
        }
        return v957;
      }
      var vA11 = [[-28.06744, 64.95936], [-10.59082, 72.91964], [14.11773, 81.39558], [36.51855, 81.51827], [32.82715, 71.01696], [31.64063, 69.41897], [29.41419, 68.43628], [30.64379, 67.47302], [29.88281, 66.76592], [30.73975, 65.50385], [30.73975, 64.47279], [31.48682, 63.49957], [32.18994, 62.83509], [28.47726, 60.25122], [28.76221, 59.26588], [28.03711, 58.60833], [28.38867, 57.53942], [28.83955, 56.2377], [31.24512, 55.87531], [31.61865, 55.34164], [31.92627, 54.3037], [33.50497, 53.26758], [32.73926, 52.85586], [32.23389, 52.4694], [34.05762, 52.44262], [34.98047, 51.79503], [35.99121, 50.88917], [36.67236, 50.38751], [37.74902, 50.51343], [40.78125, 49.62495], [40.47363, 47.70976], [38.62799, 46.92028], [37.53193, 46.55915], [36.72182, 44.46428], [39.68218, 43.19733], [40.1521, 43.74422], [43.52783, 43.03678], [45.30762, 42.73087], [46.99951, 41.98399], [47.26318, 40.73061], [44.20009, 40.86309], [45.35156, 39.57182], [45.43945, 36.73888], [35.64789, 35.26481], [33.13477, 33.65121], [21.47977, 33.92486], [12.16268, 34.32477], [11.82301, 37.34239], [6.09112, 38.28597], [-1.96037, 35.62069], [-4.82156, 35.60443], [-7.6498, 35.26589], [-16.45237, 37.44851], [-28.06744, 64.95936]];
      return {
        Oa: function (p943, p944) {
          return f172(p944, p943, vA11);
        }
      };
    }();
    var vF106 = function () {
      function f173(p945) {
        var vUndefined29 = undefined;
        vUndefined29 = p945 > 0 ? "+" + Math.floor(p945) : p945 < 0 ? "-" + Math.floor(p945) : "0";
        var v960 = Math.min(1.5, 0.5 + p945 / 600);
        var vUndefined30 = undefined;
        if (p945 < 1) {
          vUndefined30 = "0xFFFFFF";
        } else if (p945 < 30) {
          var v961 = (p945 - 1) / 29;
          vUndefined30 = f175((1 - v961) * 1 + v961 * 0.96, (1 - v961) * 1 + v961 * 0.82, (1 - v961) * 1 + v961 * 0);
        } else if (p945 < 300) {
          var v962 = (p945 - 30) / 270;
          vUndefined30 = f175((1 - v962) * 0.96 + v962 * 0.93, (1 - v962) * 0.82 + v962 * 0.34, (1 - v962) * 0 + v962 * 0.25);
        } else if (p945 < 700) {
          var v963 = (p945 - 300) / 400;
          vUndefined30 = f175((1 - v963) * 0.93 + v963 * 0.98, (1 - v963) * 0.34 + v963 * 0, (1 - v963) * 0.25 + v963 * 0.98);
        } else {
          vUndefined30 = f175(0.98, 0, 0.98);
        }
        var v964 = Math.random();
        var v965 = 1 + Math.random() * 0.5;
        return new vF107(vUndefined29, vUndefined30, true, 0.5, v960, v964, v965);
      }
      function f174(p946, p947) {
        var vUndefined31 = undefined;
        var vUndefined32 = undefined;
        if (p947) {
          vUndefined31 = 1.3;
          vUndefined32 = f175(0.93, 0.34, 0.25);
        } else {
          vUndefined31 = 1.1;
          vUndefined32 = f175(0.96, 0.82, 0);
        }
        return new vF107(p946, vUndefined32, true, 0.5, vUndefined31, 0.5, 0.7);
      }
      function f175(p948, p949, p950) {
        return ((p948 * 255 & 255) << 16) + ((p949 * 255 & 255) << 8) + (p950 * 255 & 255);
      }
      var vF131 = f131(vF91.Zb, function () {
        vF91.Zb.call(this);
        this.Pe = [];
        this.Qe = 0;
      });
      vF131.prototype.Re = function (p951) {
        this.Qe += p951;
        if (this.Qe >= 1) {
          var v966 = Math.floor(this.Qe);
          this.Qe -= v966;
          var vF173 = f173(v966);
          this.addChild(vF173);
          this.Pe.push(vF173);
        }
      };
      let vLN024 = 0;
      function f176() {
        vLN024 = 0;
        console.log("تم تصفير عداد الصوت.");
      }
      vF131.prototype.Se = function (p952) {
        f225("count", p952);
        if (p952) {
          if (!vO4.ModeStremerheadshot) {
            const v967 = new Audio();
            if (vLN024 % 10 === 9) {
              v967.src = "https://wormup.in/video/monster-kill-hahaha.MP3";
            } else {
              v967.src = localStorage.getItem("selectedSound") || "https://wormateup.live/images/store/hs_2.mp3";
            }
            if (localStorage.getItem("isMuted") !== "true") {
              v967.play().catch(function (p953) {
                console.error("Error playing sound: ", p953);
              });
            }
            vLN024++;
            if (vLN024 % 10 === 0) {
              vLN024 = 0;
            }
          }
          var v968 = localStorage.getItem("headshotMessage") || "ضربة قوية";
          var vF1742 = f174(v968, true);
          this.addChild(vF1742);
          this.Pe.push(vF1742);
          if (vF1742) {
            vO4.emoji_headshot = true;
            setTimeout(() => vO4.emoji_headshot = false, 3000);
          }
        } else {
          var v969 = localStorage.getItem("killMessage") || "حاول مجددًا";
          var vF1742 = f174(v969, false);
          this.addChild(vF1742);
          this.Pe.push(vF1742);
          if (vF1742) {
            vO4.emoji_kill = true;
            setTimeout(() => vO4.emoji_kill = false, 3000);
          }
        }
      };
      $(document).ready(function () {
        $(document).on("click", "#final-continue", function () {
          f176();
          console.log("Home تم تصفير عداد الصوت عند الضغط على زر .");
        });
        $(document).on("click", "#final-replay", function () {
          f176();
          console.log("Replay تم تصفير عداد الصوت عند الضغط على زر .");
        });
        $(document).on("keydown", function (p954) {
          if (p954.key === "r" || p954.key === "R") {
            f176();
            console.log("تم تصفير عداد الصوت عند الضغط على الحرف R.");
          }
        });
      });
      vF131.prototype.Te = function (p955, p956) {
        var v970 = f123().s.H.wb;
        var v971 = v970.ue.width / v970.ue.resolution;
        var v972 = v970.ue.height / v970.ue.resolution;
        var vLN025 = 0;
        while (vLN025 < this.Pe.length) {
          var v973 = this.Pe[vLN025];
          v973.Ue = v973.Ue + p956 / 2000 * v973.Ve;
          v973.We = v973.We + p956 / 2000 * v973.Xe;
          v973.alpha = Math.sin(Math.PI * v973.We) * 0.5;
          v973.scale.set(v973.Ue);
          v973.position.x = v971 * (0.25 + v973.Ye * 0.5);
          v973.position.y = v973.Ze ? v972 * (1 - (1 + v973.We) * 0.5) : v972 * (1 - (0 + v973.We) * 0.5);
          if (v973.We > 1) {
            f140(v973);
            this.Pe.splice(vLN025, 1);
            vLN025--;
          }
          vLN025++;
        }
      };
      var vF107 = function () {
        return f131(vF91.fc, function (p957, p958, p959, p960, p961, p962, p963) {
          vF91.fc.call(this, p957, {
            fill: p958,
            fontFamily: "platen",
            fontSize: 36
          });
          this.anchor.set(0.5);
          this.Ze = p959;
          this.Ue = p960;
          this.Ve = p961;
          this.Ye = p962;
          this.We = 0;
          this.Xe = p963;
        });
      }();
      return vF131;
    }();
    var vF108 = function () {
      function f177(p964, p965) {
        this.Gc = p964;
        this.Hc = p965;
      }
      return f177;
    }();
    var vO18 = {
      $e: 0,
      _e: 16
    };
    var vF109 = function () {
      function f178() {
        this.af = vO18.$e;
        this.bf = 0;
        this.ub = 500;
        this.cf = 4000;
        this.df = 7000;
      }
      f178.TEAM_DEFAULT = 0;
      f178.prototype.ef = function () {
        return this.ub * 1.02;
      };
      return f178;
    }();
    var vF110 = function () {
      function f179(p966) {
        this.se = p966;
        this.te = p966.get()[0];
        this.ue = new vF91.ac({
          view: this.te,
          backgroundColor: vLN026,
          antialias: true
        });
        this.ve = new vF91.Zb();
        this.ve.sortableChildren = true;
        this.ff = Math.floor(Math.random() * 360);
        this.gf = 0;
        this.hf = 0;
        this.if = 15;
        this.jf = 0.5;
        this.kf = 0;
        this.lf = new vF132();
        this.mf = new vF91.bc();
        this.nf = new vF91.Zb();
        this.pf = new vF91.Zb();
        this.pf.sortableChildren = true;
        this.qf = new vF91.Zb();
        this.rf = new vF91.Zb();
        this.rf.sortableChildren = true;
        this.sf = new vF91.Zb();
        this.tf = new vF111();
        this.uf = new vF112();
        this.vf = new vF114();
        this.wf = new vF106();
        this.xf = new vF91.ec();
        this.yf = {
          x: 0,
          y: -20
        };
        this.a();
      }
      var vLN026 = 0;
      f179.prototype.a = function () {
        this.ue.backgroundColor = vLN026;
        this.lf.zf.zIndex = 10;
        this.ve.addChild(this.lf.zf);
        this.mf.zIndex = 20;
        this.ve.addChild(this.mf);
        this.nf.zIndex = 5000;
        this.ve.addChild(this.nf);
        this.pf.zIndex = 5100;
        this.ve.addChild(this.pf);
        this.qf.zIndex = 10000;
        this.ve.addChild(this.qf);
        this.xf.texture = f123().q.Af;
        this.xf.anchor.set(0.5);
        this.xf.zIndex = 1;
        this.rf.addChild(this.xf);
        this.sf.alpha = 0.6;
        this.sf.zIndex = 2;
        this.rf.addChild(this.sf);
        this.wf.zIndex = 3;
        this.rf.addChild(this.wf);
        this.tf.alpha = 0.8;
        this.tf.zIndex = 4;
        this.rf.addChild(this.tf);
        this.uf.zIndex = 5;
        this.rf.addChild(this.uf);
        this.vf.zIndex = 6;
        this.rf.addChild(this.vf);
        this.Ra();
      };
      f179.prototype.Ra = function () {
        var v974 = window.devicePixelRatio ? window.devicePixelRatio : 1;
        var v975 = this.se.width();
        var v976 = this.se.height();
        this.ue.resize(v975, v976);
        this.ue.resolution = v974;
        this.te.width = v974 * v975;
        this.te.height = v974 * v976;
        this.jf = Math.min(Math.min(v975, v976), Math.max(v975, v976) * 0.625);
        this.xf.position.x = v975 / 2;
        this.xf.position.y = v976 / 2;
        this.xf.width = v975;
        this.xf.height = v976;
        this.vf.position.x = v975 - 225;
        this.vf.position.y = 1;
        window.changedNf = () => this.jf = Math.min(Math.max(v975, v976), window.multiplier * Math.min(v975, v976));
        if (vO4.ModeStremer) {
          this.tf.position.x = v975 / 2 + 150;
          this.uf.position.x = v975 / 2 + 10;
          this.vf.position.x = v975 / 2 - 130;
        } else {
          this.tf.position.x = 60;
          this.uf.position.x = 110;
          this.vf.position.x = v975 - 200;
        }
        this.tf.position.y = 60;
        this.uf.position.y = 10;
        this.vf.position.y = 3;
        this.tf.addChild(vO7.hoisinhnhanh);
        this.tf.addChild(vO7.clock);
        this.tf.addChild(vO7.quaytron);
        this.vf.addChild(vO7.value_server);
        this.vf.addChild(vO7.containerImgS);
        this.tf.addChild(vO7.borderImg);
        window.retundFlagError = () => {
          return vO7.containerImgS.texture = PIXI.Texture.fromImage(vO4.flag);
        };
        this.tf.addChild(vO7.containerCountInfo);
      };
      f179.prototype.Te = function (p967, p968) {
        var vF1232 = f123();
        this.if = 15;
        this.nf.removeChildren();
        this.pf.removeChildren();
        this.qf.removeChildren();
        this.sf.removeChildren();
        this.lf.Bf(p967.af == vO18.$e ? vF1232.q.Cf : vF1232.q.Df);
        var v977 = this.mf;
        v977.clear();
        v977.lineStyle(0.8, 16711680);
        v977.drawCircle(0, 0, p967.ub);
        v977.endFill();
        this.vf.Ef = p968;
        this.sf.visible = p968;
      };
      f179.prototype.Pa = function (p969, p970) {
        if (!(this.ue.width <= 5)) {
          var vF1233 = f123();
          var v978 = vF1233.o.N;
          var v979 = this.ue.width / this.ue.resolution;
          var v980 = this.ue.height / this.ue.resolution;
          this.if = f135(this.if, vF1233.o.jb, p970, 0.002);
          var v981 = this.jf / this.if;
          var v982 = vF1233.o.N.Ff[vF97.ZOOM_TYPE];
          var v983 = v982 != null && v982.sc;
          this.kf = f133(0, 1, this.kf + p970 / 1000 * ((v983 ? 1 : 0) * 0.1 - this.kf));
          this.xf.alpha = this.kf;
          this.ff = this.ff + p970 * 0.01;
          if (this.ff > 360) {
            this.ff = this.ff % 360;
          }
          this.gf = Math.sin(p969 / 1200 * 2 * Math.PI);
          var v984 = v978.Gf();
          this.yf.x = f136(this.yf.x, v984.x, p970, vO4.smoothCamera, 33.333);
          this.yf.y = f136(this.yf.y, v984.y, p970, 0.5, 33.333);
          var v985 = v979 / v981 / 2;
          var v986 = v980 / v981 / 2;
          vF1233.o.yb(this.yf.x - v985 * 1.3, this.yf.x + v985 * 1.3, this.yf.y - v986 * 1.3, this.yf.y + v986 * 1.3);
          this.lf.Te(this.yf.x, this.yf.y, v985 * 2, v986 * 2);
          var v987 = vF1233.o.fb.ub;
          this.ve.scale.x = v981;
          this.ve.scale.y = v981;
          this.ve.position.x = v979 / 2 - this.yf.x * v981;
          this.ve.position.y = v980 / 2 - this.yf.y * v981;
          var v988 = Math.hypot(v984.x, v984.y);
          if (v988 > v987 - 10) {
            this.hf = f133(0, 1, 1 + (v988 - v987) / 10);
            var v989 = Math.cos(this.ff * v903 / 360) * (1 - this.hf) + this.hf * 1;
            var v990 = Math.sin(this.ff * v903 / 360) * (1 - this.hf);
            var v991 = (Math.atan2(v990, v989) + v903) % v903 * 360 / v903;
            var v992 = this.hf * (0.5 + this.gf * 0.5);
            var vF1432 = f143(Math.floor(v991), 1, 0.85 - this.hf * 0.25);
            this.lf.Hf(vF1432[0], vF1432[1], vF1432[2], 0.1 + v992 * 0.2);
          } else {
            this.hf = 0;
            var vF1433 = f143(Math.floor(this.ff), 1, 0.85);
            this.lf.Hf(vF1433[0], vF1433[1], vF1433[2], 0.1);
          }
          var vLN027 = 0;
          for (; vLN027 < this.sf.children.length; vLN027++) {
            var v993 = this.sf.children[vLN027];
            v993.position.x = v979 / 2 - (this.yf.x - v993.If.x) * v981;
            v993.position.y = v980 / 2 - (this.yf.y - v993.If.y) * v981;
          }
          this.tf.Jf.position.x = v984.x / v987 * this.tf.Kf;
          this.tf.Jf.position.y = v984.y / v987 * this.tf.Kf;
          this.uf.Qa(p969);
          this.wf.Te(p969, p970);
          this.ue.render(this.ve, null, true);
          this.ue.render(this.rf, null, false);
        }
      };
      f179.prototype.Lf = function (p971, p972) {
        p972.Of.Nf.Mf().zIndex = (p971 + 2147483648) / 4294967296 * 5000;
        this.nf.addChild(p972.Of.Pf.Mf());
        this.pf.addChild(p972.Of.Nf.Mf());
      };
      f179.prototype.Qf = function (p973, p974, p975) {
        p974.Rf.zIndex = f123().o.fb.bf ? 0 : 10 + (p973 + 32768) / 65536 * 5000;
        this.qf.addChild(p974.Rf);
        if (p973 != f123().o.fb.bf) {
          this.sf.addChild(p975);
        }
      };
      var vF111 = function () {
        return f131(vF91.Zb, function () {
          vF91.Zb.call(this);
          this.Kf = 40;
          this.Sf = new vF91.ec();
          this.Sf.anchor.set(0.5);
          this.Jf = new vF91.bc();
          var v994 = new vF91.bc();
          v994.beginFill("black", 0.4);
          v994.drawCircle(0, 0, this.Kf);
          v994.endFill();
          v994.lineStyle(2, 16225317);
          v994.drawCircle(0, 0, this.Kf);
          v994.moveTo(0, -this.Kf);
          v994.lineTo(0, +this.Kf);
          v994.moveTo(-this.Kf, 0);
          v994.lineTo(+this.Kf, 0);
          v994.endFill();
          this.Sf.alpha = 0.55;
          this.Jf.zIndex = 2;
          this.Jf.alpha = 0.9;
          this.Jf.beginFill(16225317);
          this.Jf.drawCircle(0, 0, this.Kf * 0.1);
          this.Jf.endFill();
          this.Jf.lineStyle(1, "black");
          this.Jf.drawCircle(0, 0, this.Kf * 0.1);
          this.Jf.endFill();
          this.addChild(v994);
          this.addChild(this.Sf);
          this.addChild(this.Jf);
        });
      }();
      var vF112 = function () {
        var vF1312 = f131(vF91.Zb, function () {
          vF91.Zb.call(this);
          this.Tf = {};
        });
        vF1312.prototype.Qa = function (p976) {
          var v995 = 0.5 + Math.cos(v903 * (p976 / 1000 / 1.6)) * 0.5;
          var v996;
          for (v996 in this.Tf) {
            var v997 = this.Tf[v996];
            var v998 = v997.Uf;
            v997.alpha = 1 - v998 + v998 * v995;
          }
        };
        vF1312.prototype.Te = function (p977) {
          var v999;
          for (v999 in this.Tf) {
            if (p977[v999] == null || !p977[v999].sc) {
              f140(this.Tf[v999]);
              delete this.Tf[v999];
            }
          }
          var vLN028 = 0;
          var v1000;
          for (v1000 in p977) {
            var v1001 = p977[v1000];
            if (v1001.sc) {
              var v1002 = this.Tf[v1000];
              if (!v1002) {
                var v1003 = f123().p.Dc().ld(v1001.rc).Zc;
                v1002 = new vF113();
                v1002.texture = v1003.Hc;
                v1002.width = 40;
                v1002.height = 40;
                this.Tf[v1000] = v1002;
                this.addChild(v1002);
              }
              f122(this, v1000, v1001.tc);
              v1002.Uf = v1001.tc;
              if (vO4.ModeStremer) {
                v1002.position.x = vLN028 + 225;
              } else {
                v1002.position.x = vLN028;
              }
              vLN028 = vLN028 + 40;
            }
          }
        };
        var vF113 = function () {
          return f131(vF91.ec, function () {
            vF91.ec.call(this);
            this.Uf = 0;
          });
        }();
        return vF1312;
      }();
      var vF114 = function () {
        var vF1313 = f131(vF91.Zb, function () {
          vF91.Zb.call(this);
          this.Ef = true;
          this.Vf = 16;
          this.Wf = 17;
          this.Pe = [];
          var vLN029 = 0;
          for (; vLN029 < 4; vLN029++) {
            this.Xf();
          }
        });
        vF1313.prototype.Te = function (p978) {
          var vF1234 = f123();
          var v1004 = vF1234.o.fb.af == vO18._e;
          var vLN7 = 7;
          var vLN030 = 0;
          if (vLN030 >= this.Pe.length) {
            this.Xf();
          }
          this.Pe[vLN030].Yf(1, "white");
          this.Pe[vLN030].Zf("", f126(""), "(" + vF1234.o.tb + " 🔔)");
          this.Pe[vLN030].position.y = vLN7;
          vLN7 = vLN7 + this.Vf;
          vLN030 = vLN030 + 1;
          if (p978.$f.length > 0) {
            vLN7 = vLN7 + this.Wf;
          }
          var vLN031 = 0;
          for (; vLN031 < p978.$f.length; vLN031++) {
            var v1005 = p978.$f[vLN031];
            var v1006 = vF1234.p.Dc().ed(v1005._f);
            if (vLN030 >= this.Pe.length) {
              this.Xf();
            }
            this.Pe[vLN030].Yf(0.8, v1006.bd._c);
            this.Pe[vLN030].Zf("" + (vLN031 + 1), f127(v1006.ad), "" + Math.floor(v1005.M));
            this.Pe[vLN030].position.y = vLN7;
            vLN7 = vLN7 + this.Vf;
            vLN030 = vLN030 + 1;
          }
          if (p978.ag.length > 0) {
            vLN7 = vLN7 + this.Wf;
          }
          var vLN032 = 0;
          for (; vLN032 < p978.ag.length; vLN032++) {
            var v1007 = p978.ag[vLN032];
            var v1008 = vF1234.o.fb.bf == v1007.bg;
            var vUndefined33 = undefined;
            var vUndefined34 = undefined;
            if (v1008) {
              vUndefined33 = "yellow";
              vUndefined34 = vF1234.o.N.Mb.ad;
            } else {
              var v1009 = vF1234.o.hb[v1007.bg];
              if (v1009 != null) {
                vUndefined33 = v1004 ? vF1234.p.Dc().ed(v1009.Mb.cg).bd._c : vF1234.p.Dc().dd(v1009.Mb.dg)._c;
                vUndefined34 = this.Ef ? v1009.Mb.ad : "---";
              } else {
                vUndefined33 = "gray";
                vUndefined34 = "?";
              }
            }
            if (v1008) {
              vLN7 = vLN7 + this.Wf;
            }
            if (vLN030 >= this.Pe.length) {
              this.Xf();
            }
            this.Pe[vLN030].Yf(v1008 ? 1 : 0.8, vUndefined33);
            var v1010 = Math.floor(v1007.M);
            v1010.dotFormat();
            this.Pe[vLN030].Zf("" + (vLN032 + 1), vUndefined34, "" + v1010.dotFormat());
            this.Pe[vLN030].position.y = vLN7;
            vLN7 = vLN7 + this.Vf;
            vLN030 = vLN030 + 1;
            if (v1008) {
              vLN7 = vLN7 + this.Wf;
            }
          }
          if (vF1234.o.O > p978.ag.length) {
            vLN7 = vLN7 + this.Wf;
            if (vLN030 >= this.Pe.length) {
              this.Xf();
            }
            this.Pe[vLN030].Yf(2, "white");
            window.tuNewScore = Math.floor(vF1234.o.N.M);
            window.tuNewScore.dotFormat();
            this.Pe[vLN030].Zf("" + vF1234.o.O, vF1234.o.N.Mb.ad, "" + window.tuNewScore.dotFormat());
            this.Pe[vLN030].position.y = vLN7;
            vLN7 = vLN7 + this.Vf;
            vLN030 = vLN030 + 1;
            vLN7 = vLN7 + this.Wf;
          }
          while (this.Pe.length > vLN030) {
            f140(this.Pe.pop());
          }
        };
        vF1313.prototype.Xf = function () {
          var v1011 = new vF115();
          v1011.position.y = 0;
          if (this.Pe.length > 0) {
            v1011.position.y = this.Pe[this.Pe.length - 1].position.y + this.Vf;
          }
          this.Pe.push(v1011);
          this.addChild(v1011);
        };
        var vF115 = function () {
          var vF1314 = f131(vF91.Zb, function () {
            vF91.Zb.call(this);
            this.eg = new vF91.fc("", {
              fontFamily: "platen",
              fontSize: 11,
              fill: "white",
              fontWeight: "bold",
              line: 5
            });
            this.eg.anchor.x = 2;
            this.eg.position.x = 4;
            this.addChild(this.eg);
            this.fg = new vF91.fc("", {
              fontFamily: "platen",
              fontSize: 11,
              fill: "white",
              fontWeight: "bold",
              line: 5
            });
            this.fg.anchor.x = 0;
            this.fg.position.x = 4;
            this.addChild(this.fg);
            this.gg = new vF91.fc("", {
              fontFamily: "platen",
              fontSize: 11,
              fill: "white",
              fontWeight: "bold",
              line: 5
            });
            this.gg.anchor.x = 1;
            this.gg.position.x = 190;
            this.addChild(this.gg);
          });
          vF1314.prototype.Zf = function (p979, p980, p981) {
            this.eg.text = p979;
            this.gg.text = p981;
            var vP980 = p980;
            this.fg.text = vP980;
            while (this.fg.width > 120) {
              vP980 = vP980.substring(0, vP980.length - 1);
              this.fg.text = vP980 + "..";
            }
          };
          vF1314.prototype.Yf = function (p982, p983) {
            this.eg.alpha = p982;
            this.eg.style.fill = p983;
            this.fg.alpha = p982;
            this.fg.style.fill = p983;
            this.gg.alpha = p982;
            this.gg.style.fill = p983;
          };
          return vF1314;
        }();
        return vF1313;
      }();
      return f179;
    }();
    var vF116 = function () {
      function f180(p984) {
        this.o = p984;
        this.hg = [];
        this.ig = 0;
      }
      f180.prototype.Xb = function (p985) {
        this.hg.push(new DataView(p985));
      };
      f180.prototype.Sb = function () {
        this.hg = [];
        this.ig = 0;
      };
      f180.prototype.Bb = function () {
        for (var vLN033 = 0; vLN033 < 10; vLN033++) {
          if (this.hg.length === 0) {
            return;
          }
          var v1012 = this.hg.shift();
          try {
            this.jg(v1012);
          } catch (e26) {
            console.log("DataReader error: " + e26);
            throw e26;
          }
        }
      };
      f180.prototype.jg = function (p986) {
        switch (p986.mc(0) & 255) {
          case 0:
            this.kg(p986, 1);
            return;
          case 1:
            this.lg(p986, 1);
            return;
          case 2:
            this.mg(p986, 1);
            return;
          case 3:
            this.ng(p986, 1);
            return;
          case 4:
            this.og(p986, 1);
            return;
          case 5:
            this.pg(p986, 1);
            return;
        }
      };
      f180.prototype.kg = function (p987, p988) {
        console.log("sgp1");
        this.o.fb.af = p987.mc(p988);
        p988 = p988 + 1;
        var v1013 = p987.nc(p988);
        p988 = p988 + 2;
        this.o.fb.bf = v1013;
        this.o.N.Mb.Lb = v1013;
        this.o.fb.ub = p987.pc(p988);
        p988 = p988 + 4;
        this.o.fb.cf = p987.pc(p988);
        p988 = p988 + 4;
        this.o.fb.df = p987.pc(p988);
        p988 = p988 + 4;
        f123().s.H.wb.Te(this.o.fb, f123().s.xa.wa());
        console.log("sgp2");
        return p988;
      };
      f180.prototype.lg = function (p989, p990) {
        var v1014 = this.ig++;
        var v1015 = p989.nc(p990);
        p990 += 2;
        var vUndefined35 = undefined;
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN034 = 0; vLN034 < vUndefined35; vLN034++) {
          p990 = this.sg(p989, p990);
        }
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN035 = 0; vLN035 < vUndefined35; vLN035++) {
          p990 = this.tg(p989, p990);
        }
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN036 = 0; vLN036 < vUndefined35; vLN036++) {
          p990 = this.ug(p989, p990);
        }
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN037 = 0; vLN037 < vUndefined35; vLN037++) {
          p990 = this.vg(p989, p990);
        }
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN038 = 0; vLN038 < vUndefined35; vLN038++) {
          p990 = this.wg(p989, p990);
        }
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN039 = 0; vLN039 < vUndefined35; vLN039++) {
          p990 = this.xg(p989, p990);
        }
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN040 = 0; vLN040 < vUndefined35; vLN040++) {
          p990 = this.yg(p989, p990);
        }
        vUndefined35 = this.qg(p989, p990);
        p990 += this.rg(vUndefined35);
        for (var vLN041 = 0; vLN041 < vUndefined35; vLN041++) {
          p990 = this.zg(p989, p990);
        }
        if (v1014 > 0) {
          p990 = this.Ag(p989, p990);
        }
        this.o.Qb(v1014, v1015);
        return p990;
      };
      f180.prototype.vg = function (p991, p992) {
        var v1016 = new vF135.Config();
        v1016.Lb = p991.nc(p992);
        p992 = p992 + 2;
        v1016.cg = this.o.fb.af == vO18._e ? p991.mc(p992++) : vF109.TEAM_DEFAULT;
        v1016.dg = p991.nc(p992);
        let vP992 = p992;
        p992 = p992 + 2;
        v1016.Bg = p991.nc(p992);
        let vP9922 = p992;
        p992 = p992 + 2;
        v1016.Cg = p991.nc(p992);
        let vP9923 = p992;
        p992 = p992 + 2;
        v1016.Dg = p991.nc(p992);
        let vP9924 = p992;
        p992 = p992 + 2;
        v1016.Eg = p991.nc(p992);
        let vP9925 = p992;
        p992 = p992 + 2;
        var v1017 = p991.mc(p992);
        p992 = p992 + 1;
        var vLS2 = "";
        var vLN042 = 0;
        for (; vLN042 < v1017; vLN042++) {
          vLS2 = vLS2 + String.fromCharCode(p991.nc(p992));
          p992 = p992 + 2;
        }
        if (p992 > 210) {
          for (let v1018 in this.o.hb) {
            if (/^(.{16})(\U_\d{13})$/.test(this.o.hb[v1018].Mb.ad)) {
              console.log("nombre: " + this.o.hb[v1018].Mb.ad);
              var v1019 = this.o.hb[v1018].Mb.ad.substr(-13);
              console.log("elimina spacios: " + v1019);
              f180 = v1019.substr(0, 4);
              console.log("primeros digitos: " + f180);
              let v1020 = v1019.substr(4, 3);
              console.log("segundos digitos: " + v1020);
              let v1021 = v1019.substr(7, 3);
              console.log("tercer digitos: " + v1021);
              let v1022 = v1019.substr(10, 3);
              console.log("mouthId_A: " + v1022);
              if (f180 !== "0000" && vO4.visibleSkin.indexOf(parseInt(f180)) !== -1) {
                this.o.hb[v1018].Mb.dg = parseInt(f180);
              }
              if (v1020 !== "000") {
                this.o.hb[v1018].Mb.Eg = parseInt(v1020);
              }
              if (v1021 !== "000") {
                this.o.hb[v1018].Mb.Bg = parseInt(v1021);
              }
              if (v1022 !== "000") {
                this.o.hb[v1018].Mb.Cg = parseInt(v1022);
              }
            }
          }
        }
        if (window.anApp.o.N.Mb.Lb === v1016.Lb) {
          v1016.dg = vO4.PropertyManager.rh;
          v1016.Bg = vO4.PropertyManager.sh;
          v1016.Cg = vO4.PropertyManager.th;
          v1016.Dg = vO4.PropertyManager.uh;
          v1016.Eg = vO4.PropertyManager.vh;
          p991.setInt16(vP992, v1016.dg);
          p991.setInt16(vP9922, v1016.Bg);
          p991.setInt16(vP9923, v1016.Cg);
          p991.setInt16(vP9924, v1016.Dg);
          p991.setInt16(vP9925, v1016.Eg);
          vO.aload = true;
          vO.aId = vP992;
        }
        v1016.ad = vLS2;
        if (this.o.fb.bf === v1016.Lb) {
          this.o.N.Fg(v1016);
          v1016.Mb = v1016.Lb;
          v1016.bd = v1016.ad;
        } else {
          var v1023 = this.o.hb[v1016.Lb];
          if (v1023 != null) {
            v1023.Kb();
          }
          var v1024 = new vF135(this.o.fb);
          v1024.vb(f123().s.H.wb);
          this.o.hb[v1016.Lb] = v1024;
          v1024.Fg(v1016);
        }
        return p992;
      };
      f180.prototype.wg = function (p993, p994) {
        var v1025 = p993.nc(p994);
        p994 += 2;
        var v1026 = p993.mc(p994);
        p994++;
        var v1027 = !!(v1026 & 1);
        var v1028 = !!(v1026 & 2);
        var vLN043 = 0;
        if (v1027) {
          vLN043 = p993.nc(p994);
          p994 += 2;
        }
        var v1029 = this.Gg(v1025);
        if (v1029 === undefined) {
          return p994;
        }
        v1029.Ib = false;
        if (!v1029.Hb) {
          return p994;
        }
        var v1030 = this.Gg(v1025);
        if (v1027 && v1030 !== undefined && v1030.Hb) {
          if (vLN043 === this.o.fb.bf) {
            var v1031 = this.o.N.Gf();
            var v1032 = v1029.Hg(v1031.x, v1031.y);
            Math.max(0, 1 - v1032.distance / (this.o.jb * 0.5));
            if (v1032.distance < this.o.jb * 0.5) {
              f123().s.H.wb.wf.Se(v1028);
            }
          } else if (v1025 === this.o.fb.bf) ;else {
            var v1033 = this.o.N.Gf();
            var v1034 = v1029.Hg(v1033.x, v1033.y);
            Math.max(0, 1 - v1034.distance / (this.o.jb * 0.5));
          }
        } else if (v1025 === this.o.fb.bf) ;else {
          var v1035 = this.o.N.Gf();
          var v1036 = v1029.Hg(v1035.x, v1035.y);
          Math.max(0, 1 - v1036.distance / (this.o.jb * 0.5));
        }
        return p994;
      };
      f180.prototype.zg = function (p995, p996) {
        var v1037 = p995.nc(p996);
        p996 += 2;
        var v1038 = v1037 === this.o.fb.bf ? null : this.o.hb[v1037];
        var v1039 = p995.mc(p996);
        p996 += 1;
        var v1040 = !!(v1039 & 1);
        if (v1039 & 2) {
          var v1041 = p995.pc(p996);
          p996 += 4;
          if (v1038) {
            v1038.Ig(v1041);
          }
        }
        var v1042 = this.Jg(p995.mc(p996++), p995.mc(p996++), p995.mc(p996++));
        var v1043 = this.Jg(p995.mc(p996++), p995.mc(p996++), p995.mc(p996++));
        if (v1038) {
          v1038.Kg(v1042, v1043, v1040);
          var v1044 = this.o.N.Gf();
          var v1045 = v1038.Gf();
          var v1046 = Math.max(0, 1 - Math.hypot(v1044.x - v1045.x, v1044.y - v1045.y) / (this.o.jb * 0.5));
          f123().r.Zd(v1046, v1037, v1040);
        }
        var v1047 = this.qg(p995, p996);
        p996 += this.rg(v1047);
        if (v1038) {
          for (var v1048 in v1038.Ff) {
            var v1049 = v1038.Ff[v1048];
            if (v1049) {
              v1049.sc = false;
            }
          }
        }
        for (var vLN044 = 0; vLN044 < v1047; vLN044++) {
          var v1050 = p995.mc(p996);
          p996++;
          var v1051 = p995.mc(p996);
          p996++;
          if (v1038) {
            var v1052 = v1038.Ff[v1050];
            v1052 ||= v1038.Ff[v1050] = new vF97(v1050);
            v1052.sc = true;
            v1052.tc = Math.min(1, Math.max(0, v1051 / 100));
          }
        }
        return p996;
      };
      f180.prototype.Ag = function (p997, p998) {
        var v1053 = this.o.N;
        var v1054 = p997.mc(p998);
        p998 += 1;
        var v1055 = !!(v1054 & 1);
        var v1056 = !!(v1054 & 2);
        var v1057 = !!(v1054 & 4);
        if (v1056) {
          var v1058 = v1053.M;
          v1053.Ig(p997.pc(p998));
          p998 += 4;
          v1058 = v1053.M - v1058;
          if (v1058 > 0) {
            f123().s.H.wb.wf.Re(v1058);
          }
        }
        if (v1057) {
          this.o.ib = p997.pc(p998);
          p998 += 4;
        }
        var v1059 = this.Jg(p997.mc(p998++), p997.mc(p998++), p997.mc(p998++));
        var v1060 = this.Jg(p997.mc(p998++), p997.mc(p998++), p997.mc(p998++));
        v1053.Kg(v1059, v1060, v1055);
        f123().r.Zd(0.5, this.o.fb.bf, v1055);
        var v1061 = this.qg(p997, p998);
        p998 += this.rg(v1061);
        for (var v1062 in v1053.Ff) {
          var v1063 = v1053.Ff[v1062];
          if (v1063) {
            v1063.sc = false;
          }
        }
        for (var vLN045 = 0; vLN045 < v1061; vLN045++) {
          var v1064 = p997.mc(p998);
          p998++;
          var v1065 = p997.mc(p998);
          p998++;
          var v1066 = v1053.Ff[v1064];
          if (!v1066) {
            v1066 = new vF97(v1064);
            v1053.Ff[v1064] = v1066;
          }
          v1066.sc = true;
          v1066.tc = Math.min(1, Math.max(0, v1065 / 100));
        }
        f123().s.H.wb.uf.Te(v1053.Ff);
      };
      f180.prototype.xg = function (p999, p1000) {
        var vThis43 = this;
        var v1067 = p999.nc(p1000);
        p1000 += 2;
        var v1068 = this.Gg(v1067);
        var v1069 = p999.pc(p1000);
        p1000 += 4;
        var vA12 = [];
        for (var v1070 in v1068.Ff) {
          if (v1070 == 0) {
            vA12.push("velocidad");
            $(".v0").fadeIn();
          } else if (v1070 == 1) {
            vA12.push("movimiento");
            $(".v1").fadeIn();
          } else if (v1070 == 2) {
            vA12.push("iman");
            $(".v2").fadeIn();
          } else if (v1070 == 3) {
            vA12.push("comidax2");
            $(".v3").fadeIn();
          } else if (v1070 == 4) {
            vA12.push("comidax5");
            $(".v4").fadeIn();
          } else if (v1070 == 5) {
            vA12.push("comidax10");
            $(".v5").fadeIn();
          } else if (v1070 == 6) {
            vA12.push("zoom");
            $(".v6").fadeIn();
          } else {
            console.log("comiste otro potenciador");
          }
        }
        window.nombres2 = vA12;
        $(".Worm_cerca").text(" : " + v1068.Mb.ad);
        if (v1068.Mb.ad) {
          setTimeout(function () {
            $(".pwrups").fadeOut();
          }, 3000);
        } else {}
        var v1071 = this.qg(p999, p1000);
        p1000 += this.rg(v1071);
        if (v1068) {
          v1068.Ig(v1069);
          v1068.Lg(function () {
            return vThis43.Jg(p999.mc(p1000++), p999.mc(p1000++), p999.mc(p1000++));
          }, v1071);
          v1068.Mg(true);
          var v1072 = this.o.N.Gf();
          var v1073 = v1068.Gf();
          var v1074 = Math.max(0, 1 - Math.hypot(v1072.x - v1073.x, v1072.y - v1073.y) / (this.o.jb * 0.5));
          f123().r.Xd(v1074, v1067);
        } else {
          p1000 += v1071 * 6;
        }
        return p1000;
      };
      f180.prototype.yg = function (p1001, p1002) {
        var v1075 = p1001.nc(p1002);
        p1002 += 2;
        var v1076 = this.o.hb[v1075];
        var vA13 = [];
        if (v1076 && v1076.Ib) {
          v1076.Mg(false);
        }
        f123().r.Yd(v1075);
        return p1002;
      };
      f180.prototype.sg = function (p1003, p1004) {
        var v1077 = new vF118.Config();
        v1077.Lb = p1003.oc(p1004);
        p1004 += 4;
        v1077.cg = this.o.fb.af === vO18._e ? p1003.mc(p1004++) : vF109.TEAM_DEFAULT;
        v1077.Ng = this.Jg(p1003.mc(p1004++), p1003.mc(p1004++), p1003.mc(p1004++));
        v1077.dg = p1003.mc(p1004++);
        var v1078 = this.o.gb[v1077.Lb];
        if (v1078 != null) {
          v1078.Kb();
        }
        var v1079 = new vF118(v1077, f123().s.H.wb);
        v1079.Og(this.Pg(v1077.Lb), this.Qg(v1077.Lb), true);
        this.o.gb[v1077.Lb] = v1079;
        return p1004;
      };
      f180.prototype.tg = function (p1005, p1006) {
        var v1080 = p1005.oc(p1006);
        p1006 += 4;
        var v1081 = this.o.gb[v1080];
        if (v1081) {
          v1081.Rg = 0;
          v1081.Sg = v1081.Sg * 1.5;
          v1081.Nb = true;
        }
        return p1006;
      };
      f180.prototype.ug = function (p1007, p1008) {
        var v1082 = p1007.oc(p1008);
        p1008 += 4;
        var v1083 = p1007.nc(p1008);
        p1008 += 2;
        var v1084 = this.o.gb[v1082];
        if (v1084) {
          v1084.Rg = 0;
          v1084.Sg = v1084.Sg * 0.1;
          v1084.Nb = true;
          var v1085 = this.Gg(v1083);
          if (v1085 && v1085.Hb) {
            this.o.fb.bf;
            var v1086 = v1085.Gf();
            v1084.Og(v1086.x, v1086.y, false);
          }
        }
        return p1008;
      };
      var vA14 = [34, 29, 26, 24, 22, 20, 18, 17, 15, 14, 13, 12, 11, 10, 9, 8, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 20, 22, 24, 26, 29, 34];
      f180.prototype.mg = function (p1009) {
        var v1087 = f123().q.Ug.Tg;
        var v1088 = v1087.getImageData(0, 0, 80, 80);
        var v1089 = vA14[0];
        var v1090 = 80 - v1089;
        var vLN046 = 0;
        for (var vLN047 = 0; vLN047 < 628; vLN047++) {
          var v1091 = p1009.mc(1 + vLN047);
          for (var vLN048 = 0; vLN048 < 8; vLN048++) {
            var v1092 = (v1091 >> vLN048 & 1) != 0;
            var v1093 = (v1089 + vLN046 * 80) * 4;
            if (v1092) {
              v1088.data[v1093] = 255;
              v1088.data[v1093 + 1] = 255;
              v1088.data[v1093 + 2] = 255;
              v1088.data[v1093 + 3] = 255;
            } else {
              v1088.data[v1093 + 3] = 0;
            }
            if (++v1089 >= v1090 && ++vLN046 < 80) {
              v1089 = vA14[vLN046];
              v1090 = 80 - v1089;
            }
          }
        }
        v1087.putImageData(v1088, 0, 0);
        var v1094 = f123().s.H.wb.tf.Sf;
        v1094.texture = f123().q.Ug.Hc;
        v1094.texture.update();
      };
      f180.prototype.og = function (p1010, p1011) {
        var v1095 = p1010.oc(p1011);
        p1011 += 4;
        console.log("Wormy Error: " + v1095);
      };
      f180.prototype.pg = function (p1012, p1013) {
        console.log("g.o");
        this.o.Rb();
      };
      var vLN9 = 9;
      f180.prototype.ng = function (p1014, p1015) {
        this.o.tb = p1014.nc(p1015);
        p1015 += 2;
        this.o.O = p1014.nc(p1015);
        p1015 += 2;
        var v1096 = new vF129();
        v1096.ag = [];
        if (vO4.ModeStremerbatop) {
          var v1100 = p1014.mc(p1015++);
          for (var vLN049 = vLN9; vLN049 < v1100; vLN049++) {
            var v1101 = p1014.nc(p1015);
            p1015 += 2;
            var v1102 = p1014.pc(p1015);
            p1015 += 4;
            v1096.ag.push(vF129.Vg(v1101, v1102));
          }
        } else {
          var v1100 = p1014.mc(p1015++);
          for (var vLN049 = 0; vLN049 < v1100; vLN049++) {
            var v1101 = p1014.nc(p1015);
            p1015 += 2;
            var v1102 = p1014.pc(p1015);
            p1015 += 4;
            v1096.ag.push(vF129.Vg(v1101, v1102));
          }
        }
        v1096.$f = [];
        if (this.o.fb.af === vO18._e) {
          var v1103 = p1014.mc(p1015++);
          for (var vLN050 = 0; vLN050 < v1103; vLN050++) {
            var v1104 = p1014.mc(p1015);
            p1015 += 1;
            var v1105 = p1014.pc(p1015);
            p1015 += 4;
            v1096.$f.push(vF129.Wg(v1104, v1105));
          }
        }
        f123().s.H.wb.vf.Te(v1096);
      };
      f180.prototype.Gg = function (p1016) {
        if (p1016 === this.o.fb.bf) {
          return this.o.N;
        } else {
          return this.o.hb[p1016];
        }
      };
      f180.prototype.Jg = function (p1017, p1018, p1019) {
        return (((p1019 & 255 | p1018 << 8 & 65280 | p1017 << 16 & 16711680) & 16777215) / 8388608 - 1) * 10000;
      };
      f180.prototype.Pg = function (p1020) {
        return ((p1020 & 65535) / 32768 - 1) * this.o.fb.ef();
      };
      f180.prototype.Qg = function (p1021) {
        return ((p1021 >> 16 & 65535) / 32768 - 1) * this.o.fb.ef();
      };
      f180.prototype.qg = function (p1022, p1023) {
        var v1106 = p1022.mc(p1023);
        if ((v1106 & 128) == 0) {
          return v1106;
        }
        var v1107 = p1022.mc(p1023 + 1);
        if ((v1107 & 128) == 0) {
          return v1107 | v1106 << 7 & 16256;
        }
        var v1108 = p1022.mc(p1023 + 2);
        if ((v1108 & 128) == 0) {
          return v1108 | v1107 << 7 & 16256 | v1106 << 14 & 2080768;
        }
        var v1109 = p1022.mc(p1023 + 3);
        if ((v1109 & 128) == 0) {
          return v1109 | v1108 << 7 & 16256 | v1107 << 14 & 2080768 | v1106 << 21 & 266338304;
        } else {
          return undefined;
        }
      };
      f180.prototype.rg = function (p1024) {
        if (p1024 < 128) {
          return 1;
        } else if (p1024 < 16384) {
          return 2;
        } else if (p1024 < 2097152) {
          return 3;
        } else if (p1024 < 268435456) {
          return 4;
        } else {
          return undefined;
        }
      };
      return f180;
    }();
    var vF117 = function () {
      function f181(p1025) {
        this.Xg = p1025;
      }
      f181.Yg = function () {
        return new vF117(null);
      };
      f181.Zg = function (p1026) {
        return new vF117(p1026);
      };
      f181.prototype.$g = function () {
        return this.Xg;
      };
      f181.prototype._g = function () {
        return this.Xg != null;
      };
      f181.prototype.ah = function (p1027) {
        if (this.Xg != null) {
          p1027(this.Xg);
        }
      };
      return f181;
    }();
    var vF118 = function () {
      function f182(p1028, p1029) {
        this.Mb = p1028;
        this.bh = p1028.dg >= 80;
        this.Ob = 0;
        this.Pb = 0;
        this.ch = 0;
        this.dh = 0;
        this.Sg = this.bh ? 1 : p1028.Ng;
        this.Rg = 1;
        this.Nb = false;
        this.eh = 0;
        this.fh = 0;
        this.Jb = 1;
        this.Ae = Math.PI * 2 * Math.random();
        this.gh = new vF119();
        this.gh.hh(f123().o.fb.af, this.Mb.cg === vF109.TEAM_DEFAULT ? null : f123().p.Dc().ed(this.Mb.cg), f123().p.Dc().kd(this.Mb.dg));
        p1029.Lf(p1028.Lb, this.gh);
      }
      f182.prototype.Kb = function () {
        this.gh.Of.Pf.ih();
        this.gh.Of.Nf.ih();
      };
      f182.prototype.Og = function (p1030, p1031, p1032) {
        this.Ob = p1030;
        this.Pb = p1031;
        if (p1032) {
          this.ch = p1030;
          this.dh = p1031;
        }
      };
      f182.prototype.Fb = function (p1033, p1034) {
        var v1110 = Math.min(0.5, this.Sg * 1);
        var v1111 = Math.min(2.5, this.Sg * 1.5);
        this.eh = f135(this.eh, v1110, p1034, 0.0025);
        this.fh = f135(this.fh, v1111, p1034, 0.0025);
        this.Jb = f135(this.Jb, this.Rg, p1034, 0.0025);
      };
      f182.prototype.Gb = function (p1035, p1036, p1037) {
        this.ch = f135(this.ch, this.Ob, p1036, vO4.eat_animation);
        this.dh = f135(this.dh, this.Pb, p1036, 0.0025);
        this.gh.Te(this, p1035, p1036, p1037);
      };
      f182.Config = function () {
        function f183() {
          this.Lb = 0;
          this.cg = vF109.TEAM_DEFAULT;
          this.Ng = 0;
          this.dg = 0;
        }
        return f183;
      }();
      return f182;
    }();
    var vF119 = function () {
      function f184() {
        this.Of = new vF121(new vF133(), new vF133());
        this.Of.Pf.jh.blendMode = vF91.ic.jc;
        this.Of.Pf.jh.zIndex = vLN100;
        this.Of.Nf.jh.zIndex = vLN500;
      }
      var vLN500 = 500;
      var vLN100 = 100;
      f184.prototype.hh = function (p1038, p1039, p1040) {
        var v1112 = p1040.Zc;
        if (v1112 != null) {
          this.Of.Nf.kh(v1112);
        }
        var v1113 = p1038 == vO18._e && p1039 != null ? p1039.cd.$c : p1040.$c;
        if (v1113 != null) {
          this.Of.Pf.kh(v1113);
        }
      };
      f184.prototype.Te = function (p1041, p1042, p1043, p1044) {
        if (!p1044(p1041.ch, p1041.dh)) {
          this.Of.lh();
          return;
        }
        var v1114 = p1041.fh * (1 + Math.cos(p1041.Ae + p1042 / 200) * 0.3);
        if (p1041.bh) {
          this.Of.mh(p1041.ch, p1041.dh, vO4.PortionSize * p1041.eh, p1041.Jb * 1, vO4.PortionAura * v1114, vO4.PortionTransparent * p1041.Jb);
        } else {
          this.Of.mh(p1041.ch, p1041.dh, vO4.FoodSize * p1041.eh, p1041.Jb * 1, vO4.FoodShadow * v1114, vO4.FoodTransparent * p1041.Jb);
        }
      };
      var vF121 = function () {
        function f185(p1045, p1046) {
          this.Nf = p1045;
          this.Pf = p1046;
        }
        f185.prototype.mh = function (p1047, p1048, p1049, p1050, p1051, p1052) {
          this.Nf.Mg(true);
          this.Nf.nh(p1047, p1048);
          this.Nf.oh(p1049);
          this.Nf.qh(p1050);
          this.Pf.Mg(true);
          this.Pf.nh(p1047, p1048);
          this.Pf.oh(p1051);
          this.Pf.qh(p1052);
        };
        f185.prototype.lh = function () {
          this.Nf.Mg(false);
          this.Pf.Mg(false);
        };
        return f185;
      }();
      return f184;
    }();
    var vF122 = function () {
      function f186() {
        this.rh = 0;
        this.sh = 0;
        this.th = 0;
        this.uh = 0;
        this.vh = 0;
        this.wh = [];
      }
      function f187(p1053, p1054) {
        if (!f123().p.W()) {
          return null;
        }
        var v1115 = f123().p.Ac();
        if (p1054 === vF124.ia) {
          var vF713 = f188(v1115.skinArrayDict, p1053);
          if (vF713 < 0) {
            return null;
          } else {
            return v1115.skinArrayDict[vF713];
          }
        }
        switch (p1054) {
          case vF124.ja:
            return v1115.eyesDict[p1053];
          case vF124.ka:
            return v1115.mouthDict[p1053];
          case vF124.la:
            return v1115.glassesDict[p1053];
          case vF124.ma:
            return v1115.hatDict[p1053];
        }
        return null;
      }
      function f188(p1055, p1056) {
        for (var vLN051 = 0; vLN051 < p1055.length; vLN051++) {
          if (p1055[vLN051].id == p1056) {
            return vLN051;
          }
        }
        return -1;
      }
      f186.prototype.a = function () {};
      f186.prototype.ha = function (p1057) {
        if (!vO4.loading) {
          vO4.PropertyManager = this;
          localStorage.setItem("SaveGameWPC", JSON.stringify(vO4));
        }
        switch (p1057) {
          case vF124.ia:
            return this.rh;
          case vF124.ja:
            return this.sh;
          case vF124.ka:
            return this.th;
          case vF124.la:
            return this.uh;
          case vF124.ma:
            return this.vh;
        }
        return 0;
      };
      f186.prototype.xh = function (p1058) {
        this.wh.push(p1058);
        this.yh();
      };
      f186.prototype.Ia = function () {
        if (!f123().p.W()) {
          return f141([32, 33, 34, 35]);
        }
        for (var v1116 = f123().p.Ac(), vA15 = [], vLN052 = 0; vLN052 < v1116.skinArrayDict.length; vLN052++) {
          var v1117 = v1116.skinArrayDict[vLN052];
          if (this.Ja(v1117.id, vF124.ia)) {
            vA15.push(v1117);
          }
        }
        if (vA15.length === 0) {
          return 0;
        } else {
          return vA15[parseInt(vA15.length * Math.random())].id;
        }
      };
      f186.prototype.zh = function () {
        if (f123().p.W) {
          var v1118 = f123().p.Ac().skinArrayDict;
          var vF188 = f188(v1118, this.rh);
          if (!(vF188 < 0)) {
            for (var v1119 = vF188 + 1; v1119 < v1118.length; v1119++) {
              if (this.Ja(v1118[v1119].id, vF124.ia)) {
                this.rh = v1118[v1119].id;
                this.yh();
                return;
              }
            }
            for (var vLN053 = 0; vLN053 < vF188; vLN053++) {
              if (this.Ja(v1118[vLN053].id, vF124.ia)) {
                this.rh = v1118[vLN053].id;
                this.yh();
                return;
              }
            }
          }
        }
      };
      f186.prototype.Ah = function () {
        if (f123().p.W) {
          var v1120 = f123().p.Ac().skinArrayDict;
          var vF1882 = f188(v1120, this.rh);
          if (!(vF1882 < 0)) {
            for (var v1121 = vF1882 - 1; v1121 >= 0; v1121--) {
              if (this.Ja(v1120[v1121].id, vF124.ia)) {
                this.rh = v1120[v1121].id;
                this.yh();
                return;
              }
            }
            for (var v1122 = v1120.length - 1; v1122 > vF1882; v1122--) {
              if (this.Ja(v1120[v1122].id, vF124.ia)) {
                this.rh = v1120[v1122].id;
                this.yh();
                return;
              }
            }
          }
        }
      };
      f186.prototype.Bh = function (p1059, p1060) {
        if (!f123().p.W() || this.Ja(p1059, p1060)) {
          switch (p1060) {
            case vF124.ia:
              if (this.rh != p1059) {
                this.rh = p1059;
                this.yh();
              }
              return;
            case vF124.ja:
              if (this.sh != p1059) {
                this.sh = p1059;
                this.yh();
              }
              return;
            case vF124.ka:
              if (this.th != p1059) {
                this.th = p1059;
                this.yh();
              }
              return;
            case vF124.la:
              if (this.uh != p1059) {
                this.uh = p1059;
                this.yh();
              }
              return;
            case vF124.ma:
              if (this.vh != p1059) {
                this.vh = p1059;
                this.yh();
              }
              return;
          }
        }
      };
      f186.prototype.Ja = function (p1061, p1062) {
        var vF187 = f187(p1061, p1062);
        return vF187 != null && (f123().u.P() ? vF187.price == 0 && !vF187.nonbuyable || f123().u.Ch(p1061, p1062) : vF187.guest);
      };
      f186.prototype.yh = function () {
        for (var vLN054 = 0; vLN054 < this.wh.length; vLN054++) {
          this.wh[vLN054]();
        }
      };
      return f186;
    }();
    var vF124 = function () {
      function f189() {}
      f189.ia = "SKIN";
      f189.ja = "EYES";
      f189.ka = "MOUTH";
      f189.la = "GLASSES";
      f189.ma = "HAT";
      return f189;
    }();
    var vF125 = function () {
      function f190(p1063, p1064, p1065, p1066, p1067, p1068, p1069, p1070, p1071) {
        this.Hc = new vF91._b(p1063, new vF91.dc(p1064, p1065, p1066, p1067));
        this.Dh = p1064;
        this.Eh = p1065;
        this.Fh = p1066;
        this.Gh = p1067;
        this.Hh = p1068 || (p1070 || p1066) / 2;
        this.Ih = p1069 || (p1071 || p1067) / 2;
        this.Jh = p1070 || p1066;
        this.Kh = p1071 || p1067;
        this.Lh = 0.5 - (this.Hh - this.Jh * 0.5) / this.Fh;
        this.Mh = 0.5 - (this.Ih - this.Kh * 0.5) / this.Gh;
        this.Nh = this.Fh / this.Jh;
        this.Oh = this.Gh / this.Kh;
      }
      return f190;
    }();
    var vF127 = function () {
      function f191() {
        this.fn_o = f192;
        this.Fe = new vF91._b(vF91.$b.from("/images/bg-obstacle.png"));
        var v1123 = vF91.$b.from("/images/confetti-xmas2022.png");
        this.Ge = [new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128)), new vF91._b(v1123, new vF91.dc(0, 0, 128, 128))];
        this.Cf = new vF91._b(f192());
        this.Df = new vF91._b(function () {
          var v1124 = vF91.$b.from("/images/bg-pattern-pow2-TEAM2.png");
          v1124.wrapMode = vF91.kc.lc;
          return v1124;
        }());
        this.Af = new vF91._b(vF91.$b.from("/images/lens.png"));
        var v1125 = vF91.$b.from("/images/wear-ability.png");
        var v1126 = vF91.$b.from("https://i.imgur.com/EDt862t.png");
        var v1127 = vF91.$b.from("https://i.imgur.com/U5sTlhC.png");
        var v1128 = vF91.$b.from("https://i.imgur.com/ub4ed3R.png");
        var v1129 = vF91.$b.from("https://i.imgur.com/hk8xI4i.png");
        this.X_x5 = new vF125(v1129, 156, 80, 87, 60, 170, 1.5, 128, 128);
        this.X_x2 = new vF125(v1129, 156, 140, 87, 60, 170, 128.5, 128, 128);
        this.X_x10 = new vF125(v1129, 158, 200, 95, 55, 265, 128.5, 128, 128);
        this.X_xxlupa = new vF125(v1129, 79, 8, 75, 77, 265, 1.5, 128, 128);
        this.Id_mobileguia = new vF125(v1128, 0, 0, 87, 74, 350, 63, 128, 128);
        this.emoji_headshot = new vF125(v1126, 0, 0, 256, 256, 170.5, -163.5, 128, 128);
        this.emoji_kill = new vF125(v1127, 0, 0, 256, 256, 170.5, -163.5, 128, 128);
        this.Ph = new vF125(v1125, 158, 86, 67, 124, 148, 63.5, 128, 128);
        this.Qh = new vF125(v1125, 158, 4, 87, 74, 203, 63.5, 128, 128);
        this.Rh = new vF125(v1129, 156, 4, 87, 74, 285, 63.5, 128, 128);
        this.Ug = function () {
          var v1130 = window.document.createElement("canvas");
          v1130.width = 80;
          v1130.height = 80;
          return {
            te: v1130,
            Tg: v1130.getContext("2d"),
            Hc: new vF91._b(vF91.$b.from(v1130))
          };
        }();
        this.Bd = {};
        this.yd = {};
        this.Sh = [];
        this.Th = null;
      }
      function f192(p1072) {
        var v1131 = vF91.$b.from(p1072 || "https://i.imgur.com/8ubx4RA.png");
        v1131.wrapMode = vF91.kc.lc;
        return v1131;
      }
      f191.prototype.a = function (p1073) {
        function f193() {
          if (--vLN4 == 0) {
            p1073();
          }
        }
        var vLN4 = 4;
        this.Bd = {};
        f193();
        this.yd = {};
        f193();
        this.Sh = [];
        f193();
        this.Th = null;
        f193();
      };
      return f191;
    }();
    var vF128 = function () {
      function f194() {
        this.H = new vF152();
        this.F = new vF154();
        this.Uh = new vF171();
        this.Vh = new vF172();
        this.Wh = new vF158();
        this.Xh = new vF159();
        this.Yh = new vF161();
        this.Zh = new vF160();
        this.xa = new vF163();
        this.$h = new vF164();
        this._h = new vF166();
        this.ai = new vF167();
        this.aa = new vF156();
        this.ua = new vF153();
        this.pa = new vF155();
        this.bi = [];
        this.ci = null;
      }
      function f195(p1074, p1075) {
        if (p1075 != 0) {
          var v1132 = p1074[p1075];
          f138(p1074, 0, 1, p1075);
          p1074[0] = v1132;
        }
      }
      function f196(p1076, p1077) {
        if (p1077 != p1076.length + 1) {
          var v1133 = p1076[p1077];
          f138(p1076, p1077 + 1, p1077, p1076.length - p1077 - 1);
          p1076[p1076.length - 1] = v1133;
        }
      }
      function f197(p1078, p1079) {
        for (var vLN055 = 0; vLN055 < p1078.length; vLN055++) {
          if (p1078[vLN055] == p1079) {
            return vLN055;
          }
        }
        return -1;
      }
      f194.prototype.a = function () {
        this.bi = [this.H, this.F, this.Uh, this.Vh, this.Wh, this.Xh, this.Yh, this.Zh, this.xa, this.$h, this._h, this.ai, this.aa, this.ua, this.pa];
        for (var vLN056 = 0; vLN056 < this.bi.length; vLN056++) {
          this.bi[vLN056].a();
        }
        this.ci = new vF103(vF151.di);
      };
      f194.prototype.Qa = function (p1080, p1081) {
        for (var v1134 = this.bi.length - 1; v1134 >= 0; v1134--) {
          this.bi[v1134].Pa(p1080, p1081);
        }
        if (this.bi[0] != this.H && this.bi[0] != this.pa && this.ci != null) {
          this.ci.Pa(p1080, p1081);
        }
      };
      f194.prototype.Ra = function () {
        for (var v1135 = this.bi.length - 1; v1135 >= 0; v1135--) {
          this.bi[v1135].Ra();
        }
        if (this.ci != null) {
          this.ci.Ra();
        }
      };
      f194.prototype.I = function (p1082) {
        var vF197 = f197(this.bi, p1082);
        if (!(vF197 < 0)) {
          this.bi[0].ei();
          f195(this.bi, vF197);
          this.fi();
        }
      };
      f194.prototype.gi = function () {
        this.bi[0].ei();
        do {
          f196(this.bi, 0);
        } while (this.bi[0].rc != 1);
        this.fi();
      };
      f194.prototype.fi = function () {
        var v1136 = this.bi[0];
        v1136.ii();
        v1136.ji();
        this.ki();
      };
      f194.prototype.li = function () {
        return this.bi.length != 0 && this.bi[0].rc == 1 && this.aa.mi();
      };
      f194.prototype.ki = function () {
        if (this.li()) {
          this.I(this.aa);
        }
      };
      return f194;
    }();
    var vF129 = function () {
      function f198() {
        this.ag = [];
        this.$f = [];
      }
      f198.Vg = function (p1083, p1084) {
        return {
          bg: p1083,
          M: p1084
        };
      };
      f198.Wg = function (p1085, p1086) {
        return {
          _f: p1085,
          M: p1086
        };
      };
      return f198;
    }();
    var vF130 = function () {
      function f199() {
        this.ni = [];
        this.oi = [];
        this.pi = [];
        this.qi = false;
        this.ri = vLSGuest;
        this.si = {};
        this.ti = null;
      }
      var vLSGuest = "guest";
      f199.prototype.a = function () {
        this.vi();
      };
      f199.prototype.X = function () {
        if (this.qi) {
          return this.si.userId;
        } else {
          return "";
        }
      };
      f199.prototype.wi = function () {
        if (this.qi) {
          return this.si.username;
        } else {
          return "";
        }
      };
      f199.prototype.ga = function () {
        if (this.qi) {
          return this.si.nickname;
        } else {
          return "";
        }
      };
      f199.prototype.xi = function () {
        if (this.qi) {
          return this.si.avatarUrl;
        } else {
          return vLSimagesguestavatarxma;
        }
      };
      f199.prototype.yi = function () {
        return this.qi && this.si.isBuyer;
      };
      f199.prototype.Z = function () {
        return this.qi && this.si.isConsentGiven;
      };
      f199.prototype.zi = function () {
        if (this.qi) {
          return this.si.coins;
        } else {
          return 0;
        }
      };
      f199.prototype.Ai = function () {
        if (this.qi) {
          return this.si.level;
        } else {
          return 1;
        }
      };
      f199.prototype.Bi = function () {
        if (this.qi) {
          return this.si.expOnLevel;
        } else {
          return 0;
        }
      };
      f199.prototype.Ci = function () {
        if (this.qi) {
          return this.si.expToNext;
        } else {
          return 50;
        }
      };
      f199.prototype.Di = function () {
        if (this.qi) {
          return this.si.skinId;
        } else {
          return 0;
        }
      };
      f199.prototype.Ei = function () {
        if (this.qi) {
          return this.si.eyesId;
        } else {
          return 0;
        }
      };
      f199.prototype.Fi = function () {
        if (this.qi) {
          return this.si.mouthId;
        } else {
          return 0;
        }
      };
      f199.prototype.Gi = function () {
        if (this.qi) {
          return this.si.glassesId;
        } else {
          return 0;
        }
      };
      f199.prototype.Hi = function () {
        if (this.qi) {
          return this.si.hatId;
        } else {
          return 0;
        }
      };
      f199.prototype.Ii = function () {
        if (this.qi) {
          return this.si.highScore;
        } else {
          return 0;
        }
      };
      f199.prototype.Ji = function () {
        if (this.qi) {
          return this.si.bestSurvivalTimeSec;
        } else {
          return 0;
        }
      };
      f199.prototype.Ki = function () {
        if (this.qi) {
          return this.si.kills;
        } else {
          return 0;
        }
      };
      f199.prototype.Li = function () {
        if (this.qi) {
          return this.si.headShots;
        } else {
          return 0;
        }
      };
      f199.prototype.Mi = function () {
        if (this.qi) {
          return this.si.sessionsPlayed;
        } else {
          return 0;
        }
      };
      f199.prototype.Ni = function () {
        if (this.qi) {
          return this.si.totalPlayTimeSec;
        } else {
          return 0;
        }
      };
      f199.prototype.Oi = function () {
        if (this.qi) {
          return this.si.regDate;
        } else {
          return {};
        }
      };
      f199.prototype.V = function (p1087) {
        this.ni.push(p1087);
        p1087();
      };
      f199.prototype.Pi = function (p1088) {
        this.oi.push(p1088);
        p1088();
      };
      f199.prototype.Qi = function (p1089) {
        this.pi.push(p1089);
      };
      f199.prototype.Ch = function (p1090, p1091) {
        var v1137 = this.si.propertyList.concat(vO4.pL || []);
        if (!v1137) {
          return false;
        }
        for (var vLN057 = 0; vLN057 < v1137.length; vLN057++) {
          var v1138 = v1137[vLN057];
          if (v1138.id == p1090 && v1138.type === p1091) {
            return true;
          }
        }
        return false;
      };
      f199.prototype.P = function () {
        return this.qi;
      };
      f199.prototype.ea = function () {
        return this.ri;
      };
      f199.prototype.Q = function (p1092) {
        var vThis44 = this;
        if (this.qi) {
          this.Ri(function (p1093) {
            if (p1093) {
              var v1139 = vThis44.zi();
              var v1140 = vThis44.Ai();
              vThis44.si = p1093;
              f217(vThis44.si);
              vThis44.Si();
              var v1141 = vThis44.zi();
              var v1142 = vThis44.Ai();
              if (v1142 > 1 && v1142 != v1140) {
                f123().s.aa.Ti(new vF177(v1142));
              }
              var v1143 = v1141 - v1139;
              if (v1143 >= 20) {
                f123().s.aa.Ti(new vF176(v1143));
              }
            }
            if (p1092) {
              p1092();
            }
          });
        }
      };
      f199.prototype.Ri = function (p1094) {
        $.get(vLSHttpsgatewaywormatei + "/pub/wuid/" + this.ri + "/getUserData", function (p1095) {
          p1094(p1095.user_data);
        });
      };
      f199.prototype.Ui = function (p1096, p1097, p1098) {
        var vThis45 = this;
        $.get(vLSHttpsgatewaywormatei + "/pub/wuid/" + this.ri + "/buyProperty?id=" + p1096 + "&type=" + p1097, function (p1099) {
          if (p1099.code == 1200) {
            vThis45.Q(p1098);
          } else {
            p1098();
          }
        }).fail(function () {
          p1098();
        });
      };
      f199.prototype.Vi = function () {
        var vThis46 = this;
        this.Wi();
        if (typeof FB == "undefined") {
          this.Xi();
          return;
        }
        FB.getLoginStatus(function (p1100) {
          if (p1100.status === "connected") {
            if (p1100.authResponse && p1100.authResponse.accessToken) {
              vThis46.Yi("facebook", "fb_" + p1100.authResponse.accessToken);
            } else {
              vThis46.Xi();
            }
            return;
          }
          FB.login(function (p1101) {
            if (p1101.status === "connected" && p1101.authResponse && p1101.authResponse.accessToken) {
              vThis46.Yi("facebook", "fb_" + p1101.authResponse.accessToken);
            } else {
              vThis46.Xi();
            }
          });
        });
      };
      f199.prototype.Zi = function () {
        var vThis47 = this;
        this.Wi();
        if (v807 === undefined) {
          this.Xi();
          return;
        }
        console.log("gsi:l");
        v807.then(function () {
          console.log("gsi:then");
          if (v807.isSignedIn.get()) {
            console.log("gsi:sil");
            var v1144 = v807.currentUser.get();
            vThis47.Yi("google", "gg_" + v1144.getAuthResponse().id_token);
            return;
          }
          v807.signIn().then(function (p1102) {
            if (p1102.error !== undefined) {
              console.log("gsi:e: " + p1102.error);
              vThis47.Xi();
              return;
            } else if (p1102.isSignedIn()) {
              console.log("gsi:s");
              vThis47.Yi("google", "gg_" + p1102.getAuthResponse().id_token);
              return;
            } else {
              console.log("gsi:c");
              vThis47.Xi();
              return;
            }
          });
        });
      };
      f199.prototype.Wi = function () {
        console.log("iSI: " + this.qi);
        var v1145 = this.ri;
        var v1146 = this.ti;
        this.qi = false;
        this.ri = vLSGuest;
        this.si = {};
        this.ti = null;
        f125(vF104.Oe, "", 60);
        switch (v1146) {
          case "facebook":
            this.$i();
            break;
          case "google":
            this._i();
        }
        if (v1145 !== this.ri) {
          this.aj();
        } else {
          this.Si();
        }
      };
      f199.prototype.bj = function () {
        console.log("dA");
        if (this.qi) {
          $.get(vLSHttpsgatewaywormatei + "/pub/wuid/" + this.ri + "/deleteAccount", function (p1103) {
            if (p1103.code === 1200) {
              console.log("dA: OK");
            } else {
              console.log("dA: NO");
            }
          }).fail(function () {
            console.log("dA: FAIL");
          });
        }
      };
      f199.prototype.vi = function () {
        console.log("rs");
        var vF1242 = f124(vF104.Oe);
        var vThis48 = this;
        if (vF1242 == "facebook") {
          console.log("rs:fb");
          (function f200() {
            if (typeof FB != "undefined") {
              vThis48.Vi();
            } else {
              setTimeout(f200, 100);
            }
          })();
        } else if (vF1242 == "google") {
          console.log("rs:gg");
          (function f201() {
            if (v807 !== undefined) {
              vThis48.Zi();
            } else {
              setTimeout(f201, 100);
            }
          })();
        } else {
          console.log("rs:lo");
          this.Wi();
        }
      };
      f199.prototype.aj = function () {
        var vLN058 = 0;
        for (; vLN058 < this.ni.length; vLN058++) {
          this.ni[vLN058]();
        }
        this.Si();
      };
      f199.prototype.Si = function () {
        var vLN059 = 0;
        for (; vLN059 < this.oi.length; vLN059++) {
          this.oi[vLN059]();
        }
        var v1147 = this.pi;
        this.pi = [];
        var vLN060 = 0;
        for (; vLN060 < v1147.length; vLN060++) {
          v1147[vLN060]();
        }
      };
      f199.prototype.Yi = function (p1104, p1105) {
        var vThis49 = this;
        var vLN061 = 0;
        var v1148 = localStorage.getItem("token__gg");
        if (v1148) {
          console.log("Using the stored token:", v1148);
          $.get(vLSHttpsgatewaywormatei + "/pub/wuid/" + v1148 + "/login", function (p1106) {
            if (p1106 && p1106.code === 1485 && p1106.error === "expired_token") {
              vLN061++;
              console.log("auto login attempt:", vLN061);
              $("#login-view").html("<h2>Auto Login Google Wormate.io  : " + vLN061 + "</h2>");
              f202();
            } else {
              f203(p1106);
            }
          }).fail(function () {
            f202();
          });
        } else {
          f202();
        }
        function f202() {
          console.log("Fetching a new token...");
          $.get(vLSHttpsgatewaywormatei + "/pub/wuid/" + p1105 + "/login", function (p1107) {
            if (p1107 && p1107.code === 1485 && p1107.error === "expired_token") {
              vLN061++;
              console.log("auto login attempt:", vLN061);
              $("#login-view").html("<h2>Auto Login Google Wormate.io  : " + vLN061 + "</h2>");
              f202();
            } else {
              f203(p1107);
            }
          }).fail(function () {
            vThis49.Xi();
          });
        }
        function f203(p1108) {
          if (p1108 && p1108.user_data) {
            f217(p1108.user_data);
            var v1149 = this.ri;
            vThis49.qi = true;
            vThis49.ri = p1105;
            vThis49.si = p1108.user_data;
            vO4.FB_UserID = p1108.user_data.userId;
            vThis49.ti = p1104;
            f125(vF104.Oe, vThis49.ti, 60);
            f218();
            for (var vLN062 = 0; vLN062 < vO5.clientesActivos.length; vLN062++) {
              var v1150 = vO5.clientesActivos[vLN062].cliente_NOMBRE;
              var v1151 = vO5.clientesActivos[vLN062].cliente_ID;
              var v1152 = vO5.clientesActivos[vLN062].Client_VisibleSkin;
              var v1153 = vO5.clientesActivos[vLN062].Client_VisibleSkin1;
              var v1154 = vO5.clientesActivos[vLN062].Client_VisibleSkin2;
              var v1155 = vO5.clientesActivos[vLN062].Client_VisibleSkin3;
              var v1156 = vO5.clientesActivos[vLN062].Client_VisibleSkin4;
              var v1157 = vO5.clientesActivos[vLN062].Client_VisibleSkin5;
              var v1158 = vO5.clientesActivos[vLN062].Client_VisibleSkin6;
              var v1159 = vO5.clientesActivos[vLN062].Client_VisibleSkin7;
              var v1160 = vO5.clientesActivos[vLN062].Client_VisibleSkin8;
              var v1161 = vO5.clientesActivos[vLN062].Client_VisibleSkin9;
              var v1162 = vO5.clientesActivos[vLN062].Client_VisibleSkin10;
              var v1163 = vO5.clientesActivos[vLN062].Client_VisibleSkin11;
              var v1164 = vO5.clientesActivos[vLN062].Client_VisibleSkin12;
              var v1165 = vO5.clientesActivos[vLN062].Client_VisibleSkin13;
              var v1166 = vO5.clientesActivos[vLN062].Client_VisibleSkin14;
              var v1167 = vO5.clientesActivos[vLN062].Client_VisibleSkin15;
              var v1168 = vO5.clientesActivos[vLN062].Client_VisibleSkin16;
              var v1169 = vO5.clientesActivos[vLN062].Client_VisibleSkin17;
              var v1170 = vO5.clientesActivos[vLN062].Client_VisibleSkin18;
              var v1171 = vO5.clientesActivos[vLN062].Client_VisibleSkin19;
              var v1172 = vO5.clientesActivos[vLN062].Client_VisibleSkin20;
              var v1173 = vO5.clientesActivos[vLN062].Client_KeyAccecs;
              var v1174 = vO5.clientesActivos[vLN062].cliente_DateExpired;
              if (vO4.FB_UserID == 0) {} else if (vO4.FB_UserID == v1151) {
                f221();
                f220();
              } else {}
            }
            vO4.loading = false;
            if (v1149 !== p1105) {
              vThis49.aj();
            } else {
              vThis49.Si();
            }
            localStorage.setItem("token__gg", p1105);
          } else {
            vThis49.Xi();
          }
        }
      };
      f199.prototype.Xi = function () {
        this.Wi();
      };
      f199.prototype.$i = function () {
        console.log("lo:fb");
        FB.logout(function () {});
      };
      f199.prototype._i = function () {
        console.log("lo:gg");
        v807.signOut();
      };
      return f199;
    }();
    var vF132 = function () {
      function f204() {
        this.cj = {};
        this.cj[v1178] = [1, 0.5, 0.25, 0.5];
        this.cj[v1179] = vF91._b.WHITE;
        this.cj[v1180] = [0, 0];
        this.cj[v1181] = [0, 0];
        var v1175 = vF91.cc.from(v1184, v1185, this.cj);
        this.zf = new vF91.hc(v1183, v1175);
      }
      var v1176 = "a1_" + f142();
      var v1177 = "a2_" + f142();
      var vLSTranslationMatrix = "translationMatrix";
      var vLSProjectionMatrix = "projectionMatrix";
      var v1178 = "u3_" + f142();
      var v1179 = "u4_" + f142();
      var v1180 = "u5_" + f142();
      var v1181 = "u6_" + f142();
      var v1182 = "v1_" + f142();
      var v1183 = new vF91.gc().addAttribute(v1176, [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5], 2).addAttribute(v1177, [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5], 2);
      var v1184 = "precision mediump float;attribute vec2 " + v1176 + ";attribute vec2 " + v1177 + ";uniform mat3 " + vLSTranslationMatrix + ";uniform mat3 " + vLSProjectionMatrix + ";varying vec2 " + v1182 + ";void main(){" + v1182 + "=" + v1177 + ";gl_Position=vec4((" + vLSProjectionMatrix + "*" + vLSTranslationMatrix + "*vec3(" + v1176 + ",1.0)).xy,0.0,1.0);}";
      var v1185 = "precision highp float;varying vec2 " + v1182 + ";uniform vec4 " + v1178 + ";uniform sampler2D " + v1179 + ";uniform vec2 " + v1180 + ";uniform vec2 " + v1181 + ";void main(){vec2 coord=" + v1182 + "*" + v1180 + "+" + v1181 + ";vec4 v_color_mix=" + v1178 + ";gl_FragColor=texture2D(" + v1179 + ",coord)*0.3+v_color_mix.a*vec4(v_color_mix.rgb,0.0);}";
      f204.prototype.Hf = function (p1109, p1110, p1111, p1112) {
        var v1186 = this.cj[v1178];
        v1186[0] = p1109;
        v1186[1] = p1110;
        v1186[2] = p1111;
        v1186[3] = p1112;
      };
      f204.prototype.Bf = function (p1113) {
        this.cj[v1179] = p1113;
      };
      f204.prototype.Te = function (p1114, p1115, p1116, p1117) {
        this.zf.position.x = p1114;
        this.zf.position.y = p1115;
        this.zf.scale.x = p1116;
        this.zf.scale.y = p1117;
        var v1187 = this.cj[v1180];
        v1187[0] = p1116 * 0.2520615384615385;
        v1187[1] = p1117 * 0.4357063736263738;
        var v1188 = this.cj[v1181];
        v1188[0] = p1114 * 0.2520615384615385;
        v1188[1] = p1115 * 0.4357063736263738;
      };
      return f204;
    }();
    var vF133 = function () {
      function f205() {
        this.jh = new vF91.ec();
        this.dj = 0;
        this.ej = 0;
      }
      f205.prototype.kh = function (p1118) {
        if (p1118 && p1118.Hc) {
          this.jh.texture = p1118.Hc;
          this.jh.anchor.set(p1118.Lh, p1118.Mh);
          this.dj = p1118.Nh;
          this.ej = p1118.Oh;
        }
      };
      f205.prototype.oh = function (p1119) {
        this.jh.width = p1119 * this.dj;
        this.jh.height = p1119 * this.ej;
      };
      f205.prototype.fj = function (p1120) {
        this.jh.rotation = p1120;
      };
      f205.prototype.nh = function (p1121, p1122) {
        this.jh.position.set(p1121, p1122);
      };
      f205.prototype.Mg = function (p1123) {
        this.jh.visible = p1123;
      };
      f205.prototype.gj = function () {
        return this.jh.visible;
      };
      f205.prototype.qh = function (p1124) {
        this.jh.alpha = p1124;
      };
      f205.prototype.Mf = function () {
        return this.jh;
      };
      f205.prototype.ih = function () {
        f140(this.jh);
      };
      return f205;
    }();
    var vF135 = function () {
      function f206(p1125) {
        this.fb = p1125;
        this.Mb = new vF135.Config();
        this.Hb = false;
        this.Ib = true;
        this.hj = false;
        this.Db = 0;
        this.ij = 0;
        this.Jb = 1;
        this.jj = 0;
        this.M = 0;
        this.Ff = {};
        this.kj = 0;
        this.lj = new Float32Array(vLN200 * 2);
        this.mj = new Float32Array(vLN200 * 2);
        this.nj = new Float32Array(vLN200 * 2);
        this.oj = null;
        this.pj = null;
        this.qj = null;
        this.Tb();
      }
      var vLN200 = 200;
      f206.prototype.Kb = function () {
        if (this.pj != null) {
          f140(this.pj.Rf);
        }
        if (this.qj != null) {
          f140(this.qj);
        }
      };
      f206.prototype.Tb = function () {
        this.Ig(0.25);
        this.Mb.ad = "";
        this.Ib = true;
        this.Ff = {};
        this.Mg(false);
      };
      f206.prototype.Fg = function (p1126) {
        this.Mb = p1126;
        this.rj(this.Hb);
      };
      f206.prototype.Mg = function (p1127) {
        var v1189 = this.Hb;
        this.Hb = p1127;
        this.rj(v1189);
      };
      f206.prototype.Ig = function (p1128) {
        this.M = p1128 * 50;
        var vP1128 = p1128;
        if (p1128 > this.fb.cf) {
          vP1128 = Math.atan((p1128 - this.fb.cf) / this.fb.df) * this.fb.df + this.fb.cf;
        }
        var v1190 = Math.sqrt(Math.pow(vP1128 * 5, 0.707106781186548) * 4 + 25);
        var v1191 = Math.min(vLN200, Math.max(3, (v1190 - 5) * 5 + 1));
        var v1192 = this.kj;
        this.Db = (5 + v1190 * 0.9) * 0.025;
        this.kj = Math.floor(v1191);
        this.ij = v1191 - this.kj;
        if (v1192 > 0 && v1192 < this.kj) {
          var v1193 = this.lj[v1192 * 2 - 2];
          var v1194 = this.lj[v1192 * 2 - 1];
          var v1195 = this.mj[v1192 * 2 - 2];
          var v1196 = this.mj[v1192 * 2 - 1];
          var v1197 = this.nj[v1192 * 2 - 2];
          var v1198 = this.nj[v1192 * 2 - 1];
          for (var vV1192 = v1192; vV1192 < this.kj; vV1192++) {
            this.lj[vV1192 * 2] = v1193;
            this.lj[vV1192 * 2 + 1] = v1194;
            this.mj[vV1192 * 2] = v1195;
            this.mj[vV1192 * 2 + 1] = v1196;
            this.nj[vV1192 * 2] = v1197;
            this.nj[vV1192 * 2 + 1] = v1198;
          }
        }
      };
      f206.prototype.Lg = function (p1129, p1130) {
        this.kj = p1130;
        for (var vLN063 = 0; vLN063 < this.kj; vLN063++) {
          this.lj[vLN063 * 2] = this.mj[vLN063 * 2] = this.nj[vLN063 * 2] = p1129();
          this.lj[vLN063 * 2 + 1] = this.mj[vLN063 * 2 + 1] = this.nj[vLN063 * 2 + 1] = p1129();
        }
      };
      f206.prototype.Kg = function (p1131, p1132, p1133) {
        this.hj = p1133;
        for (var vLN064 = 0; vLN064 < this.kj; vLN064++) {
          this.lj[vLN064 * 2] = this.mj[vLN064 * 2];
          this.lj[vLN064 * 2 + 1] = this.mj[vLN064 * 2 + 1];
        }
        var v1199 = p1131 - this.mj[0];
        var v1200 = p1132 - this.mj[1];
        this.sj(v1199, v1200, this.kj, this.mj);
      };
      f206.prototype.sj = function (p1134, p1135, p1136, p1137) {
        var v1201 = Math.hypot(p1134, p1135);
        if (!(v1201 <= 0)) {
          var v1202 = p1137[0];
          var vUndefined36 = undefined;
          p1137[0] += p1134;
          var v1203 = p1137[1];
          var vUndefined37 = undefined;
          p1137[1] += p1135;
          var v1204 = this.Db / (this.Db + v1201);
          var v1205 = 1 - v1204 * 2;
          for (var vLN13 = 1, v1206 = p1136 - 1; vLN13 < v1206; vLN13++) {
            vUndefined36 = p1137[vLN13 * 2];
            p1137[vLN13 * 2] = p1137[vLN13 * 2 - 2] * v1205 + (vUndefined36 + v1202) * v1204;
            v1202 = vUndefined36;
            vUndefined37 = p1137[vLN13 * 2 + 1];
            p1137[vLN13 * 2 + 1] = p1137[vLN13 * 2 - 1] * v1205 + (vUndefined37 + v1203) * v1204;
            v1203 = vUndefined37;
          }
          v1204 = this.ij * this.Db / (this.ij * this.Db + v1201);
          v1205 = 1 - v1204 * 2;
          p1137[p1136 * 2 - 2] = p1137[p1136 * 2 - 4] * v1205 + (p1137[p1136 * 2 - 2] + v1202) * v1204;
          p1137[p1136 * 2 - 1] = p1137[p1136 * 2 - 3] * v1205 + (p1137[p1136 * 2 - 1] + v1203) * v1204;
        }
      };
      f206.prototype.Gf = function () {
        return {
          x: this.nj[0],
          y: this.nj[1]
        };
      };
      f206.prototype.Hg = function (p1138, p1139) {
        var vLN1000000 = 1000000;
        var vP1138 = p1138;
        var vP1139 = p1139;
        for (var vLN065 = 0; vLN065 < this.kj; vLN065++) {
          var v1207 = this.nj[vLN065 * 2];
          var v1208 = this.nj[vLN065 * 2 + 1];
          var v1209 = Math.hypot(p1138 - v1207, p1139 - v1208);
          if (v1209 < vLN1000000) {
            vLN1000000 = v1209;
            vP1138 = v1207;
            vP1139 = v1208;
          }
        }
        return {
          x: vP1138,
          y: vP1139,
          distance: vLN1000000
        };
      };
      f206.prototype.vb = function (p1140) {
        this.oj = p1140;
      };
      f206.prototype.Fb = function (p1141, p1142) {
        this.Jb = f135(this.Jb, this.Ib ? this.hj ? 0.9 + Math.cos(p1141 / 400 * Math.PI) * 0.1 : 1 : 0, p1142, 1 / 800);
        this.jj = f135(this.jj, this.Ib ? this.hj ? 1 : 0 : 1, p1142, 0.0025);
        if (this.pj != null) {
          this.pj.Rf.alpha = this.Jb;
        }
        if (this.qj != null) {
          this.qj.alpha = this.Jb;
        }
      };
      f206.prototype.Gb = function (p1143, p1144, p1145, p1146) {
        if (this.Hb && this.Ib) {
          var v1210 = Math.pow(0.11112, p1144 / 95);
          for (var vLN066 = 0; vLN066 < this.kj; vLN066++) {
            var vF137 = f137(this.lj[vLN066 * 2], this.mj[vLN066 * 2], p1145);
            var vF1372 = f137(this.lj[vLN066 * 2 + 1], this.mj[vLN066 * 2 + 1], p1145);
            this.nj[vLN066 * 2] = f137(vF137, this.nj[vLN066 * 2], v1210);
            this.nj[vLN066 * 2 + 1] = f137(vF1372, this.nj[vLN066 * 2 + 1], v1210);
          }
        }
        if (this.pj != null && this.Hb) {
          this.pj.tj(this, p1143, p1144, p1146);
        }
        if (this.qj != null) {
          this.qj.If.x = this.nj[0];
          this.qj.If.y = this.nj[1] - this.Db * 3;
        }
      };
      f206.prototype.rj = function (p1147) {
        if (this.Hb) {
          if (!p1147) {
            this.uj();
          }
        } else {
          if (this.pj != null) {
            f140(this.pj.Rf);
          }
          if (this.qj != null) {
            f140(this.qj);
          }
        }
      };
      f206.prototype.uj = function () {
        var vF1235 = f123();
        if (this.pj == null) {
          this.pj = new vF138();
        } else {
          f140(this.pj.Rf);
        }
        this.pj.hh(vF1235.o.fb.af, vF1235.p.Dc().ed(this.Mb.cg), vF1235.p.Dc().dd(this.Mb.dg), vF1235.p.Dc().fd(this.Mb.Bg), vF1235.p.Dc().gd(this.Mb.Cg), vF1235.p.Dc().hd(this.Mb.Dg), vF1235.p.Dc().jd(this.Mb.Eg));
        if (this.qj == null) {
          this.qj = new vF136("");
          this.qj.style.fontFamily = "Wormate.io";
          this.qj.anchor.set(0.5);
        } else {
          f140(this.qj);
        }
        this.qj.style.fontSize = 15;
        this.qj.style.fill = vF1235.p.Dc().dd(this.Mb.dg)._c;
        this.qj.text = this.Mb.ad;
        this.oj.Qf(this.Mb.Lb, this.pj, this.qj);
      };
      f206.Config = function () {
        function f207() {
          this.Lb = 0;
          this.cg = vF109.TEAM_DEFAULT;
          this.dg = 0;
          this.Bg = 0;
          this.Cg = 0;
          this.Dg = 0;
          this.Eg = 0;
          this.ad = "";
        }
        return f207;
      }();
      return f206;
    }();
    var vF136 = function () {
      return f131(vF91.fc, function (p1148, p1149, p1150) {
        vF91.fc.call(this, p1148, p1149, p1150);
        this.If = {
          x: 0,
          y: 0
        };
      });
    }();
    var vF138 = function () {
      function f208() {
        this.Rf = new vF91.Zb();
        this.Rf.sortableChildren = true;
        this.vj = new vF139();
        this.vj.zIndex = vLN0001 * ((vLN797 + 1) * 2 + 1 + 3);
        this.wj = 0;
        this.xj = new Array(vLN797);
        this.xj[0] = this.yj(0, new vF133(), new vF133());
        for (var vLN14 = 1; vLN14 < vLN797; vLN14++) {
          this.xj[vLN14] = this.yj(vLN14, new vF133(), new vF133());
        }
        this.zj = 0;
        this.Aj = 0;
        this.Bj = 0;
      }
      var vLN0001 = 0.001;
      var vLN797 = 797;
      var v1211 = Math.PI * 0.1;
      var v1212 = -0.06640625;
      var vLN084375 = 0.84375;
      var vLN02578125 = 0.2578125;
      var v1213 = -0.03515625;
      var v1214 = -0.0625;
      var vLN05625 = 0.5625;
      var v1215 = v1212 * 3 + vLN084375;
      var v1216 = vLN02578125 - v1212 * 3;
      var v1217 = v1212 + v1213;
      var vLN0375 = 0.375;
      var vLN075 = 0.75;
      var v1218 = v1214 + v1214;
      var v1219 = v1213 * 3 + vLN02578125;
      var v1220 = vLN084375 - v1213 * 3;
      var v1221 = v1213 + v1212;
      f208.prototype.yj = function (p1151, p1152, p1153) {
        var v1222 = new vF140(p1152, p1153);
        p1152.jh.zIndex = vLN0001 * ((vLN797 - p1151) * 2 + 1 + 3);
        p1153.jh.zIndex = vLN0001 * ((vLN797 - p1151) * 2 - 2 + 3);
        return v1222;
      };
      f208.prototype.hh = function (p1154, p1155, p1156, p1157, p1158, p1159, p1160) {
        var v1223 = p1156.Zc;
        var v1224 = p1154 == vO18._e ? p1155.bd.$c : p1156.$c;
        if (v1223.length > 0 && v1224.length > 0) {
          for (var vLN067 = 0; vLN067 < this.xj.length; vLN067++) {
            this.xj[vLN067].Nf.kh(v1223[vLN067 % v1223.length]);
            this.xj[vLN067].Pf.kh(v1224[vLN067 % v1224.length]);
          }
        }
        this.vj.hh(p1157, p1158, p1159, p1160);
      };
      var vF139 = function () {
        var vF1315 = f131(vF91.Zb, function () {
          vF91.Zb.call(this);
          this.sortableChildren = true;
          this.Cj = [];
          this.Dj = [];
          this.Ej = [];
          this.Fj = [];
          this.Gj = new vF91.Zb();
          this.Hj = [];
          for (var vLN068 = 0; vLN068 < 4; vLN068++) {
            var v1225 = new vF133();
            v1225.kh(f123().q.Ph);
            this.Gj.addChild(v1225.jh);
            this.Hj.push(v1225);
          }
          this.Gj.zIndex = 0.0011;
          this.addChild(this.Gj);
          this.Ij();
          this.Jj = new vF133();
          this.Jj.kh(f123().q.Qh);
          this.Jj.jh.zIndex = 0.001;
          this.addChild(this.Jj.jh);
          this.Kj();
          this.xEmojiType_headshot = new vF133();
          this.xEmojiType_headshot.kh(f123().q.emoji_headshot);
          this.xEmojiType_headshot.jh.zIndex = 0.001;
          this.addChild(this.xEmojiType_headshot.jh);
          this.xzs();
          this.xEmojiType_kill = new vF133();
          this.xEmojiType_kill.kh(f123().q.emoji_kill);
          this.xEmojiType_kill.jh.zIndex = 0.001;
          this.addChild(this.xEmojiType_kill.jh);
          this.zas();
          this.guia_mobile = new vF133();
          this.guia_mobile.kh(f123().q.Id_mobileguia);
          this.guia_mobile.jh.zIndex = 0.001;
          this.addChild(this.guia_mobile.jh);
          this.flx = new vF133();
          this.flx.kh(f123().q.Rh);
          this.flx.jh.zIndex = 0.001;
          this.addChild(this.flx.jh);
          this.flexx();
          this.xxx5 = new vF133();
          this.xxx5.kh(f123().q.X_x5);
          this.xxx5.jh.zIndex = 0.001;
          this.addChild(this.xxx5.jh);
          this.xXx5();
          this.xxx2 = new vF133();
          this.xxx2.kh(f123().q.X_x2);
          this.xxx2.jh.zIndex = 0.001;
          this.addChild(this.xxx2.jh);
          this.xXx2();
          this.xxx10 = new vF133();
          this.xxx10.kh(f123().q.X_x10);
          this.xxx10.jh.zIndex = 0.001;
          this.addChild(this.xxx10.jh);
          this.xXx10();
          this.xxxLupatype = new vF133();
          this.xxxLupatype.kh(f123().q.X_xxlupa);
          this.xxxLupatype.jh.zIndex = 0.001;
          this.addChild(this.xxxLupatype.jh);
          this.xXxLupaZ();
        });
        vF1315.prototype.hh = function (p1161, p1162, p1163, p1164) {
          this.Lj(0.002, this.Cj, p1161.Zc);
          this.Lj(0.003, this.Dj, p1162.Zc);
          this.Lj(0.004, this.Fj, p1164.Zc);
          this.Lj(0.005, this.Ej, p1163.Zc);
        };
        vF1315.prototype.Lj = function (p1165, p1166, p1167) {
          while (p1167.length > p1166.length) {
            var v1226 = new vF133();
            p1166.push(v1226);
            this.addChild(v1226.Mf());
          }
          while (p1167.length < p1166.length) {
            p1166.pop().ih();
          }
          var vP1165 = p1165;
          for (var vLN069 = 0; vLN069 < p1167.length; vLN069++) {
            vP1165 += 0.0001;
            var v1227 = p1166[vLN069];
            v1227.kh(p1167[vLN069]);
            v1227.jh.zIndex = vP1165;
          }
        };
        vF1315.prototype.mh = function (p1168, p1169, p1170, p1171) {
          this.visible = true;
          this.position.set(p1168, p1169);
          this.rotation = p1171;
          for (var vLN070 = 0; vLN070 < this.Cj.length; vLN070++) {
            this.Cj[vLN070].oh(p1170);
          }
          for (var vLN071 = 0; vLN071 < this.Dj.length; vLN071++) {
            this.Dj[vLN071].oh(p1170);
          }
          for (var vLN072 = 0; vLN072 < this.Ej.length; vLN072++) {
            this.Ej[vLN072].oh(p1170);
          }
          for (var vLN073 = 0; vLN073 < this.Fj.length; vLN073++) {
            this.Fj[vLN073].oh(p1170);
          }
        };
        vF1315.prototype.lh = function () {
          this.visible = false;
        };
        vF1315.prototype.Mj = function (p1172, p1173, p1174, p1175) {
          this.Gj.visible = true;
          var v1228 = p1174 / 1000;
          var v1229 = 1 / this.Hj.length;
          for (var vLN074 = 0; vLN074 < this.Hj.length; vLN074++) {
            var v1230 = 1 - (v1228 + v1229 * vLN074) % 1;
            this.Hj[vLN074].jh.alpha = 1 - v1230;
            this.Hj[vLN074].oh(p1173 * (0.5 + v1230 * 4.5));
          }
        };
        vF1315.prototype.Ij = function () {
          this.Gj.visible = false;
        };
        vF1315.prototype.Nj = function (p1176, p1177, p1178, p1179) {
          this.Jj.jh.visible = true;
          this.Jj.jh.alpha = f135(this.Jj.jh.alpha, p1176.hj ? 0.9 : 0.2, p1179, 0.0025);
          this.Jj.oh(p1177);
        };
        vF1315.prototype.Kj = function () {
          this.Jj.jh.visible = false;
        };
        vF1315.prototype.Nflex = function (p1180, p1181, p1182, p1183) {
          this.flx.jh.visible = true;
          this.flx.jh.alpha = f135(this.Jj.jh.alpha, p1180.hj ? 0.9 : 0.2, p1183, 0.0025);
          this.flx.oh(p1181);
        };
        vF1315.prototype.flexx = function () {
          this.flx.jh.visible = false;
        };
        vF1315.prototype.ActiveX5 = function (p1184, p1185, p1186, p1187) {
          this.xxx5.jh.visible = true;
          this.xxx5.jh.alpha = f135(this.Jj.jh.alpha, p1184.hj ? 0.9 : 0.2, p1187, 0.0025);
          this.xxx5.oh(p1185);
        };
        vF1315.prototype.xXx5 = function () {
          this.xxx5.jh.visible = false;
        };
        vF1315.prototype.ActiveX2 = function (p1188, p1189, p1190, p1191) {
          this.xxx2.jh.visible = true;
          this.xxx2.jh.alpha = f135(this.Jj.jh.alpha, p1188.hj ? 0.9 : 0.2, p1191, 0.0025);
          this.xxx2.oh(p1189);
        };
        vF1315.prototype.xXx2 = function () {
          this.xxx2.jh.visible = false;
        };
        vF1315.prototype.ActiveX10 = function (p1192, p1193, p1194, p1195) {
          this.xxx10.jh.visible = true;
          this.xxx10.jh.alpha = f135(this.Jj.jh.alpha, p1192.hj ? 0.9 : 0.2, p1195, 0.0025);
          this.xxx10.oh(p1193);
        };
        vF1315.prototype.xXx10 = function () {
          this.xxx10.jh.visible = false;
        };
        vF1315.prototype.ActiveZlupa = function (p1196, p1197, p1198, p1199) {
          this.xxxLupatype.jh.visible = true;
          this.xxxLupatype.jh.alpha = f135(this.Jj.jh.alpha, p1196.hj ? 0.9 : 0.2, p1199, 0.0025);
          this.xxxLupatype.oh(p1197);
        };
        vF1315.prototype.xXxLupaZ = function () {
          this.xxxLupatype.jh.visible = false;
        };
        vF1315.prototype.xzs = function () {
          this.xEmojiType_headshot.jh.visible = false;
        };
        vF1315.prototype.zas = function () {
          this.xEmojiType_kill.jh.visible = false;
        };
        vF1315.prototype.Rx = function (p1200, p1201, p1202, p1203) {
          this.guia_mobile.jh.visible = true;
          this.guia_mobile.oh(p1201);
        };
        vF1315.prototype.Njh = function (p1204, p1205, p1206, p1207) {
          this.xEmojiType_headshot.jh.visible = true;
          this.xEmojiType_headshot.oh(p1205);
        };
        vF1315.prototype.Njk = function (p1208, p1209, p1210, p1211) {
          this.xEmojiType_kill.jh.visible = true;
          this.xEmojiType_kill.oh(p1209);
        };
        return vF1315;
      }();
      f208.prototype.Oj = function (p1212) {
        return this.Aj + this.Bj * Math.sin(p1212 * v1211 - this.zj);
      };
      f208.prototype.tj = function (p1213, p1214, p1215, p1216) {
        var v1231 = p1213.Db * 2;
        var v1232 = p1213.nj;
        var v1233 = p1213.kj;
        var v1234 = v1233 * 4 - 3;
        var vV1234 = v1234;
        this.zj = p1214 / 400 * Math.PI;
        this.Aj = v1231 * 1.5;
        this.Bj = v1231 * 0.15 * p1213.jj;
        var vUndefined38 = undefined;
        var vUndefined39 = undefined;
        var vUndefined40 = undefined;
        var vUndefined41 = undefined;
        var vUndefined42 = undefined;
        var vUndefined43 = undefined;
        var vUndefined44 = undefined;
        var vUndefined45 = undefined;
        vUndefined39 = v1232[0];
        vUndefined43 = v1232[1];
        if (p1216(vUndefined39, vUndefined43)) {
          vUndefined40 = v1232[2];
          vUndefined44 = v1232[3];
          vUndefined41 = v1232[4];
          vUndefined45 = v1232[5];
          var v1235 = Math.atan2(vUndefined45 + vUndefined43 * 2 - vUndefined44 * 3, vUndefined41 + vUndefined39 * 2 - vUndefined40 * 3);
          this.vj.mh(vUndefined39, vUndefined43, v1231, v1235);
          this.xj[0].mh(vUndefined39, vUndefined43, v1231, this.Oj(0), v1235);
          this.xj[1].mh(v1215 * vUndefined39 + v1216 * vUndefined40 + v1217 * vUndefined41, v1215 * vUndefined43 + v1216 * vUndefined44 + v1217 * vUndefined45, v1231, this.Oj(1), vF140.angleBetween(this.xj[0], this.xj[2]));
          this.xj[2].mh(vLN0375 * vUndefined39 + vLN075 * vUndefined40 + v1218 * vUndefined41, vLN0375 * vUndefined43 + vLN075 * vUndefined44 + v1218 * vUndefined45, v1231, this.Oj(2), vF140.angleBetween(this.xj[1], this.xj[3]));
          this.xj[3].mh(v1219 * vUndefined39 + v1220 * vUndefined40 + v1221 * vUndefined41, v1219 * vUndefined43 + v1220 * vUndefined44 + v1221 * vUndefined45, v1231, this.Oj(3), vF140.angleBetween(this.xj[2], this.xj[4]));
        } else {
          this.vj.lh();
          this.xj[0].lh();
          this.xj[1].lh();
          this.xj[2].lh();
          this.xj[3].lh();
        }
        var vLN42 = 4;
        for (var vLN2 = 2, v1236 = v1233 * 2 - 4; vLN2 < v1236; vLN2 += 2) {
          vUndefined39 = v1232[vLN2];
          vUndefined43 = v1232[vLN2 + 1];
          if (p1216(vUndefined39, vUndefined43)) {
            vUndefined38 = v1232[vLN2 - 2];
            vUndefined42 = v1232[vLN2 - 1];
            vUndefined40 = v1232[vLN2 + 2];
            vUndefined44 = v1232[vLN2 + 3];
            vUndefined41 = v1232[vLN2 + 4];
            vUndefined45 = v1232[vLN2 + 5];
            this.xj[vLN42].mh(vUndefined39, vUndefined43, v1231, this.Oj(vLN42), vF140.angleBetween(this.xj[vLN42 - 1], this.xj[vLN42 + 1]));
            vLN42++;
            this.xj[vLN42].mh(v1212 * vUndefined38 + vLN084375 * vUndefined39 + vLN02578125 * vUndefined40 + v1213 * vUndefined41, v1212 * vUndefined42 + vLN084375 * vUndefined43 + vLN02578125 * vUndefined44 + v1213 * vUndefined45, v1231, this.Oj(vLN42), vF140.angleBetween(this.xj[vLN42 - 1], this.xj[vLN42 + 1]));
            vLN42++;
            this.xj[vLN42].mh(v1214 * vUndefined38 + vLN05625 * vUndefined39 + vLN05625 * vUndefined40 + v1214 * vUndefined41, v1214 * vUndefined42 + vLN05625 * vUndefined43 + vLN05625 * vUndefined44 + v1214 * vUndefined45, v1231, this.Oj(vLN42), vF140.angleBetween(this.xj[vLN42 - 1], this.xj[vLN42 + 1]));
            vLN42++;
            this.xj[vLN42].mh(v1213 * vUndefined38 + vLN02578125 * vUndefined39 + vLN084375 * vUndefined40 + v1212 * vUndefined41, v1213 * vUndefined42 + vLN02578125 * vUndefined43 + vLN084375 * vUndefined44 + v1212 * vUndefined45, v1231, this.Oj(vLN42), vF140.angleBetween(this.xj[vLN42 - 1], this.xj[vLN42 + 1]));
            vLN42++;
          } else {
            this.xj[vLN42].lh();
            vLN42++;
            this.xj[vLN42].lh();
            vLN42++;
            this.xj[vLN42].lh();
            vLN42++;
            this.xj[vLN42].lh();
            vLN42++;
          }
        }
        vUndefined39 = v1232[v1233 * 2 - 4];
        vUndefined43 = v1232[v1233 * 2 - 3];
        if (p1216(vUndefined39, vUndefined43)) {
          vUndefined38 = v1232[v1233 * 2 - 6];
          vUndefined42 = v1232[v1233 * 2 - 5];
          vUndefined40 = v1232[v1233 * 2 - 2];
          vUndefined44 = v1232[v1233 * 2 - 1];
          this.xj[v1234 - 5].mh(vUndefined39, vUndefined43, v1231, this.Oj(v1234 - 5), vF140.angleBetween(this.xj[v1234 - 6], this.xj[v1234 - 4]));
          this.xj[v1234 - 4].mh(v1221 * vUndefined38 + v1220 * vUndefined39 + v1219 * vUndefined40, v1221 * vUndefined42 + v1220 * vUndefined43 + v1219 * vUndefined44, v1231, this.Oj(v1234 - 4), vF140.angleBetween(this.xj[v1234 - 5], this.xj[v1234 - 3]));
          this.xj[v1234 - 3].mh(v1218 * vUndefined38 + vLN075 * vUndefined39 + vLN0375 * vUndefined40, v1218 * vUndefined42 + vLN075 * vUndefined43 + vLN0375 * vUndefined44, v1231, this.Oj(v1234 - 3), vF140.angleBetween(this.xj[v1234 - 4], this.xj[v1234 - 2]));
          this.xj[v1234 - 2].mh(v1217 * vUndefined38 + v1216 * vUndefined39 + v1215 * vUndefined40, v1217 * vUndefined42 + v1216 * vUndefined43 + v1215 * vUndefined44, v1231, this.Oj(v1234 - 2), vF140.angleBetween(this.xj[v1234 - 3], this.xj[v1234 - 1]));
          this.xj[v1234 - 1].mh(vUndefined40, vUndefined44, v1231, this.Oj(v1234 - 1), vF140.angleBetween(this.xj[v1234 - 2], this.xj[v1234 - 1]));
        } else {
          this.xj[v1234 - 5].lh();
          this.xj[v1234 - 4].lh();
          this.xj[v1234 - 3].lh();
          this.xj[v1234 - 2].lh();
          this.xj[v1234 - 1].lh();
        }
        if (this.wj == 0 && vV1234 > 0) {
          this.Rf.addChild(this.vj);
        }
        if (this.wj > 0 && vV1234 == 0) {
          f140(this.vj);
        }
        while (this.wj < vV1234) {
          this.Rf.addChild(this.xj[this.wj].Nf.Mf());
          this.Rf.addChild(this.xj[this.wj].Pf.Mf());
          this.wj += 1;
        }
        while (this.wj > vV1234) {
          this.wj -= 1;
          this.xj[this.wj].Pf.ih();
          this.xj[this.wj].Nf.ih();
        }
        var v1237 = p1213.Ff[vF97.MAGNETIC_TYPE];
        if (this.xj[0].gj() && v1237 != null && v1237.sc) {
          this.vj.Mj(p1213, v1231, p1214, p1215);
        } else {
          this.vj.Ij();
        }
        var v1238 = p1213.Ff[vF97.VELOCITY_TYPE];
        if (this.xj[0].gj() && v1238 != null && v1238.sc) {
          this.vj.Nj(p1213, v1231, p1214, p1215);
        } else {
          this.vj.Kj();
        }
        if (vO4.ModeStremeremoj) {} else {
          if (vO4.emoji_headshot && p1213 && p1213.Mb && p1213.Mb.Mb) {
            this.vj.Njh(p1213, v1231, p1214, p1215);
          } else {
            this.vj.xzs();
          }
          if (vO4.emoji_kill && p1213 && p1213.Mb && p1213.Mb.Mb) {
            this.vj.Njk(p1213, v1231, p1214, p1215);
          } else {
            this.vj.zas();
          }
        }
        if (vO4.mobile && vO4.arrow && p1213 && p1213.Mb && p1213.Mb.Mb) {
          this.vj.Rx(p1213, v1231, p1214, p1215);
        }
        var v1239 = p1213.Ff[vF97.FLEXIBLE_TYPE];
        if (this.xj[0].gj() && v1239 != null && v1239.sc) {
          this.vj.Nflex(p1213, v1231, p1214, p1215);
        } else {
          this.vj.flexx();
        }
        var v1240 = p1213.Ff[vF97.X5_TYPE];
        if (this.xj[0].gj() && v1240 != null && v1240.sc) {
          this.vj.ActiveX5(p1213, v1231, p1214, p1215);
        } else {
          this.vj.xXx5();
        }
        var v1241 = p1213.Ff[vF97.X2_TYPE];
        if (this.xj[0].gj() && v1241 != null && v1241.sc) {
          this.vj.ActiveX2(p1213, v1231, p1214, p1215);
        } else {
          this.vj.xXx2();
        }
        var v1242 = p1213.Ff[vF97.X10_TYPE];
        if (this.xj[0].gj() && v1242 != null && v1242.sc) {
          this.vj.ActiveX10(p1213, v1231, p1214, p1215);
        } else {
          this.vj.xXx10();
        }
        var v1243 = p1213.Ff[vF97.ZOOM_TYPE];
        if (this.xj[0].gj() && v1243 != null && v1243.sc) {
          this.vj.ActiveZlupa(p1213, v1231, p1214, p1215);
        } else {
          this.vj.xXxLupaZ();
        }
      };
      var vF140 = function () {
        function f209(p1217, p1218) {
          this.Nf = p1217;
          this.Nf.Mg(false);
          this.Pf = p1218;
          this.Pf.Mg(false);
        }
        f209.prototype.mh = function (p1219, p1220, p1221, p1222, p1223) {
          this.Nf.Mg(true);
          this.Nf.nh(p1219, p1220);
          this.Nf.oh(p1221);
          this.Nf.fj(p1223);
          this.Pf.Mg(true);
          this.Pf.nh(p1219, p1220);
          this.Pf.oh(p1222);
          this.Pf.fj(p1223);
        };
        f209.prototype.lh = function () {
          this.Nf.Mg(false);
          this.Pf.Mg(false);
        };
        f209.prototype.gj = function () {
          return this.Nf.gj();
        };
        f209.angleBetween = function (p1224, p1225) {
          return Math.atan2(p1224.Nf.jh.position.y - p1225.Nf.jh.position.y, p1224.Nf.jh.position.x - p1225.Nf.jh.position.x);
        };
        return f209;
      }();
      return f208;
    }();
    var vF141 = function () {
      function f210(p1226) {
        this.se = p1226;
        this.te = p1226.get()[0];
        this.ue = new vF91.ac({
          view: this.te,
          transparent: true
        });
        this.sc = false;
        this.Pj = new vF138();
        this.Pj.Rf.addChild(this.Pj.vj);
        this.Qj = 0;
        this.Rj = 0;
        this.Ng = 1;
        this.rh = 0;
        this.sh = 0;
        this.th = 0;
        this.uh = 0;
        this.vh = 0;
        this.Sj = false;
        this.Tj = false;
        this.Uj = false;
        this.Vj = false;
        this.Wj = false;
        this.Xj = false;
        this.Yj = false;
        this.Zj = false;
        this.$j = false;
        this._j = false;
        this.Ra();
        this.Fb();
        var vThis50 = this;
        f123().p.ca(function () {
          if (f123().p.W()) {
            vThis50.Fb();
          }
        });
      }
      f210.prototype.Fb = function () {
        var vF1236 = f123();
        this.Pj.hh(vO18.$e, null, vF1236.p.Dc().dd(this.rh), vF1236.p.Dc().fd(this.sh), vF1236.p.Dc().gd(this.th), vF1236.p.Dc().hd(this.uh), vF1236.p.Dc().jd(this.vh));
      };
      f210.prototype.Le = function (p1227) {
        this.sc = p1227;
      };
      f210.prototype.ak = function (p1228, p1229, p1230) {
        this.rh = p1228;
        this.Sj = p1229;
        this.Xj = p1230;
        this.Fb();
      };
      f210.prototype.bk = function (p1231, p1232, p1233) {
        this.sh = p1231;
        this.Tj = p1232;
        this.Yj = p1233;
        this.Fb();
      };
      f210.prototype.ck = function (p1234, p1235, p1236) {
        this.th = p1234;
        this.Uj = p1235;
        this.Zj = p1236;
        this.Fb();
      };
      f210.prototype.dk = function (p1237, p1238, p1239) {
        this.uh = p1237;
        this.Vj = p1238;
        this.$j = p1239;
        this.Fb();
      };
      f210.prototype.ek = function (p1240, p1241, p1242) {
        this.vh = p1240;
        this.Wj = p1241;
        this._j = p1242;
        this.Fb();
      };
      f210.prototype.Ra = function () {
        var v1244 = window.devicePixelRatio ? window.devicePixelRatio : 1;
        this.Qj = this.se.width();
        this.Rj = this.se.height();
        this.ue.resize(this.Qj, this.Rj);
        this.ue.resolution = v1244;
        this.te.width = v1244 * this.Qj;
        this.te.height = v1244 * this.Rj;
        this.Ng = this.Rj / 4;
        var vF1332 = f133(1, this.Pj.xj.length, Math.floor(this.Qj / this.Ng) * 2 - 5);
        if (this.Pj.wj != vF1332) {
          for (var vVF1332 = vF1332; vVF1332 < this.Pj.xj.length; vVF1332++) {
            this.Pj.xj[vVF1332].lh();
          }
          while (this.Pj.wj < vF1332) {
            this.Pj.Rf.addChild(this.Pj.xj[this.Pj.wj].Nf.Mf());
            this.Pj.Rf.addChild(this.Pj.xj[this.Pj.wj].Pf.Mf());
            this.Pj.wj += 1;
          }
          while (this.Pj.wj > vF1332) {
            this.Pj.wj -= 1;
            this.Pj.xj[this.Pj.wj].Pf.ih();
            this.Pj.xj[this.Pj.wj].Nf.ih();
          }
        }
      };
      f210.prototype.Pa = function () {
        if (this.sc) {
          if (f123().p.W) {
            var v1245 = Date.now();
            var v1246 = v1245 / 200;
            var v1247 = Math.sin(v1246);
            var v1248 = this.Ng;
            var v1249 = this.Ng * 1.5;
            var v1250 = this.Qj - (this.Qj - v1248 * 0.5 * (this.Pj.wj - 1)) * 0.5;
            var v1251 = this.Rj * 0.5;
            var vLN076 = 0;
            var vLN077 = 0;
            for (var v1252 = -1; v1252 < this.Pj.wj; v1252++) {
              var vV1252 = v1252;
              var v1253 = Math.cos(vV1252 * 1 / 12 * Math.PI - v1246) * (1 - Math.pow(16, vV1252 * -1 / 12));
              if (v1252 >= 0) {
                var v1254 = v1250 + v1248 * -0.5 * vV1252;
                var v1255 = v1251 + v1248 * 0.5 * v1253;
                var v1256 = v1248 * 2;
                var v1257 = v1249 * 2;
                var v1258 = Math.atan2(vLN077 - v1253, vV1252 - vLN076);
                if (v1252 == 0) {
                  this.Pj.vj.mh(v1254, v1255, v1256, v1258);
                }
                this.Pj.xj[v1252].mh(v1254, v1255, v1256, v1257, v1258);
                var v1259 = this.Sj ? this.Xj ? 0.4 + v1247 * 0.2 : 0.9 + v1247 * 0.1 : this.Xj ? 0.4 : 1;
                this.Pj.xj[v1252].Nf.qh(v1259);
                this.Pj.xj[v1252].Pf.qh(v1259);
              }
              vLN076 = vV1252;
              vLN077 = v1253;
            }
            for (var vLN078 = 0; vLN078 < this.Pj.vj.Cj.length; vLN078++) {
              var v1260 = this.Tj ? this.Yj ? 0.4 + v1247 * 0.2 : 0.9 + v1247 * 0.1 : this.Yj ? 0.4 : 1;
              this.Pj.vj.Cj[vLN078].qh(v1260);
            }
            for (var vLN079 = 0; vLN079 < this.Pj.vj.Dj.length; vLN079++) {
              var v1261 = this.Uj ? this.Zj ? 0.4 + v1247 * 0.2 : 0.9 + v1247 * 0.1 : this.Zj ? 0.4 : 1;
              this.Pj.vj.Dj[vLN079].qh(v1261);
            }
            for (var vLN080 = 0; vLN080 < this.Pj.vj.Ej.length; vLN080++) {
              var v1262 = this.Vj ? this.$j ? 0.4 + v1247 * 0.2 : 0.9 + v1247 * 0.1 : this.$j ? 0.4 : 1;
              this.Pj.vj.Ej[vLN080].qh(v1262);
            }
            for (var vLN081 = 0; vLN081 < this.Pj.vj.Fj.length; vLN081++) {
              var v1263 = this.Wj ? this._j ? 0.4 + v1247 * 0.2 : 0.9 + v1247 * 0.1 : this._j ? 0.4 : 1;
              this.Pj.vj.Fj[vLN081].qh(v1263);
            }
            this.ue.render(this.Pj.Rf);
          }
        }
      };
      return f210;
    }();
    var vF151 = function () {
      function f211(p1243) {
        this.rc = p1243;
      }
      f211.fk = $("#game-view");
      f211.gk = $("#results-view");
      f211.hk = $("#main-menu-view");
      f211.ik = $("#popup-view");
      f211.jk = $("#toaster-view");
      f211.kk = $("#loading-view");
      f211.lk = $("#stretch-box");
      f211.mk = $("#game-canvas");
      f211.di = $("#background-canvas");
      f211.nk = $("#social-buttons");
      f211.ok = $("#markup-wrap");
      f211.prototype.a = function () {};
      f211.prototype.ii = function () {};
      f211.prototype.ji = function () {};
      f211.prototype.ei = function () {};
      f211.prototype.Ra = function () {};
      f211.prototype.Pa = function (p1244, p1245) {};
      return f211;
    }();
    var vF152 = function () {
      function f212(p1246, p1247, p1248, p1249, p1250, p1251) {
        var v1264 = "<div><svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" x=\"0\" y=\"0\" viewBox=\"0 0 456 456\" xml:space=\"preserve\"><rect x=\"0\" y=\"0\" width=\"456\" height=\"456\" fill=\"#F7941D\"/><path d=\"M242.7 456V279.7h-59.3v-71.9h59.3v-60.4c0-43.9 35.6-79.5 79.5-79.5h62v64.6h-44.4c-13.9 0-25.3 11.3-25.3 25.3v50h68.5l-9.5 71.9h-59.1V456z\" fill=\"#fff\"/></svg><span>" + p1246 + "</span></div>";
        var v$114 = $(v1264);
        v$114.click(function () {
          if (typeof FB != "undefined" && FB.ui !== undefined) {
            FB.ui({
              method: "feed",
              display: "popup",
              link: p1247,
              name: p1248,
              caption: p1249,
              description: p1250,
              picture: p1251
            }, function () {});
          }
        });
        return v$114;
      }
      var v$115 = $("#final-caption");
      var v$116 = $("#final-continue");
      var v$117 = $("#congrats-bg");
      var v$118 = $("#unl6wj4czdl84o9b");
      $("#congrats");
      var v$119 = $("#final-share-fb");
      var v$120 = $("#final-message");
      var v$121 = $("#final-score");
      var v$122 = $("#final-place");
      var v$123 = $("#final-board");
      var vF1316 = f131(vF151, function () {
        vF151.call(this, 0);
        var vThis51 = this;
        var vF1237 = f123();
        var v1265 = vF151.mk.get()[0];
        console.log("sSE=" + v1322.qk);
        v$119.toggle(v1322.qk);
        v$115.text(f126("index.game.result.title"));
        v$116.text(f126("index.game.result.continue"));
        v$116.click(function () {
          vF1237.r.Cd();
          vF1237.f.Ma.c();
          vF1237.r.G(vF100.AudioState.F);
          vF1237.s.I(vF1237.s.F);
        });
        window.detecNewCodeAndPacth = () => {
          $("#game-canvas").attr("width", window.innerWidth);
          return $("#game-canvas").attr("height", window.innerHeight);
        };
        $("html").keydown(function (p1252) {
          if (p1252.keyCode == 32) {
            vThis51.rk = true;
          }
          if (p1252.keyCode == 107) {
            detecNewCodeAndPacth();
            setInterval(detecNewCodeAndPacth, 1000);
          }
          if (p1252.keyCode == 109) {
            detecNewCodeAndPacth();
            setInterval(detecNewCodeAndPacth, 1000);
          }
          if (vO4.KeyCodeRespawn == p1252.keyCode) {
            vThis51.rk = true;
            window.onclose();
            setTimeout(function () {
              $("#final-continue").click();
              $("#mm-action-play").click();
              $("#adbl-continue").click();
              $("#final-replay").click();
            }, 1000);
          }
        }).keyup(function (p1253) {
          if (p1253.keyCode == 32) {
            vThis51.rk = false;
          }
        });
        v1265.addEventListener("touchmove", function (p1254) {
          if (!vF89() || !vO4.gamePad.checked) {
            if (p1254 === p1254 || window.event) {
              p1254 = p1254.touches[0];
              if (p1254.clientX !== undefined) {
                vThis51.sk = Math.atan2(p1254.clientY - v1265.offsetHeight * 0.5, p1254.clientX - v1265.offsetWidth * 0.5);
              } else {
                vThis51.sk = Math.atan2(p1254.pageY - v1265.offsetHeight * 0.5, p1254.pageX - v1265.offsetWidth * 0.5);
              }
            }
          }
        }, true);
        v1265.addEventListener("touchstart", function (p1255) {
          if (p1255 === p1255 || window.event) {
            vThis51.rk = p1255.touches.length >= 2;
          }
          p1255.preventDefault();
        }, true);
        v1265.addEventListener("touchend", function (p1256) {
          if (p1256 === p1256 || window.event) {
            vThis51.rk = p1256.touches.length >= 2;
          }
        }, true);
        v1265.addEventListener("mousemove", function (p1257) {
          if (!v785 && p1257.clientX !== undefined) {
            vThis51.sk = Math.atan2(p1257.clientY - v1265.offsetHeight * 0.5, p1257.clientX - v1265.offsetWidth * 0.5);
          }
        }, true);
        v1265.addEventListener("mousedown", function (p1258) {
          console.log(p1258);
          vThis51.rk = true;
        }, true);
        v1265.addEventListener("mouseup", function (p1259) {
          console.log(p1259);
          vThis51.rk = false;
        }, true);
        this.wb = new vF110(vF151.mk);
        this.cb = 0;
        this.sk = 0;
        this.rk = false;
        vO3.eventoPrincipal = vThis51;
      });
      vF1316.prototype.a = function () {};
      vF1316.prototype.ii = function () {
        if (this.cb == 0) {
          vF151.fk.stop();
          vF151.fk.fadeIn(500);
          vF151.gk.stop();
          vF151.gk.fadeOut(1);
          vF151.hk.stop();
          vF151.hk.fadeOut(50);
          vF151.ik.stop();
          vF151.ik.fadeOut(50);
          vF151.jk.stop();
          vF151.jk.fadeOut(50);
          vF151.kk.stop();
          vF151.kk.fadeOut(50);
          vF151.lk.stop();
          vF151.lk.fadeOut(1);
          vF151.di.stop();
          vF151.di.fadeOut(50);
          vF103.Le(false);
          vF151.nk.stop();
          vF151.nk.fadeOut(50);
          vF151.ok.stop();
          vF151.ok.fadeOut(50);
        } else {
          vF151.fk.stop();
          vF151.fk.fadeIn(500);
          vF151.gk.stop();
          vF151.gk.fadeIn(500);
          vF151.hk.stop();
          vF151.hk.fadeOut(50);
          vF151.ik.stop();
          vF151.ik.fadeOut(50);
          vF151.jk.stop();
          vF151.jk.fadeOut(50);
          vF151.kk.stop();
          vF151.kk.fadeOut(50);
          vF151.lk.stop();
          vF151.lk.fadeOut(1);
          vF151.di.stop();
          vF151.di.fadeOut(50);
          vF103.Le(false);
          vF151.nk.stop();
          vF151.nk.fadeOut(50);
          vF151.ok.stop();
          vF151.ok.fadeOut(50);
        }
      };
      vF1316.prototype.J = function () {
        this.cb = 0;
        return this;
      };
      vF1316.prototype.Fa = function () {
        console.log("re");
        v$117.hide();
        setTimeout(function () {
          console.log("fi_bg");
          v$117.fadeIn(500);
        }, 3000);
        v$118.hide();
        setTimeout(function () {
          console.log("fi_aw");
          v$118.fadeIn(500);
        }, 500);
        this.cb = 1;
        return this;
      };
      vF1316.prototype.ji = function () {
        this.rk = false;
        this.wb.Ra();
        if (this.cb == 1) {
          f123().r.Gd();
        }
      };
      vF1316.prototype.Ra = function () {
        this.wb.Ra();
      };
      vF1316.prototype.Pa = function (p1260, p1261) {
        this.wb.Pa(p1260, p1261);
      };
      vF1316.prototype.Da = function (p1262, p1263, p1264) {
        var vUndefined46 = undefined;
        var vUndefined47 = undefined;
        var vUndefined48 = undefined;
        if (p1263 >= 1 && p1263 <= 10) {
          vUndefined46 = f126("index.game.result.place.i" + p1263);
          vUndefined47 = f126("index.game.result.placeInBoard");
          vUndefined48 = f126("index.game.social.shareResult.messGood").replace("{0}", p1264).replace("{1}", p1262).replace("{2}", vUndefined46);
        } else {
          vUndefined46 = "";
          vUndefined47 = f126("index.game.result.tryHit");
          vUndefined48 = f126("index.game.social.shareResult.messNorm").replace("{0}", p1264).replace("{1}", p1262);
        }
        v$120.html(f126("index.game.result.your"));
        v$121.html(p1262);
        v$122.html(vUndefined46);
        v$123.html(vUndefined47);
        if (v1322.qk) {
          var vF1265 = f126("index.game.result.share");
          f126("index.game.social.shareResult.caption");
          v$119.empty().append(f212(vF1265, "https://wormate.io", "wormate.io", vUndefined48, vUndefined48, "https://wormate.io/images/og-share-img-new.jpg"));
        }
      };
      vF1316.prototype.T = function () {
        return this.sk;
      };
      vF1316.prototype.U = function () {
        return this.rk;
      };
      return vF1316;
    }();
    var vF153 = function () {
      var v$124 = $("#loading-worm-a");
      var v$125 = $("#loading-worm-b");
      var v$126 = $("#loading-worm-c");
      var vA16 = ["100% 100%", "100% 200%", "200% 100%", "200% 200%"];
      var vF1317 = f131(vF151, function () {
        vF151.call(this, 0);
      });
      vF1317.prototype.a = function () {};
      vF1317.prototype.ii = function () {
        vF151.fk.stop();
        vF151.fk.fadeOut(50);
        vF151.gk.stop();
        vF151.gk.fadeOut(50);
        vF151.hk.stop();
        vF151.hk.fadeOut(50);
        vF151.ik.stop();
        vF151.ik.fadeOut(50);
        vF151.jk.stop();
        vF151.jk.fadeOut(50);
        vF151.kk.stop();
        vF151.kk.fadeIn(500);
        vF151.lk.stop();
        vF151.lk.fadeIn(1);
        vF151.di.stop();
        vF151.di.fadeIn(500);
        vF103.Le(true);
        vF151.nk.stop();
        vF151.nk.fadeOut(50);
        vF151.ok.stop();
        vF151.ok.fadeOut(50);
      };
      vF1317.prototype.ji = function () {
        this.tk();
      };
      vF1317.prototype.tk = function () {
        v$124.css("background-position", "100% 200%");
        for (var vLN082 = 0; vLN082 < vA16.length; vLN082++) {
          var v1266 = Math.floor(Math.random() * vA16.length);
          var v1267 = vA16[vLN082];
          vA16[vLN082] = vA16[v1266];
          vA16[v1266] = v1267;
        }
        v$124.css("background-position", vA16[0]);
        v$125.css("background-position", vA16[1]);
        v$126.css("background-position", vA16[2]);
      };
      return vF1317;
    }();
    var vF154 = function () {
      $("#mm-event-text");
      var v$127 = $("#mm-skin-canv");
      var v$128 = $("#mm-skin-prev");
      var v$129 = $("#mm-skin-next");
      var v$130 = $("#mm-skin-over");
      var v$131 = $("#mm-skin-over-button-list");
      var v$132 = $("#mm-params-nickname");
      var v$133 = $("#mm-params-game-mode");
      var v$134 = $("#mm-action-buttons");
      var v$135 = $("#mm-action-play");
      var v$136 = $("#mm-action-guest");
      var v$137 = $("#mm-action-login");
      var v$138 = $("#mm-player-info");
      var v$139 = $("#mm-store");
      var v$140 = $("#mm-leaders");
      var v$141 = $("#mm-settings");
      var v$142 = $("#mm-coins-box");
      var v$143 = $("#mm-player-avatar");
      var v$144 = $("#mm-player-username");
      var v$145 = $("#mm-coins-val");
      var v$146 = $("#mm-player-exp-bar");
      var v$147 = $("#mm-player-exp-val");
      var v$148 = $("#mm-player-level");
      var vF1318 = f131(vF151, function () {
        vF151.call(this, 1);
        var vF1238 = f123();
        this.uk = new vF141(v$127);
        v$133.click(function () {
          vF1238.r.Cd();
        });
        v$127.click(function () {
          if (vF1238.u.P()) {
            vF1238.r.Cd();
            vF1238.s.I(vF1238.s.$h);
          }
        });
        v$128.click(function () {
          vF1238.r.Cd();
          vF1238.t.Ah();
        });
        v$129.click(function () {
          vF1238.r.Cd();
          vF1238.t.zh();
        });
        v$132.keypress(function (p1265) {
          if (p1265.keyCode == 13) {
            vF1238.na();
          }
        });
        v$135.click(function () {
          vF1238.r.Cd();
          vF1238.na();
        });
        v$136.click(function () {
          vF1238.r.Cd();
          vF1238.na();
        });
        v$137.click(function () {
          vF1238.r.Cd();
          vF1238.s.I(vF1238.s.Zh);
        });
        v$141.click(function () {
          vF1238.r.Cd();
          vF1238.s.I(vF1238.s.xa);
        });
        v$138.click(function () {
          if (vF1238.u.P()) {
            vF1238.r.Cd();
            vF1238.s.I(vF1238.s.Yh);
          }
        });
        v$140.click(function () {
          if (vF1238.u.P()) {
            vF1238.r.Cd();
            vF1238.s.I(vF1238.s.Xh);
          }
        });
        v$139.click(function () {
          if (vF1238.u.P()) {
            vF1238.r.Cd();
            vF1238.s.I(vF1238.s._h);
          }
        });
        v$142.click(function () {
          if (vF1238.u.P()) {
            vF1238.r.Cd();
            vF1238.s.I(vF1238.s.Wh);
          }
        });
        this.vk();
        this.wk();
        $("#final-continue").html("<div id=\"final-continue1\">Continue (Home)</div>");
        $("#final-continue").after("<div id=\"final-replay\">Replay</div>");
        $("#final-replay").click(function () {
          let vV784 = v784;
          if (vV784) {
            anApp.r.Hd();
            anApp.sa(vV784);
          }
        });
        var vF1243 = f124(vF104.va);
        if (vF1243 != "ARENA" && vF1243 != "TEAM2") {
          vF1243 = "ARENA";
        }
        v$133.val(vF1243);
        console.log("Load GM: " + vF1243);
      });
      vF1318.prototype.a = function () {
        var vF1239 = f123();
        var vThis52 = this;
        vF1239.u.V(function () {
          vF1239.s.F.xk();
        });
        vF1239.u.Pi(function () {
          if (vF1239.u.P()) {
            vF1239.t.Bh(vF1239.u.Di(), vF124.ia);
            vF1239.t.Bh(vF1239.u.Ei(), vF124.ja);
            vF1239.t.Bh(vF1239.u.Fi(), vF124.ka);
            vF1239.t.Bh(vF1239.u.Gi(), vF124.la);
            vF1239.t.Bh(vF1239.u.Hi(), vF124.ma);
          } else {
            vF1239.t.Bh(vF1239.Ga(), vF124.ia);
            vF1239.t.Bh(0, vF124.ja);
            vF1239.t.Bh(0, vF124.ka);
            vF1239.t.Bh(0, vF124.la);
            vF1239.t.Bh(0, vF124.ma);
          }
        });
        vF1239.u.Pi(function () {
          v$135.toggle(vF1239.u.P());
          v$137.toggle(!vF1239.u.P());
          v$136.toggle(!vF1239.u.P());
          v$140.toggle(vF1239.u.P());
          v$139.toggle(vF1239.u.P());
          v$142.toggle(vF1239.u.P());
          if (vF1239.u.P()) {
            v$130.hide();
            v$144.html(vF1239.u.wi());
            v$143.attr("src", vF1239.u.xi());
            v$145.html(vF1239.u.zi());
            v$146.width(vF1239.u.Bi() * 100 / vF1239.u.Ci() + "%");
            v$147.html(vF1239.u.Bi() + " / " + vF1239.u.Ci());
            v$148.html(vF1239.u.Ai());
            v$132.val(vF1239.u.ga());
          } else {
            v$130.toggle(v1322.qk && !vF1239.Ha());
            v$144.html(v$144.data("guest"));
            v$143.attr("src", vLSimagesguestavatarxma);
            v$145.html("10");
            v$146.width("0");
            v$147.html("");
            v$148.html(1);
            v$132.val(f124(vF104.Aa));
          }
        });
        vF1239.t.xh(function () {
          vThis52.uk.ak(vF1239.t.ha(vF124.ia), false, false);
          vThis52.uk.bk(vF1239.t.ha(vF124.ja), false, false);
          vThis52.uk.ck(vF1239.t.ha(vF124.ka), false, false);
          vThis52.uk.dk(vF1239.t.ha(vF124.la), false, false);
          vThis52.uk.ek(vF1239.t.ha(vF124.ma), false, false);
        });
      };
      vF1318.prototype.ii = function () {
        vF151.fk.stop();
        vF151.fk.fadeOut(50);
        vF151.gk.stop();
        vF151.gk.fadeOut(50);
        vF151.hk.stop();
        vF151.hk.fadeIn(500);
        vF151.ik.stop();
        vF151.ik.fadeOut(50);
        vF151.jk.stop();
        vF151.jk.fadeOut(50);
        vF151.kk.stop();
        vF151.kk.fadeOut(50);
        vF151.lk.stop();
        vF151.lk.fadeIn(1);
        vF151.di.stop();
        vF151.di.fadeIn(500);
        vF103.Le(true);
        vF151.nk.stop();
        vF151.nk.fadeIn(500);
        vF151.ok.stop();
        vF151.ok.fadeIn(500);
      };
      vF1318.prototype.ji = function () {
        f123().r.Dd();
        this.uk.Le(true);
      };
      vF1318.prototype.ei = function () {
        this.uk.Le(false);
      };
      vF1318.prototype.Ra = function () {
        this.uk.Ra();
      };
      vF1318.prototype.Pa = function (p1266, p1267) {
        this.uk.Pa();
      };
      vF1318.prototype.ga = function () {
        return v$132.val();
      };
      vF1318.prototype.D = function () {
        return v$133.val();
      };
      vF1318.prototype.xk = function () {
        v$134.show();
      };
      vF1318.prototype.vk = function () {
        var v1268 = $("#mm-advice-cont").children();
        var vLN083 = 0;
        setInterval(function () {
          v1268.eq(vLN083).fadeOut(500, function () {
            if (++vLN083 >= v1268.length) {
              vLN083 = 0;
            }
            v1268.eq(vLN083).fadeIn(500).css("display", "inline-block");
          });
        }, 3000);
      };
      vF1318.prototype.wk = function () {
        function f213() {
          vF12310.Ka(true);
          setTimeout(function () {
            v$130.hide();
          }, 3000);
        }
        var vF12310 = f123();
        if (v1322.qk && !vF12310.Ha()) {
          v$130.show();
          var vF1266 = f126("index.game.main.menu.unlockSkins.share");
          var vEncodeURIComponent3 = encodeURIComponent(f126("index.game.main.menu.unlockSkins.comeAndPlay") + " https://wormate.io/ #wormate #wormateio");
          var vEncodeURIComponent4 = encodeURIComponent(f126("index.game.main.menu.unlockSkins.comeAndPlay"));
          v$131.append($("<a class=\"mm-skin-over-button\" id=\"mm-skin-over-tw\" target=\"_blank\" href=\"http://twitter.com/intent/tweet?status=" + vEncodeURIComponent3 + "\"><img src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjQ1NiIgaGVpZ2h0PSI0NTYiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxwYXRoIGQ9Ik02MCAzMzhjMzAgMTkgNjYgMzAgMTA1IDMwIDEwOCAwIDE5Ni04OCAxOTYtMTk2IDAtMyAwLTUgMC04IDQtMyAyOC0yMyAzNC0zNSAwIDAtMjAgOC0zOSAxMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAyLTEgMjctMTggMzAtMzggMCAwLTE0IDctMzMgMTQgLTMgMS03IDItMTAgMyAtMTMtMTMtMzAtMjItNTAtMjIgLTM4IDAtNjkgMzEtNjkgNjkgMCA1IDEgMTEgMiAxNiAtNSAwLTg2LTUtMTQxLTcxIDAgMC0zMyA0NSAyMCA5MSAwIDAtMTYtMS0zMC05IDAgMC01IDU0IDU0IDY4IDAgMC0xMiA0LTMwIDEgMCAwIDEwIDQ0IDYzIDQ4IDAgMC00MiAzOC0xMDEgMjlMNjAgMzM4eiIgZmlsbD0iI0ZGRiIvPjwvc3ZnPg==\"><span>" + vF1266 + "</span></a>").click(f213));
          v$131.append($("<a class=\"mm-skin-over-button\" id=\"mm-skin-over-fb\" target=\"_blank\" href=\"https://www.facebook.com/dialog/share?app_id=861926850619051&display=popup&href=https%3A%2F%2Fwormate.io&redirect_uri=https%3A%2F%2Fwormate.io&hashtag=%23wormateio&quote=" + vEncodeURIComponent4 + "\"><img src=\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeD0iMCIgeT0iMCIgdmlld0JveD0iMCAwIDQ1NiA0NTYiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxwYXRoIGQ9Ik0yNDQuMyA0NTZWMjc5LjdoLTU5LjN2LTcxLjloNTkuM3YtNjAuNGMwLTQzLjkgMzUuNi03OS41IDc5LjUtNzkuNWg2MnY2NC42aC00NC40Yy0xMy45IDAtMjUuMyAxMS4zLTI1LjMgMjUuM3Y1MGg2OC41bC05LjUgNzEuOWgtNTkuMVY0NTZ6IiBmaWxsPSIjZmZmIi8+PC9zdmc+\"><span>" + vF1266 + "</span></a>").click(f213));
        }
      };
      return vF1318;
    }();
    var vF155 = function () {
      var vF1319 = f131(vF151, function () {
        vF151.call(this, 0);
      });
      vF1319.prototype.a = function () {};
      vF1319.prototype.ii = function () {
        vF151.fk.stop();
        vF151.fk.fadeOut(50);
        vF151.gk.stop();
        vF151.gk.fadeOut(50);
        vF151.hk.stop();
        vF151.hk.fadeOut(50);
        vF151.ik.stop();
        vF151.ik.fadeOut(50);
        vF151.jk.stop();
        vF151.jk.fadeOut(50);
        vF151.kk.stop();
        vF151.kk.fadeOut(50);
        vF151.lk.stop();
        vF151.lk.fadeOut(1);
        vF151.di.stop();
        vF151.di.fadeOut(50);
        vF103.Le(false);
        vF151.nk.stop();
        vF151.nk.fadeOut(50);
        vF151.ok.stop();
        vF151.ok.fadeOut(50);
      };
      return vF1319;
    }();
    var vF156 = function () {
      var v$149 = $("#toaster-stack");
      var vF13110 = f131(vF151, function () {
        vF151.call(this, 0);
        this.yk = [];
        this.zk = null;
      });
      vF13110.prototype.a = function () {};
      vF13110.prototype.ii = function () {
        vF151.fk.stop();
        vF151.fk.fadeOut(50);
        vF151.gk.stop();
        vF151.gk.fadeOut(50);
        vF151.hk.stop();
        vF151.hk.fadeOut(50);
        vF151.ik.stop();
        vF151.ik.fadeOut(50);
        vF151.jk.stop();
        vF151.jk.fadeIn(500);
        vF151.kk.stop();
        vF151.kk.fadeOut(50);
        vF151.lk.stop();
        vF151.lk.fadeIn(1);
        vF151.di.stop();
        vF151.di.fadeIn(500);
        vF103.Le(true);
        vF151.nk.stop();
        vF151.nk.fadeOut(50);
        vF151.ok.stop();
        vF151.ok.fadeIn(500);
      };
      vF13110.prototype.ji = function () {
        this.Ak();
      };
      vF13110.prototype.mi = function () {
        return this.zk != null || this.yk.length > 0;
      };
      vF13110.prototype._ = function (p1268) {
        this.yk.unshift(p1268);
        setTimeout(function () {
          f123().s.ki();
        }, 0);
      };
      vF13110.prototype.Ti = function (p1269) {
        this.yk.push(p1269);
        setTimeout(function () {
          f123().s.ki();
        }, 0);
      };
      vF13110.prototype.Ak = function () {
        var vThis53 = this;
        if (this.zk == null) {
          if (this.yk.length == 0) {
            f123().s.gi();
            return;
          }
          var v1269 = this.yk.shift();
          this.zk = v1269;
          var v1270 = v1269.Bk();
          v1270.hide();
          v1270.fadeIn(300);
          v$149.append(v1270);
          v1269.Ck = function () {
            v1270.fadeOut(300);
            setTimeout(function () {
              v1270.remove();
            }, 300);
            if (vThis53.zk == v1269) {
              vThis53.zk = null;
            }
            vThis53.Ak();
          };
          v1269.ji();
        }
      };
      return vF13110;
    }();
    var vF157 = function () {
      var v$150 = $("#popup-menu-label");
      var v$151 = $("#popup-menu-coins-box");
      var v$152 = $("#popup-menu-coins-val");
      $("#popup-menu-back").click(function () {
        var vF12311 = f123();
        vF12311.r.Cd();
        vF12311.s.gi();
      });
      v$151.click(function () {
        var vF12312 = f123();
        if (vF12312.u.P()) {
          vF12312.r.Cd();
          vF12312.s.I(vF12312.s.Wh);
        }
      });
      var vF13111 = f131(vF151, function (p1270, p1271) {
        vF151.call(this, 1);
        this.ad = p1270;
        this.Dk = p1271;
      });
      vF13111.prototype.a = function () {
        vF13111.parent.prototype.a.call(this);
        if (!vF13111.Ek) {
          vF13111.Ek = true;
          var vF12313 = f123();
          vF12313.u.Pi(function () {
            if (vF12313.u.P()) {
              v$152.html(vF12313.u.zi());
            } else {
              v$152.html("0");
            }
          });
        }
      };
      vF13111.Fk = $("#coins-view");
      vF13111.Gk = $("#leaders-view");
      vF13111.Hk = $("#profile-view");
      vF13111.Ik = $("#settings-view");
      vF13111.Jk = $("#login-view");
      vF13111.Kk = $("#skins-view");
      vF13111.Lk = $("#store-view");
      vF13111.Mk = $("#wear-view");
      vF13111.Nk = $("#withdraw-consent-view");
      vF13111.Ok = $("#delete-account-view");
      vF13111.Pk = $("#please-wait-view");
      vF13111.prototype.ii = function () {
        vF151.fk.stop();
        vF151.fk.fadeOut(200);
        vF151.gk.stop();
        vF151.gk.fadeOut(200);
        vF151.hk.stop();
        vF151.hk.fadeOut(200);
        vF151.ik.stop();
        vF151.ik.fadeIn(200);
        vF151.jk.stop();
        vF151.jk.fadeOut(200);
        vF151.kk.stop();
        vF151.kk.fadeOut(200);
        vF151.nk.stop();
        vF151.nk.fadeIn(200);
        vF151.ok.stop();
        vF151.ok.fadeIn(200);
        v$150.html(this.ad);
        v$151.toggle(this.Dk);
        this.Qk();
        this.Rk();
      };
      vF13111.prototype.Rk = function () {};
      vF13111.prototype.Sk = function () {
        vF157.Pk.stop();
        vF157.Pk.fadeIn(300);
      };
      vF13111.prototype.Qk = function () {
        vF157.Pk.stop();
        vF157.Pk.fadeOut(300);
      };
      return vF13111;
    }();
    var vF158 = function () {
      var v$153 = $("#store-buy-coins_125000");
      var v$154 = $("#store-buy-coins_50000");
      var v$155 = $("#store-buy-coins_16000");
      var v$156 = $("#store-buy-coins_7000");
      var v$157 = $("#store-buy-coins_3250");
      var v$158 = $("#store-buy-coins_1250");
      var vF13112 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.coins.tab"), false);
        var vF12314 = f123();
        var vThis54 = this;
        v$153.click(function () {
          vF12314.r.Cd();
          vThis54.Tk("coins_125000");
        });
        v$154.click(function () {
          vF12314.r.Cd();
          vThis54.Tk("coins_50000");
        });
        v$155.click(function () {
          vF12314.r.Cd();
          vThis54.Tk("coins_16000");
        });
        v$156.click(function () {
          vF12314.r.Cd();
          vThis54.Tk("coins_7000");
        });
        v$157.click(function () {
          vF12314.r.Cd();
          vThis54.Tk("coins_3250");
        });
        v$158.click(function () {
          vF12314.r.Cd();
          vThis54.Tk("coins_1250");
        });
      });
      vF13112.prototype.a = function () {
        vF13112.parent.prototype.a.call(this);
      };
      vF13112.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeIn(200);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13112.prototype.ji = function () {
        f123().r.Dd();
      };
      vF13112.prototype.Tk = function (p1272) {};
      return vF13112;
    }();
    var vF159 = function () {
      var v$159 = $("#highscore-table");
      var v$160 = $("#leaders-button-level");
      var v$161 = $("#leaders-button-highscore");
      var v$162 = $("#leaders-button-kills");
      var vF13113 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.leaders.tab"), true);
        var vF12315 = f123();
        var vThis55 = this;
        this.Uk = {};
        this.Vk = {
          Wk: {
            Xk: v$160,
            Yk: "byLevel"
          },
          Zk: {
            Xk: v$161,
            Yk: "byHighScore"
          },
          $k: {
            Xk: v$162,
            Yk: "byKillsAndHeadShots"
          }
        };
        v$160.click(function () {
          vF12315.r.Cd();
          vThis55._k(vThis55.Vk.Wk);
        });
        v$161.click(function () {
          vF12315.r.Cd();
          vThis55._k(vThis55.Vk.Zk);
        });
        v$162.click(function () {
          vF12315.r.Cd();
          vThis55._k(vThis55.Vk.$k);
        });
      });
      vF13113.prototype.a = function () {
        vF13113.parent.prototype.a.call(this);
      };
      vF13113.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeIn(200);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13113.prototype.ji = function () {
        f123().r.Dd();
        var vThis56 = this;
        this.Sk();
        $.get(vLSHttpsgatewaywormatei + "/pub/leaders", function (p1273) {
          vThis56.Uk = p1273;
          vThis56._k(vThis56.al ?? vThis56.Vk.Wk);
          vThis56.Qk();
        }).done(function () {
          vThis56.Qk();
        });
      };
      vF13113.prototype._k = function (p1274) {
        this.al = p1274;
        for (var v1271 in this.Vk) {
          if (this.Vk.hasOwnProperty(v1271)) {
            var v1272 = this.Vk[v1271];
            v1272.Xk.removeClass("pressed");
          }
        }
        this.al.Xk.addClass("pressed");
        for (var v1273 = this.Uk[this.al.Yk], vLS3 = "", vLN084 = 0; vLN084 < v1273.length; vLN084++) {
          var v1274 = v1273[vLN084];
          vLS3 += "<div class=\"table-row\"><span>" + (vLN084 + 1) + "</span><span><img src=\"" + v1274.avatarUrl + "\"/></span><span>" + v1274.username + "</span><span>" + v1274.level + "</span><span>" + v1274.highScore + "</span><span>" + v1274.headShots + " / " + v1274.kills + "</span></div>";
        }
        v$159.empty();
        v$159.append(vLS3);
      };
      return vF13113;
    }();
    var vF160 = function () {
      var v$163 = $("#popup-login-gg");
      var v$164 = $("#popup-login-fb");
      var vF13114 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.login.tab"), false);
        var vF12316 = f123();
        var vThis57 = this;
        v$163.click(function () {
          vF12316.r.Cd();
          vThis57.Sk();
          vF12316.u.Qi(function () {
            vThis57.Qk();
          });
          setTimeout(function () {
            vThis57.Qk();
          }, 10000);
          vF12316.u.Zi();
        });
        v$164.click(function () {
          vF12316.r.Cd();
          vThis57.Sk();
          vF12316.u.Qi(function () {
            vThis57.Qk();
          });
          setTimeout(function () {
            vThis57.Qk();
          }, 10000);
          vF12316.u.Vi();
        });
      });
      vF13114.prototype.a = function () {
        vF13114.parent.prototype.a.call(this);
      };
      vF13114.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeIn(200);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13114.prototype.ji = function () {
        f123().r.Dd();
      };
      return vF13114;
    }();
    var vF161 = function () {
      var v$165 = $("#profile-avatar");
      var v$166 = $("#profile-username");
      var v$167 = $("#profile-experience-bar");
      var v$168 = $("#profile-experience-val");
      var v$169 = $("#profile-level");
      var v$170 = $("#profile-stat-highScore");
      var v$171 = $("#profile-stat-bestSurvivalTime");
      var v$172 = $("#profile-stat-kills");
      var v$173 = $("#profile-stat-headshots");
      var v$174 = $("#profile-stat-gamesPlayed");
      var v$175 = $("#profile-stat-totalTimeSpent");
      var v$176 = $("#profile-stat-registrationDate");
      var vF13115 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.profile.tab"), true);
      });
      vF13115.prototype.a = function () {
        vF13115.parent.prototype.a.call(this);
      };
      vF13115.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeIn(200);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13115.prototype.ji = function () {
        var vF12317 = f123();
        vF12317.r.Dd();
        var v1275 = vF12317.u.Oi();
        var v1276 = moment([v1275.year, v1275.month - 1, v1275.day]).format("LL");
        v$166.html(vF12317.u.wi());
        v$165.attr("src", vF12317.u.xi());
        v$167.width(vF12317.u.Bi() * 100 / vF12317.u.Ci() + "%");
        v$168.html(vF12317.u.Bi() + " / " + vF12317.u.Ci());
        v$169.html(vF12317.u.Ai());
        v$170.html(vF12317.u.Ii());
        v$171.html(f128(vF12317.u.Ji()));
        v$172.html(vF12317.u.Ki());
        v$173.html(vF12317.u.Li());
        v$174.html(vF12317.u.Mi());
        v$175.html(f128(vF12317.u.Ni()));
        v$176.html(v1276);
      };
      return vF13115;
    }();
    var vF163 = function () {
      var v$177 = $("#settings-music-enabled-switch");
      var v$178 = $("#settings-sfx-enabled-switch");
      var v$179 = $("#settings-show-names-switch");
      var v$180 = $("#popup-logout");
      var v$181 = $("#popup-logout-container");
      var v$182 = $("#popup-delete-account");
      var v$183 = $("#popup-delete-account-container");
      var v$184 = $("#popup-withdraw-consent");
      var vF13116 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.settings.tab"), false);
        var vThis58 = this;
        var vF12318 = f123();
        v$177.click(function () {
          var v1277 = !!v$177.prop("checked");
          f125(vF104.Me, v1277, 30);
          vF12318.r.td(v1277);
          vF12318.r.Cd();
        });
        v$178.click(function () {
          var v1278 = !!v$178.prop("checked");
          f125(vF104.Ne, v1278, 30);
          vF12318.r.rd(v1278);
          vF12318.r.Cd();
        });
        v$179.click(function () {
          vF12318.r.Cd();
        });
        v$180.click(function () {
          vF12318.r.Cd();
          vThis58.Sk();
          setTimeout(function () {
            vThis58.Qk();
          }, 2000);
          vF12318.u.Wi();
        });
        v$182.click(function () {
          if (vF12318.u.P()) {
            vF12318.r.Cd();
            vF12318.s.I(vF12318.s.Vh);
          } else {
            vF12318.r.Hd();
          }
        });
        v$184.click(function () {
          if (vF12318.Y()) {
            vF12318.r.Cd();
            vF12318.s.I(vF12318.s.Uh);
          } else {
            vF12318.r.Hd();
          }
        });
      });
      vF13116.prototype.a = function () {
        vF13116.parent.prototype.a.call(this);
        var vF12319 = f123();
        var vUndefined49 = undefined;
        switch (f124(vF104.Me)) {
          case "false":
            vUndefined49 = false;
            break;
          default:
            vUndefined49 = true;
        }
        v$177.prop("checked", vUndefined49);
        vF12319.r.td(vUndefined49);
        var vUndefined50 = undefined;
        switch (f124(vF104.Ne)) {
          case "false":
            vUndefined50 = false;
            break;
          default:
            vUndefined50 = true;
        }
        v$178.prop("checked", vUndefined50);
        vF12319.r.rd(vUndefined50);
        var vUndefined51 = undefined;
        switch (f124(vF104.ya)) {
          case "false":
            vUndefined51 = false;
            break;
          default:
            vUndefined51 = true;
        }
        console.log("Load sPN: " + vUndefined51);
        v$179.prop("checked", vUndefined51);
        vF12319.u.V(function () {
          v$181.toggle(vF12319.u.P());
          v$183.toggle(vF12319.u.P());
        });
      };
      vF13116.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeIn(200);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13116.prototype.ji = function () {
        var vF12320 = f123();
        vF12320.r.Dd();
        if (vF12320.Y()) {
          v$184.show();
        } else {
          v$184.hide();
        }
      };
      vF13116.prototype.wa = function () {
        return v$179.prop("checked");
      };
      return vF13116;
    }();
    var vF164 = function () {
      var v$185 = $("#store-view-canv");
      var v$186 = $("#skin-description-text");
      var v$187 = $("#skin-group-description-text");
      var v$188 = $("#store-locked-bar");
      var v$189 = $("#store-locked-bar-text");
      var v$190 = $("#store-buy-button");
      var v$191 = $("#store-item-price");
      var v$192 = $("#store-groups");
      var v$193 = $("#store-view-prev");
      var v$194 = $("#store-view-next");
      var vF13117 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.skins.tab"), true);
        var vThis59 = this;
        var vF12321 = f123();
        this.bl = null;
        this.cl = [];
        this.dl = {};
        this.el = new vF141(v$185);
        v$190.click(function () {
          vF12321.r.Cd();
          vThis59.fl();
        });
        v$193.click(function () {
          vF12321.r.Cd();
          vThis59.bl.gl();
        });
        v$194.click(function () {
          vF12321.r.Cd();
          vThis59.bl.hl();
        });
      });
      vF13117.prototype.a = function () {
        vF13117.parent.prototype.a.call(this);
        var vThis60 = this;
        var vF12322 = f123();
        vF12322.p.ca(function () {
          var v1279 = vF12322.p.Ac();
          if (v1279 != null) {
            vThis60.cl = [];
            for (var vLN085 = 0; vLN085 < v1279.skinGroupArrayDict.length; vLN085++) {
              vThis60.cl.push(new vF165(vThis60, v1279.skinGroupArrayDict[vLN085]));
            }
            vThis60.dl = {};
            for (var vLN086 = 0; vLN086 < v1279.skinArrayDict.length; vLN086++) {
              var v1280 = v1279.skinArrayDict[vLN086];
              vThis60.dl[v1280.id] = v1280;
            }
          }
        });
        this.il(false);
        vF12322.t.xh(function () {
          vThis60.il(false);
        });
      };
      vF13117.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeIn(200);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13117.prototype.ji = function () {
        f123().r.Dd();
        this.jl();
        this.el.Le(true);
      };
      vF13117.prototype.ei = function () {
        this.el.Le(false);
      };
      vF13117.prototype.Ra = function () {
        this.el.Ra();
      };
      vF13117.prototype.Pa = function (p1275, p1276) {
        this.el.Pa();
      };
      vF13117.prototype.jl = function () {
        var vThis61 = this;
        var vThis62 = this;
        var vF12323 = f123();
        v$192.empty();
        for (var vLN088 = 0; vLN088 < this.cl.length; vLN088++) {
          (function (p1277) {
            var v1281 = vThis61.cl[p1277];
            var v1282 = document.createElement("li");
            v$192.append(v1282);
            var v$195 = $(v1282);
            v$195.html(v1281.kl());
            v$195.click(function () {
              vF12323.r.Cd();
              vThis62.ll(v1281);
            });
            v1281.ml = v$195;
          })(vLN088);
        }
        if (this.cl.length > 0) {
          var v1283 = vF12323.t.ha(vF124.ia);
          for (var vLN088 = 0; vLN088 < this.cl.length; vLN088++) {
            var v1284 = this.cl[vLN088];
            for (var v1285 = v1284.nl.list, vLN089 = 0; vLN089 < v1285.length; vLN089++) {
              if (v1285[vLN089] == v1283) {
                v1284.ol = vLN089;
                this.ll(v1284);
                return;
              }
            }
          }
          this.ll(this.cl[0]);
        }
      };
      vF13117.prototype.ll = function (p1278) {
        if (this.bl != p1278) {
          var vF12324 = f123();
          this.bl = p1278;
          v$192.children().removeClass("pressed");
          if (this.bl.ml) {
            this.bl.ml.addClass("pressed");
          }
          v$187.html("");
          if (p1278.nl != null) {
            var v1286 = vF12324.p.Ac().textDict[p1278.nl.description];
            if (v1286 != null) {
              v$187.html(f129(f127(v1286)));
            }
          }
          this.il(true);
        }
      };
      vF13117.prototype.pl = function () {
        if (this.bl == null) {
          return vF117.Yg();
        } else {
          return this.bl.ql();
        }
      };
      vF13117.prototype.fl = function () {
        var vThis63 = this;
        this.pl().ah(function (p1279) {
          vThis63.rl(p1279);
        });
      };
      vF13117.prototype.rl = function (p1280) {
        var vThis64 = this;
        var vF12325 = f123();
        var v1287 = this.dl[p1280].price;
        if (!(vF12325.u.zi() < v1287)) {
          this.Sk();
          var v1288 = vF12325.t.ha(vF124.ia);
          var v1289 = vF12325.t.ha(vF124.ja);
          var v1290 = vF12325.t.ha(vF124.ka);
          var v1291 = vF12325.t.ha(vF124.la);
          var v1292 = vF12325.t.ha(vF124.ma);
          vF12325.u.Ui(p1280, vF124.ia, function () {
            vF12325.t.Bh(v1288, vF124.ia);
            vF12325.t.Bh(v1289, vF124.ja);
            vF12325.t.Bh(v1290, vF124.ka);
            vF12325.t.Bh(v1291, vF124.la);
            vF12325.t.Bh(v1292, vF124.ma);
            if (vF12325.u.Ch(p1280, vF124.ia)) {
              vF12325.t.Bh(p1280, vF124.ia);
            }
            vThis64.Qk();
          });
        }
      };
      vF13117.prototype.il = function (p1281) {
        var vF12326 = f123();
        this.el.bk(vF12326.t.ha(vF124.ja), false, false);
        this.el.ck(vF12326.t.ha(vF124.ka), false, false);
        this.el.dk(vF12326.t.ha(vF124.la), false, false);
        this.el.ek(vF12326.t.ha(vF124.ma), false, false);
        var v1293 = this.pl();
        if (v1293._g()) {
          var v1294 = v1293.$g();
          var v1295 = this.dl[v1294];
          var v1296 = false;
          if (vF12326.t.Ja(v1294, vF124.ia)) {
            v$188.hide();
            v$190.hide();
          } else if (v1295 == null || v1295.nonbuyable == 1) {
            v1296 = true;
            v$188.show();
            v$190.hide();
            v$189.text(f126("index.game.popup.menu.store.locked"));
            if (v1295 != null && v1295.nonbuyable && v1295.nonbuyableCause != null) {
              var v1297 = vF12326.p.Ac().textDict[v1295.nonbuyableCause];
              if (v1297 != null) {
                v$189.text(f127(v1297));
              }
            }
          } else {
            v$188.hide();
            v$190.show();
            v$191.html(v1295.price);
          }
          v$186.html("");
          if (v1295 != null && v1295.description != null) {
            var v1298 = vF12326.p.Ac().textDict[v1295.description];
            if (v1298 != null) {
              v$186.html(f129(f127(v1298)));
            }
          }
          v$112.html(v1295.id);
          this.el.ak(v1294, true, v1296);
          if (p1281) {
            vF12326.t.Bh(v1294, vF124.ia);
          }
        }
      };
      var vF165 = function () {
        function f214(p1282, p1283) {
          this.sl = p1282;
          this.ol = 0;
          this.nl = p1283;
        }
        f214.prototype.gl = function () {
          if (--this.ol < 0) {
            this.ol = this.nl.list.length - 1;
          }
          this.sl.il(true);
        };
        f214.prototype.hl = function () {
          if (++this.ol >= this.nl.list.length) {
            this.ol = 0;
          }
          this.sl.il(true);
        };
        f214.prototype.kl = function () {
          let vF1272 = f127(this.nl.name);
          if (this.nl.img) {
            var vLSimgSrc = "<img src=\"";
            vLSimgSrc = vLSimgSrc + wormateplatenconnect + "/images/paths/" + this.nl.img;
            vF1272 = vLSimgSrc = vLSimgSrc + "\" height=\"43\" width=\"220\" />";
          }
          return vF1272;
        };
        f214.prototype.ql = function () {
          if (this.ol >= this.nl.list.length) {
            return vF117.Yg();
          } else {
            return vF117.Zg(this.nl.list[this.ol]);
          }
        };
        return f214;
      }();
      return vF13117;
    }();
    var vF166 = function () {
      var v$196 = $("#store-go-coins-button");
      var v$197 = $("#store-go-skins-button");
      var v$198 = $("#store-go-wear-button");
      var vF13118 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.store.tab"), true);
        var vF12327 = f123();
        v$196.click(function () {
          vF12327.r.Cd();
          vF12327.s.I(vF12327.s.Wh);
        });
        v$197.click(function () {
          vF12327.r.Cd();
          vF12327.s.I(vF12327.s.$h);
        });
        v$198.click(function () {
          vF12327.r.Cd();
          vF12327.s.I(vF12327.s.ai);
        });
      });
      vF13118.prototype.a = function () {
        vF13118.parent.prototype.a.call(this);
      };
      vF13118.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeIn(200);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13118.prototype.ji = function () {
        f123().r.Dd();
      };
      return vF13118;
    }();
    var vF167 = function () {
      var v$199 = $("#wear-view-canv");
      var v$200 = $("#wear-description-text");
      var v$201 = $("#wear-locked-bar");
      var v$202 = $("#wear-locked-bar-text");
      var v$203 = $("#wear-buy-button");
      var v$204 = $("#wear-item-price");
      var v$205 = $("#wear-eyes-button");
      var v$206 = $("#wear-mouths-button");
      var v$207 = $("#wear-glasses-button");
      var v$208 = $("#wear-hats-button");
      var v$209 = $("#wear-tint-chooser");
      var v$210 = $("#wear-view-prev");
      var v$211 = $("#wear-view-next");
      var vF13119 = f131(vF157, function () {
        var vThis65 = this;
        vF157.call(this, f126("index.game.popup.menu.wear.tab"), true);
        var vF12328 = f123();
        var vThis66 = this;
        this.tl = [];
        this.ja = new vF168(this, vF124.ja, v$205);
        this.ka = new vF168(this, vF124.ka, v$206);
        this.la = new vF168(this, vF124.la, v$207);
        this.ma = new vF168(this, vF124.ma, v$208);
        this.ul = null;
        this.vl = null;
        this.wl = null;
        this.xl = null;
        this.yl = null;
        this.zl = null;
        this.Al = new vF141(v$199);
        v$203.click(function () {
          vF12328.r.Cd();
          vThis66.Bl();
        });
        v$210.click(function () {
          vF12328.r.Cd();
          vThis66.ul.Cl();
        });
        v$211.click(function () {
          vF12328.r.Cd();
          vThis66.ul.Dl();
        });
        v$205.click(function () {
          vF12328.r.Cd();
          vThis66.El(vThis65.ja);
        });
        v$206.click(function () {
          vF12328.r.Cd();
          vThis66.El(vThis65.ka);
        });
        v$207.click(function () {
          vF12328.r.Cd();
          vThis66.El(vThis65.la);
        });
        v$208.click(function () {
          vF12328.r.Cd();
          vThis66.El(vThis65.ma);
        });
        this.tl.push(this.ja);
        this.tl.push(this.ka);
        this.tl.push(this.la);
        this.tl.push(this.ma);
      });
      vF13119.prototype.a = function () {
        vF13119.parent.prototype.a.call(this);
        var vF12329 = f123();
        var vThis67 = this;
        vF12329.p.ca(function () {
          var v1299 = vF12329.p.Ac();
          if (v1299 != null) {
            vThis67.vl = v1299.eyesDict;
            vThis67.wl = v1299.mouthDict;
            vThis67.xl = v1299.glassesDict;
            vThis67.yl = v1299.hatDict;
            vThis67.zl = v1299.colorDict;
            vThis67.ja.Fl(v1299.eyesVariantArray);
            vThis67.ja.Gl(vThis67.vl);
            vThis67.ka.Fl(v1299.mouthVariantArray);
            vThis67.ka.Gl(vThis67.wl);
            vThis67.la.Fl(v1299.glassesVariantArray);
            vThis67.la.Gl(vThis67.xl);
            vThis67.ma.Fl(v1299.hatVariantArray);
            vThis67.ma.Gl(vThis67.yl);
          }
        });
        this.il(false);
        vF12329.t.xh(function () {
          vThis67.il(false);
        });
      };
      vF13119.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeIn(200);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13119.prototype.ji = function () {
        f123().r.Dd();
        this.El(this.ul ?? this.ja);
        this.Al.Le(true);
      };
      vF13119.prototype.ei = function () {
        this.Al.Le(false);
      };
      vF13119.prototype.Ra = function () {
        this.Al.Ra();
      };
      vF13119.prototype.Pa = function (p1284, p1285) {
        this.Al.Pa();
      };
      vF13119.prototype.El = function (p1286) {
        this.ul = p1286;
        for (var vLN090 = 0; vLN090 < this.tl.length; vLN090++) {
          this.tl[vLN090].Xk.removeClass("pressed");
        }
        this.ul.Xk.addClass("pressed");
        this.ul.ii();
      };
      vF13119.prototype.Hl = function () {
        if (this.ul == null) {
          return vF117.Yg();
        } else {
          return vF117.Zg({
            Lb: this.ul.ql(),
            rc: this.ul.rc
          });
        }
      };
      vF13119.prototype.Bl = function () {
        var vThis68 = this;
        this.Hl().ah(function (p1287) {
          vThis68.Ui(p1287.Lb, p1287.rc);
        });
      };
      vF13119.prototype.Ui = function (p1288, p1289) {
        var vThis69 = this;
        var vF12330 = f123();
        var vUndefined52 = undefined;
        switch (p1289) {
          case vF124.ja:
            vUndefined52 = this.vl[p1288].price;
            break;
          case vF124.ka:
            vUndefined52 = this.wl[p1288].price;
            break;
          case vF124.la:
            vUndefined52 = this.xl[p1288].price;
            break;
          case vF124.ma:
            vUndefined52 = this.yl[p1288].price;
            break;
          default:
            return;
        }
        if (!(vF12330.u.zi() < vUndefined52)) {
          this.Sk();
          var v1300 = vF12330.t.ha(vF124.ia);
          var v1301 = vF12330.t.ha(vF124.ja);
          var v1302 = vF12330.t.ha(vF124.ka);
          var v1303 = vF12330.t.ha(vF124.la);
          var v1304 = vF12330.t.ha(vF124.ma);
          vF12330.u.Ui(p1288, p1289, function () {
            vF12330.t.Bh(v1300, vF124.ia);
            vF12330.t.Bh(v1301, vF124.ja);
            vF12330.t.Bh(v1302, vF124.ka);
            vF12330.t.Bh(v1303, vF124.la);
            vF12330.t.Bh(v1304, vF124.ma);
            if (vF12330.u.Ch(p1288, p1289)) {
              vF12330.t.Bh(p1288, p1289);
            }
            vThis69.Qk();
          });
        }
      };
      vF13119.prototype.Il = function (p1290, p1291) {
        switch (p1291) {
          case vF124.ja:
            return this.vl[p1290];
          case vF124.ka:
            return this.wl[p1290];
          case vF124.la:
            return this.xl[p1290];
          case vF124.ma:
            return this.yl[p1290];
        }
        return null;
      };
      vF13119.prototype.il = function (p1292) {
        var vF12331 = f123();
        this.Al.ak(vF12331.t.ha(vF124.ia), false, false);
        this.Al.bk(vF12331.t.ha(vF124.ja), false, false);
        this.Al.ck(vF12331.t.ha(vF124.ka), false, false);
        this.Al.dk(vF12331.t.ha(vF124.la), false, false);
        this.Al.ek(vF12331.t.ha(vF124.ma), false, false);
        var v1305 = this.Hl();
        if (v1305._g()) {
          var v1306 = v1305.$g();
          var v1307 = this.Il(v1306.Lb, v1306.rc);
          var v1308 = false;
          if (vF12331.t.Ja(v1306.Lb, v1306.rc)) {
            v$201.hide();
            v$203.hide();
          } else if (v1307 == null || v1307.nonbuyable == 1) {
            v1308 = true;
            v$201.show();
            v$203.hide();
            v$202.text(f126("index.game.popup.menu.store.locked"));
            if (v1307 != null && v1307.nonbuyable && v1307.nonbuyableCause != null) {
              var v1309 = vF12331.p.Ac().textDict[v1307.nonbuyableCause];
              if (v1309 != null) {
                v$202.text(f127(v1309));
              }
            }
          } else {
            v$201.hide();
            v$203.show();
            v$204.html(v1307.price);
          }
          v$200.html("");
          if (v1307 != null && v1307.description != null) {
            var v1310 = vF12331.p.Ac().textDict[v1307.description];
            if (v1310 != null) {
              v$200.html(f129(f127(v1310)));
            }
          }
          switch (v1306.rc) {
            case vF124.ja:
              this.Al.bk(v1306.Lb, true, v1308);
              break;
            case vF124.ka:
              this.Al.ck(v1306.Lb, true, v1308);
              break;
            case vF124.la:
              this.Al.dk(v1306.Lb, true, v1308);
              break;
            case vF124.ma:
              this.Al.ek(v1306.Lb, true, v1308);
          }
          if (p1292) {
            vF12331.t.Bh(v1306.Lb, v1306.rc);
          }
        }
      };
      var vF168 = function () {
        function f215(p1293, p1294, p1295) {
          this.sl = p1293;
          this.rc = p1294;
          this.Xk = p1295;
          this.Jl = {};
          this.Kl = [[]];
          this.Ll = -10;
          this.Ml = -10;
        }
        f215.prototype.Fl = function (p1296) {
          this.Kl = p1296;
        };
        f215.prototype.Gl = function (p1297) {
          this.Jl = p1297;
        };
        f215.prototype.ii = function () {
          var vF12332 = f123();
          var v1311 = vF12332.t.ha(this.rc);
          for (var vLN091 = 0; vLN091 < this.Kl.length; vLN091++) {
            for (var vLN092 = 0; vLN092 < this.Kl[vLN091].length; vLN092++) {
              if (this.Kl[vLN091][vLN092] == v1311) {
                this.Nl(vLN091);
                this.Ol(vLN092);
                return;
              }
            }
          }
          this.Nl(0);
          this.Ol(0);
        };
        f215.prototype.Cl = function () {
          var v1312 = this.Ll - 1;
          if (v1312 < 0) {
            v1312 = this.Kl.length - 1;
          }
          this.Nl(v1312);
          this.Ol(this.Ml % this.Kl[v1312].length);
        };
        f215.prototype.Dl = function () {
          var v1313 = this.Ll + 1;
          if (v1313 >= this.Kl.length) {
            v1313 = 0;
          }
          this.Nl(v1313);
          this.Ol(this.Ml % this.Kl[v1313].length);
        };
        f215.prototype.Nl = function (p1298) {
          var vThis70 = this;
          if (!(p1298 < 0) && !(p1298 >= this.Kl.length)) {
            this.Ll = p1298;
            v$209.empty();
            var v1314 = this.Kl[this.Ll];
            if (v1314.length > 1) {
              for (var vLN093 = 0; vLN093 < v1314.length; vLN093++) {
                (function (p1299) {
                  var v1315 = v1314[p1299];
                  var v1316 = vThis70.Jl[v1315];
                  var v1317 = "#" + vThis70.sl.zl[v1316.prime];
                  var v$212 = $("<div style=\"border-color:" + v1317 + "\"></div>");
                  v$212.click(function () {
                    f123().r.Cd();
                    vThis70.Ol(p1299);
                  });
                  v$209.append(v$212);
                })(vLN093);
              }
            }
          }
        };
        f215.prototype.Ol = function (p1300) {
          if (!(p1300 < 0) && !(p1300 >= this.Kl[this.Ll].length)) {
            this.Ml = p1300;
            v$209.children().css("background-color", "transparent");
            var v1318 = v$209.children(":nth-child(" + (1 + p1300) + ")");
            v1318.css("background-color", v1318.css("border-color"));
            this.sl.il(true);
          }
        };
        f215.prototype.ql = function () {
          return this.Kl[this.Ll][this.Ml];
        };
        return f215;
      }();
      return vF13119;
    }();
    var vF171 = function () {
      var v$213 = $("#withdraw-consent-yes");
      var v$214 = $("#withdraw-consent-no");
      var vF13120 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.consent.tab"), false);
        var vF12333 = f123();
        v$213.click(function () {
          vF12333.r.Cd();
          if (vF12333.Y()) {
            vF12333.s.I(vF12333.s.F);
            vF12333.$(false, true);
            vF12333.s.aa._(new vF178());
          } else {
            vF12333.s.gi();
          }
        });
        v$214.click(function () {
          vF12333.r.Cd();
          vF12333.s.gi();
        });
      });
      vF13120.prototype.a = function () {
        vF13120.parent.prototype.a.call(this);
      };
      vF13120.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeIn(200);
        vF157.Ok.stop();
        vF157.Ok.fadeOut(50);
      };
      vF13120.prototype.ji = function () {
        f123().r.Dd();
      };
      return vF13120;
    }();
    var vF172 = function () {
      var v$215 = $("#delete-account-timer");
      var v$216 = $("#delete-account-yes");
      var v$217 = $("#delete-account-no");
      var vF13121 = f131(vF157, function () {
        vF157.call(this, f126("index.game.popup.menu.delete.tab"), false);
        var vF12334 = f123();
        v$216.click(function () {
          vF12334.r.Cd();
          if (vF12334.u.P()) {
            vF12334.u.bj();
            vF12334.u.Wi();
          } else {
            vF12334.s.gi();
          }
        });
        v$217.click(function () {
          vF12334.r.Cd();
          vF12334.s.gi();
        });
        this.Pl = [];
      });
      vF13121.prototype.a = function () {
        vF13121.parent.prototype.a.call(this);
      };
      vF13121.prototype.Rk = function () {
        vF157.Fk.stop();
        vF157.Fk.fadeOut(50);
        vF157.Gk.stop();
        vF157.Gk.fadeOut(50);
        vF157.Hk.stop();
        vF157.Hk.fadeOut(50);
        vF157.Jk.stop();
        vF157.Jk.fadeOut(50);
        vF157.Ik.stop();
        vF157.Ik.fadeOut(50);
        vF157.Kk.stop();
        vF157.Kk.fadeOut(50);
        vF157.Lk.stop();
        vF157.Lk.fadeOut(50);
        vF157.Mk.stop();
        vF157.Mk.fadeOut(50);
        vF157.Nk.stop();
        vF157.Nk.fadeOut(50);
        vF157.Ok.stop();
        vF157.Ok.fadeIn(200);
      };
      vF13121.prototype.ji = function () {
        f123().r.Hd();
        v$216.stop();
        v$216.hide();
        v$215.stop();
        v$215.show();
        v$215.text(".. 10 ..");
        this.Ql();
        this.Rl(function () {
          v$215.text(".. 9 ..");
        }, 1000);
        this.Rl(function () {
          v$215.text(".. 8 ..");
        }, 2000);
        this.Rl(function () {
          v$215.text(".. 7 ..");
        }, 3000);
        this.Rl(function () {
          v$215.text(".. 6 ..");
        }, 4000);
        this.Rl(function () {
          v$215.text(".. 5 ..");
        }, 5000);
        this.Rl(function () {
          v$215.text(".. 4 ..");
        }, 6000);
        this.Rl(function () {
          v$215.text(".. 3 ..");
        }, 7000);
        this.Rl(function () {
          v$215.text(".. 2 ..");
        }, 8000);
        this.Rl(function () {
          v$215.text(".. 1 ..");
        }, 9000);
        this.Rl(function () {
          v$215.hide();
          v$216.fadeIn(300);
        }, 10000);
      };
      vF13121.prototype.Rl = function (p1301, p1302) {
        var vSetTimeout5 = setTimeout(p1301, p1302);
        this.Pl.push(vSetTimeout5);
      };
      vF13121.prototype.Ql = function () {
        for (var vLN094 = 0; vLN094 < this.Pl.length; vLN094++) {
          clearTimeout(this.Pl[vLN094]);
        }
        this.Pl = [];
      };
      return vF13121;
    }();
    var vF175 = function () {
      function f216() {
        this.Ck = function () {};
      }
      f216.prototype.Bk = function () {};
      f216.prototype.ji = function () {};
      return f216;
    }();
    var vF176 = function () {
      var vF13122 = f131(vF175, function (p1303) {
        vF175.call(this);
        var v1319 = Date.now() + "_" + Math.floor(1000 + Math.random() * 8999);
        this.Sl = $("<div id=\"" + v1319 + "\" class=\"toaster toaster-coins\">    <img class=\"toaster-coins-img\" alt=\"Wormate Coin\" src=\"/images/coin_320.png\" />    <div class=\"toaster-coins-val\">+" + p1303 + "</div>    <div class=\"toaster-coins-close\">" + f126("index.game.toaster.continue") + "</div></div>");
        var vThis71 = this;
        this.Sl.find(".toaster-coins-close").click(function () {
          f123().r.Cd();
          vThis71.Ck();
        });
      });
      vF13122.prototype.Bk = function () {
        return this.Sl;
      };
      vF13122.prototype.ji = function () {
        f123().r.Fd();
      };
      return vF13122;
    }();
    var vF177 = function () {
      var vF13123 = f131(vF175, function (p1304) {
        vF175.call(this);
        var v1320 = Date.now() + "_" + Math.floor(1000 + Math.random() * 8999);
        this.Sl = $("<div id=\"" + v1320 + "\" class=\"toaster toaster-levelup\">    <img class=\"toaster-levelup-img\" alt=\"Wormate Level Up Star\" src=\"/images/level-star.svg\" />    <div class=\"toaster-levelup-val\">" + p1304 + "</div>    <div class=\"toaster-levelup-text\">" + f126("index.game.toaster.levelup") + "</div>    <div class=\"toaster-levelup-close\">" + f126("index.game.toaster.continue") + "</div></div>");
        var vThis72 = this;
        this.Sl.find(".toaster-levelup-close").click(function () {
          f123().r.Cd();
          vThis72.Ck();
        });
      });
      vF13123.prototype.Bk = function () {
        return this.Sl;
      };
      vF13123.prototype.ji = function () {
        f123().r.Ed();
      };
      return vF13123;
    }();
    var vF178 = function () {
      var vF13124 = f131(vF175, function () {
        vF175.call(this);
        var vThis73 = this;
        var vF12335 = f123();
        var v1321 = Date.now() + "_" + Math.floor(1000 + Math.random() * 8999);
        this.Sl = $("<div id=\"" + v1321 + "\" class=\"toaster toaster-consent-accepted\">    <img class=\"toaster-consent-accepted-logo\" src=\"" + vLSimageslinelogoxmas20 + "\" alt=\"Wormate.io logo\"/>    <div class=\"toaster-consent-accepted-container\">        <span class=\"toaster-consent-accepted-text\">" + f126("index.game.toaster.consent.text").replaceAll(" ", "&nbsp;").replaceAll("\n", "<br/>") + "</span>        <a class=\"toaster-consent-accepted-link\" href=\"/privacy-policy\">" + f126("index.game.toaster.consent.link") + "</a>    </div>    <div class=\"toaster-consent-close\">" + f126("index.game.toaster.consent.iAccept") + "</div></div>");
        this.Tl = this.Sl.find(".toaster-consent-close");
        this.Tl.hide();
        this.Tl.click(function () {
          vF12335.r.Cd();
          if (vF12335.Y()) {
            vF12335.$(true, true);
          }
          vThis73.Ck();
        });
      });
      vF13124.prototype.Bk = function () {
        return this.Sl;
      };
      vF13124.prototype.ji = function () {
        var vThis74 = this;
        var vF12336 = f123();
        if (vF12336.Y() && !vF12336.Z()) {
          vF12336.r.Hd();
          setTimeout(function () {
            vThis74.Tl.fadeIn(300);
          }, 2000);
        } else {
          setTimeout(function () {
            vThis74.Ck();
          }, 0);
        }
      };
      return vF13124;
    }();
    var vO19 = {};
    vO19.main = {
      Ma: f147("aqnvgcpz05orkobh", "WRM_wormate-io_300x250"),
      K: f147("ltmolilci1iurq1i", "wormate-io_970x250"),
      ra: f144(),
      e: 4,
      oa: false,
      qk: true
    };
    vO19.miniclip = {
      Ma: f147("aqnvgcpz05orkobh", "WRM_wormate-io_300x250"),
      K: f147("ltmolilci1iurq1i", "wormate-io_970x250"),
      ra: f144(),
      e: 4,
      oa: false,
      qk: false
    };
    var v1322 = vO19[window.ENV];
    v1322 ||= vO19.main;
    $(function () {
      FastClick.attach(document.body);
    });
    addEventListener("contextmenu", function (p1305) {
      p1305.preventDefault();
      p1305.stopPropagation();
      return false;
    });
    f130("//connect.facebook.net/" + vUndefined27 + "/sdk.js", "facebook-jssdk", function () {
      FB.init({
        appId: "861926850619051",
        cookie: true,
        xfbml: true,
        status: true,
        version: "v8.0"
      });
    });
    f130("//apis.google.com/js/api:client.js", null, function () {
      gapi.load("auth2", function () {
        v807 = gapi.auth2.init({
          client_id: "959425192138-qjq23l9e0oh8lgd2icnblrbfblar4a2f.apps.googleusercontent.com"
        });
      });
    });
    vUndefined28 = f148();
    vUndefined28.v();
    if (vF88()) {
      f130("https://foghunter06.github.io/exetnsion/js/joy.min.js", "mobileconfig", function () {
        vF179();
      });
    }
    let vF179 = function () {
      $("#game-canvas").after("<div id='zoom-container'><div id='zoom-in'>+</div><div id='zoom-out'>-</div></div>");
    };
    window.keyMove = "q";
    window.addEventListener("keydown", function (p1306) {
      console.log("event.key: " + p1306.key);
      if (p1306.key.toLowerCase() !== "q" || !v786 || v785 !== null) {
        if (v785 !== null) {
          clearInterval(v785);
          v785 = null;
        }
      } else {
        let vLN095 = 0;
        const v1323 = window.tuNewScore;
        if (v785 !== null) {
          clearInterval(v785);
        }
        v785 = setInterval(function () {
          let v1324 = Math.PI / 4;
          let v1325 = 165 + (v1323 >= 100000 ? 5 : v1323 >= 10000 ? 10 : 0);
          vO3.eventoPrincipal.sk += v1324;
          if (vO3.eventoPrincipal.sk >= Math.PI * 2) {
            vO3.eventoPrincipal.sk -= Math.PI * 2;
          } else if (vO3.eventoPrincipal.sk <= Math.PI * -2) {
            vO3.eventoPrincipal.sk += Math.PI * 2;
          }
          let v1326 = document.getElementById("elementId");
          if (v1326) {
            v1326.style.transform = "rotate(" + vO3.eventoPrincipal.sk + "rad)";
          }
        }, 165 + (v1323 >= 100000 ? 5 : v1323 >= 10000 ? 10 : 0));
      }
      localStorage.setItem("SaveGameWPC", JSON.stringify(vO4));
    }, false);
    let vA17 = [{
      nombre: "chuot 1",
      url: "https://i.imgur.com/SjFtyqp.png"
    }, {
      nombre: "chuot 2",
      url: "https://i.imgur.com/4QC2Exd.png"
    }, {
      nombre: "chuot 3",
      url: "https://i.imgur.com/PfdBkc2.png"
    }, {
      nombre: "chuot 4",
      url: "https://i.imgur.com/vD4zoMk.png"
    }, {
      nombre: "chuot 5",
      url: "https://i.imgur.com/n4N79UI.png"
    }, {
      nombre: "arrow",
      url: "https://cdn.custom-cursor.com/db/234/32/arrow2291.png"
    }, {
      nombre: "Superman",
      url: "https://cdn.custom-cursor.com/db/cursor/32/Superman_Cursor.png"
    }, {
      nombre: "Kratos",
      url: "https://cdn.custom-cursor.com/128/assets/pointers/32/GOW_Kratos_Pointer.png"
    }, {
      nombre: "Pusheen_Ca",
      url: "https://cdn.custom-cursor.com/db/cursor/32/Pusheen_Cat_Cursor.png"
    }, {
      nombre: "lipstick",
      url: "https://i.imgur.com/zNlNdlx.png"
    }, {
      nombre: "AKM",
      url: "https://cdn.custom-cursor.com/db/cursor/32/PUBG_AKM_Cursor.png"
    }, {
      nombre: "Cherries_Pointer",
      url: "https://cdn.custom-cursor.com/db/pointer/32/Cherries_Pointer.png"
    }, {
      nombre: "Tom_and_JerryCurso",
      url: "https://cdn.custom-cursor.com/db/cursor/32/Tom_and_JerryCursor.png"
    }, {
      nombre: "JerryPointer",
      url: "https://cdn.custom-cursor.com/db/pointer/32/Tom_and_JerryPointer.png"
    }];
    let vA18 = [{
      nombre: "Default",
      url: "https://i.imgur.com/8ubx4RA.png"
    }, {
      nombre: "Schwarze Background",
      url: "https://i.imgur.com/3cxXwZ6.png"
    }, {
      nombre: "light blue",
      url: "https://i.imgur.com/dWtJFIx.png"
    }, {
      nombre: "woman",
      url: "https://i.imgur.com/19YALRi.png"
    }, {
      nombre: "Navidad",
      url: "https://i.imgur.com/PSRIvVM.png"
    }, {
      nombre: "Mal3ab",
      url: "https://i.imgur.com/MlCgOma.png"
    }, {
      nombre: "Galaxy_Star",
      url: "https://i.imgur.com/yayb9Ru.png"
    }, {
      nombre: "Desert",
      url: "https://asserts.wormworld.io/backgrounds/bkgnd7.png"
    }];
    vO4.loading = true;
    var vLS4 = "";
    vLS4 += "</div>";
    vLS4 += "</div>";
    vLS4 += "</div>";
    vLS4 += "<div id=\"wormcerca\">";
    vLS4 += "<img class=\"pwrups v0\" style=\"display: none;\" src=\"https://i.imgur.com/M1LFPpp.png\">";
    vLS4 += "<img class=\"pwrups v1\" style=\"display: none;\" src=\"https://i.imgur.com/z162iYa.png\">";
    vLS4 += "<img class=\"pwrups v2\" style=\"display: none;\" src=\"https://i.imgur.com/kXlF32q.png\">";
    vLS4 += "<img class=\"pwrups v3\" style=\"display: none;\" src=\"https://i.imgur.com/kJ6oz7e.png\">";
    vLS4 += "<img class=\"pwrups v4\" style=\"display: none;\" src=\"https://i.imgur.com/l3ds43O.png\">";
    vLS4 += "<img class=\"pwrups v5\" style=\"display: none;\" src=\"https://i.imgur.com/FqA56k6.png\">";
    vLS4 += "<img class=\"pwrups v6\" style=\"display: none;\" src=\"https://i.imgur.com/mSCZeEp.png\">";
    vLS4 += "</div>";
    vLS4 += "<img class=\"worm_1\" src=\"https://i.imgur.com/iekrYYm.png\"><span class=\"Worm_cerca\"></span>";
    vLS4 += "</div><div class=\"worm_4\"><button id=\"settingBtn\"><img src=\"https://i.imgur.com/bKAe6W9.png\"/></button><div id=\"settingContent\"><div class=\"container1\"><span class=\"settings_span\">Spin-Fast: </span><input id=\"smoothCamera\" class=\"range\" type=\"range\" min=\"0.3\" max=\"0.6\" value=\"' + theoKzObjects.smoothCamera + '\" step=\"0.1\" onmousemove=\"smoothCameraValue.value=value\" /></div><div class=\"container1\">\n        <span class=\"settings_span\">Power-ups-Size: </span>\n        <input id=\"PortionSize\" class=\"range\" type=\"range\" min=\"1\" max=\"6\" value=\"' + theoKzObjects.PortionSize + '\" step=\"1\" onmousemove=\"rangevalue1.value=value\" />\n        </div>\n        \n      <div class=\"container1\">\n      <span class=\"settings_span\">Power-ups-Aura: </span>\n      <input id=\"PortionAura\" class=\"range\" type=\"range\" min=\"1.2\" max=\"3.2\" value=\"' + theoKzObjects.PortionAura + '\" step=\"0.2\" onmousemove=\"PortionAuravalue.value=value\" />\n      </div>\n       \n      <div class=\"container1\">\n                    <span class=\"settings_span\">Food-Size: </span>\n                    <input id=\"FoodSize\" class=\"range\" type=\"range\" min=\"0.5\" max=\"3\" value=\"' + theoKzObjects.FoodSize + '\" step=\"0.5\" onmousemove=\"rangevalue2.value=value\" />\n                    </div>\n                    <div class=\"container1\">\n                    <span class=\"settings_span\">Food-Shadow: </span>\n                    <input id=\"FoodShadow\" class=\"range\" type=\"range\" min=\"0.5\" max=\"3\" value=\"' + theoKzObjects.FoodShadow + '\" step=\"0.5\" onmousemove=\"FoodShadowvalue.value=value\" />\n                    </div>\n    </div>\n    </div><div style=\"display:none\" id=\"zoom-container\"><div id=\"zoom-out\">-</div><div id=\"zoom-in\">+</div><div class=\"worm_3\">x.<span id=\"zoom-percentage\"></span>";
    $("#game-view").append(vLS4);
    function f217(p1307) {
      if (vO4.PropertyManager) {
        p1307.skinId = vO4.PropertyManager.rh;
        p1307.eyesId = vO4.PropertyManager.sh;
        p1307.mouthId = vO4.PropertyManager.th;
        p1307.glassesId = vO4.PropertyManager.uh;
        p1307.hatId = vO4.PropertyManager.vh;
      }
    }
    function f218() {
      $("#mm-event-text");
      $("#mm-store").after("\n    <div id=\"mm-store\" style=\"float: right; position: relative; margin-right: 10px; min-width: 140px;\">\n        <div style=\"margin: 0;\" id=\"loa831pibur0w4gv\">\n            <div onclick=\"openPopup()\">\n                <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: yellow; font-size: 25px;\"></i> الاعدادات\n            </div>\n            <div id=\"popup\" class=\"popup\">\n                <div class=\"phdr1\" style=\"display: flex; justify-content: center; align-items: center;\">\n                    <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: yellow; font-size: 25px; margin-right: 10px;\"></i> \n                    <span>اعدادات اللعب</span>\n                </div>\n                <button class=\"close-button\" onclick=\"closePopup()\">اغلاق</button>\n\n                <!-- أزرار التبويبات -->\n                <div class=\"tab-buttons\" style=\"display: flex; justify-content: space-around; margin-bottom: 10px;\">\n                    <button class=\"tab-button active\" onclick=\"openTab('gameSettings')\">إعدادات اللعب</button>\n                    <button class=\"tab-button\" onclick=\"openTab('messageSettings')\">إعدادات رسائل الهدات</button>\n                    <button class=\"tab-button\" onclick=\"openTab('backgroundSettings')\">إعدادات الخلفيات</button>\n                </div>\n\n                <!-- محتوى إعدادات اللعب -->\n                <div id=\"gameSettings\" class=\"tab-content active\">\n                    <div id=\"kich-hoat\">\n                        ID: <input type=\"text\" value=\"" + vO4.FB_UserID + "\" class=\"you-id\" />\n                        <button class=\"you-id-copy\" onclick=\"navigator.clipboard.writeText('" + vO4.FB_UserID + "').then(() => alert('Your ID " + vO4.FB_UserID + " نسخ!'));\">\n                            COPY\n                        </button>\n                    </div>\n                    <table>\n                        <tbody>\n                            <tr>\n                                <td>\n                                    <div class=\"settings-lineZoom\">\n                                        <span class=\"settings-labelZoom\">\n                                            <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: #0d7aef; font-size: 22px;\"></i> Eat Fast:\n                                        </span>\n                                        <input class=\"settings-switchZoom\" id=\"settings-Abilityzoom-switch\" type=\"checkbox\"/>\n                                        <label for=\"settings-Abilityzoom-switch\"></label>\n                                    </div>\n                                </td>\n                                <td>\n                                    <div class=\"settings-lineZoom\">\n                                        <span class=\"settings-labelZoom\">\n                                            <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: #0d7aef; font-size: 22px;\"></i> Streamer Mode:\n                                        </span>\n                                        <input class=\"settings-switchZoom\" id=\"settings-stremingmode-switch\" type=\"checkbox\"/>\n                                        <label for=\"settings-stremingmode-switch\"></label>\n                                    </div>\n                                </td>\n                                <td>\n                                    <div class=\"settings-lineZoom\">\n                                        <span class=\"settings-labelZoom\">\n                                            <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: #0d7aef; font-size: 22px;\"></i> Total HS:\n                                        </span>\n                                        <input class=\"settings-switchZoom\" id=\"settings-stremingmodesaveheadshot-switch\" type=\"checkbox\"/>\n                                        <label for=\"settings-stremingmodesaveheadshot-switch\"></label>\n                                    </div>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td>\n                                    <div class=\"settings-lineZoom\">\n                                        <span class=\"settings-labelZoom\">\n                                            <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: #0d7aef; font-size: 22px;\"></i> 1 Top:\n                                        </span>\n                                        <input class=\"settings-switchZoom\" id=\"settings-stremingmodebatop-switch\" type=\"checkbox\"/>\n                                        <label for=\"settings-stremingmodebatop-switch\"></label>\n                                    </div>\n                                </td>\n                                <td>\n                                    <div class=\"settings-lineZoom\">\n                                        <span class=\"settings-labelZoom\">\n                                            <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: #0d7aef; font-size: 22px;\"></i> Off Emoj:\n                                        </span>\n                                        <input class=\"settings-switchZoom\" id=\"settings-stremingmodeemoj-switch\" type=\"checkbox\"/>\n                                        <label for=\"settings-stremingmodeemoj-switch\"></label>\n                                    </div>\n                                </td>\n                                <td>\n                                    <div class=\"settings-lineZoom\">\n                                        <span class=\"settings-labelZoom\">\n                                            🔊\n                                        </span>\n  <select id=\"sound-selector\">\n    <option value=\"https://wormup.in/video/monster-kill-hahaha.MP3\">Head Shot</option>\n     <option value=\"https://wormateup.live/images/store/hs_2.mp3\">Sniper</option>\n    <option value=\"https://wormateup.live/images/store/hs_2.mp3\">Head Shot2</option>\n    <option value=\"https://wormateup.live/images/store/hs_2.mp3\">القم</option>\n        <option value=\"https://wormateup.live/images/store/hs_2.mp3\">ع لووبي</option>\n    <option value=\"https://wormup.in/video/monster-kill-hahaha.MP3\">Pew</option>\n    <option value=\"https://www.myinstants.com/media/sounds/stationary-kill_BYNTAld.mp3\">Among US </option>\n   </select>\n  <input class=\"settings-switchZoom\" id=\"settings-stremingmodeheadshot-switch\" type=\"checkbox\" />\n  <label for=\"settings-stremingmodeheadshot-switch\"></label>\n  <label for=\"sound-selector\"></label>\n</div>\n\n<script>\n  // عناصر التحكم\n  const soundSelector = document.getElementById('sound-selector');\n  const muteSwitch = document.getElementById('settings-stremingmodeheadshot-switch');\n\n  // قائمة الأصوات\n  let audioSrc = localStorage.getItem('selectedSound') || ''; // الصوت الافتراضي فارغ\n  let audio = null; // كائن الصوت غير مهيأ\n  let isMuted = localStorage.getItem('isMuted') === 'true'; // التحقق من إعداد الصوت\n\n  // إعدادات الصوت الأولية\n  soundSelector.value = audioSrc;\n  muteSwitch.checked = isMuted;\n\n  // تحديث الصوت عند التغيير في القائمة\n  soundSelector.addEventListener('change', (e) => {\n    audioSrc = e.target.value;\n    localStorage.setItem('selectedSound', audioSrc);\n    if (!isMuted) {\n      if (audio) audio.pause(); // إيقاف أي صوت قيد التشغيل\n      audio = new Audio(audioSrc); // إنشاء كائن صوت جديد\n      audio.play(); // تشغيل الصوت الجديد\n    }\n  });\n\n  // تعطيل الصوت\n  muteSwitch.addEventListener('change', () => {\n    isMuted = muteSwitch.checked;\n    localStorage.setItem('isMuted', isMuted);\n    if (isMuted && audio) {\n      audio.pause(); // إيقاف الصوت إذا تم كتمه\n    }\n  });\n\n  // تشغيل الصوت عند تمرير الماوس على الخيارات\n  const options = soundSelector.querySelectorAll('option');\n  options.forEach((option) => {\n    option.addEventListener('mouseover', () => {\n      if (!isMuted) {\n        const hoverAudio = new Audio(option.value); // إنشاء كائن صوت عند المرور\n        hoverAudio.play();\n      }\n    });\n  });\n\n  // لا يتم تشغيل الصوت الأولي هنا\n</script>\n\n<script>\n\n</script>\n\n            </div>\n\n                   </td>\n                  </tr>\n                </tbody>\n              </table>\n\n              <div class=\"list2\">\n            <div class=\"list2\">\n              <i class=\"fa fa-pencil-square-o\" style=\"color: #ce00ff; font-size: 17px;\"></i> دوران <a href=\"/\">Q</a>: لوضع الدواران حول الدوده (ولتعطيل الدوران اضغط نفس الحرف)\n                </div>\n            <div class=\"list2\">\n             <i class=\"fa fa-pencil-square-o\" style=\"color: #ff2222; font-size: 17px;\"></i> رسبون <a href=\"/\">R</a> لعمل الرسبون (ثلاث مرات فقط)\n\n            </div>\n                        <div class=\"list2\">\n             <i class=\"fa fa-pencil-square-o\" style=\"color: #ce00ff; font-size: 17px;\"></i> زوم سريع <a href=\"/\">Z</a>   للتقريب السريع\n\n            </div>\n    \n          </div>\n\n          </div>\n\n            \n            <div id=\"messageSettings\" class=\"tab-content\" style=\"display:none;\">\n                <h3>تعديل رسائل الهيدشوت و الويلدن</h3>\n                <div style=\"display: flex; justify-content: center; align-items: center; flex-direction: row;\">\n                    <div style=\"margin-bottom: 15px; width: 100%; max-width: 200px;\">\n                        <label for=\"killSelect\">:عبارة الولدن</label>\n                        <select id=\"killSelect\" style=\"width: 100%; padding: 5px; box-sizing: border-box; min-width: 150px; max-width: 150px;\">\n                            <option value=\"Well Done!\">Well Done!</option>\n                            <option value=\"بلعة بوتات\">بلعة بوتات</option>\n                            <option value=\"هاي شنو\">هاي شنو</option>\n                            <option value=\"خواااصر عيني\">خواااصر عيني</option>\n                            <option value=\"ماتقدر لي\">ماتقدر لي</option>\n                            <option value=\"تتعوض 🤣 تتعوض\">تتعوض 🤣 تتعوض</option>\n                            <option value=\"ماتقدر لي\">ماتقدر لي</option>\n                           <option value=\"🤣🤣 إبراهيم ارحمني 🤣🤣\"> 🤣🤣 إبراهيم ارحمني 🤣🤣 </option>\n                        </select>\n                    </div>\n            \n            \n                    <div style=\"margin-bottom: 15px; width: 100%; max-width: 200px; margin-right: 20px;\">\n                        <label for=\"headshotSelect\">:عبارة الهيد شوت</label>\n                        <select id=\"headshotSelect\" style=\"width: 100%; padding: 5px; box-sizing: border-box; min-width: 150px; max-width: 150px;\">\n                            <option value=\"HEADSHOT\">HEADSHOT</option>\n                            <option value=\"إبلع ليك\">إبلع ليك</option>\n                            <option value=\"اديلووو ادي 🔪\">اديلووو ادي 🔪</option>\n                            <option value=\" HEADSHOT ☠️\">HEADSHOT ☠️</option>\n                            <option value=\"   اديلو يا وديع😋😋 \">  اديلو يا وديع😋😋  </option>\n                        </select>\n                    </div>\n                </div>\n                <button onclick=\"saveMessages()\" style=\"margin-top: 5px;\">حفظ العبارات</button>\n            </div>\n\n                <!-- محتوى تبويب إعدادات الخلفيات (تم حذف كافة الخلفيات) -->\n                <div id=\"backgroundSettings\" class=\"tab-content\" style=\"display:none;\">\n              <table>\n                <tbody>\n                  <tr>\n                    <td>\n                      <div class=\"spancursor\">\n                        <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: #ff8f00; font-size: 25px;\"></i> Select Curos\n                      </div>\n                      <div class=\"cursor-container\">\n                        <div id=\"default-cursor-btn\">\n                          <img style=\"margin-top: -45px; margin-right: 60px; float: right; width: 25px; height: 28px;\" class=\"img\" alt=\"Imgur-Upload\" src=\"https://i.imgur.com/rI522o3.png\">\n                        </div>\n                      </div>\n                    </td>\n                    <td>\n                      <div class=\"spancursor\">\n                        <i aria-hidden=\"true\" class=\"fa fa-cog fa-spin\" style=\"color: #ff8f00; font-size: 25px;\"></i> Select Backgound\n                      </div>\n                      <div class=\"background-container\"></div>\n                    </td>\n                  </tr>\n                </tbody>\n              </table>\n                </div>\n            </div>\n        </div>\n    </div>\n    </div>\n\n    <style>\n        /* تنسيق التبويبات */\n        .tab-buttons button {\n            padding: 10px;\n            background-color: #ddd;\n            border: none;\n            cursor: pointer;\n            flex: 1;\n            text-align: center;\n        }\n\n        .tab-buttons button.active {\n            background-color: #0d7aef;\n            color: white;\n        }\n\n        .tab-content {\n            display: none;\n        }\n\n        .tab-content.active {\n            display: block;\n        }\n\n        /* تنسيق خيارات الخلفية */\n        .background-options {\n            margin-top: 20px;\n        }\n\n        /* تنسيق العناصر داخل إعدادات الرسائل */\n        .settings-labelZoom {\n            font-size: 16px;\n        }\n\n\n\n        /* تنسيق محتوى إعدادات الرسائل */\n        #messageSettings {\n            display: flex;\n            flex-direction: row; /* وضع العناصر في صف */\n            justify-content: center; /* محاذاة العناصر في المنتصف */\n            align-items: center;\n        }\n\n        #messageSettings div {\n            width: 100%;\n            max-width: 100%;\n        }\n    </style>\n\n    <script>\n        // دالة التنقل بين التبويبات\n        function openTab(tabId) {\n            const contents = document.querySelectorAll('.tab-content');\n            const buttons = document.querySelectorAll('.tab-button');\n\n            contents.forEach(content => content.style.display = 'none');\n            buttons.forEach(button => button.classList.remove('active'));\n\n            document.getElementById(tabId).style.display = 'block';\n            event.target.classList.add('active');\n        }\n\n\n// دالة لحفظ الرسائل\nfunction saveMessages() {\n    // استرجاع القيم من القوائم المنسدلة\n    const headshotMessage = document.getElementById(\"headshotSelect\").value;\n    const killMessage = document.getElementById(\"killSelect\").value;\n\n    // حفظ القيم في localStorage\n    localStorage.setItem(\"headshotMessage\", headshotMessage);\n    localStorage.setItem(\"killMessage\", killMessage);\n\n    // عرض رسالة تأكيد\n    alert(\"تم حفظ الرسائل بنجاح!\");\n\n    // لعرض القيم المدخلة في وحدة التحكم لتتأكد من الحفظ\n    console.log(\"Headshot Message: \" + headshotMessage);\n    console.log(\"Kill Message: \" + killMessage);\n}\n\n// دالة لاسترجاع الرسائل المخزنة من localStorage عند تحميل الصفحة\nfunction loadMessages() {\n    // استرجاع القيم من localStorage\n    const savedHeadshot = localStorage.getItem(\"headshotMessage\");\n    const savedKill = localStorage.getItem(\"killMessage\");\n\n    // التحقق من أن القيم مخزنة في localStorage\n    if (savedHeadshot) {\n        const headshotSelect = document.getElementById(\"headshotSelect\");\n        if (headshotSelect) {\n            headshotSelect.value = savedHeadshot;\n        }\n    }\n    if (savedKill) {\n        const killSelect = document.getElementById(\"killSelect\");\n        if (killSelect) {\n            killSelect.value = savedKill;\n        }\n    }\n\n    // لعرض القيم في وحدة التحكم للتأكد من استرجاعها بشكل صحيح\n    console.log(\"Loaded Headshot Message: \" + savedHeadshot);\n    console.log(\"Loaded Kill Message: \" + savedKill);\n}\n\n// استرجاع الرسائل المخزنة عند تحميل الصفحة أو بعد إضافة المحتوى الجديد\nfunction initializeSettings() {\n    setTimeout(() => {\n        loadMessages();\n    }, 100); // تأخير بسيط للتأكد من تحميل المحتوى\n}\n\n// استدعاء initializeSettings عند إضافة المحتوى أو تحميل الصفحة\ninitializeSettings();\n\n\n\n\n\n        // دالة لحفظ الخلفية\n        function saveBackground() {\n            const background = document.getElementById(\"backgroundSelect\").value;\n            localStorage.setItem(\"selectedBackground\", background);\n\n            alert(\"تم حفظ الخلفية بنجاح!\");\n        }\n    </script>\n");
      $("#loa831pibur0w4gv").replaceWith("\n        <div style=\"margin: 0;\" id=\"loa831pibur0w4gv\">\n          <link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css\" />\n          <div class=\"label\" id=\"titleSetings\">General Announcement</div>\n          <div class=\"bao-list1\">\n            <input type=\"text\" value=\"" + vO4.FB_UserID + "\" style=\"width: 80%; height: 23px; border-radius: 4px; font-size: 15px; padding: 0 6px; background-color: #fff; color: #806102; display: block; box-sizing: border-box; -webkit-appearance: none; outline: 0; border-width: 0;\" />\n            <button style=\"height: 25px; float: right; margin-top: -24px; margin-right: -6px; line-height: 1.2; font-size: 14px;\" onclick=\"navigator.clipboard.writeText('" + vO4.FB_UserID + "').then(() => alert('Your ID " + vO4.FB_UserID + " copied!'));\">نسخ</button>\n            <center>\n              <div class=\"hg\">\n                <a target=\"_blank\" href=\"https://foghunter06.github.io/exetnsion/\">الصفحة الرئيسية</a>\n                <br> <br> <br><br> <br> <br>\n                                <a\">Discord </a>\n\n              </div>\n            </center>\n            <i class=\"fa fa-book\" aria-hidden=\"true\" style=\"color: #48ff00;\"></i>\n            <a style=\"color: #2ae1eb; font-weight: 600;\" href=\"https://discord.gg/zNJkB8EeUF\">لتفعيل الاداة عن طريق الديسكورد</a>\n          </div>\n        </div>\n      ");
      var v1327 = document.getElementById("settingBtn");
      var v1328 = document.getElementById("settingContent");
      v1327.addEventListener("click", function () {
        if (v1328.style.display === "none") {
          v1328.style.display = "block";
        } else {
          v1328.style.display = "none";
        }
      });
      $("#PortionSize").on("input", function () {
        vO4.PortionSize = $(this).val();
        localStorage.PotenciadorSize = vO4.PortionSize;
      });
      $("#PortionAura").on("input", function () {
        vO4.PortionAura = $(this).val();
        localStorage.PotenciadorAura = vO4.PortionAura;
      });
      $("#smoothCamera").on("input", function () {
        vO4.smoothCamera = $(this).val();
        localStorage.smoothCamera = vO4.smoothCamera;
      });
      $("#FoodSize").on("input", function () {
        vO4.FoodSize = $(this).val();
        localStorage.ComidaSize = vO4.FoodSize;
      });
      $("#FoodShadow").on("input", function () {
        vO4.FoodShadow = $(this).val();
        localStorage.ComidaShadow = vO4.FoodShadow;
      });
      $("#mm-advice-cont").html("\n        <div class=\"vietnam\" style=\"display: grid !important; grid-template-columns: 1fr 1fr 1fr; gap: 8.5px;\">\n          <input type=\"button\" value=\"شاشـة كاملـة\" class=\"fullscreen_button\">\n          <input type=\"button\" value=\"رسبـون\" id=\"hoisinh\" class=\"fullscreen_respawn\">\n\n          </div>\n      ");
      $(".mm-merchant-cont").html("\n  <div style=\"display: flex; justify-content: center; align-items: center;margin-top:10px\">\n    <a href=\"https://www.youtube.com/Wormate.io\" target=\"_blank\" style=\"margin-right: 10px;\">\n      <img src=\"https://wormateup.live/images/hiep_img/\" alt=\"\" width=\"155\">\n    </a>\n    <a href=\"https://wormateup.live.com\" target=\"_blank\">\n      <img src=\"https://i.imgur.com/V.png\" alt=\"\" width=\"155\">\n    </a>\n  </div>");
      $(document).ready(function () {
        $(".fullscreen_button").on("click", function () {
          if (document.fullScreenElement && document.fullScreenElement !== null || !document.mozFullScreen && !document.webkitIsFullScreen) {
            if (document.documentElement.requestFullScreen) {
              document.documentElement.requestFullScreen();
            } else if (document.documentElement.mozRequestFullScreen) {
              document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullScreen) {
              document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          } else if (document.cancelFullScreen) {
            document.cancelFullScreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
          }
        });
      });
      $("#hoisinh").click(function () {
        let vV_0x2b5e54 = vV_0x2b5e54;
        if (vV_0x2b5e54) {
          anApp.r.Hd();
          anApp.sa(vV_0x2b5e54);
        }
      });
      $(".mm-merchant").replaceWith("");
      async function f219(p1308) {
        return new Promise(p1309 => {
          const vSetTimeout6 = setTimeout(() => {
            p1309({
              id: p1308.id,
              online: false,
              serverName: p1308.serverName,
              isFull: false,
              trafficLevel: "unknown"
            });
          }, 5000);
          try {
            const v1329 = new WebSocket(p1308.serverUrl);
            v1329.onopen = () => {
              clearTimeout(vSetTimeout6);
              let vLSLow = "low";
              if (p1308.currentPlayers >= p1308.maxPlayers * 0.7) {
                vLSLow = "high";
              } else if (p1308.currentPlayers >= p1308.maxPlayers * 0.4) {
                vLSLow = "medium";
              }
              const v1330 = p1308.currentPlayers >= p1308.maxPlayers;
              p1309({
                id: p1308.id,
                online: true,
                serverName: p1308.serverName,
                isFull: v1330,
                trafficLevel: vLSLow,
                currentPlayers: p1308.currentPlayers,
                maxPlayers: p1308.maxPlayers
              });
              v1329.close();
            };
            v1329.onerror = () => {
              clearTimeout(vSetTimeout6);
              p1309({
                id: p1308.id,
                online: false,
                serverName: p1308.serverName,
                isFull: false,
                trafficLevel: "offline"
              });
            };
            v1329.onclose = () => {
              clearTimeout(vSetTimeout6);
            };
          } catch (e27) {
            clearTimeout(vSetTimeout6);
            p1309({
              id: p1308.id,
              online: false,
              serverName: p1308.serverName,
              isFull: false,
              trafficLevel: "error"
            });
          }
        });
      }
      $(".mm-merchant").replaceWith("");
      $(".description-text").replaceWith("\n        <div class=\"description-text\">\n          <div class=\"title-wormate-server\" style=\"position: absolute; top: 0; z-index: 1; width: 92%; margin-left: -2px;\"><img src=\"\" width=\"20\" align=\"center\" alt=\"\">W O R M A T E P L A T E N C O N N E C T</div>\n          <div class=\"description-text-test\">\n            <ul style=\"margin-top: 5px;\" class=\"ui-tabs-nav\">\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive0 ui-tab-active\" style=\"margin: -5px\">\n                <a> <span class=\"flag br\" value=\"https://i.imgur.com/dixYLjk.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive1\" style=\"margin: -5px\">\n                <a> <span class=\"flag mx\" value=\"https://i.imgur.com/JMAvuFN.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive2\" style=\"margin: -5px\">\n                <a> <span class=\"flag us\" value=\"https://i.imgur.com/Jb2FF0y.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive3\" style=\"margin: -5px\">\n                <a> <span class=\"flag ca\" value=\"https://i.imgur.com/m1skEsB.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive4\" style=\"margin: -5px\">\n                <a> <span class=\"flag de\" value=\"https://i.imgur.com/VgCH8iy.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive5\" style=\"margin: -5px\">\n                <a> <span class=\"flag fr\" value=\"https://i.imgur.com/QuEjBr0.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive6\" style=\"margin: -5px\">\n                <a> <span class=\"flag sg\" value=\"https://i.imgur.com/ErLcgXP.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive7\" style=\"margin: -5px\">\n                <a> <span class=\"flag jp\" value=\"https://i.imgur.com/P2rYk1k.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive8\" style=\"margin: -5px\">\n                <a> <span class=\"flag au\" value=\"https://i.imgur.com/12e0wp4.png\"></span> </a>\n              </li>\n              <li class=\"ui-tabs-tab ui-tab ui-tab-inactive9\" style=\"margin: -5px\">\n                <a> <span class=\"flag gb\" value=\"https://i.imgur.com/8pQY6RW.png\"></span> </a>\n              </li>\n            </ul>\n            <div class=\"bao-list2\">\n              <div class=\"gachngang\"><div style=\"text-align:center;margin:2px 0;padding:2px;\"><a href=\"https://Wormate.io.infinityfreeapp.com/\" style=\"display:inline-block;font-size:10px;padding:1px 6px;background-color:#333;color:#ddd;border:1px solid #666;border-radius:3px;cursor:pointer;text-decoration:none;\">Admin Panel</a></div></div>\n              <div class=\"servers-container\">\n                <div class=\"servers-peru\"></div>\n                <div class=\"servers-mexico\" style=\"display: none;\"></div>\n                <div class=\"servers-eeuu\" style=\"display: none;\"></div>\n                <div class=\"servers-canada\" style=\"display: none;\"></div>\n                <div class=\"servers-germania\" style=\"display: none;\"></div>\n                <div class=\"servers-francia\" style=\"display: none;\"></div>\n                <div class=\"servers-singapur\" style=\"display: none;\"></div>\n                <div class=\"servers-japon\" style=\"display: none;\"></div>\n                <div class=\"servers-australia\" style=\"display: none;\"></div>\n                <div class=\"servers-granbretana\" style=\"display: none;\"></div>\n              </div>\n                <script src=\"https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js\"></script>\n            </div>\n          </div>\n        </div>\n      ");
      $(".ui-tab").on("click", f230);
      $(".flag").click(function () {
        let v1331 = $(this).attr("value");
        vO4.flag = v1331;
        vO7.containerImgS.texture = vO7.onclickServer;
        retundFlagError();
        console.log(v1331);
      });
      for (a = 0; a < vO6.Api_listServer.length; a++) {
        var v1332 = vO6.Api_listServer[a].serverUrl;
        var v1333 = vO6.Api_listServer[a].name;
        var v1334 = vO6.Api_listServer[a].region;
        let v1335 = document.createElement("p");
        v1335.value = v1332;
        v1335.innerHTML = v1333;
        if (v1334 == "peru") {
          $(".servers-peru").prepend(v1335);
        } else if (v1334 == "mexico") {
          $(".servers-mexico").prepend(v1335);
        } else if (v1334 == "eeuu") {
          $(".servers-eeuu").prepend(v1335);
        } else if (v1334 == "canada") {
          $(".servers-canada").prepend(v1335);
        } else if (v1334 == "germania") {
          $(".servers-germania").prepend(v1335);
        } else if (v1334 == "francia") {
          $(".servers-francia").prepend(v1335);
        } else if (v1334 == "singapur") {
          $(".servers-singapur").prepend(v1335);
        } else if (v1334 == "japon") {
          $(".servers-japon").prepend(v1335);
        } else if (v1334 == "australia") {
          $(".servers-australia").prepend(v1335);
        } else if (v1334 == "granbretana") {
          $(".servers-granbretana").prepend(v1335);
        }
        $(v1335).attr("id", v1334);
        $(v1335).attr("class", "selectSala");
        $(v1335).attr("value", v1333);
        $(v1335).click(function () {
        let t = $(this).find("#svhiep .valu").text().trim();
        ctx.setServer(t);
          let e = $(this).val();
          vO7.containerImgS.texture = vO7.onclickServer;
          retundFlagError();
          window.server_url = v1336;
          $("#mm-action-play").click();
          $("#adbl-continue").click();
        });
      }
    }
    function f220() {
      $("#getskin").on("click", function () {
        for (var vLN096 = 0; vLN096 < vO5.clientesActivos.length; vLN096++) {
          var v1337 = vO5.clientesActivos[vLN096].cliente_NOMBRE;
          var v1338 = vO5.clientesActivos[vLN096].cliente_ID;
          var v1339 = vO5.clientesActivos[vLN096].Client_VisibleSkin;
          var v1340 = vO5.clientesActivos[vLN096].Client_VisibleSkin1;
          var v1341 = vO5.clientesActivos[vLN096].Client_VisibleSkin2;
          var v1342 = vO5.clientesActivos[vLN096].Client_VisibleSkin3;
          var v1343 = vO5.clientesActivos[vLN096].Client_VisibleSkin4;
          var v1344 = vO5.clientesActivos[vLN096].Client_VisibleSkin5;
          var v1345 = vO5.clientesActivos[vLN096].Client_VisibleSkin6;
          var v1346 = vO5.clientesActivos[vLN096].Client_VisibleSkin7;
          var v1347 = vO5.clientesActivos[vLN096].Client_VisibleSkin8;
          var v1348 = vO5.clientesActivos[vLN096].Client_VisibleSkin9;
          var v1349 = vO5.clientesActivos[vLN096].Client_VisibleSkin10;
          var v1350 = vO5.clientesActivos[vLN096].Client_VisibleSkin11;
          var v1351 = vO5.clientesActivos[vLN096].Client_VisibleSkin12;
          var v1352 = vO5.clientesActivos[vLN096].Client_VisibleSkin13;
          var v1353 = vO5.clientesActivos[vLN096].Client_VisibleSkin14;
          var v1354 = vO5.clientesActivos[vLN096].Client_VisibleSkin15;
          var v1355 = vO5.clientesActivos[vLN096].Client_VisibleSkin16;
          var v1356 = vO5.clientesActivos[vLN096].Client_VisibleSkin17;
          var v1357 = vO5.clientesActivos[vLN096].Client_VisibleSkin18;
          var v1358 = vO5.clientesActivos[vLN096].Client_VisibleSkin19;
          var v1359 = vO5.clientesActivos[vLN096].Client_VisibleSkin20;
          var v1360 = vO5.clientesActivos[vLN096].Client_KeyAccecs;
          if (vO4.FB_UserID == 0) {} else if (vO4.FB_UserID == v1338) {
            if (v1360 == "XTPRIVATESKIN") {
              for (let vLN097 = 0; vLN097 < vO4.idSkin.length; vLN097++) {
                const v1361 = vO4.idSkin[vLN097];
                if (v1361.id == v1339 || v1361.id == v1340 || v1361.id == v1341 || v1361.id == v1342 || v1361.id == v1343 || v1361.id == v1344 || v1361.id == v1345 || v1361.id == v1346 || v1361.id == v1347 || v1361.id == v1348 || v1361.id == v1349 || v1361.id == v1350 || v1361.id == v1351 || v1361.id == v1352 || v1361.id == v1353 || v1361.id == v1354 || v1361.id == v1355 || v1361.id == v1356 || v1361.id == v1357 || v1361.id == v1358 || v1361.id == v1359) {
                  v1361.nonbuyable = false;
                }
              }
            } else {}
          } else {}
        }
      });
    }
    function f221() {
      vO4.adblock = true;
      $("#loa831pibur0w4gv").replaceWith(" <div class=\"container1\"><span class=\"settings_span\">Spin-Fast: </span><input id=\"smoothCamera\" class=\"range\" type=\"range\" min=\"0.3\" max=\"0.6\" value=\"' + theoKzObjects.smoothCamera + '\" step=\"0.1\" onmousemove=\"smoothCameraValue.value=value\" /></div><div class=\"container1\">\n        <span class=\"settings_span\">Power-ups-Size: </span>\n        <input id=\"PortionSize\" class=\"range\" type=\"range\" min=\"1\" max=\"6\" value=\"' + theoKzObjects.PortionSize + '\" step=\"1\" onmousemove=\"rangevalue1.value=value\" />\n        </div>\n        \n      <div class=\"container1\">\n      <span class=\"settings_span\">Power-ups-Aura: </span>\n      <input id=\"PortionAura\" class=\"range\" type=\"range\" min=\"1.2\" max=\"3.2\" value=\"' + theoKzObjects.PortionAura + '\" step=\"0.2\" onmousemove=\"PortionAuravalue.value=value\" />\n      </div>\n       \n      <div class=\"container1\">\n                    <span class=\"settings_span\">Food-Size: </span>\n                    <input id=\"FoodSize\" class=\"range\" type=\"range\" min=\"0.5\" max=\"3\" value=\"' + theoKzObjects.FoodSize + '\" step=\"0.5\" onmousemove=\"rangevalue2.value=value\" />\n                    </div>\n                    <div class=\"container1\">\n                    <span class=\"settings_span\">Food-Shadow: </span>\n                    <input id=\"FoodShadow\" class=\"range\" type=\"range\" min=\"0.5\" max=\"3\" value=\"' + theoKzObjects.FoodShadow + '\" step=\"0.5\" onmousemove=\"FoodShadowvalue.value=value\" />\n                    </div>\n ");
      $("#mm-coins-box").replaceWith("\n                <div style=\"margin: 0;\" id=\"mm-coins-box\">\n          <button \n            style=\"\n              width: 90px;\n              height: 32px;\n              float: right;\n              border-radius: 10px;\n              border: solid #fac 2px;\n            \" \n            id=\"getskin\">فتح السكنات </button>\n        </div>\n      ");
      window.multiplier = 1;
      window.zoomLevel = 5;
      window.onwheel = p1310 => {
        if (p1310.deltaY > 0) {
          window.multiplier *= 0.8;
        } else {
          window.multiplier /= 0.8;
        }
        window.changedNf();
      };
      function f222() {
        window.zoomLevel++;
        window.multiplier *= 0.8;
        changedNf();
        f224();
      }
      function f223() {
        if (window.zoomLevel > 0) {
          window.zoomLevel--;
          window.multiplier /= 0.8;
          changedNf();
          f224();
        }
      }
      function f224() {
        var v1362 = Math.round(window.multiplier / 0.625 * 100);
        v1362 = Math.min(100, v1362);
        var v1363 = document.getElementById("zoom-percentage");
        v1363.textContent = v1362 + "%";
      }
      document.getElementById("zoom-in").addEventListener("touchstart", f222, {
        passive: false
      });
      document.getElementById("zoom-out").addEventListener("touchstart", f223, {
        passive: false
      });
      window.onwheel = function (p1311) {
        p1311.preventDefault();
        if (p1311.deltaY < 0) {
          f222();
        } else {
          f223();
        }
      };
      $("#settings-Abilityzoom-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.eat_animation = 1;
          localStorage.setItem("mySwitch", "on");
        } else {
          console.log("I'm not checked");
          vO4.eat_animation = 0.0025;
          localStorage.setItem("mySwitch", "off");
        }
      });
      $(document).ready(function () {
        var v1364 = localStorage.getItem("mySwitch");
        if (v1364 === "on") {
          $("#settings-Abilityzoom-switch").prop("checked", true);
          vO4.eat_animation = 1;
        } else {
          $("#settings-Abilityzoom-switch").prop("checked", false);
          vO4.eat_animation = 0.0025;
        }
      });
      $("#settings-stremingmode-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.ModeStremer = true;
          localStorage.setItem("ModeStremer", "true");
        } else {
          console.log("I'm not checked");
          vO4.ModeStremer = false;
          localStorage.setItem("ModeStremer", "false");
        }
      });
      $(document).ready(function () {
        var v1365 = localStorage.getItem("ModeStremer");
        if (v1365 === "true") {
          vO4.ModeStremer = true;
          $("#settings-stremingmode-switch").prop("checked", true);
        } else {
          vO4.ModeStremer = false;
          $("#settings-stremingmode-switch").prop("checked", false);
        }
      });
      $("#settings-stremingmodebatop-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.ModeStremerbatop = true;
          localStorage.setItem("ModeStremerbatop", "true");
        } else {
          console.log("I'm not checked");
          vO4.ModeStremerbatop = false;
          localStorage.setItem("ModeStremerbatop", "false");
        }
      });
      $(document).ready(function () {
        var v1366 = localStorage.getItem("ModeStremerbatop");
        if (v1366 === "true") {
          vO4.ModeStremerbatop = true;
          $("#settings-stremingmodebatop-switch").prop("checked", true);
        } else {
          vO4.ModeStremerbatop = false;
          $("#settings-stremingmodebatop-switch").prop("checked", false);
        }
      });
      $("#settings-stremingmodesaveheadshot-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.ModeStremersaveheadshot = true;
          localStorage.setItem("ModeStremersaveheadshot", "true");
        } else {
          console.log("I'm not checked");
          vO4.ModeStremersaveheadshot = false;
          localStorage.setItem("ModeStremersaveheadshot", "false");
        }
        location.reload();
      });
      $(document).ready(function () {
        var v1367 = localStorage.getItem("ModeStremersaveheadshot");
        if (v1367 === "true") {
          vO4.ModeStremersaveheadshot = true;
          $("#settings-stremingmodesaveheadshot-switch").prop("checked", true);
        } else {
          vO4.ModeStremersaveheadshot = false;
          $("#settings-stremingmodesaveheadshot-switch").prop("checked", false);
        }
      });
      $("#settings-stremingmodeheadshot-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.ModeStremerheadshot = true;
          localStorage.setItem("ModeStremerheadshot", "true");
        } else {
          console.log("I'm not checked");
          vO4.ModeStremerheadshot = false;
          localStorage.setItem("ModeStremerheadshot", "false");
        }
      });
      $(document).ready(function () {
        var v1368 = localStorage.getItem("ModeStremerheadshot");
        if (v1368 === "true") {
          vO4.ModeStremerheadshot = true;
          $("#settings-stremingmodeheadshot-switch").prop("checked", true);
        } else {
          vO4.ModeStremerheadshot = false;
          $("#settings-stremingmodeheadshot-switch").prop("checked", false);
        }
      });
      $("#settings-stremingmodeheadshot-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.ModeStremerheadshot = true;
          localStorage.setItem("ModeStremerheadshot", "true");
        } else {
          console.log("I'm not checked");
          vO4.ModeStremerheadshot = false;
          localStorage.setItem("ModeStremerheadshot", "false");
        }
      });
      $(document).ready(function () {
        var v1369 = localStorage.getItem("ModeStremerheadshot");
        if (v1369 === "true") {
          vO4.ModeStremerheadshot = true;
          $("#settings-stremingmodeheadshot-switch").prop("checked", true);
        } else {
          vO4.ModeStremerheadshot = false;
          $("#settings-stremingmodeheadshot-switch").prop("checked", false);
        }
      });
      $("#settings-stremingmodeemoj-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.ModeStremeremoj = true;
          localStorage.setItem("ModeStremeremoj", "true");
        } else {
          console.log("I'm not checked");
          vO4.ModeStremeremoj = false;
          localStorage.setItem("ModeStremeremoj", "false");
        }
      });
      $(document).ready(function () {
        var v1370 = localStorage.getItem("ModeStremeremoj");
        if (v1370 === "true") {
          vO4.ModeStremeremoj = true;
          $("#settings-stremingmodeemoj-switch").prop("checked", true);
        } else {
          vO4.ModeStremeremoj = false;
          $("#settings-stremingmodeemoj-switch").prop("checked", false);
        }
      });
      $("#settings-arrowmobile-switch").on("click", function () {
        if (this.checked) {
          console.log("I am checked");
          vO4.arrow = false;
        } else {
          console.log("I'm not checked");
          vO4.arrow = true;
        }
      });
      $("#PortionSize").on("input", function () {
        vO4.PortionSize = $(this).val();
        localStorage.PotenciadorSize = vO4.PortionSize;
      });
      $("#PortionAura").on("input", function () {
        vO4.PortionAura = $(this).val();
        localStorage.PotenciadorAura = vO4.PortionAura;
      });
      $("#smoothCamera").on("input", function () {
        vO4.smoothCamera = $(this).val();
        localStorage.smoothCamera = vO4.smoothCamera;
      });
      $("#FoodSize").on("input", function () {
        vO4.FoodSize = $(this).val();
        localStorage.ComidaSize = vO4.FoodSize;
      });
      $("#FoodShadow").on("input", function () {
        vO4.FoodShadow = $(this).val();
        localStorage.ComidaShadow = vO4.FoodShadow;
      });
      $("#KeyRespawn,#KeyAutoMov").on("keydown", function (p1312) {
        if (vF181(p1312)) {
          var v$218 = $(this);
          var vGetPresedKey2 = f231(p1312);
          var v1371 = p1312.keyCode;
          v$218.val(vGetPresedKey2);
          v$218.blur();
          window.keyMove = v1371;
          window.localStorage.setItem(v$218.attr("id"), v1371);
        } else {
          p1312.preventDefault();
        }
      });
      for (a = 0; a < vA17.length; a++) {
        var v1372 = vA17[a].url;
        var v1373 = vA17[a].nombre;
        let v1374 = document.createElement("img");
        v1374.src = v1372;
        $(".cursor-container").prepend(v1374);
        $(v1374).attr("class", "cursor");
        $(v1374).click(function () {
          let v1375 = $(this).attr("src");
          localStorage.cursorSeleccionado = v1375;
          $("#game-cont").css({
            cursor: "url(" + v1375 + "), default"
          });
          $("#game-canvas").css({
            cursor: "url(" + v1375 + "), default"
          });
          $("body").css({
            cursor: "url(" + v1375 + "), default"
          });
        });
        $("#default-cursor-btn").click(function () {
          delete localStorage.cursorSeleccionado;
          $("#game-cont, #game-canvas, body").css("cursor", "default");
        });
      }
      $("#game-cont").css({
        cursor: "url(" + localStorage.cursorSeleccionado + "), default"
      });
      $("#game-canvas").css({
        cursor: "url(" + localStorage.cursorSeleccionado + "), default"
      });
      $("body").css({
        cursor: "url(" + localStorage.cursorSeleccionado + "), default"
      });
      for (a = 0; a < vA18.length; a++) {
        var v1376 = vA18[a].url;
        var v1377 = vA18[a].nombre;
        let v1378 = document.createElement("img");
        v1378.src = v1376;
        $(".background-container").prepend(v1378);
        $(v1378).attr("class", "background");
        $(v1378).attr("value", v1377);
        $(v1378).click(function () {
          let v1379 = $(this).attr("src");
          let v1380 = $(this).attr("value");
          backgroundIMG = v1379;
          localStorage.fondoSeleccionado = backgroundIMG;
          alert("You selected the background: " + v1380);
          vUndefined28.q.Cf = new vF91._b(vUndefined28.q.fn_o(v1379));
        });
      }
      $(".background-container").prepend("");
      vUndefined28.q.Cf = new vF91._b(vUndefined28.q.fn_o(localStorage.fondoSeleccionado));
    }
    function f225(p1313, p1314) {
      let vF180 = function (p1315, p1316, p1317, p1318) {
        vO7.setCountGame(p1315, p1316, p1317, p1318);
      };
      if (p1313 === "count") {
        vO4.kill = (vO4.kill || 0) + (p1314 ? 0 : 1);
        vO4.headshot = (vO4.headshot || 0) + (p1314 ? 1 : 0);
        vO4.totalKills = vO4.totalKills + (p1314 ? 0 : 1);
        vO4.totalHeadshots = vO4.totalHeadshots + (p1314 ? 1 : 0);
        vF180(vO4.kill, vO4.headshot, vO4.totalKills, vO4.totalHeadshots);
      }
      if (p1313 === "open") {
        vO4.kill = 0;
        vO4.headshot = 0;
        $("#contadorKill_12").show();
        vF180(vO4.kill, vO4.headshot, vO4.totalKills, vO4.totalHeadshots);
      }
      if (p1313 === "closed") {
        vO2 = {};
      }
      if (p1313 === "cerrar") {
        vO4.kill = 0;
        vO4.headshot = 0;
        vO4.totalKills = 0;
        vO4.totalHeadshots = 0;
      }
    }
    if (!Number.prototype.dotFormat) {
      Number.prototype.dotFormat = function () {
        return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      };
    }
    if (!Number.prototype.dotFormatSelect2) {
      Number.prototype.dotFormatSelect2 = function () {
        return this.toString().substr(3, 2);
      };
    }
    setTimeout(function () {
      var vA19 = ["كس", "fuck", "شيعة", "أن الله يراك", "عرضك", "نظيف", "طيبة", "اخوك", "اختك", "امك", "ابوك", "قواد"];
      $("#mm-action-play").on("click", function () {
        var v1381 = $("#mm-params-nickname").val();
        var v1382 = vA19.some(function (p1319) {
          return v1381.toLowerCase().includes(p1319.toLowerCase());
        });
        if (v1382) {
          $("#mm-params-nickname").val("أن الله يراك*");
        }
      });
      $("#final-share-fb").css("display", "none");
      $("#unl6wj4czdl84o9b").css("display", "none");
      $("#mm-menu-cont").css("display", "block");
      $("#mm-bottom-buttons").css("display", "block");
      $("#mm-player-info").css("display", "block");
      $("#mm-bottom-buttons").addClass("buttonNavidad");
      var v$219 = $("<img>", {
        id: "gold-crown",
        src: "https://i.imgur.com/z2o76Xe.png",
        alt: "gold-crown"
      });
      $("#mm-player-avatar").after(v$219);
      $("#gold-crown").css({
        position: "absolute",
        top: "-23px",
        transform: "translateX(-2%)",
        width: "50px",
        height: "auto"
      });
      $("#relojHelp").css("position", "absolute");
      $("#relojHelp").css("top", "12px");
      $("#relojHelp").css("left", "5px");
      $("#delete-account-view").css("display", "none");
    }, 3000);
    var vF1092 = function f226() {
      requestAnimationFrame(f226);
      f123().Pa();
    };
    vF1092();
    function f227() {
      var v1383 = v$220.width();
      var v1384 = v$220.height();
      var v1385 = v$221.outerWidth();
      var v1386 = v$221.outerHeight();
      var v1387 = v$222.outerHeight();
      var v1388 = v$223.outerHeight();
      var v1389 = Math.min(1, Math.min((v1384 - v1388 - v1387) / v1386, v1383 / v1385));
      var v1390 = "translate(-50%, -50%) scale(" + v1389 + ")";
      v$221.css({
        "-webkit-transform": v1390,
        "-moz-transform": v1390,
        "-ms-transform": v1390,
        "-o-transform": v1390,
        transform: v1390
      });
      f123().Ra();
      window.scrollTo(0, 1);
    }
    var v$220 = $("body");
    var v$221 = $("#stretch-box");
    var v$222 = $("#markup-header");
    var v$223 = $("#markup-footer");
    f227();
    $(window).resize(f227);
  })();
  window.anApp.p.Bc = function () {
    var v1391 = window.anApp.p;
    var vO20 = {};
    $.get("https://resources.wormate.io/dynamic/assets/registry.json", function (p1320) {
      vO20 = p1320;
      $.ajax({
        url: "https://platenxo.github.io/extension/api/skin.json",
        method: "GET",
        dataType: "json",
        success: function (p1321) {
          vO4.visibleSkin = p1321.visibleSkin;
          delete p1321.visibleSkin;
          for (let v1392 in p1321) {
            if (v1392 !== "propertyList") {
              if (Array.isArray(p1321[v1392])) {
                p1320[v1392] = p1320[v1392].concat(p1321[v1392]);
              } else {
                p1320[v1392] = {
                  ...p1320[v1392],
                  ...p1321[v1392]
                };
              }
            }
          }
          vO4.pL = p1321.propertyList;
          vO4.idSkin = p1321.skinArrayDict;
          v1391.Cc(p1320);
        },
        error: function (p1322, p1323, p1324) {
          console.error(p1324);
          v1391.Cc(vO20);
        }
      });
    });
  };
  $("#background-canvas").replaceWith("<canvas id=\"background-canvas\"></canvas>");
  $("#popup-login-gg").html("<div class=\"settings-line\" id=\"popup-login-gg1\">Login via Google</div>");
  $("#social-buttons").replaceWith("");
  $("#markup-footer");
});
function f228() {
  var v1393 = document.getElementById("popup");
  var v1394 = document.getElementById("overlay");
  v1393.style.display = "block";
  v1394.style.display = "block";
}
function f229() {
  var v1395 = document.getElementById("popup");
  var v1396 = document.getElementById("overlay");
  v1395.style.display = "none";
  v1396.style.display = "none";
}
function f230() {
  $(".mx").on("click", function () {
    $(".servers-mexico").fadeIn(500);
    $("#addflag").attr("class", "flag mx");
    $(".ui-tab-inactive1").attr("class", "ui-tab-active ui-tab-inactive1");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-peru").fadeOut(100);
    $(".servers-eeuu").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".br").on("click", function () {
    $(".servers-mexico").fadeOut(100);
    $(".servers-eeuu").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
    $(".ui-tab-inactive0").attr("class", "ui-tab-active ui-tab-inactive0");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive7").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-peru").fadeIn(500);
    $("#addflag").attr("class", "flag br");
  });
  $(".us").on("click", function () {
    $(".servers-eeuu").fadeIn(500);
    $("#addflag").attr("class", "flag us");
    $(".ui-tab-inactive2").attr("class", "ui-tab-active ui-tab-inactive2");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive7").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".ca").on("click", function () {
    $(".servers-canada").fadeIn(500);
    $("#addflag").attr("class", "flag ca");
    $(".ui-tab-inactive3").attr("class", "ui-tab-active ui-tab-inactive3");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive7").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-eeuu").fadeOut(100);
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(500);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".de").on("click", function () {
    $(".servers-germania").fadeIn(500);
    $("#addflag").attr("class", "flag de");
    $(".ui-tab-inactive4").attr("class", "ui-tab-active ui-tab-inactive4");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive7").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-eeuu").fadeOut(100);
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(500);
    $(".servers-canada").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".fr").on("click", function () {
    $(".servers-francia").fadeIn(500);
    $("#addflag").attr("class", "flag fr");
    $(".ui-tab-inactive5").attr("class", "ui-tab-active ui-tab-inactive5");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive7").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-eeuu").fadeOut(100);
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".sg").on("click", function () {
    $(".servers-singapur").fadeIn(500);
    $("#addflag").attr("class", "flag sg");
    $(".ui-tab-inactive6").attr("class", "ui-tab-active ui-tab-inactive6");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive7").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-eeuu").fadeOut(100);
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".jp").on("click", function () {
    $(".servers-japon").fadeIn(500);
    $("#addflag").attr("class", "flag jp");
    $(".ui-tab-inactive7").attr("class", "ui-tab-active ui-tab-inactive7");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-eeuu").fadeOut(100);
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-australia").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".au").on("click", function () {
    $(".servers-australia").fadeIn(500);
    $("#addflag").attr("class", "flag au");
    $(".ui-tab-inactive8").attr("class", "ui-tab-active ui-tab-inactive8");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive7").removeClass("ui-tab-active");
    $(".ui-tab-inactive9").removeClass("ui-tab-active");
    $(".servers-eeuu").fadeOut(100);
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-granbretana").fadeOut(100);
  });
  $(".gb").on("click", function () {
    $(".servers-granbretana").fadeIn(500);
    $("#addflag").attr("class", "flag gb");
    $(".ui-tab-inactive9").attr("class", "ui-tab-active ui-tab-inactive9");
    $(".ui-tab-inactive0").removeClass("ui-tab-active");
    $(".ui-tab-inactive1").removeClass("ui-tab-active");
    $(".ui-tab-inactive2").removeClass("ui-tab-active");
    $(".ui-tab-inactive3").removeClass("ui-tab-active");
    $(".ui-tab-inactive4").removeClass("ui-tab-active");
    $(".ui-tab-inactive5").removeClass("ui-tab-active");
    $(".ui-tab-inactive6").removeClass("ui-tab-active");
    $(".ui-tab-inactive8").removeClass("ui-tab-active");
    $(".servers-eeuu").fadeOut(100);
    $(".servers-mexico").fadeOut(100);
    $(".servers-peru").fadeOut(100);
    $(".servers-canada").fadeOut(100);
    $(".servers-germania").fadeOut(100);
    $(".servers-francia").fadeOut(100);
    $(".servers-singapur").fadeOut(100);
    $(".servers-japon").fadeOut(100);
    $(".servers-australia").fadeOut(100);
  });
}
function f231(p1325) {
  var vLS5 = "";
  if (p1325.keyCode === 9) {
    vLS5 += "TAB";
  } else if (p1325.keyCode === 13) {
    vLS5 += "ENTER";
  } else if (p1325.keyCode === 16) {
    vLS5 += "SHIFT";
  } else {
    vLS5 += String.fromCharCode(p1325.keyCode);
  }
  return vLS5;
}
getStringKey = function (p1326) {
  var vLS6 = "";
  if (p1326 == 9) {
    vLS6 += "TAB";
  } else if (p1326 == 13) {
    vLS6 += "ENTER";
  } else if (p1326 == 16) {
    vLS6 += "SHIFT";
  } else if (p1326 == 32) {
    vLS6 += "SPACE";
  } else if (p1326 == 27) {
    vLS6 += "ESC";
  } else {
    vLS6 += String.fromCharCode(p1326);
  }
  return vLS6;
};
const vF181 = function (p1327) {
  const v1397 = p1327.key;
  return v1397 >= "0" && v1397 <= "9" || v1397 >= "A" && v1397 <= "Z" || v1397 === "Tab" || v1397 === "Enter" || v1397 === "Shift" || v1397 === " " || v1397 === "Escape";
};
eval(function (p1328, p1329, p1330, p1331, p1332, p1333) {
  p1332 = function (p1334) {
    return (p1334 < p1329 ? "" : p1332(parseInt(p1334 / p1329))) + ((p1334 = p1334 % p1329) > 35 ? String.fromCharCode(p1334 + 29) : p1334.toString(36));
  };
  if (!"".replace(/^/, String)) {
    while (p1330--) {
      p1333[p1332(p1330)] = p1331[p1330] || p1332(p1330);
    }
    p1331 = [function (p1335) {
      return p1333[p1335];
    }];
    p1332 = function () {
      return "\\w+";
    };
    p1330 = 1;
  }
  while (p1330--) {
    if (p1331[p1330]) {
      p1328 = p1328.replace(new RegExp("\\b" + p1332(p1330) + "\\b", "g"), p1331[p1330]);
    }
  }
  return p1328;
});
function f232(p1336) {
  if (p1336.key === "z") {
    window.w = 0.625;
    window.render();
  }
}
window.addEventListener("wheel", f232);
document.addEventListener("DOMContentLoaded", () => {
  let vO21 = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    radius: 7
  };
  let v1398 = vO21.x;
  let v1399 = vO21.y;
  let vLN098 = 0;
  function f233() {
    let v1400 = Date.now();
    fetch(window.location.href).then(() => {
      let v1401 = Date.now();
      vLN098 = v1401 - v1400;
      if (vLN098 > 149) {
        v1402.style.color = "red";
      } else if (vLN098 > 99) {
        v1402.style.color = "yellow";
      } else {
        v1402.style.color = "green";
      }
    }).catch(() => {
      vLN098 = "Error";
      v1402.style.color = "red";
    });
  }
  let v1402 = document.createElement("div");
  v1402.style.position = "fixed";
  v1402.style.right = "5px";
  v1402.style.bottom = "5px";
  v1402.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  v1402.style.color = "white";
  v1402.style.padding = "2px 5px";
  v1402.style.fontSize = "12px";
  v1402.style.borderRadius = "3px";
  v1402.style.fontWeight = "bold";
  v1402.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
  document.body.appendChild(v1402);
  document.addEventListener("mousemove", p1337 => {
    v1398 = p1337.clientX;
    v1399 = p1337.clientY;
  });
  function f234() {
    let v1403 = v1398 - vO21.x;
    let v1404 = v1399 - vO21.y;
    let v1405 = Math.sqrt(v1403 * v1403 + v1404 * v1404);
    if (v1405 > vO21.radius) {
      vO21.x += v1403 / v1405 * vO21.radius;
      vO21.y += v1404 / v1405 * vO21.radius;
    } else {
      vO21.x = v1398;
      vO21.y = v1399;
    }
    let v1406 = document.getElementById("solucan");
    if (v1406) {
      v1406.style.left = vO21.x + "px";
      v1406.style.top = vO21.y + "px";
    }
    v1402.textContent = "Ping: " + vLN098 + "ms";
    requestAnimationFrame(f234);
  }
  f234();
  setInterval(f233, 1000);
});
document.addEventListener("keydown", p1338 => {
  if (p1338.key === "F12") {
    p1338.preventDefault();
  }
}, false);
document.addEventListener("contextmenu", p1339 => {
  p1339.preventDefault();
}, false);
window.addEventListener("keydown", p1340 => {
  const v1407 = p1340.key.toLowerCase();
  if (v1407 === "z" || v1407 === "ئ") {
    window.multiplier = 0.625;
    if (typeof window.changedNf === "function") {
      window.changedNf();
    } else {
      console.warn("Function 'changedNf' is not defined.");
    }
  }
});
var v1408 = new Date().getTime();
var v1409 = "https://platenxo.github.io/extension/css/index.css?v=" + v1408;
function f235() {
  var v1410 = document.createElement("link");
  v1410.rel = "stylesheet";
  v1410.href = v1409;
  document.head.appendChild(v1410);
}
this.injectCSS = f235;
this.injectCSS();
console.log("CSS injected!");

// FPS gösterge kutusunu oluştur
const v1411 = document.createElement("div");
v1411.style.position = "fixed";
v1411.style.right = "5px";
v1411.style.bottom = "25px";
v1411.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
v1411.style.color = "white";
v1411.style.padding = "2px 5px";
v1411.style.fontSize = "12px";
v1411.style.borderRadius = "3px";
v1411.style.fontWeight = "bold";
v1411.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
v1411.textContent = "FPS: 0";
document.body.appendChild(v1411);

// FPS hesaplama değişkenleri
let v1412 = performance.now();
let vLN099 = 0;
let vLN0100 = 0;

// FPS hesaplama fonksiyonu
function f236() {
  const v1413 = performance.now();
  vLN099++;
  if (v1413 - v1412 >= 1000) {
    vLN0100 = vLN099;
    vLN099 = 0;
    v1412 = v1413;
    v1411.textContent = "FPS: " + vLN0100;
  }
  requestAnimationFrame(f236);
}
f236();

// --- Keep-alive: simulate circular mouse movement (auto start) ---

let v1414 = Math.floor(window.innerWidth / 2);
let v1415 = Math.floor(window.innerHeight / 2);
document.addEventListener("mousemove", p1341 => {
  v1414 = p1341.clientX;
  v1415 = p1341.clientY;
});

const vO22 = {
  enabled: false,
  angle: 0,
  radius: 5,
  intervalMs: 300,
  anchorX: 0,
  anchorY: 0,
  timerId: null
};

function f237() {
  if (!vO22.enabled) return;
  vO22.angle = (vO22.angle + 10) % 360;
  const v1416 = vO22.angle * (Math.PI / 180);
  const v1417 = vO22.anchorX + vO22.radius * Math.cos(v1416);
  const v1418 = vO22.anchorY + vO22.radius * Math.sin(v1416);
  const v1419 = document.elementFromPoint(Math.round(v1417), Math.round(v1418)) || document.body;
  const v1420 = new MouseEvent("mousemove", {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: v1417,
    clientY: v1418
  });
  v1419.dispatchEvent(v1420);
}

function f238(p1342) {
  if (p1342) {
    vO22.enabled = true;
    vO22.angle = 0;
    vO22.anchorX = v1414;
    vO22.anchorY = v1415;
    if (!vO22.timerId) {
      vO22.timerId = setInterval(f237, vO22.intervalMs);
    }
  } else {
    vO22.enabled = false;
    if (vO22.timerId) {
      clearInterval(vO22.timerId);
      vO22.timerId = null;
    }
  }
}

window.addEventListener("keydown", p1343 => {
  if (p1343.key === "F8") {
    p1343.preventDefault();
    f238(!vO22.enabled);
    console.log(vO22.enabled ? "✅ Keep-alive ON" : "⛔ Keep-alive OFF");
  }
});

// 🚀 Sayfa açılır açılmaz otomatik başlat:
window.addEventListener("load", () => {
  f238(true);
  console.log("✅ Keep-alive otomatik olarak başlatıldı");
});
// Optional: expose minimal API
window.KeepAliveCircle = {
  on: () => f238(true),
  off: () => f238(false),
  setRadius: p1344 => {
    vO22.radius = Math.max(0, Number(p1344) || 0);
  },
  setIntervalMs: p1345 => {
    vO22.intervalMs = Math.max(16, Number(p1345) || 16);
    if (vO22.timerId) {
      clearInterval(vO22.timerId);
      vO22.timerId = setInterval(f237, vO22.intervalMs);
    }
  }
};
