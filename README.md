# Study Hub & Daily Dashboard

لوحة تحكم للمذاكرة والمهام اليومية (دروس، مهام، مؤقت تركيز، وضع داكن/فاتح).

## هيكل المشروع

```
study-dashboard/
├── index.html              # هيكل الصفحة (HTML)
├── css/
│   └── style.css           # التنسيقات المخصصة
├── js/
│   └── script.js           # كل الجافاسكريبت (إعدادات Tailwind + منطق التطبيق)
└── README.md
```

## التشغيل

افتح `index.html` في المتصفح مباشرة، أو شغّل سيرفر محلي:

```bash
python -m http.server 8000
```

## النشر على GitHub Pages

Settings ← Pages ← Branch: `main` ← Folder: `/ (root)` ← Save

## ملاحظات

- البيانات بتتخزن في `localStorage` على جهاز المستخدم.
- الاعتماديات (Tailwind و Lucide) بتتحمل من CDN فمحتاج إنترنت.
