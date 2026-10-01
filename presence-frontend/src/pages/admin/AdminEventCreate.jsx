import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import EventForm from '../../components/admin/EventForm';
import { eventsApi } from '../../lib/api';
import { useToast } from '../../lib/ToastContext';
import { useLanguage } from '../../lib/LanguageContext';

export default function AdminEventCreate() {
  const { t } = useLanguage();
  useSEO(t('adm_events_create'), undefined, { noindex: true });
  const navigate = useNavigate();
  const { push } = useToast();

  async function handleSubmit(data) {
    try {
      const { event } = await eventsApi.create(data);
      push(data.status === 'published' ? t('adm_create_toast_published') : t('adm_create_toast_draft'), 'success');
      navigate(`/admin/events/${event.id}`);
    } catch (err) {
      push(err.message, 'error');
    }
  }

  return (
    <AdminShell title={t('adm_events_create')} subtitle={t('adm_create_subtitle')}>
      <EventForm onSubmit={handleSubmit} submitLabel={t('adm_events_create')} />
    </AdminShell>
  );
}
