<div dir="rtl">

# Companion App — تصوير الشاشة الفعلي

> ⚠️ **تحذير صريح:** هذا التطبيق يستخدم حساب ديسكورد عادي (User Account) عبر Playwright، وهو ضد شروط استخدام ديسكورد. الحساب راح يتحظر في النهاية (أسابيع أو أشهر). استخدم **حساب احتياطي مخصص فقط لهذا الغرض**.

## متى تحتاج هذا التطبيق؟

لو الـ visualizer من البوت الرسمي ما يكفيك وتبي تصور:
- محتوى الشاشة الفعلي لما أحد يشير
- محتوى الكاميرا
- التفاعلات البصرية الكاملة

## المتطلبات

- VPS Linux (Ubuntu 22.04 موصى به)
- 2 CPU، 4GB RAM على الأقل
- Xvfb (شاشة افتراضية)
- PulseAudio
- FFmpeg
- Playwright Chromium

## التثبيت

### 1) ثبّت الاعتمادات

```bash
sudo apt-get update
sudo apt-get install -y \
  xvfb pulseaudio dbus-x11 \
  ffmpeg \
  fonts-noto-core fonts-noto-color-emoji fonts-dejavu \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libxss1 \
  libasound2 libxshmfence1 libgbm1 libgtk-3-0
```

### 2) ثبّت Chromium المتوافق مع Playwright

```bash
cd faisal-discord-suite
npx playwright install chromium
```

### 3) تجهيز Xvfb و PulseAudio

```bash
# ابدأ Xvfb على display 99
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

# ابدأ PulseAudio (إذا ما كان شغّال)
pulseaudio --start --exit-idle-time=-1 &
```

### 4) إعداد متغيرات البيئة

```bash
cp companion/.env.example companion/.env
```

عبّ:
- `DISCORD_USER_TOKEN` → التوكن من حساب الـ companion (راجع أدناه)
- `TARGET_GUILD_ID` → معرّف سيرفرك
- `TARGET_VOICE_CHANNEL_ID` → الروم الصوتي
- `BOT_AUTH_TOKEN` → نفس القيمة اللي تحطها في `bot/.env` → `COMPANION_AUTH_TOKEN`

### 5) استخراج توكن حساب مستخدم

⚠️ بحذر شديد. استخدم حساب احتياطي.

1. سجّل دخول للحساب الاحتياطي في ديسكورد ويب (https://discord.com).
2. افتح DevTools (F12) → تبويب Console.
3. ألصق هذا الكود:

```js
webpackChunkdiscord_app.push([[Math.random()],{},r=>{for(let e in r.c)try{for(let t in r.c[e].exports)if(r.c[e].exports[t]&&r.c[e].exports[t].getToken)return console.log(r.c[e].exports[t].getToken())}catch(e){}}])
```

4. التوكن راح يطلع في الـ Console. انسخه بدون علامات تنصيص.

### 6) تشغيل الـ Companion

```bash
cd faisal-discord-suite
npm run companion:build 2>/dev/null || npx tsc -p companion
node companion/dist/index.js
# أو للتطوير:
npm run -w companion dev
```

## كيف يتواصل مع البوت؟

- الـ Companion يفتح WebSocket على `LISTEN_PORT` (افتراضي 8788) ينتظر فيه أوامر من البوت.
- البوت لما يطلب "ابدأ تصوير الشاشة" يرسل `{type: "start", authToken, label}` ويبدأ الـ companion يصور.
- لما البوت يطلب "أوقف" يجمع الـ companion ملف MP4 ويرسل المسار.

> ملاحظة: في الإصدار الحالي، التكامل المباشر بين البوت والـ companion ما زال idle — يعني الـ companion يصور لما تطلب منه يدوياً عبر `wscat`. لتفعيل التكامل الكامل، عدّل `bot/src/modules/recorder/router.ts` ليرسل أمر `start`/`stop` للـ companion عند بدء/إيقاف التسجيل، وقم بدمج الفيديو الناتج من الـ companion مع الصوت من البوت في FFmpeg pass ثاني.

## تشغيل دائم على VPS (Systemd)

أنشئ `/etc/systemd/system/faisal-companion.service`:

```ini
[Unit]
Description=Faisal Companion (screen capture)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/faisal-discord-suite
Environment=DISPLAY=:99
Environment=NODE_ENV=production
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1280x720x24
ExecStartPre=/bin/sh -c "pulseaudio --start --exit-idle-time=-1"
ExecStart=/usr/bin/node companion/dist/index.js
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
```

## نصائح لتقليل خطر الحظر

- **لا تستخدم الحساب لشي ثاني** — لا تكتب رسائل، لا تتفاعل، لا تنضم لسيرفرات. خله "يدخل-يصور-يطلع" فقط.
- **افصله بعد كل جلسة** — لا تخليه شغّال 24/7. شغله لما تحتاج التسجيل فقط.
- **لا تستخدم VPN/Proxy غير ثابت** — التغيير المتكرر للـ IP يرفع علم.
- **انتظر دقايق قبل الانضمام** — لا تخلي السكربت ينضم فوراً للروم. أضف delay عشوائي.
- **توقع الحظر** — جهز حسابين احتياطيين على الأقل. لو راحت روح، بدّل التوكن في .env واستمر.

## حذف وإلغاء

```bash
sudo systemctl disable --now faisal-companion
rm -rf companion-profile out
```

</div>
