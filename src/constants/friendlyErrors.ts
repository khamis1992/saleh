import { toast } from 'sonner';

const FRIENDLY_ERRORS: Record<string, string> = {
  // Generic
  'permission_denied': 'ليس لديك صلاحية تنفيذ هذا الإجراء. تواصل مع مدير النظام إذا كنت تحتاج هذه الصلاحية.',
  'not_found': 'السجل غير موجود. ربما تم حذفه أو نقله.',
  'validation_failed': 'يرجى التأكد من إدخال جميع البيانات المطلوبة بشكل صحيح.',
  'network_error': 'حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
  'server_error': 'حدث خطأ في النظام. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.',
  'unauthorized': 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  'duplicate': 'هذا السجل موجود مسبقاً. لا يمكن تكراره.',
  'required_field': 'هذا الحقل مطلوب. يرجى إدخال القيمة المناسبة.',
  'invalid_format': 'صيغة البيانات غير صحيحة. يرجى التحقق وإعادة المحاولة.',

  // Specific
  'cannot_delete_property_has_units': 'لا يمكن حذف هذا العقار لأنه مرتبط بـ {count} وحدات. انقل الوحدات إلى عقار آخر أولاً أو احذفها.',
  'cannot_delete_tenant_has_leases': 'لا يمكن حذف هذا المستأجر لأنه مرتبط بعقود إيجار. أنهِ العقود أولاً.',
  'cannot_delete_unit_has_lease': 'لا يمكن حذف هذه الوحدة لأنها مرتبطة بعقد إيجار نشط.',
  'cannot_activate_contract_missing_docs': 'لا يمكن تفعيل العقد لأن المستندات المطلوبة غير مكتملة. ارفع العقد الموقع أولاً.',
  'cannot_terminate_active_lease': 'لا يمكن إنهاء عقد نشط مباشرة. استخدم إجراء "إنهاء العقد" من صفحة العقد.',
  'cannot_post_paid_invoice': 'هذه الفاتورة مدفوعة بالفعل. لا يمكن تسجيل دفعة إضافية.',
  'cannot_approve_own_request': 'لا يمكنك اعتماد طلب قمت بإنشائه أنت. يجب أن يعتمده شخص آخر.',
  'cannot_close_unassigned_maintenance': 'لا يمكن إغلاق طلب صيانة لم يتم تعيين فني له بعد. عيّن فني أولاً.',
  'payment_exceeds_balance': 'المبلغ المدفوع أكبر من المبلغ المستحق. المبلغ المستحق هو {balance} ر.ق.',
  'date_must_be_future': 'التاريخ يجب أن يكون في المستقبل.',
  'end_date_before_start': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية.',
  'unit_not_available': 'الوحدة المختارة غير متاحة حالياً. اختر وحدة متاحة.',
  'email_already_exists': 'البريد الإلكتروني مستخدم من قبل. استخدم بريداً آخر.',
  'phone_already_exists': 'رقم الجوال مستخدم من قبل. استخدم رقماً آخر.',
  'national_id_already_exists': 'رقم الهوية مستخدم من قبل.',

  // Fallback
  'default': 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.',
};

export function friendlyError(key: string, params?: Record<string, string | number>): string {
  let message = FRIENDLY_ERRORS[key] || FRIENDLY_ERRORS['default'];

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      message = message.replace(`{${k}}`, String(v));
    }
  }

  return message;
}

export function showFriendlyError(key: string, params?: Record<string, string | number>) {
  toast.error(friendlyError(key, params));
}

export function showFriendlySuccess(message: string) {
  toast.success(message);
}

export function showFriendlyWarning(message: string) {
  toast(message, {
    description: message.length > 50 ? undefined : '',
    style: { background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E' },
  });
}
