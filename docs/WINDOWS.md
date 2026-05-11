<div dir="rtl">

# تشغيل دائم على Windows 10 — Faisal Discord Suite

هذا الدليل يخلّي البوت + الـ companion يشتغلون كـ **Windows Services** يبدون تلقائياً مع نظام التشغيل ويعيدون التشغيل تلقائياً لو وقفوا.

نستخدم **NSSM** (Non-Sucking Service Manager) — أداة مجانية مشهورة لتحويل أي ملف `.exe` إلى Windows Service.

---

## 1) ثبّت NSSM

```powershell
winget install -e --id NSSM.NSSM
```

أو يدوياً من: https://nssm.cc/download (فك الضغط في `C:\nssm`).

تأكد:
```powershell
nssm version
```

## 2) جهّز Build إنتاجي للبوت

```powershell
cd $HOME\faisal-discord-suite
npm install
npm run -w bot build
```

ستجد المخرجات في `bot\dist\`.

## 3) ركّب البوت كـ Service

شغّل PowerShell كـ **Administrator** ثم:

```powershell
$projectPath = "$HOME\faisal-discord-suite"
$nodePath = (Get-Command node).Source

nssm install FaisalBot "$nodePath" "$projectPath\bot\dist\index.js"
nssm set FaisalBot AppDirectory "$projectPath\bot"
nssm set FaisalBot AppEnvironmentExtra "NODE_ENV=production"
nssm set FaisalBot Start SERVICE_AUTO_START
nssm set FaisalBot AppStdout "$projectPath\bot\logs\out.log"
nssm set FaisalBot AppStderr "$projectPath\bot\logs\err.log"
nssm set FaisalBot AppRotateFiles 1
nssm set FaisalBot AppRotateBytes 10485760

New-Item -Type Directory -Force "$projectPath\bot\logs" | Out-Null

nssm start FaisalBot
```

تأكد إنه شغّال:
```powershell
nssm status FaisalBot     # SERVICE_RUNNING
Get-Content -Wait "$projectPath\bot\logs\out.log"
```

### أوامر إدارة الـ service
```powershell
nssm stop    FaisalBot
nssm start   FaisalBot
nssm restart FaisalBot
nssm remove  FaisalBot confirm   # لحذف الخدمة
```

أو من Services الرسمية: `services.msc` → ابحث "FaisalBot".

## 4) (اختياري) ركّب الـ Companion كـ Service

⚠️ **مهم:** الـ companion يفتح متصفح ويحتاج **Desktop session** عشان سكرين شير يشتغل. لا تخلّيه يشتغل تحت LocalSystem — لازم يكون تحت حسابك أنت.

```powershell
$projectPath = "$HOME\faisal-discord-suite"
$nodePath = (Get-Command node).Source

# ابني companion أولاً
cd $projectPath
npm run -w companion build

nssm install FaisalCompanion "$nodePath" "$projectPath\companion\dist\index.js"
nssm set FaisalCompanion AppDirectory "$projectPath\companion"
nssm set FaisalCompanion AppEnvironmentExtra "NODE_ENV=production"
nssm set FaisalCompanion Start SERVICE_AUTO_START
nssm set FaisalCompanion AppStdout "$projectPath\companion\logs\out.log"
nssm set FaisalCompanion AppStderr "$projectPath\companion\logs\err.log"

# مهم: شغّله تحت حسابك (مو LocalSystem) عشان يقدر يفتح متصفح
# استبدل DOMAIN\YourUser بـ اسم المستخدم الخاص بك
nssm set FaisalCompanion ObjectName ".\$env:USERNAME" "كلمة-سرك-هنا"

New-Item -Type Directory -Force "$projectPath\companion\logs" | Out-Null
nssm start FaisalCompanion
```

> **بدائل أبسط من الـ Service:** استخدم **Task Scheduler** (Start → Task Scheduler → Create Task → Triggers: At log on → Actions: Start `node` with arguments `dist\index.js`). أسهل لو تستخدم الجهاز يدوياً.

## 5) إعادة التشغيل التلقائي عند الفشل

NSSM يعيد التشغيل تلقائياً عند الفشل. للتخصيص:

```powershell
nssm set FaisalBot AppExit Default Restart
nssm set FaisalBot AppRestartDelay 5000      # 5 ثواني قبل إعادة التشغيل
nssm set FaisalBot AppThrottle 1500          # حد أدنى بين المحاولات
```

## 6) Firewall (لو الـ companion على جهاز ثاني)

افتح المنفذ 8788 للـ companion على جهاز Windows:

```powershell
New-NetFirewallRule -DisplayName "Faisal Companion WS" `
  -Direction Inbound -Protocol TCP -LocalPort 8788 -Action Allow
```

## 7) تحديث الكود

```powershell
cd $HOME\faisal-discord-suite
nssm stop FaisalBot
git pull
npm install
npm run -w bot build
nssm start FaisalBot
```

## 8) مشاكل شائعة

### الخدمة تبدأ ثم تتوقف فوراً
- شوف `bot\logs\err.log`. غالباً متغيرات بيئة ناقصة في `.env`.

### "ENOENT spawn node"
- مسار `node` غلط. أعد:
```powershell
nssm set FaisalBot Application (Get-Command node).Source
```

### Companion ما يفتح Chrome
- لازم يكون شغّال تحت حسابك (مو LocalSystem). راجع `nssm set FaisalCompanion ObjectName`.
- شيك إنك مسجّل دخول في الـ desktop session (الـ companion ما يقدر يرسم على شاشة فاضية).

### نسي كلمة سر الـ service
```powershell
nssm edit FaisalCompanion     # واجهة رسومية لتعديل كل الإعدادات
```

</div>
