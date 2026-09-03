import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/layout/AdminShell';
import { useSEO } from '../../lib/useSEO';
import EventForm from '../../components/admin/EventForm';
import { eventsApi } from '../../lib/api';
import { useToast } from '../../lib/ToastContext';

export default function AdminEventCreate() {
  useSEO('Create Event', undefined, { noindex: true });
  const navigate = useNavigate();
  const { push } = useToast();

  async function handleSubmit(data) {
    try {
      const { event } = await eventsApi.create(data);
      push(data.status === 'published' ? 'Event published — copy its link from this page to share it.' : 'Draft saved.', 'success');
      navigate(`/admin/events/${event.id}`);
    } catch (err) {
      push(err.message, 'error');
    }
  }

  return (
    <AdminShell title="Create event" subtitle="Fields marked with an asterisk are required.">
      <EventForm onSubmit={handleSubmit} submitLabel="Create event" />
    </AdminShell>
  );
}
