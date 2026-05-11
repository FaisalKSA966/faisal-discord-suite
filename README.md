<div dir="rtl">

# Faisal Discord Suite

سويت بوت ديسكورد متكاملة ببرمجة عربية واضحة، تجمع كل شي طلبته:

- **بوت رسمي (Bot)** يثبت في الروم 24/7، يبدّل الـ Voice Region تلقائياً لما يصير أحمر، يسجل الصوت بفيديو visualizer احترافي مع شات الروم وحالة الكاميرا/الشير، يدير ساوندبورد، XO بكانفاس Liquid Glass، أوامر VIP وإعدادات كاملة.
- **Companion App اختياري لـ Windows 10** يدير حساب User عادي (تغيير الاسم/الأفتار/الستاتس/الـ Bio + دخول روم + سكرين شير + كاميرا + تسجيل سطح المكتب). يحتاج حساب ديسكورد احتياطي — مخالف لـ ToS مع مخاطرة بان، اقرأ [docs/COMPANION.md](docs/COMPANION.md).

> 🪟 **النظام مجهّز لـ Windows 10 كأولوية** (PowerShell + NSSM + ffmpeg gdigrab/dshow). يدعم Linux/macOS أيضاً تلقائياً.

## مميزات سريعة

| النوع | المميزات |
|---|---|
| 🎙️ **التسجيل** | Rolling buffer 30 دقيقة بشكل افتراضي، تسجيل صوتي بـ visualizer (أفتار + اسم + يتكلم/كاميرا/شير/ميوت)، شات الروم في الفيديو، إرسال في Private Thread، تعديل بعد التسجيل (ميوت شخص، رفع/خفض صوت، قص). |
| 📌 **التثبيت 24/7** | البوت يبقى ثابت في الروم مهما صار، يعيد الاتصال تلقائياً، يحذرك لو طلع، Auto-Pin قابل للإيقاف. |
| 🔄 **Region** | يكتشف لما يصير الـ Region أحمر ويبدّله تلقائياً، أو تبدّله يدوياً من /setup. |
| 🎮 **XO** | لعبة XO بكانفاس بهوية فاتحة (Liquid Glass)، انضمام بأزرار، جولات متعددة (افتراضي 3)، نقاط محفوظة، Leaderboard. |
| 🔊 **Soundboard** | سجّل صوت شخص (≤5ث) بأمر، عاينه، أعطه اسم وإيموجي، يضاف للسيرفر مباشرة عبر Soundboard API. |
| 👑 **VIP** | تغيير صورة/اسم/بنر البوت بأوامر مخصصة. |
| 👤 **/account** | تحكم بحساب الـ companion: name, display-name, bio, avatar, banner, presence, custom-status. |
| 🎥 **/voice + /share + /camera** | دخول/خروج روم، كتم، سكرين شير، كاميرا — كلها من حساب الـ companion. |
| ⚙️ **/setup** | لوحة إعدادات Components v2 كاملة (Channel Select، String Select، Buttons، Modals). |
| 📹 **Companion (اختياري)** | Playwright + ffmpeg `gdigrab`/`dshow` لتسجيل سطح المكتب على Windows. |

## بدء سريع — Windows 10 (PowerShell)

```powershell
git clone https://github.com/FaisalKSA966/faisal-discord-suite
cd faisal-discord-suite

# 1) نسخ ملفات البيئة
Copy-Item bot\.env.example bot\.env
notepad bot\.env       # املأ DISCORD_TOKEN, DISCORD_APP_ID, DEFAULT_GUILD_ID, OWNER_ID

# 2) تثبيت الاعتمادات
npm install

# 3) تشغيل البوت
npm run bot           # dev
# أو:  npm run bot:build  ;  npm run bot:start  (إنتاج)
```

التفاصيل الكاملة مع الـ Intents و Permissions وكل خطوة: **[docs/SETUP.md](docs/SETUP.md)**.

للتشغيل الدائم كخدمة Windows: **[docs/WINDOWS.md](docs/WINDOWS.md)** (NSSM).

للـ companion (تحكم بحساب User + سكرين شير): **[docs/COMPANION.md](docs/COMPANION.md)**.

## بنية المشروع

```
faisal-discord-suite/
├── bot/                  → البوت الرسمي (Node.js + TypeScript + discord.js v14)
│   └── src/
│       ├── commands/     → السلاش كوماندز
│       ├── events/       → ready / interactionCreate / voiceStateUpdate / messageCreate
│       ├── modules/      → recorder / stayConnected / xo / soundboard / settings
│       ├── ui/           → embed + components builders
│       ├── db/           → better-sqlite3 + migrations
│       └── utils/        → logger / colors / locale / ids
├── companion/            → تطبيق التصوير الاختياري (Playwright + FFmpeg)
├── docs/                 → دلائل عربية بالخطوات
└── README.md
```

## اقتراحات لحالتك

من تجربتي مع طلبك، هذي الإضافات أكثر شي راح تستفيد منها:

1. **Speech-to-Text تلقائي** — استخدام Whisper.cpp مع الـ PCM المسجّل لإنتاج Transcript عربي مع كل ثريد. مفيد لو تبي تبحث في تسجيلاتك.
2. **Highlights/Auto-Clip** — البوت يكتشف لحظات الضحك العالية (peak في amplitude لـ ≥3 أشخاص في نفس الوقت) ويقصها تلقائياً.
3. **مهرجان النقاط** — لوحة شهرية لـ XO بصور كانفاس جميلة، تعطي دور (Role) للمتصدّر.
4. **Vault للساوندبورد** — مع نمو عدد الساوندبوردات، بطاقة canvas تعرض المكتبة كلها مع البحث.
5. **Companion على Docker** — جهز Dockerfile للـ companion مع Xvfb و PulseAudio (موجود مبدئياً في docs/COMPANION.md).

## القيود المعروفة

- بوتات ديسكورد الرسمية **ما تستقبل ستريم فيديو** من المستخدمين — لذلك الـ visualizer يصور الأيقونات والأسماء فقط. للتصوير الفعلي استخدم [Companion App](docs/COMPANION.md) (مع تحذير الـ ban).
- حد رفع الفيديو في ديسكورد 25MB افتراضياً، 50MB لـ Boost L2، 100MB لـ L3. الفيديوهات الأطول من 20 دقيقة بجودة medium قد تتجاوز الحد — البوت يحفظ المسار محلياً لتنزله يدوياً (80 قيقا = 100+ ساعة تسجيل).
- Soundboard API يحتاج صلاحية `Manage Guild Expressions` للبوت.
- الـ companion يستخدم حساب user عادي عبر متصفح آلي = **مخالف ToS**. الحساب يتحظر تلقائياً في مرحلة معينة (أسابيع-أشهر). استخدم حساب احتياطي مخصص.

## رخصة
MIT
</div>
