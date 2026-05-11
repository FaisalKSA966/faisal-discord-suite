<div dir="rtl">

# دليل الإعداد الكامل — Faisal Discord Suite

هذا الدليل يشرح من الصفر كيف تشغّل البوت على سيرفرك الديسكورد، خطوة خطوة.

## 1) إنشاء تطبيق البوت في Discord Developer Portal

1. افتح https://discord.com/developers/applications واضغط **New Application**.
2. اختر اسم (مثلاً "Faisal Suite") واضغط Create.
3. روح لتبويب **Bot** على اليسار:
   - **Privileged Gateway Intents** — فعّل الثلاث:
     - `Presence Intent`
     - `Server Members Intent`
     - `Message Content Intent`
   - اضغط **Reset Token** ثم انسخ التوكن — احفظه بمكان آمن، راح نحتاجه.
4. روح لتبويب **General Information** وانسخ:
   - `Application ID` → سيكون `DISCORD_APP_ID` في الـ .env

## 2) دعوة البوت لسيرفرك

1. روح لتبويب **OAuth2 → URL Generator**.
2. اختر الـ Scopes التالية: `bot`, `applications.commands`.
3. اختر الـ Permissions التالية للبوت:
   - **General:** View Channels, Manage Channels (لتبديل الـ Region), Manage Threads, Send Messages, Send Messages in Threads, Create Private Threads, Embed Links, Attach Files, Read Message History
   - **Voice:** Connect, Speak, Use Voice Activity, Priority Speaker (اختياري)
   - **Manage Server Expressions** (للساوندبورد)
4. انسخ الرابط أسفل الصفحة، افتحه، واختر سيرفرك وادعُ البوت.

> **نصيحة:** أعطِ البوت رول مرتب فوق غالبية الرولات حتى يقدر يتحرك ويفعل صلاحياته بدون مشاكل.

## 3) تجهيز جهازك / السيرفر

البوت يحتاج Node.js 20+ و FFmpeg (مشمول كـ `ffmpeg-static`).

### على Linux (Ubuntu/Debian)
```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 pkg-config

# مكتبات صوت
sudo apt-get install -y libsodium-dev

# خطوط عربية (مهم للـ Canvas/Visualizer)
sudo apt-get install -y fonts-noto-core fonts-dejavu
```

### على Windows
- ثبّت Node.js 20+ من https://nodejs.org
- ثبّت Git Bash أو WSL2
- ثبّت Visual Studio Build Tools (لمكتبات native)

### على macOS
```bash
brew install node@20 pkg-config
```

## 4) نسخ المشروع وتثبيت الاعتمادات

```bash
git clone https://github.com/FaisalKSA966/faisal-discord-suite
cd faisal-discord-suite
npm install
```

## 5) ضبط متغيرات البيئة

```bash
cp bot/.env.example bot/.env
```

افتح `bot/.env` بمحرر نصوص وعبّ:

| المتغير | ماذا تكتب |
|---|---|
| `DISCORD_TOKEN` | التوكن من خطوة 1 |
| `DISCORD_APP_ID` | الـ Application ID |
| `DEFAULT_GUILD_ID` | معرّف سيرفرك (Developer Mode → كليك يمين على السيرفر → Copy ID). اتركها فاضي للأوامر العامة (تأخذ ساعة). |
| `OWNER_ID` | معرّف حسابك (لتفعيل /vip) |
| `LOG_LEVEL` | `info` افتراضي، استخدم `debug` للتطوير |

## 6) تشغيل البوت

```bash
# تطوير
npm run bot

# إنتاج (build + start)
npm run bot:build
npm run bot:start
```

أول مرة، الأوامر تنتشر تلقائياً للسيرفر المحدد في `DEFAULT_GUILD_ID`. لو ما ظهرت:
```bash
npm run bot:deploy-commands
```

## 7) إعداد السيرفر من داخل ديسكورد

افتح ديسكورد، اكتب في أي قناة `/setup` — راح تطلع لوحة كاملة:

1. **قناة لوحة التسجيل** → اختر قناة نصية يصير فيها الـ Private Threads للفيديوهات.
2. **روم التثبيت 24/7** → اختر الروم الصوتي اللي البوت يثبت فيه (مثلاً 1450924794164936744).
3. **Region الافتراضي** → اختر `automatic` أو حدد منطقة معينة.
4. **المدة الافتراضية للـ Clip** → 5 / 10 / 30 دقيقة.
5. **Auto-Pin** → مفعّل = البوت يعيد الاتصال تلقائياً لو طلع.
6. **Auto-Region** → مفعّل = البوت يبدّل الـ Region تلقائياً لما يحس فيه مشاكل.

## 8) استخدام البوت

| الأمر | الوظيفة |
|---|---|
| `/record panel` | ينشر لوحة التحكم في القناة الحالية (يفضل تنشرها في القناة المحددة من /setup) |
| `/record start` | يبدأ التسجيل في الروم اللي أنت فيه أو روم التثبيت |
| `/record stop` | يوقف ويرسل الفيديو في ثريد |
| `/clip [minutes]` | يحفظ آخر X دقيقة كـ Clip |
| `/xo [rounds]` | يفتح لوبي XO |
| `/points` | يعرض نقاطك |
| `/points leaderboard:true` | المتصدّرون |
| `/soundboard record user:@x` | يسجّل صوت شخص (≤5ث) |
| `/soundboard stop` | يوقف ويعرض المعاينة |
| `/vip avatar change` | يغيّر صورة البوت (للمالك فقط) |
| `/vip name change value:Name` | يغيّر اسم البوت |
| `/vip banner change` | يغيّر بنر البوت |
| `/help` | كل الأوامر |

## 9) تشغيل دائم (Systemd) — Linux

أنشئ `/etc/systemd/system/faisal-bot.service`:

```ini
[Unit]
Description=Faisal Discord Suite Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/faisal-discord-suite
ExecStart=/usr/bin/npm run bot:start --silent
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

ثم:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now faisal-bot
sudo journalctl -fu faisal-bot
```

## 10) مشاكل شائعة

### "Missing Access" لما يحاول البوت يثبت في الروم
- تأكد إن للبوت صلاحية `Connect` و `View Channel` على ذلك الروم.
- لو الروم محدود برولات معينة، أضف رول البوت لقائمة المسموحين.

### الـ Region ما يتبدل تلقائياً
- تأكد من صلاحية `Manage Channels` للبوت.
- جرّب اللوحة `/setup` → `Auto-Region: مفعّل`.

### الفيديو حجمه كبير وما يرفع
- البوت يحفظ المسار في الثريد. تقدر تنزله من السيرفر، أو ترفعه على Catbox/Drive وترسل الرابط.
- بدّل `RENDER_QUALITY` لـ `low` في `.env` لتوفير المساحة.

### Soundboard ما ينضاف
- تأكد من صلاحية `Manage Guild Expressions`.
- السيرفر له حد ساوندبوردات بحسب مستوى البوست (عادي = 8، Lvl1 = 24، Lvl2 = 36، Lvl3 = 48). تأكد ما وصلت الحد.

### "Privileged Intents not enabled"
- روح لتبويب Bot في Developer Portal وفعّل الـ 3 Intents.

</div>
