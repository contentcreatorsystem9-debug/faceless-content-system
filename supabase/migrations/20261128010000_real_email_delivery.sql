-- Real Resend delivery: keep mocked rows for local/test mode, and record the
-- lifecycle of real operational emails without exposing provider details.
alter table public.email_outbox drop constraint if exists email_outbox_status_check;
alter table public.email_outbox add constraint email_outbox_status_check
  check (status in ('mocked', 'queued', 'sent', 'failed'));
