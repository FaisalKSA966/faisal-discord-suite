<div dir="rtl">

# دليل الإعداد الكامل — Faisal Discord Suite (Windows 10)

هذا الدليل يشرح من الصفر كيف تشغّل البوت + الـ companion على ويندوز 10، خطوة بخطوة. كل الأوامر بـ **PowerShell** (افتح Start → اكتب `powershell` → اضغط Enter).

> 📦 الـ workspace فيه قسمين:
> - **bot/** — البوت الرسمي (آمن، يشتغل دائماً).
> - **companion/** — تطبيق تحكم بحساب user عادي (لتغيير الاسم/الأفتار + تسجيل الشاشة الفعلي). اختياري.

---

## 1) إنشاء تطبيق البوت في Discord Developer Portal

1. افتح https://discord.com/developers/applications واضغط **New Application**.
2. اختر اسم (مثلاً "Faisal Suite") واضغط Create.
3. روح لتبويب **Bot** على اليسار:
   - **Privileged Gateway Intents** — فعّل الثلاث:
     - `Presence Intent`
     - `Server Members Intent`
     - `Message Content Intent`
   - اضغط **Reset Token** ثم انسخ التوكن — احفظه بمكان آمن.
4. روح لتبويب **General Information** وانسخ:
   - `Application ID` → سيكون `DISCORD_APP_ID` في الـ `.env`.

## 2) دعوة البوت لسيرفرك

1. روح لتبويب **OAuth2 → URL Generator**.
2. **Scopes:** `bot` و `applications.commands`.
3. **Bot Permissions:**
   - **General:** View Channels, Manage Channels (لتبديل الـ Region), Manage Threads, Send Messages, Send Messages in Threads, Create Private Threads, Embed Links, Attach Files, Read Message History.
   - **Voice:** Connect, Speak, Use Voice Activity, Priority Speaker (اختياري).
   - **Manage Server Expressions** (للساوندبورد).
4. انسخ الرابط، افتحه، واختر سيرفرك.

> أعطِ رتبة البوت ترتيب عالي عشان ما تجيك مشاكل صلاحيات.

## 3) تجهيز جهاز Windows 10

### ثبّت الأدوات الأساسية
شغّل PowerShell كـ **Administrator** ولصق الأوامر التالية واحد واحد:

```powershell
# (اختياري - الأسهل) ثبّت winget لو ما عندك
# يجي مع ويندوز 10/11 الحديث. لو ما اشتغل: https://aka.ms/getwinget

winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Git.Git
winget install -e --id Gyan.FFmpeg
winget install -e --id Microsoft.VisualStudio.2022.BuildTools --override "--wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

> **بدون winget:**
> - Node 20 LTS: https://nodejs.org/en/download
> - Git: https://git-scm.com/download/win
> - FFmpeg: https://www.gyan.dev/ffmpeg/builds/ (ffmpeg-release-essentials.zip) ثم فك الضغط في `C:\ffmpeg` وأضف `C:\ffmpeg\bin` إلى متغير البيئة PATH.
> - Visual Studio Build Tools (للـ `better-sqlite3` و `@napi-rs/canvas`): https://visualstudio.microsoft.com/visual-cpp-build-tools/

أعد تشغيل PowerShell بعد التثبيت، وتأكد:

```powershell
node --version    # v20.x
npm --version
git --version
ffmpeg -version
```

## 4) جلب المشروع

```powershell
cd $HOME
git clone https://github.com/FaisalKSA966/faisal-discord-suite.git
cd faisal-discord-suite
npm install
```

> أول `npm install` قد ياخذ 3-5 دقايق لأنه يبني `better-sqlite3` و `@napi-rs/canvas` محلياً.

## 5) ضبط متغيرات البيئة

```powershell
Copy-Item bot\.env.example bot\.env
notepad bot\.env
```

في `bot\.env` عبّ:

| المتغير | ماذا تكتب |
|---|---|
| `DISCORD_TOKEN` | التوكن من خطوة 1 |
| `DISCORD_APP_ID` | الـ Application ID |
| `DEFAULT_GUILD_ID` | معرّف سيرفرك (Developer Mode → كليك يمين على السيرفر → Copy ID) |
| `OWNER_ID` | معرّف حسابك (مهم — للأوامر VIP / account / share / camera) |
| `LOG_LEVEL` | `info` افتراضي |
| `COMPANION_WS_URL` | اتركها فاضي الآن — نعبّيها لاحقاً |
| `COMPANION_AUTH_TOKEN` | اتركها فاضي |

احفظ وأغلق Notepad.

## 6) تشغيل البوت

### تطوير (مع reload تلقائي)
```powershell
npm run bot
```

### إنتاج
```powershell
npm run bot:build
npm run bot:start
```

أول مرة، الأوامر تنتشر تلقائياً للسيرفر المحدد. لو ما طلعت:
```powershell
npm run bot:deploy-commands
```

## 7) إعداد السيرفر من داخل ديسكورد

افتح ديسكورد، اكتب في أي قناة `/setup`:

1. **قناة لوحة التسجيل** → قناة نصية تستضيف الـ private threads.
2. **روم التثبيت 24/7** → الروم الصوتي للتثبيت (مثلاً 1450924794164936744).
3. **Region الافتراضي** → `automatic` أو منطقة محددة.
4. **المدة الافتراضية للـ Clip** → 5/10/30 دقيقة.
5. **Auto-Pin** → مفعّل = يرجع تلقائياً لو فُصل.
6. **Auto-Region** → مفعّل = يبدّل الـ region لو حس بمشاكل.

## 8) الأوامر الرئيسية

| الأمر | الوظيفة |
|---|---|
| `/setup` | لوحة الإعدادات الكاملة |
| `/record panel` | ينشر لوحة تحكم بدء/إيقاف التسجيل |
| `/record start` / `/record stop` | تحكم سريع |
| `/clip [minutes]` | يحفظ آخر X دقيقة |
| `/xo [rounds]` | لعبة XO |
| `/points` / `/points leaderboard:true` | النقاط |
| `/soundboard record user:@x` / `/soundboard stop` | ساوندبورد |
| `/vip avatar / name / banner change` | تغيير صورة/اسم/بنر **البوت** (للمالك) |
| `/account ...` | تغيير اسم/أفتار/ستاتس **حساب الـ companion** (يحتاج التطبيق) |
| `/voice join|leave|mute` | تحكم بالـ companion في الروم |
| `/share start|stop|record-start|record-stop|status` | سكرين شير + تسجيل |
| `/camera on|off` | كاميرا الـ companion |
| `/help` | كل الأوامر |

## 9) تشغيل دائم على ويندوز (NSSM)

شوف [WINDOWS.md](./WINDOWS.md) لإعداد البوت كـ Windows Service يشتغل تلقائياً مع نظام التشغيل ويعيد التشغيل تلقائياً لو وقف.

## 10) (اختياري) تشغيل الـ Companion للتحكم بحساب User

لو تبي تتحكم بحساب user (تغيير الاسم/الأفتار/الستاتس + تسجيل سكرين شير فعلي)، اتبع [COMPANION.md](./COMPANION.md).

## 11) مشاكل شائعة

### `gyp ERR! find VS` عند `npm install`
- ما عندك Visual Studio Build Tools. ارجع لخطوة 3 وثبّتها (Workload: **Desktop development with C++**).
- بعد التثبيت: `npm config set msvs_version 2022` ثم أعد `npm install`.

### `Cannot find module 'better-sqlite3'`
- نفس السبب أعلاه. الـ native build فشل.

### `Missing Access` لما يحاول البوت يثبت في الروم
- أعطه `Connect` و `View Channel` على ذلك الروم تحديداً.

### الـ Region ما يتبدل تلقائياً
- يحتاج `Manage Channels`. + فعّل `Auto-Region` من `/setup`.

### الفيديو حجمه كبير وما يرفع
- الملف يظل محفوظ محلياً في `bot/data/recordings/`. تقدر تنزله، أو ترفعه على Catbox/Google Drive وترسل الرابط في الثريد.

### التسجيل ما يشتغل
- شوف `bot/logs/` أو الـ console. أكثر سبب شائع: ما فيه أحد يتكلم في الروم لما بدأت — البوت يبدأ يجمع الصوت فقط لما يحس صوت من أي شخص.

</div>
