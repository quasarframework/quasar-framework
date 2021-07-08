const days = 'الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت'.split('_')
const monthsShort = 'محرم_صفر_ربيع ١_ربيع ٢_جمادى ١_جمادى ٢_رجب_شعبان_رمضان_شوال_ذو القعدة_ذو الحجة'.split('_')

export default {
  isoName: 'ar',
  nativeName: 'العربية',
  rtl: true,
  label: {
    clear: 'مسح',
    ok: 'حسناً',
    cancel: 'إلغاء',
    close: 'إغلاق',
    set: 'ضبط',
    select: 'تحديد',
    reset: 'إعادة ضبط',
    remove: 'حذف',
    update: 'تحديث',
    create: 'إنشاء',
    search: 'بحث',
    filter: 'تنقية',
    refresh: 'تحديث'
  },
  date: {
    days: days,
    daysShort: 'أحد_إثن_ثلا_أرب_خمي_جمع_سبت'.split('_'),
    months: 'محرم_صفر_ربيع الأول_ربيع الثاني_جمادى الأولى_جمادى الآخرة_رجب_شعبان_رمضان_شوال_ذو القعدة_ذو الحجة'.split('_'),
    monthsShort: monthsShort,
    headerTitle: (date, model) => `${ days[ date.getDay() ] }، ${ model.day } ${ monthsShort[ model.month - 1 ] }`,
    firstDayOfWeek: 6, // 0-6, 0 - Sunday, 1 Monday, ...
    format24h: false,
    pluralDay: 'أيام'
  },
  table: {
    noData: 'لا توجد بيانات',
    noResults: 'لا توجد نتائج',
    loading: 'جارٍ التحميل...',
    selectedRecords: rows => (
      rows === 0
        ? 'لا توجد مُدخَلات محدّدة.'
        : rows === 1
          ? 'مُدخَلة واحدة محدّدة.'
          : rows === 2
            ? 'مُدخَلتان محدّدتان.'
            : 'عدد المُدخَلات المحدّدة ' + rows + '.'
    ),
    recordsPerPage: 'عدد المُدخَلات في كل صفحة:',
    allRows: 'الكل',
    pagination: (start, end, total) => start + '-' + end + ' من ' + total,
    columns: 'أعمدة'
  },
  editor: {
    url: 'رابط',
    bold: 'عريض',
    italic: 'مائل',
    strikethrough: 'مشطوب',
    underline: 'مسطّر',
    unorderedList: 'قائمة غير مرتبة',
    orderedList: 'قائمة مرتبة',
    subscript: 'منخفض',
    superscript: 'مرتفع',
    hyperlink: 'رابط',
    toggleFullscreen: 'تفعيل أو إيقاف العرض في كامل الشاشة',
    quote: 'اقتباس',
    left: 'انتظام لجهة اليسار',
    center: 'توسيط',
    right: 'انتظام لجهة اليمين',
    justify: 'انتظام بالتساوي',
    print: 'طباعة',
    outdent: 'تقليل مسافة البداية',
    indent: 'زيادة مسافة البداية',
    removeFormat: 'إزالة التنسيق',
    formatting: 'تنسيق',
    fontSize: 'حجم الخط',
    align: 'انتظام',
    hr: 'إضافة خط أفقي',
    undo: 'تراجع',
    redo: 'إعادة',
    heading1: 'عنوان 1',
    heading2: 'عنوان 2',
    heading3: 'عنوان 3',
    heading4: 'عنوان 4',
    heading5: 'عنوان 5',
    heading6: 'عنوان 6',
    paragraph: 'فقرة',
    code: 'تعليمات برمجية',
    size1: 'صغير جداً',
    size2: 'صغير',
    size3: 'عادي',
    size4: 'فوق المتوسط',
    size5: 'كبير',
    size6: 'كبير جداً',
    size7: 'الأقصى',
    defaultFont: 'الخط الإفتراضي',
    viewSource: 'عرض المصدر'
  },
  tree: {
    noNodes: 'لا توجد عُقَد',
    noResults: 'لا توجد نتائج'
  }
}
